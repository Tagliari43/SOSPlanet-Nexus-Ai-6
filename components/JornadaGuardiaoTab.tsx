import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Star, Flame, Target, Leaf, Sparkles, Activity } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { GuardianProfileRecord, GuardianQuestRecord, GuardianQuestProgressRecord, GuardianBadgeRecord } from '../services/supabaseService';

const RANKS = [
    { name: 'Semente', minXp: 0, color: 'text-zinc-400' },
    { name: 'Broto', minXp: 100, color: 'text-emerald-300' },
    { name: 'Semeador', minXp: 500, color: 'text-emerald-500' },
    { name: 'Guardião', minXp: 1500, color: 'text-cyan-400' },
    { name: 'Ancestral', minXp: 5000, color: 'text-purple-400' },
    { name: 'Guardião Primordial', minXp: 10000, color: 'text-yellow-400' }
];

const JornadaGuardiaoTab: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<GuardianProfileRecord[]>([]);
    const [quests, setQuests] = useState<GuardianQuestRecord[]>([]);
    const [progress, setProgress] = useState<Record<number, GuardianQuestProgressRecord>>({});
    const [badges, setBadges] = useState<GuardianBadgeRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [currentUser, setCurrentUser] = useState<GuardianProfileRecord | null>(null);

    const getRankInfo = (xp: number) => {
        let currentRank = RANKS[0];
        let nextRank = RANKS[1];
        
        for (let i = 0; i < RANKS.length; i++) {
            if (xp >= RANKS[i].minXp) {
                currentRank = RANKS[i];
                nextRank = RANKS[i + 1] || RANKS[i];
            }
        }
        
        return { currentRank, nextRank };
    };

    const fetchData = async (wallet: string) => {
        setIsLoading(true);
        try {
            // Seed default quests if empty
            const { data: existingQuests } = await supabase.from('guardian_quests').select('id');
            if (!existingQuests || existingQuests.length === 0) {
                await supabase.from('guardian_quests').insert([
                    { title: 'Semeador de Primeira Viagem', description: 'Realize seu primeiro aporte na tesouraria de impacto.', xp_reward: 100, requirement_type: 'FIRST_DONATION' },
                    { title: 'Voz do Coletivo', description: 'Participe de 3 votações na DAO do SOSPlanet.', xp_reward: 150, requirement_type: 'DAO_VOTER' },
                    { title: 'Herói do Fogo', description: 'Responda a um chamado crítico no Farol de Emergência.', xp_reward: 500, requirement_type: 'EMERGENCY_RESPONSE' },
                    { title: 'Guardião da Matriz', description: 'Realize uma vistoria em área de preservação ativa.', xp_reward: 300, requirement_type: 'ZONE_INSPECTION' }
                ]);
            }

            // Create user profile if not exists
            let profileRow: GuardianProfileRecord | null = null;
            if (wallet) {
                const { data: pData } = await supabase.from('guardian_profiles').select('*').eq('wallet_address', wallet).single();
                if (!pData) {
                    const { data: newProfile } = await supabase.from('guardian_profiles').insert([{
                        wallet_address: wallet,
                        codename: `Guardião-${wallet.slice(0,4)}`,
                        rank: 'Semente',
                        total_xp: 0
                    }]).select().single();
                    profileRow = newProfile;
                } else {
                    profileRow = pData;
                }
            }
            setCurrentUser(profileRow);

            const [leadRes, questsRes, progRes, badgeRes] = await Promise.all([
                supabase.from('guardian_profiles').select('*').order('total_xp', { ascending: false }).limit(10),
                supabase.from('guardian_quests').select('*').order('xp_reward', { ascending: true }),
                wallet ? supabase.from('guardian_quest_progress').select('*').eq('wallet_address', wallet) : Promise.resolve({ data: [] }),
                wallet ? supabase.from('guardian_badges').select('*').eq('wallet_address', wallet).order('earned_at', { ascending: false }) : Promise.resolve({ data: [] })
            ]);

            if (leadRes.data) setLeaderboard(leadRes.data);
            if (questsRes.data) setQuests(questsRes.data);
            if (badgeRes.data) setBadges(badgeRes.data);
            
            if (progRes.data) {
                const pMap: Record<number, GuardianQuestProgressRecord> = {};
                progRes.data.forEach((p: GuardianQuestProgressRecord) => pMap[p.quest_id] = p);
                setProgress(pMap);
            }
        } catch (e) {
            console.error('Erro ao buscar Jornada:', e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let w = localStorage.getItem('wallet_address');
        if (!w) {
            w = `0x${Math.random().toString(16).slice(2, 10)}...`;
            localStorage.setItem('wallet_address', w);
        }
        setWalletAddress(w);
        fetchData(w);

        const channel = supabase.channel('jornada-guardiao')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'guardian_profiles' }, () => fetchData(w!))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'guardian_quest_progress' }, () => fetchData(w!))
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleClaimXP = async (quest: GuardianQuestRecord) => {
        if (!walletAddress || !currentUser) return;
        
        try {
            const { data: existingProgress } = await supabase
                .from('guardian_quest_progress')
                .select('*')
                .eq('wallet_address', walletAddress)
                .eq('quest_id', quest.id)
                .single();

            if (!existingProgress) {
                // Complete quest
                await supabase.from('guardian_quest_progress').insert([{
                    wallet_address: walletAddress,
                    quest_id: quest.id,
                    status: 'COMPLETED',
                    completed_at: new Date().toISOString()
                }]);

                // Update XP
                const newXp = (currentUser.total_xp || 0) + quest.xp_reward;
                const newRank = getRankInfo(newXp).currentRank.name;

                await supabase.from('guardian_profiles')
                    .update({ total_xp: newXp, rank: newRank })
                    .eq('wallet_address', walletAddress);

                // Check for badge mock logic
                if (quest.requirement_type === 'EMERGENCY_RESPONSE') {
                    await supabase.from('guardian_badges').insert([{
                        wallet_address: walletAddress,
                        badge_name: 'Herói do Fogo',
                        icon_name: 'Flame'
                    }]);
                }
            }
        } catch (e) {
            console.error("Erro ao clamar XP:", e instanceof Error ? e.message : String(e));
        }
    };

    const getIconComponent = (name: string) => {
        switch(name) {
            case 'Flame': return <Flame className="w-5 h-5 text-orange-500" />;
            case 'Leaf': return <Leaf className="w-5 h-5 text-emerald-500" />;
            case 'Target': return <Target className="w-5 h-5 text-red-500" />;
            case 'Trophy': return <Trophy className="w-5 h-5 text-yellow-500" />;
            default: return <Star className="w-5 h-5 text-cyan-400" />;
        }
    };

    if (isLoading && quests.length === 0) {
        return (
            <div className="flex items-center justify-center py-20 text-emerald-500 font-mono text-sm animate-pulse">
                <Activity className="w-6 h-6 mr-3" /> Sincronizando Matriz de Progressão...
            </div>
        );
    }

    const { currentRank, nextRank } = currentUser ? getRankInfo(currentUser.total_xp || 0) : getRankInfo(0);
    const xpProgressPercent = nextRank.minXp > currentRank.minXp 
        ? Math.min(100, Math.max(0, (((currentUser?.total_xp || 0) - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100))
        : 100;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col max-w-6xl mx-auto w-full gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold uppercase tracking-widest text-yellow-500 font-mono flex items-center gap-3 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                        <Trophy className="w-10 h-10" /> A Jornada do Guardião
                    </h2>
                    <p className="text-yellow-100/70 font-mono text-sm max-w-2xl mt-2">
                        Complete missões ecológicas, acumule ECO-XP e eleve sua patente na defesa do planeta. Impacto real é recompensado com glória eterna no Salão dos Ancestrais.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Esquerda: Perfil e Bounties */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* Resumo do Jogador */}
                    {currentUser && (
                        <div className="bg-[#0A0D0B] border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(234,179,8,0.05)]">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Sparkles className="w-32 h-32" />
                            </div>
                            
                            <div className="flex justify-between items-end mb-4 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold font-mono tracking-tight text-white mb-1">
                                        {currentUser.codename} <span className="text-zinc-500 text-sm">({currentUser.wallet_address.slice(0,6)}...)</span>
                                    </h3>
                                    <p className={`text-sm font-bold uppercase tracking-widest ${currentRank.color} border border-current px-2 py-0.5 rounded inline-block`}>
                                        <Medal className="w-3 h-3 inline mr-1" /> {currentRank.name}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-yellow-500 font-black text-4xl font-mono leading-none">{currentUser.total_xp}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">ECO-XP Total</p>
                                </div>
                            </div>

                            <div className="space-y-1 relative z-10">
                                <div className="flex justify-between text-xs font-mono text-zinc-400">
                                    <span>Progresso para <strong>{nextRank.name}</strong></span>
                                    <span>{currentUser.total_xp} / {nextRank.minXp} XP</span>
                                </div>
                                <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-yellow-900/50">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${xpProgressPercent}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 relative"
                                    >
                                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }}></div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Missões / Quests */}
                    <div className="bg-[#050505] border border-cyan-900/30 rounded-2xl p-6">
                        <h3 className="text-cyan-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-cyan-900/30 pb-3 mb-4">
                            <Target className="w-4 h-4" /> Bounties Verdes (Missões)
                        </h3>
                        
                        <div className="space-y-4">
                            {quests.map(quest => {
                                const isCompleted = progress[quest.id as number]?.status === 'COMPLETED';
                                
                                return (
                                    <div key={quest.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all ${isCompleted ? 'bg-emerald-950/20 border-emerald-900/50 opacity-70' : 'bg-[#0A0D0B] border-cyan-900/50 hover:border-cyan-500/50'}`}>
                                        <div className="mb-4 sm:mb-0 max-w-md">
                                            <h4 className={`font-bold font-mono tracking-tight ${isCompleted ? 'text-emerald-500 line-through decoration-emerald-800' : 'text-cyan-100'}`}>
                                                {quest.title}
                                            </h4>
                                            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                                                {quest.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 w-full sm:w-auto shrink-0">
                                            <div className={`font-mono font-black text-lg ${isCompleted ? 'text-emerald-600' : 'text-yellow-500'}`}>
                                                +{quest.xp_reward} XP
                                            </div>
                                            <button 
                                                onClick={() => handleClaimXP(quest)}
                                                disabled={isCompleted}
                                                className={`px-4 py-2 font-mono text-xs uppercase font-bold tracking-widest rounded transition-all shrink-0 w-full sm:w-auto
                                                    ${isCompleted 
                                                        ? 'bg-emerald-900/20 text-emerald-600 border border-emerald-900/50 cursor-not-allowed' 
                                                        : 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-800/50 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                                    }
                                                `}
                                            >
                                                {isCompleted ? 'CLAIMED' : 'CLAIM XP'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Insígnias Soulbound */}
                    <div className="bg-[#050505] border border-purple-900/30 rounded-2xl p-6">
                        <h3 className="text-purple-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-purple-900/30 pb-3 mb-4">
                            <Star className="w-4 h-4" /> Soulbound Tokens (Insígnias)
                        </h3>
                        
                        <div className="flex flex-wrap gap-4">
                            {badges.length > 0 ? badges.map(badge => (
                                <div key={badge.id} className="flex flex-col items-center justify-center p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl w-32 text-center group hover:bg-purple-900/30 transition-all cursor-crosshair">
                                    <div className="w-12 h-12 bg-black rounded-full border border-purple-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)] mb-3 group-hover:scale-110 transition-transform">
                                        {getIconComponent(badge.icon_name)}
                                    </div>
                                    <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest font-mono">{badge.badge_name}</span>
                                </div>
                            )) : (
                                <p className="text-zinc-600 text-xs font-mono italic">
                                    Nenhuma insígnia conquistada ainda. Complete missões épicas especiais para forjar a sua.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Direita: Salão dos Ancestrais (Leaderboard) */}
                <div className="bg-[#0A0D0B] border border-cyan-900/30 p-6 rounded-2xl flex flex-col">
                    <h3 className="text-cyan-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-cyan-900/30 pb-3 mb-4">
                        <Crown className="w-5 h-5 text-yellow-500" /> Salão dos Ancestrais
                    </h3>

                    <div className="flex-1 space-y-3">
                        {leaderboard.map((leader, index) => {
                            const lRankInfo = getRankInfo(leader.total_xp || 0).currentRank;
                            const isMe = leader.wallet_address === walletAddress;

                            return (
                                <div key={leader.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isMe ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-black/40 border-cyan-900/20'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black font-mono shrink-0
                                        ${index === 0 ? 'bg-yellow-500 text-black' : 
                                          index === 1 ? 'bg-zinc-300 text-black' : 
                                          index === 2 ? 'bg-orange-600 text-black' : 
                                          'bg-cyan-900 text-cyan-400'}`}>
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-mono text-sm font-bold truncate ${isMe ? 'text-cyan-300' : 'text-zinc-300'}`}>
                                            {leader.codename}
                                            {isMe && <span className="text-[10px] ml-2 text-cyan-500 uppercase">(Você)</span>}
                                        </p>
                                        <p className={`text-[10px] uppercase font-mono tracking-widest ${lRankInfo.color}`}>
                                            {lRankInfo.name}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-yellow-500 font-black font-mono">{leader.total_xp}</p>
                                        <p className="text-[8px] text-zinc-500 uppercase leading-none">XP</p>
                                    </div>
                                </div>
                            );
                        })}
                        {leaderboard.length === 0 && (
                            <p className="text-zinc-600 font-mono text-xs text-center py-10">Os salões estão vazios.</p>
                        )}
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

// Crown icon custom
const Crown = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
);

export default JornadaGuardiaoTab;

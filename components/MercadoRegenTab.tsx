import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Coins, TreePine, Leaf, Sparkles, Activity, Tag, Diamond, ShoppingCart } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { RegenMarketItemRecord, RegenInventoryRecord, GuardianProfileRecord } from '../services/supabaseService';

const MercadoRegenTab: React.FC = () => {
    const [items, setItems] = useState<RegenMarketItemRecord[]>([]);
    const [inventory, setInventory] = useState<RegenInventoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [currentUser, setCurrentUser] = useState<GuardianProfileRecord | null>(null);
    const [isBuying, setIsBuying] = useState<number | null>(null);

    const fetchData = async (wallet: string) => {
        setIsLoading(true);
        try {
            // Seed default items if empty
            const { data: existingItems } = await supabase.from('regen_market_items').select('id');
            if (!existingItems || existingItems.length === 0) {
                await supabase.from('regen_market_items').insert([
                    { name: 'Semente de Ipê', description: 'Plante uma árvore simbolizando 1 tonelada de CO2 capturada no mundo real.', price_sos: 50, stock: -1, item_type: 'IMPACT_ACTION', image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&q=80' },
                    { name: 'Certificado Protetor', description: 'NFT Oficial comprovando que você preservou 100m² de Floresta Amazônica.', price_sos: 200, stock: 500, item_type: 'NFT', image_url: 'https://images.unsplash.com/photo-1516214104703-d2507f0694ba?w=300&q=80' },
                    { name: 'Adubo Micelial', description: 'Acelere o ganho de ECO-XP em 50% por 3 dias.', price_sos: 100, stock: 1000, item_type: 'POWERUP', image_url: 'https://images.unsplash.com/photo-1611250220675-9e6e033f2ac0?w=300&q=80' },
                    { name: 'Adoção Animal: Onça Pintada', description: 'Patrocine a preservação do habitat da Onça Pintada (SBT Especial).', price_sos: 1500, stock: 50, item_type: 'IMPACT_ACTION', image_url: 'https://images.unsplash.com/photo-1555626906-fbf10d3d0e47?w=300&q=80' }
                ]);
            }

            if (wallet) {
                const { data: pData } = await supabase.from('guardian_profiles').select('*').eq('wallet_address', wallet).single();
                setCurrentUser(pData || null);
            }

            const [itemsRes, invRes] = await Promise.all([
                supabase.from('regen_market_items').select('*').order('price_sos', { ascending: true }),
                wallet ? supabase.from('regen_inventory').select(`*, item_details:regen_market_items(*)`).eq('wallet_address', wallet) : Promise.resolve({ data: [] })
            ]);

            if (itemsRes.data) setItems(itemsRes.data);
            if (invRes.data) setInventory(invRes.data as RegenInventoryRecord[]);
            
        } catch (e) {
            console.error('Erro ao buscar Mercado Regen:', e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const w = localStorage.getItem('wallet_address') || `0x${Math.random().toString(16).slice(2, 10)}...`;
        localStorage.setItem('wallet_address', w);
        setWalletAddress(w);
        fetchData(w);

        const channel = supabase.channel('mercado-regen')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'regen_market_items' }, () => fetchData(w))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'regen_inventory' }, () => fetchData(w))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'guardian_profiles' }, () => fetchData(w))
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleBuyItem = async (item: RegenMarketItemRecord) => {
        if (!walletAddress || !currentUser) return;
        
        // Em um sistema real, o saldo estaria numa tabela de wallet crypto ou treasury balance.
        // Aqui usamos o total_xp ou uma tabela de tokens. Como não temos SOS balance, vamos simular que o XP funciona como moeda de troca para o MVP, ou criar uma fake balance.
        // Simulando que o usuário tem poder de compra basado na wallet:
        const userBalance = (currentUser.total_xp || 0) * 2; // Simulacro temporário: SOS = XP * 2

        if (userBalance < item.price_sos) {
            alert('SOS Insuficiente! Complete missoões na Jornada para ganhar poder aquisitivo.');
            return;
        }

        setIsBuying(item.id as number);
        try {
            // Check Se já tem no inventário
            const { data: existing } = await supabase
                .from('regen_inventory')
                .select('*')
                .eq('wallet_address', walletAddress)
                .eq('item_id', item.id)
                .single();

            if (existing) {
                await supabase.from('regen_inventory')
                    .update({ quantity: existing.quantity + 1 })
                    .eq('id', existing.id);
            } else {
                await supabase.from('regen_inventory').insert([{
                    wallet_address: walletAddress,
                    item_id: item.id,
                    quantity: 1
                }]);
            }

            // Atualizar Estoque (se não for infinito)
            if (item.stock > 0) {
                await supabase.from('regen_market_items')
                    .update({ stock: item.stock - 1 })
                    .eq('id', item.id);
            }

            // Reduzir saldo do player (exemplo XP)
            await supabase.from('guardian_profiles')
                .update({ total_xp: Math.max(0, (currentUser.total_xp || 0) - Math.floor(item.price_sos / 2)) })
                .eq('wallet_address', walletAddress);

        } catch (e) {
            console.error("Erro na transação:", e instanceof Error ? e.message : String(e));
        } finally {
            setIsBuying(null);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'IMPACT_ACTION': return 'text-emerald-400 bg-emerald-950/30 border-emerald-500/50';
            case 'NFT': return 'text-purple-400 bg-purple-950/30 border-purple-500/50';
            case 'POWERUP': return 'text-orange-400 bg-orange-950/30 border-orange-500/50';
            default: return 'text-zinc-400 bg-zinc-900 border-zinc-700';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'IMPACT_ACTION': return <TreePine className="w-3 h-3" />;
            case 'NFT': return <Diamond className="w-3 h-3" />;
            case 'POWERUP': return <Sparkles className="w-3 h-3" />;
            default: return <Tag className="w-3 h-3" />;
        }
    };

    if (isLoading && items.length === 0) {
        return (
            <div className="flex items-center justify-center py-20 text-emerald-500 font-mono text-sm animate-pulse">
                <Activity className="w-6 h-6 mr-3" /> Listando bioativos digitais na rede...
            </div>
        );
    }

    const simulatedBalance = (currentUser?.total_xp || 0) * 2;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col max-w-6xl mx-auto w-full gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold uppercase tracking-widest text-[#a855f7] font-mono flex items-center gap-3 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        <ShoppingBag className="w-10 h-10" /> O Mercado Regen
                    </h2>
                    <p className="text-purple-100/70 font-mono text-sm max-w-2xl mt-2">
                        Bazar de Bioativos e Impacto On-Chain. Troque valor por regeneração sistêmica no mundo físico.
                    </p>
                </div>
                
                <div className="flex bg-[#0A0D0B] border border-purple-900/50 rounded-xl px-6 py-4 items-center gap-4 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                    <Coins className="text-yellow-500 w-10 h-10 animate-[pulse_3s_infinite]" />
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 font-mono">Saldo Estimado</p>
                        <p className="text-2xl font-black text-yellow-500 font-mono tracking-tighter">
                            {simulatedBalance.toLocaleString('pt-BR')} <span className="text-sm font-normal text-yellow-600">SOS</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Vitrine Principal */}
                <div className="lg:col-span-2">
                    <h3 className="text-purple-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-purple-900/30 pb-3 mb-6">
                        <ShoppingCart className="w-4 h-4" /> Vitrine de Aportes
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {items.map(item => (
                            <div key={item.id} className="bg-[#050505] border border-zinc-800 rounded-2xl overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col relative shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.1)]">
                                {/* Image Area */}
                                <div className="h-40 bg-zinc-900 relative overflow-hidden">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Leaf className="w-12 h-12 text-zinc-700" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold font-mono tracking-widest uppercase border rounded backdrop-blur-md ${getTypeColor(item.item_type)}`}>
                                            {getTypeIcon(item.item_type)}
                                            {item.item_type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#050505] to-transparent"></div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col z-10 -mt-2">
                                    <h4 className="text-lg font-bold font-mono text-white mb-2 tracking-tight">{item.name}</h4>
                                    <p className="text-sm text-zinc-400 mb-6 leading-relaxed flex-1">
                                        {item.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-mono text-zinc-500 mb-0.5">Preço</span>
                                            <span className="text-yellow-500 font-black font-mono flex items-center gap-1.5">
                                                <Coins className="w-4 h-4" /> {item.price_sos} SOS
                                            </span>
                                        </div>
                                        <div className="flex flex-col shrink-0 items-end">
                                            <button 
                                                onClick={() => handleBuyItem(item)}
                                                disabled={isBuying === item.id || item.stock === 0 || simulatedBalance < item.price_sos}
                                                className={`px-6 py-2 font-mono text-xs uppercase font-bold tracking-widest rounded-lg transition-all
                                                    ${item.stock === 0 
                                                        ? 'bg-red-950/30 text-red-500 border border-red-900/50 cursor-not-allowed' 
                                                        : simulatedBalance < item.price_sos
                                                            ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                                                            : 'bg-purple-900/40 text-purple-300 border border-purple-500/50 hover:bg-purple-800/60 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                                    }
                                                `}
                                            >
                                                {isBuying === item.id ? 'Aportando...' : item.stock === 0 ? 'Esgotado' : 'Transacionar'}
                                            </button>
                                            {item.stock > 0 && <span className="text-[9px] text-zinc-500 mt-1 font-mono uppercase">Restam: {item.stock}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inventário e Carteira Privada */}
                <div className="bg-[#0A0D0B] border border-cyan-900/30 p-6 rounded-2xl flex flex-col">
                    <h3 className="text-cyan-400 font-bold uppercase font-mono tracking-widest text-sm flex items-center gap-2 border-b border-cyan-900/30 pb-3 mb-4">
                        <Sparkles className="w-5 h-5 text-cyan-500" /> Meu Inventário Regen
                    </h3>

                    <div className="flex-1 space-y-3">
                        {inventory.length > 0 ? inventory.map(inv => {
                            const details = inv.item_details;
                            if (!details) return null;
                            
                            return (
                                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl border bg-black/40 border-cyan-900/20 hover:border-cyan-500/30 transition-colors">
                                    <div className="w-12 h-12 rounded-lg bg-zinc-900 overflow-hidden shrink-0 border border-zinc-800">
                                        {details.image_url ? (
                                            <img src={details.image_url} alt={details.name} className="w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                {getTypeIcon(details.item_type)}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <p className="font-mono text-sm font-bold text-cyan-200 truncate">{details.name}</p>
                                        <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 flex items-center gap-1 mt-0.5">
                                            {getTypeIcon(details.item_type)} {details.item_type.replace('_', ' ')}
                                        </p>
                                    </div>
                                    
                                    <div className="text-right shrink-0 bg-cyan-950/50 px-3 py-1.5 rounded-lg border border-cyan-900/50">
                                        <p className="text-cyan-400 font-black font-mono">x{inv.quantity}</p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <ShoppingBag className="w-12 h-12 text-zinc-600 mb-3" />
                                <p className="text-zinc-500 font-mono text-xs text-center">Seu inventário está vazio.<br/>Adquira ativos na vitrine.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default MercadoRegenTab;

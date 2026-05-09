import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe2, MapPin, TreePine, Navigation } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { ImpactCoordinateRecord } from '../services/supabaseService';

const ImpactMap: React.FC = () => {
    const [coordinates, setCoordinates] = useState<ImpactCoordinateRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredNode, setHoveredNode] = useState<ImpactCoordinateRecord | null>(null);

    const fetchCoordinates = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('impact_coordinates')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            if (data) setCoordinates(data);
        } catch (e: any) {
            console.error('Erro ao buscar coordenadas de impacto:', e.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoordinates();

        // Inscreve no Supabase Realtime
        const channel = supabase.channel('schema-db-changes-map')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'impact_coordinates'
                },
                (payload) => {
                    console.log('Realtime Map Event:', payload);
                    fetchCoordinates();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Função auxiliar para mapear Lat/Lng (-90/90, -180/180) para porcentagens de CSS (0-100%) num mapa 2D simplificado (equiretangular)
    const getMapPosition = (lat: number, lng: number) => {
        const x = ((lng + 180) / 360) * 100;
        const y = ((90 - lat) / 180) * 100;
        return { left: `${x}%`, top: `${y}%` };
    };

    const totalTrees = coordinates.reduce((acc, curr) => acc + (curr.trees_planted || 0), 0);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col max-w-6xl mx-auto w-full gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-bold uppercase tracking-widest text-[#06b6d4] mb-2 font-mono flex items-center gap-3 drop-shadow-[0_0_10px_#22d3ee]">
                        <Globe2 className="w-8 h-8" /> Atlas Global de Impacto
                    </h2>
                    <p className="text-cyan-100/70 font-mono text-sm max-w-2xl">
                        A Malha de rastreabilidade física. Cada nó neste mapa representa um impacto ecológico verificado e transacionado via protocolo SOSPlanet.
                    </p>
                </div>
                <div className="flex bg-[#0A0D0B] border border-cyan-900/50 rounded-xl px-6 py-4 items-center gap-4">
                    <TreePine className="text-emerald-400 w-10 h-10" />
                    <div>
                        <p className="text-xs uppercase tracking-widest font-bold text-zinc-500 font-mono">Balanço Global</p>
                        <p className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">
                            {totalTrees.toLocaleString('pt-BR')} <span className="text-sm font-normal text-emerald-500">árvores</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative w-full h-[600px] bg-[#020617] rounded-3xl border border-cyan-900/30 overflow-hidden group shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                
                {/* SVG Mapa Mundi Simples (Background) */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 1000 500" preserveAspectRatio="none">
                    <path d="M 0 0 L 1000 0 L 1000 500 L 0 500 Z" fill="#020815" />
                    {/* Simplified continents shapes */}
                    <path d="M 200 100 Q 250 50 300 100 T 350 200 T 250 300 T 200 100" fill="#06b6d4" opacity="0.3" />
                    <path d="M 450 80 Q 550 20 600 100 T 550 250 T 450 80" fill="#06b6d4" opacity="0.3" />
                    <path d="M 650 150 Q 800 50 900 150 T 800 400 T 650 150" fill="#06b6d4" opacity="0.3" />
                    <path d="M 300 350 Q 320 400 350 450 T 250 450 T 300 350" fill="#06b6d4" opacity="0.3" />
                </svg>

                {/* Grade / Malha de Fundo */}
                <div className="absolute inset-0 pointer-events-none" 
                     style={{
                         backgroundImage: `linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)`,
                         backgroundSize: '40px 40px'
                     }}>
                </div>

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                            <Navigation className="w-8 h-8 text-cyan-500 animate-spin" />
                            <span className="text-cyan-400 font-mono text-sm uppercase tracking-widest animate-pulse">
                                Sincronizando satélites...
                            </span>
                        </div>
                    </div>
                )}

                {/* O Radar Passando (Scan line animado) */}
                <motion.div 
                    initial={{ top: '-10%' }}
                    animate={{ top: '110%' }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_#22d3ee] pointer-events-none z-0"
                />

                {/* Nós (Markers) */}
                {coordinates.map(coord => {
                    const pos = getMapPosition(coord.lat, coord.lng);
                    return (
                        <motion.div
                            key={coord.id}
                            className="absolute z-10 -ml-3 -mt-3 w-6 h-6 flex items-center justify-center cursor-pointer group"
                            style={pos}
                            onMouseEnter={() => setHoveredNode(coord)}
                            onMouseLeave={() => setHoveredNode(null)}
                            whileHover={{ scale: 1.5 }}
                        >
                            <div className="absolute inset-0 bg-cyan-500 rounded-full blur-[8px] opacity-60 group-hover:opacity-100 group-hover:bg-emerald-500 transition-colors" />
                            <div className="relative w-3 h-3 bg-cyan-200 border border-cyan-100 rounded-full group-hover:bg-emerald-300 group-hover:border-white transition-colors shadow-[0_0_10px_#fff]" />
                            <motion.div 
                                animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                className="absolute w-8 h-8 border border-cyan-400/50 rounded-full pointer-events-none"
                            />
                        </motion.div>
                    );
                })}

                {/* Tooltip Detalhado do Nó (Hover) */}
                {hoveredNode && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute bottom-6 left-6 z-50 bg-[#0A0D0B] border border-cyan-900/60 rounded-xl p-4 shadow-2xl backdrop-blur-xl w-80 pointer-events-none"
                    >
                        <h4 className="text-cyan-300 font-bold uppercase tracking-widest text-sm mb-2 drop-shadow-md">
                            {hoveredNode.name}
                        </h4>
                        
                        <div className="flex gap-4 items-center">
                            {hoveredNode.image_url ? (
                                <img src={hoveredNode.image_url} alt={hoveredNode.name} className="w-16 h-16 object-cover rounded-lg border border-cyan-900/50 grayscale hover:grayscale-0 transition-all" />
                            ) : (
                                <div className="w-16 h-16 bg-cyan-950 rounded-lg flex items-center justify-center border border-cyan-900/50">
                                    <MapPin className="text-cyan-800" />
                                </div>
                            )}
                            <div className="flex-1 space-y-1">
                                <p className="text-[10px] text-cyan-600 font-mono uppercase tracking-widest border-b border-cyan-900/30 pb-1">
                                    Lat: {hoveredNode.lat.toFixed(4)}<br />
                                    Lng: {hoveredNode.lng.toFixed(4)}
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                    <TreePine className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-400 font-bold font-mono text-xs">
                                        {hoveredNode.trees_planted || 0} árvores
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Listagem em Texto das Coordenadas Ativas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {coordinates.map(coord => (
                    <div key={coord.id} className="bg-[#0A0D0B] border border-cyan-900/20 p-4 rounded-xl flex items-center gap-3 hover:border-cyan-500/30 transition-colors cursor-pointer" onMouseEnter={() => setHoveredNode(coord)} onMouseLeave={() => setHoveredNode(null)}>
                        <div className="w-10 h-10 bg-cyan-950 rounded-full flex items-center justify-center border border-cyan-800/30 shrink-0">
                            <MapPin className="text-cyan-500 w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-cyan-200 font-bold text-sm truncate">{coord.name}</p>
                            <p className="text-zinc-500 font-mono text-[10px] uppercase truncate">
                                [{coord.lat.toFixed(2)}, {coord.lng.toFixed(2)}] • {coord.trees_planted} Árv.
                            </p>
                        </div>
                    </div>
                ))}
                {coordinates.length === 0 && !isLoading && (
                    <div className="col-span-full py-8 text-center text-cyan-600/50 font-mono text-sm">
                        O Atlas aguarda seus primeiros registros de impacto geolocalizado.
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ImpactMap;

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe2, TreePine, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { ImpactCoordinateRecord, EmergencyAlertRecord, PreservationZoneRecord } from '../services/supabaseService';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default marker icons in Leaflet not loading in some build setups
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons using Lucide and divIcon
const createDivIcon = (icon: React.ReactNode, bgColor: string, borderColor: string, pulse: boolean = false) => {
    const htmlString = renderToStaticMarkup(
        <div style={{
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: '2px',
            borderStyle: 'solid',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
        }}>
            {icon}
        </div>
    );

    return L.divIcon({
        html: pulse ? `<div class="animate-pulse">${htmlString}</div>` : htmlString,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

const treeIcon = createDivIcon(<TreePine size={16} />, '#059669', '#34d399');
const alertIcon = createDivIcon(<AlertTriangle size={16} />, '#dc2626', '#f87171', true);

const ImpactMap: React.FC = () => {
    const [coordinates, setCoordinates] = useState<ImpactCoordinateRecord[]>([]);
    const [alerts, setAlerts] = useState<EmergencyAlertRecord[]>([]);
    const [zones, setZones] = useState<PreservationZoneRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [coordRes, alertRes, zoneRes] = await Promise.all([
                supabase.from('impact_coordinates').select('*').order('created_at', { ascending: false }),
                supabase.from('emergency_alerts').select('*').eq('status', 'ACTIVE').order('created_at', { ascending: false }),
                supabase.from('preservation_zones').select('*').order('created_at', { ascending: false })
            ]);

            if (coordRes.data) setCoordinates(coordRes.data);
            if (alertRes.data) setAlerts(alertRes.data);
            if (zoneRes.data) setZones(zoneRes.data);

        } catch (e) {
            console.error('Erro ao buscar dados do mapa:', e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Subscribe to relevant tables
        const channel = supabase.channel('observatorio-gaia')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'impact_coordinates' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_alerts' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'preservation_zones' }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const totalTrees = coordinates.reduce((acc, curr) => acc + (curr.trees_planted || 0), 0);
    const totalAreaHectares = zones.reduce((acc, curr) => acc + (curr.area_hectares || 0), 0);
    const totalAlerts = alerts.length;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col max-w-6xl mx-auto w-full gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h2 className="text-3xl font-bold uppercase tracking-widest text-[#06b6d4] mb-2 font-mono flex items-center gap-3 drop-shadow-[0_0_10px_#22d3ee]">
                        <Globe2 className="w-10 h-10" /> O Olho de Gaia
                    </h2>
                    <p className="text-cyan-100/70 font-mono text-sm max-w-2xl">
                        Observatório de Impacto Geospacial. Visualize Zonas de Preservação, Aportes da Tesouraria (Sementes) e Alertas de Emergência ativos.
                    </p>
                </div>
                
                <div className="flex bg-[#0A0D0B] border border-cyan-900/50 rounded-xl divide-x divide-cyan-900/50 overflow-hidden">
                    <div className="px-5 py-3 flex items-center gap-3">
                        <ShieldCheck className="text-blue-400 w-8 h-8" />
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Zonas Protegidas</p>
                            <p className="text-xl font-bold text-blue-400 font-mono">{totalAreaHectares} ha</p>
                        </div>
                    </div>
                    <div className="px-5 py-3 flex items-center gap-3">
                        <TreePine className="text-emerald-400 w-8 h-8" />
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Malha Viva</p>
                            <p className="text-xl font-bold text-emerald-400 font-mono">{totalTrees}</p>
                        </div>
                    </div>
                    <div className={`px-5 py-3 flex items-center gap-3 ${totalAlerts > 0 ? 'bg-red-950/20' : ''}`}>
                        <AlertTriangle className={`${totalAlerts > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-600'} w-8 h-8`} />
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Emergências</p>
                            <p className={`text-xl font-bold font-mono ${totalAlerts > 0 ? 'text-red-500' : 'text-zinc-600'}`}>{totalAlerts}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative w-full h-[600px] bg-[#020617] rounded-3xl border border-cyan-500/30 overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)] z-0">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                            <Activity className="w-8 h-8 text-cyan-500 animate-spin" />
                            <span className="text-cyan-400 font-mono text-sm uppercase tracking-widest animate-pulse">
                                Sincronizando Malha Orbital...
                            </span>
                        </div>
                    </div>
                )}

                {!isLoading && (
                    <MapContainer 
                        center={[-15.7801, -47.9292]} // Brazil roughly
                        zoom={4} 
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}
                    >
                        {/* Dark, tech-looking map tiles. Using CartoDB Dark Matter */}
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />

                        {/* 1. Zonas de Preservação (Polygons) */}
                        {zones.map(zone => {
                            const positions = zone.geojson_polygon?.coordinates?.[0]?.map((coord: number[]) => [coord[1], coord[0]]) as [number, number][];
                            if (!positions) return null;
                            const color = zone.status === 'THREATENED' ? '#ef4444' : '#3b82f6';
                            return (
                                <Polygon 
                                    key={`zone-${zone.id}`}
                                    pathOptions={{ color: color, fillColor: color, fillOpacity: 0.2, weight: 2 }}
                                    positions={positions}
                                >
                                    <Tooltip sticky className="bg-black text-cyan-400 font-mono text-xs border border-cyan-900 border-none">
                                        <div className="font-bold">{zone.name}</div>
                                        <div>{zone.area_hectares} Hectares - {zone.status}</div>
                                    </Tooltip>
                                </Polygon>
                            );
                        })}

                        {/* 2. Impact Coordinates (Sementes) */}
                        {coordinates.map(coord => (
                            <Marker 
                                key={`seed-${coord.id}`}
                                position={[coord.lat, coord.lng]}
                                icon={treeIcon}
                            >
                                <Popup className="font-mono">
                                    <div className="flex flex-col gap-2 p-1">
                                        <h4 className="font-bold text-emerald-700 uppercase tracking-widest text-xs border-b border-emerald-200 pb-1">{coord.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <TreePine className="w-4 h-4 text-emerald-600" />
                                            <span className="text-sm font-bold text-emerald-800">{coord.trees_planted || 0} árvores plantadas</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 uppercase mt-1">Lat: {coord.lat.toFixed(4)} | Lng: {coord.lng.toFixed(4)}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* 3. Emergency Alerts (Farol) */}
                        {alerts.map(alert => (
                            <Marker 
                                key={`alert-${alert.id}`}
                                position={[alert.lat, alert.lng]}
                                icon={alertIcon}
                            >
                                <Popup className="font-mono">
                                    <div className="flex flex-col gap-2 p-1 max-w-[200px]">
                                        <h4 className="font-bold text-red-700 uppercase tracking-widest text-[11px] border-b border-red-200 pb-1">{alert.title}</h4>
                                        <p className="text-xs text-red-900 line-clamp-3">{alert.description}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-800 rounded">{alert.severity}</span>
                                            <span className="text-[10px] font-bold text-red-600">{alert.funds_raised}/{alert.funds_required} SOS</span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                    </MapContainer>
                )}
            </div>

            <p className="text-cyan-700/50 text-xs font-mono italic text-center w-full">
                Dados consolidados diretamente da tesouraria on-chain e oráculos da nossa rede.
            </p>

        </motion.div>
    );
};

export default ImpactMap;

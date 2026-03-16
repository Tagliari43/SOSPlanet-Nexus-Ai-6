
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SatelliteData } from '../services/earthEngineService';

// Correção para ícones padrão do Leaflet no React/ESM
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface GaiaEyeProps {
    onBack: () => void;
    satelliteData: SatelliteData | null;
    refreshSatellite: () => void;
    onSimulateCrisis?: () => void;
}

// Componente auxiliar para ajustar o mapa quando os dados mudam
const MapRecenter: React.FC<{ coords: [number, number] }> = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(coords);
    }, [coords, map]);
    return null;
};

const GaiaEye: React.FC<GaiaEyeProps> = ({ onBack, satelliteData, refreshSatellite, onSimulateCrisis }) => {
    const [activeLayer, setActiveLayer] = useState<'ndvi' | 'heat' | 'deforest'>('ndvi');
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(5);
    const [isSyncing, setIsSyncing] = useState(false);

    // Coordenadas centrais da Reserva SOSPlanet
    const coords: [number, number] = [-3.456, -62.789];
    
    // Bounds da área de observação (aproximadamente 2km x 2km)
    const areaBounds: L.LatLngBoundsExpression = [
        [-3.465, -62.798],
        [-3.447, -62.780]
    ];

    const handleSync = async () => {
        setIsSyncing(true);
        await refreshSatellite();
        setTimeout(() => setIsSyncing(false), 1000);
    };

    const handleSimulate = () => {
        if (onSimulateCrisis) {
            onSimulateCrisis();
            setActiveLayer('heat');
        }
    };

    const getStatusColor = (status?: string) => {
        switch(status) {
            case 'Saudável': return 'text-emerald-400';
            case 'Sob Observação': return 'text-yellow-400';
            case 'Alerta': return 'text-red-400';
            default: return 'text-zinc-500';
        }
    };

    const currentHistoryPoint = satelliteData?.historicalNdvi?.[selectedHistoryIndex];

    return (
        <div className="flex flex-col h-full animate-fade-in text-slate-200">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-emerald-800/30 pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-emerald-400 transition-colors">←</button>
                    <div>
                        <h3 className="text-xl font-bold text-emerald-300">Gaia-Eye: Vigilância Planetária 🛰️</h3>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Sincronia Orbital Sentinel-2 / Landsat-9</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                        onClick={handleSimulate}
                        className="px-4 py-2 bg-orange-950/40 border border-orange-500/50 text-orange-400 hover:bg-orange-900/40 rounded-lg text-[10px] font-black transition-all uppercase flex items-center gap-2"
                    >
                        <span>⚠️</span> SIMULAR CRISE
                    </button>
                    <button 
                        onClick={handleSync} 
                        disabled={isSyncing}
                        className={`px-4 py-2 border rounded-lg text-[10px] font-bold transition-all uppercase flex items-center gap-2
                            ${isSyncing ? 'bg-zinc-800 border-zinc-700 text-zinc-500' : 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400 hover:bg-emerald-800/40'}`}
                    >
                        {isSyncing ? (
                            <>
                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                SINCRONIZANDO...
                            </>
                        ) : 'SINCRONIZAR AGORA'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow overflow-hidden">
                
                <div className="lg:col-span-3 flex flex-col gap-4 h-full min-h-[500px]">
                    <div className="flex-grow bg-black rounded-2xl border border-emerald-900/40 relative overflow-hidden shadow-2xl z-0">
                        
                        <MapContainer 
                            center={coords} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%', background: '#09090b' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                            />
                            
                            {activeLayer === 'ndvi' && (
                                <Rectangle 
                                    bounds={areaBounds}
                                    pathOptions={{ 
                                        color: '#10b981', 
                                        fillColor: '#10b981', 
                                        fillOpacity: (currentHistoryPoint?.value || 0.8) * 0.5,
                                        weight: 1
                                    }}
                                />
                            )}

                            {activeLayer === 'heat' && (
                                <Rectangle 
                                    bounds={areaBounds}
                                    pathOptions={{ 
                                        color: '#ef4444', 
                                        fillColor: '#ef4444', 
                                        fillOpacity: (satelliteData?.status === 'Alerta') ? 0.6 : 0.1,
                                        weight: 2,
                                        dashArray: '5, 5'
                                    }}
                                />
                            )}

                            <Marker position={coords}>
                                <Popup>
                                    <div className="text-zinc-900 font-bold p-1">
                                        <p className="text-xs uppercase tracking-widest text-emerald-600">Reserva SOSPlanet</p>
                                        <p className="text-[10px] mt-1">Núcleo de Regeneração Amazonas-1</p>
                                    </div>
                                </Popup>
                            </Marker>
                            
                            <MapRecenter coords={coords} />
                        </MapContainer>

                        <div className="absolute top-4 left-4 z-[1000] bg-black/80 border border-emerald-500/30 p-3 rounded-lg backdrop-blur-md">
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Telemetria Orbital</p>
                            <p className="text-xs font-mono text-emerald-400">
                                {activeLayer.toUpperCase()} | DATA: {currentHistoryPoint?.date || 'HOJE'}
                            </p>
                        </div>

                        <div className="absolute bottom-4 left-4 z-[1000] flex gap-2">
                            <button 
                                onClick={() => setActiveLayer('ndvi')} 
                                className={`px-4 py-2 rounded-lg border text-[10px] font-black transition-all uppercase tracking-widest
                                    ${activeLayer === 'ndvi' ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_#10b98133]' : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-emerald-300'}`}
                            >
                                <span className="mr-2">🌿</span> NDVI (Biomassa)
                            </button>
                            <button 
                                onClick={() => setActiveLayer('heat')} 
                                className={`px-4 py-2 rounded-lg border text-[10px] font-black transition-all uppercase tracking-widest
                                    ${activeLayer === 'heat' ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_15px_#ea580c33]' : 'bg-black/60 border-zinc-700 text-zinc-400 hover:text-orange-300'}`}
                            >
                                <span className="mr-2">🔥</span> Térmica (Fogo)
                            </button>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
                            <div className={`relative w-48 h-48 border border-emerald-500/10 rounded-full ${isSyncing ? 'animate-spin' : ''}`}></div>
                            {isSyncing && <div className="absolute text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-[0.3em] bg-black/60 px-4 py-1 rounded-full backdrop-blur-sm">Capturando Sentinel...</div>}
                        </div>

                        {activeLayer === 'heat' && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_20px_#ea580c] animate-scan z-[1001]"></div>
                        )}
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl z-10">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Evolução de Biomassa (NDVI)</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Histórico: {currentHistoryPoint?.date}</span>
                        </div>
                        <div className="relative h-12 flex items-end gap-1 px-2">
                            {satelliteData?.historicalNdvi?.map((point, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setSelectedHistoryIndex(i)}
                                    className={`flex-1 group relative transition-all duration-500 rounded-t-sm
                                        ${selectedHistoryIndex === i ? 'bg-emerald-500' : 'bg-emerald-950/40 hover:bg-emerald-900'}`}
                                    style={{ height: `${point.value * 100}%` }}
                                >
                                    <div className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold ${selectedHistoryIndex === i ? 'text-emerald-400' : 'opacity-0 group-hover:opacity-100'}`}>
                                        {point.value.toFixed(2)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-xl p-4 shadow-lg">
                        <h4 className="text-xs font-bold text-emerald-500 uppercase mb-4 border-b border-emerald-500/10 pb-2">Status da Reserva</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-zinc-400 uppercase font-bold">Integridade</span>
                                <span className={`text-sm font-black transition-colors ${getStatusColor(satelliteData?.status)}`}>
                                    {satelliteData ? satelliteData.status.toUpperCase() : 'SINCRO...'}
                                </span>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_#10b981]" style={{ width: `${satelliteData?.ndvi ? satelliteData.ndvi * 100 : 0}%` }}></div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="bg-black/40 p-2 rounded border border-white/5">
                                    <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1">NDVI Atual</p>
                                    <p className="text-lg font-mono text-emerald-400 font-black tracking-tighter">{satelliteData?.ndvi || '0.00'}</p>
                                </div>
                                <div className="bg-black/40 p-2 rounded border border-white/5">
                                    <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1">Cobertura</p>
                                    <p className="text-lg font-mono text-white font-black tracking-tighter">{satelliteData?.canopyCover || '0'}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`bg-zinc-900/60 border rounded-xl p-4 shadow-lg transition-all duration-500 ${satelliteData?.status === 'Alerta' ? 'border-red-500/50 shadow-red-900/20' : 'border-zinc-800'}`}>
                        <h4 className="text-xs font-bold text-orange-400 uppercase mb-4 border-b border-orange-500/10 pb-2">Riscos Ambientais</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-zinc-400 uppercase font-bold">Focos de Calor</span>
                                <span className={`text-sm font-bold ${satelliteData?.status === 'Alerta' ? 'text-orange-500 animate-pulse' : 'text-zinc-500'}`}>
                                    {satelliteData?.status === 'Alerta' ? 'DETECTADOS' : 'NENHUM'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-zinc-400 uppercase font-bold">Alertas Desm.</span>
                                <span className={`text-sm font-bold ${satelliteData?.status === 'Alerta' ? 'text-red-500' : 'text-zinc-500'}`}>
                                    {satelliteData?.status === 'Alerta' ? 'ATIVOS' : 'ZERO'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                                <span className="text-[10px] text-zinc-400 uppercase font-bold">Carbono</span>
                                <span className="text-sm font-bold text-emerald-400">
                                    {satelliteData?.carbonSequestration || 0} t/ha
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex-grow">
                        <h4 className="text-xs font-bold text-emerald-300 uppercase mb-3">Veredito do Nexus</h4>
                        <div className="bg-black/40 p-3 rounded-lg border border-emerald-900/50">
                            <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                                {satelliteData?.status === 'Saudável' 
                                    ? "Biomassa em crescimento exponencial. O ecossistema está resiliente." 
                                    : satelliteData?.status === 'Sob Observação'
                                    ? "Variáveis térmicas alteradas. Monitorando proximidade."
                                    : "Protocolo de emergência planetária ativado via Árion."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 4s linear infinite;
                }
                .leaflet-container {
                    border-radius: 1rem;
                    z-index: 1;
                }
            `}</style>
        </div>
    );
};

export default GaiaEye;

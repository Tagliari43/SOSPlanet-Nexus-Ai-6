import React from 'react';

interface DataOrbProps {
  status: 'processing' | 'online' | 'error';
}

const DataOrb: React.FC<DataOrbProps> = ({ status }) => {
  const getOrbColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-500/50';
      case 'error':
        return 'bg-red-500/50';
      default:
        return 'bg-emerald-500/50';
    }
  };

  const getOrbShadowColor = () => {
    switch (status) {
      case 'processing':
        return 'shadow-yellow-500/50';
      case 'error':
        return 'shadow-red-500/50';
      default:
        return 'shadow-emerald-500/50';
    }
  };

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Anéis de pulso */}
      <div className={`absolute w-full h-full rounded-full ${getOrbColor()} animate-pulse-slow`}></div>
      <div className={`absolute w-5/6 h-5/6 rounded-full ${getOrbColor()} animate-pulse-medium`}></div>
      
      {/* Núcleo do Orbe */}
      <div className={`w-2/3 h-2/3 rounded-full bg-gradient-to-br from-slate-800 to-gray-900 shadow-xl ${getOrbShadowColor()} flex items-center justify-center`}>
        <div className="w-1/2 h-1/2 rounded-full bg-slate-700/50 backdrop-blur-sm flex items-center justify-center">
           <div className={`w-1/3 h-1/3 rounded-full ${getOrbColor()} animate-pulse`}></div>
        </div>
      </div>
    </div>
  );
};

export default DataOrb;

import React from 'react';

interface AnalysisDisplayProps {
  result: string;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  return (
    <div className="w-full h-full bg-black/50 border border-emerald-800 rounded-xl p-4 overflow-y-auto">
      <h3 className="text-xl text-emerald-300 font-bold mb-3">Relatório da 'Ponte dos Sentidos'</h3>
      <div className="whitespace-pre-wrap text-emerald-200 text-sm leading-relaxed">
        {result}
      </div>
    </div>
  );
};

export default AnalysisDisplay;
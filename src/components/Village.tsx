
import React from 'react';
import { Building } from '../types';

interface VillageProps {
  buildings: Building[];
  onUpgrade: (id: string) => void;
  onBattle: () => void;
}

const Village: React.FC<VillageProps> = ({ buildings, onUpgrade, onBattle }) => {
  return (
    <div className="h-full w-full bg-emerald-900 p-4 overflow-y-auto">
      <h2 className="pixel-font text-center text-lg mb-6 text-yellow-300 drop-shadow-md">Minha Vila</h2>
      
      <div className="space-y-4">
        {buildings.map(b => (
          <div key={b.id} className="bg-slate-800/80 rounded-lg p-4 flex justify-between items-center border border-slate-600">
            <div>
              <div className="font-bold text-lg flex items-center gap-2">
                {b.type === 'farm' && '🌾'}
                {b.type === 'mine' && '⛏️'}
                {b.type === 'market' && '🏪'}
                {b.name} <span className="text-xs text-slate-400 italic">Lv.{b.level}</span>
              </div>
              <p className="text-xs text-slate-300">Produzindo: {b.baseProduction * b.level}/seg</p>
            </div>
            <button 
              onClick={() => onUpgrade(b.id)}
              className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs px-3 py-2 rounded font-bold shadow-md active:translate-y-0.5 transition-all"
            >
              Melhorar ({b.level * 20} 🧱)
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button 
          onClick={onBattle}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-full shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all text-xl"
        >
          IR PARA BATALHA!
        </button>
        <p className="mt-2 text-xs text-slate-300 opacity-70">Encontre fragmentos em terras inimigas</p>
      </div>

      {/* Visual background decoration */}
      <div className="absolute bottom-4 right-4 text-4xl opacity-20 pointer-events-none">🌳🌳🏠🌳</div>
      <div className="absolute top-10 left-4 text-4xl opacity-20 pointer-events-none">🌲🏡</div>
    </div>
  );
};

export default Village;

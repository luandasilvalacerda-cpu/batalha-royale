
import React, { useState, useEffect } from 'react';
import { TempleUpgrade, Resources } from '../types';
import { getOracleAdvice } from '../services/geminiService';

interface TempleProps {
  upgrades: TempleUpgrade[];
  resources: Resources;
  onUpgrade: (id: string) => void;
}

const Temple: React.FC<TempleProps> = ({ upgrades, resources, onUpgrade }) => {
  const [oracleText, setOracleText] = useState("O Oráculo observa...");
  const [loadingOracle, setLoadingOracle] = useState(false);

  const fetchAdvice = async () => {
    setLoadingOracle(true);
    const advice = await getOracleAdvice(resources);
    setOracleText(advice);
    setLoadingOracle(false);
  };

  useEffect(() => {
    fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full w-full bg-indigo-950 p-4 flex flex-col items-center overflow-y-auto">
      <h2 className="pixel-font text-center text-lg mb-2 text-purple-300">Templo dos Anciões</h2>
      
      {/* Oracle Section */}
      <div className="w-full bg-slate-900/60 border-2 border-purple-500 rounded-xl p-4 mb-6 text-center relative overflow-hidden">
        <div className="text-3xl mb-2">🔮</div>
        <p className="text-sm italic text-purple-100 min-h-[40px]">
          "{loadingOracle ? "Consultando as estrelas..." : oracleText}"
        </p>
        <button 
          onClick={fetchAdvice}
          className="mt-2 text-[10px] text-purple-400 underline hover:text-purple-300"
          disabled={loadingOracle}
        >
          Consultar Oráculo novamente
        </button>
        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/30 animate-pulse"></div>
      </div>

      <div className="w-full space-y-4">
        {upgrades.map(u => {
          const cost = (u.level + 1) * u.costPerLevel;
          const canAfford = resources.fragments >= cost;
          return (
            <div key={u.id} className="bg-slate-800/80 rounded-lg p-4 flex flex-col border border-slate-600">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-purple-300">{u.name} <span className="text-xs text-slate-400">Lv.{u.level}</span></h3>
                  <p className="text-[10px] text-slate-300 leading-tight">{u.description}</p>
                </div>
                <div className="text-purple-400 text-sm font-bold">{cost} 💎</div>
              </div>
              <button 
                disabled={!canAfford}
                onClick={() => onUpgrade(u.id)}
                className={`w-full py-2 rounded font-bold text-xs transition-all ${
                  canAfford 
                    ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {canAfford ? 'INVOCAR PODER' : 'FRAGMENTOS INSUFICIENTES'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-slate-400 text-[10px] italic">
        "Os fragmentos são as memórias do mundo caído. Use-os com sabedoria."
      </div>
    </div>
  );
};

export default Temple;

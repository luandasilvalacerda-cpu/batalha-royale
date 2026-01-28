
import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, Resources, Building, TempleUpgrade } from './types';
import { INITIAL_BUILDINGS, TEMPLE_UPGRADES } from './constants';
import Village from './components/Village';
import Temple from './components/Temple';
import GameCanvas from './components/GameCanvas';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.VILLAGE);
  const [resources, setResources] = useState<Resources>({
    food: 100,
    materials: 100,
    coins: 50,
    fragments: 10
  });
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [upgrades, setUpgrades] = useState<TempleUpgrade[]>(TEMPLE_UPGRADES);

  // Passive resource generation
  useEffect(() => {
    const interval = setInterval(() => {
      setResources(prev => {
        let newFood = prev.food;
        let newMaterials = prev.materials;
        let newCoins = prev.coins;

        buildings.forEach(b => {
          const prod = b.baseProduction * b.level;
          if (b.type === 'farm') newFood += prod / 60;
          if (b.type === 'mine') newMaterials += prod / 60;
          if (b.type === 'market') newCoins += prod / 60;
        });

        return {
          ...prev,
          food: Math.floor(newFood),
          materials: Math.floor(newMaterials),
          coins: Math.floor(newCoins)
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [buildings]);

  const handleUpgradeBuilding = (id: string) => {
    setBuildings(prev => prev.map(b => {
      if (b.id === id) {
        const cost = b.level * 20;
        if (resources.materials >= cost && resources.coins >= cost / 2) {
          setResources(r => ({
            ...r,
            materials: r.materials - cost,
            coins: r.coins - Math.floor(cost / 2)
          }));
          return { ...b, level: b.level + 1 };
        }
      }
      return b;
    }));
  };

  const handleApplyTempleUpgrade = (id: string) => {
    setUpgrades(prev => prev.map(u => {
      if (u.id === id) {
        const cost = (u.level + 1) * u.costPerLevel;
        if (resources.fragments >= cost) {
          setResources(r => ({ ...r, fragments: r.fragments - cost }));
          return { ...u, level: u.level + 1 };
        }
      }
      return u;
    }));
  };

  const onBattleWin = (earnedFragments: number, earnedCoins: number) => {
    setResources(prev => ({
      ...prev,
      fragments: prev.fragments + earnedFragments,
      coins: prev.coins + earnedCoins
    }));
    setMode(GameMode.VILLAGE);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-white overflow-hidden max-w-[450px] mx-auto shadow-2xl relative">
      {/* Header / Top Bar */}
      <div className="bg-slate-800 p-2 flex justify-around text-[10px] sm:text-xs border-b border-slate-700 font-bold">
        <div className="flex items-center gap-1"><span title="Comida">🍖</span> {Math.floor(resources.food)}</div>
        <div className="flex items-center gap-1"><span title="Materiais">🧱</span> {Math.floor(resources.materials)}</div>
        <div className="flex items-center gap-1"><span title="Ouro">💰</span> {Math.floor(resources.coins)}</div>
        <div className="flex items-center gap-1 text-purple-400"><span title="Fragmentos">💎</span> {resources.fragments}</div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {mode === GameMode.VILLAGE && (
          <Village 
            buildings={buildings} 
            onUpgrade={handleUpgradeBuilding} 
            onBattle={() => setMode(GameMode.BATTLE)} 
          />
        )}
        {mode === GameMode.TEMPLE && (
          <Temple 
            upgrades={upgrades} 
            resources={resources}
            onUpgrade={handleApplyTempleUpgrade} 
          />
        )}
        {mode === GameMode.BATTLE && (
          <GameCanvas 
            onWin={(f, c) => onBattleWin(f, c)}
            onLose={() => setMode(GameMode.VILLAGE)}
            templeStats={upgrades}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-slate-800 h-16 flex justify-around items-center border-t border-slate-700">
        <button 
          onClick={() => setMode(GameMode.VILLAGE)}
          className={`flex flex-col items-center transition-all ${mode === GameMode.VILLAGE ? 'text-yellow-400 scale-110' : 'text-slate-400'}`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">Vila</span>
        </button>
        <button 
          onClick={() => setMode(GameMode.BATTLE)}
          className={`flex flex-col items-center transition-all ${mode === GameMode.BATTLE ? 'text-red-500 scale-110' : 'text-slate-400'}`}
        >
          <span className="text-xl">⚔️</span>
          <span className="text-[10px]">Batalha</span>
        </button>
        <button 
          onClick={() => setMode(GameMode.TEMPLE)}
          className={`flex flex-col items-center transition-all ${mode === GameMode.TEMPLE ? 'text-purple-400 scale-110' : 'text-slate-400'}`}
        >
          <span className="text-xl">🏛️</span>
          <span className="text-[10px]">Templo</span>
        </button>
      </div>
    </div>
  );
};

export default App;

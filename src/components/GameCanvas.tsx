
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Unit, UnitType, Tower, Card, GameMode, TempleUpgrade } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CARDS } from '../constants';
import { getVictoryLore } from '../services/geminiService';

interface GameCanvasProps {
  onWin: (fragments: number, coins: number) => void;
  onLose: () => void;
  templeStats: TempleUpgrade[];
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onWin, onLose, templeStats }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [energy, setEnergy] = useState(5);
  const [units, setUnits] = useState<Unit[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [victoryMsg, setVictoryMsg] = useState("");

  // Refs for logic to avoid stale closures in requestAnimationFrame
  const unitsRef = useRef<Unit[]>([]);
  const towersRef = useRef<Tower[]>([]);

  // Init Towers
  useEffect(() => {
    const hpBoost = templeStats.find(u => u.id === 'u2')?.level || 0;
    const initialTowers: Tower[] = [
      // Player Towers
      { id: 'pt1', x: CANVAS_WIDTH * 0.5, y: CANVAS_HEIGHT - 60, health: 1500 + (hpBoost * 200), maxHealth: 1500 + (hpBoost * 200), owner: 'player', isMain: true },
      { id: 'pt2', x: CANVAS_WIDTH * 0.2, y: CANVAS_HEIGHT - 120, health: 800 + (hpBoost * 100), maxHealth: 800 + (hpBoost * 100), owner: 'player', isMain: false },
      { id: 'pt3', x: CANVAS_WIDTH * 0.8, y: CANVAS_HEIGHT - 120, health: 800 + (hpBoost * 100), maxHealth: 800 + (hpBoost * 100), owner: 'player', isMain: false },
      // Enemy Towers
      { id: 'et1', x: CANVAS_WIDTH * 0.5, y: 60, health: 1500, maxHealth: 1500, owner: 'enemy', isMain: true },
      { id: 'et2', x: CANVAS_WIDTH * 0.2, y: 120, health: 800, maxHealth: 800, owner: 'enemy', isMain: false },
      { id: 'et3', x: CANVAS_WIDTH * 0.8, y: 120, health: 800, maxHealth: 800, owner: 'enemy', isMain: false },
    ];
    setTowers(initialTowers);
    towersRef.current = initialTowers;
  }, [templeStats]);

  // Energy Regen
  useEffect(() => {
    const regenBoost = templeStats.find(u => u.id === 'u3')?.level || 0;
    const interval = setInterval(() => {
      setEnergy(e => Math.min(10, e + 0.3 + (regenBoost * 0.05)));
    }, 1000);
    return () => clearInterval(interval);
  }, [templeStats]);

  // AI Enemy Deployment
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState !== 'playing') return;
      const type = CARDS[Math.floor(Math.random() * CARDS.length)].id;
      const x = Math.random() * CANVAS_WIDTH;
      const y = 150; // Spawn near top
      spawnUnit(type, x, y, 'enemy');
    }, 4500);
    return () => clearInterval(interval);
  }, [gameState]);

  const spawnUnit = (type: UnitType, x: number, y: number, owner: 'player' | 'enemy') => {
    const dmgBoost = owner === 'player' ? (templeStats.find(u => u.id === 'u1')?.level || 0) * 2 : 0;
    
    const baseStats: Record<UnitType, Partial<Unit>> = {
      [UnitType.WARRIOR]: { health: 250, damage: 25 + dmgBoost, speed: 1.2, range: 25, attackCooldown: 800 },
      [UnitType.ARCHER]: { health: 120, damage: 18 + dmgBoost, speed: 1.4, range: 120, attackCooldown: 1200 },
      [UnitType.GIANT]: { health: 900, damage: 45 + dmgBoost, speed: 0.6, range: 30, attackCooldown: 2000 },
      [UnitType.WIZARD]: { health: 150, damage: 35 + dmgBoost, speed: 1.0, range: 100, attackCooldown: 1500 },
    };

    const stats = baseStats[type];
    const newUnit: Unit = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x,
      y,
      health: stats.health!,
      maxHealth: stats.health!,
      damage: stats.damage!,
      range: stats.range!,
      speed: stats.speed!,
      owner,
      targetId: null,
      lastAttackTime: 0,
      attackCooldown: stats.attackCooldown!,
    };
    unitsRef.current = [...unitsRef.current, newUnit];
    setUnits([...unitsRef.current]);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (gameState !== 'playing') return;
    if (!selectedCard) return;
    if (energy < selectedCard.cost) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Deployment area check (bottom half)
    if (clickY < CANVAS_HEIGHT / 2) return;

    spawnUnit(selectedCard.id, clickX, clickY, 'player');
    setEnergy(prev => prev - selectedCard.cost);
    setSelectedCard(null);
  };

  const update = useCallback(() => {
    if (gameState !== 'playing') return;

    const currentTime = Date.now();
    let updatedUnits = [...unitsRef.current];
    let updatedTowers = [...towersRef.current];

    updatedUnits.forEach(unit => {
      // Find Target
      let target: any = null;
      let minDistance = Infinity;

      // Prioritize towers if Giant
      const potentialTowers = updatedTowers.filter(t => t.owner !== unit.owner);
      const potentialUnits = updatedUnits.filter(u => u.owner !== unit.owner);

      if (unit.type === UnitType.GIANT) {
        potentialTowers.forEach(t => {
          const dist = Math.hypot(t.x - unit.x, t.y - unit.y);
          if (dist < minDistance) {
            minDistance = dist;
            target = t;
          }
        });
      } else {
        // Find nearest enemy (unit or tower)
        [...potentialUnits, ...potentialTowers].forEach(t => {
          const dist = Math.hypot(t.x - unit.x, t.y - unit.y);
          if (dist < minDistance) {
            minDistance = dist;
            target = t;
          }
        });
      }

      if (target) {
        if (minDistance <= unit.range) {
          // Attack
          if (currentTime - unit.lastAttackTime > unit.attackCooldown) {
            target.health -= unit.damage;
            unit.lastAttackTime = currentTime;
          }
        } else {
          // Move
          const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
          unit.x += Math.cos(angle) * unit.speed;
          unit.y += Math.sin(angle) * unit.speed;
        }
      }
    });

    // Cleanup dead entities
    updatedUnits = updatedUnits.filter(u => u.health > 0);
    const mainPlayerTower = updatedTowers.find(t => t.owner === 'player' && t.isMain);
    const mainEnemyTower = updatedTowers.find(t => t.owner === 'enemy' && t.isMain);

    if (mainEnemyTower && mainEnemyTower.health <= 0) {
      setGameState('won');
      getVictoryLore().then(msg => setVictoryMsg(msg));
    } else if (mainPlayerTower && mainPlayerTower.health <= 0) {
      setGameState('lost');
    }

    updatedTowers = updatedTowers.filter(t => t.health > 0 || t.isMain);

    unitsRef.current = updatedUnits;
    towersRef.current = updatedTowers;
    setUnits(updatedUnits);
    setTowers(updatedTowers);
  }, [gameState]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Arena Floor
    ctx.fillStyle = '#2d5a27'; // Dark grass
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, CANVAS_WIDTH-10, CANVAS_HEIGHT-10);
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT/2);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT/2);
    ctx.stroke();

    // Draw Towers
    towersRef.current.forEach(tower => {
      ctx.fillStyle = tower.owner === 'player' ? '#3b82f6' : '#ef4444';
      ctx.beginPath();
      const size = tower.isMain ? 35 : 25;
      ctx.roundRect(tower.x - size/2, tower.y - size/2, size, size, 5);
      ctx.fill();
      
      // HP Bar
      ctx.fillStyle = '#000';
      ctx.fillRect(tower.x - 20, tower.y - size - 10, 40, 5);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(tower.x - 20, tower.y - size - 10, 40 * (tower.health / tower.maxHealth), 5);
    });

    // Draw Units
    unitsRef.current.forEach(unit => {
      ctx.fillStyle = unit.owner === 'player' ? '#60a5fa' : '#f87171';
      ctx.beginPath();
      const radius = unit.type === UnitType.GIANT ? 12 : 8;
      ctx.arc(unit.x, unit.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Icon for type
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      const char = unit.type === UnitType.WARRIOR ? 'W' : unit.type === UnitType.ARCHER ? 'A' : unit.type === UnitType.GIANT ? 'G' : 'M';
      ctx.fillText(char, unit.x - 4, unit.y + 4);

      // Mini HP Bar
      ctx.fillStyle = '#000';
      ctx.fillRect(unit.x - 10, unit.y - 15, 20, 3);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(unit.x - 10, unit.y - 15, 20 * (unit.health / unit.maxHealth), 3);
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      update();
      draw(ctx);
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [update, draw]);

  return (
    <div className="relative w-full h-full flex flex-col items-center select-none">
      <canvas 
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        className="w-full h-auto max-h-full cursor-crosshair bg-slate-900 border-x border-slate-700 shadow-inner"
      />

      {/* Battle UI Overlay */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
        <div className="bg-black/50 p-1 px-3 rounded-full text-[10px] text-yellow-400 font-bold border border-yellow-400/30">
          ⚡ Energia: {Math.floor(energy)}/10
        </div>
      </div>

      {/* Cards Panel */}
      <div className="absolute bottom-4 left-0 w-full px-2 flex justify-center gap-2">
        {CARDS.map(card => (
          <button
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className={`w-16 h-20 rounded-lg flex flex-col items-center justify-between p-1 border-2 transition-all ${
              selectedCard?.id === card.id 
                ? 'border-yellow-400 bg-slate-700 scale-105 shadow-lg' 
                : 'border-slate-600 bg-slate-800'
            } ${energy < card.cost ? 'opacity-50 grayscale' : 'hover:bg-slate-700 active:scale-95'}`}
          >
            <span className="text-xs font-bold text-slate-300">{card.cost}</span>
            <span className="text-xl">{card.icon}</span>
            <span className="text-[8px] font-bold truncate w-full text-center">{card.name}</span>
          </button>
        ))}
      </div>

      {/* Victory/Defeat Overlay */}
      {gameState !== 'playing' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-50">
          <h1 className={`pixel-font text-3xl mb-4 ${gameState === 'won' ? 'text-yellow-400' : 'text-red-500'}`}>
            {gameState === 'won' ? 'VITÓRIA!' : 'DERROTA...'}
          </h1>
          {gameState === 'won' && (
            <p className="text-slate-300 italic mb-6 animate-pulse">
              "{victoryMsg}"
            </p>
          )}
          <div className="flex gap-4 mb-8">
            {gameState === 'won' && (
              <>
                <div className="bg-slate-800 p-3 rounded-xl border border-purple-500">
                  <div className="text-xs text-slate-400">Fragmentos</div>
                  <div className="text-xl font-bold text-purple-400">+5 💎</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl border border-yellow-500">
                  <div className="text-xs text-slate-400">Ouro</div>
                  <div className="text-xl font-bold text-yellow-400">+20 💰</div>
                </div>
              </>
            )}
          </div>
          <button 
            onClick={() => gameState === 'won' ? onWin(5, 20) : onLose()}
            className="bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-slate-200 transition-colors"
          >
            VOLTAR PARA VILA
          </button>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;

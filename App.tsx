
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ARENA_WIDTH, 
  ARENA_HEIGHT, 
  MAX_ELIXIR, 
  ELIXIR_REGEN_RATE, 
  CARDS, 
  UNIT_STATS, 
  BUILDING_STATS,
  MATCH_DURATION
} from './constants';
import { Side, UnitType, Unit, Building, Card, GameState, ArenaTheme } from './types';

interface Projectile {
  x: number; y: number; tx: number; ty: number; speed: number; side: Side;
}

const ARENA_THEMES: Record<number, { theme: ArenaTheme, grass: string, grassAlt: string, river: string, riverEdge: string, particle: string }> = {
  1: { theme: 'FOREST', grass: '#22c55e', grassAlt: '#16a34a', river: '#3b82f6', riverEdge: '#1d4ed8', particle: '🌿' },
  2: { theme: 'ICE', grass: '#f0f9ff', grassAlt: '#e0f2fe', river: '#94a3b8', riverEdge: '#64748b', particle: '❄️' },
  3: { theme: 'LAVA', grass: '#171717', grassAlt: '#0a0a0a', river: '#ef4444', riverEdge: '#991b1b', particle: '🔥' },
  4: { theme: 'DESERT', grass: '#fde047', grassAlt: '#facc15', river: '#ca8a04', riverEdge: '#854d0e', particle: '🏜️' },
  5: { theme: 'SKY', grass: '#67e8f9', grassAlt: '#22d3ee', river: '#f8fafc', riverEdge: '#cbd5e1', particle: '☁️' },
  6: { theme: 'TOXIC', grass: '#4d7c0f', grassAlt: '#3f6212', river: '#a855f7', riverEdge: '#7e22ce', particle: '🧪' },
  7: { theme: 'CYBER', grass: '#0f172a', grassAlt: '#1e293b', river: '#06b6d4', riverEdge: '#0891b2', particle: '⚡' },
  8: { theme: 'DEEP_SEA', grass: '#134e4a', grassAlt: '#115e59', river: '#0f766e', riverEdge: '#115e59', particle: '🐙' },
  9: { theme: 'GOLDEN', grass: '#fbbf24', grassAlt: '#f59e0b', river: '#fff7ed', riverEdge: '#ffedd5', particle: '✨' },
  10: { theme: 'VOID', grass: '#2e1065', grassAlt: '#4c1d95', river: '#ec4899', riverEdge: '#db2777', particle: '🌌' },
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nameInput, setNameInput] = useState('');
  const [gameState, setGameState] = useState<GameState>({
    playerName: '',
    playerElixir: 5, enemyElixir: 5, buildings: [], units: [],
    status: 'START_SCREEN', winner: null, timeLeft: MATCH_DURATION,
    playerCrowns: 0, enemyCrowns: 0, trophies: 0, arenaLevel: 1
  });

  const stateRef = useRef<GameState>(gameState);
  const projectilesRef = useRef<Projectile[]>([]);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const startGame = () => {
    const finalName = nameInput.trim() || 'Comandante';
    stateRef.current = { ...stateRef.current, playerName: finalName, status: 'PLAYING' };
    setGameState({ ...stateRef.current });
    initGame();
  };

  const initGame = useCallback(() => {
    const buildings: Building[] = [
      { id: 'p-base', side: 'PLAYER', type: 'BASE', x: ARENA_WIDTH / 2, y: ARENA_HEIGHT - 100, hp: BUILDING_STATS.BASE.hp, maxHp: BUILDING_STATS.BASE.hp, isDead: false, range: BUILDING_STATS.BASE.range, damage: BUILDING_STATS.BASE.damage, attackCooldown: BUILDING_STATS.BASE.cooldown, lastAttackTime: 0 },
      { id: 'p-tower-l', side: 'PLAYER', type: 'TOWER', x: ARENA_WIDTH / 4, y: ARENA_HEIGHT - 220, hp: BUILDING_STATS.TOWER.hp, maxHp: BUILDING_STATS.TOWER.hp, isDead: false, range: BUILDING_STATS.TOWER.range, damage: BUILDING_STATS.TOWER.damage, attackCooldown: BUILDING_STATS.TOWER.cooldown, lastAttackTime: 0 },
      { id: 'p-tower-r', side: 'PLAYER', type: 'TOWER', x: (ARENA_WIDTH / 4) * 3, y: ARENA_HEIGHT - 220, hp: BUILDING_STATS.TOWER.hp, maxHp: BUILDING_STATS.TOWER.hp, isDead: false, range: BUILDING_STATS.TOWER.range, damage: BUILDING_STATS.TOWER.damage, attackCooldown: BUILDING_STATS.TOWER.cooldown, lastAttackTime: 0 },
      { id: 'e-base', side: 'ENEMY', type: 'BASE', x: ARENA_WIDTH / 2, y: 100, hp: BUILDING_STATS.BASE.hp, maxHp: BUILDING_STATS.BASE.hp, isDead: false, range: BUILDING_STATS.BASE.range, damage: BUILDING_STATS.BASE.damage, attackCooldown: BUILDING_STATS.BASE.cooldown, lastAttackTime: 0 },
      { id: 'e-tower-l', side: 'ENEMY', type: 'TOWER', x: ARENA_WIDTH / 4, y: 220, hp: BUILDING_STATS.TOWER.hp, maxHp: BUILDING_STATS.TOWER.hp, isDead: false, range: BUILDING_STATS.TOWER.range, damage: BUILDING_STATS.TOWER.damage, attackCooldown: BUILDING_STATS.TOWER.cooldown, lastAttackTime: 0 },
      { id: 'e-tower-r', side: 'ENEMY', type: 'TOWER', x: (ARENA_WIDTH / 4) * 3, y: 220, hp: BUILDING_STATS.TOWER.hp, maxHp: BUILDING_STATS.TOWER.hp, isDead: false, range: BUILDING_STATS.TOWER.range, damage: BUILDING_STATS.TOWER.damage, attackCooldown: BUILDING_STATS.TOWER.cooldown, lastAttackTime: 0 },
    ];
    stateRef.current = { ...stateRef.current, buildings, units: [], playerElixir: 5, enemyElixir: 5, status: 'PLAYING', winner: null, timeLeft: MATCH_DURATION, playerCrowns: 0, enemyCrowns: 0 };
    projectilesRef.current = [];
    setGameState({ ...stateRef.current });
  }, []);

  const nextArena = () => {
    stateRef.current.arenaLevel = Math.min(10, stateRef.current.arenaLevel + 1);
    initGame();
  };

  const spawnUnit = useCallback((type: UnitType, side: Side, x: number, y: number) => {
    const stats = UNIT_STATS[type];
    stateRef.current.units.push({
      id: `${side}-${Date.now()}-${Math.random()}`,
      type, side, x, y, hp: stats.hp, maxHp: stats.hp, isDead: false,
      speed: stats.speed, range: stats.range, damage: stats.damage,
      attackCooldown: stats.cooldown, lastAttackTime: 0, targetId: null, state: 'MOVING'
    });
  }, []);

  const handleCardClick = (card: Card) => {
    if (stateRef.current.status !== 'PLAYING' || stateRef.current.playerElixir < card.cost) return;
    stateRef.current.playerElixir -= card.cost;
    spawnUnit(card.type, 'PLAYER', ARENA_WIDTH / 2 + (Math.random() - 0.5) * 60, ARENA_HEIGHT - 160);
  };

  const update = useCallback((time: number) => {
    const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = time;
    const state = stateRef.current;
    if (state.status !== 'PLAYING') return;

    state.timeLeft -= deltaTime;
    state.playerElixir = Math.min(MAX_ELIXIR, state.playerElixir + ELIXIR_REGEN_RATE * deltaTime);
    state.enemyElixir = Math.min(MAX_ELIXIR, state.enemyElixir + (ELIXIR_REGEN_RATE * 0.8) * deltaTime);

    if (state.enemyElixir >= 6) {
      const card = CARDS[Math.floor(Math.random() * CARDS.length)];
      state.enemyElixir -= card.cost;
      spawnUnit(card.type, 'ENEMY', ARENA_WIDTH / 2 + (Math.random() - 0.5) * 60, 160);
    }

    projectilesRef.current = projectilesRef.current.filter(p => {
      const dx = p.tx - p.x; const dy = p.ty - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 10) return false;
      p.x += (dx/dist) * p.speed; p.y += (dy/dist) * p.speed;
      return true;
    });

    state.units.forEach(u => {
      if (u.isDead) return;
      const enemies = [...state.units, ...state.buildings].filter(e => e.side !== u.side && !e.isDead);
      let nearest: any = null; let minDist = Infinity;
      enemies.forEach(e => {
        const d = Math.sqrt((u.x-e.x)**2 + (u.y-e.y)**2);
        if (d < minDist) { minDist = d; nearest = e; }
      });

      if (nearest) {
        if (minDist <= u.range) {
          u.state = 'ATTACKING';
          if (Date.now() - u.lastAttackTime > u.attackCooldown) {
            u.lastAttackTime = Date.now();
            if (u.type === UnitType.ARCHER) projectilesRef.current.push({ x: u.x, y: u.y, tx: nearest.x, ty: nearest.y, speed: 10, side: u.side });
            nearest.hp -= u.damage;
            if (nearest.hp <= 0) {
              nearest.isDead = true;
              if (nearest.type === 'TOWER') { if (u.side === 'PLAYER') state.playerCrowns++; else state.enemyCrowns++; }
              if (nearest.type === 'BASE') {
                state.status = 'GAME_OVER'; state.winner = u.side;
                if (u.side === 'PLAYER') { state.playerCrowns = 3; state.trophies += 50; }
                else state.enemyCrowns = 3;
              }
            }
          }
        } else {
          u.state = 'MOVING';
          const angle = Math.atan2(nearest.y - u.y, nearest.x - u.x);
          u.x += Math.cos(angle) * u.speed; u.y += Math.sin(angle) * u.speed;
        }
      }
    });

    state.units = state.units.filter(u => !u.isDead);
    setGameState({ ...state });
    draw(time);
    requestRef.current = requestAnimationFrame(update);
  }, [spawnUnit]);

  const drawCharacter = (ctx: CanvasRenderingContext2D, u: Unit, time: number) => {
    const isPlayer = u.side === 'PLAYER';
    const mainColor = isPlayer ? '#3b82f6' : '#ef4444';
    const armorColor = isPlayer ? '#cbd5e1' : '#334155';
    const bob = Math.sin(time / 100) * 2;
    ctx.save();
    ctx.translate(u.x, u.y + bob);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(0, 8, 10, 4, 0, 0, Math.PI*2); ctx.fill();
    if (u.type === UnitType.SOLDIER) {
      ctx.fillStyle = mainColor;
      if (!isPlayer) {
          ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.lineTo(6, 14); ctx.lineTo(0, 10); ctx.lineTo(-6, 14); ctx.fill();
      } else {
          ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(0, 15); ctx.fill();
      }
      ctx.fillStyle = armorColor;
      ctx.beginPath(); ctx.arc(0, -5, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isPlayer ? '#94a3b8' : '#1e293b';
      ctx.fillRect(-7, -13, 14, 11);
      ctx.fillStyle = isPlayer ? '#fbbf24' : '#991b1b';
      ctx.fillRect(-2, -15, 4, 4);
      ctx.strokeStyle = isPlayer ? '#e2e8f0' : '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(18, -10); ctx.stroke();
    } else if (u.type === UnitType.ARCHER) {
      ctx.fillStyle = mainColor;
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-8, 8); ctx.lineTo(8, 8); ctx.fill();
      ctx.fillStyle = isPlayer ? '#f472b6' : '#4c1d95';
      ctx.beginPath(); ctx.arc(0, -11, 7, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = isPlayer ? '#b45309' : '#111827';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(8, 0, 9, -Math.PI/2, Math.PI/2); ctx.stroke();
    } else if (u.type === UnitType.TANK) {
      ctx.scale(1.4, 1.4);
      ctx.fillStyle = isPlayer ? '#fdbaf47' : '#451a03';
      ctx.beginPath(); ctx.arc(0, -12, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = isPlayer ? '#92400e' : '#171717';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.fillStyle = isPlayer ? '#78350f' : '#000';
      ctx.beginPath(); ctx.arc(0, -10, 6, 0, Math.PI); ctx.fill();
      ctx.fillStyle = mainColor;
      ctx.fillRect(-9, 0, 18, 3);
    }
    if (u.hp < u.maxHp) {
        ctx.fillStyle = '#000'; ctx.fillRect(-10, -22, 20, 3);
        ctx.fillStyle = '#4ade80'; ctx.fillRect(-10, -22, 20 * (u.hp/u.maxHp), 3);
    }
    ctx.restore();
  };

  const drawBuilding = (ctx: CanvasRenderingContext2D, b: Building) => {
    if (b.isDead) return;
    const isPlayer = b.side === 'PLAYER';
    const team = isPlayer ? '#3b82f6' : '#ef4444';
    const size = b.type === 'BASE' ? 50 : 35;
    const h = b.type === 'BASE' ? 40 : 25;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-size/2 + 5, -size/2 + 5, size, size);
    ctx.fillStyle = isPlayer ? '#64748b' : '#334155';
    ctx.fillRect(-size/2, -size/2 - h, size, h + size/2);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    for(let i=0; i<h/8; i++) { ctx.beginPath(); ctx.moveTo(-size/2, -size/2 - i*8); ctx.lineTo(size/2, -size/2 - i*8); ctx.stroke(); }
    ctx.fillStyle = team; 
    ctx.beginPath(); ctx.moveTo(-size/2 - 4, -size/2 - h); ctx.lineTo(0, -size/2 - h - 15); ctx.lineTo(size/2 + 4, -size/2 - h); ctx.fill();
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-4, -size/2 - h + 5, 8, 10);
    ctx.fillStyle = '#000'; ctx.fillRect(-20, -size/2 - h - 25, 40, 5);
    ctx.fillStyle = '#4ade80'; ctx.fillRect(-20, -size/2 - h - 25, 40 * (b.hp/b.maxHp), 5);
    ctx.restore();
  };

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const state = stateRef.current;
    const arenaConfig = ARENA_THEMES[state.arenaLevel] || ARENA_THEMES[1];
    
    ctx.fillStyle = arenaConfig.grass; ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    ctx.fillStyle = arenaConfig.grassAlt;
    
    // Partículas Temáticas do Fundo
    ctx.font = '12px serif';
    for(let i=0; i<25; i++) {
        const gx = (Math.sin(i*777) * 0.5 + 0.5) * ARENA_WIDTH;
        const gy = (Math.cos(i*666) * 0.5 + 0.5) * ARENA_HEIGHT;
        ctx.fillText(arenaConfig.particle, gx, gy);
    }

    const grad = ctx.createLinearGradient(0, ARENA_HEIGHT/2-25, 0, ARENA_HEIGHT/2+25);
    grad.addColorStop(0, arenaConfig.riverEdge); grad.addColorStop(0.5, arenaConfig.river); grad.addColorStop(1, arenaConfig.riverEdge);
    ctx.fillStyle = grad; ctx.fillRect(0, ARENA_HEIGHT/2 - 25, ARENA_WIDTH, 50);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(ARENA_WIDTH * 0.15, ARENA_HEIGHT/2 - 35, 50, 70);
    ctx.fillRect(ARENA_WIDTH * 0.70, ARENA_HEIGHT/2 - 35, 50, 70);

    state.buildings.forEach(b => drawBuilding(ctx, b));
    state.units.forEach(u => drawCharacter(ctx, u, time));

    projectilesRef.current.forEach(p => {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.ty-p.y, p.tx-p.x));
        ctx.strokeStyle = p.side === 'PLAYER' ? '#fff' : '#ef4444';
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.stroke(); ctx.restore();
    });
  }, []);

  useEffect(() => {
    if (gameState.status === 'PLAYING') {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gameState.status, update]);

  if (gameState.status === 'START_SCREEN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a] p-6 text-white font-sans">
        <div className="w-full max-w-sm bg-slate-900 border-4 border-amber-600 rounded-[40px] p-8 shadow-2xl flex flex-col items-center gap-6">
          <div className="text-7xl">⚔️</div>
          <h1 className="text-4xl font-black italic text-center tracking-tighter text-amber-500 uppercase">Battle Arena</h1>
          <div className="w-full space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Seu Nome de Guerra</label>
            <input 
              type="text" 
              maxLength={12}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Ex: Guerreiro99"
              className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-2xl text-xl font-bold focus:border-amber-500 outline-none transition-all"
            />
          </div>
          <button 
            onClick={startGame}
            className="w-full py-5 bg-gradient-to-b from-yellow-400 to-orange-600 border-b-8 border-orange-800 rounded-[25px] text-white font-black text-2xl shadow-xl active:translate-y-2 active:border-b-0 transition-all uppercase tracking-tight"
          >
            Entrar no Campo
          </button>
          <p className="text-[10px] text-slate-500 font-bold uppercase">Progressão: 10 Arenas Disponíveis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-1 font-sans select-none overflow-hidden">
      <div className="relative border-[8px] border-[#3a1a02] rounded-[45px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-slate-900 flex flex-col">
        
        {/* HUD Superior */}
        <div className="absolute top-0 left-0 right-0 h-16 flex justify-between items-center px-6 z-50 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex flex-col items-center opacity-60">
                <span className="text-[8px] text-white font-black tracking-widest uppercase">Adversário</span>
                <div className="flex gap-1 mt-1">
                    {[...Array(3)].map((_, i) => (
                        <span key={i} className={`text-xl ${i < gameState.enemyCrowns ? 'grayscale-0 drop-shadow-lg' : 'grayscale opacity-20'}`}>👑</span>
                    ))}
                </div>
            </div>
            <div className="flex flex-col items-center">
                <div className="bg-amber-950/80 px-4 py-0.5 rounded-full border border-amber-500 shadow-lg">
                    <span className="text-amber-400 font-mono text-sm font-bold tracking-widest">{Math.floor(gameState.timeLeft/60)}:{(gameState.timeLeft%60).toFixed(0).padStart(2,'0')}</span>
                </div>
            </div>
        </div>

        <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} className="max-h-[80vh] w-auto aspect-[4/7] cursor-pointer" />

        {/* Banner do Jogador */}
        <div className="absolute top-20 left-4 z-50 flex items-center gap-3">
             <div className={`w-12 h-12 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-xl overflow-hidden`}>
                <span className="text-xl font-black">{gameState.playerName[0]?.toUpperCase() || 'P'}</span>
             </div>
             <div className="flex flex-col">
                 <span className="text-white font-black text-sm tracking-tight drop-shadow-md uppercase">{gameState.playerName}</span>
                 <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <span key={i} className={`text-xl ${i < gameState.playerCrowns ? 'grayscale-0 drop-shadow-md' : 'grayscale opacity-20'}`}>👑</span>
                    ))}
                 </div>
             </div>
        </div>

        {/* Status da Arena */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1">
             <div className="bg-[#fffbeb] px-4 py-1 rounded-2xl border-2 border-amber-900 shadow-2xl flex items-center gap-2">
                 <span className="text-amber-950 font-black text-sm">🏆 {gameState.trophies}</span>
                 <div className="h-4 w-[1px] bg-amber-900/20"></div>
                 <span className="text-blue-700 font-black text-[10px]">ARENA {gameState.arenaLevel}</span>
             </div>
             <span className="text-[8px] text-white font-bold opacity-80 uppercase tracking-widest">{ARENA_THEMES[gameState.arenaLevel]?.theme.replace('_', ' ')}</span>
        </div>

        {/* HUD Inferior */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-50 bg-gradient-to-t from-black/80 to-transparent">
           <div className="flex items-center gap-3 mb-3 max-w-[320px] mx-auto">
              <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-600 to-pink-500 border-2 border-white rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl rotate-3 shrink-0">
                 {Math.floor(gameState.playerElixir)}
              </div>
              <div className="flex-1 h-4 bg-slate-900/90 rounded-full border-2 border-fuchsia-900/50 p-0.5 overflow-hidden shadow-inner">
                 <div className="h-full bg-gradient-to-r from-fuchsia-600 via-pink-400 to-fuchsia-200 rounded-full transition-all duration-300" style={{ width: `${(gameState.playerElixir / MAX_ELIXIR) * 100}%` }}></div>
              </div>
           </div>

           <div className="flex justify-center gap-2 max-w-[360px] mx-auto">
              {CARDS.map((card) => {
                 const canAfford = gameState.playerElixir >= card.cost;
                 return (
                    <button key={card.name} disabled={!canAfford} onClick={() => handleCardClick(card)} className={`group relative flex-1 aspect-[1/1.3] flex flex-col items-center justify-between p-2 rounded-2xl transition-all border-2 ${canAfford ? 'bg-gradient-to-b from-amber-50 to-amber-100 border-amber-950 shadow-[0_5px_0_#3a1a02] hover:-translate-y-1 active:translate-y-1 active:shadow-none' : 'bg-slate-800 border-black opacity-50 grayscale'}`}>
                       <div className={`absolute -top-2 -right-1 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border-2 border-white shadow-lg ${canAfford ? 'bg-fuchsia-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                          {card.cost}
                       </div>
                       <span className="text-4xl">{card.type === UnitType.TANK ? '👹' : card.type === UnitType.ARCHER ? '🏹' : '⚔️'}</span>
                       <span className="text-[8px] font-black text-amber-950 uppercase leading-none text-center">{card.name}</span>
                    </button>
                 );
              })}
           </div>
        </div>

        {/* Modal Game Over */}
        {gameState.status === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-[100] p-8 text-center animate-in zoom-in duration-300">
             <div className="text-9xl mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">{gameState.winner === 'PLAYER' ? '🏆' : '💀'}</div>
             <h1 className={`text-6xl font-black italic mb-2 tracking-tighter ${gameState.winner === 'PLAYER' ? 'text-yellow-400' : 'text-red-600'}`}>
                {gameState.winner === 'PLAYER' ? 'VITÓRIA!' : 'DERROTA'}
             </h1>
             <p className="text-white text-xl font-bold mb-4 uppercase tracking-widest">{gameState.playerName}</p>
             
             {gameState.winner === 'PLAYER' ? (
                <div className="space-y-4 w-full">
                   <p className="text-green-400 font-bold">AVANÇANDO PARA A PRÓXIMA ARENA!</p>
                   <button onClick={nextArena} className="w-full py-5 bg-gradient-to-b from-green-400 to-green-600 border-b-8 border-green-800 text-white font-black text-3xl rounded-[30px] active:translate-y-2 active:border-b-0 transition-all shadow-2xl">
                      PRÓXIMA FASE
                   </button>
                </div>
             ) : (
                <button onClick={initGame} className="w-full py-5 bg-gradient-to-b from-red-400 to-red-600 border-b-8 border-red-800 text-white font-black text-3xl rounded-[30px] active:translate-y-2 active:border-b-0 transition-all shadow-2xl">
                   TENTAR NOVAMENTE
                </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

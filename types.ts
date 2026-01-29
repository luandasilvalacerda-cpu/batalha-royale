
export type Side = 'PLAYER' | 'ENEMY';

export enum UnitType {
  SOLDIER = 'SOLDIER',
  ARCHER = 'ARCHER',
  TANK = 'TANK'
}

export type ArenaTheme = 
  | 'FOREST' 
  | 'ICE' 
  | 'LAVA' 
  | 'DESERT' 
  | 'SKY' 
  | 'TOXIC' 
  | 'CYBER' 
  | 'DEEP_SEA' 
  | 'GOLDEN' 
  | 'VOID';

export interface Entity {
  id: string;
  side: Side;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  isDead: boolean;
}

export interface Building extends Entity {
  type: 'BASE' | 'TOWER';
  range: number;
  damage: number;
  attackCooldown: number;
  lastAttackTime: number;
}

export interface Unit extends Entity {
  type: UnitType;
  speed: number;
  range: number;
  damage: number;
  attackCooldown: number;
  lastAttackTime: number;
  targetId: string | null;
  state: 'MOVING' | 'ATTACKING';
}

export interface Card {
  type: UnitType;
  name: string;
  cost: number;
  description: string;
  icon: string;
}

export interface GameState {
  playerName: string;
  playerElixir: number;
  enemyElixir: number;
  buildings: Building[];
  units: Unit[];
  status: 'START_SCREEN' | 'PLAYING' | 'GAME_OVER';
  winner: Side | null;
  timeLeft: number;
  playerCrowns: number;
  enemyCrowns: number;
  trophies: number;
  arenaLevel: number;
}


export enum GameMode {
  VILLAGE = 'VILLAGE',
  BATTLE = 'BATTLE',
  TEMPLE = 'TEMPLE'
}

export enum UnitType {
  WARRIOR = 'WARRIOR',
  ARCHER = 'ARCHER',
  GIANT = 'GIANT',
  WIZARD = 'WIZARD'
}

export interface Unit {
  id: string;
  type: UnitType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  range: number;
  speed: number;
  owner: 'player' | 'enemy';
  targetId: string | null;
  lastAttackTime: number;
  attackCooldown: number;
}

export interface Tower {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  owner: 'player' | 'enemy';
  isMain: boolean;
}

export interface Card {
  id: UnitType;
  name: string;
  cost: number;
  description: string;
  icon: string;
}

export interface Resources {
  food: number;
  materials: number;
  coins: number;
  fragments: number;
}

export interface Building {
  id: string;
  name: string;
  level: number;
  type: 'farm' | 'mine' | 'market';
  baseProduction: number;
}

export interface TempleUpgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  costPerLevel: number;
  multiplier: number;
}

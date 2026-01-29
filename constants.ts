
import { UnitType, Card } from './types';

export const ARENA_WIDTH = 400;
export const ARENA_HEIGHT = 700;
export const MAX_ELIXIR = 10;
export const ELIXIR_REGEN_RATE = 0.6; // Um pouco mais rápido para dinamismo
export const MATCH_DURATION = 180;

export const CARDS: Card[] = [
  {
    type: UnitType.SOLDIER,
    name: 'Cavaleiro',
    cost: 3,
    description: 'Guerreiro de espada.',
    icon: '🛡️'
  },
  {
    type: UnitType.ARCHER,
    name: 'Arqueira',
    cost: 3,
    description: 'Ataque à distância.',
    icon: '🏹'
  },
  {
    type: UnitType.TANK,
    name: 'Gigante',
    cost: 5,
    description: 'Muita vida, foco em torres.',
    icon: '👹'
  }
];

export const UNIT_STATS = {
  [UnitType.SOLDIER]: {
    hp: 250,
    damage: 25,
    speed: 1.4,
    range: 35,
    cooldown: 800,
    size: 14,
    color: '#3B82F6',
    emoji: '⚔️'
  },
  [UnitType.ARCHER]: {
    hp: 140,
    damage: 18,
    speed: 1.7,
    range: 150,
    cooldown: 1100,
    size: 12,
    color: '#10B981',
    emoji: '🏹'
  },
  [UnitType.TANK]: {
    hp: 800,
    damage: 40,
    speed: 0.7,
    range: 40,
    cooldown: 1500,
    size: 22,
    color: '#F59E0B',
    emoji: '👹'
  }
};

export const BUILDING_STATS = {
  BASE: {
    hp: 2500,
    damage: 60,
    range: 160,
    cooldown: 1000,
    size: 50
  },
  TOWER: {
    hp: 1400,
    damage: 35,
    range: 200,
    cooldown: 850,
    size: 38
  }
};


import { UnitType, Card, Building, TempleUpgrade } from './types';

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 650;

export const CARDS: Card[] = [
  { id: UnitType.WARRIOR, name: 'Guerreiro', cost: 3, description: 'Balanceado e corajoso.', icon: '⚔️' },
  { id: UnitType.ARCHER, name: 'Arqueira', cost: 2, description: 'Ataque à distância.', icon: '🏹' },
  { id: UnitType.GIANT, name: 'Gigante', cost: 5, description: 'Foca apenas em torres.', icon: '🧱' },
  { id: UnitType.WIZARD, name: 'Mago', cost: 4, description: 'Dano em área massivo.', icon: '🔥' }
];

export const INITIAL_BUILDINGS: Building[] = [
  { id: 'b1', name: 'Fazenda', level: 1, type: 'farm', baseProduction: 10 },
  { id: 'b2', name: 'Mina', level: 1, type: 'mine', baseProduction: 10 },
  { id: 'b3', name: 'Mercado', level: 1, type: 'market', baseProduction: 5 }
];

export const TEMPLE_UPGRADES: TempleUpgrade[] = [
  { id: 'u1', name: 'Poder Ancestral', description: 'Aumenta o dano de todas as unidades.', level: 0, costPerLevel: 20, multiplier: 0.1 },
  { id: 'u2', name: 'Escudo Sagrado', description: 'Aumenta a vida das torres.', level: 0, costPerLevel: 15, multiplier: 0.15 },
  { id: 'u3', name: 'Energia Mística', description: 'Regeneração de energia mais rápida.', level: 0, costPerLevel: 50, multiplier: 0.05 }
];

export interface Profile {
  id: string;
  username: string;
  email: string;
  water: number;
  dates: number;
  gold: number;
  stone: number;
  waterRate: number;
  datesRate: number;
  goldRate: number;
  stoneRate: number;
  storageCapacity: number;
  mapX: number;
  mapY: number;
  lastResourceUpdate: Date;
  createdAt: Date;
}

export interface InsertProfile {
  id: string;
  username: string;
  email: string;
}

export interface Building {
  id: string;
  profileId: string;
  buildingType: string;
  level: number;
  slotIndex: number;
  isUpgrading: boolean;
  upgradeStartTime: Date | null;
  upgradeEndTime: Date | null;
  createdAt: Date;
}

export interface InsertBuilding {
  profileId: string;
  buildingType: string;
  level: number;
  slotIndex: number;
}

export interface WorldMapCell {
  id: string;
  x: number;
  y: number;
  profileId: string | null;
  terrainType: string;
  isOccupied: boolean;
}

export const BUILDING_TYPES = {
  WELL: 'well',
  DATE_FARM: 'date_farm',
  GOLD_MINE: 'gold_mine',
  QUARRY: 'quarry',
  BARRACKS: 'barracks',
  WALL: 'wall',
  STORAGE: 'storage',
  MARKET: 'market',
} as const;

export const BUILDING_CONFIG: Record<string, {
  nameAr: string;
  icon: string;
  maxLevel: number;
  baseProduction: { water?: number; dates?: number; gold?: number; stone?: number };
  baseCost: { water: number; dates: number; gold: number; stone: number };
  baseTime: number;
  costMultiplier: number;
  timeMultiplier: number;
  productionMultiplier: number;
  storageBonus?: number;
}> = {
  [BUILDING_TYPES.WELL]: {
    nameAr: 'بئر ماء',
    icon: 'water-outline',
    maxLevel: 10,
    baseProduction: { water: 10 },
    baseCost: { water: 0, dates: 50, gold: 30, stone: 80 },
    baseTime: 60,
    costMultiplier: 1.5,
    timeMultiplier: 1.4,
    productionMultiplier: 1.3,
  },
  [BUILDING_TYPES.DATE_FARM]: {
    nameAr: 'مزرعة تمور',
    icon: 'leaf-outline',
    maxLevel: 10,
    baseProduction: { dates: 8 },
    baseCost: { water: 80, dates: 0, gold: 20, stone: 60 },
    baseTime: 90,
    costMultiplier: 1.5,
    timeMultiplier: 1.4,
    productionMultiplier: 1.3,
  },
  [BUILDING_TYPES.GOLD_MINE]: {
    nameAr: 'منجم ذهب',
    icon: 'diamond-outline',
    maxLevel: 10,
    baseProduction: { gold: 5 },
    baseCost: { water: 100, dates: 60, gold: 0, stone: 120 },
    baseTime: 120,
    costMultiplier: 1.6,
    timeMultiplier: 1.5,
    productionMultiplier: 1.25,
  },
  [BUILDING_TYPES.QUARRY]: {
    nameAr: 'محجر حجر',
    icon: 'cube-outline',
    maxLevel: 10,
    baseProduction: { stone: 7 },
    baseCost: { water: 60, dates: 40, gold: 50, stone: 0 },
    baseTime: 80,
    costMultiplier: 1.5,
    timeMultiplier: 1.4,
    productionMultiplier: 1.3,
  },
  [BUILDING_TYPES.BARRACKS]: {
    nameAr: 'ثكنة عسكرية',
    icon: 'shield-outline',
    maxLevel: 10,
    baseProduction: {},
    baseCost: { water: 120, dates: 80, gold: 100, stone: 150 },
    baseTime: 180,
    costMultiplier: 1.7,
    timeMultiplier: 1.5,
    productionMultiplier: 1,
  },
  [BUILDING_TYPES.WALL]: {
    nameAr: 'سور المدينة',
    icon: 'grid-outline',
    maxLevel: 10,
    baseProduction: {},
    baseCost: { water: 50, dates: 30, gold: 60, stone: 200 },
    baseTime: 150,
    costMultiplier: 1.6,
    timeMultiplier: 1.5,
    productionMultiplier: 1,
  },
  [BUILDING_TYPES.STORAGE]: {
    nameAr: 'مخزن',
    icon: 'archive-outline',
    maxLevel: 10,
    baseProduction: {},
    baseCost: { water: 80, dates: 60, gold: 40, stone: 100 },
    baseTime: 100,
    costMultiplier: 1.5,
    timeMultiplier: 1.3,
    productionMultiplier: 1,
    storageBonus: 500,
  },
  [BUILDING_TYPES.MARKET]: {
    nameAr: 'سوق',
    icon: 'storefront-outline',
    maxLevel: 10,
    baseProduction: {},
    baseCost: { water: 100, dates: 80, gold: 80, stone: 80 },
    baseTime: 140,
    costMultiplier: 1.5,
    timeMultiplier: 1.4,
    productionMultiplier: 1,
  },
};

export function getBuildingCost(type: string, level: number) {
  const config = BUILDING_CONFIG[type];
  if (!config) return { water: 0, dates: 0, gold: 0, stone: 0 };
  const mult = Math.pow(config.costMultiplier, level);
  return {
    water: Math.floor(config.baseCost.water * mult),
    dates: Math.floor(config.baseCost.dates * mult),
    gold: Math.floor(config.baseCost.gold * mult),
    stone: Math.floor(config.baseCost.stone * mult),
  };
}

export function getBuildingTime(type: string, level: number) {
  const config = BUILDING_CONFIG[type];
  if (!config) return 60;
  return Math.floor(config.baseTime * Math.pow(config.timeMultiplier, level));
}

export function getBuildingProduction(type: string, level: number) {
  const config = BUILDING_CONFIG[type];
  if (!config || level === 0) return { water: 0, dates: 0, gold: 0, stone: 0 };
  const mult = Math.pow(config.productionMultiplier, level - 1);
  return {
    water: Math.floor((config.baseProduction.water || 0) * mult),
    dates: Math.floor((config.baseProduction.dates || 0) * mult),
    gold: Math.floor((config.baseProduction.gold || 0) * mult),
    stone: Math.floor((config.baseProduction.stone || 0) * mult),
  };
}

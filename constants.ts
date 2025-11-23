
import { DistrictName, DistrictConfig, Furniture, BuildingType, Property, RentMode, RandomEvent, GameState } from './types';

export const INITIAL_MONEY = 50000;
export const XP_PER_RENT = 20; 
export const XP_PER_BUY = 100;
export const XP_PER_REPAIR = 15;
export const XP_PER_UPGRADE_MULTIPLIER = 0.05; 
export const PASSIVE_XP_HIGH_REP = 10;

export const MAX_CONDITION = 100;
export const REPAIR_COST_PER_UNIT = 30; 
export const TICK_RATE_MS = 5000; 

export const PROPERTY_TIER_COST = 15000; // Cost to upgrade from Tier 1 to Tier 2
export const MAX_AMENITY_LEVEL_TIER_1 = 5;

// Updated Audio Assets
export const AUDIO_URLS = {
  bgm: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', 
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  cash: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  notification: 'https://assets.mixkit.co/active_storage/sfx/2344/2344-preview.mp3',
  levelup: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  tense: 'https://assets.mixkit.co/active_storage/sfx/2959/2959-preview.mp3' 
};

export const DISTRICTS: Record<DistrictName, DistrictConfig> = {
  [DistrictName.SUBURBS]: {
    name: DistrictName.SUBURBS,
    description: "Quiet area, great for starters and long-term families.",
    unlockLevel: 1,
    basePropertyCost: 15000,
    gridSize: 9, 
    color: 'bg-emerald-500'
  },
  [DistrictName.DOWNTOWN]: {
    name: DistrictName.DOWNTOWN,
    description: "Bustling city center. High demand for hotels.",
    unlockLevel: 5,
    basePropertyCost: 65000,
    gridSize: 9,
    color: 'bg-blue-500'
  },
  [DistrictName.FINANCIAL]: {
    name: DistrictName.FINANCIAL,
    description: "The big leagues. Massive commercial potential.",
    unlockLevel: 10,
    basePropertyCost: 200000,
    gridSize: 9,
    color: 'bg-purple-600'
  }
};

// Scalable Furniture - Levels 1-10
export const AVAILABLE_FURNITURE: Furniture[] = [
  { id: 'f1', name: 'Bed', baseCost: 500, baseUpkeep: 2, baseComfort: 5, unlockLevel: 1, level: 0 },
  { id: 'f2', name: 'Internet', baseCost: 200, baseUpkeep: 5, baseComfort: 8, unlockLevel: 1, level: 0 },
  { id: 'f3', name: 'Entertainment', baseCost: 1200, baseUpkeep: 8, baseComfort: 15, unlockLevel: 3, level: 0 },
  { id: 'f4', name: 'Coffee Station', baseCost: 800, baseUpkeep: 4, baseComfort: 10, unlockLevel: 3, level: 0 },
  { id: 'f5', name: 'Kitchenette', baseCost: 5000, baseUpkeep: 20, baseComfort: 30, unlockLevel: 5, level: 0 },
  { id: 'f6', name: 'Home Gym', baseCost: 3500, baseUpkeep: 15, baseComfort: 25, unlockLevel: 6, level: 0 },
  { id: 'f7', name: 'Hot Tub', baseCost: 8000, baseUpkeep: 50, baseComfort: 50, unlockLevel: 8, level: 0 },
  { id: 'f8', name: 'Concierge', baseCost: 25000, baseUpkeep: 200, baseComfort: 100, unlockLevel: 12, level: 0 },
];

export const TENANT_NAMES = [
  "Rahul Sharma", "Priya Patel", "Amit Verma", "Sarah Johnson", 
  "David Smith", "Anjali Gupta", "Vikram Singh", "Emily Davis",
  "Michael Chen", "Sofia Rodriguez", "James Wilson", "Lisa Chang"
];

export const generateDistrictPlots = (district: DistrictName): Property[] => {
  const plots: Property[] = [];
  const config = DISTRICTS[district];
  
  for (let i = 0; i < config.gridSize; i++) {
    plots.push({
      id: `${district}-${i}`,
      districtId: district,
      type: BuildingType.EMPTY_PLOT,
      name: `Plot ${i + 1}`,
      purchaseCost: config.basePropertyCost + (Math.floor(Math.random() * 5000)),
      condition: 100,
      rentMode: RentMode.NONE,
      tier: 1, // Default tier
      furnitures: AVAILABLE_FURNITURE.map(f => ({...f})), 
      isOwned: false,
      lastRentPaidDay: 0,
      tenantStayDuration: 0
    });
  }
  return plots;
};

// --- EVENTS DATABASE ---

export const getGlobalEvents = (): RandomEvent[] => [
  {
    id: 'heatwave',
    type: 'GLOBAL',
    title: 'Extreme Heatwave',
    description: 'Temperatures are hitting record highs! Tenants are furious about cooling costs.',
    options: [
      {
        label: 'Subsidize Cooling (-$1500)',
        cost: 1500,
        description: 'Pay for your tenants extra electricity.',
        action: (s) => ({
          money: s.money - 1500,
          reputation: Math.min(100, s.reputation + 5)
        })
      },
      {
        label: 'Ignore',
        description: 'Let them sweat it out.',
        risk: 'High Reputation Loss (-20)',
        action: (s) => ({
          reputation: Math.max(0, s.reputation - 20),
          properties: s.properties.map(p => ({...p, condition: Math.max(0, p.condition - 5)}))
        })
      }
    ]
  },
  {
    id: 'market_crash',
    type: 'GLOBAL',
    title: 'Market Downturn',
    description: 'The economy is taking a hit. Tenant payments might be delayed.',
    options: [
      {
        label: 'Stimulus Package (-$5000)',
        description: 'Inject money into your properties to keep tenants.',
        cost: 5000,
        action: (s) => ({ money: s.money - 5000, reputation: s.reputation + 10 }) 
      },
      {
        label: 'Do Nothing',
        description: 'Wait for the storm to pass.',
        risk: 'Tenants may leave',
        action: (s) => ({
          reputation: s.reputation - 10,
          properties: s.properties.map(p => {
            if(Math.random() < 0.3) return { ...p, tenantName: undefined, tenantStayDuration: 0 };
            return p;
          })
        })
      }
    ]
  },
  {
    id: 'tax_audit',
    type: 'GLOBAL',
    title: 'City Tax Audit',
    description: 'The city council is auditing property records.',
    options: [
      {
        label: 'Hire Top Accountants (-$2000)',
        cost: 2000,
        description: 'Ensure everything is perfect.',
        action: (s) => ({ money: s.money - 2000, reputation: s.reputation + 2 })
      },
      {
        label: 'Submit Yourself',
        description: 'Risk a fine if they find errors.',
        risk: 'Chance of heavy fine',
        action: (s) => {
          const fined = Math.random() > 0.4;
          if(fined) return { money: s.money - 8000, reputation: s.reputation - 5 };
          return { money: s.money + 500 }; 
        }
      }
    ]
  },
  {
    id: 'celebrity',
    type: 'GLOBAL',
    title: 'Celebrity Visit',
    description: 'A famous star is visiting the city! Tourism is booming.',
    options: [
      {
        label: 'Run Ad Campaign (-$1000)',
        cost: 1000,
        description: 'Attract tourists to hotels.',
        action: (s) => ({ 
          money: s.money - 1000 + 5000, 
          reputation: Math.min(100, s.reputation + 15)
        })
      },
      {
        label: 'Do Nothing',
        description: 'Ignore the hype.',
        action: (s) => ({})
      }
    ]
  }
];

export const getLocalEvents = (property: Property): RandomEvent[] => [
  {
    id: `pipe_${property.id}`,
    type: 'LOCAL',
    targetPropertyId: property.id,
    title: 'Major Pipe Burst',
    description: `A pipe burst at ${property.name}! Water is flooding the unit.`,
    options: [
      {
        label: 'Emergency Plumber (-$800)',
        cost: 800,
        description: 'Fix it immediately.',
        action: (s, pid) => ({
           money: s.money - 800,
           properties: s.properties.map(p => p.id === pid ? { ...p, activeLocalEventId: undefined, condition: 100 } : p)
        })
      },
      {
        label: 'DIY Fix (-$50)',
        cost: 50,
        description: 'Use duct tape. Might fail.',
        risk: '50% Fail Chance',
        action: (s, pid) => {
          const success = Math.random() > 0.5;
          if (success) {
            return {
               money: s.money - 50,
               properties: s.properties.map(p => p.id === pid ? { ...p, activeLocalEventId: undefined, condition: 80 } : p)
            };
          } else {
            return {
               money: s.money - 50,
               reputation: s.reputation - 10,
               properties: s.properties.map(p => p.id === pid ? { ...p, condition: Math.max(0, p.condition - 40) } : p)
            };
          }
        }
      }
    ]
  },
  {
    id: `pests_${property.id}`,
    type: 'LOCAL',
    targetPropertyId: property.id,
    title: 'Pest Infestation',
    description: `Tenants at ${property.name} report cockroaches!`,
    options: [
      {
        label: 'Full Fumigation (-$1200)',
        cost: 1200,
        description: 'Guaranteed fix, but expensive.',
        action: (s, pid) => ({
           money: s.money - 1200,
           reputation: s.reputation + 2,
           properties: s.properties.map(p => p.id === pid ? { ...p, activeLocalEventId: undefined, condition: 100 } : p)
        })
      },
      {
        label: 'Bug Spray',
        description: 'Cheap store-bought spray.',
        risk: 'Tenants likely to leave',
        action: (s, pid) => {
           const leave = Math.random() > 0.3;
           return {
              reputation: s.reputation - 5,
              properties: s.properties.map(p => p.id === pid ? { 
                ...p, 
                activeLocalEventId: undefined,
                tenantName: leave ? undefined : p.tenantName,
                tenantStayDuration: leave ? 0 : p.tenantStayDuration
              } : p)
           }
        }
      }
    ]
  },
  {
    id: `noise_${property.id}`,
    type: 'LOCAL',
    targetPropertyId: property.id,
    title: 'Noise Complaint',
    description: `Neighbors are reporting loud parties at ${property.name}.`,
    options: [
      {
        label: 'Evict Tenant',
        description: 'Zero tolerance policy.',
        action: (s, pid) => ({
           reputation: s.reputation + 2,
           properties: s.properties.map(p => p.id === pid ? { ...p, activeLocalEventId: undefined, tenantName: undefined, tenantStayDuration: 0 } : p)
        })
      },
      {
        label: 'Issue Warning',
        description: 'Give them a second chance.',
        risk: 'They might continue',
        action: (s, pid) => {
           const ignores = Math.random() > 0.4;
           if (ignores) {
             return {
                reputation: s.reputation - 5,
                properties: s.properties.map(p => p.id === pid ? { ...p, activeLocalEventId: undefined } : p)
             }
           }
           return {
              properties: s.properties.map(p => p.id === pid ? { ...p, activeLocalEventId: undefined } : p)
           }
        }
      }
    ]
  }
];

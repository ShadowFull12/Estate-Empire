
export enum BuildingType {
  EMPTY_PLOT = 'EMPTY_PLOT',
  RESIDENTIAL_SMALL = 'RESIDENTIAL_SMALL',
  RESIDENTIAL_LARGE = 'RESIDENTIAL_LARGE',
  COMMERCIAL_OFFICE = 'COMMERCIAL_OFFICE',
}

export enum RentMode {
  NONE = 'NONE',
  LONG_TERM = 'LONG_TERM', 
  HOTEL = 'HOTEL', 
  COMMERCIAL = 'COMMERCIAL'
}

export enum DistrictName {
  SUBURBS = 'Suburbs',
  DOWNTOWN = 'Downtown',
  FINANCIAL = 'Financial District'
}

export interface Furniture {
  id: string;
  name: string;
  baseCost: number;
  baseUpkeep: number;
  baseComfort: number;
  unlockLevel: number;
  
  // Instance Data
  level: number; // 0 = Not owned, 1-10 = Owned
}

export interface Property {
  id: string;
  districtId: DistrictName;
  type: BuildingType;
  name: string;
  purchaseCost: number;
  condition: number; // 0-100%
  rentMode: RentMode;
  tier: number; // 1 = Basic (Max Amenity Lvl 5), 2 = Luxury (Max Amenity Lvl 10)
  
  // Economy
  furnitures: Furniture[];
  
  isOwned: boolean;
  tenantName?: string;
  tenantStayDuration: number;
  lastRentPaidDay: number;
  
  // Event System
  activeLocalEventId?: string; // If present, property is affected by a specific event
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export interface GameState {
  money: number;
  reputation: number; // 0-100
  day: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  properties: Property[];
  unlockedDistricts: DistrictName[];
  notifications: Notification[];
  
  // Time & Settings
  timeScale: number; // 0 = Paused
  gameSpeed: number;
  isMuted: boolean;
  
  // Modal States
  activeEvent: RandomEvent | null; // Global Event
  showLevelUpModal: boolean;
}

export interface RandomEvent {
  id: string;
  type: 'GLOBAL' | 'LOCAL';
  targetPropertyId?: string; // Only for LOCAL
  title: string;
  description: string;
  options: {
    label: string;
    description?: string; // Subtext for the choice
    action: (state: GameState, propertyId?: string) => Partial<GameState>;
    cost?: number;
    risk?: string; // Text description of risk e.g. "50% chance of failure"
  }[];
}

export interface DistrictConfig {
  name: DistrictName;
  description: string;
  unlockLevel: number;
  basePropertyCost: number;
  gridSize: number;
  color: string;
}

export interface SpeedSettings {
  driving: number;
  walking: number;
  cycling: number;
  transit: number;
  plane: number;
  boat: number;
  'container-ship': number;
}

export interface CostSettings {
  driving: number;
  walking: number;
  cycling: number;
  transit: number;
  plane: number;
  boat: number;
  'container-ship': number;
}

export interface TransportSettings {
  speeds: SpeedSettings;
  costs: CostSettings;
}

const DEFAULT_SPEEDS: SpeedSettings = {
  driving: 60,        // km/h - average urban/highway mix
  walking: 5,         // km/h - average walking speed
  cycling: 15,        // km/h - average cycling speed
  transit: 30,        // km/h - slower than driving due to stops
  plane: 850,         // km/h - commercial plane cruising speed
  boat: 30,           // km/h - average boat speed
  'container-ship': 25, // km/h - container ship speed
};

const DEFAULT_COSTS: CostSettings = {
  driving: 0.15,       // USD per km - fuel + maintenance
  walking: 0,          // Free!
  cycling: 0.02,       // USD per km - minimal maintenance
  transit: 0.10,       // USD per km - average public transit
  plane: 0.12,         // USD per km - budget airline rate
  boat: 0.30,          // USD per km - fuel + marina costs
  'container-ship': 0.05, // USD per km - efficient for cargo
};

const STORAGE_KEY = 'front-openstreetmap-speed-settings';
const COST_STORAGE_KEY = 'front-openstreetmap-cost-settings';

/**
 * Load speed settings from localStorage, or return defaults
 */
export function loadSpeedSettings(): SpeedSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_SPEEDS, ...parsed };
    }
  } catch (error) {
    console.error('Error loading speed settings:', error);
  }
  return { ...DEFAULT_SPEEDS };
}

/**
 * Load cost settings from localStorage, or return defaults
 */
export function loadCostSettings(): CostSettings {
  try {
    const stored = localStorage.getItem(COST_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_COSTS, ...parsed };
    }
  } catch (error) {
    console.error('Error loading cost settings:', error);
  }
  return { ...DEFAULT_COSTS };
}

/**
 * Load both speed and cost settings
 */
export function loadTransportSettings(): TransportSettings {
  return {
    speeds: loadSpeedSettings(),
    costs: loadCostSettings(),
  };
}

/**
 * Save speed settings to localStorage
 */
export function saveSpeedSettings(settings: SpeedSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving speed settings:', error);
  }
}

/**
 * Save cost settings to localStorage
 */
export function saveCostSettings(settings: CostSettings): void {
  try {
    localStorage.setItem(COST_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving cost settings:', error);
  }
}

/**
 * Save both speed and cost settings
 */
export function saveTransportSettings(settings: TransportSettings): void {
  saveSpeedSettings(settings.speeds);
  saveCostSettings(settings.costs);
}

/**
 * Reset speed settings to defaults
 */
export function resetSpeedSettings(): SpeedSettings {
  const defaults = { ...DEFAULT_SPEEDS };
  saveSpeedSettings(defaults);
  return defaults;
}

/**
 * Reset cost settings to defaults
 */
export function resetCostSettings(): CostSettings {
  const defaults = { ...DEFAULT_COSTS };
  saveCostSettings(defaults);
  return defaults;
}

/**
 * Reset both speed and cost settings to defaults
 */
export function resetTransportSettings(): TransportSettings {
  const speeds = resetSpeedSettings();
  const costs = resetCostSettings();
  return { speeds, costs };
}

/**
 * Get speed for a specific travel mode
 */
export function getSpeedForMode(mode: keyof SpeedSettings): number {
  const settings = loadSpeedSettings();
  return settings[mode] || DEFAULT_SPEEDS[mode];
}

/**
 * Get cost per km for a specific travel mode
 */
export function getCostForMode(mode: keyof CostSettings): number {
  const settings = loadCostSettings();
  return settings[mode] || DEFAULT_COSTS[mode];
}

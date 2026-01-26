export interface SpeedSettings {
  driving: number;
  walking: number;
  cycling: number;
  transit: number;
  plane: number;
  boat: number;
  'container-ship': number;
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

const STORAGE_KEY = 'front-openstreetmap-speed-settings';

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
 * Reset speed settings to defaults
 */
export function resetSpeedSettings(): SpeedSettings {
  const defaults = { ...DEFAULT_SPEEDS };
  saveSpeedSettings(defaults);
  return defaults;
}

/**
 * Get speed for a specific travel mode
 */
export function getSpeedForMode(mode: keyof SpeedSettings): number {
  const settings = loadSpeedSettings();
  return settings[mode] || DEFAULT_SPEEDS[mode];
}

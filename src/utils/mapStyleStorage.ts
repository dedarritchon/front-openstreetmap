import { type MapStyle } from '../components/MapComponent';

const STORAGE_KEY = 'front-openstreetmap-map-style';

const DEFAULT_MAP_STYLE: MapStyle = 'standard';

/**
 * Load map style from localStorage, or return default
 */
export function loadMapStyle(): MapStyle {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const style = stored as MapStyle;
      // Validate that it's a valid map style
      if (style === 'standard' || style === 'terrain' || style === 'satellite') {
        return style;
      }
    }
  } catch (error) {
    console.error('Error loading map style:', error);
  }
  return DEFAULT_MAP_STYLE;
}

/**
 * Save map style to localStorage
 */
export function saveMapStyle(style: MapStyle): void {
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch (error) {
    console.error('Error saving map style:', error);
  }
}

import type { DetectedLocation } from '../types/locations';

const STORAGE_KEY = 'front-googlemaps-locations';

/**
 * Save locations to localStorage
 */
export const saveLocations = (locations: DetectedLocation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch (error) {
    console.error('Error saving locations to localStorage:', error);
  }
};

/**
 * Load locations from localStorage
 */
export const loadLocations = (): DetectedLocation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const locations = JSON.parse(stored) as DetectedLocation[];
    return locations;
  } catch (error) {
    console.error('Error loading locations from localStorage:', error);
    return [];
  }
};

/**
 * Clear all locations from localStorage
 */
export const clearStoredLocations = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing locations from localStorage:', error);
  }
};

/**
 * Check if two locations are duplicates based on coordinates
 * Uses a tolerance of 0.0001 degrees (~11 meters)
 * Only considers them duplicates if they're from the same message
 */
export const areLocationsDuplicate = (
  loc1: DetectedLocation,
  loc2: DetectedLocation
): boolean => {
  // If IDs are the same, they're definitely duplicates
  if (loc1.id === loc2.id) {
    return true;
  }
  
  // If they're from different messages, they're not duplicates (preserve distinct inputs)
  if (loc1.messageId && loc2.messageId && loc1.messageId !== loc2.messageId) {
    return false;
  }
  
  // If they have different original text/address, they're not duplicates
  if (loc1.text !== loc2.text && loc1.address !== loc2.address) {
    return false;
  }
  
  // Only check coordinates if both have them
  if (!loc1.coordinates || !loc2.coordinates) {
    return false;
  }
  
  // Check if coordinates are very close (within ~11 meters)
  const latDiff = Math.abs(loc1.coordinates.lat - loc2.coordinates.lat);
  const lngDiff = Math.abs(loc1.coordinates.lng - loc2.coordinates.lng);
  
  // Only consider duplicates if coordinates are very close AND they have the same original input
  const coordinatesClose = latDiff < 0.0001 && lngDiff < 0.0001;
  const sameOriginalText =
    loc1.text === loc2.text ||
    Boolean(loc1.address && loc2.address && loc1.address === loc2.address);

  return coordinatesClose && sameOriginalText;
};

/**
 * Deduplicate an array of locations
 * Keeps all locations with unique IDs, preserving distinct inputs even if they geocode to the same place
 * Only deduplicates if locations are from the same message AND have the same original input AND very close coordinates
 */
export const deduplicateLocations = (
  locations: DetectedLocation[]
): DetectedLocation[] => {
  const unique: DetectedLocation[] = [];
  const seenIds = new Set<string>();
  
  for (const location of locations) {
    // Skip if we've already seen this exact ID (shouldn't happen with new ID generation, but safety check)
    if (seenIds.has(location.id)) {
      console.log(`🔄 Skipped location with duplicate ID: ${location.id}`);
      continue;
    }
    
    seenIds.add(location.id);
    
    // Check if this is a true duplicate (same message + same coordinates + same text)
    // Locations from different messages are always kept, even if they geocode to the same place
    const isDuplicate = unique.some(existing => 
      areLocationsDuplicate(existing, location)
    );
    
    if (!isDuplicate) {
      unique.push(location);
    } else {
      console.log(`🔄 Skipped duplicate location (ID: ${location.id}): ${location.formattedAddress || location.text || location.address}`);
    }
  }
  
  return unique;
};

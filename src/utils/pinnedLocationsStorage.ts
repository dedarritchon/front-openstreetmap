const STORAGE_KEY = 'pinnedLocations';

export interface PinnedLocation {
  lat: number;
  lng: number;
  id: string;
  text: string;
  address?: string;
  pinnedAt: number; // timestamp
}

export const loadPinnedLocations = (): PinnedLocation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading pinned locations:', error);
  }
  return [];
};

export const savePinnedLocations = (locations: PinnedLocation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch (error) {
    console.error('Error saving pinned locations:', error);
  }
};

export const addPinnedLocation = (location: Omit<PinnedLocation, 'pinnedAt'>): void => {
  const pinned = loadPinnedLocations();
  const newLocation: PinnedLocation = {
    ...location,
    pinnedAt: Date.now(),
  };
  
  // Check if already pinned (by id or coordinates)
  const isDuplicate = pinned.some(
    (p) =>
      p.id === location.id ||
      (Math.abs(p.lat - location.lat) < 0.0001 && Math.abs(p.lng - location.lng) < 0.0001)
  );
  
  if (!isDuplicate) {
    pinned.push(newLocation);
    savePinnedLocations(pinned);
    console.log('✅ Location pinned:', location.address || `${location.lat}, ${location.lng}`);
  } else {
    console.log('ℹ️  Location already pinned');
  }
};

export const removePinnedLocation = (locationId: string): void => {
  const pinned = loadPinnedLocations();
  const filtered = pinned.filter((p) => p.id !== locationId);
  savePinnedLocations(filtered);
  console.log('✅ Location unpinned');
};

export const isLocationPinned = (locationId: string, lat: number, lng: number): boolean => {
  const pinned = loadPinnedLocations();
  return pinned.some(
    (p) =>
      p.id === locationId ||
      (Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lng - lng) < 0.0001)
  );
};

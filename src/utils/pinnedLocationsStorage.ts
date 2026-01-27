const STORAGE_KEY = 'pinnedLocations';

export interface PinnedLocation {
  lat: number;
  lng: number;
  id: string;
  text: string;
  address?: string;
  name?: string; // user-editable display name (defaults to address || text)
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
    const withName = { ...newLocation, name: newLocation.name ?? newLocation.address ?? newLocation.text };
    pinned.push(withName);
    savePinnedLocations(pinned);
    console.log('✅ Location pinned:', withName.name || `${location.lat}, ${location.lng}`);
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

export const updatePinnedLocation = (locationId: string, updates: Partial<Pick<PinnedLocation, 'name' | 'address' | 'text'>>): void => {
  console.log('🔄 updatePinnedLocation called for:', locationId, 'with updates:', updates);
  const pinned = loadPinnedLocations();
  const index = pinned.findIndex((p) => p.id === locationId);
  
  if (index === -1) {
    console.log('⚠️  Location not found in storage:', locationId);
    return;
  }
  
  console.log('📍 Current location before update:', JSON.stringify(pinned[index]));
  
  // Update the location with new values
  pinned[index] = { ...pinned[index], ...updates };
  
  // If address was updated and name hasn't been manually set (i.e., it's still the temp coordinate text),
  // update the name to use the new address
  if (updates.address && pinned[index].name && pinned[index].name.startsWith('Location at ')) {
    console.log('🔄 Updating name from temp text to address:', updates.address);
    pinned[index].name = updates.address;
  }
  
  console.log('📍 Location after update:', JSON.stringify(pinned[index]));
  
  savePinnedLocations(pinned);
  console.log('✅ Location updated and saved:', pinned[index].name || `${pinned[index].lat}, ${pinned[index].lng}`);
};

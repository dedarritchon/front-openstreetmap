import { useEffect, useState } from 'react';
import {
  loadPinnedLocations,
  addPinnedLocation,
  removePinnedLocation,
  updatePinnedLocation,
  isLocationPinned,
  type PinnedLocation,
} from '../utils/pinnedLocationsStorage';
import type { Coordinate } from './useLocationDetection';

export const usePinnedLocations = (conversationId?: string) => {
  const [pinnedLocations, setPinnedLocations] = useState<PinnedLocation[]>([]);

  // Load pinned locations on mount
  useEffect(() => {
    const pinned = loadPinnedLocations();
    console.log(`📌 Loaded ${pinned.length} pinned location(s) from localStorage`);
    setPinnedLocations(pinned);
  }, []);

  // Listen for pinned locations updates
  useEffect(() => {
    const handlePinnedLocationsUpdate = () => {
      const pinned = loadPinnedLocations();
      console.log(`📌 Pinned locations updated: ${pinned.length} location(s)`);
      setPinnedLocations(pinned);
    };
    
    window.addEventListener('pinnedLocationsUpdated', handlePinnedLocationsUpdate);
    
    return () => {
      window.removeEventListener('pinnedLocationsUpdated', handlePinnedLocationsUpdate);
    };
  }, []);

  const handlePinLocation = (location: Coordinate) => {
    addPinnedLocation({ ...location, conversationId });
    const pinned = loadPinnedLocations();
    setPinnedLocations(pinned);
  };

  const handleUnpinLocation = (locationId: string) => {
    removePinnedLocation(locationId);
    const pinned = loadPinnedLocations();
    setPinnedLocations(pinned);
    window.dispatchEvent(new CustomEvent('pinnedLocationsUpdated'));
  };

  const handleUpdatePinnedLocation = (locationId: string, updates: Partial<Pick<PinnedLocation, 'name' | 'address' | 'text'>>) => {
    updatePinnedLocation(locationId, updates);
    const pinned = loadPinnedLocations();
    setPinnedLocations(pinned);
    window.dispatchEvent(new CustomEvent('pinnedLocationsUpdated'));
  };

  const checkIsPinned = (locationId: string, lat: number, lng: number) => {
    return isLocationPinned(locationId, lat, lng);
  };

  return {
    pinnedLocations,
    handlePinLocation,
    handleUnpinLocation,
    handleUpdatePinnedLocation,
    checkIsPinned,
  };
};

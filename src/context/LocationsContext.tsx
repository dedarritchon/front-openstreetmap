import L from 'leaflet';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import type { ConversationMessage, DetectedLocation, LocationsState } from '../types/locations';
import { detectAllLocations, extractPlaceFromMapsUrl, geocodeAddress, resolveShortenedMapsLink, reverseGeocode } from '../utils/locationDetection';
import { areLocationsDuplicate, deduplicateLocations, loadLocations, saveLocations } from '../utils/locationsStorage';

interface LocationsContextType {
  state: LocationsState;
  addLocationsFromMessages: (messages: ConversationMessage[], map: L.Map | null, conversationId?: string) => Promise<void>;
  addLocation: (location: DetectedLocation) => void;
  removeLocation: (locationId: string, fromSaved?: boolean) => void;
  saveLocation: (locationId: string) => void;
  clearLocations: () => void;
  reverseGeocodeLocation: (lat: number, lng: number) => Promise<string | null>;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

export const LocationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  
  const [state, setState] = useState<LocationsState>(() => {
    // Initialize saved locations from localStorage
    const storedLocations = loadLocations();
    return {
      conversationLocations: [],
      savedLocations: storedLocations,
      isLoading: false,
      error: null,
    };
  });

  // Save only savedLocations to localStorage whenever they change
  useEffect(() => {
    saveLocations(state.savedLocations);
  }, [state.savedLocations]);

  const addLocationsFromMessages = async (
    messages: ConversationMessage[],
    map: L.Map | null,
    conversationId?: string
  ) => {
    // If conversation changed, clear conversation locations
    if (conversationId && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
      setState(prev => ({
        ...prev,
        conversationLocations: [],
      }));
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const detectedLocations: DetectedLocation[] = [];

      console.log(`📊 Scanning ${messages.length} messages/comments for locations...`);

      // Detect locations from all messages
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        console.log(`\n📧 [${i + 1}/${messages.length}] Analyzing message from ${message.author || 'Unknown'}:`);
        console.log(`  Content: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`);
        
        const locations = detectAllLocations(
          message.content,
          message.id,
          message.timestamp,
          message.author
        );
        
        if (locations.length === 0) {
          console.log(`  ℹ️  No locations found in this message`);
        }
        
        detectedLocations.push(...locations);
      }

      console.log(`\n✅ Total locations detected: ${detectedLocations.length}`);

      // Geocode addresses to get coordinates
      if (map) {
        console.log('🌍 Resolving locations to coordinates...');
        
        for (const location of detectedLocations) {
          // Handle addresses
          if (location.type === 'address' && location.address && !location.coordinates) {
            console.log(`  🔄 Geocoding address: "${location.address}"`);
            const coords = await geocodeAddress(location.address);
            if (coords) {
              console.log(`    ✅ Resolved to: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
              location.coordinates = coords;
            } else {
              console.log(`    ❌ Failed to geocode address`);
            }
          }
          
          // Handle maps links without coordinates
          if (location.type === 'maps_link' && !location.coordinates) {
            // Check if it's a shortened URL (goo.gl)
            if (location.text.includes('goo.gl')) {
              console.log(`  🔄 Resolving shortened URL: "${location.text}"`);
              const result = await resolveShortenedMapsLink(location.text);
              if (result) {
                console.log(`    ✅ Resolved to: ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`);
                location.coordinates = { lat: result.lat, lng: result.lng };
              } else {
                console.log(`    ⚠️  Could not resolve shortened URL automatically`);
                console.log(`    💡 Tip: Click the link to open it in Google Maps`);
                // Don't fail - try to extract place from the URL if it was redirected
                const coords = await extractPlaceFromMapsUrl(location.text, map);
                if (coords) {
                  console.log(`    ✅ Found place in URL: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                  location.coordinates = coords;
                }
              }
            } else {
              console.log(`  🔄 Extracting place from Maps URL: "${location.text}"`);
              // Try to extract place from regular Maps URL
              const coords = await extractPlaceFromMapsUrl(location.text, map);
              if (coords) {
                console.log(`    ✅ Resolved to: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                location.coordinates = coords;
              } else {
                // Last resort: geocode the entire URL
                console.log(`    🔄 Trying geocode fallback...`);
                const coords = await geocodeAddress(location.text);
                if (coords) {
                  console.log(`    ✅ Resolved to: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                  location.coordinates = coords;
                } else {
                  console.log(`    ❌ Failed to resolve Maps URL`);
                }
              }
            }
          }
        }
      }

      // Filter out locations without coordinates
      const validLocations = detectedLocations.filter(loc => loc.coordinates);
      const invalidCount = detectedLocations.length - validLocations.length;

      // Reverse geocode coordinates to get formatted addresses
      console.log('\n🏠 Reverse geocoding coordinates to addresses...');
      for (const location of validLocations) {
        // Skip if we already have a formatted address (from ADDRESS: prefix)
        if (location.formattedAddress || location.type === 'address') {
          if (location.address) {
            location.formattedAddress = location.address;
          }
          continue;
        }
        
        // Reverse geocode for coordinates and maps links
        if (location.coordinates && (location.type === 'coordinates' || location.type === 'maps_link')) {
          console.log(`  🔄 Reverse geocoding: ${location.coordinates.lat.toFixed(6)}, ${location.coordinates.lng.toFixed(6)}`);
          const address = await reverseGeocode(location.coordinates.lat, location.coordinates.lng);
          if (address) {
            console.log(`    ✅ Address: ${address}`);
            location.formattedAddress = address;
          } else {
            console.log(`    ⚠️  Could not get address`);
          }
        }
      }

      console.log(`\n📊 Final Results:`);
      console.log(`✅ Successfully resolved ${validLocations.length} location(s)`);
      if (validLocations.length > 0) {
        validLocations.forEach((loc, i) => {
          console.log(`   [${i + 1}] ${loc.type}: ${loc.formattedAddress || loc.text}`);
          console.log(`       → Lat: ${loc.coordinates!.lat}, Lng: ${loc.coordinates!.lng}`);
        });
      }
      if (invalidCount > 0) {
        console.log(`⚠️  Could not resolve ${invalidCount} location(s)`);
      }

      // Merge with existing conversation locations and deduplicate
      // Also check against saved locations to avoid duplicates
      setState(prev => {
        const mergedLocations = [...prev.conversationLocations, ...validLocations];
        
        // Deduplicate within conversation locations first
        const deduplicatedConversation = deduplicateLocations(mergedLocations);
        
        // Then filter out any that are duplicates of saved locations
        const finalConversationLocations = deduplicatedConversation.filter(newLoc => {
          return !prev.savedLocations.some(saved => 
            areLocationsDuplicate(saved, newLoc)
          );
        });
        
        const newCount = finalConversationLocations.length - prev.conversationLocations.length;
        if (newCount > 0) {
          console.log(`✅ Added ${newCount} new location(s) (${validLocations.length - newCount} were duplicates)`);
        } else {
          console.log(`ℹ️  All detected locations were duplicates`);
        }
        
        return {
          ...prev,
          conversationLocations: finalConversationLocations,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error('Error processing locations:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to detect locations',
        isLoading: false,
      }));
    }
  };

  const removeLocation = (locationId: string, fromSaved: boolean = false) => {
    setState(prev => {
      if (fromSaved) {
        return {
          ...prev,
          savedLocations: prev.savedLocations.filter(loc => loc.id !== locationId),
        };
      } else {
        return {
          ...prev,
          conversationLocations: prev.conversationLocations.filter(loc => loc.id !== locationId),
        };
      }
    });
  };

  const saveLocation = (locationId: string) => {
    setState(prev => {
      // Find the location in conversation locations
      const location = prev.conversationLocations.find(loc => loc.id === locationId);
      if (!location) {
        console.log(`⚠️  Location not found: ${locationId}`);
        return prev;
      }

      // Check if it's already in saved locations (duplicate check)
      const isDuplicate = prev.savedLocations.some(existing => 
        areLocationsDuplicate(existing, location)
      );
      
      if (isDuplicate) {
        console.log(`🔄 Location already saved: ${location.formattedAddress || location.text}`);
        // Remove from conversation locations anyway
        return {
          ...prev,
          conversationLocations: prev.conversationLocations.filter(loc => loc.id !== locationId),
        };
      }
      
      console.log(`✅ Saved location: ${location.formattedAddress || location.text}`);
      return {
        ...prev,
        savedLocations: [...prev.savedLocations, location],
        conversationLocations: prev.conversationLocations.filter(loc => loc.id !== locationId),
      };
    });
  };

  const addLocation = (location: DetectedLocation) => {
    setState(prev => {
      // Check if location is a duplicate in conversation locations
      const isDuplicate = prev.conversationLocations.some(existing => 
        areLocationsDuplicate(existing, location)
      );
      
      if (isDuplicate) {
        console.log(`🔄 Skipped duplicate location: ${location.formattedAddress || location.text}`);
        return prev;
      }
      
      console.log(`✅ Added new location: ${location.formattedAddress || location.text}`);
      return {
        ...prev,
        conversationLocations: [...prev.conversationLocations, location],
      };
    });
  };

  const reverseGeocodeLocation = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const address = await reverseGeocode(lat, lng);
      return address;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  };

  const clearLocations = () => {
    setState(prev => ({
      ...prev,
      conversationLocations: [],
    }));
  };

  const value: LocationsContextType = {
    state,
    addLocationsFromMessages,
    addLocation,
    removeLocation,
    saveLocation,
    clearLocations,
    reverseGeocodeLocation,
  };

  return (
    <LocationsContext.Provider value={value}>
      {children}
    </LocationsContext.Provider>
  );
};

export const useLocationsContext = (): LocationsContextType => {
  const context = useContext(LocationsContext);
  if (!context) {
    throw new Error('useLocationsContext must be used within LocationsProvider');
  }
  return context;
};

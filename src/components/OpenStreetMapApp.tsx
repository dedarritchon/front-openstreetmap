import L from 'leaflet';
import { useEffect, useState, useRef, useCallback } from 'react';
import styled from 'styled-components';

import MapComponent, { type MapStyle } from './MapComponent';
import { useFrontContext } from '../hooks/useFrontContext';
import { detectCoordinates, detectAddresses, geocodeAddress, reverseGeocode } from '../utils/locationDetection';
import {
  loadPinnedLocations,
  addPinnedLocation,
  removePinnedLocation,
  isLocationPinned,
  type PinnedLocation,
} from '../utils/pinnedLocationsStorage';
import LocationsList from './LocationsList';
import DirectionsPanel from './DirectionsPanel';
import SavedRoutesList from './SavedRoutesList';
import { loadSavedRoutes, type SavedRoute } from '../utils/savedRoutesStorage';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
`;

const Header = styled.div`
  background: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  /* Keep header + dropdown above Leaflet panes/controls */
  z-index: 2500;
`;

const LocationCountButton = styled.button`
  margin-left: auto;
  font-size: 14px;
  color: #666;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    color: #667eea;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
`;

const MapSection = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SelectionBanner = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  font-weight: 500;
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  gap: 8px;
  animation: ${props => props.$visible ? 'slideDown 0.3s ease-out' : 'none'};
  pointer-events: none;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;

const SelectionBannerIcon = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const EmptyStateMessage = styled.div`
  margin-left: auto;
  font-size: 14px;
  color: #666;
  padding: 8px 12px;
  border-radius: 6px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 400px;
  position: relative;
  margin: 0 16px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  padding-right: 36px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #999;
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
`;

const SearchDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 3000;
`;

const SearchResultItem = styled.div`
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const SearchResultName = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
`;

const SearchResultDetails = styled.div`
  font-size: 12px;
  color: #666;
`;

interface Coordinate {
  lat: number;
  lng: number;
  id: string;
  text: string;
  address?: string;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: number;
}

const OpenStreetMapApp = () => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [pinnedLocations, setPinnedLocations] = useState<PinnedLocation[]>([]);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const [showListView, setShowListView] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [isSelectingPoints, setIsSelectingPoints] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [visibleRouteIds, setVisibleRouteIds] = useState<Set<string>>(new Set());
  const [showSavedRoutesList, setShowSavedRoutesList] = useState(false);
  const [selectedSavedRoute, setSelectedSavedRoute] = useState<SavedRoute | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');

  // Helper functions to ensure only one panel is open at a time
  const openListView = useCallback((open: boolean) => {
    setShowListView(open);
    if (open) {
      setShowDirections(false);
      setShowSavedRoutesList(false);
    }
  }, []);

  const openDirections = useCallback((open: boolean) => {
    setShowDirections(open);
    if (open) {
      setShowListView(false);
      setShowSavedRoutesList(false);
    }
  }, []);

  const openSavedRoutesList = useCallback((open: boolean) => {
    setShowSavedRoutesList(open);
    if (open) {
      setShowListView(false);
      setShowDirections(false);
    }
  }, []);
  const savedRoutePolylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const showListViewRef = useRef(showListView);
  const showDirectionsRef = useRef(showDirections);
  
  // Keep refs in sync with state
  useEffect(() => {
    showListViewRef.current = showListView;
    showDirectionsRef.current = showDirections;
  }, [showListView, showDirections]);
  
  // Listen for selection mode changes from DirectionsPanel
  useEffect(() => {
    const handleSelectionModeChange = (event: CustomEvent) => {
      setIsSelectingPoints(event.detail);
    };
    
    window.addEventListener('selectionModeChanged', handleSelectionModeChange as EventListener);
    
    return () => {
      window.removeEventListener('selectionModeChanged', handleSelectionModeChange as EventListener);
    };
  }, []);

  // Load saved routes on mount and listen for updates
  useEffect(() => {
    const loadRoutes = () => {
      const routes = loadSavedRoutes();
      setSavedRoutes(routes);
      // Show all routes by default
      setVisibleRouteIds(new Set(routes.map(r => r.id)));
    };
    
    loadRoutes();
    
    const handleRoutesUpdate = () => {
      loadRoutes();
    };
    
    window.addEventListener('savedRoutesUpdated', handleRoutesUpdate);
    
    return () => {
      window.removeEventListener('savedRoutesUpdated', handleRoutesUpdate);
    };
  }, []);

  // Render saved routes on map
  useEffect(() => {
    if (!map) return;

    // Remove all existing saved route polylines
    savedRoutePolylinesRef.current.forEach((polyline) => {
      polyline.remove();
    });
    savedRoutePolylinesRef.current.clear();

    // Render visible saved routes
    savedRoutes.forEach((route) => {
      if (!visibleRouteIds.has(route.id)) return;

      try {
        const polyline = L.polyline(route.geometry as L.LatLngExpression[], {
          color: route.color,
          weight: 4,
          opacity: 0.7,
          interactive: true,
          dashArray: route.travelMode === 'plane' ? '10, 10' : undefined,
        }).addTo(map);

        // Add popup with route info
        const popupContent = `
          <div style="padding: 8px; min-width: 200px;">
            <strong>📍 ${route.name}</strong><br/>
            <small style="color: #666;">${route.travelMode.charAt(0).toUpperCase() + route.travelMode.slice(1)}</small><br/>
            <small style="color: #666;">${route.routeInfo.distance} • ${route.routeInfo.duration}</small>
          </div>
        `;
        polyline.bindPopup(popupContent);

        savedRoutePolylinesRef.current.set(route.id, polyline);
      } catch (error) {
        console.error(`Error rendering saved route ${route.id}:`, error);
      }
    });

    // Cleanup
    return () => {
      savedRoutePolylinesRef.current.forEach((polyline) => {
        polyline.remove();
      });
      savedRoutePolylinesRef.current.clear();
    };
  }, [map, savedRoutes, visibleRouteIds]);

  // Handle route visibility toggle
  const handleRouteToggle = useCallback((routeId: string, visible: boolean) => {
    setVisibleRouteIds(prev => {
      const newSet = new Set(prev);
      if (visible) {
        newSet.add(routeId);
      } else {
        newSet.delete(routeId);
      }
      return newSet;
    });
  }, []);

  // Listen for clear saved route selection event
  useEffect(() => {
    const handleClearSelection = () => {
      setSelectedSavedRoute(null);
    };
    
    window.addEventListener('clearSavedRouteSelection', handleClearSelection);
    
    return () => {
      window.removeEventListener('clearSavedRouteSelection', handleClearSelection);
    };
  }, []);
  
  // Listen for event to show directions panel
  useEffect(() => {
    const handleShowDirections = () => {
      console.log('Event received to show directions panel');
      openDirections(true);
    };
    
    window.addEventListener('showDirectionsPanel', handleShowDirections);
    
    return () => {
      window.removeEventListener('showDirectionsPanel', handleShowDirections);
    };
  }, [openDirections]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const frontContext = useFrontContext();

  // Load pinned locations on mount
  useEffect(() => {
    const pinned = loadPinnedLocations();
    console.log(`📌 Loaded ${pinned.length} pinned location(s) from localStorage`);
    setPinnedLocations(pinned);
  }, []);

  // Fetch messages and detect coordinates
  useEffect(() => {
    const fetchMessagesAndDetectCoordinates = async () => {
      if (!frontContext || frontContext.type !== 'singleConversation') {
        console.log('📭 No front context or not a single conversation');
        setIsLoadingLocations(false);
        return;
      }

      const conversationId = frontContext.conversation?.id;
      if (!conversationId) {
        console.log('📭 No conversation ID');
        setIsLoadingLocations(false);
        return;
      }

      console.log('🔍 Starting to fetch conversation messages...', { conversationId });

      setIsLoadingLocations(true);
      try {
        const allMessages: any[] = [];
        const allComments: any[] = [];
        let nextPaginationToken: any = undefined;

        // Paginate through all messages
        do {
          console.log('📥 Fetching messages page...', { hasToken: !!nextPaginationToken });
          const messageList = await frontContext.listMessages(nextPaginationToken);
          console.log(`✅ Fetched ${messageList.results.length} messages in this page`);
          allMessages.push(...messageList.results);
          nextPaginationToken = messageList.nextPageToken;
        } while (nextPaginationToken);

        console.log(`✅ Total messages fetched: ${allMessages.length}`);

        // Paginate through all comments
        console.log('🔍 Starting to fetch conversation comments...');
        nextPaginationToken = undefined;
        do {
          console.log('📥 Fetching comments page...', { hasToken: !!nextPaginationToken });
          const commentList = await frontContext.listComments(nextPaginationToken);
          console.log(`✅ Fetched ${commentList.results.length} comments in this page`);
          allComments.push(...commentList.results);
          nextPaginationToken = commentList.nextPageToken;
        } while (nextPaginationToken);

        console.log(`✅ Total comments fetched: ${allComments.length}`);

        // Convert messages to text format
        const allContent = [
          ...allMessages.map((msg, idx) => {
            let textContent = '';
            if (msg.content?.body && typeof msg.content.body === 'string') {
              textContent = msg.content.body;
            } else if (msg.body && typeof msg.body === 'string') {
              textContent = msg.body;
            } else if (msg.text && typeof msg.text === 'string') {
              textContent = msg.text;
            }
            
            // Strip HTML tags
            if (textContent) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = textContent;
              textContent = tempDiv.textContent || tempDiv.innerText || '';
            }
            
            console.log(`📧 Message ${idx + 1}:`, {
              id: msg.id,
              preview: textContent.substring(0, 100),
              length: textContent.length,
            });
            
            return textContent;
          }),
          ...allComments.map((comment, idx) => {
            let textContent = '';
            if (comment.body && typeof comment.body === 'string') {
              textContent = comment.body;
            } else if (comment.content?.body && typeof comment.content.body === 'string') {
              textContent = comment.content.body;
            } else if (comment.text && typeof comment.text === 'string') {
              textContent = comment.text;
            }
            
            // Strip HTML tags
            if (textContent) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = textContent;
              textContent = tempDiv.textContent || tempDiv.innerText || '';
            }
            
            console.log(`💬 Comment ${idx + 1}:`, {
              id: comment.id,
              preview: textContent.substring(0, 100),
              length: textContent.length,
            });
            
            return textContent;
          }),
        ];

        console.log(`📝 Total content items to analyze: ${allContent.length}`);

        // Detect coordinates and addresses from all content
        const detectedCoords: Coordinate[] = [];
        const detectedAddresses: { address: string; id: string; text: string }[] = [];
        
        allContent.forEach((text, index) => {
          if (!text || text.trim().length === 0) return;
          
          console.log(`🔍 Analyzing content item ${index + 1}:`, {
            text: text.substring(0, 200),
            fullLength: text.length,
          });
          
          // Detect coordinates
          const coordLocations = detectCoordinates(text);
          if (coordLocations.length > 0) {
            console.log(`  ✅ Found ${coordLocations.length} coordinate(s) in item ${index + 1}`);
            coordLocations.forEach((loc) => {
              if (loc.coordinates) {
                detectedCoords.push({
                  lat: loc.coordinates.lat,
                  lng: loc.coordinates.lng,
                  id: loc.id,
                  text: loc.text,
                });
                console.log(`    📍 Coordinate: ${loc.coordinates.lat}, ${loc.coordinates.lng} (from: "${loc.text}")`);
              }
            });
          }
          
          // Detect addresses with ADDRESS: or DIRECTION: prefix
          const addressLocations = detectAddresses(text);
          if (addressLocations.length > 0) {
            console.log(`  ✅ Found ${addressLocations.length} address(es) in item ${index + 1}`);
            addressLocations.forEach((loc) => {
              if (loc.address) {
                detectedAddresses.push({
                  address: loc.address,
                  id: loc.id,
                  text: loc.text,
                });
                console.log(`    🏠 Address: ${loc.address} (from: "${loc.text}")`);
              }
            });
          }
          
          if (coordLocations.length === 0 && addressLocations.length === 0) {
            console.log(`  ℹ️  No coordinates or addresses found in item ${index + 1}`);
          }
        });

        console.log(`🎯 Total coordinates detected: ${detectedCoords.length}`);
        console.log(`🏠 Total addresses detected: ${detectedAddresses.length}`);
        
        // Deduplicate coordinates (same lat/lng within small tolerance)
        const uniqueCoords: Coordinate[] = [];
        const seenCoords = new Set<string>();
        
        detectedCoords.forEach((coord) => {
          const key = `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`;
          if (!seenCoords.has(key)) {
            seenCoords.add(key);
            uniqueCoords.push(coord);
          } else {
            console.log(`  🔄 Skipping duplicate coordinate: ${coord.lat}, ${coord.lng}`);
          }
        });
        
        console.log(`✅ After deduplication: ${uniqueCoords.length} unique coordinates`);
        
        // Geocode addresses to get coordinates (with rate limiting for Nominatim)
        if (detectedAddresses.length > 0) {
          console.log('🌍 Starting geocoding addresses...');
          const geocodedAddresses: (Coordinate | null)[] = [];
          
          // Process addresses one at a time with delay to respect Nominatim rate limit (1 req/sec)
          for (let index = 0; index < detectedAddresses.length; index++) {
            const addr = detectedAddresses[index];
            console.log(`  🔄 Geocoding address ${index + 1}/${detectedAddresses.length}: "${addr.address}"`);
            
            // Add delay between requests (except for the first one)
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 seconds between requests
            }
            
            try {
              const coords = await geocodeAddress(addr.address);
              if (coords) {
                console.log(`    ✅ Geocoded to: ${coords.lat}, ${coords.lng}`);
                geocodedAddresses.push({
                  lat: coords.lat,
                  lng: coords.lng,
                  id: addr.id,
                  text: addr.text,
                  address: addr.address,
                });
              } else {
                console.log(`    ⚠️  Could not geocode address`);
                geocodedAddresses.push(null);
              }
            } catch (error) {
              console.error(`    ❌ Error geocoding:`, error);
              geocodedAddresses.push(null);
            }
          }
          
          // Add successfully geocoded addresses to coordinates list (check for duplicates)
          const validGeocoded = geocodedAddresses.filter((addr): addr is Coordinate => addr !== null);
          console.log(`✅ Successfully geocoded ${validGeocoded.length}/${detectedAddresses.length} addresses`);
          
          validGeocoded.forEach((coord) => {
            const key = `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`;
            if (!seenCoords.has(key)) {
              seenCoords.add(key);
              uniqueCoords.push(coord);
            } else {
              console.log(`  🔄 Skipping duplicate geocoded coordinate: ${coord.lat}, ${coord.lng}`);
            }
          });
        }
        
        // Update detectedCoords to use deduplicated list
        const finalCoords = uniqueCoords;
        
        // Reverse geocode coordinates that don't already have addresses (i.e., those detected as coordinates, not geocoded from addresses)
        const coordsNeedingAddresses = finalCoords.filter(c => !c.address);
        if (coordsNeedingAddresses.length > 0) {
          console.log('🏠 Starting reverse geocoding for coordinates...');
          const coordsWithAddresses = await Promise.all(
            coordsNeedingAddresses.map(async (coord, index) => {
              console.log(`  🔄 Reverse geocoding coordinate ${index + 1}/${coordsNeedingAddresses.length}: ${coord.lat}, ${coord.lng}`);
              try {
                const address = await reverseGeocode(coord.lat, coord.lng);
                if (address) {
                  console.log(`    ✅ Address: ${address}`);
                  return { ...coord, address };
                } else {
                  console.log(`    ⚠️  No address found`);
                  return coord;
                }
              } catch (error) {
                console.error(`    ❌ Error reverse geocoding:`, error);
                return coord;
              }
            })
          );
          
          // Update coordinates that were reverse geocoded
          const updatedCoords = finalCoords.map(coord => {
            const updated = coordsWithAddresses.find(c => c.id === coord.id);
            return updated || coord;
          });
          
          console.log(`✅ Reverse geocoding complete. ${updatedCoords.filter(c => c.address).length} addresses found.`);
          setCoordinates(updatedCoords);
        } else {
          // All coordinates already have addresses (from geocoding)
          console.log('✅ All coordinates already have addresses');
          setCoordinates(finalCoords);
        }
      } catch (err) {
        console.error('❌ Error fetching messages and comments:', err);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    if (frontContext) {
      fetchMessagesAndDetectCoordinates();
    }
  }, [frontContext]);

  // Handle pin location
  const handlePinLocation = (location: Coordinate) => {
    addPinnedLocation(location);
    const pinned = loadPinnedLocations();
    setPinnedLocations(pinned);
    // Remove from conversation locations when saved
    setCoordinates(prev => prev.filter(c => c.id !== location.id));
  };

  // Handle unpin location
  const handleUnpinLocation = (locationId: string) => {
    removePinnedLocation(locationId);
    const pinned = loadPinnedLocations();
    setPinnedLocations(pinned);
  };

  // Search for locations using Nominatim
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=10&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FrontMapsApp/1.0',
        },
      });

      if (!response.ok) {
        console.error('Search request failed:', response.status);
        setSearchResults([]);
        setShowSearchDropdown(false);
        setIsSearching(false);
        return;
      }

      const results: SearchResult[] = await response.json();
      console.log(`🔍 Found ${results.length} search results for: "${query}"`);
      
      setSearchResults(results);
      setShowSearchDropdown(results.length > 0);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
      setShowSearchDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search result selection
  const handleSearchResultClick = useCallback((result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    const locationToSave: Coordinate = {
      lat,
      lng,
      id: `search-${result.place_id}-${Date.now()}`,
      text: result.display_name,
      address: result.display_name,
    };
    
    handlePinLocation(locationToSave);
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
    
    // Center map on the saved location
    if (map) {
      map.setView([lat, lng], 15);
    }
  }, [map, handlePinLocation]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(value);
      }, 500); // 500ms debounce
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchLocations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add markers to map when coordinates, pinned locations, or map changes
  useEffect(() => {
    if (!map) {
      console.log('🗺️ Map not ready');
      return;
    }

    // Combine current conversation locations and pinned locations with deduplication
    console.log(`📊 Before deduplication: ${coordinates.length} conversation coordinates, ${pinnedLocations.length} pinned locations`);
    coordinates.forEach((c, i) => {
      console.log(`  Conversation coord ${i + 1}: ${c.lat}, ${c.lng} (${c.address || c.text})`);
    });
    
    const allLocationsMap = new Map<string, Coordinate>();
    
    // Add current conversation coordinates
    coordinates.forEach((coord) => {
      const key = `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`;
      if (!allLocationsMap.has(key)) {
        allLocationsMap.set(key, coord);
        console.log(`  ✅ Added conversation coordinate: ${coord.lat}, ${coord.lng}`);
      } else {
        console.log(`  🔄 Skipping duplicate coordinate in marker creation: ${coord.lat}, ${coord.lng} (existing: ${allLocationsMap.get(key)?.address || allLocationsMap.get(key)?.text})`);
      }
    });
    
    // Add pinned locations (they take precedence if same coordinates)
    pinnedLocations.forEach((p) => {
      const key = `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
      const coord: Coordinate = {
        lat: p.lat,
        lng: p.lng,
        id: p.id,
        text: p.text,
        address: p.address,
      };
      const existing = allLocationsMap.get(key);
      if (existing) {
        console.log(`  🔄 Replacing conversation coordinate with pinned: ${coord.lat}, ${coord.lng}`);
      }
      allLocationsMap.set(key, coord); // Pinned locations override regular ones
    });

    const allLocations = Array.from(allLocationsMap.values());
    console.log(`📊 After deduplication: ${allLocations.length} unique locations`);
    allLocations.forEach((loc, i) => {
      console.log(`  Unique location ${i + 1}: ${loc.lat}, ${loc.lng} (${loc.address || loc.text})`);
    });

    if (allLocations.length === 0) {
      console.log('🗺️ No locations to display');
      return;
    }

    console.log(`📍 Adding ${allLocations.length} unique marker(s) to map...`);
    console.log(`  📊 Breakdown: ${coordinates.length} conversation, ${pinnedLocations.length} pinned, ${allLocations.length} unique`);

    // Clear existing markers
    markers.forEach((marker) => {
      try {
        marker.remove();
      } catch (e) {
        // Marker might already be removed
      }
    });
    markersMapRef.current.clear();

    // Create new markers
    const newMarkers: L.Marker[] = [];
    allLocations.forEach((coord, index) => {
      try {
        console.log(`  📌 Creating marker ${index + 1} at ${coord.lat}, ${coord.lng}`);
        
        // Check if this location is pinned
        const isPinned = isLocationPinned(coord.id, coord.lat, coord.lng);
        
        // Use different icon color for pinned locations (blue for pinned, grey for regular)
        const pinColor = isPinned ? '#667eea' : '#9E9E9E';
        const marker = L.marker([coord.lat, coord.lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: ${pinColor}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          }),
        }).addTo(map);
        
        // Add popup with coordinate info
        let popupContent = '';
        const saveButtonHtml = !isPinned ? `
          <button 
            id="save-location-${coord.id}" 
            data-location-id="${coord.id}"
            style="
              margin-top: 8px;
              padding: 6px 8px;
              background: none;
              color: #667eea;
              border: none;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 4px;
              opacity: 0.7;
              transition: all 0.2s;
            "
            onmouseover="this.style.opacity='1'; this.style.transform='scale(1.05)'"
            onmouseout="this.style.opacity='0.7'; this.style.transform='scale(1)'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Pin
          </button>
        ` : `
        `;
        
        const directionsButtonHtml = `
          <button 
            id="directions-from-${coord.id}" 
            data-location-id="${coord.id}"
            style="
              margin-top: 8px;
              padding: 6px 8px;
              background: #34A853;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 4px;
              width: 100%;
              transition: all 0.2s;
            "
            onmouseover="this.style.background='#2d8f47'"
            onmouseout="this.style.background='#34A853'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"></path>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
            Get directions from here
          </button>
        `;
        
        if (coord.address) {
          popupContent = `
            <div style="padding: 8px; min-width: 200px;">
              <strong>📍 ${coord.address}</strong><br/>
              <small style="color: #666;">${coord.lat}, ${coord.lng}</small>
              ${isPinned ? '<br/><small style="color: #667eea;">📌 Pinned</small>' : ''}
              ${saveButtonHtml}
              ${directionsButtonHtml}
            </div>
          `;
        } else {
          popupContent = `
            <div style="padding: 8px; min-width: 200px;">
              <strong>📍 Coordinate</strong><br/>
              <small>${coord.lat}, ${coord.lng}</small><br/>
              <small style="color: #666;">${coord.text}</small>
              ${isPinned ? '<br/><small style="color: #667eea;">📌 Pinned</small>' : ''}
              ${saveButtonHtml}
              ${directionsButtonHtml}
            </div>
          `;
        }
        marker.bindPopup(popupContent);
        
        // Add click handler to marker - when selecting origin/destination, clicking marker sets it
        marker.on('click', () => {
          // Dispatch a custom event that DirectionsPanel can listen to
          const clickEvent = new CustomEvent('markerClickForDirections', {
            detail: { lat: coord.lat, lng: coord.lng, id: coord.id }
          });
          window.dispatchEvent(clickEvent);
        });
        
        // Add event listener for popupopen - check selection mode and set up button handlers
        marker.on('popupopen', () => {
          // Check if we're in selection mode - if so, close popup immediately
          const event = new CustomEvent('isSelectingPoint');
          let isSelecting = false;
          const handler = (e: Event) => {
            const customEvent = e as CustomEvent;
            isSelecting = customEvent.detail || false;
            window.removeEventListener('selectionModeStatus', handler);
            if (isSelecting) {
              marker.closePopup();
              return; // Don't set up button handlers if popup is closed
            }
            
            // If not selecting, set up button handlers
            const saveButton = document.getElementById(`save-location-${coord.id}`);
            const deleteButton = document.getElementById(`delete-location-${coord.id}`);
            const directionsButton = document.getElementById(`directions-from-${coord.id}`);
            
            if (saveButton) {
              saveButton.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                // Find the location in the current coordinates or pinned locations
                const locationToSave = coordinates.find(c => c.id === coord.id) || 
                                      pinnedLocations.find(p => p.id === coord.id);
                if (locationToSave && !isLocationPinned(coord.id, coord.lat, coord.lng)) {
                  handlePinLocation(locationToSave);
                  // Close and reopen popup to refresh the content
                  marker.closePopup();
                  setTimeout(() => {
                    marker.openPopup();
                  }, 100);
                }
              };
            }
            
            if (deleteButton) {
              deleteButton.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                handleUnpinLocation(coord.id);
                // Close popup after deletion
                marker.closePopup();
              };
            }
            
            if (directionsButton) {
              directionsButton.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                // Set this location as origin and switch to destination selection
                const event = new CustomEvent('setDirectionsOrigin', {
                  detail: { lat: coord.lat, lng: coord.lng, id: coord.id }
                });
                window.dispatchEvent(event);
                // Show directions panel and switch to map view if needed
                if (showListViewRef.current) {
                  openListView(false);
                }
                openDirections(true);
                // Close popup
                marker.closePopup();
              };
            }
          };
          window.addEventListener('selectionModeStatus', handler);
          window.dispatchEvent(event);
        });
        
        newMarkers.push(marker);
        // Store marker by location ID for easy lookup
        markersMapRef.current.set(coord.id, marker);
        // Also store by coordinate key as backup (in case of ID mismatches)
        const coordKey = `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`;
        if (!markersMapRef.current.has(`coord:${coordKey}`)) {
          markersMapRef.current.set(`coord:${coordKey}`, marker);
        }
        console.log(`  ✅ Stored marker for ID: ${coord.id}, coord: ${coordKey}`);
      } catch (error) {
        console.error(`  ❌ Error creating marker ${index + 1}:`, error);
      }
    });

    setMarkers(newMarkers);
    console.log(`✅ Successfully added ${newMarkers.length} marker(s) to map`);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      try {
        const group = new L.FeatureGroup(newMarkers);
        const bounds = group.getBounds();
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds.pad(0.1));
          console.log('🗺️ Map fitted to bounds');
        }
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }

    // Cleanup
    return () => {
      newMarkers.forEach((marker) => {
        try {
          marker.remove();
        } catch (e) {
          // Marker might already be removed
        }
      });
    };
  }, [map, coordinates, pinnedLocations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle location click (center map on location or switch to map view)
  const handleLocationClick = (location: Coordinate) => {
    console.log('📍 Location clicked:', location);
    console.log('📍 Markers map size:', markersMapRef.current.size);
    console.log('📍 Looking for marker with ID:', location.id);
    
    // Helper function to find and open marker popup
    const findAndOpenMarker = (attempt = 0) => {
      if (!map) {
        if (attempt < 10) {
          setTimeout(() => findAndOpenMarker(attempt + 1), 100);
        }
        return;
      }
      
      // Try to find marker by ID first
      let marker = markersMapRef.current.get(location.id);
      
      // If not found by ID, try to find by coordinates (in case of deduplication)
      if (!marker) {
        console.log('⚠️ Marker not found by ID, searching by coordinates...');
        const coordKey = `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`;
        // Try coordinate-based lookup first
        marker = markersMapRef.current.get(`coord:${coordKey}`);
        if (!marker) {
          // Fallback: search through all markers to find one at the same location
          markersMapRef.current.forEach((m, id) => {
            const markerLatLng = m.getLatLng();
            const markerKey = `${markerLatLng.lat.toFixed(6)},${markerLatLng.lng.toFixed(6)}`;
            if (markerKey === coordKey) {
              marker = m;
              console.log('✅ Found marker by coordinates:', id);
            }
          });
        } else {
          console.log('✅ Found marker by coordinate key');
        }
      }
      
      if (marker) {
        console.log('✅ Opening popup for marker');
        // Center map first
        map.setView([location.lat, location.lng], 16);
        // Small delay to ensure map has finished centering
        setTimeout(() => {
          marker?.openPopup();
        }, 400);
      } else {
        if (attempt < 10) {
          console.log(`⚠️ Marker not found, retrying... (attempt ${attempt + 1}/10)`);
          setTimeout(() => findAndOpenMarker(attempt + 1), 200);
        } else {
          console.error('❌ Marker not found for location after 10 attempts:', location);
        }
      }
    };
    
    // If in list view, switch to map view first
    if (showListView) {
      openListView(false);
      // Wait for map to be ready and markers to be created
      setTimeout(() => {
        findAndOpenMarker();
      }, 500);
    } else {
      // Already in map view
      findAndOpenMarker();
    }
  };

  return (
    <AppContainer>
      <Header>
        <LocationCountButton 
            onClick={() => {
              setMapStyle(prev => {
                if (prev === 'standard') return 'satellite';
                if (prev === 'satellite') return 'terrain';
                return 'standard';
              });
            }}
            title="Toggle map view (Standard → Terrain → Satellite)"
          >
            {mapStyle === 'terrain' ? '🗻' : mapStyle === 'satellite' ? '🛰️' : '🗺️'}
          </LocationCountButton>
        <SearchContainer ref={searchContainerRef}>
          <SearchInput
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowSearchDropdown(true);
              }
            }}
          />
          <SearchIcon>{isSearching ? '⏳' : '🔍'}</SearchIcon>
          {showSearchDropdown && searchResults.length > 0 && (
            <SearchDropdown>
              {searchResults.map((result) => (
                <SearchResultItem
                  key={result.place_id}
                  onClick={() => handleSearchResultClick(result)}
                >
                  <SearchResultName>{result.display_name}</SearchResultName>
                  <SearchResultDetails>
                    {parseFloat(result.lat).toFixed(6)}, {parseFloat(result.lon).toFixed(6)}
                  </SearchResultDetails>
                </SearchResultItem>
              ))}
            </SearchDropdown>
          )}
        </SearchContainer>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <LocationCountButton 
            onClick={() => openDirections(!showDirections)}
            style={{ 
              background: showDirections ? '#667eea' : 'none',
              color: showDirections ? 'white' : '#666'
            }}
          >
            🧭 Directions
          </LocationCountButton>
          <LocationCountButton 
            onClick={() => openSavedRoutesList(!showSavedRoutesList)}
            style={{ 
              background: showSavedRoutesList ? '#667eea' : 'none',
              color: showSavedRoutesList ? 'white' : '#666'
            }}
            title={`Saved Routes (${savedRoutes.length})`}
          >
            🗺️ Routes ({savedRoutes.length})
          </LocationCountButton>
          {isLoadingLocations ? (
            <LocationCountButton 
              disabled
              style={{ opacity: 0.7, cursor: 'wait' }}
            >
              ⏳ Loading locations...
            </LocationCountButton>
          ) : coordinates.length > 0 || pinnedLocations.length > 0 ? (
            <LocationCountButton 
              onClick={() => openListView(!showListView)}
            >
              Points ({coordinates.length + pinnedLocations.length})
            </LocationCountButton>
          ) : (
            <EmptyStateMessage>
              📍 No locations found in this conversation
            </EmptyStateMessage>
          )}
        </div>
      </Header>

      <MainContent>
        <MapSection>
            <SelectionBanner $visible={isSelectingPoints && !showListView && !showDirections}>
              <SelectionBannerIcon />
              <span>Click on the map or a marker to select a point...</span>
            </SelectionBanner>
            <div style={{ 
              position: 'absolute', 
              top: '16px', 
              right: '16px', 
              zIndex: 1000,
              maxWidth: '400px',
              width: '100%',
              display: showDirections ? 'block' : 'none'
            }}>
              <DirectionsPanel 
                map={map} 
                markersMap={markersMapRef.current}
                onShowDirections={() => {
                  console.log('Opening directions panel from route popup');
                  openDirections(true);
                }}
                onHideDirections={() => {
                  openDirections(false);
                }}
                onClose={() => {
                  openDirections(false);
                  setSelectedSavedRoute(null);
                }}
                savedRouteToLoad={selectedSavedRoute}
              />
            </div>
            <MapComponent onMapLoad={setMap} mapStyle={mapStyle} />
          </MapSection>
      </MainContent>

      {showListView && (
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '16px',
          zIndex: 2000,
          maxWidth: '400px',
          width: '100%',
        }}>
          <LocationsList
            conversationLocations={coordinates
              .filter(c => !pinnedLocations.some(p => p.id === c.id))
              .map(c => ({
                id: c.id,
                text: c.text,
                type: 'coordinates' as const,
                coordinates: { lat: c.lat, lng: c.lng },
                formattedAddress: c.address,
              }))}
            savedLocations={pinnedLocations.map(p => ({
              id: p.id,
              text: p.text,
              type: 'coordinates' as const,
              coordinates: { lat: p.lat, lng: p.lng },
              formattedAddress: p.address,
            }))}
            onLocationClick={(location) => {
              if (location.coordinates) {
                handleLocationClick({
                  lat: location.coordinates.lat,
                  lng: location.coordinates.lng,
                  id: location.id,
                  text: location.text,
                  address: location.formattedAddress,
                });
              }
            }}
            onLocationRemove={(id, fromSaved) => {
              if (fromSaved) {
                handleUnpinLocation(id);
              }
            }}
            onSaveLocation={(id) => {
              const location = coordinates.find(c => c.id === id);
              if (location) {
                handlePinLocation(location);
              }
            }}
            onClose={() => openListView(false)}
          />
        </div>
      )}

      {showSavedRoutesList && (
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '16px',
          zIndex: 2000,
          maxWidth: '400px',
          width: '100%',
        }}>
          <SavedRoutesList
            onClose={() => openSavedRoutesList(false)}
            onRouteToggle={handleRouteToggle}
            visibleRouteIds={visibleRouteIds}
            onRouteSelect={(route) => {
              setSelectedSavedRoute(route);
              openSavedRoutesList(false);
              openDirections(true);
            }}
          />
        </div>
      )}
    </AppContainer>
  );
};

export default OpenStreetMapApp;

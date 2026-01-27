import L from 'leaflet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiArrowUp, FiArrowDown, FiMapPin, FiNavigation, FiX, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';

import type { RouteResult, TravelMode } from '../types/maps';
import { calculateAirRouteWaypoints, calculateMaritimeRoute } from '../utils/maritimeRouting';
import { loadSpeedSettings, loadCostSettings, type SpeedSettings, type CostSettings } from '../utils/speedSettings';
import { addSavedRoute, loadSavedRoutes, type SavedRoute } from '../utils/savedRoutesStorage';
import { addPinnedLocation, isLocationPinned } from '../utils/pinnedLocationsStorage';
import { reverseGeocode } from '../utils/locationDetection';
import SpeedSettingsPanel from './SpeedSettingsPanel';

const DirectionsContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: visible;
  position: relative;
`;

const DirectionsHeader = styled.div`
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  border-radius: 8px 8px 0 0;
`;

const GoBackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.2s;
  margin-left: auto;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  margin-right: auto;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
`;

const DirectionsContent = styled.div`
  padding: 12px;
`;

const TravelModeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 12px;
`;

const TransportModesSection = styled.div`
  margin-bottom: 12px;
`;

const ModeSectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
  padding-left: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TravelModeButton = styled.button<{ $active: boolean }>`
  padding: 6px;
  border: 1px solid ${(props) => (props.$active ? '#667eea' : '#dee2e6')};
  background: ${(props) => (props.$active ? '#667eea' : 'white')};
  color: ${(props) => (props.$active ? 'white' : '#666')};
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    border-color: #667eea;
    background: ${(props) => (props.$active ? '#5568d3' : '#f8f9fa')};
  }
`;

const GetDirectionsButton = styled.button`
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorBox = styled.div`
  margin-bottom: 12px;
  padding: 10px;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  font-size: 11px;
  color: #856404;
  line-height: 1.4;
`;

const ErrorTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`;

const AddWaypointButton = styled.button`
  width: 100%;
  padding: 6px;
  background: #f8f9fa;
  border: 1px dashed #dee2e6;
  color: #667eea;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 500;
  transition: all 0.2s;
  margin-bottom: 8px;

  &:hover {
    background: #e9ecef;
    border-color: #667eea;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SelectPointsButton = styled.button<{ $active?: boolean }>`
  width: 100%;
  padding: 12px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#667eea'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  margin-bottom: 12px;
  box-shadow: ${props => props.$active ? '0 0 0 3px rgba(102, 126, 234, 0.3)' : 'none'};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PointsList = styled.div`
  margin-bottom: 12px;
`;

const PointsListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 11px;
`;

const PointNumber = styled.div<{ $type: 'origin' | 'waypoint' | 'destination' }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 11px;
  color: white;
  flex-shrink: 0;
  background: ${props => 
    props.$type === 'origin' ? '#34A853' :
    props.$type === 'destination' ? '#EA4335' :
    '#FF9800'
  };
`;

const PointCoords = styled.div`
  flex: 1;
  color: #666;
  font-size: 10px;
`;

const ReorderButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
`;

const ReorderButton = styled.button`
  background: none;
  border: none;
  padding: 2px 4px;
  cursor: pointer;
  color: #667eea;
  display: flex;
  align-items: center;
  opacity: 0.6;
  transition: opacity 0.2s;
  font-size: 12px;

  &:hover:not(:disabled) {
    opacity: 1;
  }
  
  &:disabled {
    opacity: 0.2;
    cursor: not-allowed;
  }
`;

const RemovePointButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #dc3545;
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition: opacity 0.2s;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
  }
`;

interface DirectionsPanelProps {
  map: L.Map | null;
  onRouteCalculated?: (result: RouteResult) => void;
  markersMap?: Map<string, L.Marker>;
  onShowDirections?: () => void;
  onHideDirections?: () => void;
  onClose?: () => void;
  savedRouteToLoad?: SavedRoute | null;
}

const DirectionsPanel = ({ map, onRouteCalculated, markersMap, onShowDirections, onHideDirections, onClose, savedRouteToLoad }: DirectionsPanelProps) => {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [waypoints, setWaypoints] = useState<Array<{ lat: number; lng: number; id: string }>>([]);
  const [isSelectingPoints, setIsSelectingPoints] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<Array<{ lat: number; lng: number; id: string }>>([]);
  const [hasCalculatedRoute, setHasCalculatedRoute] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [speedSettings, setSpeedSettings] = useState<SpeedSettings>(loadSpeedSettings());
  const [costSettings, setCostSettings] = useState<CostSettings>(loadCostSettings());
  
  const selectedPointMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const selectedPointOriginalIconsRef = useRef<Map<string, L.Icon | L.DivIcon>>(new Map());
  const routeLineRef = useRef<L.Polyline | null>(null);
  const clickListenerRef = useRef<L.LeafletEventHandlerFnMap | null>(null);

  // Load speed settings and listen for changes
  useEffect(() => {
    setSpeedSettings(loadSpeedSettings());
    setCostSettings(loadCostSettings());
    
    const handleTransportSettingsChange = (event: CustomEvent) => {
      setSpeedSettings(event.detail.speeds);
      setCostSettings(event.detail.costs);
    };
    
    // Legacy support for old event name
    const handleSpeedSettingsChange = (event: CustomEvent) => {
      setSpeedSettings(event.detail);
    };
    
    window.addEventListener('transportSettingsChanged', handleTransportSettingsChange as EventListener);
    window.addEventListener('speedSettingsChanged', handleSpeedSettingsChange as EventListener);
    
    return () => {
      window.removeEventListener('transportSettingsChanged', handleTransportSettingsChange as EventListener);
      window.removeEventListener('speedSettingsChanged', handleSpeedSettingsChange as EventListener);
    };
  }, []);

  // Load saved route when provided
  useEffect(() => {
    if (!savedRouteToLoad || !map) return;

    // Clear any existing route
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    // Set route data
    setOrigin(savedRouteToLoad.origin);
    setDestination(savedRouteToLoad.destination);
    setWaypoints(savedRouteToLoad.waypoints);
    setTravelMode(savedRouteToLoad.travelMode);
    setHasCalculatedRoute(true);

    // Draw the route on the map
    const polyline = L.polyline(savedRouteToLoad.geometry as L.LatLngExpression[], {
      color: savedRouteToLoad.color,
      weight: 4,
      opacity: 0.8,
      dashArray: savedRouteToLoad.travelMode === 'plane' ? '10, 10' : undefined,
      interactive: true,
    }).addTo(map);

    routeLineRef.current = polyline;

    // Fit map to route
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    // Add popup with route info
    const routePopupContent = `
      <div style="padding: 8px; min-width: 200px;">
        <strong>📍 ${savedRouteToLoad.name}</strong><br/>
        <small style="color: #666;">${savedRouteToLoad.travelMode.charAt(0).toUpperCase() + savedRouteToLoad.travelMode.slice(1)}</small><br/>
        <small style="color: #666;">${savedRouteToLoad.routeInfo.distance} • ${savedRouteToLoad.routeInfo.duration}</small>
        ${savedRouteToLoad.routeInfo.cost ? `<br/><small style="color: #666;">Cost: ${savedRouteToLoad.routeInfo.cost}</small>` : ''}
      </div>
    `;
    polyline.bindPopup(routePopupContent);
    polyline.on('click', (e: L.LeafletMouseEvent) => {
      polyline.openPopup(e.latlng);
    });

    // Show directions panel
    if (onShowDirections) {
      onShowDirections();
    }

    // Cleanup
    return () => {
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
    };
  }, [savedRouteToLoad, map, onShowDirections]);

  // Helper function to get speed for current travel mode
  const getSpeedForMode = useCallback((mode: TravelMode): number => {
    return speedSettings[mode] || speedSettings.driving;
  }, [speedSettings]);

  // Helper function to get cost per km for current travel mode
  const getCostPerKm = useCallback((mode: TravelMode): number => {
    return costSettings[mode] || costSettings.driving;
  }, [costSettings]);

  // Helper function to calculate trip cost
  const calculateTripCost = useCallback((distanceKm: number, mode: TravelMode): string => {
    const costPerKm = getCostPerKm(mode);
    const totalCost = distanceKm * costPerKm;
    
    if (totalCost === 0) {
      return 'Free';
    } else if (totalCost < 1) {
      return `$${totalCost.toFixed(2)}`;
    } else {
      return `$${totalCost.toFixed(2)}`;
    }
  }, [getCostPerKm]);

  // Helper function to generate automatic route name
  const generateRouteName = useCallback((
    travelMode: TravelMode,
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypointsCount: number
  ): string => {
    const modeName = travelMode.charAt(0).toUpperCase() + travelMode.slice(1);
    const originStr = `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`;
    const destStr = `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`;
    
    if (waypointsCount > 0) {
      return `${modeName} route (${waypointsCount} waypoint${waypointsCount > 1 ? 's' : ''})`;
    }
    return `${modeName} route: ${originStr} → ${destStr}`;
  }, []);

  // Helper function to check if a route is a duplicate
  const isDuplicateRoute = useCallback((
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints: Array<{ lat: number; lng: number; id: string }>,
    travelMode: TravelMode
  ): boolean => {
    const savedRoutes = loadSavedRoutes();
    const tolerance = 0.0001; // Small tolerance for coordinate comparison
    
    return savedRoutes.some(route => {
      // Check if travel mode matches
      if (route.travelMode !== travelMode) return false;
      
      // Check if origin matches (within tolerance)
      const originMatch = 
        Math.abs(route.origin.lat - origin.lat) < tolerance &&
        Math.abs(route.origin.lng - origin.lng) < tolerance;
      
      // Check if destination matches (within tolerance)
      const destMatch = 
        Math.abs(route.destination.lat - destination.lat) < tolerance &&
        Math.abs(route.destination.lng - destination.lng) < tolerance;
      
      if (!originMatch || !destMatch) return false;
      
      // Check if waypoints match (same count and similar coordinates)
      if (route.waypoints.length !== waypoints.length) return false;
      
      if (waypoints.length > 0) {
        const waypointsMatch = waypoints.every((wp, index) => {
          const routeWp = route.waypoints[index];
          return routeWp &&
            Math.abs(routeWp.lat - wp.lat) < tolerance &&
            Math.abs(routeWp.lng - wp.lng) < tolerance;
        });
        if (!waypointsMatch) return false;
      }
      
      return true;
    });
  }, []);

  // Auto-save route after it's calculated and displayed
  const autoSaveRoute = useCallback(async (
    routeResult: RouteResult,
    geometry: [number, number][],
    routeColor: string
  ) => {
    if (!origin || !destination) return;
    
    // Check if this route is a duplicate
    if (isDuplicateRoute(origin, destination, waypoints, travelMode)) {
      console.log('Route already saved, skipping auto-save');
      return;
    }
    
    // Generate automatic route name
    const routeName = generateRouteName(travelMode, origin, destination, waypoints.length);
    
    try {
      // Save route points to pinned locations
      const savePointToPinned = async (point: { lat: number; lng: number; id?: string }, label: string) => {
        try {
          // Try to get address via reverse geocoding
          const address = await reverseGeocode(point.lat, point.lng);
          const pointId = point.id || `route-point-${point.lat}-${point.lng}-${Date.now()}`;
          
          addPinnedLocation({
            id: pointId,
            lat: point.lat,
            lng: point.lng,
            text: label,
            address: address || `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`,
          });
        } catch (error) {
          console.error(`Error saving ${label} to pinned locations:`, error);
        }
      };
      
      // Save origin
      await savePointToPinned(origin, `Route Origin: ${routeName}`);
      
      // Save destination
      await savePointToPinned(destination, `Route Destination: ${routeName}`);
      
      // Save waypoints
      for (const waypoint of waypoints) {
        await savePointToPinned(waypoint, `Route Waypoint: ${routeName}`);
      }
      
      // Save the route
      addSavedRoute({
        name: routeName,
        origin: {
          lat: origin.lat,
          lng: origin.lng,
        },
        destination: {
          lat: destination.lat,
          lng: destination.lng,
        },
        waypoints: waypoints.map(wp => ({
          lat: wp.lat,
          lng: wp.lng,
          id: wp.id,
        })),
        travelMode,
        routeInfo: routeResult,
        geometry: geometry,
        color: routeColor,
      });
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('savedRoutesUpdated'));
      window.dispatchEvent(new CustomEvent('pinnedLocationsUpdated'));
      
      console.log('Route auto-saved successfully:', routeName);
    } catch (error) {
      console.error('Error auto-saving route:', error);
    }
  }, [origin, destination, waypoints, travelMode, isDuplicateRoute, generateRouteName]);

  // Helper function to find marker at coordinates or by ID
  const findMarkerAtLocation = useCallback((lat: number, lng: number, id?: string): L.Marker | null => {
    if (!markersMap) return null;
    
    // Try to find by ID first if provided
    if (id) {
      const marker = markersMap.get(id);
      if (marker) return marker;
    }
    
    const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    // Try to find by coordinate key
    let marker = markersMap.get(`coord:${coordKey}`);
    
    if (!marker) {
      // Search through all markers to find one at the same location
      markersMap.forEach((m, markerId) => {
        if (markerId.startsWith('coord:')) return; // Skip coordinate keys
        const markerLatLng = m.getLatLng();
        const markerKey = `${markerLatLng.lat.toFixed(6)},${markerLatLng.lng.toFixed(6)}`;
        if (markerKey === coordKey) {
          marker = m;
        }
      });
    }
    
    return marker || null;
  }, [markersMap]);


  // Add a point to the route sequence
  const addPointToRoute = useCallback((lat: number, lng: number, id?: string) => {
    if (!map) return;
    
    const pointId = `point-${Date.now()}`;
    const newPoint = { lat, lng, id: pointId };
    
    setSelectedPoints(prev => {
      const updated = [...prev, newPoint];
      
      // Update origin, waypoints, and destination based on position
      if (updated.length === 1) {
        // First point is origin
        setOrigin(newPoint);
        setWaypoints([]);
        setDestination(null);
      } else if (updated.length === 2) {
        // Second point becomes destination
        setDestination(newPoint);
        setWaypoints([]);
      } else {
        // 3+ points: first is origin, last is destination, middle are waypoints
        setOrigin(updated[0]);
        setDestination(updated[updated.length - 1]);
        setWaypoints(updated.slice(1, -1));
      }
      
      return updated;
    });
    
    // Find existing marker or create new one
    const existingMarker = findMarkerAtLocation(lat, lng, id);
    const pointIndex = selectedPoints.length;
    
    // Determine marker style
    let markerHtml: string;
    
    if (pointIndex === 0) {
      // First point (origin)
      markerHtml = '<div style="background: #34A853; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">A</div>';
    } else {
      // Other points (waypoints or destination)
      const displayNumber = pointIndex;
      markerHtml = `<div style="background: #667eea; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 12px;">${displayNumber}</div>`;
    }
    
    if (existingMarker) {
      // Save the original icon before modifying
      const originalIcon = existingMarker.getIcon();
      if (originalIcon) {
        selectedPointOriginalIconsRef.current.set(pointId, originalIcon);
      }
      
      existingMarker.setIcon(L.divIcon({
        className: 'custom-marker',
        html: markerHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }));
      selectedPointMarkersRef.current.set(pointId, existingMarker);
    } else {
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: markerHtml,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        }),
      }).addTo(map);
      selectedPointMarkersRef.current.set(pointId, marker);
    }
  }, [map, findMarkerAtLocation, selectedPoints.length]);

  // Remove a point from the route
  const removePointFromRoute = useCallback((pointId: string) => {
    setSelectedPoints(prev => {
      const updated = prev.filter(p => p.id !== pointId);
      
      // Update origin, waypoints, and destination
      if (updated.length === 0) {
        setOrigin(null);
        setWaypoints([]);
        setDestination(null);
      } else if (updated.length === 1) {
        setOrigin(updated[0]);
        setWaypoints([]);
        setDestination(null);
      } else if (updated.length === 2) {
        setOrigin(updated[0]);
        setDestination(updated[1]);
        setWaypoints([]);
      } else {
        setOrigin(updated[0]);
        setDestination(updated[updated.length - 1]);
        setWaypoints(updated.slice(1, -1));
      }
      
      return updated;
    });
    
    // Restore original marker icon or remove marker
    const marker = selectedPointMarkersRef.current.get(pointId);
    if (marker) {
      const originalIcon = selectedPointOriginalIconsRef.current.get(pointId);
      
      if (originalIcon) {
        // This was an existing marker - restore its original icon
        marker.setIcon(originalIcon);
        selectedPointOriginalIconsRef.current.delete(pointId);
      } else {
        // This was a new marker we created - remove it
        marker.remove();
      }
      
      selectedPointMarkersRef.current.delete(pointId);
    }
    
    // Renumber remaining markers
    setTimeout(() => {
      selectedPoints.forEach((point, index) => {
        if (point.id === pointId) return;
        
        const marker = selectedPointMarkersRef.current.get(point.id);
        if (marker) {
          let markerHtml: string;
          
          if (index === 0) {
            markerHtml = '<div style="background: #34A853; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">A</div>';
          } else {
            markerHtml = `<div style="background: #667eea; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 12px;">${index}</div>`;
          }
          
          marker.setIcon(L.divIcon({
            className: 'custom-marker',
            html: markerHtml,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          }));
        }
      });
    }, 10);
    
    // Clear route
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
  }, [selectedPoints]);

  // Reorder a point in the route (move up or down)
  const reorderPoint = useCallback((pointId: string, direction: 'up' | 'down') => {
    setSelectedPoints(prev => {
      const currentIndex = prev.findIndex(p => p.id === pointId);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // Can't move beyond bounds
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      // Swap positions
      const updated = [...prev];
      [updated[currentIndex], updated[newIndex]] = [updated[newIndex], updated[currentIndex]];
      
      // Update origin, waypoints, and destination
      if (updated.length === 1) {
        setOrigin(updated[0]);
        setWaypoints([]);
        setDestination(null);
      } else if (updated.length === 2) {
        setOrigin(updated[0]);
        setDestination(updated[1]);
        setWaypoints([]);
      } else {
        setOrigin(updated[0]);
        setDestination(updated[updated.length - 1]);
        setWaypoints(updated.slice(1, -1));
      }
      
      return updated;
    });
    
    // Renumber markers after reorder
    setTimeout(() => {
      selectedPoints.forEach((point) => {
        const currentIndex = selectedPoints.findIndex(p => p.id === point.id);
        if (currentIndex === -1) return;
        
        const marker = selectedPointMarkersRef.current.get(point.id);
        if (marker) {
          let markerHtml: string;
          
          if (currentIndex === 0) {
            markerHtml = '<div style="background: #34A853; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">A</div>';
          } else if (currentIndex === selectedPoints.length - 1) {
            markerHtml = '<div style="background: #EA4335; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">B</div>';
          } else {
            markerHtml = `<div style="background: #FF9800; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 12px;">${currentIndex}</div>`;
          }
          
          marker.setIcon(L.divIcon({
            className: 'custom-marker',
            html: markerHtml,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          }));
        }
      });
    }, 10);
    
    // Clear route since order changed
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
  }, [selectedPoints]);

  // Toggle point selection mode
  const togglePointSelection = useCallback(() => {
    setIsSelectingPoints(prev => {
      const newValue = !prev;
      
      // Emit event to notify other components about selection mode change
      const event = new CustomEvent('selectionModeChanged', {
        detail: newValue
      });
      window.dispatchEvent(event);
      
      // Hide panel when enabling selection mode
      if (newValue && onHideDirections) {
        onHideDirections();
      }
      // Show panel when disabling selection mode
      if (!newValue && onShowDirections) {
        onShowDirections();
      }
      
      return newValue;
    });
  }, [onHideDirections, onShowDirections]);

  // Clear all points
  const clearAllPoints = useCallback(() => {
    // Restore original icons or remove markers
    // But don't remove markers that are now pinned locations
    selectedPointMarkersRef.current.forEach((marker, pointId) => {
      const originalIcon = selectedPointOriginalIconsRef.current.get(pointId);
      const point = selectedPoints.find(p => p.id === pointId);
      
      // Check if this location is now pinned
      const isPinned = point ? isLocationPinned(point.id || '', point.lat, point.lng) : false;
      
      if (isPinned) {
        // Location is pinned - restore original icon if it was an existing marker
        // Otherwise, just remove it from our tracking (it will be managed by useMarkers)
        if (originalIcon) {
          marker.setIcon(originalIcon);
        } else {
          // This was a new marker we created, but it's now pinned
          // Remove it and let useMarkers recreate it as a pinned location
          marker.remove();
        }
      } else if (originalIcon) {
        // This was an existing marker - restore its original icon
        marker.setIcon(originalIcon);
      } else {
        // This was a new marker we created and it's not pinned - remove it
        marker.remove();
      }
    });
    
    selectedPointMarkersRef.current.clear();
    selectedPointOriginalIconsRef.current.clear();
    
    setSelectedPoints([]);
    setOrigin(null);
    setWaypoints([]);
    setDestination(null);
    setIsSelectingPoints(false);
    setHasCalculatedRoute(false);
    
    // Emit event to notify selection mode is off
    const event = new CustomEvent('selectionModeChanged', {
      detail: false
    });
    window.dispatchEvent(event);
    
    // Clear route
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    // Clear saved route selection
    window.dispatchEvent(new CustomEvent('clearSavedRouteSelection'));
  }, [selectedPoints]);

  // Handle map clicks to select points sequentially
  useEffect(() => {
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isSelectingPoints) return;
      const { lat, lng } = e.latlng;
      
      // Try to find existing marker at clicked location first
      const existingMarker = findMarkerAtLocation(lat, lng);
      if (existingMarker) {
        // If marker exists, use its coordinates (more precise)
        const markerLatLng = existingMarker.getLatLng();
        addPointToRoute(markerLatLng.lat, markerLatLng.lng);
      } else {
        // No marker, use clicked coordinates
        addPointToRoute(lat, lng);
      }
    };

    if (isSelectingPoints) {
      map.on('click', handleMapClick);
      clickListenerRef.current = { click: handleMapClick };
    } else {
      if (clickListenerRef.current) {
        map.off('click', clickListenerRef.current.click);
        clickListenerRef.current = null;
      }
    }

    return () => {
      if (clickListenerRef.current) {
        map.off('click', clickListenerRef.current.click);
      }
    };
  }, [map, isSelectingPoints, addPointToRoute, findMarkerAtLocation]);

  // Listen for marker clicks when in selection mode
  useEffect(() => {
    const handleMarkerClick = (e: Event) => {
      if (!isSelectingPoints) return;
      const customEvent = e as CustomEvent;
      const { lat, lng, id } = customEvent.detail;
      addPointToRoute(lat, lng, id);
    };

    const handleLocationClick = (e: Event) => {
      if (!isSelectingPoints) return;
      const customEvent = e as CustomEvent;
      const { lat, lng, id } = customEvent.detail;
      addPointToRoute(lat, lng, id);
    };

    // Listen for selection mode check requests
    const handleSelectionModeCheck = () => {
      const responseEvent = new CustomEvent('selectionModeStatus', {
        detail: isSelectingPoints
      });
      window.dispatchEvent(responseEvent);
    };

    window.addEventListener('markerClickForDirections', handleMarkerClick);
    window.addEventListener('locationClickForDirections', handleLocationClick);
    window.addEventListener('isSelectingPoint', handleSelectionModeCheck);

    return () => {
      window.removeEventListener('markerClickForDirections', handleMarkerClick);
      window.removeEventListener('locationClickForDirections', handleLocationClick);
      window.removeEventListener('isSelectingPoint', handleSelectionModeCheck);
    };
  }, [isSelectingPoints, addPointToRoute]);

  // Listen for "Directions from here" / "Directions to here" button clicks
  useEffect(() => {
    const handleSetOrigin = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { lat, lng, id } = customEvent.detail || {};
      
      // Clear any existing route
      if (hasCalculatedRoute) {
        clearAllPoints();
      }
      
      // Add this as the first point
      addPointToRoute(lat, lng, id);
      
      // Enable selection mode so user can continue adding points
      setIsSelectingPoints(true);
      
      // Emit event to notify selection mode is on
      const event = new CustomEvent('selectionModeChanged', {
        detail: true
      });
      window.dispatchEvent(event);
      
      // Hide panel to show the map
      if (onHideDirections) {
        onHideDirections();
      }
    };

    const handleSetDestination = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { lat, lng, id } = customEvent.detail || {};
      
      // If no points yet, ignore (need origin first)
      if (selectedPoints.length === 0) {
        // Could show a message: "Please select a starting point first"
        return;
      }
      
      // Add this as the next point in the sequence
      addPointToRoute(lat, lng, id);
    };

    window.addEventListener('setDirectionsOrigin', handleSetOrigin);
    window.addEventListener('setDirectionsDestination', handleSetDestination);

    return () => {
      window.removeEventListener('setDirectionsOrigin', handleSetOrigin);
      window.removeEventListener('setDirectionsDestination', handleSetDestination);
    };
  }, [addPointToRoute, hasCalculatedRoute, clearAllPoints, selectedPoints.length, onHideDirections]);

  // Don't cleanup markers/route on unmount - they should persist even when panel is hidden
  // Only cleanup when component is actually destroyed (not just hidden)

  // Calculate great circle distance using Haversine formula (for planes and ships)
  const calculateGreatCircleDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const calculateRoute = async () => {
    if (!map || !origin || !destination) return;

    setIsCalculating(true);
    setApiError(null);
    
    // Stop point selection and mark route as calculated
    setIsSelectingPoints(false);
    setHasCalculatedRoute(true);
    
    // Emit event to notify selection mode is off
    const selectionEvent = new CustomEvent('selectionModeChanged', {
      detail: false
    });
    window.dispatchEvent(selectionEvent);

    // Clear previous route
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    try {
      // Handle air/sea travel modes (plane, boat, container-ship) with realistic routing
      if (travelMode === 'plane' || travelMode === 'boat' || travelMode === 'container-ship') {
        // Calculate duration based on travel mode
        let speedKmh: number;
        let modeEmoji: string;
        let modeName: string;
        let routeColor: string;
        
        // Use user-defined speeds from settings
        speedKmh = getSpeedForMode(travelMode);
        
        if (travelMode === 'plane') {
          modeEmoji = '✈️';
          modeName = 'Commercial Plane';
          routeColor = '#4A90E2';
        } else if (travelMode === 'container-ship') {
          modeEmoji = '🚢';
          modeName = 'Container Ship';
          routeColor = '#2ECC71';
        } else { // boat
          modeEmoji = '⛵';
          modeName = 'Boat';
          routeColor = '#3498DB';
        }
        
        // Build route with user-defined waypoints or automatic waypoints
        let routeWaypoints: Array<{ lat: number; lng: number }>;
        
        if (waypoints.length > 0) {
          // User has defined manual waypoints - use them directly
          routeWaypoints = [origin];
          
          // Add each waypoint and calculate segments
          for (const waypoint of waypoints) {
            const prevPoint = routeWaypoints[routeWaypoints.length - 1];
            
            if (travelMode === 'plane') {
              // Add great circle segments between waypoints
              const segment = calculateAirRouteWaypoints(prevPoint, waypoint, 10);
              routeWaypoints.push(...segment.slice(1)); // Skip first point (duplicate)
            } else {
              // For maritime, calculate route avoiding land between each waypoint pair
              const segment = await calculateMaritimeRoute(prevPoint, waypoint);
              routeWaypoints.push(...segment.slice(1)); // Skip first point (duplicate)
            }
          }
          
          // Add final segment to destination
          const lastWaypoint = routeWaypoints[routeWaypoints.length - 1];
          if (travelMode === 'plane') {
            const finalSegment = calculateAirRouteWaypoints(lastWaypoint, destination, 10);
            routeWaypoints.push(...finalSegment.slice(1));
          } else {
            const finalSegment = await calculateMaritimeRoute(lastWaypoint, destination);
            routeWaypoints.push(...finalSegment.slice(1));
          }
        } else {
          // No manual waypoints - use automatic routing
          if (travelMode === 'plane') {
            // For planes, use great circle route with waypoints
            routeWaypoints = calculateAirRouteWaypoints(origin, destination, 20);
          } else {
            // For boats and ships, use maritime routing that avoids land
            routeWaypoints = await calculateMaritimeRoute(origin, destination);
          }
        }
        
        // Calculate total distance along the route
        let totalDistanceKm = 0;
        for (let i = 0; i < routeWaypoints.length - 1; i++) {
          const wp1 = routeWaypoints[i];
          const wp2 = routeWaypoints[i + 1];
          totalDistanceKm += calculateGreatCircleDistance(wp1.lat, wp1.lng, wp2.lat, wp2.lng);
        }
        
        const durationHours = totalDistanceKm / speedKmh;
        const durationSeconds = durationHours * 3600;
        
        // Calculate trip cost
        const tripCost = calculateTripCost(totalDistanceKm, travelMode);
        
        // Convert waypoints to geometry format [lat, lng]
        const geometry: [number, number][] = routeWaypoints.map(wp => [wp.lat, wp.lng]);
        
        // Draw the route on the map
        const polyline = L.polyline(geometry as L.LatLngExpression[], {
          color: routeColor,
          weight: 4,
          opacity: 0.8,
          dashArray: travelMode === 'plane' ? '10, 10' : undefined, // Dashed line for planes
          interactive: true,
        }).addTo(map);
        
        routeLineRef.current = polyline;
        
        // Fit map to route
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        
        // Format distance and duration
        const distance = `${totalDistanceKm.toFixed(2)} km`;
        const duration = formatDuration(durationSeconds);
        
        // Create step instructions based on waypoints
        const steps: RouteResult['steps'] = [];
        
        if (travelMode === 'plane') {
          steps.push({
            instruction: `${modeEmoji} Depart by ${modeName} - following great circle route`,
            distance: totalDistanceKm * 1000,
            duration: durationSeconds,
            coordinates: geometry,
          });
        } else {
          // For maritime routes, create steps for each major leg
          steps.push({
            instruction: `${modeEmoji} Depart by ${modeName} - following maritime route (avoiding land)`,
            distance: totalDistanceKm * 1000,
            duration: durationSeconds,
            coordinates: geometry,
          });
          
          // Add waypoint notifications if there are intermediate points
          if (routeWaypoints.length > 2) {
            const waypointInfo = `Route passes through ${routeWaypoints.length - 2} waypoint${routeWaypoints.length > 3 ? 's' : ''} to avoid landmasses`;
            steps.push({
              instruction: `🗺️ ${waypointInfo}`,
              distance: 0,
              duration: 0,
              coordinates: [],
            });
          }
        }
        
        steps.push({
          instruction: '🏁 Arrive at destination',
          distance: 0,
          duration: 0,
          coordinates: [[destination.lat, destination.lng]],
        });
        
        // Add popup to route polyline
        const routeType = travelMode === 'plane' ? 'Great Circle Route' : 'Maritime Route';
        const routePopupContent = `
          <div style="padding: 8px; min-width: 200px;">
            <div style="margin-bottom: 8px;">
              <strong>${modeEmoji} ${modeName}</strong>
            </div>
            <div style="margin-bottom: 4px; font-size: 10px; color: #888;">
              ${routeType}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>Distance:</strong> ${distance}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>Duration:</strong> ${duration}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>Cost:</strong> ${tripCost}
            </div>
            <div style="margin-bottom: 8px; font-size: 10px; color: #666;">
              Average speed: ${speedKmh} km/h
            </div>
            ${routeWaypoints.length > 2 ? `<div style="margin-bottom: 8px; font-size: 10px; color: #666;">
              Via ${routeWaypoints.length - 2} waypoint${routeWaypoints.length > 3 ? 's' : ''}
            </div>` : ''}
            <button 
              id="show-directions-instructions"
              style="
                width: 100%;
                padding: 8px 12px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: background 0.2s;
                margin-bottom: 6px;
              "
              onmouseover="this.style.background='#5568d3'"
              onmouseout="this.style.background='#667eea'"
            >
              📋 See Details
            </button>
            <button 
              id="save-route-from-popup"
              style="
                width: 100%;
                padding: 8px 12px;
                background: #34A853;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#2d8f47'"
              onmouseout="this.style.background='#34A853'"
            >
              💾 Save Route
            </button>
          </div>
        `;
        
        polyline.bindPopup(routePopupContent, {
          className: 'route-popup',
          closeButton: true,
        });
        
        polyline.on('click', (e: L.LeafletMouseEvent) => {
          polyline.openPopup(e.latlng);
        });
        
        // Create route result before setting up popup handlers
        const routeResult: RouteResult = {
          distance,
          duration,
          cost: tripCost,
          steps,
          geometry,
        };

        // Update popup handler to use captured route data
        const handlePopupOpen = () => {
          setTimeout(() => {
            const showDirectionsButton = document.getElementById('show-directions-instructions');
            const saveRouteButton = document.getElementById('save-route-from-popup');
            
            if (showDirectionsButton) {
              const newButton = showDirectionsButton.cloneNode(true) as HTMLButtonElement;
              showDirectionsButton.parentNode?.replaceChild(newButton, showDirectionsButton);
              
              newButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onShowDirections) {
                  onShowDirections();
                } else {
                  const event = new CustomEvent('showDirectionsPanel');
                  window.dispatchEvent(event);
                }
                polyline.closePopup();
              });
            }
            
            if (saveRouteButton) {
              const newSaveButton = saveRouteButton.cloneNode(true) as HTMLButtonElement;
              saveRouteButton.parentNode?.replaceChild(newSaveButton, saveRouteButton);
              
              newSaveButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Save route button clicked from maritime/air popup');
                
                // Use captured route data instead of state
                if (!origin || !destination || !geometry) {
                  alert('Route data is incomplete. Please recalculate the route.');
                  return;
                }
                
                const routeName = prompt('Enter a name for this route:', 
                  `${travelMode.charAt(0).toUpperCase() + travelMode.slice(1)} route from ${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)} to ${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
                );
                
                if (!routeName || routeName.trim() === '') return;
                
                try {
                  addSavedRoute({
                    name: routeName.trim(),
                    origin: { lat: origin.lat, lng: origin.lng },
                    destination: { lat: destination.lat, lng: destination.lng },
                    waypoints: waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng, id: wp.id })),
                    travelMode,
                    routeInfo: routeResult,
                    geometry: geometry,
                    color: routeColor,
                  });
                  
                  window.dispatchEvent(new CustomEvent('savedRoutesUpdated'));
                  alert('Route saved successfully!');
                } catch (error) {
                  console.error('Error saving route:', error);
                  alert('Failed to save route. Please try again.');
                }
                
                polyline.closePopup();
              });
            }
          }, 100);
        };
        
        polyline.on('popupopen', handlePopupOpen);

        // Auto-save the route after it's calculated and displayed
        autoSaveRoute(routeResult, geometry, routeColor);

        if (onRouteCalculated) {
          onRouteCalculated(routeResult);
        }
        
        if (onHideDirections) {
          onHideDirections();
        }
        
        // Show routes modal to display the route preview
        window.dispatchEvent(new CustomEvent('showSavedRoutesList'));
        
        setIsCalculating(false);
        return;
      }

      // Use OSRM (Open Source Routing Machine) for land-based travel - free, no API key required
      // Note: OSRM doesn't have a transit profile, so we use driving profile but will recalculate duration
      const profile = travelMode === 'driving' ? 'driving' :
                     travelMode === 'walking' ? 'walking' :
                     travelMode === 'cycling' ? 'cycling' :
                     travelMode === 'transit' ? 'driving' : // Use driving profile for transit, but recalculate duration
                     'driving';
      
      // Build coordinates string with all waypoints
      // OSRM format: {lng1},{lat1};{lng2},{lat2};{lng3},{lat3}...
      let coordinatesArray = [`${origin.lng},${origin.lat}`];
      
      // Add all waypoints in order
      waypoints.forEach(wp => {
        coordinatesArray.push(`${wp.lng},${wp.lat}`);
      });
      
      // Add destination
      coordinatesArray.push(`${destination.lng},${destination.lat}`);
      
      const coordinates = coordinatesArray.join(';');
      const url = `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Route calculation failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geometry = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
        
        // Draw the route on the map
        const polyline = L.polyline(geometry as L.LatLngExpression[], {
          color: '#667eea',
          weight: 4,
          opacity: 0.8,
          interactive: true, // Make it clickable
        }).addTo(map);
        
        routeLineRef.current = polyline;
        
        // Fit map to route
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

        // Format distance and duration (OSRM returns in meters and seconds)
        const distanceKm = (route.distance || 0) / 1000;
        let durationSeconds = route.duration || 0;
        
        // OSRM may not provide accurate durations for all modes, so recalculate based on user-defined speeds
        const speed = getSpeedForMode(travelMode);
        const calculatedDurationSeconds = Math.round((distanceKm / speed) * 3600); // Convert to seconds
        
        // Use calculated duration for walking and cycling (OSRM is less accurate for these)
        // For driving, prefer OSRM but fallback to calculation if duration seems off
        if (travelMode === 'walking' || travelMode === 'cycling' || travelMode === 'transit') {
          durationSeconds = calculatedDurationSeconds;
        } else if (travelMode === 'driving') {
          // For driving, use OSRM if it seems reasonable (within 20% of calculated)
          // Otherwise use calculated duration
          const ratio = durationSeconds / calculatedDurationSeconds;
          if (ratio < 0.8 || ratio > 1.2) {
            durationSeconds = calculatedDurationSeconds;
          }
        }
        
        const distance = distanceKm >= 1 
          ? `${distanceKm.toFixed(2)} km`
          : `${(distanceKm * 1000).toFixed(0)} m`;
        const duration = formatDuration(durationSeconds);
        
        // Calculate trip cost
        const tripCost = calculateTripCost(distanceKm, travelMode);
        
        // Build segment breakdown if there are waypoints
        let segmentInfo = '';
        if (route.legs && route.legs.length > 1) {
          segmentInfo = '<div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #dee2e6;"><div style="font-size: 11px; font-weight: 600; margin-bottom: 6px; color: #667eea;">Route Segments:</div>';
          
          // Calculate average speeds for duration recalculation (same as above)
          // Calculate average speeds for duration recalculation (use user settings)
          const legSpeed = getSpeedForMode(travelMode);
          
          route.legs.forEach((leg: any, index: number) => {
            const legDistanceKm = (leg.distance || 0) / 1000;
            let legDurationSeconds = leg.duration || 0;
            
            // Recalculate leg duration based on travel mode
            if (travelMode === 'walking' || travelMode === 'cycling' || travelMode === 'transit') {
              legDurationSeconds = Math.round((legDistanceKm / legSpeed) * 3600);
            } else if (travelMode === 'driving') {
              // For driving, use OSRM if reasonable, otherwise recalculate
              const calculatedLegDuration = Math.round((legDistanceKm / legSpeed) * 3600);
              const ratio = legDurationSeconds / calculatedLegDuration;
              if (ratio < 0.8 || ratio > 1.2) {
                legDurationSeconds = calculatedLegDuration;
              }
            }
            
            const legDuration = formatDuration(legDurationSeconds);
            const legDistance = legDistanceKm >= 1 
              ? `${legDistanceKm.toFixed(2)} km`
              : `${(legDistanceKm * 1000).toFixed(0)} m`;
            
            let segmentLabel = '';
            if (index === 0) {
              segmentLabel = waypoints.length > 0 ? `Start → Via ${index + 1}` : 'Start → End';
            } else if (index === route.legs.length - 1) {
              segmentLabel = `Via ${index} → End`;
            } else {
              segmentLabel = `Via ${index} → Via ${index + 1}`;
            }
            
            segmentInfo += `
              <div style="font-size: 10px; margin-bottom: 4px; padding: 4px; background: #f8f9fa; border-radius: 3px;">
                <div style="font-weight: 500; color: #333; margin-bottom: 2px;">${segmentLabel}</div>
                <div style="color: #666;">${legDistance} • ${legDuration}</div>
              </div>
            `;
          });
          
          segmentInfo += '</div>';
        }
        
        // Add popup to route polyline
        const routePopupContent = `
          <div style="padding: 8px; min-width: 220px; max-height: 400px; overflow-y: auto;">
            <div style="margin-bottom: 8px;">
              <strong>📍 Route Information</strong>
            </div>
            <div style="margin-bottom: 4px;">
              <strong>Total Distance:</strong> ${distance}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>Total Duration:</strong> ${duration}
            </div>
            <div style="margin-bottom: 8px;">
              <strong>Total Cost:</strong> ${tripCost}
            </div>
            ${segmentInfo}
            <button 
              id="show-directions-instructions"
              style="
                width: 100%;
                padding: 8px 12px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: background 0.2s;
                margin-top: 8px;
                margin-bottom: 6px;
              "
              onmouseover="this.style.background='#5568d3'"
              onmouseout="this.style.background='#667eea'"
            >
              📋 See Turn-by-Turn Directions
            </button>
            <button 
              id="save-route-from-popup"
              style="
                width: 100%;
                padding: 8px 12px;
                background: #34A853;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#2d8f47'"
              onmouseout="this.style.background='#34A853'"
            >
              💾 Save Route
            </button>
          </div>
        `;
        
        // Bind popup to polyline - opens when clicking anywhere on the route
        polyline.bindPopup(routePopupContent, {
          className: 'route-popup',
          closeButton: true,
        });
        
        // Make polyline clickable to open the popup
        polyline.on('click', (e: L.LeafletMouseEvent) => {
          polyline.openPopup(e.latlng);
        });
        
        // Extract turn-by-turn directions from ALL legs (includes waypoints)
        const steps: RouteResult['steps'] = [];
        
        // Calculate average speeds for duration recalculation (use user settings)
        const stepSpeed = getSpeedForMode(travelMode);
        
        // OSRM returns one leg per segment between waypoints
        if (route.legs && route.legs.length > 0) {
          route.legs.forEach((leg: any, legIndex: number) => {
            // Add segment header if there are multiple legs (waypoints)
            if (route.legs.length > 1) {
              let segmentLabel = '';
              if (legIndex === 0) {
                segmentLabel = waypoints.length > 0 ? `Start → Via ${legIndex + 1}` : 'Start → End';
              } else if (legIndex === route.legs.length - 1) {
                segmentLabel = `Via ${legIndex} → End`;
              } else {
                segmentLabel = `Via ${legIndex} → Via ${legIndex + 1}`;
              }
              
              const legDistanceKm = (leg.distance || 0) / 1000;
              let legDurationSeconds = leg.duration || 0;
              
              // Recalculate leg duration based on travel mode
              if (travelMode === 'walking' || travelMode === 'cycling' || travelMode === 'transit') {
                legDurationSeconds = Math.round((legDistanceKm / stepSpeed) * 3600);
              } else if (travelMode === 'driving') {
                const calculatedLegDuration = Math.round((legDistanceKm / stepSpeed) * 3600);
                const ratio = legDurationSeconds / calculatedLegDuration;
                if (ratio < 0.8 || ratio > 1.2) {
                  legDurationSeconds = calculatedLegDuration;
                }
              }
              
              const legDuration = formatDuration(legDurationSeconds);
              const legDistance = legDistanceKm >= 1 
                ? `${legDistanceKm.toFixed(2)} km`
                : `${(legDistanceKm * 1000).toFixed(0)} m`;
              
              // Add segment header as a special step
              steps.push({
                instruction: `${segmentLabel} (${legDistance} • ${legDuration})`,
                distance: leg.distance || 0,
                duration: legDurationSeconds,
                coordinates: [],
                segmentIndex: legIndex,
                isSegmentStart: true,
                segmentLabel,
              });
            }
            
            if (leg.steps && leg.steps.length > 0) {
              leg.steps.forEach((step: any) => {
                // OSRM step geometry is in [lng, lat] format
                const stepCoords = step.geometry?.coordinates 
                  ? step.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
                  : [];
                
                // Build a better instruction with street name
                let instruction = '';
                const maneuverType = step.maneuver?.type || '';
                const maneuverModifier = step.maneuver?.modifier || '';
                const streetName = Array.isArray(step.name) ? step.name[0] : (step.name || '');
                const ref = Array.isArray(step.ref) ? step.ref[0] : (step.ref || '');
                
                // Format instruction based on maneuver type and modifier
                if (maneuverType === 'depart') {
                  instruction = `Head ${maneuverModifier || 'straight'}`;
                } else if (maneuverType === 'arrive') {
                  // Check if this is arriving at a waypoint or final destination
                  if (legIndex < route.legs.length - 1) {
                    instruction = `Arrive at waypoint ${legIndex + 1}`;
                  } else {
                    instruction = 'Arrive at destination';
                  }
                } else if (maneuverType === 'turn') {
                  const direction = maneuverModifier === 'left' ? 'left' : 
                                  maneuverModifier === 'right' ? 'right' : 
                                  maneuverModifier === 'sharp left' ? 'sharp left' :
                                  maneuverModifier === 'sharp right' ? 'sharp right' :
                                  maneuverModifier === 'slight left' ? 'slight left' :
                                  maneuverModifier === 'slight right' ? 'slight right' : 'straight';
                  instruction = `Turn ${direction}`;
                } else if (maneuverType === 'merge') {
                  instruction = 'Merge';
                } else if (maneuverType === 'ramp') {
                  instruction = 'Take the ramp';
                } else if (maneuverType === 'fork') {
                  const direction = maneuverModifier === 'left' ? 'left fork' : 
                                  maneuverModifier === 'right' ? 'right fork' : 'fork';
                  instruction = `Take the ${direction}`;
                } else if (maneuverType === 'roundabout') {
                  const exit = step.maneuver?.exit || '';
                  instruction = `Enter roundabout and take exit ${exit}`;
                } else if (maneuverType === 'continue') {
                  instruction = 'Continue straight';
                } else {
                  // Use the raw instruction if available, otherwise use type
                  instruction = step.maneuver?.instruction || maneuverType || 'Continue';
                }
                
                // Add street name or ref if available
                const roadName = streetName || ref;
                if (roadName && roadName !== 'unnamed road' && roadName.trim() !== '') {
                  // Only add "onto" if it's not already in the instruction
                  if (!instruction.toLowerCase().includes('onto') && !instruction.toLowerCase().includes('on')) {
                    instruction += ` onto ${roadName}`;
                  } else {
                    instruction += ` ${roadName}`;
                  }
                }
                
                // Recalculate step duration based on travel mode
                const stepDistanceKm = (step.distance || 0) / 1000;
                let stepDurationSeconds = step.duration || 0;
                
                if (travelMode === 'walking' || travelMode === 'cycling' || travelMode === 'transit') {
                  stepDurationSeconds = Math.round((stepDistanceKm / stepSpeed) * 3600);
                } else if (travelMode === 'driving') {
                  const calculatedStepDuration = Math.round((stepDistanceKm / stepSpeed) * 3600);
                  const ratio = stepDurationSeconds / calculatedStepDuration;
                  if (ratio < 0.8 || ratio > 1.2) {
                    stepDurationSeconds = calculatedStepDuration;
                  }
                }
                
                steps.push({
                  instruction: instruction.trim(),
                  distance: step.distance || 0,
                  duration: stepDurationSeconds,
                  coordinates: stepCoords,
                  segmentIndex: legIndex,
                });
              });
            }
          });
        }

        // Create route result before setting up popup handlers
        const routeResultForPopup: RouteResult = {
          distance,
          duration,
          cost: tripCost,
          steps,
          geometry,
        };
        
        // Add click handler to show directions panel when button is clicked
        const handlePopupOpenOSRM = () => {
          // Small delay to ensure popup is fully rendered
          setTimeout(() => {
            const showDirectionsButton = document.getElementById('show-directions-instructions');
            const saveRouteButton = document.getElementById('save-route-from-popup');
            
            console.log('Popup opened, looking for buttons:', { showDirectionsButton, saveRouteButton });
            
            if (showDirectionsButton) {
              console.log('Setting up directions button handler, onShowDirections:', !!onShowDirections);
              
              // Remove any existing listeners by cloning
              const newButton = showDirectionsButton.cloneNode(true) as HTMLButtonElement;
              showDirectionsButton.parentNode?.replaceChild(newButton, showDirectionsButton);
              
              newButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Directions button clicked!');
                if (onShowDirections) {
                  console.log('Calling onShowDirections callback');
                  onShowDirections();
                } else {
                  console.log('No callback, dispatching event');
                  // Fallback: dispatch event to show directions
                  const event = new CustomEvent('showDirectionsPanel');
                  window.dispatchEvent(event);
                }
                // Close popup
                polyline.closePopup();
              });
            } else {
              console.warn('Directions button not found in popup');
            }
            
            if (saveRouteButton) {
              // Remove any existing listeners by cloning
              const newSaveButton = saveRouteButton.cloneNode(true) as HTMLButtonElement;
              saveRouteButton.parentNode?.replaceChild(newSaveButton, saveRouteButton);
              
              newSaveButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Save route button clicked from popup');
                
                // Use captured route data instead of state
                if (!origin || !destination || !geometry) {
                  alert('Route data is incomplete. Please recalculate the route.');
                  return;
                }
                
                const routeName = prompt('Enter a name for this route:', 
                  `${travelMode.charAt(0).toUpperCase() + travelMode.slice(1)} route from ${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)} to ${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
                );
                
                if (!routeName || routeName.trim() === '') return;
                
                try {
                  addSavedRoute({
                    name: routeName.trim(),
                    origin: { lat: origin.lat, lng: origin.lng },
                    destination: { lat: destination.lat, lng: destination.lng },
                    waypoints: waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng, id: wp.id })),
                    travelMode,
                    routeInfo: routeResultForPopup,
                    geometry: geometry,
                    color: '#667eea',
                  });
                  
                  window.dispatchEvent(new CustomEvent('savedRoutesUpdated'));
                  alert('Route saved successfully!');
                } catch (error) {
                  console.error('Error saving route:', error);
                  alert('Failed to save route. Please try again.');
                }
                
                // Close popup after saving
                polyline.closePopup();
              });
            } else {
              console.warn('Save route button not found in popup');
            }
          }, 100);
        };
        
        polyline.on('popupopen', handlePopupOpenOSRM);

        // Auto-save the route after it's calculated and displayed
        autoSaveRoute(routeResultForPopup, geometry, '#667eea');

        if (onRouteCalculated) {
          onRouteCalculated(routeResultForPopup);
        }
        
        // Hide the directions panel after calculating route
        if (onHideDirections) {
          onHideDirections();
        }
        
        // Show routes modal to display the route preview
        window.dispatchEvent(new CustomEvent('showSavedRoutesList'));
      } else {
        throw new Error(data.code || 'Route calculation failed');
      }
    } catch (error: any) {
      console.error('Error calculating route:', error);
      setApiError('GENERIC_ERROR');
    } finally {
      setIsCalculating(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  // Export formatDuration for use in other components
  (window as any).formatDuration = formatDuration;



  return (
    <DirectionsContainer>
      <DirectionsHeader>
        {onClose && (
          <CloseButton onClick={onClose} title="Close directions">
            <FiX size={16} />
          </CloseButton>
        )}
        <FiNavigation size={16} />
        <HeaderTitle>{showSettings ? 'Speed Settings' : 'Directions'}</HeaderTitle>
        {showSettings ? (
          <GoBackButton onClick={() => setShowSettings(false)}>
            <FiArrowLeft size={14} />
            Back
          </GoBackButton>
        ) : (
          <CloseButton 
            onClick={() => setShowSettings(true)} 
            title="Speed settings"
            style={{ marginLeft: 'auto' }}
          >
            <FiSettings size={16} />
          </CloseButton>
        )}
      </DirectionsHeader>

      <DirectionsContent>
        {showSettings ? (
          <SpeedSettingsPanel />
        ) : (
          <>
            {apiError && (
              <ErrorBox>
                <ErrorTitle>⚠️ Route Calculation Failed</ErrorTitle>
                <div>
                  Could not calculate route. Please check your selections.
                  <br />
                  Note: OpenRouteService has rate limits. For production use, get a free API key from{' '}
                  <a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}>
                    openrouteservice.org
                  </a>
                </div>
              </ErrorBox>
            )}
        
        <>

            <SelectPointsButton 
              onClick={togglePointSelection}
              $active={isSelectingPoints}
              disabled={hasCalculatedRoute}
            >
              {isSelectingPoints ? (
                <>
                  <FiMapPin size={16} />
                  Stop Selecting (click to finish)
                </>
              ) : (
                <>
                  <FiMapPin size={16} />
                  Select Points on Map
                </>
              )}
            </SelectPointsButton>

            {selectedPoints.length > 0 && (
              <PointsList>
                {selectedPoints.map((point, index) => {
                  const isFirst = index === 0;
                  const isLast = index === selectedPoints.length - 1;
                  const type = isFirst ? 'origin' : isLast && selectedPoints.length > 1 ? 'destination' : 'waypoint';
                  
                  return (
                    <PointsListItem key={point.id}>
                      <PointNumber $type={type}>
                        {isFirst ? 'A' : index}
                      </PointNumber>
                      <PointCoords>
                        {isFirst ? 'Start: ' : isLast && selectedPoints.length > 1 ? 'End: ' : `Via ${index}: `}
                        {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                      </PointCoords>
                      <ReorderButtons>
                        <ReorderButton 
                          onClick={() => reorderPoint(point.id, 'up')}
                          disabled={isFirst}
                          title="Move up"
                        >
                          <FiArrowUp size={12} />
                        </ReorderButton>
                        <ReorderButton 
                          onClick={() => reorderPoint(point.id, 'down')}
                          disabled={isLast}
                          title="Move down"
                        >
                          <FiArrowDown size={12} />
                        </ReorderButton>
                      </ReorderButtons>
                      <RemovePointButton onClick={() => removePointFromRoute(point.id)}>
                        <FiX size={14} />
                      </RemovePointButton>
                    </PointsListItem>
                  );
                })}
              </PointsList>
            )}

            {selectedPoints.length > 0 && (
              <AddWaypointButton onClick={clearAllPoints}>
                Clear All Points
              </AddWaypointButton>
            )}

            <TransportModesSection>
              <ModeSectionTitle>Ground Transport</ModeSectionTitle>
              <TravelModeSelector>
                <TravelModeButton
                  $active={travelMode === 'driving'}
                  onClick={() => setTravelMode('driving')}
                >
                  🚗 Driving
                </TravelModeButton>
                <TravelModeButton
                  $active={travelMode === 'walking'}
                  onClick={() => setTravelMode('walking')}
                >
                  🚶 Walking
                </TravelModeButton>
                <TravelModeButton
                  $active={travelMode === 'cycling'}
                  onClick={() => setTravelMode('cycling')}
                >
                  🚴 Cycling
                </TravelModeButton>
                <TravelModeButton
                  $active={travelMode === 'transit'}
                  onClick={() => setTravelMode('transit')}
                >
                  🚌 Transit
                </TravelModeButton>
              </TravelModeSelector>
            </TransportModesSection>

            <TransportModesSection>
              <ModeSectionTitle>Air & Sea Transport</ModeSectionTitle>
              <TravelModeSelector>
                <TravelModeButton
                  $active={travelMode === 'plane'}
                  onClick={() => setTravelMode('plane')}
                >
                  ✈️ Plane
                </TravelModeButton>
                <TravelModeButton
                  $active={travelMode === 'boat'}
                  onClick={() => setTravelMode('boat')}
                >
                  ⛵ Boat
                </TravelModeButton>
                <TravelModeButton
                  $active={travelMode === 'container-ship'}
                  onClick={() => setTravelMode('container-ship')}
                  style={{ gridColumn: 'span 2' }}
                >
                  🚢 Container Ship
                </TravelModeButton>
              </TravelModeSelector>
            </TransportModesSection>

            <GetDirectionsButton
              onClick={calculateRoute}
              disabled={!origin || !destination || isCalculating}
            >
              {isCalculating ? 'Calculating...' : 'Get Directions'}
            </GetDirectionsButton>
        </>

          </>
        )}
      </DirectionsContent>
    </DirectionsContainer>
  );
};

export default DirectionsPanel;

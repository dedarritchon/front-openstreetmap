import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { isLocationPinned } from '../utils/pinnedLocationsStorage';
import type { Coordinate } from './useLocationDetection';
import type { PinnedLocation } from '../utils/pinnedLocationsStorage';

export const useMarkers = (
  map: L.Map | null,
  coordinates: Coordinate[],
  pinnedLocations: PinnedLocation[]
) => {
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Add markers to map when coordinates, pinned locations, or map changes
  useEffect(() => {
    if (!map) {
      console.log('🗺️ Map not ready');
      return;
    }

    // Combine current conversation locations and pinned locations with deduplication
    console.log(`📊 Before deduplication: ${coordinates.length} conversation coordinates, ${pinnedLocations.length} pinned locations`);
    
    const allLocationsMap = new Map<string, Coordinate>();
    
    // Add current conversation coordinates
    coordinates.forEach((coord) => {
      const key = `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`;
      if (!allLocationsMap.has(key)) {
        allLocationsMap.set(key, coord);
        console.log(`  ✅ Added conversation coordinate: ${coord.lat}, ${coord.lng}`);
      }
    });
    
    // Add pinned locations (they take precedence if same coordinates)
    pinnedLocations.forEach((p) => {
      const key = `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
      const coord: Coordinate & { name?: string } = {
        lat: p.lat,
        lng: p.lng,
        id: p.id,
        text: p.text,
        address: p.address,
        name: p.name ?? p.address ?? p.text,
      };
      allLocationsMap.set(key, coord); // Pinned locations override regular ones
    });

    const allLocations = Array.from(allLocationsMap.values());
    console.log(`📊 After deduplication: ${allLocations.length} unique locations`);

    if (allLocations.length === 0) {
      console.log('🗺️ No locations to display');
      return;
    }

    console.log(`📍 Adding ${allLocations.length} unique marker(s) to map...`);

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
            type="button"
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
        ` : '';
        
        const unpinButtonHtml = isPinned ? `
          <button 
            id="unpin-location-${coord.id}" 
            data-location-id="${coord.id}"
            type="button"
            style="
              margin-top: 8px;
              padding: 6px 8px;
              background: #dc3545;
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
            onmouseover="this.style.background='#c82333'"
            onmouseout="this.style.background='#dc3545'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
            Unpin Location
          </button>
        ` : '';
        
        const directionsButtonHtml = `
          <button 
            id="directions-from-${coord.id}" 
            data-location-id="${coord.id}"
            data-lat="${coord.lat}"
            data-lng="${coord.lng}"
            type="button"
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
        
        const displayName = (coord as { name?: string }).name || coord.address || coord.text;
        const hasCustomName = !!(coord.address || (coord as { name?: string }).name);
        if (hasCustomName) {
          popupContent = `
            <div style="padding: 8px; min-width: 200px;">
              <strong>📍 ${displayName}</strong><br/>
              <small style="color: #666;">${coord.lat}, ${coord.lng}</small>
              ${isPinned ? '<br/><small style="color: #667eea;">📌 Pinned</small>' : ''}
              ${saveButtonHtml}
              ${unpinButtonHtml}
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
              ${unpinButtonHtml}
              ${directionsButtonHtml}
            </div>
          `;
        }
        marker.bindPopup(popupContent);
        
        // Add click handler to marker
        marker.on('click', () => {
          const clickEvent = new CustomEvent('markerClickForDirections', {
            detail: { lat: coord.lat, lng: coord.lng, id: coord.id }
          });
          window.dispatchEvent(clickEvent);
        });
        
        newMarkers.push(marker);
        markersMapRef.current.set(coord.id, marker);
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

    // Note: We intentionally do NOT auto-zoom or auto-center the map when markers are added
    // to avoid jarring view changes. The user's current view is preserved.

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

  const findAndOpenMarker = useCallback((location: Coordinate, showListView: boolean, openListView: (open: boolean) => void) => {
    if (!map) return;

    const findMarker = (attempt = 0) => {
      if (!map) {
        if (attempt < 10) {
          setTimeout(() => findMarker(attempt + 1), 100);
        }
        return;
      }
      
      let marker = markersMapRef.current.get(location.id);
      
        if (!marker) {
          const coordKey = `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`;
          marker = markersMapRef.current.get(`coord:${coordKey}`);
          if (!marker) {
            markersMapRef.current.forEach((m) => {
              const markerLatLng = m.getLatLng();
              const markerKey = `${markerLatLng.lat.toFixed(6)},${markerLatLng.lng.toFixed(6)}`;
              if (markerKey === coordKey) {
                marker = m;
              }
            });
          }
        }
      
      if (marker) {
        map.setView([location.lat, location.lng], 16);
        setTimeout(() => {
          marker?.openPopup();
        }, 400);
      } else {
        if (attempt < 10) {
          setTimeout(() => findMarker(attempt + 1), 200);
        } else {
          console.error('❌ Marker not found for location after 10 attempts:', location);
        }
      }
    };
    
    if (showListView) {
      openListView(false);
      setTimeout(() => {
        findMarker();
      }, 500);
    } else {
      findMarker();
    }
  }, [map]);

  return {
    markers,
    markersMapRef,
    findAndOpenMarker,
  };
};

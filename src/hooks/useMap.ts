import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface UseMapOptions {
  center?: { lat: number; lng: number };
  zoom?: number;
}

export const useMap = (options: UseMapOptions = {}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || map) return;

    // Wait for the container to be in the DOM
    if (!mapRef.current.parentElement) {
      return;
    }

    let newMap: L.Map | null = null;

    try {
      // Initialize map
      newMap = L.map(mapRef.current, {
        center: options.center ? [options.center.lat, options.center.lng] : [37.7749, -122.4194], // San Francisco default
        zoom: options.zoom || 12,
      });

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(newMap);

      // Set map state
      setMap(newMap);
      setIsLoaded(true);

      // Invalidate size after a short delay to ensure container is fully rendered
      setTimeout(() => {
        if (newMap) {
          newMap.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (newMap) {
        newMap.remove();
        newMap = null;
      }
    };
  }, [map, options.center?.lat, options.center?.lng, options.zoom]);

  return { mapRef, map, isLoaded };
};

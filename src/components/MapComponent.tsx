import L from 'leaflet';
import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import 'leaflet/dist/leaflet.css';

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  background: #e5e5e5;
  flex: 1;
  
  .leaflet-container {
    height: 100% !important;
    width: 100% !important;
    z-index: 0;
  }
`;

interface MapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapLoad?: (map: L.Map) => void;
}

const MapComponent = ({
  // Default to a world view on first load
  center = { lat: 0, lng: 0 },
  zoom = 2,
  onMapLoad,
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Check if container has dimensions
      const rect = mapRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.log('Container has no dimensions, retrying...');
        setTimeout(initMap, 100);
        return;
      }

      try {
        console.log('Initializing Leaflet map...', {
          width: rect.width,
          height: rect.height,
        });
        
        // Create map
        const map = L.map(mapRef.current!, {
          center: [center.lat, center.lng],
          zoom: zoom,
          zoomControl: true,
          attributionControl: false,
        });

        console.log('Map created, adding tile layer...');

        // Add tile layer
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        });
        
        tileLayer.addTo(map);

        mapInstanceRef.current = map;

        // Invalidate size multiple times to ensure it renders
        setTimeout(() => {
          map.invalidateSize();
          console.log('Map size invalidated (1st time)');
        }, 100);

        setTimeout(() => {
          map.invalidateSize();
          console.log('Map size invalidated (2nd time)');
        }, 300);

        if (onMapLoad) {
          onMapLoad(map);
        }
      } catch (error) {
        console.error('Error creating map:', error);
      }
    };

    // Wait a bit to ensure container is in DOM and has dimensions
    const timer = setTimeout(initMap, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Only run once

  return <MapContainer ref={mapRef} id="leaflet-map-container" />;
};

export default MapComponent;

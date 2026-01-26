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

export type MapStyle = 'standard' | 'terrain' | 'satellite';

interface MapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapLoad?: (map: L.Map) => void;
  mapStyle?: MapStyle;
}

const MapComponent = ({
  // Default to a world view on first load
  center = { lat: 0, lng: 0 },
  zoom = 2,
  onMapLoad,
  mapStyle = 'standard',
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Create tile layer based on map style
  const createTileLayer = (style: MapStyle): L.TileLayer => {
    if (style === 'terrain') {
      // OpenTopoMap for terrain view
      return L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors, © OpenTopoMap',
        maxZoom: 17,
        subdomains: ['a', 'b', 'c'],
      });
    } else if (style === 'satellite') {
      // Esri World Imagery for satellite view
      return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
        maxZoom: 19,
      });
    } else {
      // Standard OpenStreetMap
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      });
    }
  };

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

        // Add initial tile layer
        const tileLayer = createTileLayer(mapStyle);
        tileLayer.addTo(map);
        tileLayerRef.current = tileLayer;

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
        tileLayerRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update tile layer when mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    // Remove old tile layer
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    // Add new tile layer
    const newTileLayer = createTileLayer(mapStyle);
    newTileLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;

    console.log(`Map style changed to: ${mapStyle}`);
  }, [mapStyle]);

  return <MapContainer ref={mapRef} id="leaflet-map-container" />;
};

export default MapComponent;

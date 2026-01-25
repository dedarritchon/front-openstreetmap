import type { LatLngExpression } from 'leaflet';

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
}

export type TravelMode = 'driving' | 'walking' | 'cycling' | 'transit' | 'plane' | 'container-ship' | 'boat';

export interface RouteRequest {
  origin: MapLocation;
  destination: MapLocation;
  travelMode?: TravelMode;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: LatLngExpression[];
  segmentIndex?: number; // Which leg/segment this step belongs to
  isSegmentStart?: boolean; // Marker for segment header
  segmentLabel?: string; // Label for segment (e.g., "Start → Via 1")
}

export interface RouteResult {
  distance: string;
  duration: string;
  steps: RouteStep[];
  geometry: LatLngExpression[];
}

import type { RouteResult, TravelMode } from '../types/maps';

export interface SavedRoute {
  id: string;
  name: string;
  origin: { lat: number; lng: number; address?: string };
  destination: { lat: number; lng: number; address?: string };
  waypoints: Array<{ lat: number; lng: number; address?: string; id: string }>;
  travelMode: TravelMode;
  routeInfo: RouteResult;
  geometry: [number, number][];
  color: string;
  savedAt: number; // timestamp
}

const STORAGE_KEY = 'front-openstreetmap-saved-routes';

/**
 * Load all saved routes from localStorage
 */
export function loadSavedRoutes(): SavedRoute[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading saved routes:', error);
  }
  return [];
}

/**
 * Save routes to localStorage
 */
export function saveSavedRoutes(routes: SavedRoute[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
  } catch (error) {
    console.error('Error saving saved routes:', error);
  }
}

/**
 * Add a new route to saved routes
 */
export function addSavedRoute(route: Omit<SavedRoute, 'id' | 'savedAt'>): string {
  const routes = loadSavedRoutes();
  const id = `route-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const newRoute: SavedRoute = {
    ...route,
    id,
    savedAt: Date.now(),
  };
  routes.push(newRoute);
  saveSavedRoutes(routes);
  return id;
}

/**
 * Remove a saved route by ID
 */
export function removeSavedRoute(routeId: string): void {
  const routes = loadSavedRoutes();
  const filtered = routes.filter(r => r.id !== routeId);
  saveSavedRoutes(filtered);
}

/**
 * Update a saved route
 */
export function updateSavedRoute(routeId: string, updates: Partial<SavedRoute>): void {
  const routes = loadSavedRoutes();
  const index = routes.findIndex(r => r.id === routeId);
  if (index !== -1) {
    routes[index] = { ...routes[index], ...updates };
    saveSavedRoutes(routes);
  }
}

/**
 * Get a saved route by ID
 */
export function getSavedRoute(routeId: string): SavedRoute | null {
  const routes = loadSavedRoutes();
  return routes.find(r => r.id === routeId) || null;
}

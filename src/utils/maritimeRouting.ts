/**
 * Maritime routing utilities
 * Uses SeaRoute-like logic to find routes that avoid land
 */

interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Calculate maritime route between waypoints
 * Simply connects waypoints with smooth great circle segments
 * Users control the route by selecting waypoints manually
 */
export async function calculateMaritimeRoute(
  origin: Coordinate,
  destination: Coordinate
): Promise<Coordinate[]> {
  // Simple great circle route with smoothing
  const route: Coordinate[] = [origin];
  
  // Calculate distance to determine smoothing
  const R = 6371;
  const dLat = (destination.lat - origin.lat) * Math.PI / 180;
  const dLng = (destination.lng - origin.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // Add intermediate points for long segments (every 500km)
  const numIntermediatePoints = Math.max(0, Math.floor(distance / 500) - 1);
  
  for (let j = 1; j <= numIntermediatePoints; j++) {
    const fraction = j / (numIntermediatePoints + 1);
    route.push({
      lat: origin.lat + (destination.lat - origin.lat) * fraction,
      lng: origin.lng + (destination.lng - origin.lng) * fraction,
    });
  }
  
  route.push(destination);
  return route;
}

/**
 * Calculate great circle waypoints for air routes
 * Creates intermediate points along the great circle path
 */
export function calculateAirRouteWaypoints(
  origin: Coordinate,
  destination: Coordinate,
  numWaypoints: number = 10
): Coordinate[] {
  const waypoints: Coordinate[] = [origin];

  // Convert to radians
  const lat1 = (origin.lat * Math.PI) / 180;
  const lng1 = (origin.lng * Math.PI) / 180;
  const lat2 = (destination.lat * Math.PI) / 180;
  const lng2 = (destination.lng * Math.PI) / 180;

  // Calculate distance
  const d = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
  );

  // Generate intermediate points
  for (let i = 1; i < numWaypoints; i++) {
    const f = i / numWaypoints;
    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);

    const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
    const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lng = Math.atan2(y, x);

    waypoints.push({
      lat: (lat * 180) / Math.PI,
      lng: (lng * 180) / Math.PI,
    });
  }

  waypoints.push(destination);
  return waypoints;
}

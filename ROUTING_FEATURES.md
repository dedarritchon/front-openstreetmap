# Maritime and Air Routing Features

This document explains the realistic routing features for maritime (boats, container ships) and air (planes) travel modes.

## Overview

The application now supports **realistic routing** for air and sea travel:

- **Maritime Routes**: Routes that avoid land masses and follow realistic shipping paths
- **Air Routes**: Great circle routes with intermediate waypoints for accurate representation

## Maritime Routing

### How It Works

Maritime routing now uses a **user-controlled waypoint system**:

**Simple Great Circle Routing**:
- Routes directly between the points you select
- Adds smooth intermediate points for visualization
- No automatic route detection that might conflict with your choices

**You Control the Route**:
- Want to go through Panama Canal? Add it as a waypoint
- Need to avoid an area? Add waypoints around it
- Multi-stop voyage? Add all your ports in order

### Why This Approach?

The automatic route detection was removed because:
- It conflicted with user-selected waypoints
- Sometimes routes through unexpected passages
- Users know their routes better than algorithms
- Simpler = more predictable = better UX

### Manual Waypoint Strategy

For realistic maritime routes, simply add waypoints at key locations:

**Example - Lima to Miami via Panama:**
1. Click "Select Points"
2. Click Lima (or save it as a location)
3. Click Panama Canal waypoint (9.4°N, -79.9°W)
4. Click Miami
5. Get Directions

Result: Lima → Panama Canal → Miami (avoiding land) ✅

### Supported Maritime Waypoints (User-Selected)

Instead of automatic detection, save these locations for easy waypoint selection:

- **Suez Canal** (30.0°N, 32.5°E) - Mediterranean to Red Sea
- **Panama Canal** (9.0°N, 79.5°W) - Atlantic to Pacific
- **Strait of Gibraltar** (36.0°N, 5.5°W) - Mediterranean to Atlantic
- **Strait of Malacca** (1.5°N, 103.0°E) - Indian Ocean to Pacific
- **Cape of Good Hope** (34.5°S, 18.5°E) - Around southern Africa
- **Cape Horn** (55.9°S, 67.3°W) - Around southern South America

Save these as locations in your app, then click them as waypoints when building routes!

### Route Detection Examples

The system automatically detects these route types and applies appropriate waypoints:

#### Europe ↔ Asia
- **Northern Mediterranean Route**: Via Suez Canal and Strait of Malacca
- **Southern Route**: Around Cape of Good Hope (for southern origins/destinations)
- Example: Rotterdam → Singapore via Suez Canal

#### Trans-Atlantic (Europe/Africa ↔ Americas)
- **North Atlantic**: Direct crossing with mid-ocean waypoint
- **South Atlantic**: Southern crossing route
- **Mid-Atlantic**: Routes between tropical regions
- Example: Lisbon → New York (direct North Atlantic)

#### Trans-Pacific (Asia ↔ Americas)
- **Northern Pacific**: Routes north of 15°N
- **Southern Pacific**: Routes south of -5°N
- **Equatorial Pacific**: Routes near the equator
- Example: Tokyo → Los Angeles (Northern Pacific route)

#### Around South America
- **Panama Canal Route**: For northern routes (Caribbean to Pacific)
- **Cape Horn Route**: For southern routes (Atlantic to Pacific around the continent)
- Example: Buenos Aires → Lima (around Cape Horn)

#### Africa ↔ Americas
- **Mid-Atlantic Waypoint**: Crossing route through middle of Atlantic
- Example: Lagos → Rio de Janeiro

#### Oceania Routes
- **Australia ↔ Asia**: Via Strait of Malacca
- **Australia ↔ Americas**: Trans-Pacific crossing
- **Australia ↔ Europe**: Via Malacca, Suez, Gibraltar
- Example: Sydney → Rotterdam (via Suez Canal)

### Travel Speeds

- **Container Ship (🚢)**: 41 km/h (~22 knots average)
- **Recreational Boat (⛵)**: 37 km/h (~20 knots average)

### Visual Styling

- **Container Ship**: Green solid line (#2ECC71)
- **Recreational Boat**: Blue solid line (#3498DB)

## Air Routing

### How It Works

Air routing uses **great circle navigation**, which is how real aircraft navigate:

1. **Great Circle Path**: The shortest distance between two points on a sphere (Earth)
2. **Waypoints**: Route includes 20 intermediate waypoints for smooth visualization
3. **Accurate Distance**: Calculates actual distance along the curved path

### Mathematical Implementation

Uses the spherical interpolation formula:
- Converts coordinates to radians
- Calculates angular distance
- Generates intermediate points along the great circle
- Provides accurate representation of actual flight paths

### Travel Speed

- **Commercial Plane (✈️)**: 850 km/h (cruising speed)

### Visual Styling

- **Plane**: Blue dashed line (#4A90E2)
- Dashed pattern represents air travel

## Using the Routes

### Selecting a Route

1. Open the Directions panel
2. Choose your transport mode:
   - **Ground Transport**: Driving, Walking, Cycling, Transit
   - **Air & Sea Transport**: Plane, Boat, Container Ship
3. Click to select origin and destination
4. Click "Get Directions"

### Route Information Display

When you click on a calculated route, you'll see:

- **Transport Mode**: Icon and name
- **Route Type**: "Maritime Route" or "Great Circle Route"
- **Distance**: Total distance in kilometers
- **Duration**: Estimated travel time
- **Average Speed**: Speed used for calculation
- **Waypoints**: Number of intermediate points (for maritime routes)

### Route Details Panel

After calculating a route, the details panel shows:

- Distance and duration summary
- Step-by-step information:
  - Departure information
  - Waypoint count (for maritime routes)
  - Arrival notification

## Technical Implementation

### Files

- **`src/utils/maritimeRouting.ts`**: Maritime and air routing logic
  - `calculateMaritimeRoute()`: Fetches or generates maritime routes
  - `calculateAirRouteWaypoints()`: Generates great circle waypoints
  - `calculateApproximateMaritimeRoute()`: Fallback maritime routing
  - `calculateMaritimeWaypoints()`: Chokepoint detection

- **`src/components/DirectionsPanel.tsx`**: UI and route calculation
  - Integrates maritime/air routing functions
  - Displays routes on the map
  - Shows detailed route information

### API Integration

The maritime routing system is **fully self-contained** and requires no external API calls. All routing logic runs locally in the browser.

#### How It Works Internally

1. **Region Detection**: Identifies which geographical regions the origin and destination are in
2. **Route Selection**: Chooses appropriate waypoints based on the region combination
3. **Waypoint Generation**: Creates strategic waypoints through maritime passages
4. **Route Smoothing**: Adds intermediate points every ~500km for visualization

#### Optional Enhancements

For production applications requiring higher accuracy, you can integrate external services:

**Searoutes Commercial API**:
```javascript
// Requires API key from https://api.searoutes.com
const response = await fetch('https://api.searoutes.com/route', {
  headers: { 'x-api-key': 'YOUR_API_KEY' },
  // ... request body
});
```

**Self-Hosted SeaRoute**:
- Download from https://github.com/eurostat/searoute
- Deploy as Java servlet
- Call from your application

## Distance Calculation

### Ground Routes (Driving, Walking, Cycling, Transit)
- Uses OSRM (Open Source Routing Machine)
- Follows actual roads and paths
- Provides turn-by-turn directions

### Maritime Routes (Boat, Container Ship)
- Calculates distance along the waypoint path
- Sum of great circle distances between consecutive waypoints
- Avoids land masses

### Air Routes (Plane)
- Great circle distance calculation
- Most accurate representation of actual flight distance
- Includes waypoints for visualization

## Future Enhancements

Potential improvements for maritime and air routing:

### Maritime
- Integration with real-time weather data
- Fuel consumption estimates
- Port-to-port specific routing
- Consideration of vessel draft and dimensions
- Ice avoidance for polar routes

### Air
- Integration with actual flight route databases (OpenFlights)
- Airways and waypoint navigation
- Flight level considerations
- Wind patterns and jet streams
- Flight time zones and schedules

## Performance Notes

- **Maritime routing**: First attempt uses API (fast if available), falls back to local calculation
- **Air routing**: Entirely local calculation, very fast
- **Route display**: Smooth polylines with appropriate colors and styles
- **Waypoint count**: Balanced for visual quality and performance

## Troubleshooting

### Maritime Routes Look Unrealistic

The routing system uses geographical heuristics optimized for major shipping routes. For some routes:
- Complex coastlines may not be perfectly followed
- Small islands might not be avoided
- Routes prioritize major maritime passages

**Solutions**:
- Routes work best for intercontinental shipping
- For high-precision coastal navigation, consider integrating commercial APIs
- The system is optimized for routes > 500km

### Routes Through Unexpected Areas

Some routes may use:
- Different passages than expected (e.g., Suez vs Cape of Good Hope)
- Strategic waypoints for ocean crossings
- Recognized maritime chokepoints

This is **intentional** and follows real-world shipping practices.

### Route Not Displaying

- Ensure origin and destination are set
- Check browser console for errors
- Verify map is properly initialized
- Try refreshing the page

## Credits

- **SeaRoute**: Eurostat open-source maritime routing (EUPL-1.2 license)
- **OSRM**: Open Source Routing Machine for ground-based routing
- **OpenStreetMap**: Map data
- **Haversine Formula**: Great circle distance calculation

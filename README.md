# Front OpenStreetMap Plugin

A powerful OpenStreetMap integration for Front app that visualizes locations and routes mentioned in your conversations, with advanced routing and cost calculation capabilities.

## 🚀 Getting Started

### Installation

1. Install the app from the Front App Store
2. Open the sidebar plugin in Front
3. No additional setup required - start using it immediately!

## ✨ Features

### Location Visualization
- **Conversation Integration**: Automatically see locations mentioned in your current Front conversation
- **Conversation Filtering**: View routes and points per conversation or all at the same time
- **Location Search**: Search for any location worldwide using the integrated search

### Points and Routes
- **Create Pinpoints**: Mark and save important locations on the map
- **Name Points**: Add custom names to both detected locations and your pinpoints
- **Build Routes**: Create routes by connecting multiple pinpoints

### Transportation Modes
Choose from multiple transportation methods for your routes:
- 🚗 Driving (car)
- 🚶 Walking
- 🚴 Bicycle
- ✈️ Plane
- 🚢 Boat
- 🚢 Container ship

### Cost Calculation
- **Editable Speed Settings**: Configure travel speed for each transport method
- **Cost Per Method**: Set cost per kilometer/mile for each transportation type
- **Route Cost Calculator**: Automatically calculate total costs for your routes

### Map Views
Switch between different map styles:
- **Road**: Standard street map view
- **Terrain**: Topographic view with elevation
- **Satellite**: Aerial imagery view

### Data Management
- **Save Routes**: Store your routes for future reference
- **Export Data**: Export locations and routes to CSV format
- **Persistent Storage**: All your pinpoints and routes are saved locally

## 📖 How to Use

### Viewing Conversation Locations

1. Open any conversation in Front that contains location mentions
2. The plugin will automatically detect and display these locations on the map
3. Use the conversation filter to switch between viewing:
   - Current conversation only
   - All conversations
   - Specific conversations

### Creating Pinpoints

1. Click on any location on the map to create a pinpoint
2. Add a custom name to your pinpoint for easy reference
3. Pinpoints are automatically saved and will persist across sessions

### Building Routes

1. Create or select multiple pinpoints on the map
2. Click "Create Route" in the directions panel
3. Select your transportation method (driving, walking, bicycle, plane, boat, or container ship)
4. View turn-by-turn directions and total distance

### Calculating Costs

1. Open the Speed Settings panel (⚙️ icon)
2. Configure speed and cost per kilometer for each transport method
3. Create or select a route - costs will be automatically calculated
4. View detailed cost breakdowns in the directions panel

### Searching Locations

1. Use the search bar at the top of the map
2. Enter any address, city, or place name
3. Select from the search results to navigate to that location

### Changing Map Style

1. Click the layers icon in the top-right corner of the map
2. Choose between:
   - **Road**: Best for navigation and street-level details
   - **Terrain**: Shows elevation and topography
   - **Satellite**: Aerial view for visual context

### Managing Saved Routes

1. Access your saved routes from the routes list panel
2. Click on any saved route to view it on the map
3. Export routes to CSV for external use
4. Delete routes you no longer need

## Development

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Running locally

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## Deployment to GitHub Pages

This project is configured to automatically deploy to GitHub Pages.

### Automatic Deployment (Recommended)

1. **Push to main branch:**
   - The GitHub Actions workflow will automatically build and deploy your app

2. **Configure GitHub Pages in your repository settings:**
   - Go to Settings > Pages
   - Under "Build and deployment", select "Deploy from a branch"
   - Select branch: **gh-pages** and folder: **/ (root)**

3. **Your site will be available at:**
   - `https://<username>.github.io/front-openstreetmap/`

The workflow automatically:
- Builds the project on every push to `main`
- Deploys the build to the `gh-pages` branch
- GitHub Pages serves the site from the `gh-pages` branch

### Manual Deployment

If you prefer to deploy manually:

```bash
npm run deploy
```

This will:
1. Build the project
2. Deploy the `dist` folder to the `gh-pages` branch

**Note:** For manual deployment, make sure GitHub Pages is configured to deploy from the `gh-pages` branch in your repository settings.

## Project Structure

- `src/components/` - React components
- `src/context/` - React context providers
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions

## Technologies

- React 19
- TypeScript
- Vite
- Leaflet
- Leaflet Routing Machine
- Front App SDK
- Styled Components

## License

Private project
# front-openstreetmap

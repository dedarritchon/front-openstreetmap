# Front OpenStreetMap

A React-based OpenStreetMap integration for Front app with routing capabilities.

## Features

- Interactive OpenStreetMap integration
- Location search and management
- Maritime routing support
- Directions panel with turn-by-turn navigation
- Pinned locations storage
- Front app plugin integration

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

# How to Add Screenshots to the User Guide

## Setup Complete! ✅

The user guide is now configured to automatically load screenshots from the `/public/images/guide/` folder.

## How It Works

- **If a screenshot exists**: It will be displayed automatically
- **If a screenshot is missing**: A placeholder with the filename will be shown

## Adding Screenshots

### Step 1: Take Your Screenshots
Take screenshots of each feature as listed in `/public/images/guide/README.md`

### Step 2: Save to the Folder
Save your screenshot files to:
```
/public/images/guide/
```

With these exact filenames:
- `setup-installation.png`
- `conversation-locations.png`
- `conversation-filter.png`
- `location-search.png`
- `create-pinpoints.png`
- `create-routes.png`
- `transportation-modes.png`
- `speed-cost-settings.png`
- `cost-calculation.png`
- `name-points.png`
- `map-styles.png`

### Step 3: That's It!
Once you add the images, they will automatically appear on the user guide page. No code changes needed!

## Testing Locally

1. Run your dev server:
   ```bash
   npm run dev
   ```

2. Open the user guide:
   ```
   http://localhost:5173/user-guide.html
   ```

3. You'll see:
   - Screenshots that exist will display
   - Placeholders for missing screenshots

## After Deployment to GitHub Pages

Once deployed to GitHub Pages, the user guide will be available at:
```
https://<username>.github.io/front-openstreetmap/user-guide.html
```

The user guide is now configured with relative paths that work both locally and on GitHub Pages!

## Image Recommendations

- **Format**: PNG (preferred) or JPEG
- **Width**: At least 1200px for best quality
- **Aspect Ratio**: 16:9 or 4:3
- **File Size**: Keep under 500KB per image
- **Optimization**: Use tools like TinyPNG to compress before uploading

## Notes

- The page will gracefully handle missing images
- You can add screenshots gradually - the page works with partial images
- Images are loaded with relative paths (./images/guide/) which work on GitHub Pages
- The user-guide.html is in the `/public` folder and will be deployed automatically

# User Guide Deployment - Ready for GitHub Pages ✅

## What Was Done

### 1. User Guide Location
- ✅ Moved `user-guide.html` to `/public/` folder
- ✅ This ensures it gets copied to the build output automatically

### 2. Image Paths Fixed
- ✅ Changed all image paths from absolute (`/images/guide/...`) to relative (`./images/guide/...`)
- ✅ This makes them work correctly with the GitHub Pages base path `/front-openstreetmap/`

### 3. Screenshots Folder
- ✅ Images are in `/public/images/guide/`
- ✅ They will be included in the build and deployed

## Deployment URLs

Once you push to GitHub and the workflow runs:

**Main App:**
```
https://<username>.github.io/front-openstreetmap/
```

**User Guide:**
```
https://<username>.github.io/front-openstreetmap/user-guide.html
```

## How It Works

1. **Build Process:**
   - `npm run build` runs
   - Everything in `/public/` (including `user-guide.html` and `images/`) gets copied to `/dist/`
   - Vite uses the base path `/front-openstreetmap/` from `vite.config.ts`

2. **GitHub Pages:**
   - GitHub Actions deploys the `/dist/` folder to the `gh-pages` branch
   - GitHub Pages serves from `gh-pages` branch
   - Users can access both the app and the user guide

3. **Image Loading:**
   - Relative paths (`./images/guide/filename.png`) work correctly
   - If an image is missing, a placeholder is shown
   - If an image exists, it displays without the colored background

## Testing Locally

Run the dev server:
```bash
npm run dev
```

Then access:
- Main app: `http://localhost:5173/`
- User guide: `http://localhost:5173/user-guide.html`

## Features of the User Guide

✨ **Animated Background:**
- OpenStreetMap continuously scrolls horizontally
- 15 pinpoints at major cities around the world
- Fills the entire screen with no white borders

🎨 **Clean Design:**
- Frosted glass effect on content cards
- Semi-transparent header
- Screenshots display cleanly without backgrounds

📱 **Responsive:**
- Works on desktop, tablet, and mobile
- All content is readable on any screen size

## Next Steps

1. ✅ User guide is ready - no more changes needed for deployment
2. 📸 Add more screenshots to `/public/images/guide/` as needed
3. 🚀 Push to GitHub and the workflow will deploy everything automatically

## Files Structure

```
/public/
  ├── user-guide.html          ← User guide page
  ├── .nojekyll                ← Prevents Jekyll processing
  └── images/
      └── guide/               ← Screenshots folder
          ├── README.md
          ├── conversation-locations.png
          ├── conversation-filter.png
          ├── create-pinpoints.png
          ├── create-routes.png
          ├── cost-calculation.png
          ├── map-styles.png
          └── speed-cost-settings.png
```

Everything is ready for deployment! 🎉

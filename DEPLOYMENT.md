# Deployment Guide

This project is configured for deployment to GitHub Pages with two methods: automatic via GitHub Actions and manual deployment.

## Prerequisites

1. Your code must be in a GitHub repository
2. The repository should be named `front-openstreetmap` (or update the `base` path in `vite.config.ts`)

## Method 1: Automatic Deployment (Recommended)

### Initial Setup

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages deployment"
   git push origin main
   ```

2. **Configure GitHub Pages:**
   - Go to your GitHub repository
   - Click on **Settings**
   - In the left sidebar, click **Pages**
   - Under "Build and deployment":
     - Source: Select **"Deploy from a branch"**
     - Branch: Select **"gh-pages"** and **"/ (root)"**
   - Click **Save**

3. **Monitor the deployment:**
   - Go to the **Actions** tab in your repository
   - You should see a workflow running named "Deploy to GitHub Pages"
   - Once completed, the `gh-pages` branch will be created/updated
   - GitHub Pages will automatically deploy from that branch

### How It Works

The GitHub Action workflow:
1. Triggers on every push to `main` branch
2. Installs dependencies and builds the project
3. Deploys the `dist` folder to the `gh-pages` branch
4. GitHub Pages serves the site from the `gh-pages` branch

### Accessing Your Site

Your site will be available at:
```
https://<your-username>.github.io/front-openstreetmap/
```

### Automatic Updates

Every time you push to the `main` branch, the site will automatically rebuild and redeploy.

## Method 2: Manual Deployment

If you prefer to deploy manually:

### One-Time Setup

Make sure you have the `gh-pages` package installed (already in `package.json`):
```bash
npm install
```

### Deploy

Run the deploy script:
```bash
npm run deploy
```

This will:
1. Build the production bundle
2. Push the `dist` folder to the `gh-pages` branch
3. GitHub Pages will serve from that branch

### Configure GitHub Pages for Manual Deployment

If using manual deployment, the configuration is the same:
1. Go to **Settings** > **Pages**
2. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** / **(root)**
3. Save

**Note:** Both automatic and manual deployment use the same `gh-pages` branch, so the GitHub Pages configuration is identical.

## Troubleshooting

### Build Fails with TypeScript Errors

Make sure all TypeScript errors are fixed:
```bash
npm run type-check
```

Fix any errors before deploying.

### 404 Error on Deployed Site

1. Check that the `base` path in `vite.config.ts` matches your repository name
2. Clear your browser cache
3. Wait a few minutes for GitHub Pages to update

### Assets Not Loading

If CSS or JS files don't load:
1. Verify the `base` configuration in `vite.config.ts` is correct
2. Check browser console for 404 errors
3. Ensure the `.nojekyll` file exists in the `public` folder

### GitHub Actions Workflow Fails

1. Check the Actions tab for error details
2. Ensure you have configured GitHub Pages to deploy from the `gh-pages` branch
3. Verify the workflow file is at `.github/workflows/deploy.yml`
4. Make sure the workflow has write permissions (should be automatic with `GITHUB_TOKEN`)

### Environment Protection Rules Error

If you see "Branch 'main' is not allowed to deploy to github-pages due to environment protection rules":
- This is now fixed! The updated workflow deploys to the `gh-pages` branch instead
- Make sure GitHub Pages is set to deploy from the `gh-pages` branch (not GitHub Actions)

## Configuration Files

### vite.config.ts
```typescript
base: '/front-openstreetmap/'
```
This must match your repository name.

### package.json
```json
"deploy": "npm run build && gh-pages -d dist"
```
Manual deployment script.

### .github/workflows/deploy.yml
Automated deployment configuration for GitHub Actions.

## Local Preview

To preview the production build locally:
```bash
npm run build
npm run preview
```

The preview server will simulate the production environment.

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file in the `public` folder with your domain
2. Configure DNS with your domain provider
3. Update GitHub Pages settings to use your custom domain

For more details, see [GitHub Pages documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

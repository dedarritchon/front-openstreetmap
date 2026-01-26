# Quick Deploy Guide 🚀

## Simple 3-Step Deployment

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Step 2: Configure GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** → **/ (root)**
4. Click **Save**

### Step 3: Wait & Visit
1. Go to **Actions** tab - watch the workflow complete (takes ~1-2 minutes)
2. Visit: `https://<your-username>.github.io/front-openstreetmap/`

That's it! ✨

---

## What Happens Automatically?

Every time you push to `main`:
1. ✅ GitHub Actions builds your project
2. ✅ Deploys to `gh-pages` branch
3. ✅ GitHub Pages updates your live site

## Troubleshooting

**Build failing?**
- Check the Actions tab for errors
- Run `npm run build` locally first

**404 error?**
- Wait 2-3 minutes after first deployment
- Check that GitHub Pages is set to `gh-pages` branch
- Clear browser cache

**Need manual deploy?**
```bash
npm run deploy
```

## Files Changed

The deployment works because:
- `.github/workflows/deploy.yml` - Auto-deploy workflow
- `vite.config.ts` - Correct base path (`/front-openstreetmap/`)
- `public/.nojekyll` - Prevents Jekyll processing
- `package.json` - Has `gh-pages` dependency and deploy script

---

**Full documentation:** See `DEPLOYMENT.md`

# 🚀 One-Click Deployment Guide

Axiom Finance is configured for easy deployment to multiple platforms. Choose your preferred method:

## 📦 Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy with one command**:
   ```bash
   vercel --prod
   ```

3. **Or use Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Vercel will auto-detect settings from `vercel.json`
   - Add environment variable: `VITE_CONVEX_URL`
   - Click "Deploy"

### Option 2: Netlify

1. **Install Netlify CLI** (if not installed):
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy with one command**:
   ```bash
   netlify deploy --prod
   ```

3. **Or use Netlify Dashboard**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository
   - Netlify will auto-detect settings from `netlify.toml`
   - Add environment variable: `VITE_CONVEX_URL`
   - Click "Deploy site"

### Option 3: GitHub Actions (Automatic)

1. **Set up GitHub Secrets**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add these secrets:
     - `VITE_CONVEX_URL`: Your Convex deployment URL
     - `VERCEL_TOKEN`: (Optional, for Vercel deployment)
     - `VERCEL_ORG_ID`: (Optional)
     - `VERCEL_PROJECT_ID`: (Optional)

2. **Push to main branch**:
   ```bash
   git push origin main
   ```

3. **Deployment happens automatically** via GitHub Actions workflow

## 🔧 Manual Deployment

### Build the project:
```bash
npm install
npm run build
```

### Deploy the `dist` folder to any static hosting:
- **Cloudflare Pages**: Upload `dist` folder
- **AWS S3 + CloudFront**: Upload `dist` to S3 bucket
- **Firebase Hosting**: `firebase deploy`
- **Any static host**: Upload `dist` folder contents

## 🌐 Environment Variables

Make sure to set these environment variables in your hosting platform:

- `VITE_CONVEX_URL`: Your Convex deployment URL (required)

## ✅ Post-Deployment Checklist

- [ ] Verify the site loads correctly
- [ ] Test authentication flow
- [ ] Check mobile responsiveness
- [ ] Verify all API calls work
- [ ] Test on different browsers
- [ ] Set up custom domain (optional)

## 🐛 Troubleshooting

### Build fails?
- Check Node.js version (requires 18+)
- Run `npm install` again
- Clear `node_modules` and reinstall

### Environment variables not working?
- Make sure they're set in your hosting platform
- Restart the build after adding variables
- Check variable names match exactly (case-sensitive)

### Routing issues?
- Ensure your hosting platform is configured for SPA routing
- Check `vercel.json` or `netlify.toml` redirect rules

## 📝 Notes

- The project uses Vite for building
- All configurations are pre-set in `vercel.json` and `netlify.toml`
- PWA manifest is included in `public/manifest.json`
- The app is fully responsive and works on all devices

---

**Need help?** Check the main README.md or open an issue on GitHub.


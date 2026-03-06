# 🚨 Quick Fix for Netlify Deployment Error

## Most Common Issue: Missing Environment Variable

Your app needs `VITE_CONVEX_URL` to connect to Convex backend.

### Fix Steps:

1. **Go to Netlify Dashboard**:
   - Visit: https://app.netlify.com
   - Select your site: `incandescent-sprinkles-6375ca`

2. **Add Environment Variable**:
   - Click: **Site settings** → **Environment variables**
   - Click: **Add variable**
   - Key: `VITE_CONVEX_URL`
   - Value: Your Convex URL (from Convex dashboard)
   - Click: **Save**

3. **Redeploy**:
   - Go to: **Deploys** tab
   - Click: **Trigger deploy** → **Clear cache and deploy site**

## Other Common Issues:

### Issue: Blank Page
**Fix**: Check browser console (F12) for errors. Usually means:
- Missing `VITE_CONVEX_URL` environment variable
- Build failed (check Netlify build logs)

### Issue: 404 on Routes
**Fix**: Already configured in `netlify.toml` - should work automatically

### Issue: CSS Not Loading
**Fix**: Already fixed - removed incorrect CSS link from HTML

## Verify It's Working:

After adding the environment variable and redeploying:
1. ✅ Site loads without console errors
2. ✅ You can see the landing page
3. ✅ Sign in button works
4. ✅ No 404 errors in browser console

## Need Your Convex URL?

1. Go to: https://dashboard.convex.dev
2. Select your deployment
3. Copy the deployment URL
4. Use that as `VITE_CONVEX_URL` value

---

**After fixing, your site should work at:**
https://incandescent-sprinkles-6375ca.netlify.app/


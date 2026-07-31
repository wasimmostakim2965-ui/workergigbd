# Deployment Guide - WorkerGigBD

## Quick Deploy Options

### 1. Vercel (Recommended)

1. **Sign up**: https://vercel.com (no credit card needed)
2. **Connect GitHub**: Import `wasimmostakim2965-ui/workergigbd`
3. **Configure**:
   - Build Command: `pnpm build`
   - Output Directory: `dist/public`
4. **Deploy**: Click "Deploy"

### 2. Cloudflare Pages

1. **Sign up**: https://pages.cloudflare.com
2. **Connect GitHub repo**
3. **Build settings**:
   - Build command: `pnpm install && pnpm build`
   - Build output directory: `dist/public`
4. **Deploy**

### 3. Netlify

1. **Sign up**: https://netlify.com
2. **Add new site** → Import from GitHub
3. **Build settings**:
   - Build command: `pnpm build`
   - Publish directory: `dist/public`
4. **Deploy**

### 4. Railway

1. **Sign up**: https://railway.app
2. **New Project** → Deploy from GitHub
3. **Set environment variables** (if needed)
4. **Deploy**

### 5. Google App Engine / Firebase Hosting

1. Build locally: `pnpm build`
2. Upload `dist/public` folder
3. Configure routing for SPA

## Environment Variables

Set these in your hosting platform's dashboard:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes (for production) |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `USE_LOCAL_DB` | Set to `true` for demo mode | No |

## Demo Mode

If no database is configured, the app runs in demo mode with sample data.

## Troubleshooting

### Build fails
- Make sure `pnpm` is installed
- Check Node.js version (18+ recommended)

### API not working
- Verify `DATABASE_URL` is set correctly
- Check server logs for connection errors

### Static files 404
- Ensure `dist/public` is set as output directory
- Check that build completed successfully

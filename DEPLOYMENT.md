# 🚀 Deployment Guide

## GitHub Pages Deployment (Frontend)

The frontend is configured to deploy automatically to GitHub Pages when you push to the `main` branch.

### Prerequisites

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Source: GitHub Actions
   - Save

2. **Set up backend URL** (if backend is deployed separately):
   - Go to Settings → Secrets and variables → Actions
   - Add secret: `VITE_API_BASE` with your backend URL (e.g., `https://your-backend.railway.app`)

### Automatic Deployment

The workflow (`.github/workflows/deploy.yml`) will:
1. Build the frontend on every push to `main`
2. Deploy to GitHub Pages automatically
3. Use HashRouter for compatibility with GitHub Pages

Your site will be available at:
- `https://<your-username>.github.io/lager-project/`

### Manual Build & Test Locally

```bash
cd frontend
npm run build
npm run preview
```

## Backend Deployment

⚠️ **Important**: GitHub Pages only serves static files. The Flask backend needs to be deployed separately.

### Option 1: Railway (Recommended)

1. Go to [Railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Select the `backend` folder
4. Railway will auto-detect Python and deploy
5. Add environment variables:
   - `SECRET_KEY`: Your secret key
   - `CORS_ORIGINS`: Your GitHub Pages URL
6. Copy the Railway URL and set it as `VITE_API_BASE` in GitHub secrets

### Option 2: Render

1. Go to [Render.com](https://render.com)
2. New Web Service → Connect GitHub repo
3. Settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python server.py`
   - Environment: Python 3
4. Add environment variables
5. Copy Render URL for `VITE_API_BASE`

### Option 3: Heroku

```bash
cd backend
heroku create lager-backend
heroku config:set SECRET_KEY=your-secret-key
heroku config:set CORS_ORIGINS=https://your-username.github.io
git subtree push --prefix backend heroku main
```

### Option 4: PythonAnywhere

1. Upload backend files to PythonAnywhere
2. Create Web App → Flask
3. Configure WSGI file
4. Set environment variables
5. Reload app

## Environment Variables for Backend

```bash
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=https://your-username.github.io,https://your-username.github.io/lager-project
SESSION_COOKIE_SAMESITE=None
SESSION_COOKIE_SECURE=True
DEFAULT_ADMIN_PASSWORD=your-secure-password
```

## Configuration Steps

1. **Deploy Backend First**
   - Choose a hosting service
   - Deploy Flask app
   - Note the backend URL

2. **Update Frontend Config**
   - Add `VITE_API_BASE` secret in GitHub
   - Set it to your backend URL

3. **Enable GitHub Pages**
   - Settings → Pages → GitHub Actions

4. **Push to Main**
   - Automatic deployment will start

## Troubleshooting

### CORS Errors
- Make sure `CORS_ORIGINS` includes your GitHub Pages URL
- Check that backend allows credentials

### 404 Errors on Refresh
- HashRouter is used automatically for GitHub Pages
- This prevents 404s on route refresh

### API Not Working
- Check `VITE_API_BASE` is set correctly
- Verify backend is running and accessible
- Check browser console for API errors

### Session Issues
- Ensure `SESSION_COOKIE_SAMESITE=None` and `SECURE=True`
- Backend and frontend must use HTTPS in production


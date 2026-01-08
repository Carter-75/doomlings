# Doomlings Socket.IO Server Deployment

## 🚀 Quick Deploy to Railway (Free)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/doomlings-socket)

## Manual Deployment Steps

### Option A: Railway (Recommended - Free Tier)

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up
2. **Deploy from GitHub**: 
	- Fork this repository or create a new one
	- Copy these files to your repository:
	  - `standalone-socket-server.js`
	  - `socket-server-package.json` (rename to `package.json`)
	  - `Procfile`
	- Connect Railway to your GitHub repository
	- Railway will automatically deploy

3. **Get Your Server URL**: 
	- After deployment, Railway will give you a URL like: `https://your-app-name.up.railway.app`
	- Copy this URL

4. **Update Frontend**: 
	- The gameSocketManager is already configured to use the Railway server for Vercel deployments

### Option B: Render (Also Free)

1. Go to [render.com](https://render.com) and create account
2. Create new "Web Service" from GitHub repository
3. Use these settings:
	- **Build Command**: `npm install`
	- **Start Command**: `npm start`
	- **Environment**: Node
4. Deploy and get your URL

### Option C: Heroku

1. Install Heroku CLI
2. Run these commands:
```bash
heroku create your-doomlings-server
git add .
git commit -m "Deploy socket server"
git push heroku main
```

## 🔧 Configuration

The server is already configured to work with:
- `https://doomlings.vercel.app` (your production site)
- `localhost:3000` (local development)
- Any Vercel preview deployments

## 📊 Server Endpoints

- `GET /` - Server status and info
- `GET /health` - Health check for monitoring
- Socket.IO events for game functionality

## 🎮 Features Included

- ✅ Room creation and management
- ✅ Player registration and ready states  
- ✅ Real-time chat
- ✅ Game state synchronization
- ✅ Card playing mechanics
- ✅ Quick match functionality
- ✅ Public and private rooms

The server will automatically work with your Vercel deployment at `https://doomlings.vercel.app/multiplayer` once deployed!

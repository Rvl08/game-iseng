# Pixel-Clash Battle Royale - Deployment Guide

## Overview
This game uses **Playroom Kit** for real-time multiplayer functionality. Players can join from their mobile phones which act as controllers, while the game displays on a host screen (PC/TV).

## Prerequisites
- Playroom.com account
- Vercel account
- Game ID from Playroom (already configured: `7uODloeVbXcMw3V6vjjA`)

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
The `.env.local` file has been created with your Playroom Game ID:
```
NEXT_PUBLIC_PLAYROOM_GAME_ID=7uODloeVbXcMw3V6vjjA
```

**IMPORTANT:** Do NOT commit `.env.local` to git (it's already in .gitignore)

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Method 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   After first deployment, add the environment variable in Vercel dashboard:
   - Go to: https://vercel.com/your-username/pixel-clash-game/settings/environment-variables
   - Add variable:
     - Name: `NEXT_PUBLIC_PLAYROOM_GAME_ID`
     - Value: `7uODloeVbXcMw3V6vjjA`
     - Environment: Production, Preview, Development (select all)

5. **Redeploy**
   ```bash
   vercel --prod
   ```

### Method 2: Using Vercel Dashboard

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Playroom integration"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Add Environment Variables**
   Before deploying, add:
   - Name: `NEXT_PUBLIC_PLAYROOM_GAME_ID`
   - Value: `7uODloeVbXcMw3V6vjjA`

4. **Deploy**
   Click "Deploy"

## Post-Deployment Setup

### Update Playroom Configuration

1. **Go to Playroom Developer Dashboard**
   - Visit: https://joinplayroom.com/developer
   - Find your game: `pixelclash`

2. **Update Allowed Domains**
   Add your Vercel deployment URL:
   - Production URL: `https://your-app-name.vercel.app`
   - Preview URLs: `https://*.vercel.app` (for preview deployments)

3. **Update Game URL**
   Set your production URL as the game URL in Playroom settings.

## How to Play

### Host (PC/TV):
1. Open the deployment URL on a large screen
2. The game will automatically enter host mode
3. A QR code will be displayed for players to join
4. Wait for at least 2 players to join
5. Click "START BATTLE" to begin

### Players (Mobile):
1. Scan the QR code with your phone camera
2. You'll be taken to the game URL
3. Your phone becomes the controller
4. Use the virtual joystick to move
5. Press A to jump, B to attack

## Architecture

### Multiplayer Flow
1. **insertCoin()** - Initializes Playroom connection
2. **isHost()** - Determines if the current client is the host
3. **onPlayerJoin()** - Handles new players joining
4. **PlayerState** - Syncs player data across all clients
5. **RPC** - Remote procedure calls for game events

### State Management
- **Host**: Runs game physics, collision detection, and zone shrinking
- **Clients**: Send input to host, receive state updates
- **Sync**: Player positions, health, and inventory synced via Playroom

## Troubleshooting

### 404 Error on Deployed Site
**Problem:** Getting 404: NOT_FOUND error
**Solution:**
- Ensure `NEXT_PUBLIC_PLAYROOM_GAME_ID` is set in Vercel environment variables
- Verify the Game ID matches your Playroom game
- Check Playroom dashboard for allowed domains
- Make sure you removed `output: 'export'` from next.config.js

### Players Can't Join
**Problem:** QR code doesn't work or players get errors
**Solution:**
- Verify your Vercel URL is added to Playroom allowed domains
- Check that both host and players are on the same game session
- Ensure HTTPS is enabled (Vercel provides this automatically)

### Game Doesn't Sync
**Problem:** Player movements don't appear on host screen
**Solution:**
- Check browser console for Playroom connection errors
- Verify environment variable is correctly set
- Test with incognito/private windows to rule out cache issues

## File Structure

```
pixel-clash-game/
├── app/
│   ├── page.tsx          # Main game component with Playroom integration
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── lib/
│   ├── playroom.ts       # Playroom utility functions
│   ├── constants.ts      # Game constants and types
│   ├── audio.ts          # Audio manager
│   └── particles.ts      # Particle effects
├── .env.local            # Environment variables (local only)
├── next.config.js        # Next.js configuration
├── vercel.json           # Vercel deployment config
└── package.json          # Dependencies
```

## Important Notes

1. **Environment Variables**:
   - `.env.local` is for local development only
   - Production variables must be set in Vercel dashboard
   - Never commit `.env.local` to git

2. **Playroom Limits**:
   - Free tier: Limited to certain number of concurrent players
   - Check Playroom pricing if you need more capacity

3. **Browser Compatibility**:
   - Works best on modern browsers (Chrome, Firefox, Safari, Edge)
   - Mobile: iOS 13+, Android 8+
   - Desktop: Latest versions recommended

## Support

For issues related to:
- **Game Code**: Check browser console for errors
- **Playroom**: Visit https://docs.joinplayroom.com
- **Vercel**: Visit https://vercel.com/docs

## Next Steps After Deployment

1. Test with multiple devices
2. Share the QR code with friends
3. Monitor Playroom analytics for player sessions
4. Consider adding more features:
   - More weapons and power-ups
   - Different game modes
   - Custom maps
   - Player skins

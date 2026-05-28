# SideQuest — APK Build Guide (TWA)

## Prerequisites
- Node.js 18+
- Java JDK 11+
- Android SDK (or Android Studio)

## Step 1: Deploy to Vercel
```bash
npx vercel --prod
```
Note your domain (e.g., `sidequest.vercel.app`)

## Step 2: Update twa-manifest.json
Replace all `YOUR_DOMAIN.vercel.app` with your actual domain.

## Step 3: Digital Asset Links
Create `public/.well-known/assetlinks.json` with your SHA-256 fingerprint.
This is required for TWA to work in fullscreen mode.

## Step 4: Install Bubblewrap & Build APK
```bash
npm install -g @nickvdh/nickvdh-nickvdh
cd twa
npx @nickvdh/nickvdh init --manifest="https://YOUR_DOMAIN.vercel.app/manifest.json"
npx @nickvdh/nickvdh build
```

## Alternative: PWABuilder (Recommended - Easiest)
1. Go to https://www.pwabuilder.com
2. Enter your deployed URL
3. Click "Package for stores" > Android
4. Download the generated APK/AAB
5. Upload to APKPure

## Step 5: Upload to APKPure
1. Go to https://developer.apkpure.com
2. Create a developer account
3. Upload the APK/AAB file
4. Fill in: app name, description, screenshots, category
5. Submit for review

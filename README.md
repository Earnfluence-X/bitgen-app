# BitGen - Campus Coin Exchange

Peer-to-peer micro-currency app for college campuses. Students exchange services
using virtual BitGen coins. No real money involved.

## Tech Stack

- Vite + React + TypeScript
- Firebase Auth (v10.12.0) + Firestore
- Zustand State Management
- Tailwind CSS + Framer Motion
- Real-time cross-device sync

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Go to https://console.firebase.google.com
2. Create a new project named "bitgen"
3. Enable Authentication > Email/Password provider
4. Create Firestore Database (start in production mode)
5. Deploy Firestore rules from `firestore.rules`
6. Register a Web App and copy the config values

### 3. Environment Variables

Create `.env.local` in the project root:

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=bitgen.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bitgen
VITE_FIREBASE_STORAGE_BUCKET=bitgen.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Add the same environment variables in Vercel dashboard under
Settings > Environment Variables.

## Features

- Send/receive BitGen coins via 6-digit transfer PINs
- Post and claim gigs (tutoring, errands, rides, etc.)
- Daily login bonus with streak multiplier
- Real-time activity feed across devices
- Reputation system
- Referral codes

## Architecture

- Firebase Auth as single source of truth for auth state
- Firestore real-time listeners (onSnapshot) for cross-device sync
- Zustand store synced with Firestore, not localStorage
- All Firebase functions exported from lib/firebase.ts
- No emoji characters in code or UI

## Firestore Collections

- `users` - User profiles with balance, stats, streaks
- `transactions` - All coin transfers and bonuses
- `transferPins` - Active 6-digit transfer PINs
- `gigs` - Posted gigs/services

## Security

- Firestore rules enforce user-level access control
- Users can only update their own profile
- Transfer PINs are one-time-use
- .env.local excluded from version control

## License

MIT

# Automatic Pi Network Authentication - Developer Guide

## Overview

The Watch & Earn Live TV app now features **seamless automatic Pi Network authentication**. Users no longer need to manually enter their credentials. The app automatically:

1. **Detects Pi Browser Environment** - Loads the Pi SDK
2. **Authenticates User** - Obtains Pi access token securely
3. **Retrieves User Data** - Gets username and wallet info
4. **Initializes Session** - Creates persistent user session
5. **Shows Dashboard** - Directs to Live TV interface

---

## Architecture

### Three-Layer Auth System

```
Layer 1: Pi SDK Integration (PI_NETWORK_CONFIG)
├─ SDK URL: https://sdk.minepi.com/pi-sdk.js
└─ Sandbox: false (Production mode)

Layer 2: Authentication Context (/lib/auth-context.tsx)
├─ Automatic Pi.init() on mount
├─ Automatic Pi.authenticate() call
├─ User data retrieval
└─ Reward system integration

Layer 3: Session Management (/lib/session-manager.ts)
├─ LocalStorage session persistence
├─ 30-day session expiry
├─ Auth recovery mechanisms
└─ Session validation
```

---

## Authentication Flow

### Startup Sequence

```
App Mounts
  ↓
AuthProvider initializes
  ↓
useEffect trigger
  ↓
Check localStorage for existing session
  ├─ YES → Load user + set isAuthenticated = true
  └─ NO → Continue
  ↓
Load Pi SDK script
  ├─ Pi available → Continue
  └─ Pi unavailable → Demo mode fallback
  ↓
Pi.init({ version: '2.0', sandbox: false })
  ↓
Pi.authenticate(['username'])
  ↓
Get user data (Pi.user.getMe())
  ↓
Create User object
  ├─ Merge with existing localStorage data
  └─ Save to localStorage
  ↓
Set isAuthenticated = true
  ↓
AuthLoadingScreen hides
  ↓
ChannelList + RewardOverlay display
```

---

## Key Components

### 1. AuthProvider (`/lib/auth-context.tsx`)

**Responsibilities:**
- Load Pi SDK dynamically
- Handle Pi.init() and Pi.authenticate()
- Create user object from Pi data
- Manage auth state
- Provide reward system methods

**Key Methods:**
```typescript
createUserFromPi(piUsername: string, piUid: string): User
// Creates a Watch & Earn user from Pi credentials

loadPiSDK(): Promise<void>
// Dynamically loads Pi SDK from CDN
```

**State Variables:**
```typescript
user: User | null                    // Current user
loading: boolean                     // Auth in progress
isAuthenticated: boolean             // Auth successful
authMessage: string                  // Status message
```

### 2. AuthLoadingScreen (`/components/auth-loading-screen.tsx`)

**Purpose:** Professional loading UI during authentication

**Features:**
- Animated logo with gradient
- Real-time status messages
- Animated loading bar
- Multi-step info display
- Error state handling

**Shows When:**
- User first opens app
- Pi SDK is loading
- Authenticating with Pi Network
- Waiting for user data

### 3. SplashScreen (`/components/splash-screen.tsx`)

**Purpose:** Initial app launch splash

**Use Case:** Optional first-load branding

### 4. SessionManager (`/lib/session-manager.ts`)

**Purpose:** Persistent session management

**Features:**
```typescript
SessionManager.saveSession(data)    // Save to localStorage
SessionManager.loadSession()        // Retrieve session
SessionManager.clearSession()       // Remove session
SessionManager.isSessionValid()     // Check expiry
SessionManager.getSessionAge()      // Age in minutes

AuthRecovery.setAuthInProgress()    // Mark ongoing auth
AuthRecovery.wasAuthInterrupted()   // Detect failed auth
```

**Session Structure:**
```typescript
{
  user: {
    piUsername: string
    piUid: string
    walletAddress: string
    referralCode: string
  },
  tokens: {
    accessToken?: string
    refreshToken?: string
  },
  rewards: {
    totalCoins: number
    lifetimeEarnings: number
    referralEarnings: number
    dailyStreak: number
  },
  lastAuthTime: number
  expiryTime: number (30 days)
}
```

---

## User Journey

### First Time User (Fresh Install)

```
1. Opens app in Pi Browser
2. App detects Pi Browser environment
3. AuthLoadingScreen shows "Loading Pi Network SDK..."
4. Pi SDK loads and initializes
5. AuthLoadingScreen shows "Authenticating with Pi Network..."
6. User sees Pi Browser auth prompt (automatic)
7. AuthLoadingScreen shows "Connecting to Pi Browser..."
8. User data retrieved automatically
9. Session saved to localStorage
10. AuthLoadingScreen hides
11. User sees Live TV channels instantly
12. Reward tracking starts immediately
```

**Time:** ~2-3 seconds (mostly Pi Browser response time)

### Returning User (Session Valid)

```
1. Opens app in Pi Browser
2. App detects Pi Browser environment
3. AuthLoadingScreen shows "Initializing Pi Network..."
4. App checks localStorage for valid session
5. Session found and not expired
6. AuthLoadingScreen shows "Welcome back!"
7. AuthLoadingScreen hides immediately
8. User sees Live TV channels
9. All rewards synced from previous session
10. Reward tracking continues
```

**Time:** ~500ms (almost instant)

### Session Expired (After 30 Days)

```
1. Opens app after 30+ days
2. App checks localStorage for session
3. Session found but EXPIRED
4. App clears expired session
5. Performs full authentication flow
6. Creates new 30-day session
7. Preserves all reward data from old session
8. User sees Live TV with accumulated rewards
```

---

## Pi Browser Integration

### What We Use from Pi SDK

```typescript
// Initialization
window.Pi.init({
  version: '2.0',
  sandbox: false  // Production Pi Network
})

// Authentication
window.Pi.authenticate(['username'])
// Returns:
// {
//   accessToken: "pi_token_...",
//   user: {
//     uid: "user_uid_...",
//     username: "pioneer_username"
//   }
// }

// User Info
window.Pi.user.getMe()
// Returns:
// {
//   uid: "user_uid_...",
//   username: "pioneer_username",
//   avatar: "https://..."
// }
```

### What We Store

```typescript
// Pi UID → Watch & Earn User ID
piUid → user.id = 'pi_' + piUid

// Pi Username → Display Name
piUsername → user.piUsername

// Pi UID → Wallet Address
piUid → user.walletAddress

// Auto-Generated
referralCode = 'WE' + random()
```

---

## Error Handling

### Scenarios

#### 1. Pi SDK Not Loading
```typescript
if (typeof window.Pi === 'undefined') {
  // Fallback to demo mode
  console.log('Using demo mode - Pi Browser not detected')
  createUserFromPi('demo_pioneer_...', 'demo_uid_...')
}
```

#### 2. Authentication Fails
```typescript
catch (error) {
  authMessage = `Failed to authenticate: ${error.message}`
  // Show error in AuthLoadingScreen
  // User can refresh page to retry
}
```

#### 3. Interrupted Auth
```typescript
// If app closes during authentication:
AuthRecovery.setAuthInProgress()
// On restart, detects interruption
AuthRecovery.wasAuthInterrupted()
// Performs fresh full auth
```

---

## Configuration

### Edit Pi Network Settings

**File:** `/lib/system-config.ts`

```typescript
export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SANDBOX: false  // false = Production, true = Testnet
} as const;
```

### Session Duration

**File:** `/lib/session-manager.ts`

```typescript
const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000  // 30 days
```

---

## Testing

### Test in Pi Browser

1. Open app URL in **Pi Browser** (iOS/Android Pi app)
2. App automatically authenticates
3. User sees Live TV channels within 2-3 seconds

### Test Outside Pi Browser

1. Open app in **regular browser** (Chrome/Firefox/Safari)
2. App detects Pi Browser not available
3. Falls back to **Demo Mode**
4. Creates demo user automatically
5. All features work normally (for testing)

### Test Session Persistence

1. Refresh page (Cmd+R / Ctrl+R)
2. Should see loading screen briefly
3. Should recognize session and show "Welcome back!"
4. Should load instantly (< 1 second)

### Test Session Expiry

1. Modify SessionManager: `const SESSION_EXPIRY = 2000` (2 seconds)
2. Refresh page after 3 seconds
3. Should re-authenticate (full flow)
4. Should show "Authenticating..." again

---

## Security Considerations

### What's Secure

✅ Pi SDK handles actual Pi Network authentication (secure)
✅ Access tokens passed through Pi SDK only
✅ No plaintext passwords stored
✅ Session data stays in browser localStorage (client-side)
✅ 30-day session expiry
✅ Auto-logout on session end

### What's For Demo

⚠️ Demo mode creates fake user (outside Pi Browser)
⚠️ Rewards stored locally (not verified)
⚠️ No backend verification yet
⚠️ Session data not encrypted

### Production Improvements

- [ ] Backend verification of Pi tokens
- [ ] Encrypted session storage
- [ ] Real reward blockchain recording
- [ ] Backend user database
- [ ] Transaction logging

---

## Troubleshooting

### App Loads Forever

**Cause:** Pi SDK not loading / Network issues
**Fix:** Check Pi Browser connection, refresh page

### "Failed to authenticate" Message

**Cause:** User cancelled Pi auth prompt / Network error
**Fix:** Refresh page, try again in Pi Browser

### Session Not Persisting

**Cause:** localStorage disabled / Private browsing
**Fix:** Enable localStorage or check privacy settings

### Demo Mode When Using Pi Browser

**Cause:** Pi SDK CDN unreachable
**Fix:** Check internet connection, try different network

---

## Developer Notes

### Adding Backend Verification

When ready to add backend verification:

```typescript
// In auth-context.tsx
const authResult = await window.Pi.authenticate(['username']);

// Send to backend
const verifyRes = await fetch('/api/auth/verify-pi', {
  method: 'POST',
  body: JSON.stringify({
    piToken: authResult.accessToken,
    username: authResult.user.username,
  }),
});

// Backend verifies token with Pi API
// Returns: { valid: true, userId: "...", walletAddress: "..." }
```

### Adding Real Rewards Backend

When ready:

```typescript
// In video-player.tsx
const claimRes = await fetch('/api/rewards/watch', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    channelId: channel.id,
    watchDuration: seconds,
    coinsToAward: 10,
  }),
});

// Backend verifies watch time, fraud checks, awards coins
// Returns: { verified: true, coinsAdded: 10, newBalance: 345 }
```

---

## Summary

**Before:** Manual login form → Feels slow and cumbersome for Pi pioneers
**After:** Automatic Pi auth → Seamless experience (< 3 seconds)

**Key Benefits:**
- 0 manual input required
- Session persists across sessions
- Error recovery built-in
- Demo mode for testing
- Ready for production backend
- Secure Pi Network integration

**User Experience:**
1. Open app
2. Brief loading screen
3. See Live TV channels
4. Start earning coins

That's it!

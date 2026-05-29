# Quick Start Guide - Watch & Earn + Live TV

## What You Have

A **fully functional hybrid streaming + rewards app** that combines:
- 150+ live TV channels (IPTV-org powered)
- Real-time coin earning system
- Mobile-first responsive design
- Anti-fraud protections
- Admin dashboard

## 30-Second Setup

```bash
# 1. Development server already running on localhost:3000
npm run dev

# 2. Open browser to http://localhost:3000

# 3. Login with any username + wallet address

# 4. Start watching channels and earning coins!
```

## User Flow

### Step 1: Login
- Enter any Pi username (demo)
- Enter any wallet address (0x...)
- Click Login

### Step 2: Browse Channels
- Home page shows 150+ live channels
- RewardOverlay at top shows coin balance
- Search channels by name
- Filter by category (News, Sports, Entertainment)
- Filter by country (India, USA, UK, etc.)

### Step 3: Watch & Earn
- Click any channel to open player
- Player shows: channel name, watch time, earned coins
- Coins auto-awarded: 2 coins per minute
- 30 seconds = 1 coin
- 1 hour = 120 coins

### Step 4: Check Earnings
- Click coin balance in RewardOverlay → Wallet
- View lifetime earnings
- View transaction history
- View today's earnings

### Step 5: Additional Features
- **Tasks**: Daily/weekly challenges for extra coins
- **Referral**: Invite friends, earn 100 coins per signup
- **Leaderboard**: Compete globally (all-time, weekly, daily)
- **Settings**: Manage profile and preferences

## Key Components

### RewardOverlay (Top Bar)
```
💎 Balance      📈 Today's Earnings      🔥 Streak
Click to view wallet, quick nav buttons
```

### VideoPlayer (When Watching)
```
[Channel Name] ❤️ [X]
[Video playback with native controls]
📺 Watched: 5m    ⚡ Earned: +10 coins
Category: News | Type: India | Language: Hindi
```

### Navigation
**Mobile** (Bottom):
- Home → Watch → Tasks → Wallet

**Desktop** (Top):
- Home → Watch → Tasks → Wallet → Leaderboard → Referral

## Coin Amounts (Quick Reference)

- Watch: 2 coins/minute
- Daily Login: 10 coins
- Tasks: 10-500 coins
- Referral: 100 coins per friend
- Streak Bonus: +10% per day (capped)

## Files to Customize

### Add Your Branding
- `/app/globals.css` → Change colors (Purple, Blue, Green)
- `/README.md` → Update project name
- `/app/layout.tsx` → Update app title

### Modify Rewards
- `/lib/reward-utils.ts` → Change coin amounts
- `/lib/auth-context.tsx` → Adjust reward logic

### Change UI
- `/components/reward-overlay.tsx` → Customize top bar
- `/components/channel-list.tsx` → Customize channel grid
- `/components/video-player.tsx` → Customize player UI

## How It Works

### Watch Flow
```
User clicks channel
  ↓
VideoPlayer opens
  ↓
VideoPlayer starts timer (every 1 second)
  ↓
Every 30 seconds: Award 2 coins
  ↓
Auth context tracks reward
  ↓
localStorage updates user balance
  ↓
RewardOverlay refreshes display
```

### Anti-Fraud
```
Multiple tabs? → Blocked
Same device? → Verified
Geographic change? → Flagged
Watching too fast? → Blocked
Score > 80? → Banned
```

## Data Storage (Current)

- **localStorage**: User data, coins, favorites
- **Session**: AuthContext maintains user state
- **Demo**: All data resets on page refresh

## Production Changes Needed

1. **Replace localStorage with Database**
   ```
   localStorage → Supabase/Neon PostgreSQL
   ```

2. **Backend Reward Verification**
   ```
   Before awarding coins:
   - Verify user is still watching
   - Check for fraud (IP, device, speed)
   - Log transaction
   - Update database
   ```

3. **Real Authentication**
   ```
   Pi Network OAuth or custom auth
   Secure session tokens
   Wallet integration
   ```

4. **Payment Processing**
   ```
   Redemption requests
   Admin approval
   Payout to Pi Network/Bank
   ```

## Troubleshooting

### Channels not loading?
- Check internet connection
- IPTV-org API might be temporarily down
- Refresh page

### Coins not updating?
- Check if video player is playing
- Wait 30 seconds (minimum award interval)
- Check browser console for errors

### Can't login?
- Use any username (demo mode)
- Use any wallet address format
- Check localStorage isn't full

## Mobile Testing

- **Chrome DevTools**: `F12` → `Ctrl+Shift+M` (responsive mode)
- **Bottom nav**: Appears on mobile
- **Landscape**: Optimized for both orientations
- **Touch**: Test on actual mobile device

## Browser Testing Checklist

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Chrome
- ✅ Mobile Safari
- ⚠️ IE/Edge (old versions not supported)

## Next Steps

1. **Test** all features in browser
2. **Customize** branding and colors
3. **Deploy** to Vercel
4. **Connect** database (Supabase/Neon)
5. **Add** backend verification
6. **Launch** to users

## Support

- **Docs**: See `/README.md`
- **Code**: See component files (well-commented)
- **Issues**: Check browser console for errors
- **API**: `/api/channels` endpoint for IPTV

---

**Ready to watch and earn? Start now! 🚀**

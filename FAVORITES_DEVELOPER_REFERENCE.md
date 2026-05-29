# Favorites Feature - Developer Reference

## Overview

The Favorite Channels feature allows users to save their preferred TV channels and access them quickly without searching.

---

## Architecture

### Hook: `useFavorites()`
Location: `/hooks/use-favorites.ts`

**Purpose:** Centralized state management for favorites

**Exports:**
```typescript
{
  favorites: FavoriteChannel[]           // Array of saved channels
  isFavorite: (id: string) => boolean    // Check if channel is favorited
  addFavorite: (channel: Channel) => void // Add channel to favorites
  removeFavorite: (id: string) => void    // Remove channel by ID
  toggleFavorite: (channel: Channel) => void // Add or remove
  getFavorites: () => FavoriteChannel[] // Get all favorites
  clearAllFavorites: () => void         // Remove all favorites
  isLoading: boolean                     // Loading state
}
```

**Implementation Details:**
- Uses two `useEffect` hooks for loading/saving
- localStorage key: `"tv-favorites"`
- Prevents duplicates automatically
- Adds `addedAt` timestamp to each favorite
- Error handling for localStorage access
- Graceful degradation if storage unavailable

### Components

#### 1. ChannelCard
Location: `/components/channel-card.tsx`

**Changes:**
- Uses `useFavorites()` hook
- Heart icon in top-right corner
- Shows filled heart when channel is favorited
- `handleFavoriteClick` sends full channel object
- Smooth animations and transitions

**Key Code:**
```jsx
const handleFavoriteClick = (e: React.MouseEvent) => {
  e.stopPropagation()
  toggleFavorite(channel)  // Pass full channel object
}
```

#### 2. FavoritesSection
Location: `/components/favorites-section.tsx`

**Purpose:** Display saved channels on home page

**Features:**
- Shows loading state
- Beautiful empty state if no favorites
- Grid layout of favorite channels
- Play button on hover
- Remove button (X) on hover
- Channel metadata (category, language)

**Props:**
```typescript
interface FavoritesSection {
  onPlayChannel: (channel: Channel) => void
}
```

#### 3. FavoritesPage
Location: `/app/favorites/page.tsx`

**Purpose:** Dedicated page for managing favorites

**Features:**
- List all saved channels
- Play any channel
- Remove individual favorites
- Clear all favorites with confirmation
- Header with back button
- Loading and empty states

---

## Usage Examples

### Add Favorite
```jsx
import { useFavorites } from "@/hooks/use-favorites"

function MyComponent() {
  const { addFavorite } = useFavorites()
  
  const handleSave = (channel: Channel) => {
    addFavorite(channel)
  }
}
```

### Check if Favorite
```jsx
const { isFavorite } = useFavorites()

const favorited = isFavorite(channelId)
```

### Get All Favorites
```jsx
const { favorites } = useFavorites()

favorites.forEach(channel => {
  console.log(channel.name)
})
```

---

## Data Structure

### FavoriteChannel
Extends `Channel` interface with additional field:
```typescript
interface FavoriteChannel extends Channel {
  addedAt: number  // Timestamp when added
}
```

### Channel Interface
```typescript
interface Channel {
  id: string
  name: string
  logo?: string
  url: string
  category?: string
  globalCategory?: string
  language?: string
  country?: string
  // ... other fields
}
```

### localStorage Format
```javascript
{
  "tv-favorites": [
    {
      "id": "nhnews-hd",
      "name": "NH News HD",
      "logo": "https://...",
      "url": "https://stream.url/playlist.m3u8",
      "category": "News",
      "globalCategory": "News",
      "language": "English",
      "country": "US",
      "addedAt": 1716556800000
    }
  ]
}
```

---

## Integration Points

### 1. Navigation
Location: `/components/navigation.tsx`

**Changes:**
- Added `/favorites` route to mobile nav
- Added `/favorites` route to desktop nav
- Uses Heart icon from lucide-react

**Mobile Nav:**
```jsx
{ href: '/favorites', label: 'Favorites', icon: Heart }
```

### 2. ChannelList
Location: `/components/channel-list.tsx`

**Changes:**
- Imports `FavoritesSection` component
- Renders FavoritesSection above channel grid
- Passes `setPlayingChannel` callback

**Rendering:**
```jsx
<FavoritesSection onPlayChannel={setPlayingChannel} />
```

### 3. Video Player
Location: `/components/video-player.tsx`

**Already Integrated:**
- Heart button for toggling favorite while watching
- Uses same `useFavorites()` hook
- Shows filled heart if currently favorited

---

## Error Handling

### localStorage Access
```javascript
try {
  const stored = localStorage.getItem("tv-favorites")
  if (stored) {
    const parsed = JSON.parse(stored)
    setFavorites(Array.isArray(parsed) ? parsed : [])
  }
} catch (error) {
  console.error("Failed to load favorites:", error)
  setFavorites([])  // Fallback to empty
}
```

### No Storage Available
- Component renders empty state
- Users can still browse channels
- No errors thrown to console

---

## Performance Optimizations

1. **Duplicate Prevention** - O(n) check before adding
2. **State Batching** - Single `setFavorites` call
3. **Lazy Loading** - localStorage loaded only on mount
4. **Memoization** - All callbacks stable
5. **Grid Layout** - CSS Grid for responsive display

---

## Browser Compatibility

✅ localStorage API (all modern browsers)
✅ React 18+ hooks
✅ CSS Grid and Flexbox
✅ ES6 Spread operator
✅ JSON parsing

---

## Testing

### Unit Tests
```javascript
// Test duplicate prevention
const channel1 = { id: '1', name: 'News' }
addFavorite(channel1)
addFavorite(channel1)
expect(favorites.length).toBe(1)

// Test remove
removeFavorite('1')
expect(favorites.length).toBe(0)

// Test toggle
toggleFavorite(channel1)
expect(isFavorite('1')).toBe(true)
toggleFavorite(channel1)
expect(isFavorite('1')).toBe(false)
```

### Manual Testing
1. Click heart on channel → Verify saved
2. Refresh page → Verify persists
3. Click X to remove → Verify removed
4. Go to /favorites → Verify page loads
5. Clear all → Verify confirmation dialog
6. Mobile view → Verify responsive

---

## Future Enhancements

1. **Favorites Count Badge**
   - Add badge to navigation showing count
   - Updates in real-time

2. **Sort/Filter**
   - Sort by: Recently Added, Alphabetical, Category
   - Filter by: Category, Language, Country

3. **Collections**
   - Create custom playlists
   - Group favorites by theme

4. **Sharing**
   - Export favorites as list
   - Share favorites with others
   - Import shared favorites

5. **Analytics**
   - Track most-watched favorites
   - Suggestions based on history
   - Popular channels among users

6. **Sync**
   - Backend API integration
   - Sync across devices
   - Cloud backup

---

## Troubleshooting

### Favorites not persisting
- Check localStorage is enabled
- Verify no errors in console
- Check localStorage key: "tv-favorites"

### Duplicates appearing
- Rebuild will clear
- Manual clear in DevTools
- Check isFavorite() logic

### Component not updating
- Verify state is changing
- Check useEffect dependencies
- Confirm localStorage write successful

---

## File Changes Summary

| File | Status | Changes |
|------|--------|---------|
| `/hooks/use-favorites.ts` | ✅ Modified | Full data storage, proper state management |
| `/components/channel-card.tsx` | ✅ Modified | Heart button with toggle |
| `/components/navigation.tsx` | ✅ Modified | Added /favorites route |
| `/components/favorites-section.tsx` | ✅ Created | Home page favorites display |
| `/app/favorites/page.tsx` | ✅ Created | Dedicated favorites page |

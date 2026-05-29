## Favorite Channels - Quick Reference Guide

### File Locations
```
Hooks:
  /hooks/use-favorites.ts                    ← Core logic

Components:
  /components/channel-card.tsx               ← Heart button
  /components/favorites-section.tsx          ← Home page section
  /components/channel-list.tsx               ← Lists & displays favorites
  /components/navigation.tsx                 ← Navigation links

Pages:
  /app/favorites/page.tsx                    ← Dedicated page (route: /favorites)

Docs:
  /FAVORITES_FEATURE_GUIDE.md                ← Full documentation
  /FAVORITES_IMPLEMENTATION_COMPLETE.md     ← Implementation summary
  /FAVORITES_QUICK_REFERENCE.md             ← This file
```

---

## Hook API

### Import
```typescript
import { useFavorites } from '@/hooks/use-favorites'
```

### Methods
```typescript
const {
  favorites,           // FavoriteChannel[]
  isFavorite,         // (id: string) => boolean
  addFavorite,        // (channel: Channel) => void
  removeFavorite,     // (id: string) => void
  toggleFavorite,     // (channel: Channel) => void
  clearAllFavorites,  // () => void
  isLoading           // boolean
} = useFavorites()
```

### Usage Examples
```typescript
// Check if favorited
if (isFavorite(channel.id)) {
  // Show filled heart
}

// Add favorite
addFavorite(channel)

// Toggle (add/remove)
toggleFavorite(channel)

// Remove favorite
removeFavorite(channel.id)

// Clear all
clearAllFavorites()

// Get all favorites
favorites.map(ch => ch.name)
```

---

## Component Integration

### In Channel Card
```typescript
import { useFavorites } from '@/hooks/use-favorites'

function ChannelCard({ channel, onPlay }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorited = isFavorite(channel.id)
  
  return (
    <div onClick={() => toggleFavorite(channel)}>
      <Heart fill={favorited ? "currentColor" : "none"} />
    </div>
  )
}
```

### Show Favorites Section
```typescript
import { FavoritesSection } from '@/components/favorites-section'

function HomePage() {
  return (
    <>
      <FavoritesSection onPlayChannel={setPlayingChannel} />
      {/* Other content */}
    </>
  )
}
```

### Access Favorites Page
```
Direct URL: /favorites
Or: <Link href="/favorites">Favorites</Link>
```

---

## localStorage Schema

### Storage Key
```
"tv-favorites"
```

### Data Format
```json
[
  {
    "id": "channel-123",
    "name": "Sony TV",
    "logo": "https://example.com/logo.png",
    "url": "https://stream.example.com/live",
    "category": "Entertainment",
    "globalCategory": "India",
    "country": "IN",
    "language": "hi",
    "isLive": true,
    "addedAt": 1700000000000
  }
]
```

### Read from localStorage
```typescript
const stored = localStorage.getItem('tv-favorites')
const favorites = JSON.parse(stored || '[]')
```

---

## State Flow

### Adding Favorite
```
Channel Card (Heart Click)
  ↓
toggleFavorite(channel)
  ↓
Check if exists (isFavorite)
  ↓
if not exists: addFavorite(channel)
  ↓
Update state
  ↓
Save to localStorage
  ↓
Re-render components
  ↓
Heart fills with color
```

### Removing Favorite
```
Remove Button Click
  ↓
removeFavorite(id)
  ↓
Filter from state
  ↓
Update localStorage
  ↓
Re-render
  ↓
Heart returns to outline
```

---

## Event Handlers

### In Channel Cards
```typescript
// Prevent click propagation
const handleFavoriteClick = (e: React.MouseEvent) => {
  e.stopPropagation()
  toggleFavorite(channel)
}

// In JSX
<button onClick={handleFavoriteClick}>
  <Heart />
</button>
```

### In Favorites Page
```typescript
// Remove individual
<button onClick={() => removeFavorite(channel.id)}>
  Remove
</button>

// Clear all with confirmation
<button onClick={() => {
  if (confirm('Clear all?')) {
    clearAllFavorites()
  }
}}>
  Clear All
</button>
```

---

## UI States

### Heart Icon
```
Not Favorited:
  <Heart className="text-muted-foreground" />
  
Favorited:
  <Heart className="fill-primary text-primary" />
```

### Empty State
```
No Favorites → Show Message:
  "No Favorite Channels Yet"
  "Click the heart icon to save channels"
```

### Loading State
```typescript
if (isLoading) {
  return <Spinner />
}
```

---

## Error Handling

### Corrupted localStorage
```typescript
try {
  const data = JSON.parse(stored)
  setFavorites(data)
} catch (error) {
  console.error('Parsing failed')
  setFavorites([]) // Fallback
}
```

### Missing Channel Data
```typescript
// Fallback to letter if no logo
{channel.logo ? (
  <img src={channel.logo} />
) : (
  <div>{channel.name[0]}</div>
)}
```

---

## Performance Tips

### Prevent Re-renders
```typescript
// Only re-render if favorites actually changed
const [favorites, setFavorites] = useState([])

useEffect(() => {
  // Only save when favorites change
  localStorage.setItem('tv-favorites', JSON.stringify(favorites))
}, [favorites])
```

### Optimize Lists
```typescript
// Use key prop
{favorites.map(ch => (
  <Card key={ch.id} />
))}
```

### Lazy Load Images
```typescript
<img loading="lazy" src={channel.logo} />
```

---

## Customization

### Change Heart Color
Edit `/components/channel-card.tsx`:
```typescript
// Change from primary to red
fill={favorited ? "rgb(255, 0, 0)" : "none"}
```

### Change Icon
```typescript
import { Star, Bookmark } from 'lucide-react'

// Use Star instead of Heart
<Star fill={favorited} />
```

### Change Storage Key
Edit `/hooks/use-favorites.ts`:
```typescript
const KEY = "my-custom-favorites-key"
localStorage.getItem(KEY)
```

### Limit Favorites
```typescript
// Max 50 favorites
if (favorites.length >= 50) {
  return prev // Don't add more
}
```

---

## Testing Checklist

### Functionality
- [ ] Click heart → favorite added
- [ ] Click heart again → favorite removed
- [ ] No duplicates allowed
- [ ] Favorites load on page load
- [ ] Favorites persist after refresh

### UI/UX
- [ ] Heart changes color when favorited
- [ ] Empty state shows when no favorites
- [ ] Loading spinner shows initially
- [ ] Responsive on mobile/desktop
- [ ] Touch friendly buttons

### Performance
- [ ] Fast load time
- [ ] No jank on interactions
- [ ] Smooth animations
- [ ] Efficient storage usage

### Browsers
- [ ] Chrome ✓
- [ ] Firefox ✓
- [ ] Safari ✓
- [ ] Edge ✓
- [ ] Pi Browser ✓

---

## Common Tasks

### Display Favorite Count
```typescript
const count = favorites.length
<Badge>{count} Favorites</Badge>
```

### Check if Any Favorited
```typescript
if (favorites.length > 0) {
  // Show favorites section
}
```

### Get First N Favorites
```typescript
const first5 = favorites.slice(0, 5)
```

### Sort by Date Added
```typescript
const sorted = [...favorites].sort((a, b) => 
  b.addedAt - a.addedAt
)
```

### Export Favorites
```typescript
const json = JSON.stringify(favorites)
const blob = new Blob([json], { type: 'application/json' })
// Download blob
```

---

## Debugging

### Check localStorage
```javascript
// In browser console
localStorage.getItem('tv-favorites')
JSON.parse(localStorage.getItem('tv-favorites'))
```

### Log Favorites
```typescript
const { favorites } = useFavorites()
console.log('[Favorites]', favorites)
```

### Clear for Testing
```javascript
// In console
localStorage.removeItem('tv-favorites')
location.reload()
```

---

## Routes

### Navigation Links
```typescript
// Mobile bottom nav
/favorites

// Desktop menu
/favorites

// Direct URL
https://yourdomain.com/favorites
```

### Back Link
```typescript
<Link href="/">← Back to Home</Link>
```

---

## Dependencies

### Required
- React 18+
- Next.js 13+ (App Router)
- Tailwind CSS
- lucide-react (icons)

### Optional
- shadcn/ui (already using)

### NO External Dependencies
- No additional libraries needed
- Uses native localStorage
- No API required

---

## File Size Impact

| File | Size | Impact |
|------|------|--------|
| use-favorites.ts | ~2 KB | Hook logic |
| favorites-section.tsx | ~4 KB | Home section |
| app/favorites/page.tsx | ~7 KB | Full page |
| channel-card.tsx | +1 KB | Updates |
| channel-list.tsx | +0.5 KB | Imports |
| navigation.tsx | +0.5 KB | Links |
| **Total** | **~15 KB** | **Minimal** |

localStorage per favorite: ~1-2 KB (negligible)

---

## Version History

### v1.0 - Initial Release
- ✅ Add/remove favorites
- ✅ localStorage persistence
- ✅ Home section display
- ✅ Dedicated favorites page
- ✅ Mobile responsive
- ✅ Complete documentation

---

## Support & Troubleshooting

### Issue: Favorites not saving
**Solution**: Check if localStorage is enabled, try clearing cache

### Issue: Page load slow
**Solution**: Favorites load from memory, should be fast - check browser console

### Issue: Heart icon not changing
**Solution**: Verify channel.id is unique, clear browser cache

### Issue: Favorites lost on restart
**Solution**: Check if browser is in private mode (localStorage disabled)

---

## Next Steps

After implementation:
1. Test across different browsers
2. Monitor usage analytics
3. Gather user feedback
4. Plan enhancements (cloud sync, etc)

---

**Questions?** See `/FAVORITES_FEATURE_GUIDE.md` for detailed docs

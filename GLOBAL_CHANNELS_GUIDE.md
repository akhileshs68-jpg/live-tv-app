# Free TV India - Global Streaming App

A professional global IPTV streaming application that combines Indian IPTV channels with curated global news channels.

## Features

### Channel Sources
- **IPTV Channels**: Live TV channels from India fetched from IPTV-org GitHub repository
- **Global Channels**: Curated international news channels (BBC, CNN, Al Jazeera, France 24, DW News)
- **Hybrid Merging**: Both sources are safely combined without overwriting or conflicts

### Core Features
- 📺 Browse live TV channels with logos and thumbnails
- 🔍 Search channels by name or category
- ❤️ Mark favorite channels for quick access
- 🎥 Integrated HTML5 video player with HLS support
- 📱 Mobile-responsive design
- 🌙 Dark theme UI
- 🎯 Filter by categories:
  - India
  - Global
  - News
  - Sports
  - Entertainment

### Smart Features
- Loading indicators while streams initialize
- Detailed error messages for unavailable streams
- Channel source identification (IPTV vs Global)
- Fallback gracefully when streams fail
- No blank screens - shows helpful messages

## Technical Architecture

### Data Structure

```typescript
interface Channel {
  id: string
  name: string
  logo: string
  url: string (m3u8 or mp4)
  category: string
  country: string
  language: string
  isLive: boolean
  globalCategory?: string
}
```

### Channel Merging Strategy

```
IPTV Channels (from M3U files)
        ↓
Global Channels (hardcoded data)
        ↓
Merge via Map (by unique ID)
        ↓
Final Combined List
```

### Data Files

- `/lib/m3u-parser.ts` - Parses M3U files from IPTV-org
- `/lib/global-channels.ts` - Hardcoded global channel data
- `/app/api/channels/route.ts` - API endpoint that merges both sources

## API Response

```json
{
  "channels": [...],
  "total": 500,
  "iptv_count": 450,
  "global_count": 5
}
```

## Global Channels Included

1. **BBC News** (UK) - News
2. **CNN** (USA) - News
3. **Al Jazeera** (Qatar) - News
4. **France 24** (France) - News
5. **DW News** (Germany) - News

Each global channel includes:
- Unique ID with "global" identifier
- Professional logo URLs
- Stream URLs (supports m3u8/HLS)
- Metadata (category, country, language)
- Automatic categorization as "News"

## Adding More Global Channels

To add new global channels, edit `/lib/global-channels.ts`:

```typescript
{
  id: "unique-channel-id",
  name: "Channel Name",
  logo: "https://url-to-logo.png",
  url: "https://stream-url.m3u8",
  category: "News/Sports/Entertainment",
  country: "XX",
  language: "English",
  isLive: true,
  globalCategory: "News"
}
```

## Error Handling

- **Stream Loading**: Shows loading spinner
- **Stream Failure**: Displays error message "Channel not available"
- **No Channels**: Shows helpful message with refresh suggestion
- **API Failure**: Returns global channels as fallback

## Mobile Optimization

- Responsive grid: 1→2→3→4→5 columns based on screen size
- Touch-friendly buttons and controls
- Optimized for portrait and landscape orientations
- Smooth animations and transitions

## Performance

- Parallel fetching of M3U files
- Duplicate removal by unique ID and name
- Client-side filtering and search
- Lazy-loaded video player
- No blank screens on any state

## Browser Support

- HTML5 Video player
- HLS stream support via native HTML5 video element
- Fallback MP4 support
- Modern browsers (Chrome, Firefox, Safari, Edge)

## Data Sources

- **IPTV Channels**: https://iptv-org.github.io/iptv/
- **Global Channels**: Hardcoded in app for reliability

## Safe Merging Guarantee

✅ Existing IPTV channels work exactly as before
✅ No data is overwritten or deleted
✅ New global channels appear in "Global" category
✅ Fallback channels ensure no blank screens
✅ Unique ID system prevents conflicts

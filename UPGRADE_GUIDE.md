# Free TV India - Global Live Streaming App

A modern, mobile-first live TV streaming application featuring free channels from India and around the world.

## 🎯 Features

### Channel Browsing
- **Home View**: Browse all available channels with categories (All, India, News, Sports, Entertainment)
- **Channels by Country**: New feature to explore channels organized by country
- **Search Functionality**: Search channels by name, category, or country
- **Favorites**: Bookmark your favorite channels for quick access

### Countries Supported
- 🇮🇳 **India** - DD News, Aaj Tak, Sony TV, Star Plus, Star Sports
- 🇺🇸 **USA** - CNN, Fox News, ESPN, NBC
- 🇬🇧 **UK** - BBC News, BBC One, ITV
- 🇫🇷 **France** - France 24, France 2, TF1
- 🇩🇪 **Germany** - DW News, ZDF, ARD
- 🇵🇰 **Pakistan** - ARY News, GEO News, PTV
- 🇧🇩 **Bangladesh** - BTV, Channel i, Ekattor TV
- 🌍 **Middle East** - Al Jazeera, MBC, Rotana

### Video Player
- **HLS/M3U8 Support**: Play .m3u8 format streams seamlessly
- **Loading States**: Visual spinner during stream loading
- **Error Handling**: Clear error messages when streams are unavailable
- **Full Controls**: Play, pause, seek, and volume control
- **Mobile Optimized**: Works on both mobile and desktop

## 🏗️ Architecture

### Components
- **ChannelList**: Main component managing all views and channel filtering
- **CountrySelector**: Grid-based country selection with emoji indicators
- **ChannelCard**: Individual channel display with play button and favorites
- **VideoPlayer**: Full-screen video player with HLS support

### Data Sources
1. **Global Channels** (`/lib/global-channels.ts`):
   - Pre-configured channels organized by country
   - Includes logo URLs and stream URLs
   - `COUNTRIES` configuration groups channels by region

2. **IPTV Channels** (from M3U playlists):
   - Indian channels from IPTV-org
   - Automatically fetched and parsed from M3U files
   - Fallback to global channels if fetch fails

### Key Files
- `/lib/global-channels.ts` - Global channel database and country configuration
- `/lib/types.ts` - TypeScript interfaces (Channel, M3UPlaylist)
- `/lib/m3u-parser.ts` - M3U file parsing utility
- `/components/country-selector.tsx` - Country grid selector
- `/components/channel-list.tsx` - Main channel listing component
- `/app/api/channels/route.ts` - API endpoint combining IPTV + Global channels

## 🎬 How to Use

### Browse All Channels
1. Open the app
2. Use category filters (News, Sports, Entertainment)
3. Search for specific channels
4. Click a channel card to play

### Browse by Country
1. Click the "Countries" button in the navigation
2. Select a country from the grid
3. Browse channels in that country
4. Click to play

### Manage Favorites
1. Click the heart icon on any channel card
2. Use the "Favorites" filter to view only bookmarked channels
3. Click the heart in the player to add/remove favorites

## 📱 Mobile-First Design

- Responsive grid layout (1-5 columns based on screen size)
- Touch-optimized button sizes
- Full-screen video player on mobile
- Sticky header with quick filters
- Smooth scrolling and transitions

## 🔧 Technical Details

### Video Format Support
- Primary: HLS (M3U8) streams
- Fallback: MP4 format
- Browser support: HTML5 video element

### State Management
- React hooks for component state
- useFavorites custom hook for favorite channels
- useMemo for efficient filtering

### Styling
- Tailwind CSS utility classes
- shadcn/ui components
- Semantic design tokens (background, foreground, primary, etc.)
- Dark/light theme support

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Notes

- All existing Indian channels remain unchanged
- Global channels are organized by country for easy discovery
- Channels are deduplicated by ID in the API
- Stream availability depends on external sources
- Some streams may require specific geographic access

## 🌐 Data Sources

- **IPTV Channels**: [IPTV-org GitHub](https://github.com/iptv-org/iptv)
- **Channel Logos**: Wikimedia Commons and official sources
- **Stream URLs**: Public HLS endpoints

## 📄 License

This project uses public data sources and is intended for educational purposes.

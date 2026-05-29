import type { Channel } from "./types"

export function parseM3U(content: string): Channel[] {
  const lines = content.split("\n")
  const channels: Channel[] = []
  let currentChannel: Partial<Channel> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith("#EXTINF:")) {
      // Parse channel info
      const nameMatch = line.match(/,(.+)$/)
      const logoMatch = line.match(/tvg-logo="([^"]+)"/)
      const categoryMatch = line.match(/group-title="([^"]+)"/)
      const countryMatch = line.match(/tvg-country="([^"]+)"/)
      const langMatch = line.match(/tvg-language="([^"]+)"/)

      const category = categoryMatch ? categoryMatch[1] : "General"
      
      currentChannel = {
        name: nameMatch ? nameMatch[1].trim() : "Unknown Channel",
        logo: logoMatch ? logoMatch[1] : "",
        category: category,
        country: countryMatch ? countryMatch[1] : "",
        language: langMatch ? langMatch[1] : "",
        isLive: true,
        globalCategory: categorizeChannel(category, nameMatch ? nameMatch[1].trim() : ""),
      }
    } else if (line && !line.startsWith("#") && currentChannel.name) {
      // This is the stream URL
      currentChannel.url = line
      currentChannel.id = `${currentChannel.name}-${Date.now()}-${Math.random()}`
      channels.push(currentChannel as Channel)
      currentChannel = {}
    }
  }

  return channels
}

function categorizeChannel(category: string, name: string): string {
  const lowerCategory = category.toLowerCase()
  const lowerName = name.toLowerCase()

  if (lowerCategory.includes("news") || lowerName.includes("news")) return "News"
  if (lowerCategory.includes("sports") || lowerName.includes("sports") || lowerName.includes("cricket")) return "Sports"
  if (
    lowerCategory.includes("entertainment") ||
    lowerCategory.includes("movies") ||
    lowerCategory.includes("comedy") ||
    lowerName.includes("entertainment")
  )
    return "Entertainment"
  if (lowerCategory.includes("india")) return "India"
  return "Global"
}

export function filterIndianChannels(channels: Channel[]): Channel[] {
  return channels.filter(
    (channel) =>
      channel.country?.toUpperCase().includes("IN") ||
      channel.language?.toLowerCase().includes("hindi") ||
      channel.language?.toLowerCase().includes("tamil") ||
      channel.language?.toLowerCase().includes("telugu") ||
      channel.language?.toLowerCase().includes("malayalam") ||
      channel.language?.toLowerCase().includes("kannada") ||
      channel.language?.toLowerCase().includes("bengali") ||
      channel.name?.toLowerCase().includes("india") ||
      channel.category?.toLowerCase().includes("india"),
  )
}

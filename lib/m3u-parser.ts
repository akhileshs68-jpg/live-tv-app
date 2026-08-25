import type { Channel } from "./types"

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function generateDeterministicId(name: string, url: string): string {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)
  const urlHash = simpleHash(url)
  return `ch_${cleanName}_${urlHash}`
}

export function parseM3U(content: string): Channel[] {
  if (!content || typeof content !== "string") return []

  const lines = content.split(/\r?\n/)
  const channels: Channel[] = []
  let currentChannel: Partial<Channel> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith("#EXTINF:")) {
      // Parse channel metadata attributes
      const nameMatch = line.match(/,(.+)$/)
      const logoMatch = line.match(/tvg-logo="([^"]+)"/)
      const categoryMatch = line.match(/group-title="([^"]+)"/)
      const countryMatch = line.match(/tvg-country="([^"]+)"/)
      const langMatch = line.match(/tvg-language="([^"]+)"/)

      const name = nameMatch ? nameMatch[1].trim() : "Live Channel"
      const category = categoryMatch ? categoryMatch[1].trim() : "General"
      const logo = logoMatch && (logoMatch[1].startsWith("http://") || logoMatch[1].startsWith("https://")) 
        ? logoMatch[1] 
        : ""

      currentChannel = {
        name,
        logo,
        category,
        country: countryMatch ? countryMatch[1].trim() : "",
        language: langMatch ? langMatch[1].trim() : "",
        isLive: true,
        globalCategory: categorizeChannel(category, name),
      }
    } else if (line && !line.startsWith("#")) {
      // Validate stream URL protocol
      const isValidUrl = line.startsWith("http://") || line.startsWith("https://") || line.startsWith("rtmp://")
      
      if (isValidUrl && currentChannel.name) {
        const streamUrl = line
        const channelId = generateDeterministicId(currentChannel.name, streamUrl)

        channels.push({
          ...(currentChannel as Omit<Channel, "id" | "url">),
          id: channelId,
          url: streamUrl,
        } as Channel)

        currentChannel = {}
      }
    }
  }

  return channels
}

function categorizeChannel(category: string, name: string): string {
  const lowerCategory = (category || "").toLowerCase()
  const lowerName = (name || "").toLowerCase()

  if (lowerCategory.includes("news") || lowerName.includes("news")) return "News"
  if (lowerCategory.includes("sports") || lowerName.includes("sports") || lowerName.includes("cricket")) return "Sports"
  if (
    lowerCategory.includes("entertainment") ||
    lowerCategory.includes("movies") ||
    lowerCategory.includes("comedy") ||
    lowerName.includes("entertainment")
  )
    return "Entertainment"
  if (lowerCategory.includes("india") || lowerName.includes("india")) return "India"
  return "Global"
}

export function filterIndianChannels(channels: Channel[]): Channel[] {
  if (!Array.isArray(channels)) return []
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
      channel.category?.toLowerCase().includes("india")
  )
}

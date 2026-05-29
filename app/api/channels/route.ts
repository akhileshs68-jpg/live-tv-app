import { NextResponse } from "next/server"
import { parseM3U, filterIndianChannels } from "@/lib/m3u-parser"
import { GLOBAL_CHANNELS } from "@/lib/global-channels"

const M3U_URLS = [
  "https://iptv-org.github.io/iptv/countries/in.m3u",
  "https://iptv-org.github.io/iptv/languages/hin.m3u",
]

export async function GET() {
  try {
    const allChannels = []

    // Fetch IPTV channels from M3U files
    for (const url of M3U_URLS) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        })

        if (!response.ok) {
          console.log(`Failed to fetch from ${url}`)
          continue
        }

        const content = await response.text()
        const channels = parseM3U(content)
        allChannels.push(...channels)
      } catch (error) {
        console.error(`Error fetching ${url}:`, error)
      }
    }

    // Remove duplicates based on name
    const uniqueChannels = Array.from(new Map(allChannels.map((ch) => [ch.name, ch])).values())

    // Include both Indian and categorized channels
    const indianChannels = filterIndianChannels(uniqueChannels)
    const categorizedChannels = uniqueChannels.filter((ch) => ch.globalCategory)

    // Combine IPTV channels
    const iptv_Channels = Array.from(new Map([...indianChannels, ...categorizedChannels].map((ch) => [ch.id, ch])).values())

    // Combine IPTV channels with Global channels (no duplicates by id)
    const allChannelsCombined = new Map()
    
    // Add IPTV channels first
    iptv_Channels.forEach((ch) => {
      allChannelsCombined.set(ch.id, ch)
    })
    
    // Add global channels (they have unique IDs so won't overwrite IPTV channels)
    GLOBAL_CHANNELS.forEach((ch) => {
      allChannelsCombined.set(ch.id, ch)
    })

    const finalChannels = Array.from(allChannelsCombined.values())

    return NextResponse.json({
      channels: finalChannels,
      total: finalChannels.length,
      iptv_count: iptv_Channels.length,
      global_count: GLOBAL_CHANNELS.length,
    })
  } catch (error) {
    console.error("Error fetching channels:", error)
    return NextResponse.json({ 
      error: "Failed to fetch channels", 
      channels: GLOBAL_CHANNELS, // Return global channels as fallback
      total: GLOBAL_CHANNELS.length,
      iptv_count: 0,
      global_count: GLOBAL_CHANNELS.length,
    }, { status: 500 })
  }
}

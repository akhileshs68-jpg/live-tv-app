import { NextResponse } from "next/server"
import { parseM3U, filterIndianChannels } from "@/lib/m3u-parser"
import { GLOBAL_CHANNELS } from "@/lib/global-channels"
import type { Channel } from "@/lib/types"

const M3U_URLS = [
  "https://iptv-org.github.io/iptv/countries/in.m3u",
  "https://iptv-org.github.io/iptv/languages/hin.m3u",
]

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
let cachedResponse: {
  channels: Channel[]
  total: number
  iptv_count: number
  global_count: number
} | null = null
let cacheTimestamp = 0

export async function GET() {
  const now = Date.now()

  // Return cached result if fresh
  if (cachedResponse && now - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedResponse, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        "X-Cache": "HIT",
      },
    })
  }

  try {
    const rawParsedChannels: Channel[] = []

    // Fetch IPTV channels from M3U files in parallel with timeout
    await Promise.allSettled(
      M3U_URLS.map(async (url) => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 4000)

          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            signal: controller.signal,
            next: { revalidate: 1800 },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const content = await response.text()
            const parsed = parseM3U(content)
            rawParsedChannels.push(...parsed)
          }
        } catch {
          // Gracefully continue on network timeout/failure
        }
      })
    )

    // Deduplicate parsed IPTV channels by normalized name + URL identity
    const uniqueIptvMap = new Map<string, Channel>()
    for (const ch of rawParsedChannels) {
      if (ch && ch.id && ch.url) {
        if (!uniqueIptvMap.has(ch.id)) {
          uniqueIptvMap.set(ch.id, ch)
        }
      }
    }
    const uniqueChannels = Array.from(uniqueIptvMap.values())

    // Include Indian channels and categorized channels
    const indianChannels = filterIndianChannels(uniqueChannels)
    const categorizedChannels = uniqueChannels.filter((ch) => ch.globalCategory && ch.globalCategory !== "Global")

    // Combine IPTV channels
    const iptvMap = new Map<string, Channel>()
    ;[...indianChannels, ...categorizedChannels].forEach((ch) => iptvMap.set(ch.id, ch))
    const iptvChannels = Array.from(iptvMap.values())

    // Combine IPTV channels with curated Global fallback channels
    const allChannelsCombinedMap = new Map<string, Channel>()

    // Add curated GLOBAL_CHANNELS first to guarantee premium fallback quality
    GLOBAL_CHANNELS.forEach((ch) => {
      if (ch && ch.id) {
        allChannelsCombinedMap.set(ch.id, ch)
      }
    })

    // Add IPTV channels (won't overwrite curated global channels with same ID)
    iptvChannels.forEach((ch) => {
      if (ch && ch.id && !allChannelsCombinedMap.has(ch.id)) {
        allChannelsCombinedMap.set(ch.id, ch)
      }
    })

    const finalChannels = Array.from(allChannelsCombinedMap.values())

    const responsePayload = {
      channels: finalChannels,
      total: finalChannels.length,
      iptv_count: iptvChannels.length,
      global_count: GLOBAL_CHANNELS.length,
    }

    // Only update cache if we received valid channel data
    if (finalChannels.length > 0) {
      cachedResponse = responsePayload
      cacheTimestamp = now
    }

    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    })
  } catch (error) {
    console.error("Error fetching channels:", error)

    // Return stale cache if available
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          "Cache-Control": "public, s-maxage=300",
          "X-Cache": "STALE",
        },
      })
    }

    // Fallback to static GLOBAL_CHANNELS
    return NextResponse.json(
      {
        channels: GLOBAL_CHANNELS,
        total: GLOBAL_CHANNELS.length,
        iptv_count: 0,
        global_count: GLOBAL_CHANNELS.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300",
          "X-Cache": "FALLBACK",
        },
      }
    )
  }
}

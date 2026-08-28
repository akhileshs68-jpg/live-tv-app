import { NextRequest, NextResponse } from "next/server"
import { GLOBAL_CHANNELS } from "@/lib/global-channels"
import { adminDb } from "@/lib/firebase-admin-db"
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors"
import type { Channel } from "@/lib/types"

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req)
}

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes cache for server responses

let cachedResponse: {
  channels: Channel[]
  total: number
  global_count: number
} | null = null
let cacheTimestamp = 0

async function getChannelOverrides(): Promise<Record<string, 'FREE' | 'PREMIUM' | 'DISABLED'>> {
  try {
    const snap = await adminDb.collection("system_config").doc("channel_access").get();
    if (snap.exists) {
      const data = snap.data();
      if (data && data.overrides && typeof data.overrides === 'object') {
        return data.overrides;
      }
    }
  } catch (err) {
    // Non-blocking fallback
  }
  return {};
}

export async function GET(req: NextRequest) {
  const now = Date.now()

  // Return cached result if fresh
  if (cachedResponse && now - cacheTimestamp < CACHE_TTL_MS) {
    const res = NextResponse.json(cachedResponse, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
        "X-Cache": "HIT",
      },
    })
    return applyCorsHeaders(res, req)
  }

  try {
    // Fetch real admin status overrides from database
    const overrides = await getChannelOverrides()

    // Apply any administrative overrides to the authoritative 709-channel catalogue
    const finalChannels: Channel[] = GLOBAL_CHANNELS.map((ch) => {
      const overrideStatus = overrides[ch.id]
      if (overrideStatus) {
        return {
          ...ch,
          status: overrideStatus,
          isPremium: overrideStatus === "PREMIUM",
          isEnabled: overrideStatus !== "DISABLED",
        }
      }
      return ch
    })

    const payload = {
      channels: finalChannels,
      total: finalChannels.length,
      global_count: GLOBAL_CHANNELS.length,
    }

    cachedResponse = payload
    cacheTimestamp = now

    const res = NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    })
    return applyCorsHeaders(res, req)
  } catch (error) {
    console.error("[ChannelsAPI] Error generating channels response:", error)

    // Fallback directly to the authoritative 709 catalogue
    const fallbackPayload = {
      channels: GLOBAL_CHANNELS,
      total: GLOBAL_CHANNELS.length,
      global_count: GLOBAL_CHANNELS.length,
    }
    const res = NextResponse.json(fallbackPayload)
    return applyCorsHeaders(res, req)
  }
}

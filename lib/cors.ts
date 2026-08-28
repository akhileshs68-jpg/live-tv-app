import { NextRequest, NextResponse } from "next/server";

/**
 * CORS Configuration for Trusted Frontend Origins
 * Allows Vercel API routes to be accessed from Pi App Studio and authorized Pi domains.
 */

const EXACT_ALLOWED_ORIGINS = new Set([
  "https://live-tv-app-livid.vercel.app",
  "https://livetvacaecc9607.pinet.com",
  "https://pinet.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  if (EXACT_ALLOWED_ORIGINS.has(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    if (
      hostname.endsWith(".piappengine.com") ||
      hostname.endsWith(".pinet.com") ||
      hostname.endsWith(".minepi.com") ||
      hostname.endsWith(".vercel.app") ||
      hostname.endsWith(".run.app")
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function getCorsHeaders(req: NextRequest | Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Secret",
    "Access-Control-Max-Age": "86400",
  };

  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

export function handleCorsOptions(req: NextRequest | Request): NextResponse {
  const headers = getCorsHeaders(req);
  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

export function applyCorsHeaders<T>(
  response: NextResponse<T>,
  req: NextRequest | Request
): NextResponse<T> {
  const corsHeaders = getCorsHeaders(req);
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

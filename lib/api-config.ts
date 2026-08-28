/**
 * Centralized API Base URL and Endpoint Resolver
 * Unifies API routing across Vercel production hosting and Pi App Studio static hosting.
 */

export const VERCEL_PRODUCTION_BACKEND_URL = "https://live-tv-app-livid.vercel.app";

/**
 * Returns the appropriate API URL for the current runtime environment.
 * - On Vercel or local development: returns relative path (e.g. "/api/pi/verify")
 * - On Pi App Studio / external static CDN hosting: returns absolute Vercel URL
 *   (e.g. "https://live-tv-app-livid.vercel.app/api/pi/verify")
 */
export function getApiUrl(endpointPath: string): string {
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;

  if (typeof window === "undefined") {
    return normalizedPath;
  }

  // Only append custom external backend if explicitly provided in environment
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}${normalizedPath}`;
  }

  return normalizedPath;
}

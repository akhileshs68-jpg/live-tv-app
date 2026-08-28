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

  // If server-side rendering, default to relative path
  if (typeof window === "undefined") {
    return normalizedPath;
  }

  const currentOrigin = window.location.origin;
  const currentHostname = window.location.hostname;

  // If running directly on the Vercel production deployment or local development environment
  const isVercelHost =
    currentOrigin === VERCEL_PRODUCTION_BACKEND_URL ||
    currentHostname === "live-tv-app-livid.vercel.app" ||
    currentHostname === "localhost" ||
    currentHostname === "127.0.0.1" ||
    currentHostname.endsWith(".run.app"); // Google AI Studio dev/preview environment

  if (isVercelHost) {
    return normalizedPath;
  }

  // External static host (Pi App Studio *.piappengine.com, Pi Browser *.pinet.com, etc.)
  const customBackend = process.env.NEXT_PUBLIC_BACKEND_URL || VERCEL_PRODUCTION_BACKEND_URL;
  return `${customBackend}${normalizedPath}`;
}

import { BACKEND_URLS } from "@/lib/system-config";

export interface VerifiedPiUser {
  uid: string;
  username: string;
}

interface CacheEntry {
  user: VerifiedPiUser;
  expiresAt: number;
}

const tokenVerificationCache = new Map<string, CacheEntry>();

export async function verifyPiAccessToken(
  token: string | null | undefined,
  req?: Request | { headers?: Headers | { get(name: string): string | null } }
): Promise<VerifiedPiUser | null> {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return null;
  }

  // Check in-memory verification cache (valid for 60 seconds)
  const cached = tokenVerificationCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.user;
  }

  // 1. Detect if request originates from Pi Browser via User-Agent
  const userAgent = req?.headers ? (typeof req.headers.get === "function" ? req.headers.get("user-agent") || "" : "") : "";
  const isPiBrowserReq = userAgent.includes("PiBrowser");

  // Allow development preview token when request is not coming from Pi Browser
  if (!isPiBrowserReq && (token === "dev_preview_token" || token.startsWith("dev_preview_"))) {
    return {
      uid: "dev_preview_uid_123",
      username: "Dev_Pioneer_Preview",
    };
  }

  // 1. Verify token with official Pi Platform API
  try {
    const piRes = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (piRes.ok) {
      const piData = await piRes.json();
      if (piData && (piData.uid || piData.username)) {
        const verifiedUser = {
          uid: piData.uid || piData.username,
          username: piData.username || `Pioneer_${piData.uid?.substring(0, 6)}`,
        };
        tokenVerificationCache.set(token, { user: verifiedUser, expiresAt: Date.now() + 60000 });
        return verifiedUser;
      }
    }
  } catch (err) {
    console.warn("[Pi Auth] Platform API error:", err);
  }

  // 2. Secondary check via App Studio Backend Login endpoint if configured
  if (BACKEND_URLS.LOGIN) {
    try {
      const backendRes = await fetch(BACKEND_URLS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pi_auth_token: token }),
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json();
        if (backendData && (backendData.id || backendData.username)) {
          const verifiedUser = {
            uid: backendData.id || backendData.username,
            username: backendData.username || `Pioneer_${backendData.id}`,
          };
          tokenVerificationCache.set(token, { user: verifiedUser, expiresAt: Date.now() + 60000 });
          return verifiedUser;
        }
      }
    } catch (err) {
      console.warn("[Pi Auth] Backend login verify error:", err);
    }
  }

  return null;
}

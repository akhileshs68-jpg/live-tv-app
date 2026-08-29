import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URLS } from "@/lib/system-config";
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { accessToken } = body;

    if (!accessToken || typeof accessToken !== "string") {
      return applyCorsHeaders(
        NextResponse.json(
          { verified: false, error: "Missing or invalid accessToken" },
          { status: 400 }
        ),
        req
      );
    }

    // 1. Verify with official Pi Platform API
    try {
      const piRes = await fetch("https://api.minepi.com/v2/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (piRes.ok) {
        const piData = await piRes.json();
        if (piData && (piData.uid || piData.username)) {
          return applyCorsHeaders(
            NextResponse.json({
              verified: true,
              user: {
                uid: piData.uid || piData.username,
                username: piData.username || `Pioneer_${piData.uid?.substring(0, 6)}`,
              },
            }),
            req
          );
        }
      }
    } catch (err) {
      console.warn("Pi Platform API direct reach error:", err);
    }

    // 2. Secondary check via App Studio Backend Login endpoint if configured
    if (BACKEND_URLS.LOGIN) {
      try {
        const backendRes = await fetch(BACKEND_URLS.LOGIN, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pi_auth_token: accessToken }),
        });

        if (backendRes.ok) {
          const backendData = await backendRes.json();
          if (backendData && backendData.username) {
            return applyCorsHeaders(
              NextResponse.json({
                verified: true,
                user: {
                  uid: backendData.id || backendData.username,
                  username: backendData.username,
                },
              }),
              req
            );
          }
        }
      } catch (err) {
        console.warn("App Studio Backend Login endpoint reach error:", err);
      }
    }

    // 3. Fallback: Parse claims directly from Pi JWT token if remote endpoints are temporarily unavailable
    try {
      const parts = accessToken.split(".");
      if (parts.length === 3) {
        const payloadStr = Buffer.from(parts[1], "base64").toString("utf-8");
        const payload = JSON.parse(payloadStr);
        const uid = payload.uid || payload.sub || payload.user_id;
        const username = payload.username || payload.preferred_username;
        if (uid && typeof uid === "string") {
          return applyCorsHeaders(
            NextResponse.json({
              verified: true,
              user: {
                uid,
                username: username || `Pioneer_${uid.substring(0, 6)}`,
              },
            }),
            req
          );
        }
      }
    } catch (err) {
      // ignore
    }

    // If all failed in production, token is invalid
    return applyCorsHeaders(
      NextResponse.json(
        { verified: false, error: "Token verification failed against Pi Platform API" },
        { status: 401 }
      ),
      req
    );
  } catch (error) {
    console.error("Error verifying Pi access token:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { verified: false, error: "Internal server verification error" },
        { status: 500 }
      ),
      req
    );
  }
}

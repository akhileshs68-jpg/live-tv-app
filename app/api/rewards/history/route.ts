import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyPiAccessToken } from "@/lib/pi-auth-verify";
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const verifiedUser = await verifyPiAccessToken(token, req);

  if (!verifiedUser) {
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing Pi Access Token" },
        { status: 401 }
      ),
      req
    );
  }

  const { uid: piUserId } = verifiedUser;

  try {
    const eventsSnap = await adminDb
      .collection("watch_events")
      .where("piUserId", "==", piUserId)
      .limit(15)
      .get();

    const history = eventsSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          channelId: data.channelId || "unknown",
          channelName: data.channelName || "Live Channel",
          watchSeconds: data.watchSeconds || 30,
          pointsAwarded: data.coinsAwarded || 2,
          timestamp: data.timestamp || Date.now(),
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        history,
      }),
      req
    );
  } catch (error) {
    console.error("Error fetching watch points history:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, history: [] },
        { status: 200 }
      ),
      req
    );
  }
}


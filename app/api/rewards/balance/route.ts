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

  const { uid: piUserId, username: piUsername } = verifiedUser;
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const userRef = adminDb.collection("users").doc(piUserId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      const newUser = {
        piUserId,
        piUsername,
        totalCoins: 0,
        lifetimeEarnings: 0,
        dailyCoinsEarned: 0,
        dailyResetDate: todayStr,
        lastHeartbeatAt: 0,
        updatedAt: new Date().toISOString(),
      };
      await userRef.set(newUser);
      return applyCorsHeaders(NextResponse.json({ success: true, ...newUser }), req);
    }

    const userData = userSnap.data() || {};
    let dailyCoinsEarned = userData.dailyCoinsEarned || 0;

    // Reset daily counter if date has changed
    if (userData.dailyResetDate !== todayStr) {
      dailyCoinsEarned = 0;
      await userRef.update({
        dailyCoinsEarned: 0,
        dailyResetDate: todayStr,
        updatedAt: new Date().toISOString(),
      });
    }

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        piUserId,
        piUsername: userData.piUsername || piUsername,
        totalCoins: userData.totalCoins || 0,
        lifetimeEarnings: userData.lifetimeEarnings || 0,
        dailyCoinsEarned,
        dailyResetDate: todayStr,
        lastHeartbeatAt: userData.lastHeartbeatAt || 0,
      }),
      req
    );
  } catch (error) {
    console.error("Error fetching balance from Firestore Admin DB:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: "Failed to retrieve balance from server database" },
        { status: 500 }
      ),
      req
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

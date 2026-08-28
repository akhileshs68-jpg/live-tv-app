import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyPiAccessToken } from "@/lib/pi-auth-verify";
import { WATCH_POINTS_UTILITIES } from "@/lib/products-catalog";
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function POST(req: NextRequest) {
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

  try {
    const body = await req.json();
    const { productId } = body;

    if (!productId || !WATCH_POINTS_UTILITIES[productId]) {
      return applyCorsHeaders(
        NextResponse.json(
          { success: false, error: "Invalid Watch Points utility item selected" },
          { status: 400 }
        ),
        req
      );
    }

    const utility = WATCH_POINTS_UTILITIES[productId];
    const pointsCost = utility.pointsCost;

    const userRef = adminDb.collection("users").doc(piUserId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return applyCorsHeaders(
        NextResponse.json(
          { success: false, error: "User account not found" },
          { status: 404 }
        ),
        req
      );
    }

    const userData = userSnap.data() || {};
    const currentCoins = userData.totalCoins || 0;

    if (currentCoins < pointsCost) {
      return applyCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: `Insufficient Watch Points balance. Required: ${pointsCost}, Available: ${currentCoins}`,
          },
          { status: 400 }
        ),
        req
      );
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const newCoins = currentCoins - pointsCost;

    let expiresAt: number | null = null;
    if (utility.durationHours) {
      expiresAt = now + utility.durationHours * 60 * 60 * 1000;
    } else if (utility.durationDays) {
      expiresAt = now + utility.durationDays * 24 * 60 * 60 * 1000;
    }

    const redemptionId = `rdm_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const entitlementId = `ent_${redemptionId}`;

    // Update user balance and premium/benefit flags in Firestore
    const userUpdates: Record<string, any> = {
      totalCoins: newCoins,
      updatedAt: nowIso,
    };

    if (utility.type === "premium_membership" || utility.type === "ad_free_pass") {
      let currentPremiumExpires = 0;
      if (userData.premium?.active && typeof userData.premium?.expiresAt === "number") {
        if (userData.premium.expiresAt > now) {
          currentPremiumExpires = userData.premium.expiresAt;
        }
      }

      const baseTime = currentPremiumExpires > now ? currentPremiumExpires : now;
      const durationMs = expiresAt ? expiresAt - now : 24 * 60 * 60 * 1000;
      const finalExpiresAt = baseTime + durationMs;

      userUpdates.premium = {
        active: true,
        plan: utility.type === "premium_membership" ? "premium" : userData.premium?.plan || "free",
        startedAt: nowIso,
        expiresAt: finalExpiresAt,
        source: "watch_points",
        updatedAt: nowIso,
      };
    } else if (utility.type === "hd_pass") {
      userUpdates.hdPass = {
        active: true,
        expiresAt: expiresAt || now + 7 * 24 * 60 * 60 * 1000,
        updatedAt: nowIso,
      };
    } else if (utility.type === "pioneer_badge") {
      userUpdates.supporterBadge = true;
    }

    await userRef.update(userUpdates);

    // Save redemption log
    await adminDb.collection("reward_redemptions").doc(redemptionId).set({
      redemptionId,
      piUserId,
      piUsername,
      productId,
      pointsCost,
      status: "completed",
      createdAt: nowIso,
      completedAt: nowIso,
      entitlementId,
    });

    // Save entitlement document
    await adminDb.collection("entitlements").doc(entitlementId).set({
      entitlementId,
      piUserId,
      type: utility.type,
      source: "watch_points",
      status: "active",
      startedAt: nowIso,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      redemptionId,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        redemptionId,
        productId,
        newTotalCoins: newCoins,
        message: `Successfully redeemed ${utility.name}!`,
        entitlement: {
          type: utility.type,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : "Lifetime",
        },
      }),
      req
    );
  } catch (error: any) {
    console.error("[Redeem Watch Points API] Error processing redemption:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: error?.message || "Failed to redeem Watch Points" },
        { status: 500 }
      ),
      req
    );
  }
}

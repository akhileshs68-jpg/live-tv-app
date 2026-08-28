import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyPiAccessToken } from "@/lib/pi-auth-verify";
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors";
import { verifyPiRC2OnChainSubscription } from "@/lib/pirc2-subscription-verifier";

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

  // Client-supplied piUserId is strictly ignored; derive from verified token only
  const piUserId = verifiedUser.uid;
  const now = Date.now();

  try {
    const userRef = adminDb.collection("users").doc(piUserId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return applyCorsHeaders(
        NextResponse.json({
          success: true,
          piUserId,
          premium: {
            active: false,
            plan: "free",
            expiresAt: null,
          },
        }),
        req
      );
    }

    const userData = userSnap.data() || {};
    const rawPremium = userData.premium || {};

    let active = Boolean(rawPremium.active);
    let plan: "free" | "premium" = rawPremium.plan === "premium" ? "premium" : "free";

    let expiresAt: number | null = null;
    if (typeof rawPremium.expiresAt === "number") {
      expiresAt = rawPremium.expiresAt;
    } else if (typeof rawPremium.expiresAt === "string") {
      const parsed = Date.parse(rawPremium.expiresAt);
      if (!isNaN(parsed)) {
        expiresAt = parsed;
      }
    }

    // Check if user has on-chain PiRC2 subscription record to re-verify
    const pirc2Sub = userData.pirc2Subscription;
    if (pirc2Sub?.txid) {
      try {
        const onChainState = await verifyPiRC2OnChainSubscription({
          txid: pirc2Sub.txid,
          subscriberAddress: pirc2Sub.subscriberAddress,
        });

        if (onChainState.isVerified && onChainState.isActive) {
          active = true;
          plan = "premium";
          if (onChainState.expiresAt) {
            expiresAt = onChainState.expiresAt;
          }
        }
      } catch (pirc2Err) {
        console.warn("[Premium API] PiRC2 verification notice:", pirc2Err);
      }
    }

    // Server-authoritative expiration evaluation
    if (active && expiresAt !== null && expiresAt <= now) {
      active = false;
      plan = "free";

      // Persist state update in Firestore
      try {
        await userRef.update({
          "premium.active": false,
          "premium.plan": "free",
          "premium.updatedAt": new Date().toISOString(),
        });
      } catch (updateErr) {
        console.warn("[Premium API] Error updating expired entitlement:", updateErr);
      }
    }

    const hdPass = userData.hdPass || {};
    const isHdActive = Boolean(active || (hdPass.active && hdPass.expiresAt && hdPass.expiresAt > now));
    const supporterBadge = Boolean(userData.supporterBadge || active);

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        piUserId,
        premium: {
          active,
          plan,
          expiresAt,
        },
        isAdFree: active,
        isHdEnabled: isHdActive,
        isSupporterBadge: supporterBadge,
      }),
      req
    );
  } catch (error) {
    console.error("[Premium API] Error reading entitlement status:", error);
    // Fail safely to Free
    return applyCorsHeaders(
      NextResponse.json(
        {
          success: false,
          error: "Failed to retrieve entitlement status from server database",
          premium: {
            active: false,
            plan: "free",
            expiresAt: null,
          },
        },
        { status: 500 }
      ),
      req
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}


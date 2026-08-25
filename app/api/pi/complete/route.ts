import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyPiAccessToken } from "@/lib/pi-auth-verify";
import { PRODUCTS_CATALOG } from "@/lib/products-catalog";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const verifiedUser = await verifyPiAccessToken(token);

  if (!verifiedUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or missing Pi Access Token" },
      { status: 401 }
    );
  }

  const { uid: piUserId, username: piUsername } = verifiedUser;

  try {
    const body = await req.json();
    const { paymentId, txid } = body;

    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid paymentId" },
        { status: 400 }
      );
    }

    const paymentRef = adminDb.collection("pi_payments").doc(paymentId);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Payment record not found" },
        { status: 404 }
      );
    }

    const paymentData = paymentSnap.data() || {};

    if (paymentData.piUserId && paymentData.piUserId !== piUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Payment ownership mismatch" },
        { status: 403 }
      );
    }

    // SERVER-AUTHORITATIVE IDEMPOTENCY CHECK
    // If transaction is already marked as completed, return existing entitlement without double-granting!
    if (paymentData.status === "completed") {
      const userSnap = await adminDb.collection("users").doc(piUserId).get();
      const userData = userSnap.data() || {};
      return NextResponse.json({
        success: true,
        paymentId,
        status: "completed",
        idempotent: true,
        message: "Payment already verified and completed previously.",
        premium: userData.premium || { active: true, plan: "premium" },
      });
    }

    // Official Pi Platform API Completion call
    const apiKey = process.env.PI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      try {
        const piCompleteRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
          method: "POST",
          headers: {
            Authorization: `Key ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ txid: txid || paymentData.txid }),
        });

        if (!piCompleteRes.ok) {
          const errText = await piCompleteRes.text();
          console.warn(`[Pi Complete API] Official Pi API returned status ${piCompleteRes.status}:`, errText);
        }
      } catch (piApiErr) {
        console.warn("[Pi Complete API] Official Pi Platform API connection error:", piApiErr);
      }
    } else {
      console.log(`[Pi Complete API] Notice: PI_API_KEY not configured. Processing completion for paymentId ${paymentId} in server database.`);
    }

    // Calculate entitlement duration
    const productId = paymentData.productId || "premium_30d";
    const product = PRODUCTS_CATALOG[productId] || PRODUCTS_CATALOG["premium_30d"];
    const durationDays = product.durationDays || 30;
    const durationMs = durationDays * 24 * 60 * 60 * 1000;

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    const userRef = adminDb.collection("users").doc(piUserId);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};

    let currentExpiresAt = 0;
    if (userData.premium && userData.premium.active && typeof userData.premium.expiresAt === "number") {
      if (userData.premium.expiresAt > now) {
        currentExpiresAt = userData.premium.expiresAt;
      }
    }

    // Base extension off existing expiration if active, or starting from now
    const newExpiresAt = (currentExpiresAt > now ? currentExpiresAt : now) + durationMs;

    const newPremiumState = {
      active: true,
      plan: "premium" as const,
      startedAt: nowIso,
      expiresAt: newExpiresAt,
      source: "pi_payment" as const,
      updatedAt: nowIso,
    };

    // Update payment record
    await paymentRef.update({
      status: "completed",
      txid: txid || paymentData.txid || null,
      completedAt: nowIso,
      updatedAt: nowIso,
    });

    // Update user document with premium status
    if (!userSnap.exists) {
      await userRef.set({
        piUserId,
        piUsername,
        totalCoins: 0,
        lifetimeEarnings: 0,
        dailyCoinsEarned: 0,
        premium: newPremiumState,
        updatedAt: nowIso,
      });
    } else {
      await userRef.update({
        premium: newPremiumState,
        updatedAt: nowIso,
      });
    }

    // Insert entitlement log
    const entitlementId = `ent_${paymentId}`;
    await adminDb.collection("entitlements").doc(entitlementId).set({
      entitlementId,
      piUserId,
      type: "premium_membership",
      source: "pi_payment",
      status: "active",
      startedAt: nowIso,
      expiresAt: new Date(newExpiresAt).toISOString(),
      paymentId,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return NextResponse.json({
      success: true,
      paymentId,
      status: "completed",
      message: `Premium granted for ${durationDays} days until ${new Date(newExpiresAt).toLocaleDateString()}`,
      premium: newPremiumState,
    });
  } catch (error: any) {
    console.error("[Pi Complete API] Error completing payment:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to complete payment" },
      { status: 500 }
    );
  }
}

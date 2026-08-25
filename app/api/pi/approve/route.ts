import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyPiAccessToken } from "@/lib/pi-auth-verify";
import { PRODUCTS_CATALOG } from "@/lib/products-catalog";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";

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

  const { uid: piUserId } = verifiedUser;

  try {
    const body = await req.json();
    const { paymentId, productId } = body;

    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid paymentId" },
        { status: 400 }
      );
    }

    const selectedProduct = productId ? PRODUCTS_CATALOG[productId] : PRODUCTS_CATALOG["premium_30d"];
    const productPrice = selectedProduct ? selectedProduct.pricePi : 15;
    const isSandbox = PI_NETWORK_CONFIG.SANDBOX ?? false;

    const paymentRef = adminDb.collection("pi_payments").doc(paymentId);
    const paymentSnap = await paymentRef.get();

    let existingData = paymentSnap.exists ? paymentSnap.data() : null;

    // Verify ownership if record exists
    if (existingData && existingData.piUserId && existingData.piUserId !== piUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Payment ownership mismatch" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    const networkType: "testnet" | "mainnet" = isSandbox ? "testnet" : "mainnet";

    const paymentRecord = {
      paymentId,
      piUserId,
      productId: productId || existingData?.productId || "premium_30d",
      amount: productPrice,
      currency: "Pi" as const,
      status: "approved" as const,
      network: networkType,
      createdAt: existingData?.createdAt || now,
      updatedAt: now,
    };

    // Save/Update record in Firestore pi_payments
    await paymentRef.set(paymentRecord, { merge: true });

    // Call Official Pi Platform API /approve endpoint if PI_API_KEY is configured
    const apiKey = process.env.PI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      try {
        const piApproveRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
          method: "POST",
          headers: {
            Authorization: `Key ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!piApproveRes.ok) {
          const errText = await piApproveRes.text();
          console.warn(`[Pi Approve API] Official Pi API returned status ${piApproveRes.status}:`, errText);
        }
      } catch (piApiErr) {
        console.warn("[Pi Approve API] Official Pi Platform API connection error:", piApiErr);
      }
    } else {
      console.log(`[Pi Approve API] Notice: PI_API_KEY not configured in environment. Approved paymentId ${paymentId} in local state machine.`);
    }

    return NextResponse.json({
      success: true,
      paymentId,
      status: "approved",
      message: "Payment approved by server",
    });
  } catch (error: any) {
    console.error("[Pi Approve API] Error approving payment:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to approve payment" },
      { status: 500 }
    );
  }
}

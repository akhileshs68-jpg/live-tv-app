import { NextRequest, NextResponse } from "next/server";
import { verifyPiAccessToken } from "@/lib/pi-auth-verify";
import { PRODUCTS_CATALOG } from "@/lib/products-catalog";
import { getTestnetSubscriptionPrice, TESTNET_PLAN_ID } from "@/lib/pricing-service";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const verifiedUser = await verifyPiAccessToken(token, req);

  if (!verifiedUser) {
    const unauthRes = NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or missing Pi Access Token" },
      { status: 401 }
    );
    return applyCorsHeaders(unauthRes, req);
  }

  const { uid: piUserId } = verifiedUser;

  try {
    const body = await req.json();
    const { productId } = body;

    if (!productId || !PRODUCTS_CATALOG[productId]) {
      const badReqRes = NextResponse.json(
        { success: false, error: "Invalid product selected from catalog" },
        { status: 400 }
      );
      return applyCorsHeaders(badReqRes, req);
    }

    const product = PRODUCTS_CATALOG[productId];
    const isSandbox = PI_NETWORK_CONFIG.SANDBOX ?? false;

    // Determine server-authoritative price
    let effectivePrice = product.pricePi;
    if (productId === TESTNET_PLAN_ID) {
      effectivePrice = await getTestnetSubscriptionPrice();
    }

    // Return the server-authoritative product details and metadata required for window.Pi.createPayment
    const res = NextResponse.json({
      success: true,
      product: {
        productId: product.productId,
        name: product.name,
        description: product.description,
        amount: effectivePrice,
        currency: "Pi",
      },
      paymentData: {
        amount: effectivePrice,
        memo: `${product.name} (PI LIVE TV)`,
        metadata: {
          productId: product.productId,
          piUserId,
          pricePi: effectivePrice,
          network: isSandbox ? "testnet" : "mainnet",
          createdAt: new Date().toISOString(),
        },
      },
    });
    return applyCorsHeaders(res, req);
  } catch (error: any) {
    console.error("[Create Payment API] Error creating payment spec:", error);
    const errRes = NextResponse.json(
      { success: false, error: error?.message || "Failed to prepare payment details" },
      { status: 500 }
    );
    return applyCorsHeaders(errRes, req);
  }
}

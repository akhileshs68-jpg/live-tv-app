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
    const { productId } = body;

    if (!productId || !PRODUCTS_CATALOG[productId]) {
      return NextResponse.json(
        { success: false, error: "Invalid product selected from catalog" },
        { status: 400 }
      );
    }

    const product = PRODUCTS_CATALOG[productId];
    const isSandbox = PI_NETWORK_CONFIG.SANDBOX ?? false;

    // Return the server-authoritative product details and metadata required for window.Pi.createPayment
    return NextResponse.json({
      success: true,
      product: {
        productId: product.productId,
        name: product.name,
        description: product.description,
        amount: product.pricePi,
        currency: "Pi",
      },
      paymentData: {
        amount: product.pricePi,
        memo: `${product.name} (PI LIVE TV)`,
        metadata: {
          productId: product.productId,
          piUserId,
          network: isSandbox ? "testnet" : "mainnet",
          createdAt: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error("[Create Payment API] Error creating payment spec:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to prepare payment details" },
      { status: 500 }
    );
  }
}

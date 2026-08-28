import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuthorization } from "@/lib/admin-auth";
import {
  getTestnetSubscriptionPrice,
  setTestnetSubscriptionPrice,
  TESTNET_PLAN_ID,
  DEFAULT_TESTNET_PRICE,
} from "@/lib/pricing-service";
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    const currentPrice = await getTestnetSubscriptionPrice();

    const res = NextResponse.json({
      success: true,
      planId: TESTNET_PLAN_ID,
      pricePi: currentPrice,
      defaultPrice: DEFAULT_TESTNET_PRICE,
      currency: "Test-Pi",
      billingDays: 30,
    });

    return applyCorsHeaders(res, req);
  } catch (error: any) {
    console.error("[AdminPricingAPI] Error fetching testnet pricing:", error);
    const errRes = NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to retrieve subscription pricing",
        planId: TESTNET_PLAN_ID,
        pricePi: DEFAULT_TESTNET_PRICE,
      },
      { status: 500 }
    );
    return applyCorsHeaders(errRes, req);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Server-authoritative Admin Authorization Verification
    const authResult = await verifyAdminAuthorization(req);
    if (!authResult.isAuthorized) {
      const unauthRes = NextResponse.json(
        {
          success: false,
          error: authResult.reason || "Unauthorized: Admin privileges required to modify subscription pricing.",
        },
        { status: 403 }
      );
      return applyCorsHeaders(unauthRes, req);
    }

    // 2. Parse request body
    const body = await req.json();
    const rawPrice = body.pricePi !== undefined ? body.pricePi : body.price;

    if (rawPrice === undefined || rawPrice === null || rawPrice === "") {
      const badReqRes = NextResponse.json(
        { success: false, error: "Missing required 'pricePi' parameter in request body." },
        { status: 400 }
      );
      return applyCorsHeaders(badReqRes, req);
    }

    const priceNum = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);

    // 3. Strict Server-Side Validation
    if (isNaN(priceNum) || !isFinite(priceNum)) {
      const badReqRes = NextResponse.json(
        { success: false, error: "Invalid price: Value must be a valid numeric decimal amount." },
        { status: 400 }
      );
      return applyCorsHeaders(badReqRes, req);
    }

    if (priceNum <= 0) {
      const badReqRes = NextResponse.json(
        { success: false, error: "Invalid price: Subscription price must be strictly greater than 0 Test-Pi." },
        { status: 400 }
      );
      return applyCorsHeaders(badReqRes, req);
    }

    if (priceNum > 10000) {
      const badReqRes = NextResponse.json(
        { success: false, error: "Invalid price: Price exceeds the maximum allowed limit of 10,000 Test-Pi." },
        { status: 400 }
      );
      return applyCorsHeaders(badReqRes, req);
    }

    // 4. Save new price to Firestore system_config
    const updatedBy = authResult.user?.username || authResult.user?.uid || "admin";
    const updateResult = await setTestnetSubscriptionPrice(priceNum, updatedBy);

    if (!updateResult.success) {
      const failRes = NextResponse.json(
        { success: false, error: updateResult.error || "Failed to save new price." },
        { status: 500 }
      );
      return applyCorsHeaders(failRes, req);
    }

    const successRes = NextResponse.json({
      success: true,
      message: `Live TV Premium Testnet monthly price successfully set to ${updateResult.pricePi} Test-Pi.`,
      planId: TESTNET_PLAN_ID,
      pricePi: updateResult.pricePi,
      updatedAt: updateResult.updatedAt,
    });

    return applyCorsHeaders(successRes, req);
  } catch (error: any) {
    console.error("[AdminPricingAPI] Error updating testnet pricing:", error);
    const errRes = NextResponse.json(
      { success: false, error: error?.message || "Internal server error updating pricing." },
      { status: 500 }
    );
    return applyCorsHeaders(errRes, req);
  }
}

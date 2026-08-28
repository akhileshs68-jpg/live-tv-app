import { NextRequest, NextResponse } from "next/server";
import { WATCH_POINTS_UTILITIES } from "@/lib/products-catalog";
import { getActiveProductsCatalog } from "@/lib/pricing-service";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function GET(req: NextRequest) {
  const dynamicProducts = await getActiveProductsCatalog();

  const res = NextResponse.json({
    success: true,
    sandbox: PI_NETWORK_CONFIG.SANDBOX ?? false,
    products: dynamicProducts,
    utilities: Object.values(WATCH_POINTS_UTILITIES),
  });
  return applyCorsHeaders(res, req);
}

import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS_CATALOG, WATCH_POINTS_UTILITIES } from "@/lib/products-catalog";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function GET(req: NextRequest) {
  const res = NextResponse.json({
    success: true,
    sandbox: PI_NETWORK_CONFIG.SANDBOX ?? false,
    products: Object.values(PRODUCTS_CATALOG),
    utilities: Object.values(WATCH_POINTS_UTILITIES),
  });
  return applyCorsHeaders(res, req);
}

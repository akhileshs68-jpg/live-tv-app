import { NextResponse } from "next/server";
import { PRODUCTS_CATALOG, WATCH_POINTS_UTILITIES } from "@/lib/products-catalog";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";

export async function GET() {
  return NextResponse.json({
    success: true,
    sandbox: PI_NETWORK_CONFIG.SANDBOX ?? false,
    products: Object.values(PRODUCTS_CATALOG),
    utilities: Object.values(WATCH_POINTS_UTILITIES),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuthorization } from "@/lib/admin-auth";
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAdminAuthorization(req);

    if (authResult.isAuthorized) {
      return applyCorsHeaders(
        NextResponse.json({
          success: true,
          isAdmin: true,
          user: authResult.user || null,
        }),
        req
      );
    }

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        isAdmin: false,
        reason: authResult.reason || "Unauthorized",
      }),
      req
    );
  } catch (error) {
    console.error("[AdminVerifyAPI] Error during admin verification:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, isAdmin: false, error: "Internal server error" },
        { status: 500 }
      ),
      req
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuthorization } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAdminAuthorization(req);

    if (authResult.isAuthorized) {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        user: authResult.user || null,
      });
    }

    return NextResponse.json({
      success: true,
      isAdmin: false,
      reason: authResult.reason || "Unauthorized",
    });
  } catch (error) {
    console.error("[AdminVerifyAPI] Error during admin verification:", error);
    return NextResponse.json(
      { success: false, isAdmin: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

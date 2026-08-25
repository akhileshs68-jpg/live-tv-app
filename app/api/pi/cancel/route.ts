import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyPiAccessToken } from "@/lib/pi-auth-verify";

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
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Missing paymentId" },
        { status: 400 }
      );
    }

    const paymentRef = adminDb.collection("pi_payments").doc(paymentId);
    const paymentSnap = await paymentRef.get();

    if (paymentSnap.exists) {
      const data = paymentSnap.data() || {};
      if (data.piUserId && data.piUserId !== piUserId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Payment ownership mismatch" },
          { status: 403 }
        );
      }

      if (data.status !== "completed") {
        await paymentRef.update({
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      paymentId,
      status: "cancelled",
    });
  } catch (error: any) {
    console.error("[Pi Cancel API] Error cancelling payment:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to cancel payment" },
      { status: 500 }
    );
  }
}

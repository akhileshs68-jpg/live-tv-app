import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyPiAccessToken } from "@/lib/pi-auth-verify";
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const verifiedUser = await verifyPiAccessToken(token, req);

  if (!verifiedUser) {
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing Pi Access Token" },
        { status: 401 }
      ),
      req
    );
  }

  const { uid: piUserId } = verifiedUser;
  const paymentId = req.nextUrl.searchParams.get("paymentId");

  try {
    if (paymentId) {
      const paymentSnap = await adminDb.collection("pi_payments").doc(paymentId).get();
      if (!paymentSnap.exists) {
        return applyCorsHeaders(
          NextResponse.json(
            { success: false, error: "Payment record not found" },
            { status: 404 }
          ),
          req
        );
      }

      const data = paymentSnap.data() || {};
      if (data.piUserId && data.piUserId !== piUserId) {
        return applyCorsHeaders(
          NextResponse.json(
            { success: false, error: "Forbidden: Payment ownership mismatch" },
            { status: 403 }
          ),
          req
        );
      }

      return applyCorsHeaders(
        NextResponse.json({
          success: true,
          payment: data,
        }),
        req
      );
    }

    // Fetch user's payment history
    const paymentsSnap = await adminDb
      .collection("pi_payments")
      .where("piUserId", "==", piUserId)
      .limit(20)
      .get();

    const payments = paymentsSnap.docs.map((doc) => doc.data());
    payments.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        payments,
      }),
      req
    );
  } catch (error: any) {
    console.error("[Payment Status API] Error retrieving payment status:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: error?.message || "Failed to retrieve payment status" },
        { status: 500 }
      ),
      req
    );
  }
}


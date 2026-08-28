import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyAdminAuthorization } from "@/lib/admin-auth";
import { applyCorsHeaders, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

const CONFIG_COLLECTION = "system_config";
const CHANNELS_ACCESS_DOC = "channel_access";

export async function GET(req: NextRequest) {
  try {
    const docRef = adminDb.collection(CONFIG_COLLECTION).doc(CHANNELS_ACCESS_DOC);
    const snap = await docRef.get();

    let overrides: Record<string, 'FREE' | 'PREMIUM' | 'DISABLED'> = {};
    if (snap.exists) {
      const data = snap.data();
      if (data && data.overrides && typeof data.overrides === 'object') {
        overrides = data.overrides;
      }
    }

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        overrides,
        defaultStatus: 'FREE',
        totalOverrides: Object.keys(overrides).length,
      }),
      req
    );
  } catch (error: any) {
    console.warn("[Admin Channels API] Notice fetching channel access overrides:", error);
    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        overrides: {},
        defaultStatus: 'FREE',
        totalOverrides: 0,
      }),
      req
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuthorization(req);
  if (!auth.isAuthorized) {
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: auth.reason || "Unauthorized: Admin privileges required." },
        { status: 401 }
      ),
      req
    );
  }

  try {
    const body = await req.json();
    const { channelId, status, batch } = body;

    const docRef = adminDb.collection(CONFIG_COLLECTION).doc(CHANNELS_ACCESS_DOC);
    const snap = await docRef.get();
    let currentOverrides: Record<string, string> = {};
    if (snap.exists) {
      const data = snap.data();
      if (data && data.overrides) {
        currentOverrides = { ...data.overrides };
      }
    }

    if (batch && typeof batch === 'object') {
      for (const [chId, st] of Object.entries(batch)) {
        if (['FREE', 'PREMIUM', 'DISABLED'].includes(st as string)) {
          currentOverrides[chId] = st as string;
        }
      }
    } else if (channelId && status) {
      if (!['FREE', 'PREMIUM', 'DISABLED'].includes(status)) {
        return applyCorsHeaders(
          NextResponse.json(
            { success: false, error: "Invalid status: Must be FREE, PREMIUM, or DISABLED." },
            { status: 400 }
          ),
          req
        );
      }
      currentOverrides[channelId] = status;
    } else {
      return applyCorsHeaders(
        NextResponse.json(
          { success: false, error: "Invalid payload: Provide channelId and status or batch object." },
          { status: 400 }
        ),
        req
      );
    }

    await docRef.set(
      {
        overrides: currentOverrides,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.user?.uid || 'admin',
      },
      { merge: true }
    );

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        message: "Channel access permissions updated successfully.",
        overrides: currentOverrides,
      }),
      req
    );
  } catch (error: any) {
    console.error("[Admin Channels API] Error updating channel access:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: error?.message || "Failed to update channel access." },
        { status: 500 }
      ),
      req
    );
  }
}


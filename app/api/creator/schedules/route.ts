import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyPiAccessToken } from "@/lib/pi-auth-verify";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const verifiedUser = await verifyPiAccessToken(token);
  if (!verifiedUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or missing Pi Access Token" },
      { status: 401 }
    );
  }

  const piUserId = verifiedUser.uid;

  try {
    const snapshot = await adminDb
      .collection("channel_schedules")
      .where("ownerPiUserId", "==", piUserId)
      .get();

    const schedules = snapshot.docs.map((doc) => doc.data());

    return NextResponse.json({
      success: true,
      schedules,
    });
  } catch (error) {
    console.error("[Creator Schedules API] Error listing schedules:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load channel programming schedule" },
      { status: 500 }
    );
  }
}

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

  const ownerPiUserId = verifiedUser.uid;

  try {
    const body = await req.json();
    const now = new Date().toISOString();

    const scheduleId = body.scheduleId?.trim() || `sch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channelId = `ch_${ownerPiUserId}`;
    const videoId = body.videoId?.trim();
    const startAt = body.startAt?.trim() || now;
    const endAt = body.endAt?.trim() || new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const status = ["scheduled", "active", "completed", "cancelled"].includes(body.status) ? body.status : "scheduled";

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "Missing required videoId for schedule slot" },
        { status: 400 }
      );
    }

    const scheduleRef = adminDb.collection("channel_schedules").doc(scheduleId);
    const existingSnap = await scheduleRef.get();

    if (existingSnap.exists && existingSnap.data()?.ownerPiUserId !== ownerPiUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not own this schedule slot" },
        { status: 403 }
      );
    }

    const scheduleData = {
      scheduleId,
      ownerPiUserId,
      channelId,
      videoId,
      startAt,
      endAt,
      status,
      updatedAt: now,
      createdAt: existingSnap.exists ? existingSnap.data()?.createdAt || now : now,
    };

    await scheduleRef.set(scheduleData, { merge: true });

    return NextResponse.json({
      success: true,
      schedule: scheduleData,
    });
  } catch (error) {
    console.error("[Creator Schedules API] Error saving schedule slot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save channel schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const verifiedUser = await verifyPiAccessToken(token);
  if (!verifiedUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or missing Pi Access Token" },
      { status: 401 }
    );
  }

  const ownerPiUserId = verifiedUser.uid;
  const { searchParams } = new URL(req.url);
  const scheduleId = searchParams.get("scheduleId");

  if (!scheduleId) {
    return NextResponse.json(
      { success: false, error: "Missing scheduleId parameter" },
      { status: 400 }
    );
  }

  try {
    const scheduleRef = adminDb.collection("channel_schedules").doc(scheduleId);
    const snap = await scheduleRef.get();

    if (!snap.exists) {
      return NextResponse.json({ success: true, message: "Schedule slot already deleted" });
    }

    if (snap.data()?.ownerPiUserId !== ownerPiUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not own this schedule slot" },
        { status: 403 }
      );
    }

    await scheduleRef.delete();

    return NextResponse.json({
      success: true,
      message: "Schedule slot deleted successfully",
    });
  } catch (error) {
    console.error("[Creator Schedules API] Error deleting schedule slot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete schedule slot" },
      { status: 500 }
    );
  }
}

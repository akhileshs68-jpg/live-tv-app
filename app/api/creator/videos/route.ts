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

  const piUserId = verifiedUser.uid;

  try {
    const snapshot = await adminDb
      .collection("creator_videos")
      .where("ownerPiUserId", "==", piUserId)
      .get();

    const videos = snapshot.docs.map((doc) => doc.data());

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        videos,
      }),
      req
    );
  } catch (error) {
    console.error("[Creator Videos API] Error listing videos:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: "Failed to load creator videos" },
        { status: 500 }
      ),
      req
    );
  }
}

export async function POST(req: NextRequest) {
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

  const ownerPiUserId = verifiedUser.uid;

  try {
    const body = await req.json();
    const now = new Date().toISOString();

    const videoId = body.videoId?.trim() || `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channelId = `ch_${ownerPiUserId}`;
    const title = body.title?.trim() || "Untitled Video";
    const description = body.description?.trim() || "";
    const videoUrl = body.videoUrl?.trim() || "";
    const thumbnailUrl = body.thumbnailUrl?.trim() || "";
    const duration = typeof body.duration === "number" ? Math.max(0, body.duration) : 0;
    const contentType = ["VOD", "SCHEDULED", "LIVE"].includes(body.contentType) ? body.contentType : "VOD";
    const visibility = ["public", "unlisted", "private", "premium"].includes(body.visibility) ? body.visibility : "public";
    const status = ["ready", "processing", "draft", "failed"].includes(body.status) ? body.status : "ready";

    const videoRef = adminDb.collection("creator_videos").doc(videoId);
    const existingSnap = await videoRef.get();

    // Verify ownership if updating an existing video
    if (existingSnap.exists && existingSnap.data()?.ownerPiUserId !== ownerPiUserId) {
      return applyCorsHeaders(
        NextResponse.json(
          { success: false, error: "Forbidden: You do not own this video" },
          { status: 403 }
        ),
        req
      );
    }

    const videoData = {
      videoId,
      ownerPiUserId,
      channelId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      contentType,
      visibility,
      status,
      updatedAt: now,
      createdAt: existingSnap.exists ? existingSnap.data()?.createdAt || now : now,
    };

    await videoRef.set(videoData, { merge: true });

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        video: videoData,
      }),
      req
    );
  } catch (error) {
    console.error("[Creator Videos API] Error saving video:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: "Failed to save video metadata" },
        { status: 500 }
      ),
      req
    );
  }
}

export async function DELETE(req: NextRequest) {
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

  const ownerPiUserId = verifiedUser.uid;
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: "Missing videoId parameter" },
        { status: 400 }
      ),
      req
    );
  }

  try {
    const videoRef = adminDb.collection("creator_videos").doc(videoId);
    const snap = await videoRef.get();

    if (!snap.exists) {
      return applyCorsHeaders(
        NextResponse.json({ success: true, message: "Video already deleted" }),
        req
      );
    }

    if (snap.data()?.ownerPiUserId !== ownerPiUserId) {
      return applyCorsHeaders(
        NextResponse.json(
          { success: false, error: "Forbidden: You do not own this video" },
          { status: 403 }
        ),
        req
      );
    }

    await videoRef.delete();

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        message: "Video deleted successfully",
      }),
      req
    );
  } catch (error) {
    console.error("[Creator Videos API] Error deleting video:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: "Failed to delete video" },
        { status: 500 }
      ),
      req
    );
  }
}


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
      .collection("creator_playlists")
      .where("ownerPiUserId", "==", piUserId)
      .get();

    const playlists = snapshot.docs.map((doc) => doc.data());

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        playlists,
      }),
      req
    );
  } catch (error) {
    console.error("[Creator Playlists API] Error listing playlists:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: "Failed to load creator playlists" },
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

    const playlistId = body.playlistId?.trim() || `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channelId = `ch_${ownerPiUserId}`;
    const title = body.title?.trim() || "Untitled Playlist";
    const description = body.description?.trim() || "";
    const videoIds = Array.isArray(body.videoIds) ? body.videoIds.filter((id: unknown): id is string => typeof id === "string") : [];
    const visibility = ["public", "unlisted", "private", "premium"].includes(body.visibility) ? body.visibility : "public";

    const playlistRef = adminDb.collection("creator_playlists").doc(playlistId);
    const existingSnap = await playlistRef.get();

    if (existingSnap.exists && existingSnap.data()?.ownerPiUserId !== ownerPiUserId) {
      return applyCorsHeaders(
        NextResponse.json(
          { success: false, error: "Forbidden: You do not own this playlist" },
          { status: 403 }
        ),
        req
      );
    }

    const playlistData = {
      playlistId,
      ownerPiUserId,
      channelId,
      title,
      description,
      videoIds,
      visibility,
      updatedAt: now,
      createdAt: existingSnap.exists ? existingSnap.data()?.createdAt || now : now,
    };

    await playlistRef.set(playlistData, { merge: true });

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        playlist: playlistData,
      }),
      req
    );
  } catch (error) {
    console.error("[Creator Playlists API] Error saving playlist:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: "Failed to save playlist metadata" },
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
  const playlistId = searchParams.get("playlistId");

  if (!playlistId) {
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: "Missing playlistId parameter" },
        { status: 400 }
      ),
      req
    );
  }

  try {
    const playlistRef = adminDb.collection("creator_playlists").doc(playlistId);
    const snap = await playlistRef.get();

    if (!snap.exists) {
      return applyCorsHeaders(
        NextResponse.json({ success: true, message: "Playlist already deleted" }),
        req
      );
    }

    if (snap.data()?.ownerPiUserId !== ownerPiUserId) {
      return applyCorsHeaders(
        NextResponse.json(
          { success: false, error: "Forbidden: You do not own this playlist" },
          { status: 403 }
        ),
        req
      );
    }

    await playlistRef.delete();

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        message: "Playlist deleted successfully",
      }),
      req
    );
  } catch (error) {
    console.error("[Creator Playlists API] Error deleting playlist:", error);
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, error: "Failed to delete playlist" },
        { status: 500 }
      ),
      req
    );
  }
}


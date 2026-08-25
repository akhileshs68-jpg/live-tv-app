import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const resolvedParams = await params;
  const channelId = resolvedParams.channelId;

  if (!channelId) {
    return NextResponse.json(
      { success: false, error: "Channel ID required" },
      { status: 400 }
    );
  }

  try {
    const channelRef = adminDb.collection("creator_channels").doc(channelId);
    const channelSnap = await channelRef.get();

    if (!channelSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Channel not found" },
        { status: 404 }
      );
    }

    const channelData = channelSnap.data();
    const ownerPiUserId = channelData?.ownerPiUserId;

    // Fetch Creator Profile
    let creatorProfile = null;
    if (ownerPiUserId) {
      const creatorSnap = await adminDb.collection("creators").doc(ownerPiUserId).get();
      if (creatorSnap.exists) {
        creatorProfile = creatorSnap.data();
      }
    }

    // Fetch Public Videos
    const videosSnap = await adminDb
      .collection("creator_videos")
      .where("channelId", "==", channelId)
      .where("visibility", "==", "public")
      .get();
    const videos = videosSnap.docs.map((doc) => doc.data());

    // Fetch Public Playlists
    const playlistsSnap = await adminDb
      .collection("creator_playlists")
      .where("channelId", "==", channelId)
      .where("visibility", "==", "public")
      .get();
    const playlists = playlistsSnap.docs.map((doc) => doc.data());

    // Fetch Channel Schedule
    const scheduleSnap = await adminDb
      .collection("channel_schedules")
      .where("channelId", "==", channelId)
      .get();
    const schedules = scheduleSnap.docs.map((doc) => doc.data());

    return NextResponse.json({
      success: true,
      channel: channelData,
      creator: creatorProfile,
      videos,
      playlists,
      schedules,
    });
  } catch (error) {
    console.error("[Public Channel API] Error fetching channel:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load channel data" },
      { status: 500 }
    );
  }
}

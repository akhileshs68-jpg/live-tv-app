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
    const creatorRef = adminDb.collection("creators").doc(piUserId);
    const creatorSnap = await creatorRef.get();

    const channelId = `ch_${piUserId}`;
    const channelRef = adminDb.collection("creator_channels").doc(channelId);
    const channelSnap = await channelRef.get();

    return NextResponse.json({
      success: true,
      profile: creatorSnap.exists ? creatorSnap.data() : null,
      channel: channelSnap.exists ? channelSnap.data() : null,
    });
  } catch (error) {
    console.error("[Creator Profile API] Error reading profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read creator profile" },
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

  // Derive owner identity strictly from server-verified token
  const piUserId = verifiedUser.uid;
  const username = verifiedUser.username;

  try {
    const body = await req.json();
    const now = new Date().toISOString();

    const displayName = body.displayName?.trim() || username || `Pioneer Creator`;
    const channelName = body.channelName?.trim() || `${displayName}'s Channel`;
    const description = body.description?.trim() || "";
    const logoUrl = body.logoUrl?.trim() || "";
    const bannerUrl = body.bannerUrl?.trim() || "";
    const category = body.category?.trim() || "Entertainment";
    const language = body.language?.trim() || "English";
    const country = body.country?.trim() || "Global";

    const creatorRef = adminDb.collection("creators").doc(piUserId);
    const channelId = `ch_${piUserId}`;
    const channelRef = adminDb.collection("creator_channels").doc(channelId);

    const profileData = {
      piUserId,
      username,
      displayName,
      channelName,
      description,
      logoUrl,
      bannerUrl,
      status: "active",
      updatedAt: now,
    };

    const channelData = {
      channelId,
      ownerPiUserId: piUserId,
      name: channelName,
      description,
      logoUrl,
      bannerUrl,
      category,
      language,
      country,
      status: "active",
      visibility: "public",
      updatedAt: now,
    };

    // Use transaction/batch for atomic upsert
    const batch = adminDb.batch();
    batch.set(creatorRef, { ...profileData, createdAt: now }, { merge: true });
    batch.set(channelRef, { ...channelData, createdAt: now }, { merge: true });

    await batch.commit();

    return NextResponse.json({
      success: true,
      profile: profileData,
      channel: channelData,
    });
  } catch (error) {
    console.error("[Creator Profile API] Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update creator profile" },
      { status: 500 }
    );
  }
}

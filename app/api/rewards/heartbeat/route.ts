import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyPiAccessToken } from "@/lib/pi-auth-verify";

const REWARD_PER_INTERVAL = 2; // Fixed +2 Watch Points per 30 verified seconds
const MIN_ANTI_SPAM_INTERVAL_MS = 20000; // 20s anti-spam window
const VERIFIED_WATCH_DURATION_MS = 28000; // 28s tolerance window accounts for standard browser timer jitter while requiring full 30s verified watch interval
const DAILY_CAP_COINS = 500; // Maximum Watch Points per day

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate & Verify Pi Access Token from Authorization Header
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    const verifiedUser = await verifyPiAccessToken(token, req);

    if (!verifiedUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing Pi Access Token" },
        { status: 401 }
      );
    }

    const { uid: piUserId, username: piUsername } = verifiedUser;

    // Optional metadata from body (for audit logs only, NEVER trusted for reward calculation)
    const body = await req.json().catch(() => ({}));
    const channelId = typeof body.channelId === "string" ? body.channelId : "unknown";
    const channelName = typeof body.channelName === "string" ? body.channelName : "Live Stream";

    const now = Date.now();
    const todayStr = new Date().toISOString().split("T")[0];
    const userRef = adminDb.collection("users").doc(piUserId);

    let coinsAwarded = 0;
    let updatedTotalCoins = 0;
    let updatedLifetimeEarnings = 0;
    let updatedDailyCoinsEarned = 0;
    let statusMessage = "Watch Points transaction evaluated";

    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      let totalCoins = 0;
      let lifetimeEarnings = 0;
      let dailyCoinsEarned = 0;
      let lastHeartbeatAt = 0;

      if (!userDoc.exists) {
        totalCoins = 0;
        lifetimeEarnings = 0;
        dailyCoinsEarned = 0;
        lastHeartbeatAt = 0;
      } else {
        const data = userDoc.data() || {};
        totalCoins = data.totalCoins || 0;
        lifetimeEarnings = data.lifetimeEarnings || 0;
        dailyCoinsEarned = data.dailyResetDate === todayStr ? data.dailyCoinsEarned || 0 : 0;
        lastHeartbeatAt = data.lastHeartbeatAt || 0;
      }

      // Initial Stream Playback Ping (lastHeartbeatAt === 0)
      if (lastHeartbeatAt === 0) {
        coinsAwarded = 0;
        updatedTotalCoins = totalCoins;
        updatedLifetimeEarnings = lifetimeEarnings;
        updatedDailyCoinsEarned = dailyCoinsEarned;
        statusMessage = "Playback session initialized";

        transaction.set(
          userRef,
          {
            piUserId,
            piUsername,
            totalCoins,
            lifetimeEarnings,
            dailyCoinsEarned,
            dailyResetDate: todayStr,
            lastHeartbeatAt: now,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        return;
      }

      const elapsedMs = now - lastHeartbeatAt;

      // Rule 1: Anti-Spam Window Check (< 20s)
      if (elapsedMs < MIN_ANTI_SPAM_INTERVAL_MS) {
        coinsAwarded = 0;
        updatedTotalCoins = totalCoins;
        updatedLifetimeEarnings = lifetimeEarnings;
        updatedDailyCoinsEarned = dailyCoinsEarned;
        statusMessage = "Heartbeat rate limited: minimum 20s interval required";
        return;
      }

      // Rule 2: Verified Watch Duration Check (< 30s)
      if (elapsedMs < VERIFIED_WATCH_DURATION_MS) {
        coinsAwarded = 0;
        updatedTotalCoins = totalCoins;
        updatedLifetimeEarnings = lifetimeEarnings;
        updatedDailyCoinsEarned = dailyCoinsEarned;
        statusMessage = "Insufficient watch duration: exactly 30 verified seconds required";
        return;
      }

      // Rule 3: Daily Cap Check (500 coins/day)
      if (dailyCoinsEarned >= DAILY_CAP_COINS) {
        coinsAwarded = 0;
        updatedTotalCoins = totalCoins;
        updatedLifetimeEarnings = lifetimeEarnings;
        updatedDailyCoinsEarned = dailyCoinsEarned;
        statusMessage = "Daily Watch Points cap reached (500 max/day)";
      } else {
        const remainingCap = DAILY_CAP_COINS - dailyCoinsEarned;
        coinsAwarded = Math.min(REWARD_PER_INTERVAL, remainingCap);

        updatedTotalCoins = totalCoins + coinsAwarded;
        updatedLifetimeEarnings = lifetimeEarnings + coinsAwarded;
        updatedDailyCoinsEarned = dailyCoinsEarned + coinsAwarded;
        statusMessage = `Successfully awarded +${coinsAwarded} Watch Points`;
      }

      transaction.set(
        userRef,
        {
          piUserId,
          piUsername,
          totalCoins: updatedTotalCoins,
          lifetimeEarnings: updatedLifetimeEarnings,
          dailyCoinsEarned: updatedDailyCoinsEarned,
          dailyResetDate: todayStr,
          lastHeartbeatAt: coinsAwarded > 0 ? now : lastHeartbeatAt,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });

    // 2. Write audit log entry and update aggregate channel analytics if points were awarded
    if (coinsAwarded > 0) {
      try {
        await Promise.allSettled([
          adminDb.collection("watch_events").add({
            eventId: `evt_${now}_${Math.random().toString(36).substring(2, 7)}`,
            piUserId,
            channelId,
            channelName,
            watchSeconds: 30, // Fixed 30 verified seconds
            coinsAwarded,
            timestamp: now,
          }),
          // Maintain aggregate channel analytics
          adminDb.collection("channel_analytics").doc(channelId).set(
            {
              channelId,
              channelName,
              totalWatchSeconds: (await adminDb.collection("channel_analytics").doc(channelId).get()).data()?.totalWatchSeconds
                ? ((await adminDb.collection("channel_analytics").doc(channelId).get()).data()?.totalWatchSeconds || 0) + 30
                : 30,
              totalViews: (await adminDb.collection("channel_analytics").doc(channelId).get()).data()?.totalViews
                ? ((await adminDb.collection("channel_analytics").doc(channelId).get()).data()?.totalViews || 0) + 1
                : 1,
              lastWatchedAt: now,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          ),
        ]);
      } catch (logErr) {
        console.warn("Audit log / analytics write notice:", logErr);
      }
    }

    return NextResponse.json({
      success: true,
      coinsAwarded,
      totalCoins: updatedTotalCoins,
      lifetimeEarnings: updatedLifetimeEarnings,
      dailyCoinsEarned: updatedDailyCoinsEarned,
      message: statusMessage,
    });
  } catch (error) {
    console.error("Error processing server reward heartbeat:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record Watch Points heartbeat" },
      { status: 500 }
    );
  }
}

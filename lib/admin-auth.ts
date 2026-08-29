import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyPiAccessToken, type VerifiedPiUser } from "@/lib/pi-auth-verify";

/**
 * Server-Authoritative Admin/Owner Verifier
 * Verifies if the incoming request originates from the authorized Owner Pi account.
 * Strictly rejects guest tokens, preview tokens, email logins, and unauthorized Pioneers.
 */
export async function verifyAdminAuthorization(
  req: NextRequest | Request
): Promise<{ isAuthorized: boolean; user?: VerifiedPiUser | null; reason?: string }> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  // 1. Check server-to-server secret or administrative key
  const adminSecretHeader = req.headers.get("X-Admin-Secret");
  const expectedSecret = process.env.ADMIN_SECRET_KEY || process.env.PI_API_KEY;

  if (expectedSecret && adminSecretHeader && adminSecretHeader === expectedSecret) {
    return {
      isAuthorized: true,
      user: { uid: "system_admin_secret", username: "SystemOwner" },
    };
  }

  // 2. Strictly reject missing, empty, or guest/preview tokens
  if (!token || token === "dev_preview_token" || token.startsWith("dev_preview_")) {
    return { isAuthorized: false, reason: "Unauthorized: Verified Pi Pioneer credentials required." };
  }

  // 3. Verify Pioneer token against Pi Platform API
  const verifiedUser = await verifyPiAccessToken(token, req);
  if (!verifiedUser) {
    return { isAuthorized: false, reason: "Invalid or expired Pi token" };
  }

  // Strictly reject any dev preview user identifiers
  if (verifiedUser.uid === "dev_preview_uid_123" || verifiedUser.username === "Dev_Pioneer_Preview") {
    return { isAuthorized: false, reason: "Unauthorized: Guest preview mode cannot access Admin." };
  }

  const rawUsername = (verifiedUser.username || "").toLowerCase().trim();
  const usernameLower = rawUsername.replace(/^@/, "");
  const uid = verifiedUser.uid;

  // 4. Authorized owner Pi usernames (akhileshs68) + environment overrides
  const envAdminUsernames = (process.env.ADMIN_USERNAMES || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim().replace(/^@/, ""))
    .filter(Boolean);

  const isOwnerUsername =
    usernameLower === "akhileshs68" ||
    usernameLower === "akhilesh68" ||
    envAdminUsernames.includes(usernameLower) ||
    envAdminUsernames.includes(rawUsername);

  if (isOwnerUsername) {
    // Bind ONLY this verified Pi UID into Firestore admin document dynamically
    if (uid && uid !== "dev_preview_uid_123") {
      try {
        await adminDb.collection("admins").doc(uid).set(
          {
            uid,
            username: verifiedUser.username,
            role: "admin",
            isOwner: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn("[AdminAuth] Firestore admin UID binding notice:", err);
      }
    }
    return { isAuthorized: true, user: verifiedUser };
  }

  // 5. Check if this verified Pi UID was previously verified and bound to Firestore admins collection
  try {
    const adminDoc = await adminDb.collection("admins").doc(uid).get();
    if (adminDoc.exists) {
      const data = adminDoc.data();
      if (
        data?.role === "admin" ||
        data?.isOwner === true ||
        data?.username?.toLowerCase() === "akhileshs68"
      ) {
        return { isAuthorized: true, user: verifiedUser };
      }
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (userDoc.exists) {
      const uData = userDoc.data();
      if (
        (uData?.role === "admin" || uData?.role === "owner" || uData?.isOwner === true) &&
        (uData?.username?.toLowerCase() === "akhileshs68" || adminDoc.exists)
      ) {
        return { isAuthorized: true, user: verifiedUser };
      }
    }
  } catch (err) {
    console.warn("[AdminAuth] Firestore role check notice:", err);
  }

  return { isAuthorized: false, reason: "User does not have admin/owner privileges" };
}

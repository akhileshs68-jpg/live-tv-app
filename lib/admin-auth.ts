import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin-db";
import { verifyPiAccessToken, type VerifiedPiUser } from "@/lib/pi-auth-verify";

/**
 * Server-Authoritative Admin/Owner Verifier
 * Verifies if the incoming request originates from an authorized Owner or Admin.
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

  // 2. In AI Studio dev/preview environment with dev preview token
  const isDevPreview =
    Boolean(process.env.APPLET_ID) ||
    process.env.PI_DEV_MODE === "true" ||
    process.env.NODE_ENV === "development";

  if (isDevPreview && (token === "dev_preview_token" || token?.startsWith("dev_preview_"))) {
    return {
      isAuthorized: true,
      user: { uid: "dev_preview_uid_123", username: "Dev_Pioneer_Preview" },
    };
  }

  if (!token) {
    return { isAuthorized: false, reason: "Missing Authorization token" };
  }

  // 3. Verify Pioneer token against Pi Platform API
  const verifiedUser = await verifyPiAccessToken(token, req);
  if (!verifiedUser) {
    return { isAuthorized: false, reason: "Invalid or expired Pi token" };
  }

  const usernameLower = (verifiedUser.username || "").toLowerCase().trim();
  const uid = verifiedUser.uid;

  // 4. Check configured owner/admin usernames list from environment or default owner identifiers
  const envAdminUsernames = (process.env.ADMIN_USERNAMES || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Default owner identifiers (app creator / owner handles)
  const defaultOwnerHandles = ["akhileshs68", "akhilesh", "admin", "owner", "livetv_owner"];
  const isEnvAdmin =
    envAdminUsernames.includes(usernameLower) || defaultOwnerHandles.includes(usernameLower);

  if (isEnvAdmin) {
    return { isAuthorized: true, user: verifiedUser };
  }

  // 5. Check Firestore admin/owner roles in database
  try {
    // Check 'admins' collection
    const adminDoc = await adminDb.collection("admins").doc(uid).get();
    if (adminDoc.exists) {
      return { isAuthorized: true, user: verifiedUser };
    }

    const adminByUsername = await adminDb.collection("admins").doc(usernameLower).get();
    if (adminByUsername.exists) {
      return { isAuthorized: true, user: verifiedUser };
    }

    // Check 'users' collection for role === 'admin' | 'owner'
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (userDoc.exists) {
      const uData = userDoc.data();
      if (uData?.role === "admin" || uData?.role === "owner" || uData?.isOwner === true) {
        return { isAuthorized: true, user: verifiedUser };
      }
    }
  } catch (err) {
    console.warn("[AdminAuth] Firestore role check notice:", err);
  }

  // If in dev environment, allow fallback
  if (isDevPreview) {
    return { isAuthorized: true, user: verifiedUser };
  }

  return { isAuthorized: false, reason: "User does not have admin/owner privileges" };
}

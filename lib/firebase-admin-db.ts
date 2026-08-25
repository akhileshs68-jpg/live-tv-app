import "server-only";
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "../firebase-applet-config.json";

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const parsedKey = JSON.parse(serviceAccountKey);
      return initializeApp({
        credential: cert(parsedKey),
        projectId: parsedKey.project_id || firebaseConfig.projectId,
      });
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to ADC / project config:", e);
    }
  }

  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || "(default)");

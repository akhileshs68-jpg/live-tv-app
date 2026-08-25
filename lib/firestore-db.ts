import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore, doc, getDoc, setDoc, updateDoc, runTransaction, collection, addDoc } from "firebase/firestore"
import firebaseConfig from "../firebase-applet-config.json"

const config = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
}

// Initialize Firebase App (singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(config)

// Initialize Firestore targeting the provisioned custom database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)")

export { doc, getDoc, setDoc, updateDoc, runTransaction, collection, addDoc }

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function mirrorTrafficEvent(event: any) {
  try {
    if (!firebaseConfig.apiKey) return;
    await addDoc(collection(db, "traffic_events"), {
      ...event,
      mirroredAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error mirroring traffic event to Firebase:", error);
  }
}

export async function mirrorAlert(alert: any) {
  try {
    if (!firebaseConfig.apiKey) return;
    await addDoc(collection(db, "alerts"), {
      ...alert,
      mirroredAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error mirroring alert to Firebase:", error);
  }
}

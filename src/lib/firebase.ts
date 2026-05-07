import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigFallback from '../../firebase-applet-config.json';

const isProvided = (val: any) => val && val !== 'undefined' && val !== 'null' && val !== '';

const firebaseConfig = {
  projectId: isProvided(import.meta.env.VITE_FIREBASE_PROJECT_ID) ? import.meta.env.VITE_FIREBASE_PROJECT_ID : firebaseConfigFallback.projectId,
  appId: isProvided(import.meta.env.VITE_FIREBASE_APP_ID) ? import.meta.env.VITE_FIREBASE_APP_ID : firebaseConfigFallback.appId,
  apiKey: isProvided(import.meta.env.VITE_FIREBASE_API_KEY) ? import.meta.env.VITE_FIREBASE_API_KEY : firebaseConfigFallback.apiKey,
  authDomain: isProvided(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : firebaseConfigFallback.authDomain,
  storageBucket: isProvided(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : firebaseConfigFallback.storageBucket,
  messagingSenderId: isProvided(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : firebaseConfigFallback.messagingSenderId,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, isProvided(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID) ? import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID : firebaseConfigFallback.firestoreDatabaseId);
export const storage = getStorage(app);
export const auth = getAuth();

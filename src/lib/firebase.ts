import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
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

// Use initializeFirestore with long polling to help with connection issues in restricted environments
const databaseId = isProvided(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID) 
  ? import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID 
  : firebaseConfigFallback.firestoreDatabaseId;

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

export const storage = getStorage(app);
export const auth = getAuth();

// Test connection on boot as per guidelines
async function testConnection() {
  try {
    // Only run test if we are in a browser environment
    if (typeof window !== 'undefined') {
      await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firestore initially reported offline. This is common in some preview environments and may resolve as the app loads.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // Extract error message string
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check if it's an offline error
  const isOffline = 
    errorMessage.toLowerCase().includes('offline') || 
    errorMessage.toLowerCase().includes('client is offline') ||
    errorMessage.toLowerCase().includes('network-error') ||
    errorMessage.toLowerCase().includes('could not connect');

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }

  if (isOffline) {
    console.warn(`[Firestore Offline] ${operationType} on ${path}: ${errorMessage}`);
    return; // Don't throw for offline errors
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

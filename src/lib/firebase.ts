import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  orderBy,
  limit,
  Timestamp,
  startAfter,
  limitToLast
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000:web:000",
};

const isDemo = !import.meta.env.VITE_FIREBASE_API_KEY;

if (isDemo) {
  console.warn(
    "BitGen: Running in demo mode. Create a .env.local file with Firebase credentials for full functionality."
  );
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Helper to check if user is verified for sensitive actions
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || user.uid !== userId) return false;
  await reload(user);
  return user.emailVerified;
}

// Helper to get user-specific transactions (paginated)
export async function getUserTransactions(
  userId: string, 
  lastDoc?: any, 
  pageSize: number = 20
) {
  let q = query(
    collection(db, 'transactions'),
    where('participants', 'array-contains', userId),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(q);
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];
  const transactions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return { transactions, lastVisible };
}

// Helper to get user-specific transactions with real-time listener (LIMIT 20)
export function listenToUserTransactions(
  userId: string,
  callback: (transactions: any[]) => void
) {
  const q = query(
    collection(db, 'transactions'),
    where('participants', 'array-contains', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(transactions);
  });
}

// Helper to get user-specific gigs (LIMIT 20)
export function listenToUserGigs(
  userId: string,
  callback: (gigs: any[]) => void
) {
  const q = query(
    collection(db, 'gigs'),
    where('posterId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, (snapshot) => {
    const gigs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(gigs);
  });
}

// Helper to get all active gigs for browsing (LIMIT 20)
export function listenToActiveGigs(callback: (gigs: any[]) => void) {
  const q = query(
    collection(db, 'gigs'),
    where('status', 'in', ['open', 'requested']),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, (snapshot) => {
    const gigs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(gigs);
  });
}

// Helper to add a single transaction record
export async function addTransaction(transactionData: any) {
  return addDoc(collection(db, 'transactions'), {
    ...transactionData,
    participants: [transactionData.senderId, transactionData.recipientId].filter(Boolean),
    createdAt: serverTimestamp(),
  });
}

export {
  app,
  auth,
  db,
  isDemo,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  orderBy,
  limit,
  Timestamp,
  startAfter,
  limitToLast
};
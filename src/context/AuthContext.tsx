import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface UserData {
  uid: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'customer' | 'admin';
  wishlist: string[];
  cart: any[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserData: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      
      if (unsubscribeUserData) {
        unsubscribeUserData();
        unsubscribeUserData = null;
      }

      if (authUser) {
        unsubscribeUserData = onSnapshot(doc(db, 'users', authUser.uid), 
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data() as UserData);
            } else {
              setUserData(null);
            }
            setLoading(false);
          },
          (err) => {
            // Handle error without necessarily throwing if it's just "offline"
            if (err.message.includes('offline')) {
              console.warn("Firestore offline - user data will sync once back online.");
            } else {
              // Only report other errors
              console.error("UserData snapshot error:", err);
            }
            setLoading(false);
          }
        );
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserData) unsubscribeUserData();
    };
  }, []);

  const isAdmin = userData?.role === 'admin' || user?.email === (import.meta.env.VITE_ADMIN_EMAIL || 'qqardasov61@gmail.com');

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

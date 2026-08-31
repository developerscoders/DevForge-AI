import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin' | 'architect';
  creditsRemaining: number;
  creditsTotal: number;
  planId: string;
  planName: string;
  billingCycle?: 'monthly' | 'yearly';
  nextRenewal?: string;
  referralCode: string;
  referralsCount: number;
  referralBonus: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserCredits: (deductAmount: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserProfile = async (currentUser: User) => {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(userDocRef);

    const generatedRefCode = `DEV_${currentUser.uid.substring(0, 6).toUpperCase()}`;
    const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

    if (!docSnap.exists()) {
      const newProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Engineer',
        photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
        role: 'architect',
        creditsRemaining: 500, // Welcome signup credits
        creditsTotal: 500,
        planId: 'free',
        planName: 'Free Tier',
        billingCycle: 'monthly',
        nextRenewal: nextMonth,
        referralCode: generatedRefCode,
        referralsCount: 0,
        referralBonus: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newProfile);
      setProfile(newProfile);
    } else {
      const data = docSnap.data();
      const existingProfile: UserProfile = {
        uid: currentUser.uid,
        email: data.email || currentUser.email,
        displayName: data.displayName || currentUser.displayName || 'Engineer',
        photoURL: data.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
        role: data.role || 'architect',
        creditsRemaining: data.creditsRemaining !== undefined ? data.creditsRemaining : 500,
        creditsTotal: data.creditsTotal !== undefined ? data.creditsTotal : 500,
        planId: data.planId || 'free',
        planName: data.planName || 'Free Tier',
        billingCycle: data.billingCycle || 'monthly',
        nextRenewal: data.nextRenewal || nextMonth,
        referralCode: data.referralCode || generatedRefCode,
        referralsCount: data.referralsCount || 0,
        referralBonus: data.referralBonus || 0,
        createdAt: data.createdAt || new Date().toISOString(),
      };
      setProfile(existingProfile);
    }
  };

  useEffect(() => {
    let unsubsDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);

        // Listen for real-time changes to user profile in Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        unsubsDoc = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
        });
        setLoading(false);
      } else {
        if (unsubsDoc) {
          unsubsDoc();
          unsubsDoc = null;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubsDoc) unsubsDoc();
      unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    if (credential.user) {
      await updateProfile(credential.user, { displayName: name });
      const generatedRefCode = `DEV_${credential.user.uid.substring(0, 6).toUpperCase()}`;
      const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

      const newProfile: UserProfile = {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: name,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${credential.user.uid}`,
        role: 'architect',
        creditsRemaining: 500,
        creditsTotal: 500,
        planId: 'free',
        planName: 'Free Tier',
        billingCycle: 'monthly',
        nextRenewal: nextMonth,
        referralCode: generatedRefCode,
        referralsCount: 0,
        referralBonus: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', credential.user.uid), newProfile);
      setProfile(newProfile);
    }
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const updateUserCredits = async (deductAmount: number) => {
    if (!user || !profile) return;
    const userDocRef = doc(db, 'users', user.uid);
    const newRemaining = Math.max(0, profile.creditsRemaining - deductAmount);
    await setDoc(userDocRef, { creditsRemaining: newRemaining }, { merge: true });
  };

  const refreshProfile = async () => {
    if (user) {
      await syncUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        updateUserCredits,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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
  updateUserSubscription: (planId: string, planName: string, cycle: 'monthly' | 'yearly', credits: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const GUEST_STORAGE_KEY = 'devforge_guest_profile_v2';

function getInitialGuestProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(GUEST_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}

  return {
    uid: 'guest_user',
    email: 'developer@sandbox.local',
    displayName: 'Lead Engineer',
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=engineer',
    role: 'architect',
    creditsRemaining: 500,
    creditsTotal: 500,
    planId: 'free',
    planName: 'Free Tier',
    billingCycle: 'monthly',
    nextRenewal: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    referralCode: 'DEV_GUEST',
    referralsCount: 0,
    referralBonus: 0,
    createdAt: new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(getInitialGuestProfile);
  const [loading, setLoading] = useState(true);

  const saveGuestProfile = (updated: UserProfile) => {
    setProfile(updated);
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const syncUserProfile = async (currentUser: User) => {
    try {
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
    } catch (err) {
      console.warn('Could not sync user profile with Firestore, using fallback:', err);
    }
  };

  useEffect(() => {
    let unsubsDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);

        // Listen for real-time changes to user profile in Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          unsubsDoc = onSnapshot(
            userDocRef,
            (snap) => {
              if (snap.exists()) {
                setProfile(snap.data() as UserProfile);
              }
            },
            (error) => {
              console.warn('User profile Firestore snapshot error:', error);
            }
          );
        } catch (e) {}
        setLoading(false);
      } else {
        if (unsubsDoc) {
          unsubsDoc();
          unsubsDoc = null;
        }
        // Fall back to saved guest profile so state is maintained
        setProfile(getInitialGuestProfile());
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
      try {
        await setDoc(doc(db, 'users', credential.user.uid), newProfile);
      } catch (e) {}
      setProfile(newProfile);
    }
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(getInitialGuestProfile());
  };

  const updateUserCredits = async (deductAmount: number) => {
    if (!profile) return;
    const newRemaining = Math.max(0, profile.creditsRemaining - deductAmount);
    
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { creditsRemaining: newRemaining }, { merge: true });
      } catch (e) {}
    }

    const updated = { ...profile, creditsRemaining: newRemaining };
    if (!user) {
      saveGuestProfile(updated);
    } else {
      setProfile(updated);
    }
  };

  const updateUserSubscription = async (
    planId: string,
    planName: string,
    cycle: 'monthly' | 'yearly',
    credits: number
  ) => {
    const nextRenewalDate = new Date(
      Date.now() + (cycle === 'yearly' ? 365 : 30) * 24 * 3600 * 1000
    )
      .toISOString()
      .split('T')[0];

    const currentTotal = profile?.creditsTotal || 0;
    const currentRemaining = profile?.creditsRemaining || 0;

    const newCreditsRemaining = currentRemaining + credits;
    const newCreditsTotal = currentTotal + credits;

    const updatedProfile: UserProfile = {
      ...(profile || getInitialGuestProfile()),
      planId,
      planName,
      billingCycle: cycle,
      creditsRemaining: newCreditsRemaining,
      creditsTotal: newCreditsTotal,
      nextRenewal: nextRenewalDate,
    };

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            planId,
            planName,
            billingCycle: cycle,
            creditsRemaining: newCreditsRemaining,
            creditsTotal: newCreditsTotal,
            nextRenewal: nextRenewalDate,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Failed to update user profile in Firestore:', e);
      }
      setProfile(updatedProfile);
    } else {
      saveGuestProfile(updatedProfile);
    }
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
        updateUserSubscription,
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

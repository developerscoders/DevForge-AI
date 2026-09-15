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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserProfile = async (currentUser: User) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      const generatedRefCode = `DEV_${currentUser.uid.substring(0, 6).toUpperCase()}`;
      const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

      // Dynamically fetch Free plan definition from Firestore database
      let dbFreeCredits = 0;
      let dbFreePlanName = 'Free Tier';
      try {
        const freePlanSnap = await getDoc(doc(db, 'plans', 'free'));
        if (freePlanSnap.exists()) {
          const d = freePlanSnap.data();
          if (typeof d.credits === 'number') dbFreeCredits = d.credits;
          else dbFreeCredits = 0;

          if (d.name) dbFreePlanName = d.name;
        }
      } catch (e) {
        console.warn('Could not read free plan from Firestore:', e);
      }

      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Engineer',
          photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
          role: 'architect',
          creditsRemaining: dbFreeCredits,
          creditsTotal: dbFreeCredits,
          planId: 'free',
          planName: dbFreePlanName,
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
        let creditsRemaining = data.creditsRemaining !== undefined ? data.creditsRemaining : 0;
        let creditsTotal = data.creditsTotal !== undefined ? data.creditsTotal : 0;

        // If an existing user document has 0/0 credits on the free tier, assign the credits from Firestore database
        if (creditsRemaining === 0 && creditsTotal === 0 && (!data.planId || data.planId === 'free')) {
          creditsRemaining = dbFreeCredits;
          creditsTotal = dbFreeCredits;
          try {
            await setDoc(userDocRef, { creditsRemaining, creditsTotal }, { merge: true });
          } catch (e) {
            console.warn('Failed to update free tier credits in Firestore:', e);
          }
        }

        const existingProfile: UserProfile = {
          uid: currentUser.uid,
          email: data.email || currentUser.email,
          displayName: data.displayName || currentUser.displayName || 'Engineer',
          photoURL: data.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
          role: data.role || 'architect',
          creditsRemaining,
          creditsTotal,
          planId: data.planId || 'free',
          planName: data.planName || dbFreePlanName,
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
        // Unauthenticated visitor: profile is null
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

      let dbFreeCredits = 500;
      let dbFreePlanName = 'Free Tier';
      try {
        const freePlanSnap = await getDoc(doc(db, 'plans', 'free'));
        if (freePlanSnap.exists()) {
          const d = freePlanSnap.data();
          if (typeof d.credits === 'number') dbFreeCredits = d.credits;
          if (d.name) dbFreePlanName = d.name;
        }
      } catch (e) {}

      const newProfile: UserProfile = {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: name,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${credential.user.uid}`,
        role: 'architect',
        creditsRemaining: dbFreeCredits,
        creditsTotal: dbFreeCredits,
        planId: 'free',
        planName: dbFreePlanName,
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
    setProfile(null);
    try {
      localStorage.removeItem('devforge_guest_profile_v2');
    } catch (e) {}
  };

  const updateUserCredits = async (deductAmount: number) => {
    if (!profile || !user) return;
    const newRemaining = Math.max(0, profile.creditsRemaining - deductAmount);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { creditsRemaining: newRemaining }, { merge: true });
    } catch (e) {}
    setProfile({ ...profile, creditsRemaining: newRemaining });
  };

  const updateUserSubscription = async (
    planId: string,
    planName: string,
    cycle: 'monthly' | 'yearly',
    credits: number
  ) => {
    if (!user || !profile) return;
    const nextRenewalDate = new Date(
      Date.now() + (cycle === 'yearly' ? 365 : 30) * 24 * 3600 * 1000
    )
      .toISOString()
      .split('T')[0];

    const currentTotal = profile.creditsTotal || 0;
    const currentRemaining = profile.creditsRemaining || 0;

    const newCreditsRemaining = currentRemaining + credits;
    const newCreditsTotal = currentTotal + credits;

    const updatedProfile: UserProfile = {
      ...profile,
      planId,
      planName,
      billingCycle: cycle,
      creditsRemaining: newCreditsRemaining,
      creditsTotal: newCreditsTotal,
      nextRenewal: nextRenewalDate,
    };

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

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '../Firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up new organizer
  const signup = async (email, password, organizationName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Configure action code settings for email verification
    // Since localhost is now authorized in Firebase, we can use it directly
    const actionCodeSettings = {
      url: `${window.location.origin}/login?verified=true`,
      handleCodeInApp: false
    };

    // Send email verification with redirect
    await sendEmailVerification(user, actionCodeSettings);

    // Create user profile in database
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
      email: user.email,
      organizationName: organizationName || '',
      role: 'organizer',
      profileCompleted: false,
      createdAt: new Date().toISOString()
    });

    return user;
  };

  // Sign in existing user
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google (using redirect instead of popup to avoid COOP issues)
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Request email verification from Google
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    // Use redirect instead of popup
    await signInWithRedirect(auth, provider);
    // User will be redirected away and back - profile creation handled in useEffect
  };

  // Sign out
  const logout = () => {
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Load user profile
  const loadUserProfile = async (uid) => {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      setUserProfile(snapshot.val());
    }
  };

  useEffect(() => {
    // Check for redirect result from Google Sign-In
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('✅ Google Sign-In redirect successful');
          const user = result.user;

          // Validate email is verified by Google
          if (!user.emailVerified) {
            console.error('❌ Email not verified by Google');
            await signOut(auth);
            throw new Error('Email not verified. Please use a verified Google account.');
          }

          // Validate email format
          const email = user.email || '';
          if (!email || !email.includes('@')) {
            console.error('❌ Invalid email format:', email);
            await signOut(auth);
            throw new Error('Invalid email address. Please try again.');
          }

          console.log('✅ Email verified:', email);

          // Check if user profile exists, if not create one
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);

          if (!snapshot.exists()) {
            console.log('Creating new user profile for Google user');
            // New user - create profile
            await set(userRef, {
              email: user.email,
              organizationName: user.displayName || '',
              role: 'organizer',
              profileCompleted: false,
              createdAt: new Date().toISOString(),
              photoURL: user.photoURL || null,
              emailVerified: true
            });
          }

          // Load the profile to trigger ProtectedRoute navigation
          await loadUserProfile(user.uid);
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
        // Note: Error will be displayed to user through the auth context
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? user.email : 'No user');
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    signInWithGoogle,
    logout,
    resetPassword,
    loadUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
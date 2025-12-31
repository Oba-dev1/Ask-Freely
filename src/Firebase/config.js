import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration with environment variable support
// For production: Uses the new rotated API key
// For local development: Create a .env.local file (gitignored) to override
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBBzuAxs6WWwU_7yj5t29UisKVSfcEM97Y",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "ask-freely.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://ask-freely-default-rtdb.firebaseio.com/",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "ask-freely",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "ask-freely.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "457495551077",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:457495551077:web:29401003fa26c9102c3a8c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
export const database = getDatabase(app);

// Get a reference to the auth service
export const auth = getAuth(app);

// Get a reference to the storage service
export const storage = getStorage(app);

// reCAPTCHA Site Key (public key - safe to expose in frontend)
export const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "";

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBHobPiQY7xAWAHrrT6XLa3F3U5HBYfycU",
  authDomain: "ask-freely.firebaseapp.com",
  databaseURL: 'https://ask-freely-default-rtdb.firebaseio.com/',
  projectId: 'ask-freely',
  storageBucket: 'ask-freely.firebasestorage.app',
  messagingSenderId: "457495551077",
  appId: "1:457495551077:web:29401003fa26c9102c3a8c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
export const database = getDatabase(app);
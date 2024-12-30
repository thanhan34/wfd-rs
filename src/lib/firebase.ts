import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to avoid errors
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Initialize Analytics only in browser environment
if (typeof window !== 'undefined') {
  getAnalytics(app);
}

// Delete a question by ID
export const deleteQuestion = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'questions', id));
    return true;
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

// Update a question
export const updateQuestion = async (id: string, data: { content: string, questionNo?: string }) => {
  try {
    await updateDoc(doc(db, 'questions', id), data);
    return true;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

export { db };

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  type DocumentData,
  CollectionReference,
  collection,
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMcbiSYv6AYvWnHlDtVI-TLTfHOR23mNE",
  authDomain: "kichnet-b0bba.firebaseapp.com",
  projectId: "kichnet-b0bba",
  storageBucket: "kichnet-b0bba.firebasestorage.app",
  messagingSenderId: "910402595212",
  appId: "1:910402595212:web:66c79377f7366b0e150ea9",
  measurementId: "G-L84WC70QEY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const createCollection = <T = DocumentData>(collectionName: string) => {
  return collection(db, collectionName) as CollectionReference<T>;
};

export const waitlistCollection = createCollection<{
  name: string;
  email: string;
}>("waitlist");

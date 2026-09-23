import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWUrizaUIkR36qwa7ZUHGEgWGh3RO6gkY",
  authDomain: "kkmp-pos.firebaseapp.com",
  projectId: "kkmp-pos",
  storageBucket: "kkmp-pos.firebasestorage.app",
  messagingSenderId: "792982672059",
  appId: "1:792982672059:web:959e5b48cfe7b211f90f9e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


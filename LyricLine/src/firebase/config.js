import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Real Firebase project — see console.firebase.google.com/project/lyricline-4c29d
const firebaseConfig = {
  apiKey: "AIzaSyBl_1lDqdrXAKuljqUkpjSHiZrdL4Jq9Ks",
  authDomain: "lyricline-4c29d.firebaseapp.com",
  projectId: "lyricline-4c29d",
  storageBucket: "lyricline-4c29d.firebasestorage.app",
  messagingSenderId: "387641208769",
  appId: "1:387641208769:web:fa10e428ed08ccdabf0940",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

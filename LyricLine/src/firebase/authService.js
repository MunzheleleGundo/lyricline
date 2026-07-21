import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

// Sign up: creates the auth user, sets displayName, and writes a matching
// /users/{uid} profile doc (role: "artist" | "listener").
export async function signUp({ name, email, password, role }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    role,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function signIn({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export function signOut() {
  return fbSignOut(auth);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// Subscribes to auth state; callback receives { uid, name, role } or null.
export function watchAuth(callback) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }
    const profile = await getUserProfile(fbUser.uid);
    callback({
      uid: fbUser.uid,
      name: profile?.name || fbUser.displayName || "Unnamed",
      role: profile?.role || "listener",
    });
  });
}

// Firebase's raw error codes are ugly — map the common ones to something
// a user can actually act on.
export function friendlyAuthError(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "That email already has an account — try signing in instead.";
  if (code.includes("invalid-credential") || code.includes("wrong-password")) return "Incorrect email or password.";
  if (code.includes("user-not-found")) return "No account found for that email — try signing up instead.";
  if (code.includes("weak-password")) return "Password should be at least 6 characters.";
  if (code.includes("invalid-email")) return "That email address doesn't look valid.";
  return err?.message || "Something went wrong. Please try again.";
}

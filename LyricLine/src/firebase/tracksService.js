import {
  collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, setDoc,
  deleteDoc, serverTimestamp, runTransaction, updateDoc, increment,
} from "firebase/firestore";
import { db } from "./config";

const TRACKS = "tracks";

// Publishes a finished (synced) track. Returns the new doc id.
export async function createTrack({ title, artist, artistUid, genre, tags, lines, timestamps, coverURL, audioURL }) {
  const ref = await addDoc(collection(db, TRACKS), {
    title, artist, artistUid, genre, tags, lines, timestamps,
    coverURL: coverURL || null,
    audioURL,
    likesCount: 0,
    viewsCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Realtime subscription to the full catalog, newest first.
// Returns an unsubscribe function.
export function watchTracks(callback, onError) {
  const q = query(collection(db, TRACKS), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError && onError(err)
  );
}

// Fire-and-forget view count bump, called once each time a track is opened
// in the player. Not session-deduped — good enough for a prototype metric,
// not meant to be abuse-resistant.
export function recordTrackView(trackId) {
  updateDoc(doc(db, TRACKS, trackId), { viewsCount: increment(1) }).catch(() => {
    // Non-critical — a failed view bump shouldn't interrupt playback.
  });
}

// Toggle a like for a track, atomically updating the denormalized count.
// Like existence is tracked at tracks/{trackId}/likedBy/{uid}.
export async function toggleTrackLike(trackId, uid) {
  const trackRef = doc(db, TRACKS, trackId);
  const likeRef = doc(db, TRACKS, trackId, "likedBy", uid);

  return runTransaction(db, async (tx) => {
    const [trackSnap, likeSnap] = await Promise.all([tx.get(trackRef), tx.get(likeRef)]);
    if (!trackSnap.exists()) throw new Error("Track no longer exists.");
    const current = trackSnap.data().likesCount || 0;

    if (likeSnap.exists()) {
      tx.delete(likeRef);
      tx.update(trackRef, { likesCount: Math.max(0, current - 1) });
      return { liked: false, likesCount: Math.max(0, current - 1) };
    } else {
      tx.set(likeRef, { likedAt: serverTimestamp() });
      tx.update(trackRef, { likesCount: current + 1 });
      return { liked: true, likesCount: current + 1 };
    }
  });
}

// Fire-and-forget persistence for in-place lyric edits made from the
// video studio's tap-to-edit flow. Best-effort, same pattern as
// recordTrackView — a failed save shouldn't interrupt editing.
export function updateTrackLines(trackId, lines) {
  updateDoc(doc(db, TRACKS, trackId), { lines }).catch(() => {
    // Non-critical — the local preview already reflects the edit.
  });
}

export async function getMyLikeStatus(trackId, uid) {
  const snap = await getDoc(doc(db, TRACKS, trackId, "likedBy", uid));
  return snap.exists();
}

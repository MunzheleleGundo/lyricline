import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

// Uploads a file under uploads/{uid}/{folder}/{timestamp}-{filename} and
// returns its public download URL.
export async function uploadFile(uid, folder, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `uploads/${uid}/${folder}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

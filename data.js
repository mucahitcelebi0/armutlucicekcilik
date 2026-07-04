// ============================================================
//  VERİ KATMANI — Firebase (Firestore) + Cloudinary
//  Hem admin paneli hem de ana site bunu kullanır.
//  Backend değişirse SADECE bu dosya değişir.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc,
  addDoc, setDoc, updateDoc, deleteDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseConfig, cloudinary, isConfigured, isCloudinaryConfigured } from "./firebase-config.js";

let db = null, auth = null;
if (isConfigured()) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

export { db, auth, isConfigured, isCloudinaryConfigured };

// ---------- AUTH ----------
export function watchAuth(cb) {
  if (!auth) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export function logout() {
  return signOut(auth);
}

// ---------- ÜRÜNLER ----------
export async function getProducts() {
  if (!db) return [];
  const q = query(collection(db, "products"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function saveProduct(id, payload) {
  if (id) {
    await updateDoc(doc(db, "products", id), payload);
    return id;
  }
  const ref = await addDoc(collection(db, "products"), payload);
  return ref.id;
}
export async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
}

// ---------- KATEGORİLER ----------
export async function getCategories() {
  if (!db) return [];
  const q = query(collection(db, "categories"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function saveCategory(id, payload) {
  if (id) {
    await updateDoc(doc(db, "categories", id), payload);
    return id;
  }
  const ref = await addDoc(collection(db, "categories"), payload);
  return ref.id;
}
export async function deleteCategory(id) {
  await deleteDoc(doc(db, "categories", id));
}

// ---------- AYARLAR (tek belge) ----------
export async function getSettings() {
  if (!db) return null;
  const snap = await getDoc(doc(db, "settings", "general"));
  return snap.exists() ? snap.data() : null;
}
export async function saveSettings(payload) {
  await setDoc(doc(db, "settings", "general"), payload, { merge: true });
}

// ---------- GÖRSEL YÜKLEME (Cloudinary, ücretsiz) ----------
export async function uploadImage(file) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary ayarlanmamış. firebase-config.js dosyasını doldur.");
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", cloudinary.uploadPreset);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`,
    { method: "POST", body: fd }
  );
  if (!res.ok) throw new Error("Görsel yüklenemedi (Cloudinary).");
  const json = await res.json();
  return json.secure_url;
}

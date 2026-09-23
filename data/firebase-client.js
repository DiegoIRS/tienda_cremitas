import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";
import { getDownloadURL, getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

let app;
let auth;
let db;
let functions;
let storage;

export function getFirebaseStatus() {
  if (!isFirebaseConfigured()) {
    return {
      configured: false,
      message: "Firebase aun no tiene apiKey/appId configurados."
    };
  }

  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app, "southamerica-west1");
    storage = getStorage(app);
  }

  return {
    configured: true,
    app,
    auth,
    db,
    functions
  };
}

export function requireFirebase() {
  const status = getFirebaseStatus();
  if (!status.configured) {
    throw new Error(status.message);
  }
  return status;
}

export function onUserChange(callback) {
  const status = getFirebaseStatus();
  if (!status.configured) {
    callback(null, status);
    return () => {};
  }

  return onAuthStateChanged(status.auth, (user) => callback(user, status));
}

export async function loginWithGoogle() {
  const { auth } = requireFirebase();
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function loginWithEmail(email, password) {
  const { auth } = requireFirebase();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email, password) {
  const { auth } = requireFirebase();
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  const { auth } = requireFirebase();
  return signOut(auth);
}

export async function upsertUserProfile(user) {
  const { db } = requireFirebase();
  return setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function saveQuote({ cart, totals, delivery, coupon, shipping, customer }) {
  const { auth, db } = requireFirebase();
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Inicia sesión para guardar tu cotización.");
  }
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error("Agrega al menos un producto antes de guardar la cotización.");
  }

  return addDoc(collection(db, "quotes"), {
    userId: user.uid,
    customerEmail: user.email,
    status: "draft",
    cart,
    totals,
    delivery,
    coupon: coupon || null,
    shipping: shipping || null,
    customer: customer || null,
    createdAt: serverTimestamp()
  });
}

export async function getUserAccess(user, forceRefresh = false) {
  if (!user) return { admin: false, superAdmin: false };
  const token = await user.getIdTokenResult(forceRefresh);
  return {
    admin: token.claims.admin === true,
    superAdmin: token.claims.superAdmin === true
  };
}

export async function manageAdminAccess(email, role) {
  const { functions } = requireFirebase();
  return httpsCallable(functions, "manageAdminAccess")({ email, role });
}

export async function adjustInventory(productId, delta, note = "", variantId = "") {
  const { functions } = requireFirebase();
  return httpsCallable(functions, "adjustInventory")({ productId, delta: Number(delta), note, variantId: variantId || null });
}

export async function listProducts() {
  const { db } = requireFirebase();
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function listCategories() {
  const { db } = requireFirebase();
  const snapshot = await getDocs(collection(db, "categories"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function listVariantOptions() {
  const { db } = requireFirebase();
  const snapshot = await getDocs(collection(db, "variantOptions"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function listProductLines() {
  const { db } = requireFirebase();
  const snapshot = await getDocs(collection(db, "productLines"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function upsertProductLine(line) {
  const { db } = requireFirebase();
  if (!line.id || !line.name) throw new Error("La línea necesita un nombre.");
  return setDoc(doc(db, "productLines", line.id), { ...line, updatedAt: serverTimestamp() }, { merge: true });
}

export async function upsertVariantOption(option) {
  const { db } = requireFirebase();
  if (!option.id || !option.type || !option.name) throw new Error("La opción necesita tipo y nombre.");
  return setDoc(doc(db, "variantOptions", option.id), { ...option, updatedAt: serverTimestamp() }, { merge: true });
}

export async function upsertCategory(category) {
  const { db } = requireFirebase();
  if (!category.id) throw new Error("La categoría necesita un ID.");
  return setDoc(doc(db, "categories", category.id), { ...category, updatedAt: serverTimestamp() }, { merge: true });
}

export async function upsertProduct(product) {
  const { db } = requireFirebase();
  if (!product.id) throw new Error("El producto necesita un ID.");
  return setDoc(doc(db, "products", product.id), {
    ...product,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function updateProductStock(productId, stock) {
  const { db } = requireFirebase();
  return updateDoc(doc(db, "products", productId), {
    stock: Number(stock) || 0,
    updatedAt: serverTimestamp()
  });
}

export async function getUserProfileData(userId) {
  const { db } = requireFirebase();
  const userDoc = await doc(db, "users", userId);
  const snap = await getDoc(userDoc);
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfileData(userId, profileData) {
  const { db } = requireFirebase();
  return setDoc(doc(db, "users", userId), {
    ...profileData,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function listQuotes() {
  const { db } = requireFirebase();
  const quotesQuery = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(quotesQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function uploadProductImage(productId, webpBlob) {
  const { auth } = requireFirebase();
  if (!auth.currentUser) throw new Error("Inicia sesión para subir una imagen.");
  if (!productId || !webpBlob) throw new Error("Selecciona una imagen y un producto válido.");
  const safeId = String(productId).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const fileRef = ref(storage, `products/${safeId}/${Date.now()}.webp`);
  await uploadBytes(fileRef, webpBlob, { contentType: "image/webp", cacheControl: "public,max-age=31536000,immutable" });
  return getDownloadURL(fileRef);
}

export async function listOrders() {
  const { db } = requireFirebase();
  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(ordersQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function listInventoryMovements() {
  const { db } = requireFirebase();
  const snapshot = await getDocs(collection(db, "inventoryMovements"));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function updateOrderFulfillment(orderId, data) {
  const { db } = requireFirebase();
  return updateDoc(doc(db, "orders", orderId), {
    fulfillmentStatus: data.fulfillmentStatus,
    fulfillmentNotes: data.fulfillmentNotes || null,
    trackingCode: data.trackingCode || null,
    carrier: data.carrier || null,
    assignedTo: data.assignedTo || null,
    updatedAt: serverTimestamp()
  });
}

export async function updateQuoteStatus(quoteId, status) {
  const { db } = requireFirebase();
  return updateDoc(doc(db, "quotes", quoteId), {
    status,
    updatedAt: serverTimestamp()
  });
}


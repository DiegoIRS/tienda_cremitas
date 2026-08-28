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
import {
  addDoc,
  collection,
  doc,
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
  }

  return {
    configured: true,
    app,
    auth,
    db
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

  return addDoc(collection(db, "quotes"), {
    userId: user?.uid || null,
    customerEmail: user?.email || null,
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

export function isAdminUser(user) {
  const adminEmails = ["diegoi.rojas.santander@gmail.com"];
  return Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()));
}

export async function listProducts() {
  const { db } = requireFirebase();
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
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

export async function listQuotes() {
  const { db } = requireFirebase();
  const quotesQuery = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(quotesQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function updateQuoteStatus(quoteId, status) {
  const { db } = requireFirebase();
  return updateDoc(doc(db, "quotes", quoteId), {
    status,
    updatedAt: serverTimestamp()
  });
}

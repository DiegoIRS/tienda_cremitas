export const firebaseConfig = {
  apiKey: "AIzaSyD9nxbh6Btb26THN_TCwEGoJxFoLnIc4a8",
  authDomain: "vertys-cosmetica.firebaseapp.com",
  projectId: "vertys-cosmetica",
  storageBucket: "vertys-cosmetica.firebasestorage.app",
  messagingSenderId: "897465091954",
  appId: "1:897465091954:web:611ba15f42467cc456ffeb",
  measurementId: "G-2VXRNGS6Z3"
};

export function isFirebaseConfigured() {
  return !Object.values(firebaseConfig).some((value) => value.startsWith("REEMPLAZAR_"));
}

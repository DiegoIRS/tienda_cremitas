import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineString } from "firebase-functions/params";

if (!getApps().length) initializeApp();

const db = getFirestore();
const adminBootstrapEmails = defineString("ADMIN_BOOTSTRAP_EMAILS", { default: "diegoi.rojas.santander@gmail.com" });
const region = "southamerica-west1";

function bootstrapEmails() {
  return new Set(adminBootstrapEmails.value().split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

function requireAdmin(request) {
  if (!request.auth?.token?.admin) throw new HttpsError("permission-denied", "Esta acción requiere un rol administrativo.");
}

function requireSuperAdmin(request) {
  if (!request.auth?.token?.superAdmin) throw new HttpsError("permission-denied", "Esta acción requiere un rol de propietario.");
}

function getAddressApiPath(request) {
  return `${request.path || ""}${request.url || ""}`;
}

// El checkout usa entrada manual hasta configurar Google Places. Mantener este endpoint sin secretos
// permite desplegar la operación de catálogo e inventario sin publicar ni requerir una clave de terceros.
export const api = onRequest({ region }, async (request, response) => {
  const path = getAddressApiPath(request);
  if (request.method === "GET" && path.includes("/address/")) {
    response.status(503).json({ error: "La búsqueda de dirección aún no está habilitada. Ingresa la dirección manualmente." });
    return;
  }
  response.status(404).json({ error: "Ruta no encontrada." });
});


export const syncBootstrapOwner = onDocumentWritten({ region, document: "users/{userId}" }, async (event) => {
  const profile = event.data?.after.data();
  const email = String(profile?.email || "").trim().toLowerCase();
  if (!email || !bootstrapEmails().has(email)) return;
  const user = await getAuth().getUser(event.params.userId);
  if (user.customClaims?.admin && user.customClaims?.superAdmin) return;
  await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true, superAdmin: true });
  await db.collection("adminAudit").add({ action: "owner_role_synced", actorUid: user.uid, actorEmail: email, createdAt: FieldValue.serverTimestamp() });
});

export const manageAdminAccess = onCall({ region }, async (request) => {
  requireSuperAdmin(request);
  const email = String(request.data?.email || "").trim().toLowerCase();
  const role = String(request.data?.role || "admin");
  if (!/^\S+@\S+\.\S+$/.test(email) || !["admin", "superAdmin", "remove"].includes(role)) {
    throw new HttpsError("invalid-argument", "Indica un correo válido y un rol permitido.");
  }
  const user = await getAuth().getUserByEmail(email).catch(() => null);
  if (!user) throw new HttpsError("not-found", "La persona debe iniciar sesión una vez antes de asignarle un rol.");
  const claims = { ...(user.customClaims || {}) };
  if (role === "remove") {
    delete claims.admin;
    delete claims.superAdmin;
  } else {
    claims.admin = true;
    claims.superAdmin = role === "superAdmin";
  }
  await getAuth().setCustomUserClaims(user.uid, claims);
  await db.collection("adminAudit").add({
    action: role === "remove" ? "admin_removed" : "admin_role_assigned",
    actorUid: request.auth.uid,
    actorEmail: request.auth.token.email || null,
    targetUid: user.uid,
    targetEmail: email,
    role,
    createdAt: FieldValue.serverTimestamp()
  });
  return { email, role };
});

export const adjustInventory = onCall({ region }, async (request) => {
  requireAdmin(request);
  const productId = String(request.data?.productId || "").trim();
  const variantId = String(request.data?.variantId || "").trim();
  const delta = Number(request.data?.delta);
  const note = String(request.data?.note || "").trim().slice(0, 180);
  if (!productId || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 10000) {
    throw new HttpsError("invalid-argument", "Indica un producto y un ajuste entero válido.");
  }
  const productRef = db.collection("products").doc(productId);
  const movementRef = db.collection("inventoryMovements").doc();
  const result = await db.runTransaction(async (transaction) => {
    const product = await transaction.get(productRef);
    if (!product.exists) throw new HttpsError("not-found", "El producto no existe en el catálogo administrable.");
    const productData = product.data();
    const variants = Array.isArray(productData.variants) ? productData.variants : [];
    const variantIndex = variantId ? variants.findIndex((variant) => String(variant.id || "") === variantId) : -1;
    if (variantId && variantIndex < 0) throw new HttpsError("not-found", "La presentación no existe en este producto.");
    const previousStock = variantIndex >= 0 ? Number(variants[variantIndex].stock || 0) : Number(productData.stock || 0);
    const nextStock = previousStock + delta;
    if (nextStock < 0) throw new HttpsError("failed-precondition", "El ajuste dejaría el stock bajo cero.");
    if (variantIndex >= 0) {
      const nextVariants = variants.map((variant, index) => index === variantIndex ? { ...variant, stock: nextStock } : variant);
      const aggregateStock = nextVariants.filter((variant) => variant.active !== false).reduce((total, variant) => total + Number(variant.stock || 0), 0);
      transaction.update(productRef, { variants: nextVariants, stock: aggregateStock, updatedAt: FieldValue.serverTimestamp() });
    } else {
      transaction.update(productRef, { stock: nextStock, updatedAt: FieldValue.serverTimestamp() });
    }
    transaction.set(movementRef, {
      productId,
      productName: productData.name || productId,
      variantId: variantId || null,
      variantLabel: variantIndex >= 0 ? [variants[variantIndex].tone, variants[variantIndex].size, variants[variantIndex].finish].filter(Boolean).join(" · ") || variants[variantIndex].sku || variantId : null,
      delta,
      previousStock,
      nextStock,
      note: note || null,
      actorUid: request.auth.uid,
      actorEmail: request.auth.token.email || null,
      createdAt: FieldValue.serverTimestamp()
    });
    return { previousStock, nextStock };
  });
  return result;
});

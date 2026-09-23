import { randomUUID } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { MercadoPagoConfig, Payment, Preference, WebhookSignatureValidator } from "mercadopago";
import { CATALOG } from "./catalog.js";

if (!getApps().length) initializeApp();
const db = getFirestore();
const accessTokenSecret = defineSecret("MERCADOPAGO_ACCESS_TOKEN");
const webhookSecret = defineSecret("MERCADOPAGO_WEBHOOK_SECRET");
const siteUrlParam = defineString("CHECKOUT_SITE_URL", { default: "https://vertys-cosmetica.web.app" });
const region = "southamerica-west1";

function siteUrl() { return siteUrlParam.value().replace(/\/$/, ""); }
function client() {
  const accessToken = accessTokenSecret.value();
  if (!accessToken) throw new Error("La integración de pagos aún no está configurada.");
  return { accessToken, client: new MercadoPagoConfig({ accessToken }) };
}
function cors(request, response) {
  const origin = request.get("origin");
  const allowed = new Set([siteUrl(), "http://127.0.0.1:5174", "http://localhost:5174"]);
  if (origin && !allowed.has(origin)) return false;
  if (origin) response.set("Access-Control-Allow-Origin", origin);
  response.set("Vary", "Origin");
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");
  return true;
}
function orderDetails(rawCustomer, rawDelivery) {
  const customer = { name: String(rawCustomer?.name || "").trim().slice(0, 100), email: String(rawCustomer?.email || "").trim().toLowerCase().slice(0, 160), phone: String(rawCustomer?.phone || "").trim().slice(0, 40) };
  const delivery = { method: String(rawDelivery?.method || "delivery").trim().slice(0, 40), address: String(rawDelivery?.address || "").trim().slice(0, 180), commune: String(rawDelivery?.commune || "").trim().slice(0, 80), notes: String(rawDelivery?.notes || "").trim().slice(0, 500) };
  if (!customer.name || !/^\S+@\S+\.\S+$/.test(customer.email) || !customer.phone || !delivery.address || !delivery.commune) throw new Error("Completa nombre, correo, teléfono y dirección de despacho para continuar.");
  return { customer, delivery };
}
function itemsFromCatalog(rawItems) {
  if (!Array.isArray(rawItems) || !rawItems.length || rawItems.length > 20) throw new Error("El carrito debe contener entre 1 y 20 productos.");
  const merged = new Map();
  for (const item of rawItems) {
    const id = String(item?.id || "");
    const quantity = Number(item?.quantity);
    if (!CATALOG.get(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new Error("El carrito contiene un producto o cantidad no válida.");
    merged.set(id, (merged.get(id) || 0) + quantity);
  }
  return [...merged].map(([id, quantity]) => {
    const product = CATALOG.get(id);
    if (quantity > 10) throw new Error("La cantidad máxima por producto es 10.");
    return { id, title: product.title, quantity, unit_price: product.unitPrice, currency_id: "CLP", picture: `${siteUrl()}${product.picture}` };
  });
}
async function createPreference(request, response) {
  const items = itemsFromCatalog(request.body?.items);
  const { customer, delivery } = orderDetails(request.body?.customer, request.body?.delivery);
  const orderId = randomUUID();
  const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const { accessToken, client: mercadoPago } = client();
  await db.collection("orders").doc(orderId).set({ id: orderId, provider: "mercadopago", paymentStatus: "pending", currency: "CLP", total, items: items.map(({ picture, ...item }) => item), customer, delivery, fulfillmentStatus: "new", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  try {
    const preference = await new Preference(mercadoPago).create({ body: { items, external_reference: orderId, notification_url: `${siteUrl()}/api/mercadopago/webhook`, back_urls: { success: `${siteUrl()}/?checkout=success&order_id=${orderId}#carrito`, pending: `${siteUrl()}/?checkout=pending&order_id=${orderId}#carrito`, failure: `${siteUrl()}/?checkout=failure&order_id=${orderId}#carrito` }, auto_return: "approved", statement_descriptor: "EXEL CHILE" } });
    await db.collection("orders").doc(orderId).update({ preferenceId: preference.id, updatedAt: FieldValue.serverTimestamp() });
    const initPoint = accessToken.startsWith("TEST-") ? preference.sandbox_init_point : preference.init_point;
    if (!initPoint) throw new Error("Mercado Pago no devolvió una URL de pago.");
    return response.status(201).json({ orderId, initPoint });
  } catch (error) {
    await db.collection("orders").doc(orderId).update({ paymentStatus: "preference_error", updatedAt: FieldValue.serverTimestamp() });
    console.error("Mercado Pago preference error", error);
    return response.status(502).json({ error: "No fue posible iniciar el pago. Intenta nuevamente." });
  }
}
async function receiveWebhook(request, response) {
  const paymentId = String(request.query["data.id"] || request.body?.data?.id || "");
  if (!paymentId) return response.status(400).json({ error: "Notificación sin identificador de pago." });
  try { WebhookSignatureValidator.validate({ xSignature: request.get("x-signature"), xRequestId: request.get("x-request-id"), dataId: paymentId, secret: webhookSecret.value() }); } catch { return response.sendStatus(401); }
  try {
    const { client: mercadoPago } = client();
    const payment = await new Payment(mercadoPago).get({ id: paymentId });
    if (!payment.external_reference) return response.sendStatus(200);
    await db.collection("orders").doc(payment.external_reference).set({ paymentId: String(payment.id), paymentStatus: payment.status, paymentStatusDetail: payment.status_detail || null, paymentMethod: payment.payment_method_id || null, paymentUpdatedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return response.sendStatus(200);
  } catch (error) { console.error("Mercado Pago webhook error", error); return response.sendStatus(500); }
}

export const api = onRequest({ region, secrets: [accessTokenSecret, webhookSecret] }, async (request, response) => {
  if (!cors(request, response)) return response.sendStatus(403);
  if (request.method === "OPTIONS") return response.sendStatus(204);
  if (request.method !== "POST") return response.status(405).json({ error: "Método no permitido." });
  const route = request.path.replace(/^\/api/, "");
  if (route === "/mercadopago/preference") return createPreference(request, response);
  if (route === "/mercadopago/webhook") return receiveWebhook(request, response);
  return response.status(404).json({ error: "Ruta de pago no encontrada." });
});

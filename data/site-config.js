(function () {
  const CART_KEY = "exel_cart";
  const WHATSAPP_PHONE = "56981681536";
  const FIRESTORE_PRODUCTS_URL = "https://firestore.googleapis.com/v1/projects/vertys-cosmetica/databases/(default)/documents/products";
  const currencyFormatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  });

  function formatCurrency(value) {
    return currencyFormatter.format(Number(value) || 0);
  }

  function loadCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(Array.isArray(cart) ? cart : []));
  }

  function buildWhatsAppUrl(message) {
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function parseFirestoreValue(value) {
    if (!value || typeof value !== "object") return null;
    if ("stringValue" in value) return value.stringValue;
    if ("integerValue" in value) return Number(value.integerValue);
    if ("doubleValue" in value) return Number(value.doubleValue);
    if ("booleanValue" in value) return Boolean(value.booleanValue);
    if ("arrayValue" in value) return (value.arrayValue.values || []).map(parseFirestoreValue);
    if ("mapValue" in value) return parseFirestoreFields(value.mapValue.fields || {});
    return null;
  }

  function parseFirestoreFields(fields) {
    return Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, parseFirestoreValue(value)])
    );
  }

  async function loadProductsFromFirestore(fallbackProducts = []) {
    try {
      const response = await fetch(FIRESTORE_PRODUCTS_URL);
      if (!response.ok) throw new Error(`Firestore products failed: ${response.status}`);
      const data = await response.json();
      const products = (data.documents || [])
        .map((document) => parseFirestoreFields(document.fields || {}))
        .filter((product) => product.id && product.name);
      return products.length ? products : fallbackProducts;
    } catch (error) {
      console.info("Using local product fallback.", error);
      return fallbackProducts;
    }
  }

  window.EXEL_SITE = {
    CART_KEY,
    WHATSAPP_PHONE,
    currencyFormatter,
    formatCurrency,
    loadCart,
    saveCart,
    buildWhatsAppUrl,
    normalizeText,
    loadProductsFromFirestore
  };
})();

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import vm from "node:vm";

const projectId = "vertys-cosmetica";
const databaseId = "(default)";
const gcloudPath = "C:\\Users\\drojasan\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd";

function loadProducts() {
  const source = readFileSync(new URL("../data/product-data.js", import.meta.url), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "product-data.js" });
  return sandbox.window.EXEL_PRODUCTS;
}

function firestoreValue(value) {
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(firestoreValue) } };
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (value && typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, firestoreValue(entry)]))
      }
    };
  }

  return { stringValue: String(value ?? "") };
}

function productToFields(product) {
  const imageFile = basename(product.image);
  const storagePath = `products/${product.id}/${imageFile}`;
  const fields = {
    ...product,
    imageLocalPath: product.image,
    imageStoragePath: storagePath,
    imageStorageBucket: "vertys-cosmetica.firebasestorage.app",
    migratedFrom: "data/product-data.js",
    updatedAtIso: new Date().toISOString()
  };

  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestoreValue(value)]));
}

async function main() {
  const products = loadProducts();
  const token = execFileSync("cmd.exe", ["/c", gcloudPath, "auth", "print-access-token"], { encoding: "utf8" }).trim();
  const writes = products.map((product) => ({
    update: {
      name: `projects/${projectId}/databases/${databaseId}/documents/products/${product.id}`,
      fields: productToFields(product)
    }
  }));

  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:commit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-goog-user-project": projectId
    },
    body: JSON.stringify({ writes })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(payload, null, 2));
  }

  console.log(JSON.stringify({
    migrated: products.length,
    collection: "products",
    projectId,
    writeResults: payload.writeResults?.length ?? 0
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

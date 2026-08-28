import { cp, mkdir } from "node:fs/promises";

await mkdir("dist/data", { recursive: true });
await mkdir("dist/assets", { recursive: true });

await cp("data", "dist/data", { recursive: true });
await cp("assets/catalogo-web", "dist/assets/catalogo-web", { recursive: true });

console.log("Static catalog assets copied to dist.");

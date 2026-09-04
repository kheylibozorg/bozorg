import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true, dereference: true });
}

const wasmSrc = "node_modules/lighter-ts-sdk/wasm";
const wasmNames = ["lighter-signer.wasm", "wasm_exec.js"];
const rootWasm = "wasm";
mkdirSync(rootWasm, { recursive: true });
for (const file of wasmNames) {
  const src = join(wasmSrc, file);
  if (existsSync(src)) copyFileSync(src, join(rootWasm, file));
}

const destDir = ".vercel/output/functions/__server.func/_libs";
if (!existsSync(destDir)) process.exit(0);
mkdirSync(destDir, { recursive: true });
const srcDir = "node_modules/@electric-sql/pglite/dist";
for (const file of ["pglite.data", "pglite.wasm", "initdb.wasm"]) {
  const src = join(srcDir, file);
  if (existsSync(src)) copyFileSync(src, join(destDir, file));
}

const funcRoot = ".vercel/output/functions/__server.func";
const wasmDests = [
  join(funcRoot, "wasm"),
  join(funcRoot, "node_modules/lighter-ts-sdk/wasm"),
  join(funcRoot, "_libs/lighter-ts-sdk/wasm"),
];
for (const dest of wasmDests) {
  mkdirSync(dest, { recursive: true });
  for (const file of wasmNames) {
    const src = join(wasmSrc, file);
    if (existsSync(src)) copyFileSync(src, join(dest, file));
  }
}

// Full SDK (JS + wasm) so a live Lighter order can `import("lighter-ts-sdk")` on Vercel.
copyDir("node_modules/lighter-ts-sdk", join(funcRoot, "node_modules/lighter-ts-sdk"));
for (const dep of ["axios", "dotenv", "ethers", "ws"]) {
  copyDir(join("node_modules", dep), join(funcRoot, "node_modules", dep));
}

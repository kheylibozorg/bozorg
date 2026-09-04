import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSealedSecret, openSecret, persistSecret, sealSecret } from "./secrets.ts";

describe("venue secrets at rest", () => {
  it("seals plaintext so Neon never stores the raw key", () => {
    const plain = "0xabc123secretkey";
    const sealed = sealSecret(plain);
    assert.equal(isSealedSecret(sealed), true);
    assert.equal(sealed.includes(plain), false);
    assert.equal(openSecret(sealed), plain);
  });

  it("does not double-encrypt an already sealed value", () => {
    const sealed = sealSecret("lighter-api-private");
    assert.equal(sealSecret(sealed), sealed);
    assert.equal(openSecret(sealed), "lighter-api-private");
  });

  it("passes through legacy plaintext so existing Neon rows still trade", () => {
    assert.equal(openSecret("legacy-plain-key"), "legacy-plain-key");
    assert.equal(isSealedSecret("legacy-plain-key"), false);
  });

  it("stores empty as null", () => {
    assert.equal(persistSecret(""), null);
    assert.equal(persistSecret("   "), null);
    assert.equal(persistSecret(null), null);
  });
});

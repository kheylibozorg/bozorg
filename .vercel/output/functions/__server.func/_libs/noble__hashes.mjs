import { _ as toBytes$1, a as rotlBL$1, c as split$1, d as aexists, f as anumber, g as swap32IfBE, h as createHasher, i as rotlBH$1, l as Hash$1, m as clean, o as rotlSH$1, p as aoutput, r as sha256$2, s as rotlSL$1, u as abytes, v as u32$1 } from "./noble__curves+noble__hashes.mjs";
//#region node_modules/viem/node_modules/@noble/hashes/esm/sha3.js
/**
* SHA3 (keccak) hash function, based on a new "Sponge function" design.
* Different from older hashes, the internal state is bigger than output size.
*
* Check out [FIPS-202](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf),
* [Website](https://keccak.team/keccak.html),
* [the differences between SHA-3 and Keccak](https://crypto.stackexchange.com/questions/15727/what-are-the-key-differences-between-the-draft-sha-3-standard-and-the-keccak-sub).
*
* Check out `sha3-addons` module for cSHAKE, k12, and others.
* @module
*/
var _0n$1 = BigInt(0);
var _1n$1 = BigInt(1);
var _2n$1 = BigInt(2);
var _7n$1 = BigInt(7);
var _256n$1 = BigInt(256);
var _0x71n$1 = BigInt(113);
var SHA3_PI$1 = [];
var SHA3_ROTL$1 = [];
var _SHA3_IOTA$1 = [];
for (let round = 0, R = _1n$1, x = 1, y = 0; round < 24; round++) {
	[x, y] = [y, (2 * x + 3 * y) % 5];
	SHA3_PI$1.push(2 * (5 * y + x));
	SHA3_ROTL$1.push((round + 1) * (round + 2) / 2 % 64);
	let t = _0n$1;
	for (let j = 0; j < 7; j++) {
		R = (R << _1n$1 ^ (R >> _7n$1) * _0x71n$1) % _256n$1;
		if (R & _2n$1) t ^= _1n$1 << (_1n$1 << /* @__PURE__ */ BigInt(j)) - _1n$1;
	}
	_SHA3_IOTA$1.push(t);
}
var IOTAS = split$1(_SHA3_IOTA$1, true);
var SHA3_IOTA_H$1 = IOTAS[0];
var SHA3_IOTA_L$1 = IOTAS[1];
var rotlH$1 = (h, l, s) => s > 32 ? rotlBH$1(h, l, s) : rotlSH$1(h, l, s);
var rotlL$1 = (h, l, s) => s > 32 ? rotlBL$1(h, l, s) : rotlSL$1(h, l, s);
/** `keccakf1600` internal function, additionally allows to adjust round count. */
function keccakP$1(s, rounds = 24) {
	const B = /* @__PURE__ */ new Uint32Array(10);
	for (let round = 24 - rounds; round < 24; round++) {
		for (let x = 0; x < 10; x++) B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
		for (let x = 0; x < 10; x += 2) {
			const idx1 = (x + 8) % 10;
			const idx0 = (x + 2) % 10;
			const B0 = B[idx0];
			const B1 = B[idx0 + 1];
			const Th = rotlH$1(B0, B1, 1) ^ B[idx1];
			const Tl = rotlL$1(B0, B1, 1) ^ B[idx1 + 1];
			for (let y = 0; y < 50; y += 10) {
				s[x + y] ^= Th;
				s[x + y + 1] ^= Tl;
			}
		}
		let curH = s[2];
		let curL = s[3];
		for (let t = 0; t < 24; t++) {
			const shift = SHA3_ROTL$1[t];
			const Th = rotlH$1(curH, curL, shift);
			const Tl = rotlL$1(curH, curL, shift);
			const PI = SHA3_PI$1[t];
			curH = s[PI];
			curL = s[PI + 1];
			s[PI] = Th;
			s[PI + 1] = Tl;
		}
		for (let y = 0; y < 50; y += 10) {
			for (let x = 0; x < 10; x++) B[x] = s[y + x];
			for (let x = 0; x < 10; x++) s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
		}
		s[0] ^= SHA3_IOTA_H$1[round];
		s[1] ^= SHA3_IOTA_L$1[round];
	}
	clean(B);
}
/** Keccak sponge function. */
var Keccak$1 = class Keccak$1 extends Hash$1 {
	constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
		super();
		this.pos = 0;
		this.posOut = 0;
		this.finished = false;
		this.destroyed = false;
		this.enableXOF = false;
		this.blockLen = blockLen;
		this.suffix = suffix;
		this.outputLen = outputLen;
		this.enableXOF = enableXOF;
		this.rounds = rounds;
		anumber(outputLen);
		if (!(0 < blockLen && blockLen < 200)) throw new Error("only keccak-f1600 function is supported");
		this.state = /* @__PURE__ */ new Uint8Array(200);
		this.state32 = u32$1(this.state);
	}
	clone() {
		return this._cloneInto();
	}
	keccak() {
		swap32IfBE(this.state32);
		keccakP$1(this.state32, this.rounds);
		swap32IfBE(this.state32);
		this.posOut = 0;
		this.pos = 0;
	}
	update(data) {
		aexists(this);
		data = toBytes$1(data);
		abytes(data);
		const { blockLen, state } = this;
		const len = data.length;
		for (let pos = 0; pos < len;) {
			const take = Math.min(blockLen - this.pos, len - pos);
			for (let i = 0; i < take; i++) state[this.pos++] ^= data[pos++];
			if (this.pos === blockLen) this.keccak();
		}
		return this;
	}
	finish() {
		if (this.finished) return;
		this.finished = true;
		const { state, suffix, pos, blockLen } = this;
		state[pos] ^= suffix;
		if ((suffix & 128) !== 0 && pos === blockLen - 1) this.keccak();
		state[blockLen - 1] ^= 128;
		this.keccak();
	}
	writeInto(out) {
		aexists(this, false);
		abytes(out);
		this.finish();
		const bufferOut = this.state;
		const { blockLen } = this;
		for (let pos = 0, len = out.length; pos < len;) {
			if (this.posOut >= blockLen) this.keccak();
			const take = Math.min(blockLen - this.posOut, len - pos);
			out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
			this.posOut += take;
			pos += take;
		}
		return out;
	}
	xofInto(out) {
		if (!this.enableXOF) throw new Error("XOF is not possible for this instance");
		return this.writeInto(out);
	}
	xof(bytes) {
		anumber(bytes);
		return this.xofInto(new Uint8Array(bytes));
	}
	digestInto(out) {
		aoutput(out, this);
		if (this.finished) throw new Error("digest() was already called");
		this.writeInto(out);
		this.destroy();
		return out;
	}
	digest() {
		return this.digestInto(new Uint8Array(this.outputLen));
	}
	destroy() {
		this.destroyed = true;
		clean(this.state);
	}
	_cloneInto(to) {
		const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
		to || (to = new Keccak$1(blockLen, suffix, outputLen, enableXOF, rounds));
		to.state32.set(this.state32);
		to.pos = this.pos;
		to.posOut = this.posOut;
		to.finished = this.finished;
		to.rounds = rounds;
		to.suffix = suffix;
		to.outputLen = outputLen;
		to.enableXOF = enableXOF;
		to.destroyed = this.destroyed;
		return to;
	}
};
var gen$1 = (suffix, blockLen, outputLen) => createHasher(() => new Keccak$1(blockLen, suffix, outputLen));
/** keccak-256 hash function. Different from SHA3-256. */
var keccak_256$1 = /* @__PURE__ */ (() => gen$1(1, 136, 32))();
//#endregion
//#region node_modules/viem/node_modules/@noble/hashes/esm/sha256.js
/**
* SHA2-256 a.k.a. sha256. In JS, it is the fastest hash, even faster than Blake3.
*
* To break sha256 using birthday attack, attackers need to try 2^128 hashes.
* BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
*
* Check out [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf).
* @module
* @deprecated
*/
/** @deprecated Use import from `noble/hashes/sha2` module */
var sha256$1 = sha256$2;
//#endregion
//#region node_modules/ethers/node_modules/@noble/hashes/esm/_assert.js
function number(n) {
	if (!Number.isSafeInteger(n) || n < 0) throw new Error(`Wrong positive integer: ${n}`);
}
function bytes(b, ...lengths) {
	if (!(b instanceof Uint8Array)) throw new Error("Expected Uint8Array");
	if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
}
function hash(hash) {
	if (typeof hash !== "function" || typeof hash.create !== "function") throw new Error("Hash should be wrapped by utils.wrapConstructor");
	number(hash.outputLen);
	number(hash.blockLen);
}
function exists(instance, checkFinished = true) {
	if (instance.destroyed) throw new Error("Hash instance has been destroyed");
	if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
}
function output(out, instance) {
	bytes(out);
	const min = instance.outputLen;
	if (out.length < min) throw new Error(`digestInto() expects output buffer of length at least ${min}`);
}
//#endregion
//#region node_modules/ethers/node_modules/@noble/hashes/esm/_u64.js
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
	if (le) return {
		h: Number(n & U32_MASK64),
		l: Number(n >> _32n & U32_MASK64)
	};
	return {
		h: Number(n >> _32n & U32_MASK64) | 0,
		l: Number(n & U32_MASK64) | 0
	};
}
function split(lst, le = false) {
	let Ah = new Uint32Array(lst.length);
	let Al = new Uint32Array(lst.length);
	for (let i = 0; i < lst.length; i++) {
		const { h, l } = fromBig(lst[i], le);
		[Ah[i], Al[i]] = [h, l];
	}
	return [Ah, Al];
}
var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
//#endregion
//#region node_modules/ethers/node_modules/@noble/hashes/esm/utils.js
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var u8a = (a) => a instanceof Uint8Array;
var u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
var rotr = (word, shift) => word << 32 - shift | word >>> shift;
if (!(new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)) throw new Error("Non little-endian hardware is not supported");
var nextTick = async () => {};
async function asyncLoop(iters, tick, cb) {
	let ts = Date.now();
	for (let i = 0; i < iters; i++) {
		cb(i);
		const diff = Date.now() - ts;
		if (diff >= 0 && diff < tick) continue;
		await nextTick();
		ts += diff;
	}
}
/**
* @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
*/
function utf8ToBytes(str) {
	if (typeof str !== "string") throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
	return new Uint8Array(new TextEncoder().encode(str));
}
/**
* Normalizes (non-hex) string or Uint8Array to Uint8Array.
* Warning: when Uint8Array is passed, it would NOT get copied.
* Keep in mind for future mutable operations.
*/
function toBytes(data) {
	if (typeof data === "string") data = utf8ToBytes(data);
	if (!u8a(data)) throw new Error(`expected Uint8Array, got ${typeof data}`);
	return data;
}
var Hash = class {
	clone() {
		return this._cloneInto();
	}
};
var toStr = {}.toString;
function checkOpts(defaults, opts) {
	if (opts !== void 0 && toStr.call(opts) !== "[object Object]") throw new Error("Options should be object or undefined");
	return Object.assign(defaults, opts);
}
function wrapConstructor(hashCons) {
	const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
	const tmp = hashCons();
	hashC.outputLen = tmp.outputLen;
	hashC.blockLen = tmp.blockLen;
	hashC.create = () => hashCons();
	return hashC;
}
//#endregion
//#region node_modules/ethers/node_modules/@noble/hashes/esm/sha3.js
var [SHA3_PI, SHA3_ROTL, _SHA3_IOTA] = [
	[],
	[],
	[]
];
var _0n = /* @__PURE__ */ BigInt(0);
var _1n = /* @__PURE__ */ BigInt(1);
var _2n = /* @__PURE__ */ BigInt(2);
var _7n = /* @__PURE__ */ BigInt(7);
var _256n = /* @__PURE__ */ BigInt(256);
var _0x71n = /* @__PURE__ */ BigInt(113);
for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
	[x, y] = [y, (2 * x + 3 * y) % 5];
	SHA3_PI.push(2 * (5 * y + x));
	SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
	let t = _0n;
	for (let j = 0; j < 7; j++) {
		R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
		if (R & _2n) t ^= _1n << (_1n << /* @__PURE__ */ BigInt(j)) - _1n;
	}
	_SHA3_IOTA.push(t);
}
var [SHA3_IOTA_H, SHA3_IOTA_L] = /* @__PURE__ */ split(_SHA3_IOTA, true);
var rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
var rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
function keccakP(s, rounds = 24) {
	const B = /* @__PURE__ */ new Uint32Array(10);
	for (let round = 24 - rounds; round < 24; round++) {
		for (let x = 0; x < 10; x++) B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
		for (let x = 0; x < 10; x += 2) {
			const idx1 = (x + 8) % 10;
			const idx0 = (x + 2) % 10;
			const B0 = B[idx0];
			const B1 = B[idx0 + 1];
			const Th = rotlH(B0, B1, 1) ^ B[idx1];
			const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
			for (let y = 0; y < 50; y += 10) {
				s[x + y] ^= Th;
				s[x + y + 1] ^= Tl;
			}
		}
		let curH = s[2];
		let curL = s[3];
		for (let t = 0; t < 24; t++) {
			const shift = SHA3_ROTL[t];
			const Th = rotlH(curH, curL, shift);
			const Tl = rotlL(curH, curL, shift);
			const PI = SHA3_PI[t];
			curH = s[PI];
			curL = s[PI + 1];
			s[PI] = Th;
			s[PI + 1] = Tl;
		}
		for (let y = 0; y < 50; y += 10) {
			for (let x = 0; x < 10; x++) B[x] = s[y + x];
			for (let x = 0; x < 10; x++) s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
		}
		s[0] ^= SHA3_IOTA_H[round];
		s[1] ^= SHA3_IOTA_L[round];
	}
	B.fill(0);
}
var Keccak = class Keccak extends Hash {
	constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
		super();
		this.blockLen = blockLen;
		this.suffix = suffix;
		this.outputLen = outputLen;
		this.enableXOF = enableXOF;
		this.rounds = rounds;
		this.pos = 0;
		this.posOut = 0;
		this.finished = false;
		this.destroyed = false;
		number(outputLen);
		if (0 >= this.blockLen || this.blockLen >= 200) throw new Error("Sha3 supports only keccak-f1600 function");
		this.state = /* @__PURE__ */ new Uint8Array(200);
		this.state32 = u32(this.state);
	}
	keccak() {
		keccakP(this.state32, this.rounds);
		this.posOut = 0;
		this.pos = 0;
	}
	update(data) {
		exists(this);
		const { blockLen, state } = this;
		data = toBytes(data);
		const len = data.length;
		for (let pos = 0; pos < len;) {
			const take = Math.min(blockLen - this.pos, len - pos);
			for (let i = 0; i < take; i++) state[this.pos++] ^= data[pos++];
			if (this.pos === blockLen) this.keccak();
		}
		return this;
	}
	finish() {
		if (this.finished) return;
		this.finished = true;
		const { state, suffix, pos, blockLen } = this;
		state[pos] ^= suffix;
		if ((suffix & 128) !== 0 && pos === blockLen - 1) this.keccak();
		state[blockLen - 1] ^= 128;
		this.keccak();
	}
	writeInto(out) {
		exists(this, false);
		bytes(out);
		this.finish();
		const bufferOut = this.state;
		const { blockLen } = this;
		for (let pos = 0, len = out.length; pos < len;) {
			if (this.posOut >= blockLen) this.keccak();
			const take = Math.min(blockLen - this.posOut, len - pos);
			out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
			this.posOut += take;
			pos += take;
		}
		return out;
	}
	xofInto(out) {
		if (!this.enableXOF) throw new Error("XOF is not possible for this instance");
		return this.writeInto(out);
	}
	xof(bytes) {
		number(bytes);
		return this.xofInto(new Uint8Array(bytes));
	}
	digestInto(out) {
		output(out, this);
		if (this.finished) throw new Error("digest() was already called");
		this.writeInto(out);
		this.destroy();
		return out;
	}
	digest() {
		return this.digestInto(new Uint8Array(this.outputLen));
	}
	destroy() {
		this.destroyed = true;
		this.state.fill(0);
	}
	_cloneInto(to) {
		const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
		to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
		to.state32.set(this.state32);
		to.pos = this.pos;
		to.posOut = this.posOut;
		to.finished = this.finished;
		to.rounds = rounds;
		to.suffix = suffix;
		to.outputLen = outputLen;
		to.enableXOF = enableXOF;
		to.destroyed = this.destroyed;
		return to;
	}
};
var gen = (suffix, blockLen, outputLen) => wrapConstructor(() => new Keccak(blockLen, suffix, outputLen));
/**
* keccak-256 hash function. Different from SHA3-256.
* @param message - that would be hashed
*/
var keccak_256 = /* @__PURE__ */ gen(1, 136, 32);
//#endregion
//#region node_modules/ethers/node_modules/@noble/hashes/esm/_sha2.js
function setBigUint64(view, byteOffset, value, isLE) {
	if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE);
	const _32n = BigInt(32);
	const _u32_max = BigInt(4294967295);
	const wh = Number(value >> _32n & _u32_max);
	const wl = Number(value & _u32_max);
	const h = isLE ? 4 : 0;
	const l = isLE ? 0 : 4;
	view.setUint32(byteOffset + h, wh, isLE);
	view.setUint32(byteOffset + l, wl, isLE);
}
var SHA2 = class extends Hash {
	constructor(blockLen, outputLen, padOffset, isLE) {
		super();
		this.blockLen = blockLen;
		this.outputLen = outputLen;
		this.padOffset = padOffset;
		this.isLE = isLE;
		this.finished = false;
		this.length = 0;
		this.pos = 0;
		this.destroyed = false;
		this.buffer = new Uint8Array(blockLen);
		this.view = createView(this.buffer);
	}
	update(data) {
		exists(this);
		const { view, buffer, blockLen } = this;
		data = toBytes(data);
		const len = data.length;
		for (let pos = 0; pos < len;) {
			const take = Math.min(blockLen - this.pos, len - pos);
			if (take === blockLen) {
				const dataView = createView(data);
				for (; blockLen <= len - pos; pos += blockLen) this.process(dataView, pos);
				continue;
			}
			buffer.set(data.subarray(pos, pos + take), this.pos);
			this.pos += take;
			pos += take;
			if (this.pos === blockLen) {
				this.process(view, 0);
				this.pos = 0;
			}
		}
		this.length += data.length;
		this.roundClean();
		return this;
	}
	digestInto(out) {
		exists(this);
		output(out, this);
		this.finished = true;
		const { buffer, view, blockLen, isLE } = this;
		let { pos } = this;
		buffer[pos++] = 128;
		this.buffer.subarray(pos).fill(0);
		if (this.padOffset > blockLen - pos) {
			this.process(view, 0);
			pos = 0;
		}
		for (let i = pos; i < blockLen; i++) buffer[i] = 0;
		setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
		this.process(view, 0);
		const oview = createView(out);
		const len = this.outputLen;
		if (len % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
		const outLen = len / 4;
		const state = this.get();
		if (outLen > state.length) throw new Error("_sha2: outputLen bigger than state");
		for (let i = 0; i < outLen; i++) oview.setUint32(4 * i, state[i], isLE);
	}
	digest() {
		const { buffer, outputLen } = this;
		this.digestInto(buffer);
		const res = buffer.slice(0, outputLen);
		this.destroy();
		return res;
	}
	_cloneInto(to) {
		to || (to = new this.constructor());
		to.set(...this.get());
		const { blockLen, buffer, length, finished, destroyed, pos } = this;
		to.length = length;
		to.pos = pos;
		to.finished = finished;
		to.destroyed = destroyed;
		if (length % blockLen) to.buffer.set(buffer);
		return to;
	}
};
//#endregion
//#region node_modules/ethers/node_modules/@noble/hashes/esm/ripemd160.js
var Rho = /* @__PURE__ */ new Uint8Array([
	7,
	4,
	13,
	1,
	10,
	6,
	15,
	3,
	12,
	0,
	9,
	5,
	2,
	14,
	11,
	8
]);
var Id = /* @__PURE__ */ Uint8Array.from({ length: 16 }, (_, i) => i);
var Pi = /* @__PURE__ */ Id.map((i) => (9 * i + 5) % 16);
var idxL = [Id];
var idxR = [Pi];
for (let i = 0; i < 4; i++) for (let j of [idxL, idxR]) j.push(j[i].map((k) => Rho[k]));
var shifts = /* @__PURE__ */ [
	[
		11,
		14,
		15,
		12,
		5,
		8,
		7,
		9,
		11,
		13,
		14,
		15,
		6,
		7,
		9,
		8
	],
	[
		12,
		13,
		11,
		15,
		6,
		9,
		9,
		7,
		12,
		15,
		11,
		13,
		7,
		8,
		7,
		7
	],
	[
		13,
		15,
		14,
		11,
		7,
		7,
		6,
		8,
		13,
		14,
		13,
		12,
		5,
		5,
		6,
		9
	],
	[
		14,
		11,
		12,
		14,
		8,
		6,
		5,
		5,
		15,
		12,
		15,
		14,
		9,
		9,
		8,
		6
	],
	[
		15,
		12,
		13,
		13,
		9,
		5,
		8,
		6,
		14,
		11,
		12,
		11,
		8,
		6,
		5,
		5
	]
].map((i) => new Uint8Array(i));
var shiftsL = /* @__PURE__ */ idxL.map((idx, i) => idx.map((j) => shifts[i][j]));
var shiftsR = /* @__PURE__ */ idxR.map((idx, i) => idx.map((j) => shifts[i][j]));
var Kl = /* @__PURE__ */ new Uint32Array([
	0,
	1518500249,
	1859775393,
	2400959708,
	2840853838
]);
var Kr = /* @__PURE__ */ new Uint32Array([
	1352829926,
	1548603684,
	1836072691,
	2053994217,
	0
]);
var rotl$1 = (word, shift) => word << shift | word >>> 32 - shift;
function f(group, x, y, z) {
	if (group === 0) return x ^ y ^ z;
	else if (group === 1) return x & y | ~x & z;
	else if (group === 2) return (x | ~y) ^ z;
	else if (group === 3) return x & z | y & ~z;
	else return x ^ (y | ~z);
}
var BUF = /* @__PURE__ */ new Uint32Array(16);
var RIPEMD160 = class extends SHA2 {
	constructor() {
		super(64, 20, 8, true);
		this.h0 = 1732584193;
		this.h1 = -271733879;
		this.h2 = -1732584194;
		this.h3 = 271733878;
		this.h4 = -1009589776;
	}
	get() {
		const { h0, h1, h2, h3, h4 } = this;
		return [
			h0,
			h1,
			h2,
			h3,
			h4
		];
	}
	set(h0, h1, h2, h3, h4) {
		this.h0 = h0 | 0;
		this.h1 = h1 | 0;
		this.h2 = h2 | 0;
		this.h3 = h3 | 0;
		this.h4 = h4 | 0;
	}
	process(view, offset) {
		for (let i = 0; i < 16; i++, offset += 4) BUF[i] = view.getUint32(offset, true);
		let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
		for (let group = 0; group < 5; group++) {
			const rGroup = 4 - group;
			const hbl = Kl[group], hbr = Kr[group];
			const rl = idxL[group], rr = idxR[group];
			const sl = shiftsL[group], sr = shiftsR[group];
			for (let i = 0; i < 16; i++) {
				const tl = rotl$1(al + f(group, bl, cl, dl) + BUF[rl[i]] + hbl, sl[i]) + el | 0;
				al = el, el = dl, dl = rotl$1(cl, 10) | 0, cl = bl, bl = tl;
			}
			for (let i = 0; i < 16; i++) {
				const tr = rotl$1(ar + f(rGroup, br, cr, dr) + BUF[rr[i]] + hbr, sr[i]) + er | 0;
				ar = er, er = dr, dr = rotl$1(cr, 10) | 0, cr = br, br = tr;
			}
		}
		this.set(this.h1 + cl + dr | 0, this.h2 + dl + er | 0, this.h3 + el + ar | 0, this.h4 + al + br | 0, this.h0 + bl + cr | 0);
	}
	roundClean() {
		BUF.fill(0);
	}
	destroy() {
		this.destroyed = true;
		this.buffer.fill(0);
		this.set(0, 0, 0, 0, 0);
	}
};
/**
* RIPEMD-160 - a hash function from 1990s.
* @param message - msg that would be hashed
*/
var ripemd160 = /* @__PURE__ */ wrapConstructor(() => new RIPEMD160());
//#endregion
//#region node_modules/ethers/node_modules/@noble/hashes/esm/sha256.js
var Chi = (a, b, c) => a & b ^ ~a & c;
var Maj = (a, b, c) => a & b ^ a & c ^ b & c;
var SHA256_K = /* @__PURE__ */ new Uint32Array([
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
]);
var IV = /* @__PURE__ */ new Uint32Array([
	1779033703,
	3144134277,
	1013904242,
	2773480762,
	1359893119,
	2600822924,
	528734635,
	1541459225
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA256 = class extends SHA2 {
	constructor() {
		super(64, 32, 8, false);
		this.A = IV[0] | 0;
		this.B = IV[1] | 0;
		this.C = IV[2] | 0;
		this.D = IV[3] | 0;
		this.E = IV[4] | 0;
		this.F = IV[5] | 0;
		this.G = IV[6] | 0;
		this.H = IV[7] | 0;
	}
	get() {
		const { A, B, C, D, E, F, G, H } = this;
		return [
			A,
			B,
			C,
			D,
			E,
			F,
			G,
			H
		];
	}
	set(A, B, C, D, E, F, G, H) {
		this.A = A | 0;
		this.B = B | 0;
		this.C = C | 0;
		this.D = D | 0;
		this.E = E | 0;
		this.F = F | 0;
		this.G = G | 0;
		this.H = H | 0;
	}
	process(view, offset) {
		for (let i = 0; i < 16; i++, offset += 4) SHA256_W[i] = view.getUint32(offset, false);
		for (let i = 16; i < 64; i++) {
			const W15 = SHA256_W[i - 15];
			const W2 = SHA256_W[i - 2];
			const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
			const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
			SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
		}
		let { A, B, C, D, E, F, G, H } = this;
		for (let i = 0; i < 64; i++) {
			const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
			const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
			const T2 = (rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22)) + Maj(A, B, C) | 0;
			H = G;
			G = F;
			F = E;
			E = D + T1 | 0;
			D = C;
			C = B;
			B = A;
			A = T1 + T2 | 0;
		}
		A = A + this.A | 0;
		B = B + this.B | 0;
		C = C + this.C | 0;
		D = D + this.D | 0;
		E = E + this.E | 0;
		F = F + this.F | 0;
		G = G + this.G | 0;
		H = H + this.H | 0;
		this.set(A, B, C, D, E, F, G, H);
	}
	roundClean() {
		SHA256_W.fill(0);
	}
	destroy() {
		this.set(0, 0, 0, 0, 0, 0, 0, 0);
		this.buffer.fill(0);
	}
};
/**
* SHA2-256 hash function
* @param message - data that would be hashed
*/
var sha256 = /* @__PURE__ */ wrapConstructor(() => new SHA256());
//#endregion
//#region node_modules/ethers/node_modules/@noble/hashes/esm/hmac.js
var HMAC = class extends Hash {
	constructor(hash$2, _key) {
		super();
		this.finished = false;
		this.destroyed = false;
		hash(hash$2);
		const key = toBytes(_key);
		this.iHash = hash$2.create();
		if (typeof this.iHash.update !== "function") throw new Error("Expected instance of class which extends utils.Hash");
		this.blockLen = this.iHash.blockLen;
		this.outputLen = this.iHash.outputLen;
		const blockLen = this.blockLen;
		const pad = new Uint8Array(blockLen);
		pad.set(key.length > blockLen ? hash$2.create().update(key).digest() : key);
		for (let i = 0; i < pad.length; i++) pad[i] ^= 54;
		this.iHash.update(pad);
		this.oHash = hash$2.create();
		for (let i = 0; i < pad.length; i++) pad[i] ^= 106;
		this.oHash.update(pad);
		pad.fill(0);
	}
	update(buf) {
		exists(this);
		this.iHash.update(buf);
		return this;
	}
	digestInto(out) {
		exists(this);
		bytes(out, this.outputLen);
		this.finished = true;
		this.iHash.digestInto(out);
		this.oHash.update(out);
		this.oHash.digestInto(out);
		this.destroy();
	}
	digest() {
		const out = new Uint8Array(this.oHash.outputLen);
		this.digestInto(out);
		return out;
	}
	_cloneInto(to) {
		to || (to = Object.create(Object.getPrototypeOf(this), {}));
		const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
		to = to;
		to.finished = finished;
		to.destroyed = destroyed;
		to.blockLen = blockLen;
		to.outputLen = outputLen;
		to.oHash = oHash._cloneInto(to.oHash);
		to.iHash = iHash._cloneInto(to.iHash);
		return to;
	}
	destroy() {
		this.destroyed = true;
		this.oHash.destroy();
		this.iHash.destroy();
	}
};
/**
* HMAC: RFC2104 message authentication code.
* @param hash - function that would be used e.g. sha256
* @param key - message key
* @param message - message data
*/
var hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
hmac.create = (hash, key) => new HMAC(hash, key);
//#endregion
//#region node_modules/ethers/node_modules/@noble/hashes/esm/pbkdf2.js
function pbkdf2Init(hash$1, _password, _salt, _opts) {
	hash(hash$1);
	const { c, dkLen, asyncTick } = checkOpts({
		dkLen: 32,
		asyncTick: 10
	}, _opts);
	number(c);
	number(dkLen);
	number(asyncTick);
	if (c < 1) throw new Error("PBKDF2: iterations (c) should be >= 1");
	const password = toBytes(_password);
	const salt = toBytes(_salt);
	const DK = new Uint8Array(dkLen);
	const PRF = hmac.create(hash$1, password);
	return {
		c,
		dkLen,
		asyncTick,
		DK,
		PRF,
		PRFSalt: PRF._cloneInto().update(salt)
	};
}
function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
	PRF.destroy();
	PRFSalt.destroy();
	if (prfW) prfW.destroy();
	u.fill(0);
	return DK;
}
/**
* PBKDF2-HMAC: RFC 2898 key derivation function
* @param hash - hash function that would be used e.g. sha256
* @param password - password from which a derived key is generated
* @param salt - cryptographic salt
* @param opts - {c, dkLen} where c is work factor and dkLen is output message size
*/
function pbkdf2(hash, password, salt, opts) {
	const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash, password, salt, opts);
	let prfW;
	const arr = /* @__PURE__ */ new Uint8Array(4);
	const view = createView(arr);
	const u = new Uint8Array(PRF.outputLen);
	for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
		const Ti = DK.subarray(pos, pos + PRF.outputLen);
		view.setInt32(0, ti, false);
		(prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
		Ti.set(u.subarray(0, Ti.length));
		for (let ui = 1; ui < c; ui++) {
			PRF._cloneInto(prfW).update(u).digestInto(u);
			for (let i = 0; i < Ti.length; i++) Ti[i] ^= u[i];
		}
	}
	return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
}
//#endregion
//#region node_modules/ethers/node_modules/@noble/hashes/esm/scrypt.js
var rotl = (a, b) => a << b | a >>> 32 - b;
function XorAndSalsa(prev, pi, input, ii, out, oi) {
	let y00 = prev[pi++] ^ input[ii++], y01 = prev[pi++] ^ input[ii++];
	let y02 = prev[pi++] ^ input[ii++], y03 = prev[pi++] ^ input[ii++];
	let y04 = prev[pi++] ^ input[ii++], y05 = prev[pi++] ^ input[ii++];
	let y06 = prev[pi++] ^ input[ii++], y07 = prev[pi++] ^ input[ii++];
	let y08 = prev[pi++] ^ input[ii++], y09 = prev[pi++] ^ input[ii++];
	let y10 = prev[pi++] ^ input[ii++], y11 = prev[pi++] ^ input[ii++];
	let y12 = prev[pi++] ^ input[ii++], y13 = prev[pi++] ^ input[ii++];
	let y14 = prev[pi++] ^ input[ii++], y15 = prev[pi++] ^ input[ii++];
	let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
	for (let i = 0; i < 8; i += 2) {
		x04 ^= rotl(x00 + x12 | 0, 7);
		x08 ^= rotl(x04 + x00 | 0, 9);
		x12 ^= rotl(x08 + x04 | 0, 13);
		x00 ^= rotl(x12 + x08 | 0, 18);
		x09 ^= rotl(x05 + x01 | 0, 7);
		x13 ^= rotl(x09 + x05 | 0, 9);
		x01 ^= rotl(x13 + x09 | 0, 13);
		x05 ^= rotl(x01 + x13 | 0, 18);
		x14 ^= rotl(x10 + x06 | 0, 7);
		x02 ^= rotl(x14 + x10 | 0, 9);
		x06 ^= rotl(x02 + x14 | 0, 13);
		x10 ^= rotl(x06 + x02 | 0, 18);
		x03 ^= rotl(x15 + x11 | 0, 7);
		x07 ^= rotl(x03 + x15 | 0, 9);
		x11 ^= rotl(x07 + x03 | 0, 13);
		x15 ^= rotl(x11 + x07 | 0, 18);
		x01 ^= rotl(x00 + x03 | 0, 7);
		x02 ^= rotl(x01 + x00 | 0, 9);
		x03 ^= rotl(x02 + x01 | 0, 13);
		x00 ^= rotl(x03 + x02 | 0, 18);
		x06 ^= rotl(x05 + x04 | 0, 7);
		x07 ^= rotl(x06 + x05 | 0, 9);
		x04 ^= rotl(x07 + x06 | 0, 13);
		x05 ^= rotl(x04 + x07 | 0, 18);
		x11 ^= rotl(x10 + x09 | 0, 7);
		x08 ^= rotl(x11 + x10 | 0, 9);
		x09 ^= rotl(x08 + x11 | 0, 13);
		x10 ^= rotl(x09 + x08 | 0, 18);
		x12 ^= rotl(x15 + x14 | 0, 7);
		x13 ^= rotl(x12 + x15 | 0, 9);
		x14 ^= rotl(x13 + x12 | 0, 13);
		x15 ^= rotl(x14 + x13 | 0, 18);
	}
	out[oi++] = y00 + x00 | 0;
	out[oi++] = y01 + x01 | 0;
	out[oi++] = y02 + x02 | 0;
	out[oi++] = y03 + x03 | 0;
	out[oi++] = y04 + x04 | 0;
	out[oi++] = y05 + x05 | 0;
	out[oi++] = y06 + x06 | 0;
	out[oi++] = y07 + x07 | 0;
	out[oi++] = y08 + x08 | 0;
	out[oi++] = y09 + x09 | 0;
	out[oi++] = y10 + x10 | 0;
	out[oi++] = y11 + x11 | 0;
	out[oi++] = y12 + x12 | 0;
	out[oi++] = y13 + x13 | 0;
	out[oi++] = y14 + x14 | 0;
	out[oi++] = y15 + x15 | 0;
}
function BlockMix(input, ii, out, oi, r) {
	let head = oi + 0;
	let tail = oi + 16 * r;
	for (let i = 0; i < 16; i++) out[tail + i] = input[ii + (2 * r - 1) * 16 + i];
	for (let i = 0; i < r; i++, head += 16, ii += 16) {
		XorAndSalsa(out, tail, input, ii, out, head);
		if (i > 0) tail += 16;
		XorAndSalsa(out, head, input, ii += 16, out, tail);
	}
}
function scryptInit(password, salt, _opts) {
	const { N, r, p, dkLen, asyncTick, maxmem, onProgress } = checkOpts({
		dkLen: 32,
		asyncTick: 10,
		maxmem: 1024 ** 3 + 1024
	}, _opts);
	number(N);
	number(r);
	number(p);
	number(dkLen);
	number(asyncTick);
	number(maxmem);
	if (onProgress !== void 0 && typeof onProgress !== "function") throw new Error("progressCb should be function");
	const blockSize = 128 * r;
	const blockSize32 = blockSize / 4;
	if (N <= 1 || (N & N - 1) !== 0 || N >= 2 ** (blockSize / 8) || N > 2 ** 32) throw new Error("Scrypt: N must be larger than 1, a power of 2, less than 2^(128 * r / 8) and less than 2^32");
	if (p < 0 || p > (2 ** 32 - 1) * 32 / blockSize) throw new Error("Scrypt: p must be a positive integer less than or equal to ((2^32 - 1) * 32) / (128 * r)");
	if (dkLen < 0 || dkLen > (2 ** 32 - 1) * 32) throw new Error("Scrypt: dkLen should be positive integer less than or equal to (2^32 - 1) * 32");
	const memUsed = blockSize * (N + p);
	if (memUsed > maxmem) throw new Error(`Scrypt: parameters too large, ${memUsed} (128 * r * (N + p)) > ${maxmem} (maxmem)`);
	const B = pbkdf2(sha256, password, salt, {
		c: 1,
		dkLen: blockSize * p
	});
	const B32 = u32(B);
	const V = u32(new Uint8Array(blockSize * N));
	const tmp = u32(new Uint8Array(blockSize));
	let blockMixCb = () => {};
	if (onProgress) {
		const totalBlockMix = 2 * N * p;
		const callbackPer = Math.max(Math.floor(totalBlockMix / 1e4), 1);
		let blockMixCnt = 0;
		blockMixCb = () => {
			blockMixCnt++;
			if (onProgress && (!(blockMixCnt % callbackPer) || blockMixCnt === totalBlockMix)) onProgress(blockMixCnt / totalBlockMix);
		};
	}
	return {
		N,
		r,
		p,
		dkLen,
		blockSize32,
		V,
		B32,
		B,
		tmp,
		blockMixCb,
		asyncTick
	};
}
function scryptOutput(password, dkLen, B, V, tmp) {
	const res = pbkdf2(sha256, password, B, {
		c: 1,
		dkLen
	});
	B.fill(0);
	V.fill(0);
	tmp.fill(0);
	return res;
}
/**
* Scrypt KDF from RFC 7914.
* @param password - pass
* @param salt - salt
* @param opts - parameters
* - `N` is cpu/mem work factor (power of 2 e.g. 2**18)
* - `r` is block size (8 is common), fine-tunes sequential memory read size and performance
* - `p` is parallelization factor (1 is common)
* - `dkLen` is output key length in bytes e.g. 32.
* - `asyncTick` - (default: 10) max time in ms for which async function can block execution
* - `maxmem` - (default: `1024 ** 3 + 1024` aka 1GB+1KB). A limit that the app could use for scrypt
* - `onProgress` - callback function that would be executed for progress report
* @returns Derived key
*/
function scrypt(password, salt, opts) {
	const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb } = scryptInit(password, salt, opts);
	for (let pi = 0; pi < p; pi++) {
		const Pi = blockSize32 * pi;
		for (let i = 0; i < blockSize32; i++) V[i] = B32[Pi + i];
		for (let i = 0, pos = 0; i < N - 1; i++) {
			BlockMix(V, pos, V, pos += blockSize32, r);
			blockMixCb();
		}
		BlockMix(V, (N - 1) * blockSize32, B32, Pi, r);
		blockMixCb();
		for (let i = 0; i < N; i++) {
			const j = B32[Pi + blockSize32 - 16] % N;
			for (let k = 0; k < blockSize32; k++) tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
			BlockMix(tmp, 0, B32, Pi, r);
			blockMixCb();
		}
	}
	return scryptOutput(password, dkLen, B, V, tmp);
}
/**
* Scrypt KDF from RFC 7914.
*/
async function scryptAsync(password, salt, opts) {
	const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick } = scryptInit(password, salt, opts);
	for (let pi = 0; pi < p; pi++) {
		const Pi = blockSize32 * pi;
		for (let i = 0; i < blockSize32; i++) V[i] = B32[Pi + i];
		let pos = 0;
		await asyncLoop(N - 1, asyncTick, () => {
			BlockMix(V, pos, V, pos += blockSize32, r);
			blockMixCb();
		});
		BlockMix(V, (N - 1) * blockSize32, B32, Pi, r);
		blockMixCb();
		await asyncLoop(N, asyncTick, () => {
			const j = B32[Pi + blockSize32 - 16] % N;
			for (let k = 0; k < blockSize32; k++) tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
			BlockMix(tmp, 0, B32, Pi, r);
			blockMixCb();
		});
	}
	return scryptOutput(password, dkLen, B, V, tmp);
}
//#endregion
export { sha256$1 as a, keccak_256 as i, scryptAsync as n, keccak_256$1 as o, ripemd160 as r, scrypt as t };

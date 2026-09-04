import { n as secp256k1 } from "./noble__curves+noble__hashes.mjs";
import { a as sha256$1, o as keccak_256 } from "./noble__hashes.mjs";
//#region node_modules/viem/_esm/errors/version.js
var version = "2.56.3";
//#endregion
//#region node_modules/viem/_esm/errors/base.js
var errorConfig = {
	getDocsUrl: ({ docsBaseUrl, docsPath = "", docsSlug }) => docsPath ? `${docsBaseUrl ?? "https://viem.sh"}${docsPath}${docsSlug ? `#${docsSlug}` : ""}` : void 0,
	version: `viem@${version}`
};
var BaseError = class BaseError extends Error {
	constructor(shortMessage, args = {}) {
		const details = (() => {
			if (args.cause instanceof BaseError) return args.cause.details;
			if (args.cause?.message) return args.cause.message;
			return args.details;
		})();
		const docsPath = (() => {
			if (args.cause instanceof BaseError) return args.cause.docsPath || args.docsPath;
			return args.docsPath;
		})();
		const docsUrl = errorConfig.getDocsUrl?.({
			...args,
			docsPath
		});
		const message = [
			shortMessage || "An error occurred.",
			"",
			...args.metaMessages ? [...args.metaMessages, ""] : [],
			...docsUrl ? [`Docs: ${docsUrl}`] : [],
			...details ? [`Details: ${details}`] : [],
			...errorConfig.version ? [`Version: ${errorConfig.version}`] : []
		].join("\n");
		super(message, args.cause ? { cause: args.cause } : void 0);
		Object.defineProperty(this, "details", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "docsPath", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "metaMessages", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "shortMessage", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "version", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "BaseError"
		});
		this.details = details;
		this.docsPath = docsPath;
		this.metaMessages = args.metaMessages;
		this.name = args.name ?? this.name;
		this.shortMessage = shortMessage;
		this.version = version;
	}
	walk(fn) {
		return walk(this, fn);
	}
};
function walk(err, fn) {
	if (fn?.(err)) return err;
	if (err && typeof err === "object" && "cause" in err && err.cause !== void 0) return walk(err.cause, fn);
	return fn ? null : err;
}
//#endregion
//#region node_modules/viem/_esm/errors/encoding.js
var IntegerOutOfRangeError = class extends BaseError {
	constructor({ max, min, signed, size, value }) {
		super(`Number "${value}" is not in safe ${size ? `${size * 8}-bit ${signed ? "signed" : "unsigned"} ` : ""}integer range ${max ? `(${min} to ${max})` : `(above ${min})`}`, { name: "IntegerOutOfRangeError" });
	}
};
var SizeOverflowError = class extends BaseError {
	constructor({ givenSize, maxSize }) {
		super(`Size cannot exceed ${maxSize} bytes. Given size: ${givenSize} bytes.`, { name: "SizeOverflowError" });
	}
};
//#endregion
//#region node_modules/viem/_esm/errors/data.js
var SliceOffsetOutOfBoundsError = class extends BaseError {
	constructor({ offset, position, size }) {
		super(`Slice ${position === "start" ? "starting" : "ending"} at offset "${offset}" is out-of-bounds (size: ${size}).`, { name: "SliceOffsetOutOfBoundsError" });
	}
};
var SizeExceedsPaddingSizeError = class extends BaseError {
	constructor({ size, targetSize, type }) {
		super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (${size}) exceeds padding size (${targetSize}).`, { name: "SizeExceedsPaddingSizeError" });
	}
};
//#endregion
//#region node_modules/viem/_esm/utils/data/pad.js
function pad(hexOrBytes, { dir, size = 32 } = {}) {
	if (typeof hexOrBytes === "string") return padHex(hexOrBytes, {
		dir,
		size
	});
	return padBytes(hexOrBytes, {
		dir,
		size
	});
}
function padHex(hex_, { dir, size = 32 } = {}) {
	if (size === null) return hex_;
	const hex = hex_.replace("0x", "");
	if (hex.length > size * 2) throw new SizeExceedsPaddingSizeError({
		size: Math.ceil(hex.length / 2),
		targetSize: size,
		type: "hex"
	});
	return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size * 2, "0")}`;
}
function padBytes(bytes, { dir, size = 32 } = {}) {
	if (size === null) return bytes;
	if (bytes.length > size) throw new SizeExceedsPaddingSizeError({
		size: bytes.length,
		targetSize: size,
		type: "bytes"
	});
	const paddedBytes = new Uint8Array(size);
	for (let i = 0; i < size; i++) {
		const padEnd = dir === "right";
		paddedBytes[padEnd ? i : size - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
	}
	return paddedBytes;
}
//#endregion
//#region node_modules/viem/_esm/utils/data/isHex.js
function isHex(value, { strict = true } = {}) {
	if (!value) return false;
	if (typeof value !== "string") return false;
	return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith("0x");
}
//#endregion
//#region node_modules/viem/_esm/utils/data/size.js
/**
* @description Retrieves the size of the value (in bytes).
*
* @param value The value (hex or byte array) to retrieve the size of.
* @returns The size of the value (in bytes).
*/
function size(value) {
	if (isHex(value, { strict: false })) return Math.ceil((value.length - 2) / 2);
	return value.length;
}
//#endregion
//#region node_modules/viem/_esm/utils/data/trim.js
function trim(hexOrBytes, { dir = "left" } = {}) {
	let data = typeof hexOrBytes === "string" ? hexOrBytes.replace("0x", "") : hexOrBytes;
	let sliceLength = 0;
	for (let i = 0; i < data.length - 1; i++) if (data[dir === "left" ? i : data.length - i - 1].toString() === "0") sliceLength++;
	else break;
	data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
	if (typeof hexOrBytes === "string") {
		if (data.length === 1 && dir === "right") data = `${data}0`;
		return `0x${data.length % 2 === 1 ? `0${data}` : data}`;
	}
	return data;
}
//#endregion
//#region node_modules/viem/_esm/utils/encoding/toBytes.js
var encoder$1 = /*#__PURE__*/ new TextEncoder();
/**
* Encodes a UTF-8 string, hex value, bigint, number or boolean to a byte array.
*
* - Docs: https://viem.sh/docs/utilities/toBytes
* - Example: https://viem.sh/docs/utilities/toBytes#usage
*
* @param value Value to encode.
* @param opts Options.
* @returns Byte array value.
*
* @example
* import { toBytes } from 'viem'
* const data = toBytes('Hello world')
* // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
*
* @example
* import { toBytes } from 'viem'
* const data = toBytes(420)
* // Uint8Array([1, 164])
*
* @example
* import { toBytes } from 'viem'
* const data = toBytes(420, { size: 4 })
* // Uint8Array([0, 0, 1, 164])
*/
function toBytes(value, opts = {}) {
	if (typeof value === "number" || typeof value === "bigint") return numberToBytes(value, opts);
	if (typeof value === "boolean") return boolToBytes(value, opts);
	if (isHex(value)) return hexToBytes(value, opts);
	return stringToBytes(value, opts);
}
/**
* Encodes a boolean into a byte array.
*
* - Docs: https://viem.sh/docs/utilities/toBytes#booltobytes
*
* @param value Boolean value to encode.
* @param opts Options.
* @returns Byte array value.
*
* @example
* import { boolToBytes } from 'viem'
* const data = boolToBytes(true)
* // Uint8Array([1])
*
* @example
* import { boolToBytes } from 'viem'
* const data = boolToBytes(true, { size: 32 })
* // Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
*/
function boolToBytes(value, opts = {}) {
	const bytes = /* @__PURE__ */ new Uint8Array(1);
	bytes[0] = Number(value);
	if (typeof opts.size === "number") {
		assertSize(bytes, { size: opts.size });
		return pad(bytes, { size: opts.size });
	}
	return bytes;
}
var charCodeMap = {
	zero: 48,
	nine: 57,
	A: 65,
	F: 70,
	a: 97,
	f: 102
};
function charCodeToBase16(char) {
	if (char >= charCodeMap.zero && char <= charCodeMap.nine) return char - charCodeMap.zero;
	if (char >= charCodeMap.A && char <= charCodeMap.F) return char - (charCodeMap.A - 10);
	if (char >= charCodeMap.a && char <= charCodeMap.f) return char - (charCodeMap.a - 10);
}
/**
* Encodes a hex string into a byte array.
*
* - Docs: https://viem.sh/docs/utilities/toBytes#hextobytes
*
* @param hex Hex string to encode.
* @param opts Options.
* @returns Byte array value.
*
* @example
* import { hexToBytes } from 'viem'
* const data = hexToBytes('0x48656c6c6f20776f726c6421')
* // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
*
* @example
* import { hexToBytes } from 'viem'
* const data = hexToBytes('0x48656c6c6f20776f726c6421', { size: 32 })
* // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
*/
function hexToBytes(hex_, opts = {}) {
	let hex = hex_;
	if (opts.size) {
		assertSize(hex, { size: opts.size });
		hex = pad(hex, {
			dir: "right",
			size: opts.size
		});
	}
	let hexString = hex.slice(2);
	if (hexString.length % 2) hexString = `0${hexString}`;
	const length = hexString.length / 2;
	const bytes = new Uint8Array(length);
	for (let index = 0, j = 0; index < length; index++) {
		const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
		const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
		if (nibbleLeft === void 0 || nibbleRight === void 0) throw new BaseError(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
		bytes[index] = nibbleLeft * 16 + nibbleRight;
	}
	return bytes;
}
/**
* Encodes a number into a byte array.
*
* - Docs: https://viem.sh/docs/utilities/toBytes#numbertobytes
*
* @param value Number to encode.
* @param opts Options.
* @returns Byte array value.
*
* @example
* import { numberToBytes } from 'viem'
* const data = numberToBytes(420)
* // Uint8Array([1, 164])
*
* @example
* import { numberToBytes } from 'viem'
* const data = numberToBytes(420, { size: 4 })
* // Uint8Array([0, 0, 1, 164])
*/
function numberToBytes(value, opts) {
	return hexToBytes(numberToHex(value, opts));
}
/**
* Encodes a UTF-8 string into a byte array.
*
* - Docs: https://viem.sh/docs/utilities/toBytes#stringtobytes
*
* @param value String to encode.
* @param opts Options.
* @returns Byte array value.
*
* @example
* import { stringToBytes } from 'viem'
* const data = stringToBytes('Hello world!')
* // Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33])
*
* @example
* import { stringToBytes } from 'viem'
* const data = stringToBytes('Hello world!', { size: 32 })
* // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
*/
function stringToBytes(value, opts = {}) {
	const bytes = encoder$1.encode(value);
	if (typeof opts.size === "number") {
		assertSize(bytes, { size: opts.size });
		return pad(bytes, {
			dir: "right",
			size: opts.size
		});
	}
	return bytes;
}
//#endregion
//#region node_modules/viem/_esm/utils/encoding/fromHex.js
function assertSize(hexOrBytes, { size: size$1 }) {
	if (size(hexOrBytes) > size$1) throw new SizeOverflowError({
		givenSize: size(hexOrBytes),
		maxSize: size$1
	});
}
/**
* Decodes a hex value into a bigint.
*
* - Docs: https://viem.sh/docs/utilities/fromHex#hextobigint
*
* @param hex Hex value to decode.
* @param opts Options.
* @returns BigInt value.
*
* @example
* import { hexToBigInt } from 'viem'
* const data = hexToBigInt('0x1a4', { signed: true })
* // 420n
*
* @example
* import { hexToBigInt } from 'viem'
* const data = hexToBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
* // 420n
*/
function hexToBigInt(hex, opts = {}) {
	const { signed } = opts;
	if (opts.size) assertSize(hex, { size: opts.size });
	const value = BigInt(hex);
	if (!signed) return value;
	const size = Math.ceil((hex.length - 2) / 2);
	if (value <= (1n << BigInt(size) * 8n - 1n) - 1n) return value;
	return value - BigInt(`0x${"f".padStart(size * 2, "f")}`) - 1n;
}
/**
* Decodes a hex string into a number.
*
* - Docs: https://viem.sh/docs/utilities/fromHex#hextonumber
*
* @param hex Hex value to decode.
* @param opts Options.
* @returns Number value.
*
* @example
* import { hexToNumber } from 'viem'
* const data = hexToNumber('0x1a4')
* // 420
*
* @example
* import { hexToNumber } from 'viem'
* const data = hexToNumber('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
* // 420
*/
function hexToNumber(hex, opts = {}) {
	const value = hexToBigInt(hex, opts);
	const number = Number(value);
	if (!Number.isSafeInteger(number)) throw new IntegerOutOfRangeError({
		max: `${Number.MAX_SAFE_INTEGER}`,
		min: `${Number.MIN_SAFE_INTEGER}`,
		signed: opts.signed,
		size: opts.size,
		value: `${value}n`
	});
	return number;
}
//#endregion
//#region node_modules/viem/_esm/utils/encoding/toHex.js
var hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
/**
* Encodes a string, number, bigint, or ByteArray into a hex string
*
* - Docs: https://viem.sh/docs/utilities/toHex
* - Example: https://viem.sh/docs/utilities/toHex#usage
*
* @param value Value to encode.
* @param opts Options.
* @returns Hex value.
*
* @example
* import { toHex } from 'viem'
* const data = toHex('Hello world')
* // '0x48656c6c6f20776f726c6421'
*
* @example
* import { toHex } from 'viem'
* const data = toHex(420)
* // '0x1a4'
*
* @example
* import { toHex } from 'viem'
* const data = toHex('Hello world', { size: 32 })
* // '0x48656c6c6f20776f726c64210000000000000000000000000000000000000000'
*/
function toHex(value, opts = {}) {
	if (typeof value === "number" || typeof value === "bigint") return numberToHex(value, opts);
	if (typeof value === "string") return stringToHex(value, opts);
	if (typeof value === "boolean") return boolToHex(value, opts);
	return bytesToHex(value, opts);
}
/**
* Encodes a boolean into a hex string
*
* - Docs: https://viem.sh/docs/utilities/toHex#booltohex
*
* @param value Value to encode.
* @param opts Options.
* @returns Hex value.
*
* @example
* import { boolToHex } from 'viem'
* const data = boolToHex(true)
* // '0x1'
*
* @example
* import { boolToHex } from 'viem'
* const data = boolToHex(false)
* // '0x0'
*
* @example
* import { boolToHex } from 'viem'
* const data = boolToHex(true, { size: 32 })
* // '0x0000000000000000000000000000000000000000000000000000000000000001'
*/
function boolToHex(value, opts = {}) {
	const hex = `0x${Number(value)}`;
	if (typeof opts.size === "number") {
		assertSize(hex, { size: opts.size });
		return pad(hex, { size: opts.size });
	}
	return hex;
}
/**
* Encodes a bytes array into a hex string
*
* - Docs: https://viem.sh/docs/utilities/toHex#bytestohex
*
* @param value Value to encode.
* @param opts Options.
* @returns Hex value.
*
* @example
* import { bytesToHex } from 'viem'
* const data = bytesToHex(Uint8Array.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
* // '0x48656c6c6f20576f726c6421'
*
* @example
* import { bytesToHex } from 'viem'
* const data = bytesToHex(Uint8Array.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]), { size: 32 })
* // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
*/
function bytesToHex(value, opts = {}) {
	let string = "";
	for (let i = 0; i < value.length; i++) string += hexes[value[i]];
	const hex = `0x${string}`;
	if (typeof opts.size === "number") {
		assertSize(hex, { size: opts.size });
		return pad(hex, {
			dir: "right",
			size: opts.size
		});
	}
	return hex;
}
/**
* Encodes a number or bigint into a hex string
*
* - Docs: https://viem.sh/docs/utilities/toHex#numbertohex
*
* @param value Value to encode.
* @param opts Options.
* @returns Hex value.
*
* @example
* import { numberToHex } from 'viem'
* const data = numberToHex(420)
* // '0x1a4'
*
* @example
* import { numberToHex } from 'viem'
* const data = numberToHex(420, { size: 32 })
* // '0x00000000000000000000000000000000000000000000000000000000000001a4'
*/
function numberToHex(value_, opts = {}) {
	const { signed, size } = opts;
	const value = BigInt(value_);
	let maxValue;
	if (size) {
		if (signed) maxValue = (1n << BigInt(size) * 8n - 1n) - 1n;
		else maxValue = 2n ** (BigInt(size) * 8n) - 1n;
	} else if (typeof value_ === "number") maxValue = BigInt(Number.MAX_SAFE_INTEGER);
	const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
	if (maxValue && value > maxValue || value < minValue) {
		const suffix = typeof value_ === "bigint" ? "n" : "";
		throw new IntegerOutOfRangeError({
			max: maxValue ? `${maxValue}${suffix}` : void 0,
			min: `${minValue}${suffix}`,
			signed,
			size,
			value: `${value_}${suffix}`
		});
	}
	const hex = `0x${(signed && value < 0 ? (1n << BigInt(size * 8)) + BigInt(value) : value).toString(16)}`;
	if (size) return pad(hex, { size });
	return hex;
}
var encoder = /*#__PURE__*/ new TextEncoder();
/**
* Encodes a UTF-8 string into a hex string
*
* - Docs: https://viem.sh/docs/utilities/toHex#stringtohex
*
* @param value Value to encode.
* @param opts Options.
* @returns Hex value.
*
* @example
* import { stringToHex } from 'viem'
* const data = stringToHex('Hello World!')
* // '0x48656c6c6f20576f726c6421'
*
* @example
* import { stringToHex } from 'viem'
* const data = stringToHex('Hello World!', { size: 32 })
* // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
*/
function stringToHex(value_, opts = {}) {
	return bytesToHex(encoder.encode(value_), opts);
}
//#endregion
//#region node_modules/viem/_esm/utils/lru.js
/**
* Map with a LRU (Least recently used) policy.
*
* @link https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU
*/
var LruMap = class extends Map {
	constructor(size) {
		super();
		Object.defineProperty(this, "maxSize", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.maxSize = size;
	}
	get(key) {
		const value = super.get(key);
		if (super.has(key)) {
			super.delete(key);
			super.set(key, value);
		}
		return value;
	}
	set(key, value) {
		if (super.has(key)) super.delete(key);
		super.set(key, value);
		if (this.maxSize && this.size > this.maxSize) {
			const firstKey = super.keys().next().value;
			if (firstKey !== void 0) super.delete(firstKey);
		}
		return this;
	}
};
//#endregion
//#region node_modules/viem/_esm/utils/signature/serializeSignature.js
/**
* @description Converts a signature into hex format.
*
* @param signature The signature to convert.
* @returns The signature in hex format.
*
* @example
* serializeSignature({
*   r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
*   s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
*   yParity: 1
* })
* // "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c"
*/
function serializeSignature({ r, s, to = "hex", v, yParity }) {
	const yParity_ = (() => {
		if (yParity === 0 || yParity === 1) return yParity;
		if (v && (v === 27n || v === 28n || v >= 35n)) return v % 2n === 0n ? 1 : 0;
		throw new Error("Invalid `v` or `yParity` value");
	})();
	const signature = `0x${new secp256k1.Signature(hexToBigInt(r), hexToBigInt(s)).toCompactHex()}${yParity_ === 0 ? "1b" : "1c"}`;
	if (to === "hex") return signature;
	return hexToBytes(signature);
}
//#endregion
//#region node_modules/viem/_esm/errors/address.js
var InvalidAddressError = class extends BaseError {
	constructor({ address }) {
		super(`Address "${address}" is invalid.`, {
			metaMessages: ["- Address must be a hex value of 20 bytes (40 hex characters).", "- Address must match its checksum counterpart."],
			name: "InvalidAddressError"
		});
	}
};
//#endregion
//#region node_modules/viem/_esm/utils/hash/keccak256.js
function keccak256(value, to_) {
	const to = to_ || "hex";
	const bytes = keccak_256(isHex(value, { strict: false }) ? toBytes(value) : value);
	if (to === "bytes") return bytes;
	return toHex(bytes);
}
//#endregion
//#region node_modules/viem/_esm/utils/address/getAddress.js
var checksumAddressCache = /*#__PURE__*/ new LruMap(8192);
function checksumAddress(address_, chainId) {
	if (checksumAddressCache.has(`${address_}.${chainId}`)) return checksumAddressCache.get(`${address_}.${chainId}`);
	const hexAddress = chainId ? `${chainId}${address_.toLowerCase()}` : address_.substring(2).toLowerCase();
	const hash = keccak256(stringToBytes(hexAddress), "bytes");
	const address = (chainId ? hexAddress.substring(`${chainId}0x`.length) : hexAddress).split("");
	for (let i = 0; i < 40; i += 2) {
		if (hash[i >> 1] >> 4 >= 8 && address[i]) address[i] = address[i].toUpperCase();
		if ((hash[i >> 1] & 15) >= 8 && address[i + 1]) address[i + 1] = address[i + 1].toUpperCase();
	}
	const result = `0x${address.join("")}`;
	checksumAddressCache.set(`${address_}.${chainId}`, result);
	return result;
}
//#endregion
//#region node_modules/viem/_esm/utils/address/isAddress.js
var addressRegex = /^0x[a-fA-F0-9]{40}$/;
/** @internal */
var isAddressCache = /*#__PURE__*/ new LruMap(8192);
function isAddress(address, options) {
	const { strict = true } = options ?? {};
	const cacheKey = `${address}.${strict}`;
	if (isAddressCache.has(cacheKey)) return isAddressCache.get(cacheKey);
	const result = (() => {
		if (!addressRegex.test(address)) return false;
		if (address.toLowerCase() === address) return true;
		if (strict) return checksumAddress(address) === address;
		return true;
	})();
	isAddressCache.set(cacheKey, result);
	return result;
}
//#endregion
//#region node_modules/viem/_esm/accounts/toAccount.js
/**
* @description Creates an Account from a custom signing implementation.
*
* @returns A Local Account.
*/
function toAccount(source) {
	if (typeof source === "string") {
		if (!isAddress(source, { strict: false })) throw new InvalidAddressError({ address: source });
		return {
			address: source,
			type: "json-rpc"
		};
	}
	if (!isAddress(source.address, { strict: false })) throw new InvalidAddressError({ address: source.address });
	return {
		address: source.address,
		nonceManager: source.nonceManager,
		sign: source.sign,
		signAuthorization: source.signAuthorization,
		signMessage: source.signMessage,
		signTransaction: source.signTransaction,
		signTypedData: source.signTypedData,
		source: "custom",
		type: "local"
	};
}
//#endregion
//#region node_modules/viem/_esm/accounts/utils/publicKeyToAddress.js
/**
* @description Converts an ECDSA public key to an address.
*
* @param publicKey The public key to convert.
*
* @returns The address.
*/
function publicKeyToAddress(publicKey) {
	return checksumAddress(`0x${keccak256(`0x${publicKey.substring(4)}`).substring(26)}`);
}
//#endregion
//#region node_modules/viem/_esm/accounts/utils/sign.js
var extraEntropy = false;
/**
* @description Signs a hash with a given private key.
*
* @param hash The hash to sign.
* @param privateKey The private key to sign with.
*
* @returns The signature.
*/
async function sign({ hash, privateKey, to = "object" }) {
	const { r, s, recovery } = secp256k1.sign(hash.slice(2), privateKey.slice(2), {
		lowS: true,
		extraEntropy: isHex(extraEntropy, { strict: false }) ? hexToBytes(extraEntropy) : extraEntropy
	});
	const signature = {
		r: numberToHex(r, { size: 32 }),
		s: numberToHex(s, { size: 32 }),
		v: recovery ? 28n : 27n,
		yParity: recovery
	};
	return (() => {
		if (to === "bytes" || to === "hex") return serializeSignature({
			...signature,
			to
		});
		return signature;
	})();
}
//#endregion
//#region node_modules/viem/_esm/utils/data/concat.js
function concat(values) {
	if (typeof values[0] === "string") return concatHex(values);
	return concatBytes(values);
}
function concatBytes(values) {
	let length = 0;
	for (const arr of values) length += arr.length;
	const result = new Uint8Array(length);
	let offset = 0;
	for (const arr of values) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}
function concatHex(values) {
	return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
}
//#endregion
//#region node_modules/viem/_esm/errors/cursor.js
var NegativeOffsetError = class extends BaseError {
	constructor({ offset }) {
		super(`Offset \`${offset}\` cannot be negative.`, { name: "NegativeOffsetError" });
	}
};
var PositionOutOfBoundsError = class extends BaseError {
	constructor({ length, position }) {
		super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`, { name: "PositionOutOfBoundsError" });
	}
};
var RecursiveReadLimitExceededError = class extends BaseError {
	constructor({ count, limit }) {
		super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`, { name: "RecursiveReadLimitExceededError" });
	}
};
//#endregion
//#region node_modules/viem/_esm/utils/cursor.js
var staticCursor = {
	bytes: /* @__PURE__ */ new Uint8Array(),
	dataView: /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(0)),
	position: 0,
	positionReadCount: /* @__PURE__ */ new Map(),
	recursiveReadCount: 0,
	recursiveReadLimit: Number.POSITIVE_INFINITY,
	assertReadLimit() {
		if (this.recursiveReadCount >= this.recursiveReadLimit) throw new RecursiveReadLimitExceededError({
			count: this.recursiveReadCount + 1,
			limit: this.recursiveReadLimit
		});
	},
	assertPosition(position) {
		if (position < 0 || position > this.bytes.length - 1) throw new PositionOutOfBoundsError({
			length: this.bytes.length,
			position
		});
	},
	decrementPosition(offset) {
		if (offset < 0) throw new NegativeOffsetError({ offset });
		const position = this.position - offset;
		this.assertPosition(position);
		this.position = position;
	},
	getReadCount(position) {
		return this.positionReadCount.get(position || this.position) || 0;
	},
	incrementPosition(offset) {
		if (offset < 0) throw new NegativeOffsetError({ offset });
		const position = this.position + offset;
		this.assertPosition(position);
		this.position = position;
	},
	inspectByte(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position);
		return this.bytes[position];
	},
	inspectBytes(length, position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + length - 1);
		return this.bytes.subarray(position, position + length);
	},
	inspectUint8(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position);
		return this.bytes[position];
	},
	inspectUint16(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + 1);
		return this.dataView.getUint16(position);
	},
	inspectUint24(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + 2);
		return (this.dataView.getUint16(position) << 8) + this.dataView.getUint8(position + 2);
	},
	inspectUint32(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + 3);
		return this.dataView.getUint32(position);
	},
	pushByte(byte) {
		this.assertPosition(this.position);
		this.bytes[this.position] = byte;
		this.position++;
	},
	pushBytes(bytes) {
		this.assertPosition(this.position + bytes.length - 1);
		this.bytes.set(bytes, this.position);
		this.position += bytes.length;
	},
	pushUint8(value) {
		this.assertPosition(this.position);
		this.bytes[this.position] = value;
		this.position++;
	},
	pushUint16(value) {
		this.assertPosition(this.position + 1);
		this.dataView.setUint16(this.position, value);
		this.position += 2;
	},
	pushUint24(value) {
		this.assertPosition(this.position + 2);
		this.dataView.setUint16(this.position, value >> 8);
		this.dataView.setUint8(this.position + 2, value & 255);
		this.position += 3;
	},
	pushUint32(value) {
		this.assertPosition(this.position + 3);
		this.dataView.setUint32(this.position, value);
		this.position += 4;
	},
	readByte() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectByte();
		this.position++;
		return value;
	},
	readBytes(length, size) {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectBytes(length);
		this.position += size ?? length;
		return value;
	},
	readUint8() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint8();
		this.position += 1;
		return value;
	},
	readUint16() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint16();
		this.position += 2;
		return value;
	},
	readUint24() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint24();
		this.position += 3;
		return value;
	},
	readUint32() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint32();
		this.position += 4;
		return value;
	},
	get remaining() {
		return this.bytes.length - this.position;
	},
	setPosition(position) {
		const oldPosition = this.position;
		this.assertPosition(position);
		this.position = position;
		return () => this.position = oldPosition;
	},
	_touch() {
		if (this.recursiveReadLimit === Number.POSITIVE_INFINITY) return;
		const count = this.getReadCount();
		this.positionReadCount.set(this.position, count + 1);
		if (count > 0) this.recursiveReadCount++;
	}
};
function createCursor(bytes, { recursiveReadLimit = 8192 } = {}) {
	const cursor = Object.create(staticCursor);
	cursor.bytes = bytes;
	cursor.dataView = new DataView(bytes.buffer ?? bytes, bytes.byteOffset, bytes.byteLength);
	cursor.positionReadCount = /* @__PURE__ */ new Map();
	cursor.recursiveReadLimit = recursiveReadLimit;
	return cursor;
}
//#endregion
//#region node_modules/viem/_esm/utils/encoding/toRlp.js
function toRlp(bytes, to = "hex") {
	const encodable = getEncodable(bytes);
	const cursor = createCursor(new Uint8Array(encodable.length));
	encodable.encode(cursor);
	if (to === "hex") return bytesToHex(cursor.bytes);
	return cursor.bytes;
}
function getEncodable(bytes) {
	if (Array.isArray(bytes)) return getEncodableList(bytes.map((x) => getEncodable(x)));
	return getEncodableBytes(bytes);
}
function getEncodableList(list) {
	const bodyLength = list.reduce((acc, x) => acc + x.length, 0);
	const sizeOfBodyLength = getSizeOfLength(bodyLength);
	return {
		length: (() => {
			if (bodyLength <= 55) return 1 + bodyLength;
			return 1 + sizeOfBodyLength + bodyLength;
		})(),
		encode(cursor) {
			if (bodyLength <= 55) cursor.pushByte(192 + bodyLength);
			else {
				cursor.pushByte(247 + sizeOfBodyLength);
				if (sizeOfBodyLength === 1) cursor.pushUint8(bodyLength);
				else if (sizeOfBodyLength === 2) cursor.pushUint16(bodyLength);
				else if (sizeOfBodyLength === 3) cursor.pushUint24(bodyLength);
				else cursor.pushUint32(bodyLength);
			}
			for (const { encode } of list) encode(cursor);
		}
	};
}
function getEncodableBytes(bytesOrHex) {
	const bytes = typeof bytesOrHex === "string" ? hexToBytes(bytesOrHex) : bytesOrHex;
	const sizeOfBytesLength = getSizeOfLength(bytes.length);
	return {
		length: (() => {
			if (bytes.length === 1 && bytes[0] < 128) return 1;
			if (bytes.length <= 55) return 1 + bytes.length;
			return 1 + sizeOfBytesLength + bytes.length;
		})(),
		encode(cursor) {
			if (bytes.length === 1 && bytes[0] < 128) cursor.pushBytes(bytes);
			else if (bytes.length <= 55) {
				cursor.pushByte(128 + bytes.length);
				cursor.pushBytes(bytes);
			} else {
				cursor.pushByte(183 + sizeOfBytesLength);
				if (sizeOfBytesLength === 1) cursor.pushUint8(bytes.length);
				else if (sizeOfBytesLength === 2) cursor.pushUint16(bytes.length);
				else if (sizeOfBytesLength === 3) cursor.pushUint24(bytes.length);
				else cursor.pushUint32(bytes.length);
				cursor.pushBytes(bytes);
			}
		}
	};
}
function getSizeOfLength(length) {
	if (length < 256) return 1;
	if (length < 2 ** 16) return 2;
	if (length < 2 ** 24) return 3;
	if (length < 2 ** 32) return 4;
	throw new BaseError("Length is too large.");
}
//#endregion
//#region node_modules/viem/_esm/utils/authorization/hashAuthorization.js
/**
* Computes an Authorization hash in [EIP-7702 format](https://eips.ethereum.org/EIPS/eip-7702): `keccak256('0x05' || rlp([chain_id, address, nonce]))`.
*/
function hashAuthorization(parameters) {
	const { chainId, nonce, to } = parameters;
	const address = parameters.contractAddress ?? parameters.address;
	const hash = keccak256(concatHex(["0x05", toRlp([
		chainId ? numberToHex(chainId) : "0x",
		address,
		nonce ? numberToHex(nonce) : "0x"
	])]));
	if (to === "bytes") return hexToBytes(hash);
	return hash;
}
//#endregion
//#region node_modules/viem/_esm/accounts/utils/signAuthorization.js
/**
* Signs an Authorization hash in [EIP-7702 format](https://eips.ethereum.org/EIPS/eip-7702): `keccak256('0x05' || rlp([chain_id, address, nonce]))`.
*/
async function signAuthorization(parameters) {
	const { chainId, nonce, privateKey, to = "object" } = parameters;
	const address = parameters.contractAddress ?? parameters.address;
	const signature = await sign({
		hash: hashAuthorization({
			address,
			chainId,
			nonce
		}),
		privateKey,
		to
	});
	if (to === "object") return {
		address,
		chainId,
		nonce,
		...signature
	};
	return signature;
}
//#endregion
//#region node_modules/viem/_esm/constants/strings.js
var presignMessagePrefix = "Ethereum Signed Message:\n";
//#endregion
//#region node_modules/viem/_esm/utils/signature/toPrefixedMessage.js
function toPrefixedMessage(message_) {
	const message = (() => {
		if (typeof message_ === "string") return stringToHex(message_);
		if (typeof message_.raw === "string") return message_.raw;
		return bytesToHex(message_.raw);
	})();
	return concat([stringToHex(`${presignMessagePrefix}${size(message)}`), message]);
}
//#endregion
//#region node_modules/viem/_esm/utils/signature/hashMessage.js
function hashMessage(message, to_) {
	return keccak256(toPrefixedMessage(message), to_);
}
//#endregion
//#region node_modules/viem/_esm/accounts/utils/signMessage.js
/**
* @description Calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191):
* `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.
*
* @returns The signature.
*/
async function signMessage({ message, privateKey }) {
	return await sign({
		hash: hashMessage(message),
		privateKey,
		to: "hex"
	});
}
//#endregion
//#region node_modules/viem/_esm/utils/unit/Value.js
/** @see https://ethereum.github.io/yellowpaper/paper.pdf */
var exponents = {
	wei: 0,
	gwei: 9,
	szabo: 12,
	finney: 15,
	ether: 18
};
/**
* Formats a `bigint` Value to its string representation (divided by the given exponent).
*
* @example
* ```ts twoslash
* import { Value } from 'ox'
*
* Value.format(420_000_000_000n, 9)
* // @log: '420'
* ```
*
* @param value - The `bigint` Value to format.
* @param decimals - The exponent to divide the `bigint` Value by.
* @returns The string representation of the Value.
*/
function format(value, decimals = 0) {
	if (!Number.isInteger(decimals) || decimals < 0) throw new InvalidDecimalsError({ decimals });
	let display = value.toString();
	const negative = display.startsWith("-");
	if (negative) display = display.slice(1);
	display = display.padStart(decimals, "0");
	let [integer, fraction] = [display.slice(0, display.length - decimals), display.slice(display.length - decimals)];
	fraction = fraction.replace(/(0+)$/, "");
	return `${negative ? "-" : ""}${integer || "0"}${fraction ? `.${fraction}` : ""}`;
}
/**
* Formats a `bigint` Value (default: wei) to a string representation of Gwei.
*
* @example
* ```ts twoslash
* import { Value } from 'ox'
*
* Value.formatGwei(1_000_000_000n)
* // @log: '1'
* ```
*
* @param wei - The Value to format.
* @param unit - The unit to format the Value in. @default 'wei'.
* @returns The Gwei string representation of the Value.
*/
function formatGwei$1(wei, unit = "wei") {
	return format(wei, exponents.gwei - exponents[unit]);
}
/**
* Thrown when the `decimals` argument is not a non-negative integer.
*
* @example
* ```ts twoslash
* import { Value } from 'ox'
*
* Value.from('1', -1)
* // @error: Value.InvalidDecimalsError: `decimals` must be a non-negative integer. Got `-1`.
* ```
*/
var InvalidDecimalsError = class extends Error {
	constructor({ decimals }) {
		super(`\`decimals\` must be a non-negative integer. Got \`${decimals}\`.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Value.InvalidDecimalsError"
		});
	}
};
//#endregion
//#region node_modules/viem/_esm/utils/unit/formatGwei.js
/**
* Converts numerical wei to a string representation of gwei.
*
* - Docs: https://viem.sh/docs/utilities/formatGwei
*
* @example
* import { formatGwei } from 'viem'
*
* formatGwei(1000000000n)
* // '1'
*/
function formatGwei(wei, unit = "wei") {
	return formatGwei$1(wei, unit);
}
//#endregion
//#region node_modules/viem/_esm/errors/transaction.js
function prettyPrint(args) {
	const entries = Object.entries(args).map(([key, value]) => {
		if (value === void 0 || value === false) return null;
		return [key, value];
	}).filter(Boolean);
	const maxLength = entries.reduce((acc, [key]) => Math.max(acc, key.length), 0);
	return entries.map(([key, value]) => `  ${`${key}:`.padEnd(maxLength + 1)}  ${value}`).join("\n");
}
var InvalidLegacyVError = class extends BaseError {
	constructor({ v }) {
		super(`Invalid \`v\` value "${v}". Expected 27 or 28.`, { name: "InvalidLegacyVError" });
	}
};
var InvalidSerializableTransactionError = class extends BaseError {
	constructor({ transaction }) {
		super("Cannot infer a transaction type from provided transaction.", {
			metaMessages: [
				"Provided Transaction:",
				"{",
				prettyPrint(transaction),
				"}",
				"",
				"To infer the type, either provide:",
				"- a `type` to the Transaction, or",
				"- an EIP-1559 Transaction with `maxFeePerGas`, or",
				"- an EIP-2930 Transaction with `gasPrice` & `accessList`, or",
				"- an EIP-4844 Transaction with `blobs`, `blobVersionedHashes`, `sidecars`, or",
				"- an EIP-7702 Transaction with `authorizationList`, or",
				"- a Legacy Transaction with `gasPrice`"
			],
			name: "InvalidSerializableTransactionError"
		});
	}
};
var InvalidStorageKeySizeError = class extends BaseError {
	constructor({ storageKey }) {
		super(`Size for storage key "${storageKey}" is invalid. Expected 32 bytes. Got ${Math.floor((storageKey.length - 2) / 2)} bytes.`, { name: "InvalidStorageKeySizeError" });
	}
};
//#endregion
//#region node_modules/viem/_esm/utils/authorization/serializeAuthorizationList.js
function serializeAuthorizationList(authorizationList) {
	if (!authorizationList || authorizationList.length === 0) return [];
	const serializedAuthorizationList = [];
	for (const authorization of authorizationList) {
		const { chainId, nonce, ...signature } = authorization;
		const contractAddress = authorization.address;
		serializedAuthorizationList.push([
			chainId ? toHex(chainId) : "0x",
			contractAddress,
			nonce ? toHex(nonce) : "0x",
			...toYParitySignatureArray({}, signature)
		]);
	}
	return serializedAuthorizationList;
}
//#endregion
//#region node_modules/viem/_esm/utils/blob/blobsToCommitments.js
/**
* Compute commitments from a list of blobs.
*
* @example
* ```ts
* import { blobsToCommitments, toBlobs } from 'viem'
* import { kzg } from './kzg'
*
* const blobs = toBlobs({ data: '0x1234' })
* const commitments = blobsToCommitments({ blobs, kzg })
* ```
*/
function blobsToCommitments(parameters) {
	const { kzg } = parameters;
	const to = parameters.to ?? (typeof parameters.blobs[0] === "string" ? "hex" : "bytes");
	const blobs = typeof parameters.blobs[0] === "string" ? parameters.blobs.map((x) => hexToBytes(x)) : parameters.blobs;
	const commitments = [];
	for (const blob of blobs) commitments.push(Uint8Array.from(kzg.blobToKzgCommitment(blob)));
	return to === "bytes" ? commitments : commitments.map((x) => bytesToHex(x));
}
//#endregion
//#region node_modules/viem/_esm/utils/blob/blobsToProofs.js
/**
* Compute the proofs for a list of blobs and their commitments.
*
* @example
* ```ts
* import {
*   blobsToCommitments,
*   toBlobs
* } from 'viem'
* import { kzg } from './kzg'
*
* const blobs = toBlobs({ data: '0x1234' })
* const commitments = blobsToCommitments({ blobs, kzg })
* const proofs = blobsToProofs({ blobs, commitments, kzg })
* ```
*/
function blobsToProofs(parameters) {
	const { kzg } = parameters;
	const to = parameters.to ?? (typeof parameters.blobs[0] === "string" ? "hex" : "bytes");
	const blobs = typeof parameters.blobs[0] === "string" ? parameters.blobs.map((x) => hexToBytes(x)) : parameters.blobs;
	const commitments = typeof parameters.commitments[0] === "string" ? parameters.commitments.map((x) => hexToBytes(x)) : parameters.commitments;
	const proofs = [];
	for (let i = 0; i < blobs.length; i++) {
		const blob = blobs[i];
		const commitment = commitments[i];
		proofs.push(Uint8Array.from(kzg.computeBlobKzgProof(blob, commitment)));
	}
	return to === "bytes" ? proofs : proofs.map((x) => bytesToHex(x));
}
//#endregion
//#region node_modules/viem/_esm/utils/hash/sha256.js
function sha256(value, to_) {
	const to = to_ || "hex";
	const bytes = sha256$1(isHex(value, { strict: false }) ? toBytes(value) : value);
	if (to === "bytes") return bytes;
	return toHex(bytes);
}
//#endregion
//#region node_modules/viem/_esm/utils/blob/commitmentToVersionedHash.js
/**
* Transform a commitment to it's versioned hash.
*
* @example
* ```ts
* import {
*   blobsToCommitments,
*   commitmentToVersionedHash,
*   toBlobs
* } from 'viem'
* import { kzg } from './kzg'
*
* const blobs = toBlobs({ data: '0x1234' })
* const [commitment] = blobsToCommitments({ blobs, kzg })
* const versionedHash = commitmentToVersionedHash({ commitment })
* ```
*/
function commitmentToVersionedHash(parameters) {
	const { commitment, version = 1 } = parameters;
	const to = parameters.to ?? (typeof commitment === "string" ? "hex" : "bytes");
	const versionedHash = sha256(commitment, "bytes");
	versionedHash.set([version], 0);
	return to === "bytes" ? versionedHash : bytesToHex(versionedHash);
}
//#endregion
//#region node_modules/viem/_esm/utils/blob/commitmentsToVersionedHashes.js
/**
* Transform a list of commitments to their versioned hashes.
*
* @example
* ```ts
* import {
*   blobsToCommitments,
*   commitmentsToVersionedHashes,
*   toBlobs
* } from 'viem'
* import { kzg } from './kzg'
*
* const blobs = toBlobs({ data: '0x1234' })
* const commitments = blobsToCommitments({ blobs, kzg })
* const versionedHashes = commitmentsToVersionedHashes({ commitments })
* ```
*/
function commitmentsToVersionedHashes(parameters) {
	const { commitments, version } = parameters;
	const to = parameters.to ?? (typeof commitments[0] === "string" ? "hex" : "bytes");
	const hashes = [];
	for (const commitment of commitments) hashes.push(commitmentToVersionedHash({
		commitment,
		to,
		version
	}));
	return hashes;
}
//#endregion
//#region node_modules/viem/_esm/constants/blob.js
/** Blob limit per transaction. */
var blobsPerTransaction = 6;
/** The number of field elements in a blob. */
var fieldElementsPerBlob = 4096;
/** The number of bytes in a blob. */
var bytesPerBlob = 32 * fieldElementsPerBlob;
/** Blob bytes limit per transaction. */
var maxBytesPerTransaction = bytesPerBlob * blobsPerTransaction - 1 - 1 * fieldElementsPerBlob * blobsPerTransaction;
//#endregion
//#region node_modules/viem/_esm/errors/blob.js
var BlobSizeTooLargeError = class extends BaseError {
	constructor({ maxSize, size }) {
		super("Blob size is too large.", {
			metaMessages: [`Max: ${maxSize} bytes`, `Given: ${size} bytes`],
			name: "BlobSizeTooLargeError"
		});
	}
};
var EmptyBlobError = class extends BaseError {
	constructor() {
		super("Blob data must not be empty.", { name: "EmptyBlobError" });
	}
};
var InvalidVersionedHashSizeError = class extends BaseError {
	constructor({ hash, size }) {
		super(`Versioned hash "${hash}" size is invalid.`, {
			metaMessages: ["Expected: 32", `Received: ${size}`],
			name: "InvalidVersionedHashSizeError"
		});
	}
};
var InvalidVersionedHashVersionError = class extends BaseError {
	constructor({ hash, version }) {
		super(`Versioned hash "${hash}" version is invalid.`, {
			metaMessages: [`Expected: 1`, `Received: ${version}`],
			name: "InvalidVersionedHashVersionError"
		});
	}
};
//#endregion
//#region node_modules/viem/_esm/utils/blob/toBlobs.js
/**
* Transforms arbitrary data to blobs.
*
* @example
* ```ts
* import { toBlobs, stringToHex } from 'viem'
*
* const blobs = toBlobs({ data: stringToHex('hello world') })
* ```
*/
function toBlobs(parameters) {
	const to = parameters.to ?? (typeof parameters.data === "string" ? "hex" : "bytes");
	const data = typeof parameters.data === "string" ? hexToBytes(parameters.data) : parameters.data;
	const size_ = size(data);
	if (!size_) throw new EmptyBlobError();
	if (size_ > 761855) throw new BlobSizeTooLargeError({
		maxSize: maxBytesPerTransaction,
		size: size_
	});
	const blobs = [];
	let active = true;
	let position = 0;
	while (active) {
		const blob = createCursor(new Uint8Array(bytesPerBlob));
		let size = 0;
		while (size < fieldElementsPerBlob) {
			const bytes = data.slice(position, position + 31);
			blob.pushByte(0);
			blob.pushBytes(bytes);
			if (bytes.length < 31) {
				blob.pushByte(128);
				active = false;
				break;
			}
			size++;
			position += 31;
		}
		blobs.push(blob);
	}
	return to === "bytes" ? blobs.map((x) => x.bytes) : blobs.map((x) => bytesToHex(x.bytes));
}
//#endregion
//#region node_modules/viem/_esm/utils/blob/toBlobSidecars.js
/**
* Transforms arbitrary data (or blobs, commitments, & proofs) into a sidecar array.
*
* @example
* ```ts
* import { toBlobSidecars, stringToHex } from 'viem'
*
* const sidecars = toBlobSidecars({ data: stringToHex('hello world') })
* ```
*
* @example
* ```ts
* import {
*   blobsToCommitments,
*   toBlobs,
*   blobsToProofs,
*   toBlobSidecars,
*   stringToHex
* } from 'viem'
*
* const blobs = toBlobs({ data: stringToHex('hello world') })
* const commitments = blobsToCommitments({ blobs, kzg })
* const proofs = blobsToProofs({ blobs, commitments, kzg })
*
* const sidecars = toBlobSidecars({ blobs, commitments, proofs })
* ```
*/
function toBlobSidecars(parameters) {
	const { data, kzg, to } = parameters;
	const blobs = parameters.blobs ?? toBlobs({
		data,
		to
	});
	const commitments = parameters.commitments ?? blobsToCommitments({
		blobs,
		kzg,
		to
	});
	const proofs = parameters.proofs ?? blobsToProofs({
		blobs,
		commitments,
		kzg,
		to
	});
	const sidecars = [];
	for (let i = 0; i < blobs.length; i++) sidecars.push({
		blob: blobs[i],
		commitment: commitments[i],
		proof: proofs[i]
	});
	return sidecars;
}
2n ** (8n - 1n) - 1n;
2n ** (16n - 1n) - 1n;
2n ** (24n - 1n) - 1n;
2n ** (32n - 1n) - 1n;
2n ** (40n - 1n) - 1n;
2n ** (48n - 1n) - 1n;
2n ** (56n - 1n) - 1n;
2n ** (64n - 1n) - 1n;
2n ** (72n - 1n) - 1n;
2n ** (80n - 1n) - 1n;
2n ** (88n - 1n) - 1n;
2n ** (96n - 1n) - 1n;
2n ** (104n - 1n) - 1n;
2n ** (112n - 1n) - 1n;
2n ** (120n - 1n) - 1n;
2n ** (128n - 1n) - 1n;
2n ** (136n - 1n) - 1n;
2n ** (144n - 1n) - 1n;
2n ** (152n - 1n) - 1n;
2n ** (160n - 1n) - 1n;
2n ** (168n - 1n) - 1n;
2n ** (176n - 1n) - 1n;
2n ** (184n - 1n) - 1n;
2n ** (192n - 1n) - 1n;
2n ** (200n - 1n) - 1n;
2n ** (208n - 1n) - 1n;
2n ** (216n - 1n) - 1n;
2n ** (224n - 1n) - 1n;
2n ** (232n - 1n) - 1n;
2n ** (240n - 1n) - 1n;
2n ** (248n - 1n) - 1n;
2n ** (256n - 1n) - 1n;
-(2n ** (8n - 1n));
-(2n ** (16n - 1n));
-(2n ** (24n - 1n));
-(2n ** (32n - 1n));
-(2n ** (40n - 1n));
-(2n ** (48n - 1n));
-(2n ** (56n - 1n));
-(2n ** (64n - 1n));
-(2n ** (72n - 1n));
-(2n ** (80n - 1n));
-(2n ** (88n - 1n));
-(2n ** (96n - 1n));
-(2n ** (104n - 1n));
-(2n ** (112n - 1n));
-(2n ** (120n - 1n));
-(2n ** (128n - 1n));
-(2n ** (136n - 1n));
-(2n ** (144n - 1n));
-(2n ** (152n - 1n));
-(2n ** (160n - 1n));
-(2n ** (168n - 1n));
-(2n ** (176n - 1n));
-(2n ** (184n - 1n));
-(2n ** (192n - 1n));
-(2n ** (200n - 1n));
-(2n ** (208n - 1n));
-(2n ** (216n - 1n));
-(2n ** (224n - 1n));
-(2n ** (232n - 1n));
-(2n ** (240n - 1n));
-(2n ** (248n - 1n));
-(2n ** (256n - 1n));
var maxUint256 = 2n ** 256n - 1n;
//#endregion
//#region node_modules/viem/_esm/errors/chain.js
var InvalidChainIdError = class extends BaseError {
	constructor({ chainId }) {
		super(typeof chainId === "number" ? `Chain ID "${chainId}" is invalid.` : "Chain ID is invalid.", { name: "InvalidChainIdError" });
	}
};
//#endregion
//#region node_modules/viem/_esm/errors/node.js
var ExecutionRevertedError = class extends BaseError {
	constructor({ cause, message } = {}) {
		const reason = message?.replace("execution reverted: ", "")?.replace("execution reverted", "");
		super(`Execution reverted ${reason ? `with reason: ${reason}` : "for an unknown reason"}.`, {
			cause,
			name: "ExecutionRevertedError"
		});
	}
};
Object.defineProperty(ExecutionRevertedError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 3
});
Object.defineProperty(ExecutionRevertedError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /execution reverted|gas required exceeds allowance/
});
var FeeCapTooHighError = class extends BaseError {
	constructor({ cause, maxFeePerGas } = {}) {
		super(`The fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)} gwei` : ""}) cannot be higher than the maximum allowed value (2^256-1).`, {
			cause,
			name: "FeeCapTooHighError"
		});
	}
};
Object.defineProperty(FeeCapTooHighError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /max fee per gas higher than 2\^256-1|fee cap higher than 2\^256-1/
});
var FeeCapTooLowError = class extends BaseError {
	constructor({ cause, maxFeePerGas } = {}) {
		super(`The fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)}` : ""} gwei) cannot be lower than the block base fee.`, {
			cause,
			name: "FeeCapTooLowError"
		});
	}
};
Object.defineProperty(FeeCapTooLowError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /max fee per gas less than block base fee|fee cap less than block base fee|transaction is outdated/
});
var NonceTooHighError = class extends BaseError {
	constructor({ cause, nonce } = {}) {
		super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}is higher than the next one expected.`, {
			cause,
			name: "NonceTooHighError"
		});
	}
};
Object.defineProperty(NonceTooHighError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /nonce too high/
});
var NonceTooLowError = class extends BaseError {
	constructor({ cause, nonce } = {}) {
		super([`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}is lower than the current nonce of the account.`, "Try increasing the nonce or find the latest nonce with `getTransactionCount`."].join("\n"), {
			cause,
			name: "NonceTooLowError"
		});
	}
};
Object.defineProperty(NonceTooLowError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /nonce too low|transaction already imported|already known/
});
var NonceMaxValueError = class extends BaseError {
	constructor({ cause, nonce } = {}) {
		super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}exceeds the maximum allowed nonce.`, {
			cause,
			name: "NonceMaxValueError"
		});
	}
};
Object.defineProperty(NonceMaxValueError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /nonce has max value/
});
var InsufficientFundsError = class extends BaseError {
	constructor({ cause } = {}) {
		super(["The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account."].join("\n"), {
			cause,
			metaMessages: [
				"This error could arise when the account does not have enough funds to:",
				" - pay for the total gas fee,",
				" - pay for the value to send.",
				" ",
				"The cost of the transaction is calculated as `gas * gas fee + value`, where:",
				" - `gas` is the amount of gas needed for transaction to execute,",
				" - `gas fee` is the gas fee,",
				" - `value` is the amount of ether to send to the recipient."
			],
			name: "InsufficientFundsError"
		});
	}
};
Object.defineProperty(InsufficientFundsError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /insufficient funds|exceeds transaction sender account balance/
});
var IntrinsicGasTooHighError = class extends BaseError {
	constructor({ cause, gas } = {}) {
		super(`The amount of gas ${gas ? `(${gas}) ` : ""}provided for the transaction exceeds the limit allowed for the block.`, {
			cause,
			name: "IntrinsicGasTooHighError"
		});
	}
};
Object.defineProperty(IntrinsicGasTooHighError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /intrinsic gas too high|gas limit reached/
});
var IntrinsicGasTooLowError = class extends BaseError {
	constructor({ cause, gas } = {}) {
		super(`The amount of gas ${gas ? `(${gas}) ` : ""}provided for the transaction is too low.`, {
			cause,
			name: "IntrinsicGasTooLowError"
		});
	}
};
Object.defineProperty(IntrinsicGasTooLowError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /intrinsic gas too low/
});
var TransactionTypeNotSupportedError = class extends BaseError {
	constructor({ cause }) {
		super("The transaction type is not supported for this chain.", {
			cause,
			name: "TransactionTypeNotSupportedError"
		});
	}
};
Object.defineProperty(TransactionTypeNotSupportedError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /transaction type not valid/
});
var TipAboveFeeCapError = class extends BaseError {
	constructor({ cause, maxPriorityFeePerGas, maxFeePerGas } = {}) {
		super([`The provided tip (\`maxPriorityFeePerGas\`${maxPriorityFeePerGas ? ` = ${formatGwei(maxPriorityFeePerGas)} gwei` : ""}) cannot be higher than the fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)} gwei` : ""}).`].join("\n"), {
			cause,
			name: "TipAboveFeeCapError"
		});
	}
};
Object.defineProperty(TipAboveFeeCapError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /max priority fee per gas higher than max fee per gas|tip higher than fee cap/
});
//#endregion
//#region node_modules/viem/_esm/utils/data/slice.js
/**
* @description Returns a section of the hex or byte array given a start/end bytes offset.
*
* @param value The hex or byte array to slice.
* @param start The start offset (in bytes).
* @param end The end offset (in bytes).
*/
function slice(value, start, end, { strict } = {}) {
	if (isHex(value, { strict: false })) return sliceHex(value, start, end, { strict });
	return sliceBytes(value, start, end, { strict });
}
function assertStartOffset(value, start) {
	if (typeof start === "number" && start > 0 && start > size(value) - 1) throw new SliceOffsetOutOfBoundsError({
		offset: start,
		position: "start",
		size: size(value)
	});
}
function assertEndOffset(value, start, end) {
	if (typeof start === "number" && typeof end === "number" && size(value) !== end - start) throw new SliceOffsetOutOfBoundsError({
		offset: end,
		position: "end",
		size: size(value)
	});
}
/**
* @description Returns a section of the byte array given a start/end bytes offset.
*
* @param value The byte array to slice.
* @param start The start offset (in bytes).
* @param end The end offset (in bytes).
*/
function sliceBytes(value_, start, end, { strict } = {}) {
	assertStartOffset(value_, start);
	const value = value_.slice(start, end);
	if (strict) assertEndOffset(value, start, end);
	return value;
}
/**
* @description Returns a section of the hex value given a start/end bytes offset.
*
* @param value The hex value to slice.
* @param start The start offset (in bytes).
* @param end The end offset (in bytes).
*/
function sliceHex(value_, start, end, { strict } = {}) {
	assertStartOffset(value_, start);
	const value = `0x${value_.replace("0x", "").slice((start ?? 0) * 2, (end ?? value_.length) * 2)}`;
	if (strict) assertEndOffset(value, start, end);
	return value;
}
//#endregion
//#region node_modules/viem/_esm/utils/transaction/assertTransaction.js
function assertTransactionEIP7702(transaction) {
	const { authorizationList } = transaction;
	if (authorizationList) for (const authorization of authorizationList) {
		const { chainId } = authorization;
		const address = authorization.address;
		if (!isAddress(address)) throw new InvalidAddressError({ address });
		if (chainId < 0) throw new InvalidChainIdError({ chainId });
	}
	assertTransactionEIP1559(transaction);
}
function assertTransactionEIP4844(transaction) {
	const { blobVersionedHashes } = transaction;
	if (blobVersionedHashes) {
		if (blobVersionedHashes.length === 0) throw new EmptyBlobError();
		for (const hash of blobVersionedHashes) {
			const size_ = size(hash);
			const version = hexToNumber(slice(hash, 0, 1));
			if (size_ !== 32) throw new InvalidVersionedHashSizeError({
				hash,
				size: size_
			});
			if (version !== 1) throw new InvalidVersionedHashVersionError({
				hash,
				version
			});
		}
	}
	assertTransactionEIP1559(transaction);
}
function assertTransactionEIP1559(transaction) {
	const { chainId, maxPriorityFeePerGas, maxFeePerGas, to } = transaction;
	if (chainId <= 0) throw new InvalidChainIdError({ chainId });
	if (to && !isAddress(to)) throw new InvalidAddressError({ address: to });
	if (maxFeePerGas && maxFeePerGas > maxUint256) throw new FeeCapTooHighError({ maxFeePerGas });
	if (maxPriorityFeePerGas && maxFeePerGas && maxPriorityFeePerGas > maxFeePerGas) throw new TipAboveFeeCapError({
		maxFeePerGas,
		maxPriorityFeePerGas
	});
}
function assertTransactionEIP2930(transaction) {
	const { chainId, maxPriorityFeePerGas, gasPrice, maxFeePerGas, to } = transaction;
	if (chainId <= 0) throw new InvalidChainIdError({ chainId });
	if (to && !isAddress(to)) throw new InvalidAddressError({ address: to });
	if (maxPriorityFeePerGas || maxFeePerGas) throw new BaseError("`maxFeePerGas`/`maxPriorityFeePerGas` is not a valid EIP-2930 Transaction attribute.");
	if (gasPrice && gasPrice > maxUint256) throw new FeeCapTooHighError({ maxFeePerGas: gasPrice });
}
function assertTransactionLegacy(transaction) {
	const { chainId, maxPriorityFeePerGas, gasPrice, maxFeePerGas, to } = transaction;
	if (to && !isAddress(to)) throw new InvalidAddressError({ address: to });
	if (typeof chainId !== "undefined" && chainId <= 0) throw new InvalidChainIdError({ chainId });
	if (maxPriorityFeePerGas || maxFeePerGas) throw new BaseError("`maxFeePerGas`/`maxPriorityFeePerGas` is not a valid Legacy Transaction attribute.");
	if (gasPrice && gasPrice > maxUint256) throw new FeeCapTooHighError({ maxFeePerGas: gasPrice });
}
//#endregion
//#region node_modules/viem/_esm/utils/transaction/getTransactionType.js
function getTransactionType(transaction) {
	if (transaction.type) return transaction.type;
	if (typeof transaction.authorizationList !== "undefined") return "eip7702";
	if (typeof transaction.blobs !== "undefined" || typeof transaction.blobVersionedHashes !== "undefined" || typeof transaction.maxFeePerBlobGas !== "undefined" || typeof transaction.sidecars !== "undefined") return "eip4844";
	if (typeof transaction.maxFeePerGas !== "undefined" || typeof transaction.maxPriorityFeePerGas !== "undefined") return "eip1559";
	if (typeof transaction.gasPrice !== "undefined") {
		if (typeof transaction.accessList !== "undefined") return "eip2930";
		return "legacy";
	}
	throw new InvalidSerializableTransactionError({ transaction });
}
//#endregion
//#region node_modules/viem/_esm/utils/transaction/serializeAccessList.js
function serializeAccessList(accessList) {
	if (!accessList || accessList.length === 0) return [];
	const serializedAccessList = [];
	for (let i = 0; i < accessList.length; i++) {
		const { address, storageKeys } = accessList[i];
		for (let j = 0; j < storageKeys.length; j++) if (storageKeys[j].length - 2 !== 64) throw new InvalidStorageKeySizeError({ storageKey: storageKeys[j] });
		if (!isAddress(address, { strict: false })) throw new InvalidAddressError({ address });
		serializedAccessList.push([address, storageKeys]);
	}
	return serializedAccessList;
}
//#endregion
//#region node_modules/viem/_esm/utils/transaction/serializeTransaction.js
function serializeTransaction(transaction, signature) {
	const type = getTransactionType(transaction);
	if (type === "eip1559") return serializeTransactionEIP1559(transaction, signature);
	if (type === "eip2930") return serializeTransactionEIP2930(transaction, signature);
	if (type === "eip4844") return serializeTransactionEIP4844(transaction, signature);
	if (type === "eip7702") return serializeTransactionEIP7702(transaction, signature);
	return serializeTransactionLegacy(transaction, signature);
}
function serializeTransactionEIP7702(transaction, signature) {
	const { authorizationList, chainId, gas, nonce, to, value, maxFeePerGas, maxPriorityFeePerGas, accessList, data } = transaction;
	assertTransactionEIP7702(transaction);
	const serializedAccessList = serializeAccessList(accessList);
	const serializedAuthorizationList = serializeAuthorizationList(authorizationList);
	return concatHex(["0x04", toRlp([
		numberToHex(chainId),
		nonce ? numberToHex(nonce) : "0x",
		maxPriorityFeePerGas ? numberToHex(maxPriorityFeePerGas) : "0x",
		maxFeePerGas ? numberToHex(maxFeePerGas) : "0x",
		gas ? numberToHex(gas) : "0x",
		to ?? "0x",
		value ? numberToHex(value) : "0x",
		data ?? "0x",
		serializedAccessList,
		serializedAuthorizationList,
		...toYParitySignatureArray(transaction, signature)
	])]);
}
function serializeTransactionEIP4844(transaction, signature) {
	const { chainId, gas, nonce, to, value, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, accessList, data } = transaction;
	assertTransactionEIP4844(transaction);
	let blobVersionedHashes = transaction.blobVersionedHashes;
	let sidecars = transaction.sidecars;
	if (transaction.blobs && (typeof blobVersionedHashes === "undefined" || typeof sidecars === "undefined")) {
		const blobs = typeof transaction.blobs[0] === "string" ? transaction.blobs : transaction.blobs.map((x) => bytesToHex(x));
		const kzg = transaction.kzg;
		const commitments = blobsToCommitments({
			blobs,
			kzg
		});
		if (typeof blobVersionedHashes === "undefined") blobVersionedHashes = commitmentsToVersionedHashes({ commitments });
		if (typeof sidecars === "undefined") sidecars = toBlobSidecars({
			blobs,
			commitments,
			proofs: blobsToProofs({
				blobs,
				commitments,
				kzg
			})
		});
	}
	const serializedAccessList = serializeAccessList(accessList);
	const serializedTransaction = [
		numberToHex(chainId),
		nonce ? numberToHex(nonce) : "0x",
		maxPriorityFeePerGas ? numberToHex(maxPriorityFeePerGas) : "0x",
		maxFeePerGas ? numberToHex(maxFeePerGas) : "0x",
		gas ? numberToHex(gas) : "0x",
		to ?? "0x",
		value ? numberToHex(value) : "0x",
		data ?? "0x",
		serializedAccessList,
		maxFeePerBlobGas ? numberToHex(maxFeePerBlobGas) : "0x",
		blobVersionedHashes ?? [],
		...toYParitySignatureArray(transaction, signature)
	];
	const blobs = [];
	const commitments = [];
	const proofs = [];
	if (sidecars) for (let i = 0; i < sidecars.length; i++) {
		const { blob, commitment, proof } = sidecars[i];
		blobs.push(blob);
		commitments.push(commitment);
		proofs.push(proof);
	}
	return concatHex(["0x03", sidecars ? toRlp([
		serializedTransaction,
		blobs,
		commitments,
		proofs
	]) : toRlp(serializedTransaction)]);
}
function serializeTransactionEIP1559(transaction, signature) {
	const { chainId, gas, nonce, to, value, maxFeePerGas, maxPriorityFeePerGas, accessList, data } = transaction;
	assertTransactionEIP1559(transaction);
	const serializedAccessList = serializeAccessList(accessList);
	return concatHex(["0x02", toRlp([
		numberToHex(chainId),
		nonce ? numberToHex(nonce) : "0x",
		maxPriorityFeePerGas ? numberToHex(maxPriorityFeePerGas) : "0x",
		maxFeePerGas ? numberToHex(maxFeePerGas) : "0x",
		gas ? numberToHex(gas) : "0x",
		to ?? "0x",
		value ? numberToHex(value) : "0x",
		data ?? "0x",
		serializedAccessList,
		...toYParitySignatureArray(transaction, signature)
	])]);
}
function serializeTransactionEIP2930(transaction, signature) {
	const { chainId, gas, data, nonce, to, value, accessList, gasPrice } = transaction;
	assertTransactionEIP2930(transaction);
	const serializedAccessList = serializeAccessList(accessList);
	return concatHex(["0x01", toRlp([
		numberToHex(chainId),
		nonce ? numberToHex(nonce) : "0x",
		gasPrice ? numberToHex(gasPrice) : "0x",
		gas ? numberToHex(gas) : "0x",
		to ?? "0x",
		value ? numberToHex(value) : "0x",
		data ?? "0x",
		serializedAccessList,
		...toYParitySignatureArray(transaction, signature)
	])]);
}
function serializeTransactionLegacy(transaction, signature) {
	const { chainId = 0, gas, data, nonce, to, value, gasPrice } = transaction;
	assertTransactionLegacy(transaction);
	let serializedTransaction = [
		nonce ? numberToHex(nonce) : "0x",
		gasPrice ? numberToHex(gasPrice) : "0x",
		gas ? numberToHex(gas) : "0x",
		to ?? "0x",
		value ? numberToHex(value) : "0x",
		data ?? "0x"
	];
	if (signature) {
		const v = (() => {
			if (signature.v >= 35n) {
				if ((signature.v - 35n) / 2n > 0) return signature.v;
				return 27n + (signature.v === 35n ? 0n : 1n);
			}
			if (chainId > 0) return BigInt(chainId * 2) + BigInt(35n + signature.v - 27n);
			const v = 27n + (signature.v === 27n ? 0n : 1n);
			if (signature.v !== v) throw new InvalidLegacyVError({ v: signature.v });
			return v;
		})();
		const r = trim(signature.r);
		const s = trim(signature.s);
		serializedTransaction = [
			...serializedTransaction,
			numberToHex(v),
			r === "0x00" ? "0x" : r,
			s === "0x00" ? "0x" : s
		];
	} else if (chainId > 0) serializedTransaction = [
		...serializedTransaction,
		numberToHex(chainId),
		"0x",
		"0x"
	];
	return toRlp(serializedTransaction);
}
function toYParitySignatureArray(transaction, signature_) {
	const signature = signature_ ?? transaction;
	const { v, yParity } = signature;
	if (typeof signature.r === "undefined") return [];
	if (typeof signature.s === "undefined") return [];
	if (typeof v === "undefined" && typeof yParity === "undefined") return [];
	const r = trim(signature.r);
	const s = trim(signature.s);
	return [
		(() => {
			if (typeof yParity === "number") return yParity ? numberToHex(1) : "0x";
			if (v === 0n) return "0x";
			if (v === 1n) return numberToHex(1);
			return v === 27n ? "0x" : numberToHex(1);
		})(),
		r === "0x00" ? "0x" : r,
		s === "0x00" ? "0x" : s
	];
}
//#endregion
//#region node_modules/viem/_esm/accounts/utils/signTransaction.js
async function signTransaction(parameters) {
	const { privateKey, transaction, serializer = serializeTransaction } = parameters;
	return await serializer(transaction, await sign({
		hash: keccak256(await serializer((() => {
			if (transaction.type === "eip4844") return {
				...transaction,
				sidecars: false
			};
			return transaction;
		})())),
		privateKey
	}));
}
//#endregion
//#region node_modules/viem/_esm/errors/abi.js
var AbiEncodingArrayLengthMismatchError = class extends BaseError {
	constructor({ expectedLength, givenLength, type }) {
		super([
			`ABI encoding array length mismatch for type ${type}.`,
			`Expected length: ${expectedLength}`,
			`Given length: ${givenLength}`
		].join("\n"), { name: "AbiEncodingArrayLengthMismatchError" });
	}
};
var AbiEncodingBytesSizeMismatchError = class extends BaseError {
	constructor({ expectedSize, value }) {
		super(`Size of bytes "${value}" (bytes${size(value)}) does not match expected size (bytes${expectedSize}).`, { name: "AbiEncodingBytesSizeMismatchError" });
	}
};
var AbiEncodingLengthMismatchError = class extends BaseError {
	constructor({ expectedLength, givenLength }) {
		super([
			"ABI encoding params/values length mismatch.",
			`Expected length (params): ${expectedLength}`,
			`Given length (values): ${givenLength}`
		].join("\n"), { name: "AbiEncodingLengthMismatchError" });
	}
};
var BytesSizeMismatchError = class extends BaseError {
	constructor({ expectedSize, givenSize }) {
		super(`Expected bytes${expectedSize}, got bytes${givenSize}.`, { name: "BytesSizeMismatchError" });
	}
};
var InvalidAbiEncodingTypeError = class extends BaseError {
	constructor(type, { docsPath }) {
		super([`Type "${type}" is not a valid encoding type.`, "Please provide a valid ABI type."].join("\n"), {
			docsPath,
			name: "InvalidAbiEncodingType"
		});
	}
};
var InvalidArrayError = class extends BaseError {
	constructor(value) {
		super([`Value "${value}" is not a valid array.`].join("\n"), { name: "InvalidArrayError" });
	}
};
//#endregion
//#region node_modules/viem/_esm/utils/regex.js
var bytesRegex = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
var integerRegex = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
//#endregion
//#region node_modules/viem/_esm/utils/abi/encodeAbiParameters.js
/**
* @description Encodes a list of primitive values into an ABI-encoded hex value.
*
* - Docs: https://viem.sh/docs/abi/encodeAbiParameters#encodeabiparameters
*
*   Generates ABI encoded data using the [ABI specification](https://docs.soliditylang.org/en/latest/abi-spec), given a set of ABI parameters (inputs/outputs) and their corresponding values.
*
* @param params - a set of ABI Parameters (params), that can be in the shape of the inputs or outputs attribute of an ABI Item.
* @param values - a set of values (values) that correspond to the given params.
* @example
* ```typescript
* import { encodeAbiParameters } from 'viem'
*
* const encodedData = encodeAbiParameters(
*   [
*     { name: 'x', type: 'string' },
*     { name: 'y', type: 'uint' },
*     { name: 'z', type: 'bool' }
*   ],
*   ['wagmi', 420n, true]
* )
* ```
*
* You can also pass in Human Readable parameters with the parseAbiParameters utility.
*
* @example
* ```typescript
* import { encodeAbiParameters, parseAbiParameters } from 'viem'
*
* const encodedData = encodeAbiParameters(
*   parseAbiParameters('string x, uint y, bool z'),
*   ['wagmi', 420n, true]
* )
* ```
*/
function encodeAbiParameters(params, values) {
	if (params.length !== values.length) throw new AbiEncodingLengthMismatchError({
		expectedLength: params.length,
		givenLength: values.length
	});
	return encodeParams(prepareParams({
		params,
		values
	}));
}
function prepareParams({ params, values }) {
	const preparedParams = [];
	for (let i = 0; i < params.length; i++) preparedParams.push(prepareParam({
		param: params[i],
		value: values[i]
	}));
	return preparedParams;
}
function prepareParam({ param, value }) {
	const arrayComponents = getArrayComponents(param.type);
	if (arrayComponents) {
		const [length, type] = arrayComponents;
		return encodeArray(value, {
			length,
			param: {
				...param,
				type
			}
		});
	}
	if (param.type === "tuple") return encodeTuple(value, { param });
	if (param.type === "address") return encodeAddress(value);
	if (param.type === "bool") return encodeBool(value);
	if (param.type.startsWith("uint") || param.type.startsWith("int")) {
		const signed = param.type.startsWith("int");
		const [, , size = "256"] = integerRegex.exec(param.type) ?? [];
		return encodeNumber(value, {
			signed,
			size: Number(size)
		});
	}
	if (param.type.startsWith("bytes")) return encodeBytes(value, { param });
	if (param.type === "string") return encodeString(value);
	throw new InvalidAbiEncodingTypeError(param.type, { docsPath: "/docs/contract/encodeAbiParameters" });
}
function encodeParams(preparedParams) {
	let staticSize = 0;
	for (let i = 0; i < preparedParams.length; i++) {
		const { dynamic, encoded } = preparedParams[i];
		if (dynamic) staticSize += 32;
		else staticSize += size(encoded);
	}
	const staticParams = [];
	const dynamicParams = [];
	let dynamicSize = 0;
	for (let i = 0; i < preparedParams.length; i++) {
		const { dynamic, encoded } = preparedParams[i];
		if (dynamic) {
			staticParams.push(numberToHex(staticSize + dynamicSize, { size: 32 }));
			dynamicParams.push(encoded);
			dynamicSize += size(encoded);
		} else staticParams.push(encoded);
	}
	return concatHex([...staticParams, ...dynamicParams]);
}
function encodeAddress(value) {
	if (!isAddress(value)) throw new InvalidAddressError({ address: value });
	return {
		dynamic: false,
		encoded: padHex(value.toLowerCase())
	};
}
function encodeArray(value, { length, param }) {
	const dynamic = length === null;
	if (!Array.isArray(value)) throw new InvalidArrayError(value);
	if (!dynamic && value.length !== length) throw new AbiEncodingArrayLengthMismatchError({
		expectedLength: length,
		givenLength: value.length,
		type: `${param.type}[${length}]`
	});
	let dynamicChild = value.length === 0 && isDynamicType(param);
	const preparedParams = [];
	for (let i = 0; i < value.length; i++) {
		const preparedParam = prepareParam({
			param,
			value: value[i]
		});
		if (preparedParam.dynamic) dynamicChild = true;
		preparedParams.push(preparedParam);
	}
	if (dynamic || dynamicChild) {
		const data = encodeParams(preparedParams);
		if (dynamic) return {
			dynamic: true,
			encoded: concatHex([numberToHex(preparedParams.length, { size: 32 }), data])
		};
		if (dynamicChild) return {
			dynamic: true,
			encoded: data
		};
	}
	return {
		dynamic: false,
		encoded: concatHex(preparedParams.map(({ encoded }) => encoded))
	};
}
function encodeBytes(value, { param }) {
	const [, paramSize] = param.type.split("bytes");
	const bytesSize = size(value);
	if (!paramSize) {
		let value_ = value;
		if (bytesSize % 32 !== 0) value_ = padHex(value_, {
			dir: "right",
			size: Math.ceil((value.length - 2) / 2 / 32) * 32
		});
		return {
			dynamic: true,
			encoded: concatHex([padHex(numberToHex(bytesSize, { size: 32 })), value_])
		};
	}
	if (bytesSize !== Number.parseInt(paramSize, 10)) throw new AbiEncodingBytesSizeMismatchError({
		expectedSize: Number.parseInt(paramSize, 10),
		value
	});
	return {
		dynamic: false,
		encoded: padHex(value, { dir: "right" })
	};
}
function encodeBool(value) {
	if (typeof value !== "boolean") throw new BaseError(`Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`);
	return {
		dynamic: false,
		encoded: padHex(boolToHex(value))
	};
}
function encodeNumber(value, { signed, size = 256 }) {
	if (typeof size === "number") {
		const max = 2n ** (BigInt(size) - (signed ? 1n : 0n)) - 1n;
		const min = signed ? -max - 1n : 0n;
		if (value > max || value < min) throw new IntegerOutOfRangeError({
			max: max.toString(),
			min: min.toString(),
			signed,
			size: size / 8,
			value: value.toString()
		});
	}
	return {
		dynamic: false,
		encoded: numberToHex(value, {
			size: 32,
			signed
		})
	};
}
function encodeString(value) {
	const hexValue = stringToHex(value);
	const partsLength = Math.ceil(size(hexValue) / 32);
	const parts = [];
	for (let i = 0; i < partsLength; i++) parts.push(padHex(slice(hexValue, i * 32, (i + 1) * 32), { dir: "right" }));
	return {
		dynamic: true,
		encoded: concatHex([padHex(numberToHex(size(hexValue), { size: 32 })), ...parts])
	};
}
function encodeTuple(value, { param }) {
	let dynamic = false;
	const preparedParams = [];
	for (let i = 0; i < param.components.length; i++) {
		const param_ = param.components[i];
		const preparedParam = prepareParam({
			param: param_,
			value: value[Array.isArray(value) ? i : param_.name]
		});
		preparedParams.push(preparedParam);
		if (preparedParam.dynamic) dynamic = true;
	}
	return {
		dynamic,
		encoded: dynamic ? encodeParams(preparedParams) : concatHex(preparedParams.map(({ encoded }) => encoded))
	};
}
function getArrayComponents(type) {
	const matches = type.match(/^(.*)\[(\d+)?\]$/);
	return matches ? [matches[2] ? Number(matches[2]) : null, matches[1]] : void 0;
}
function isDynamicType(param) {
	const { type } = param;
	if (type === "string") return true;
	if (type === "bytes") return true;
	if (type.endsWith("[]")) return true;
	if (type === "tuple") return param.components.some(isDynamicType);
	const arrayComponents = getArrayComponents(type);
	if (arrayComponents) return isDynamicType({
		...param,
		type: arrayComponents[1]
	});
	return false;
}
//#endregion
//#region node_modules/viem/_esm/utils/stringify.js
var stringify = (value, replacer, space) => JSON.stringify(value, (key, value_) => {
	const value = typeof value_ === "bigint" ? value_.toString() : value_;
	return typeof replacer === "function" ? replacer(key, value) : value;
}, space);
//#endregion
//#region node_modules/viem/_esm/errors/typedData.js
var InvalidDomainError = class extends BaseError {
	constructor({ domain }) {
		super(`Invalid domain "${stringify(domain)}".`, { metaMessages: ["Must be a valid EIP-712 domain."] });
	}
};
var InvalidPrimaryTypeError = class extends BaseError {
	constructor({ primaryType, types }) {
		super(`Invalid primary type \`${primaryType}\` must be one of \`${JSON.stringify(Object.keys(types))}\`.`, {
			docsPath: "/api/glossary/Errors#typeddatainvalidprimarytypeerror",
			metaMessages: ["Check that the primary type is a key in `types`."]
		});
	}
};
var InvalidStructTypeError = class extends BaseError {
	constructor({ type }) {
		super(`Struct type "${type}" is invalid.`, {
			metaMessages: ["Struct type must not be a Solidity type."],
			name: "InvalidStructTypeError"
		});
	}
};
var InvalidTypedDataTypeError = class extends BaseError {
	constructor({ type }) {
		const canonicalType = type.replace(/^(u?int)/, "$&256");
		super(`Type "${type}" is not a valid EIP-712 type.`, {
			metaMessages: [`Use "${canonicalType}" instead.`],
			name: "InvalidTypedDataTypeError"
		});
	}
};
//#endregion
//#region node_modules/viem/_esm/utils/typedData.js
function validateTypedData(parameters) {
	const { domain, message, primaryType, types } = parameters;
	const validateData = (struct, data) => {
		for (const param of struct) {
			const { name, type } = param;
			const value = data[name];
			const baseType = type.replace(/(\[[0-9]*\])+$/, "");
			if (baseType === "int" || baseType === "uint") throw new InvalidTypedDataTypeError({ type });
			const integerMatch = type.match(integerRegex);
			if (integerMatch && (typeof value === "number" || typeof value === "bigint")) {
				const [_type, base, size_] = integerMatch;
				numberToHex(value, {
					signed: base === "int",
					size: Number.parseInt(size_, 10) / 8
				});
			}
			if (type === "address" && typeof value === "string" && !isAddress(value)) throw new InvalidAddressError({ address: value });
			const bytesMatch = type.match(bytesRegex);
			if (bytesMatch) {
				const [_type, size_] = bytesMatch;
				if (size_ && size(value) !== Number.parseInt(size_, 10)) throw new BytesSizeMismatchError({
					expectedSize: Number.parseInt(size_, 10),
					givenSize: size(value)
				});
			}
			const struct = types[type];
			if (struct) {
				validateReference(type);
				validateData(struct, value);
			}
		}
	};
	if (types.EIP712Domain && domain) {
		if (typeof domain !== "object") throw new InvalidDomainError({ domain });
		validateData(types.EIP712Domain, domain);
	}
	if (primaryType !== "EIP712Domain") {
		if (types[primaryType]) validateData(types[primaryType], message);
		else throw new InvalidPrimaryTypeError({
			primaryType,
			types
		});
	}
}
function getTypesForEIP712Domain({ domain }) {
	return [
		typeof domain?.name === "string" && {
			name: "name",
			type: "string"
		},
		domain?.version && {
			name: "version",
			type: "string"
		},
		(typeof domain?.chainId === "number" || typeof domain?.chainId === "bigint") && {
			name: "chainId",
			type: "uint256"
		},
		domain?.verifyingContract && {
			name: "verifyingContract",
			type: "address"
		},
		domain?.salt && {
			name: "salt",
			type: "bytes32"
		}
	].filter(Boolean);
}
/** @internal */
function validateReference(type) {
	if (type === "address" || type === "bool" || type === "string" || type.startsWith("bytes") || type.startsWith("uint") || type.startsWith("int")) throw new InvalidStructTypeError({ type });
}
//#endregion
//#region node_modules/viem/_esm/utils/signature/hashTypedData.js
function hashTypedData(parameters) {
	const { domain = {}, message, primaryType } = parameters;
	const types = {
		EIP712Domain: getTypesForEIP712Domain({ domain }),
		...parameters.types
	};
	validateTypedData({
		domain,
		message,
		primaryType,
		types
	});
	const parts = ["0x1901"];
	if (domain) parts.push(hashDomain({
		domain,
		types
	}));
	if (primaryType !== "EIP712Domain") parts.push(hashStruct({
		data: message,
		primaryType,
		types
	}));
	return keccak256(concat(parts));
}
function hashDomain({ domain, types }) {
	return hashStruct({
		data: domain,
		primaryType: "EIP712Domain",
		types
	});
}
function hashStruct({ data, primaryType, types }) {
	return keccak256(encodeData({
		data,
		primaryType,
		types
	}));
}
function encodeData({ data, primaryType, types }) {
	const encodedTypes = [{ type: "bytes32" }];
	const encodedValues = [hashType({
		primaryType,
		types
	})];
	for (const field of types[primaryType]) {
		const [type, value] = encodeField({
			types,
			name: field.name,
			type: field.type,
			value: data[field.name]
		});
		encodedTypes.push(type);
		encodedValues.push(value);
	}
	return encodeAbiParameters(encodedTypes, encodedValues);
}
function hashType({ primaryType, types }) {
	return keccak256(toHex(encodeType({
		primaryType,
		types
	})));
}
function encodeType({ primaryType, types }) {
	let result = "";
	const unsortedDeps = findTypeDependencies({
		primaryType,
		types
	});
	unsortedDeps.delete(primaryType);
	const deps = [primaryType, ...Array.from(unsortedDeps).sort()];
	for (const type of deps) result += `${type}(${types[type].map(({ name, type: t }) => `${t} ${name}`).join(",")})`;
	return result;
}
function findTypeDependencies({ primaryType: primaryType_, types }, results = /* @__PURE__ */ new Set()) {
	const primaryType = primaryType_.match(/^\w*/u)?.[0];
	if (results.has(primaryType) || types[primaryType] === void 0) return results;
	results.add(primaryType);
	for (const field of types[primaryType]) findTypeDependencies({
		primaryType: field.type,
		types
	}, results);
	return results;
}
function encodeField({ types, name, type, value }) {
	if (types[type] !== void 0) return [{ type: "bytes32" }, keccak256(encodeData({
		data: value,
		primaryType: type,
		types
	}))];
	if (type === "bytes") return [{ type: "bytes32" }, keccak256(value)];
	if (type === "string") return [{ type: "bytes32" }, keccak256(toHex(value))];
	if (type.lastIndexOf("]") === type.length - 1) {
		const parsedType = type.slice(0, type.lastIndexOf("["));
		const typeValuePairs = value.map((item) => encodeField({
			name,
			type: parsedType,
			types,
			value: item
		}));
		return [{ type: "bytes32" }, keccak256(encodeAbiParameters(typeValuePairs.map(([t]) => t), typeValuePairs.map(([, v]) => v)))];
	}
	return [{ type }, value];
}
//#endregion
//#region node_modules/viem/_esm/accounts/utils/signTypedData.js
/**
* @description Signs typed data and calculates an Ethereum-specific signature in [https://eips.ethereum.org/EIPS/eip-712](https://eips.ethereum.org/EIPS/eip-712):
* `sign(keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message)))`.
*
* @returns The signature.
*/
async function signTypedData(parameters) {
	const { privateKey, ...typedData } = parameters;
	return await sign({
		hash: hashTypedData(typedData),
		privateKey,
		to: "hex"
	});
}
//#endregion
//#region node_modules/viem/_esm/accounts/privateKeyToAccount.js
/**
* @description Creates an Account from a private key.
*
* @returns A Private Key Account.
*/
function privateKeyToAccount(privateKey, options = {}) {
	const { nonceManager } = options;
	const publicKey = toHex(secp256k1.getPublicKey(privateKey.slice(2), false));
	return {
		...toAccount({
			address: publicKeyToAddress(publicKey),
			nonceManager,
			async sign({ hash }) {
				return sign({
					hash,
					privateKey,
					to: "hex"
				});
			},
			async signAuthorization(authorization) {
				return signAuthorization({
					...authorization,
					privateKey
				});
			},
			async signMessage({ message }) {
				return signMessage({
					message,
					privateKey
				});
			},
			async signTransaction(transaction, { serializer } = {}) {
				return signTransaction({
					privateKey,
					transaction,
					serializer
				});
			},
			async signTypedData(typedData) {
				return signTypedData({
					...typedData,
					privateKey
				});
			}
		}),
		publicKey,
		source: "privateKey"
	};
}
//#endregion
export { privateKeyToAccount as t };

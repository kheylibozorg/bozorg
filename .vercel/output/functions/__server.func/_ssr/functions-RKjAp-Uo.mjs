import { r as SCAN_RULE } from "./types-BFJLnIEL.mjs";
import { A as resetJournal, C as minCapUsd, D as publicSettings, E as patchSettings, F as seedDemoJournal, I as setScanCursor, L as stats, M as runIndicator, N as runTick, O as refreshUniverse, P as saveTradeNote, S as maybeSeedJournal, T as onlyClosedBars, _ as listOpenPositions, b as listUniverse, c as clearUniverseCache, d as getAdapter, f as getSettings, g as listEquity, h as listClosedPositions, i as bookVenue, j as rotateTickToken, k as replaceUniverse, l as fetchKlinesCached, m as hasLiveKeys, o as clearListedCache, p as getSql, r as accountFrom, s as clearUniverse, t as FALLBACK, u as filterByMinCap, v as listScanLog, x as looksLikeFallbackUniverse, y as listSignals } from "./tick.server-RDv3OzT7.mjs";
import { i as getCookie, n as createServerFn, o as setCookie$1, r as deleteCookie$1, t as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { a as object, i as number, n as boolean, o as string, t as _enum } from "../_libs/zod.mjs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-RKjAp-Uo.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var COOKIE = "apex_op";
var MAX_AGE = 1209600;
function hashPin(pin, salt) {
	return scryptSync(pin, salt, 32).toString("hex");
}
function safeEqualHex(a, b) {
	const ba = Buffer.from(a, "hex");
	const bb = Buffer.from(b, "hex");
	if (ba.length !== bb.length || ba.length === 0) return false;
	return timingSafeEqual(ba, bb);
}
function writeSessionCookie(session) {
	setCookie$1(COOKIE, session, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: MAX_AGE,
		secure: process.env.VERCEL === "1"
	});
}
async function lockStatus() {
	const row = await getSettings();
	const hasPin = Boolean(row.operator_pin_hash);
	const cookie = getCookie(COOKIE) ?? "";
	return {
		hasPin,
		unlocked: Boolean(hasPin && row.operator_session && cookie && cookie === row.operator_session)
	};
}
async function requireOperator() {
	const s = await lockStatus();
	if (!s.hasPin) throw new Error("Set an operator PIN first. Anyone with this link could change the desk until you do.");
	if (!s.unlocked) throw new Error("Desk is locked. Unlock with your PIN to change settings or see the cron token.");
}
async function setOperatorPin(pin) {
	const trimmed = pin.trim();
	if (trimmed.length < 6 || trimmed.length > 64) throw new Error("PIN must be 6–64 characters.");
	const current = await lockStatus();
	if (current.hasPin && !current.unlocked) throw new Error("Unlock the current PIN before replacing it.");
	const salt = randomBytes(16).toString("hex");
	const hash = hashPin(trimmed, salt);
	const session = randomBytes(24).toString("hex");
	await (await getSql())`
    update desk_settings
    set operator_pin_hash = ${hash},
        operator_pin_salt = ${salt},
        operator_session = ${session},
        updated_at = now()
    where id = 1
  `;
	writeSessionCookie(session);
	return {
		hasPin: true,
		unlocked: true
	};
}
async function unlockOperator(pin) {
	const row = await getSettings();
	if (!row.operator_pin_hash || !row.operator_pin_salt) throw new Error("No PIN set yet.");
	if (!safeEqualHex(hashPin(pin.trim(), row.operator_pin_salt), row.operator_pin_hash)) throw new Error("Wrong PIN.");
	const session = randomBytes(24).toString("hex");
	await (await getSql())`update desk_settings set operator_session = ${session}, updated_at = now() where id = 1`;
	writeSessionCookie(session);
	return {
		hasPin: true,
		unlocked: true
	};
}
async function lockOperator() {
	deleteCookie$1(COOKIE, { path: "/" });
	return { locked: true };
}
var getDesk_createServerFn_handler = createServerRpc({
	id: "bf39c38732e04027142d94e8edbfaaccfde7365c8ba31d1b1bb802f292510f41",
	name: "getDesk",
	filename: "src/lib/server/functions.ts"
}, (opts) => getDesk.__executeServer(opts));
var getDesk = createServerFn({ method: "GET" }).handler(getDesk_createServerFn_handler, async () => {
	await maybeSeedJournal();
	const lock = await lockStatus();
	const settings = publicSettings(await getSettings(), { unlocked: lock.unlocked });
	const venue = bookVenue(settings.venue);
	let universe = await listUniverse();
	if (!universe.length || !settings.universeVenue || bookVenue(settings.universeVenue) !== venue || looksLikeFallbackUniverse(universe)) try {
		universe = (await refreshUniverse(minCapUsd(settings.minMarketCapUsd), venue, true)).map((a) => ({
			symbol: a.symbol,
			base: a.base,
			name: a.name,
			market_cap_usd: a.marketCapUsd,
			volume_24h_usd: a.volume24hUsd,
			max_leverage: a.maxLeverage,
			venue_symbol: a.venueSymbol ?? a.symbol
		}));
	} catch {
		if (venue === "paper") {
			await replaceUniverse(FALLBACK);
			universe = await listUniverse();
		} else {
			try {
				await clearUniverse();
			} catch {}
			universe = [];
		}
	}
	universe = filterByMinCap(universe, minCapUsd(settings.minMarketCapUsd), (a) => Number(a.market_cap_usd));
	const [open, closed, signals, equity, scans, st] = await Promise.all([
		listOpenPositions(),
		listClosedPositions(60),
		listSignals(60),
		listEquity(80),
		listScanLog(24),
		stats()
	]);
	return {
		settings,
		lock,
		open,
		closed,
		signals,
		equity: equity.reverse(),
		scans,
		universe,
		stats: st
	};
});
var tickNow_createServerFn_handler = createServerRpc({
	id: "b5825ea3b020991663a72ea863a5d7e43c4690d8e946381fde90d4b88a17bdbe",
	name: "tickNow",
	filename: "src/lib/server/functions.ts"
}, (opts) => tickNow.__executeServer(opts));
var tickNow = createServerFn({ method: "POST" }).validator(object({
	forceUniverse: boolean().optional(),
	source: string().max(32).optional()
}).optional()).handler(tickNow_createServerFn_handler, async ({ data }) => {
	const lock = await lockStatus();
	if (lock.hasPin && !lock.unlocked) throw new Error("Desk is locked. Unlock to run a manual scan.");
	return runTick({
		forceUniverse: data?.forceUniverse,
		source: data?.source ?? "manual"
	});
});
var rotateDeskToken_createServerFn_handler = createServerRpc({
	id: "349887dd1cb30ec49d5e681b53524567fa27c97168784d805b6a312a6d6df3a7",
	name: "rotateDeskToken",
	filename: "src/lib/server/functions.ts"
}, (opts) => rotateDeskToken.__executeServer(opts));
var rotateDeskToken = createServerFn({ method: "POST" }).handler(rotateDeskToken_createServerFn_handler, async () => {
	await requireOperator();
	const row = await rotateTickToken();
	return publicSettings(row, { unlocked: true });
});
var saveDeskSettings_createServerFn_handler = createServerRpc({
	id: "8fa4ac9d596e86c3956fa0b32e871edea57a88551fb37623af946f8063c3e66c",
	name: "saveDeskSettings",
	filename: "src/lib/server/functions.ts"
}, (opts) => saveDeskSettings.__executeServer(opts));
var saveDeskSettings = createServerFn({ method: "POST" }).validator(object({
	mode: _enum(["paper", "live"]).optional(),
	venue: _enum([
		"paper",
		"hyperliquid",
		"lighter",
		"aster",
		"toobit"
	]).optional(),
	risk_pct: number().min(.1).max(5).optional(),
	capital_pct: number().min(1).max(100).optional(),
	max_positions: number().int().min(1).max(20).optional(),
	min_market_cap_usd: number().min(0).max(5e12).optional(),
	equity_usd: number().positive().optional(),
	starting_equity_usd: number().positive().optional(),
	live_enabled: number().int().min(0).max(1).optional(),
	bot_enabled: number().int().min(0).max(1).optional(),
	paper_24h: number().int().min(0).max(1).optional(),
	scan_batch: number().int().min(0).max(250).optional(),
	lighter_api_key: string().nullable().optional(),
	lighter_api_private_key: string().nullable().optional(),
	lighter_account_index: number().int().nullable().optional(),
	lighter_api_key_index: number().int().nullable().optional(),
	aster_api_key: string().nullable().optional(),
	aster_api_secret: string().nullable().optional(),
	toobit_api_key: string().nullable().optional(),
	toobit_api_secret: string().nullable().optional(),
	hyperliquid_private_key: string().nullable().optional(),
	hyperliquid_wallet_address: string().nullable().optional()
})).handler(saveDeskSettings_createServerFn_handler, async ({ data }) => {
	await requireOperator();
	if (data.mode === "live" && data.venue === "paper") throw new Error("Paper is simulation only. Pick Hyperliquid, Lighter, Aster, or Toobit for live fills.");
	const before = await getSettings();
	const patch = { ...data };
	const inferred = data.venue ? data.venue : data.hyperliquid_private_key ? "hyperliquid" : data.lighter_api_private_key ? "lighter" : data.aster_api_key && data.aster_api_secret ? "aster" : data.toobit_api_key && data.toobit_api_secret ? "toobit" : void 0;
	if (inferred) patch.venue = inferred;
	const venue = patch.venue ?? before.venue;
	const merged = {
		...before,
		hyperliquid_private_key: patch.hyperliquid_private_key ?? before.hyperliquid_private_key,
		lighter_api_private_key: patch.lighter_api_private_key ?? before.lighter_api_private_key,
		lighter_account_index: patch.lighter_account_index ?? before.lighter_account_index,
		aster_api_key: patch.aster_api_key ?? before.aster_api_key,
		aster_api_secret: patch.aster_api_secret ?? before.aster_api_secret,
		toobit_api_key: patch.toobit_api_key ?? before.toobit_api_key,
		toobit_api_secret: patch.toobit_api_secret ?? before.toobit_api_secret
	};
	const newKeys = Boolean(patch.hyperliquid_private_key || patch.lighter_api_private_key || patch.aster_api_key && patch.aster_api_secret || patch.toobit_api_key && patch.toobit_api_secret);
	if (venue !== "paper" && (newKeys || Boolean(inferred && inferred !== "paper")) && patch.mode !== "paper" && hasLiveKeys(merged, venue)) {
		patch.mode = patch.mode ?? "live";
		patch.live_enabled = patch.live_enabled ?? 1;
		patch.bot_enabled = patch.bot_enabled ?? 1;
	}
	const row = await patchSettings(patch);
	const venueChanged = Boolean(patch.venue && patch.venue !== before.venue);
	const modeChanged = Boolean(patch.mode && patch.mode !== before.mode);
	if (patch.min_market_cap_usd != null && minCapUsd(patch.min_market_cap_usd) !== minCapUsd(before.min_market_cap_usd)) try {
		await setScanCursor(0);
	} catch {}
	if (venueChanged || modeChanged || newKeys) {
		const v = bookVenue(row.venue);
		try {
			await setScanCursor(0);
		} catch {}
		try {
			clearListedCache(v);
			clearUniverseCache();
			await refreshUniverse(minCapUsd(row.min_market_cap_usd), v, true);
		} catch {
			if (v !== "paper") try {
				await clearUniverse();
			} catch {}
		}
	}
	return publicSettings(row, { unlocked: true });
});
var setDeskPin_createServerFn_handler = createServerRpc({
	id: "061db685f597ff62666a2887a7d68770b8b5e9347ce55392b65f40c657bc82dc",
	name: "setDeskPin",
	filename: "src/lib/server/functions.ts"
}, (opts) => setDeskPin.__executeServer(opts));
var setDeskPin = createServerFn({ method: "POST" }).validator(object({ pin: string().min(6).max(64) })).handler(setDeskPin_createServerFn_handler, async ({ data }) => {
	return setOperatorPin(data.pin);
});
var unlockDesk_createServerFn_handler = createServerRpc({
	id: "3124d2a14923c3fc91fb737ba65b53272e32bef10386e3be82aff6291b529724",
	name: "unlockDesk",
	filename: "src/lib/server/functions.ts"
}, (opts) => unlockDesk.__executeServer(opts));
var unlockDesk = createServerFn({ method: "POST" }).validator(object({ pin: string().min(1).max(64) })).handler(unlockDesk_createServerFn_handler, async ({ data }) => {
	return unlockOperator(data.pin);
});
var lockDesk_createServerFn_handler = createServerRpc({
	id: "039a33f78b54a4e0fe216da10bd78d42b890855ffa1d309924201c4e1e38eb4c",
	name: "lockDesk",
	filename: "src/lib/server/functions.ts"
}, (opts) => lockDesk.__executeServer(opts));
var lockDesk = createServerFn({ method: "POST" }).handler(lockDesk_createServerFn_handler, async () => {
	return lockOperator();
});
var refreshCoins_createServerFn_handler = createServerRpc({
	id: "fe674c6991390d75beec27fff34c9e508559466c404d1939170dd079e77852fb",
	name: "refreshCoins",
	filename: "src/lib/server/functions.ts"
}, (opts) => refreshCoins.__executeServer(opts));
var refreshCoins = createServerFn({ method: "POST" }).handler(refreshCoins_createServerFn_handler, async () => {
	const lock = await lockStatus();
	if (lock.hasPin && !lock.unlocked) throw new Error("Desk is locked.");
	const s = await getSettings();
	const venue = bookVenue(s.venue);
	clearListedCache(venue);
	clearUniverseCache();
	return {
		count: (await refreshUniverse(minCapUsd(s.min_market_cap_usd), venue, true)).length,
		venue
	};
});
var testVenue_createServerFn_handler = createServerRpc({
	id: "1dca5db0c82c3146dccc37079c7ad7d8709ff1adbe2eb39ca35642c269339bc9",
	name: "testVenue",
	filename: "src/lib/server/functions.ts"
}, (opts) => testVenue.__executeServer(opts));
var testVenue = createServerFn({ method: "POST" }).validator(object({ venue: _enum([
	"hyperliquid",
	"lighter",
	"aster",
	"toobit"
]) })).handler(testVenue_createServerFn_handler, async ({ data }) => {
	await requireOperator();
	const settings = await getSettings();
	const adapter = getAdapter(data.venue);
	if (!adapter) return {
		ok: false,
		message: "No adapter"
	};
	const res = await adapter.testConnection(accountFrom(settings, data.venue));
	if (res.ok) {
		try {
			await patchSettings({
				venue: data.venue,
				mode: "live",
				live_enabled: 1,
				bot_enabled: 1
			});
		} catch {}
		try {
			clearListedCache(data.venue);
			clearUniverseCache();
			const assets = await refreshUniverse(minCapUsd(settings.min_market_cap_usd), data.venue, true);
			return {
				ok: true,
				message: `${res.message} · ${assets.length} perps from ${adapter.label}`
			};
		} catch (e) {
			return {
				ok: true,
				message: `${res.message} · book failed (${e instanceof Error ? e.message : "listed markets"})`
			};
		}
	}
	return res;
});
var getJournal_createServerFn_handler = createServerRpc({
	id: "9611d6bbd7d61b428c99ac1e5f3012d02505e8e391e598110a5d497a4c5dd202",
	name: "getJournal",
	filename: "src/lib/server/functions.ts"
}, (opts) => getJournal.__executeServer(opts));
var getJournal = createServerFn({ method: "GET" }).handler(getJournal_createServerFn_handler, async () => {
	await maybeSeedJournal();
	const lock = await lockStatus();
	const settings = publicSettings(await getSettings(), { unlocked: lock.unlocked });
	const [open, closed, st] = await Promise.all([
		listOpenPositions(),
		listClosedPositions(2e3),
		stats()
	]);
	return {
		settings,
		lock,
		open,
		closed,
		stats: st
	};
});
var resetDeskJournal_createServerFn_handler = createServerRpc({
	id: "e43fde0818d40d516c5a977d5c9a045f0d5ea5b0fb1e3cab7fa1804894dee2a3",
	name: "resetDeskJournal",
	filename: "src/lib/server/functions.ts"
}, (opts) => resetDeskJournal.__executeServer(opts));
var resetDeskJournal = createServerFn({ method: "POST" }).validator(object({ scope: _enum(["closed", "paper"]) })).handler(resetDeskJournal_createServerFn_handler, async ({ data }) => {
	if ((await lockStatus()).hasPin) await requireOperator();
	return resetJournal(data.scope);
});
var seedDeskJournal_createServerFn_handler = createServerRpc({
	id: "c67d6055fb31e9e10cc3c1ce07bf4c3c5b153917304b79dedb10877fc7ef4313",
	name: "seedDeskJournal",
	filename: "src/lib/server/functions.ts"
}, (opts) => seedDeskJournal.__executeServer(opts));
var seedDeskJournal = createServerFn({ method: "POST" }).handler(seedDeskJournal_createServerFn_handler, async () => {
	if ((await lockStatus()).hasPin) await requireOperator();
	return seedDemoJournal();
});
var saveDeskTradeNote_createServerFn_handler = createServerRpc({
	id: "8f2a7724fceb919e594568ba458121728961f22bca8ecebd16303fe952fc9562",
	name: "saveDeskTradeNote",
	filename: "src/lib/server/functions.ts"
}, (opts) => saveDeskTradeNote.__executeServer(opts));
var saveDeskTradeNote = createServerFn({ method: "POST" }).validator(object({
	id: number().int(),
	notes: string().max(2e3)
})).handler(saveDeskTradeNote_createServerFn_handler, async ({ data }) => {
	if ((await lockStatus()).hasPin) await requireOperator();
	return saveTradeNote(data.id, data.notes);
});
var probeBtc_createServerFn_handler = createServerRpc({
	id: "92cc74e30111f606f86082685f11b450907ddf635cb21368bf245c650cae5724",
	name: "probeBtc",
	filename: "src/lib/server/functions.ts"
}, (opts) => probeBtc.__executeServer(opts));
var probeBtc = createServerFn({ method: "GET" }).handler(probeBtc_createServerFn_handler, async () => {
	const settings = await getSettings();
	const venue = bookVenue(settings.venue);
	const tf = "15m";
	const raw = await fetchKlinesCached("BTCUSDT", tf, 400, venue);
	const bars = onlyClosedBars(raw, tf);
	const htf = onlyClosedBars(await fetchKlinesCached("BTCUSDT", "1h", 200, venue), "1h");
	const htf2 = onlyClosedBars(await fetchKlinesCached("BTCUSDT", "4h", 120, venue), "4h");
	const engines = [];
	for (const name of SCAN_RULE[tf]) {
		const res = runIndicator(bars, tf, name, htf, htf2);
		engines.push({
			name,
			count: res.signals.length,
			lastBias: res.lastBias,
			armed: res.armed,
			lastAtr: res.lastAtr,
			lastClose: res.lastClose,
			last: res.signals.slice(-3).map((s) => ({
				side: s.side,
				entry: s.entry,
				sl: s.sl,
				tp: s.tp,
				rr: s.rr,
				barTime: s.barTime,
				reason: s.reason
			}))
		});
	}
	return {
		symbol: "BTCUSDT",
		tf,
		bars: bars.length,
		lastBar: bars[bars.length - 1]?.time ?? 0,
		engines
	};
});
//#endregion
export { getDesk_createServerFn_handler, getJournal_createServerFn_handler, lockDesk_createServerFn_handler, probeBtc_createServerFn_handler, refreshCoins_createServerFn_handler, resetDeskJournal_createServerFn_handler, rotateDeskToken_createServerFn_handler, saveDeskSettings_createServerFn_handler, saveDeskTradeNote_createServerFn_handler, seedDeskJournal_createServerFn_handler, setDeskPin_createServerFn_handler, testVenue_createServerFn_handler, tickNow_createServerFn_handler, unlockDesk_createServerFn_handler };

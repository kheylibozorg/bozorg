import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, n as createServerFn, t as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { a as object, i as number, n as boolean, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-D1fgtqih.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var copy = {
	fa: {
		brand: "میز اپکس",
		brandEn: "Apex Desk",
		tagline: "ورود مکانیکی APEX + کویل HALCYON + TREX + KETEX + SHETEX · فقط کلوز بار",
		desk: "میز",
		signals: "سیگنال‌ها",
		journal: "ژورنال",
		backtest: "آنالیز",
		universe: "جهان ارز",
		venues: "صرافی‌ها",
		alwaysOn: "همیشه روشن",
		audit: "ممیزی اندیکاتور",
		paper: "کاغذی",
		live: "واقعی",
		botOn: "ربات روشن",
		botOff: "ربات خاموش",
		equity: "سرمایه",
		open: "باز",
		winRate: "نرخ برد",
		netR: "R خالص",
		pnl: "سود و زیان",
		scanNow: "اسکن همین حالا",
		scanning: "در حال اسکن…",
		lastTick: "آخرین تیک",
		positions: "پوزیشن‌های باز",
		noPositions: "پوزیشنی باز نیست. کرون هر دقیقه آخرین کندل بسته‌شده را اسکن می‌کند.",
		recentSignals: "سیگنال‌های اخیر",
		noSignals: "هنوز سیگنالی ثبت نشده.",
		closed: "معاملات بسته",
		long: "لانگ",
		short: "شورت",
		risk: "ریسک هر معامله",
		capital: "درصد سرمایه",
		capitalHint: "از موجودی، به‌عنوان مارجین هر معامله. اهرم را خودت پایین می‌گذاری؛ از سقف همان ارز روی صرافی بالاتر نمی‌رود.",
		scanBatch: "ارز در هر تیک",
		autoLev: "حداکثر اهرم (قابل تنظیم)",
		maxPos: "حداکثر همزمان",
		minCap: "حداقل مارکت‌کپ",
		minCapHint: "۰ = همه ارزهای صرافی. واحد: میلیون دلار (۸۰۰ یعنی هشتصد میلیون).",
		minCapAll: "همه",
		venue: "صرافی",
		save: "ذخیره",
		saved: "ذخیره شد",
		refresh: "به‌روز کردن لیست",
		pair: "جفت صرافی",
		chart: "چارت",
		runBacktest: "آنالیز معاملات",
		running: "در حال اجرا…",
		trades: "معامله",
		pf: "ضریب سود",
		expect: "امید ریاضی R",
		dd: "بیشینه افت",
		bars: "کندل",
		how: "نحوه استفاده",
		token: "توکن کرون",
		keys: "کلیدها فقط بعد از باز کردن پین ذخیره می‌شوند. API و سکرت و پرایوت‌کی در Neon رمزنگاری می‌شوند (سکرت). Test سبز = زنده مسلح. کرون خودش سفارش می‌فرستد.",
		disclaimer: "ابزار معاملاتی است نه توصیه مالی. سه پروفایل قفل‌شدهٔ APEX، چهار کویل HALCYON، دو TREX، KETEX ۲.۲R و SHETEX ۱.۸R روی بیت‌کوین اسپات ۲۰۱۷–۲۰۲۶.",
		journalHint: "هر فیل با MAE/MFE، مدت نگهداری، مسیر قیمت و زمینهٔ سیگنال. فیلتر آمار را روی همان برش می‌سازد. ریست با پین، نمونه را دوباره پر نمی‌کند.",
		openNow: "باز روی میز",
		blotter: "دفتر معاملات",
		tradeDetail: "جزئیات معامله",
		pickTrade: "یک معامله را از جدول انتخاب کن.",
		exportCsv: "خروجی CSV",
		resetJournal: "ریست ژورنال",
		resetClosed: "پاک کردن بسته‌ها",
		resetPaper: "ریست کامل کاغذی",
		resetClosedHint: "معاملات بسته و سیگنال‌ها پاک می‌شود. پوزیشن باز می‌ماند. سرمایه به مقدار شروع برمی‌گردد.",
		resetPaperHint: "همهٔ معاملات کاغذی (باز و بسته) پاک می‌شود. سرمایه کاغذی به مقدار شروع برمی‌گردد. کلیدها و Live دست نمی‌خورند.",
		confirmReset: "این کار برگشت ندارد.",
		cancel: "انصراف",
		lockedReset: "برای ریست، اول پین را از صرافی‌ها باز کن.",
		setPinFirst: "اول از صرافی‌ها پین بگذار؛ ریست بدون پین ممکن نیست.",
		resetDone: "ژورنال ریست شد.",
		filters: "فیلتر",
		all: "همه",
		reason: "خروج",
		hold: "نگهداری",
		fees: "کارمزد",
		mae: "MAE",
		mfe: "MFE",
		plannedRr: "R:R برنامه",
		origStop: "استاپ اولیه",
		qty: "مقدار",
		notional: "حجم",
		margin: "مارجین",
		equityAtOpen: "سرمایه ورود",
		atr: "ATR ورود",
		signalWhy: "منطق سیگنال",
		barsHeld: "کندل نگهداری",
		orderId: "شناسه سفارش",
		avgWin: "میانگین برد",
		avgLoss: "میانگین باخت",
		streak: "رگه",
		byIndicator: "بر اساس اندیکاتور",
		byTf: "بر اساس تایم‌فریم",
		bySide: "بر اساس سمت",
		byExit: "بر اساس خروج",
		rDist: "توزیع R",
		showing: "نمایش",
		ofTrades: "معامله",
		beMoved: "استاپ به ورود",
		exitPx: "قیمت خروج",
		openedAt: "زمان ورود",
		closedAt: "زمان خروج",
		candle: "کندل سیگنال",
		yes: "بله",
		no: "خیر",
		noClosed: "هنوز معاملهٔ بسته‌ای نیست. بعد از اولین فیل اینجا پر می‌شود.",
		confirmClosedBtn: "بسته‌ها را پاک کن",
		confirmPaperBtn: "کاغذی را صفر کن",
		reasonSl: "استاپ",
		reasonTp: "تارگت",
		reasonBe: "ورود (BE)",
		reasonVenue: "صرافی",
		wins: "برد",
		losses: "باخت",
		curve: "منحنی سرمایه",
		mode: "حالت",
		symbol: "نماد",
		loadSample: "بارگذاری نمونه",
		sampleLoaded: "دفتر نمونه آمد.",
		sampleSkip: "دفتر خالی نیست؛ اول ریست کن.",
		note: "یادداشت",
		saveNote: "ذخیره یادداشت",
		noteHint: "یادداشت روی همین معامله می‌ماند.",
		noteSaved: "یادداشت ذخیره شد.",
		path: "مسیر معامله",
		capture: "جذب حرکت",
		giveback: "برگشت از MFE",
		emptyJournal: "دفتر خالی است",
		emptyJournalHint: "بعد از اولین فیل اینجا پر می‌شود. برای دیدن شکل ژورنال، دفتر نمونه را بار کن.",
		thInd: "اندیکاتور",
		thOut: "خروج",
		thSide: "سمت"
	},
	en: {
		brand: "Apex Desk",
		brandEn: "Apex Desk",
		tagline: "Mechanical APEX + HALCYON coil + TREX + KETEX + SHETEX entries · closed bars only",
		desk: "Desk",
		signals: "Signals",
		journal: "Journal",
		backtest: "Analyze",
		universe: "Universe",
		venues: "Venues",
		alwaysOn: "Always on",
		audit: "Indicator audit",
		paper: "Paper",
		live: "Live",
		botOn: "Bot on",
		botOff: "Bot off",
		equity: "Equity",
		open: "Open",
		winRate: "Win rate",
		netR: "Net R",
		pnl: "P&L",
		scanNow: "Scan now",
		scanning: "Scanning…",
		lastTick: "Last tick",
		positions: "Open positions",
		noPositions: "No open positions. Cron scans the just-closed bar every minute.",
		recentSignals: "Recent signals",
		noSignals: "No signals logged yet.",
		closed: "Closed trades",
		long: "Long",
		short: "Short",
		risk: "Risk per trade",
		capital: "Capital %",
		capitalHint: "Share of equity used as margin per trade. You set the leverage cap below; the bot never exceeds that coin's venue max.",
		scanBatch: "Coins per tick",
		autoLev: "Max leverage (you set this)",
		maxPos: "Max concurrent",
		minCap: "Min market cap",
		minCapHint: "0 = every coin on the venue. Unit: USD millions (800 = $800M).",
		minCapAll: "All",
		venue: "Venue",
		save: "Save",
		saved: "Saved",
		refresh: "Refresh list",
		pair: "Venue pair",
		chart: "Chart",
		runBacktest: "Analyze trades",
		running: "Running…",
		trades: "Trades",
		pf: "Profit factor",
		expect: "E[R]",
		dd: "Max DD",
		bars: "Bars",
		how: "How to use",
		token: "Cron token",
		keys: "API keys save only after the operator PIN is unlocked. API, secret, and private keys are encrypted at rest in Neon. A green Test arms live; cron sends the order.",
		disclaimer: "Trading tool, not advice. Three locked APEX profiles, four HALCYON coils, two TREX labs, KETEX 2.2R and SHETEX 1.8R, tuned on BTC spot 2017–2026.",
		journalHint: "Every fill logs MAE/MFE, hold time, the price path and signal context. Filters rebuild stats on that slice. A PIN reset does not reload the sample blotter.",
		openNow: "Open on the desk",
		blotter: "Blotter",
		tradeDetail: "Trade detail",
		pickTrade: "Pick a trade from the table.",
		exportCsv: "Export CSV",
		resetJournal: "Reset journal",
		resetClosed: "Clear closed",
		resetPaper: "Full paper reset",
		resetClosedHint: "Deletes closed trades and signals. Open positions stay. Equity returns to the starting amount.",
		resetPaperHint: "Deletes every paper trade (open and closed). Paper equity returns to start. Keys and live mode are untouched.",
		confirmReset: "This cannot be undone.",
		cancel: "Cancel",
		lockedReset: "Unlock the PIN on Venues before resetting.",
		setPinFirst: "Set a PIN on Venues first. Reset is blocked until then.",
		resetDone: "Journal reset.",
		filters: "Filter",
		all: "All",
		reason: "Exit",
		hold: "Hold",
		fees: "Fees",
		mae: "MAE",
		mfe: "MFE",
		plannedRr: "Planned R:R",
		origStop: "Original stop",
		qty: "Qty",
		notional: "Notional",
		margin: "Margin",
		equityAtOpen: "Equity at entry",
		atr: "ATR at entry",
		signalWhy: "Signal logic",
		barsHeld: "Bars held",
		orderId: "Order id",
		avgWin: "Avg win",
		avgLoss: "Avg loss",
		streak: "Streak",
		byIndicator: "By indicator",
		byTf: "By timeframe",
		bySide: "By side",
		byExit: "By exit",
		rDist: "R distribution",
		showing: "Showing",
		ofTrades: "trades",
		beMoved: "Stop to entry",
		exitPx: "Exit price",
		openedAt: "Opened",
		closedAt: "Closed",
		candle: "Signal candle",
		yes: "Yes",
		no: "No",
		noClosed: "No closed trades yet. The blotter fills after the first exit.",
		confirmClosedBtn: "Clear closed trades",
		confirmPaperBtn: "Zero the paper book",
		reasonSl: "Stop",
		reasonTp: "Target",
		reasonBe: "Break-even",
		reasonVenue: "Venue",
		wins: "Wins",
		losses: "Losses",
		curve: "Equity curve",
		mode: "Mode",
		symbol: "Symbol",
		loadSample: "Load sample",
		sampleLoaded: "Sample blotter loaded.",
		sampleSkip: "Blotter is not empty. Reset first.",
		note: "Note",
		saveNote: "Save note",
		noteHint: "Stays on this trade.",
		noteSaved: "Note saved.",
		path: "Trade path",
		capture: "Capture",
		giveback: "Giveback from MFE",
		emptyJournal: "Blotter is empty",
		emptyJournalHint: "Fills after the first exit. Load the sample blotter to see the journal shape.",
		thInd: "Ind",
		thOut: "Out",
		thSide: "Side"
	}
};
var Ctx = (0, import_react.createContext)(null);
function LocaleProvider({ children }) {
	const [locale, setLocaleState] = (0, import_react.useState)("fa");
	(0, import_react.useEffect)(() => {
		const saved = localStorage.getItem("apex-locale");
		if (saved === "en" || saved === "fa") setLocaleState(saved);
	}, []);
	const setLocale = (l) => {
		setLocaleState(l);
		localStorage.setItem("apex-locale", l);
		document.documentElement.lang = l === "fa" ? "fa" : "en";
		document.documentElement.dir = l === "fa" ? "rtl" : "ltr";
	};
	(0, import_react.useEffect)(() => {
		document.documentElement.lang = locale === "fa" ? "fa" : "en";
		document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
	}, [locale]);
	const value = (0, import_react.useMemo)(() => ({
		locale,
		t: copy[locale],
		setLocale
	}), [locale]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ctx.Provider, {
		value,
		children
	});
}
function useLocale() {
	const v = (0, import_react.useContext)(Ctx);
	if (!v) throw new Error("LocaleProvider missing");
	return v;
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getDesk = createServerFn({ method: "GET" }).handler(createSsrRpc("bf39c38732e04027142d94e8edbfaaccfde7365c8ba31d1b1bb802f292510f41"));
var tickNow = createServerFn({ method: "POST" }).validator(object({
	forceUniverse: boolean().optional(),
	source: string().max(32).optional()
}).optional()).handler(createSsrRpc("b5825ea3b020991663a72ea863a5d7e43c4690d8e946381fde90d4b88a17bdbe"));
var rotateDeskToken = createServerFn({ method: "POST" }).handler(createSsrRpc("349887dd1cb30ec49d5e681b53524567fa27c97168784d805b6a312a6d6df3a7"));
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
	max_leverage: number().int().min(1).max(200).optional(),
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
})).handler(createSsrRpc("8fa4ac9d596e86c3956fa0b32e871edea57a88551fb37623af946f8063c3e66c"));
var setDeskPin = createServerFn({ method: "POST" }).validator(object({ pin: string().min(6).max(64) })).handler(createSsrRpc("061db685f597ff62666a2887a7d68770b8b5e9347ce55392b65f40c657bc82dc"));
var unlockDesk = createServerFn({ method: "POST" }).validator(object({ pin: string().min(1).max(64) })).handler(createSsrRpc("3124d2a14923c3fc91fb737ba65b53272e32bef10386e3be82aff6291b529724"));
var lockDesk = createServerFn({ method: "POST" }).handler(createSsrRpc("039a33f78b54a4e0fe216da10bd78d42b890855ffa1d309924201c4e1e38eb4c"));
var refreshCoins = createServerFn({ method: "POST" }).handler(createSsrRpc("fe674c6991390d75beec27fff34c9e508559466c404d1939170dd079e77852fb"));
var testVenue = createServerFn({ method: "POST" }).validator(object({ venue: _enum([
	"hyperliquid",
	"lighter",
	"aster",
	"toobit"
]) })).handler(createSsrRpc("1dca5db0c82c3146dccc37079c7ad7d8709ff1adbe2eb39ca35642c269339bc9"));
var getJournal = createServerFn({ method: "GET" }).handler(createSsrRpc("9611d6bbd7d61b428c99ac1e5f3012d02505e8e391e598110a5d497a4c5dd202"));
var resetDeskJournal = createServerFn({ method: "POST" }).validator(object({ scope: _enum(["closed", "paper"]) })).handler(createSsrRpc("e43fde0818d40d516c5a977d5c9a045f0d5ea5b0fb1e3cab7fa1804894dee2a3"));
var seedDeskJournal = createServerFn({ method: "POST" }).handler(createSsrRpc("c67d6055fb31e9e10cc3c1ce07bf4c3c5b153917304b79dedb10877fc7ef4313"));
var saveDeskTradeNote = createServerFn({ method: "POST" }).validator(object({
	id: number().int(),
	notes: string().max(2e3)
})).handler(createSsrRpc("8f2a7724fceb919e594568ba458121728961f22bca8ecebd16303fe952fc9562"));
var probeBtc = createServerFn({ method: "GET" }).handler(createSsrRpc("92cc74e30111f606f86082685f11b450907ddf635cb21368bf245c650cae5724"));
//#endregion
export { probeBtc as a, rotateDeskToken as c, seedDeskJournal as d, setDeskPin as f, useLocale as g, unlockDesk as h, lockDesk as i, saveDeskSettings as l, tickNow as m, getDesk as n, refreshCoins as o, testVenue as p, getJournal as r, resetDeskJournal as s, LocaleProvider as t, saveDeskTradeNote as u };

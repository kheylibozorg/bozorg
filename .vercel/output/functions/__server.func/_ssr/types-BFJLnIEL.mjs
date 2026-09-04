//#region node_modules/.nitro/vite/services/ssr/assets/types-BFJLnIEL.js
function tfBucket(tf) {
	if (tf === "5m") return "5m";
	if (tf === "15m") return "15m";
	return "1h";
}
var RR = {
	APEX1: 1,
	APEX15: 1.5,
	APEX2: 2
};
/** Auto-gates from the published Pine scripts (locked lab profiles). */
var GATES = {
	APEX1: {
		"5m": {
			minBr: .45,
			emaStack: true,
			requireDI: true,
			requireCover1: false,
			minTests: 1,
			minAwayAtr: 1.5,
			sides: "Short",
			slAtrMult: .15,
			minRoomR: 1.8,
			ftcWait: 12,
			cooldownBars: 2,
			minLegAtr: 2.2,
			bandAtr: .8,
			minStopPct: .35,
			widenStop: false,
			minVol: 0
		},
		"15m": {
			minBr: .55,
			emaStack: false,
			requireDI: false,
			requireCover1: true,
			minTests: 2,
			minAwayAtr: 1.5,
			sides: "Both",
			slAtrMult: .5,
			minRoomR: 1.2,
			ftcWait: 12,
			cooldownBars: 2,
			minLegAtr: 2,
			bandAtr: .85,
			minStopPct: .5,
			widenStop: false,
			minVol: 0
		},
		"1h": {
			minBr: .6,
			emaStack: true,
			requireDI: false,
			requireCover1: true,
			minTests: 1,
			minAwayAtr: 1,
			sides: "Both",
			slAtrMult: .5,
			minRoomR: 1.2,
			ftcWait: 12,
			cooldownBars: 2,
			minLegAtr: 2,
			bandAtr: .85,
			minStopPct: .6,
			widenStop: false,
			minVol: 0
		}
	},
	APEX15: {
		"5m": {
			minBr: .55,
			emaStack: true,
			requireDI: true,
			requireCover1: true,
			minTests: 2,
			minAwayAtr: 1.5,
			sides: "Short",
			slAtrMult: .15,
			minRoomR: 1.8,
			ftcWait: 12,
			cooldownBars: 2,
			minLegAtr: 2.6,
			bandAtr: .7,
			minStopPct: .233,
			widenStop: true,
			minVol: 0
		},
		"15m": {
			minBr: .55,
			emaStack: true,
			requireDI: true,
			requireCover1: true,
			minTests: 2,
			minAwayAtr: 1.5,
			sides: "Both",
			slAtrMult: .35,
			minRoomR: 1.8,
			ftcWait: 8,
			cooldownBars: 5,
			minLegAtr: 2.6,
			bandAtr: .7,
			minStopPct: .35,
			widenStop: true,
			minVol: 0
		},
		"1h": {
			minBr: .75,
			emaStack: true,
			requireDI: false,
			requireCover1: false,
			minTests: 1,
			minAwayAtr: 1.5,
			sides: "Both",
			slAtrMult: .15,
			minRoomR: 1.8,
			ftcWait: 12,
			cooldownBars: 2,
			minLegAtr: 2.2,
			bandAtr: .8,
			minStopPct: .4,
			widenStop: false,
			minVol: 0
		}
	},
	APEX2: {
		"5m": {
			minBr: .7,
			emaStack: false,
			requireDI: true,
			requireCover1: false,
			minTests: 2,
			minAwayAtr: 1,
			sides: "Short",
			slAtrMult: .15,
			minRoomR: 1.8,
			ftcWait: 12,
			cooldownBars: 2,
			minLegAtr: 2.2,
			bandAtr: .8,
			minStopPct: .175,
			widenStop: true,
			minVol: .8
		},
		"15m": {
			minBr: .55,
			emaStack: false,
			requireDI: false,
			requireCover1: false,
			minTests: 1,
			minAwayAtr: 1.5,
			sides: "Short",
			slAtrMult: .15,
			minRoomR: 1.8,
			ftcWait: 12,
			cooldownBars: 2,
			minLegAtr: 2.2,
			bandAtr: .8,
			minStopPct: .25,
			widenStop: true,
			minVol: .9
		},
		"1h": {
			minBr: 0,
			emaStack: false,
			requireDI: false,
			requireCover1: true,
			minTests: 1,
			minAwayAtr: 1,
			sides: "Short",
			slAtrMult: .15,
			minRoomR: 2.2,
			ftcWait: 8,
			cooldownBars: 3,
			minLegAtr: 2.6,
			bandAtr: .7,
			minStopPct: .45,
			widenStop: false,
			minVol: 0
		}
	}
};
function apexProfile(name, tf) {
	return {
		name,
		rr: RR[name],
		useHtf: true,
		useHtf2: true,
		useEma84: true,
		confirmCl: true,
		emaStack: true,
		requireDI: false,
		minBr: .6,
		requireCover1: true,
		legLookback: 40,
		minLegAtr: 2,
		coverMax: 2,
		needThird: true,
		useLongbar: true,
		slAtrMult: .5,
		ftcWait: 12,
		minRoomR: 1.2,
		cooldownBars: 2,
		minTests: 1,
		minAwayAtr: 1,
		bandAtr: .85,
		minStopPct: .6,
		widenStop: false,
		minVol: 0,
		sides: "Both",
		...GATES[name][tfBucket(tf)],
		name,
		rr: RR[name]
	};
}
function indicatorLabel(name) {
	if (name === "APEX1") return "1R";
	if (name === "APEX15") return "1.5R";
	if (name === "APEX2") return "2R";
	if (name === "HAEG") return "Aegis";
	if (name === "HVES") return "Vesper";
	if (name === "HORI") return "Orion";
	if (name === "HALC") return "Coil";
	if (name === "TREX1") return "T1.0";
	if (name === "TREX12") return "T1.2";
	if (name === "KETEX") return "KETEX";
	if (name === "SHETEX") return "SHETEX";
	return name;
}
function isApexName(name) {
	return name === "APEX1" || name === "APEX15" || name === "APEX2";
}
function isHalcyonName(name) {
	return name === "HAEG" || name === "HVES" || name === "HORI" || name === "HALC";
}
function isTrexName(name) {
	return name === "TREX1" || name === "TREX12";
}
function isKetexName(name) {
	return name === "KETEX";
}
function isShetexName(name) {
	return name === "SHETEX";
}
var TF_MS = {
	"5m": 3e5,
	"15m": 9e5,
	"1h": 36e5,
	"4h": 144e5,
	"1d": 864e5,
	"1w": 6048e5
};
/** Pine htfOf() */
var HTF_OF = {
	"5m": "15m",
	"15m": "1h",
	"1h": "4h",
	"4h": "1d"
};
/** Pine htf2Of() — second HTF ×16 */
var HTF2_OF = {
	"5m": "1h",
	"15m": "4h",
	"1h": "1d",
	"4h": "1w"
};
/** Highest-R first inside each family so coinciding fills prefer the larger target. */
var SCAN_RULE = {
	"5m": [
		"APEX2",
		"APEX15",
		"APEX1",
		"HORI",
		"HVES",
		"HAEG",
		"HALC",
		"TREX12",
		"TREX1",
		"KETEX",
		"SHETEX"
	],
	"15m": [
		"APEX2",
		"APEX15",
		"APEX1",
		"HORI",
		"HVES",
		"HAEG",
		"HALC",
		"TREX12",
		"TREX1",
		"KETEX",
		"SHETEX"
	],
	"1h": [
		"APEX2",
		"APEX15",
		"APEX1",
		"HORI",
		"HVES",
		"HAEG",
		"HALC",
		"TREX12",
		"TREX1",
		"KETEX",
		"SHETEX"
	],
	"4h": [
		"APEX2",
		"APEX15",
		"APEX1",
		"HORI",
		"HVES",
		"HAEG",
		"HALC",
		"TREX12",
		"TREX1",
		"KETEX",
		"SHETEX"
	]
};
//#endregion
export { apexProfile as a, isHalcyonName as c, isTrexName as d, TF_MS as i, isKetexName as l, HTF_OF as n, indicatorLabel as o, SCAN_RULE as r, isApexName as s, HTF2_OF as t, isShetexName as u };

export type Timeframe = "5m" | "15m" | "1h" | "4h";
export type KlineTf = Timeframe | "1d" | "1w";
export type Side = "long" | "short";
/** APEX reversal profiles — locked lab gates. Do not mix with HALCYON. */
export type ApexName = "APEX1" | "APEX15" | "APEX2";
/** HALCYON compression-coil companions. Aegis/Vesper/Orion share one lock; Coil is the original. */
export type HalcyonName = "HAEG" | "HVES" | "HORI" | "HALC";
/** TREX Entries Lab companions. Do not mix with APEX or HALCYON. */
export type TrexName = "TREX1" | "TREX12";
/** KETEX — APEX entries from ketex.txt. Own family. Do not mix with APEX / HALCYON / TREX. */
export type KetexName = "KETEX";
/** SHETEX — TREX Entries from shetex.txt. Own family. Do not mix with TREX1 / TREX12. */
export type ShetexName = "SHETEX";
export type IndicatorName = ApexName | HalcyonName | TrexName | KetexName | ShetexName;
export type VenueId = "paper" | "hyperliquid" | "lighter" | "aster" | "toobit";
export type TradeMode = "paper" | "live";
export type SidesFilter = "Both" | "Long" | "Short";

export type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Profile = {
  name: ApexName;
  rr: number;
  useHtf: boolean;
  useHtf2: boolean;
  useEma84: boolean;
  confirmCl: boolean;
  emaStack: boolean;
  requireDI: boolean;
  minBr: number;
  requireCover1: boolean;
  legLookback: number;
  minLegAtr: number;
  coverMax: 1 | 2;
  needThird: boolean;
  useLongbar: boolean;
  slAtrMult: number;
  ftcWait: number;
  minRoomR: number;
  cooldownBars: number;
  minTests: number;
  minAwayAtr: number;
  bandAtr: number;
  minStopPct: number;
  widenStop: boolean;
  minVol: number;
  sides: SidesFilter;
};

type TfBucket = "5m" | "15m" | "1h";

function tfBucket(tf: Timeframe): TfBucket {
  if (tf === "5m") return "5m";
  if (tf === "15m") return "15m";
  return "1h";
}

const RR: Record<ApexName, number> = {
  APEX1: 1.0,
  APEX15: 1.5,
  APEX2: 2.0,
};

/** Auto-gates from the published Pine scripts (locked lab profiles). */
const GATES: Record<ApexName, Record<TfBucket, Partial<Profile>>> = {
  APEX1: {
    "5m": {
      minBr: 0.45,
      emaStack: true,
      requireDI: true,
      requireCover1: false,
      minTests: 1,
      minAwayAtr: 1.5,
      sides: "Short",
      slAtrMult: 0.15,
      minRoomR: 1.8,
      ftcWait: 12,
      cooldownBars: 2,
      minLegAtr: 2.2,
      bandAtr: 0.8,
      minStopPct: 0.35,
      widenStop: false,
      minVol: 0,
    },
    "15m": {
      minBr: 0.55,
      emaStack: false,
      requireDI: false,
      requireCover1: true,
      minTests: 2,
      minAwayAtr: 1.5,
      sides: "Both",
      slAtrMult: 0.5,
      minRoomR: 1.2,
      ftcWait: 12,
      cooldownBars: 2,
      minLegAtr: 2.0,
      bandAtr: 0.85,
      minStopPct: 0.5,
      widenStop: false,
      minVol: 0,
    },
    "1h": {
      minBr: 0.6,
      emaStack: true,
      requireDI: false,
      requireCover1: true,
      minTests: 1,
      minAwayAtr: 1.0,
      sides: "Both",
      slAtrMult: 0.5,
      minRoomR: 1.2,
      ftcWait: 12,
      cooldownBars: 2,
      minLegAtr: 2.0,
      bandAtr: 0.85,
      minStopPct: 0.6,
      widenStop: false,
      minVol: 0,
    },
  },
  APEX15: {
    "5m": {
      minBr: 0.55,
      emaStack: true,
      requireDI: true,
      requireCover1: true,
      minTests: 2,
      minAwayAtr: 1.5,
      sides: "Short",
      slAtrMult: 0.15,
      minRoomR: 1.8,
      ftcWait: 12,
      cooldownBars: 2,
      minLegAtr: 2.6,
      bandAtr: 0.7,
      minStopPct: 0.233,
      widenStop: true,
      minVol: 0,
    },
    "15m": {
      minBr: 0.55,
      emaStack: true,
      requireDI: true,
      requireCover1: true,
      minTests: 2,
      minAwayAtr: 1.5,
      sides: "Both",
      slAtrMult: 0.35,
      minRoomR: 1.8,
      ftcWait: 8,
      cooldownBars: 5,
      minLegAtr: 2.6,
      bandAtr: 0.7,
      minStopPct: 0.35,
      widenStop: true,
      minVol: 0,
    },
    "1h": {
      minBr: 0.75,
      emaStack: true,
      requireDI: false,
      requireCover1: false,
      minTests: 1,
      minAwayAtr: 1.5,
      sides: "Both",
      slAtrMult: 0.15,
      minRoomR: 1.8,
      ftcWait: 12,
      cooldownBars: 2,
      minLegAtr: 2.2,
      bandAtr: 0.8,
      minStopPct: 0.4,
      widenStop: false,
      minVol: 0,
    },
  },
  APEX2: {
    "5m": {
      minBr: 0.7,
      emaStack: false,
      requireDI: true,
      requireCover1: false,
      minTests: 2,
      minAwayAtr: 1.0,
      sides: "Short",
      slAtrMult: 0.15,
      minRoomR: 1.8,
      ftcWait: 12,
      cooldownBars: 2,
      minLegAtr: 2.2,
      bandAtr: 0.8,
      minStopPct: 0.175,
      widenStop: true,
      minVol: 0.8,
    },
    "15m": {
      minBr: 0.55,
      emaStack: false,
      requireDI: false,
      requireCover1: false,
      minTests: 1,
      minAwayAtr: 1.5,
      sides: "Short",
      slAtrMult: 0.15,
      minRoomR: 1.8,
      ftcWait: 12,
      cooldownBars: 2,
      minLegAtr: 2.2,
      bandAtr: 0.8,
      minStopPct: 0.25,
      widenStop: true,
      minVol: 0.9,
    },
    "1h": {
      minBr: 0.0,
      emaStack: false,
      requireDI: false,
      requireCover1: true,
      minTests: 1,
      minAwayAtr: 1.0,
      sides: "Short",
      slAtrMult: 0.15,
      minRoomR: 2.2,
      ftcWait: 8,
      cooldownBars: 3,
      minLegAtr: 2.6,
      bandAtr: 0.7,
      minStopPct: 0.45,
      widenStop: false,
      minVol: 0,
    },
  },
};

export function apexProfile(name: ApexName, tf: Timeframe): Profile {
  const base: Profile = {
    name,
    rr: RR[name],
    useHtf: true,
    useHtf2: true,
    useEma84: true,
    confirmCl: true,
    emaStack: true,
    requireDI: false,
    minBr: 0.6,
    requireCover1: true,
    legLookback: 40,
    minLegAtr: 2.0,
    coverMax: 2,
    needThird: true,
    useLongbar: true,
    slAtrMult: 0.5,
    ftcWait: 12,
    minRoomR: 1.2,
    cooldownBars: 2,
    minTests: 1,
    minAwayAtr: 1.0,
    bandAtr: 0.85,
    minStopPct: 0.6,
    widenStop: false,
    minVol: 0,
    sides: "Both",
  };
  return { ...base, ...GATES[name][tfBucket(tf)], name, rr: RR[name] };
}

export const INDICATOR_LABEL: Record<IndicatorName, string> = {
  APEX1: "1R",
  APEX15: "1.5R",
  APEX2: "2R",
  HAEG: "Aegis",
  HVES: "Vesper",
  HORI: "Orion",
  HALC: "Coil",
  TREX1: "T1.0",
  TREX12: "T1.2",
  KETEX: "KETEX",
  SHETEX: "SHETEX",
};

export function indicatorLabel(name: string): string {
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

export function isApexName(name: string): name is ApexName {
  return name === "APEX1" || name === "APEX15" || name === "APEX2";
}

export function isHalcyonName(name: string): name is HalcyonName {
  return name === "HAEG" || name === "HVES" || name === "HORI" || name === "HALC";
}

export function isTrexName(name: string): name is TrexName {
  return name === "TREX1" || name === "TREX12";
}

export function isKetexName(name: string): name is KetexName {
  return name === "KETEX";
}

export function isShetexName(name: string): name is ShetexName {
  return name === "SHETEX";
}

export type Signal = {
  barIndex: number;
  barTime: number;
  indicator: IndicatorName;
  side: Side;
  entry: number;
  sl: number;
  tp: number;
  rr: number;
  atr: number;
  reason: string;
  /** TREX only — move stop to entry after this R. APEX / HALCYON leave this unset. */
  beAtR?: number;
};

export type EngineResult = {
  signals: Signal[];
  lastAtr: number;
  lastClose: number;
  lastBias: "LONG" | "SHORT" | "FLAT";
  armed: "LONG" | "SHORT" | null;
};

export const FEE_BPS = 4;
/** Longest custom ATR length is 264. Signals before this bar are noise. */
export const WARMUP = 266;

export const TF_MS: Record<KlineTf, number> = {
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

/** @deprecated alias — same map as TF_MS */
export const HTF_MS = TF_MS;

/** Pine htfOf() */
export const HTF_OF: Record<Timeframe, KlineTf> = {
  "5m": "15m",
  "15m": "1h",
  "1h": "4h",
  "4h": "1d",
};

/** Pine htf2Of() — second HTF ×16 */
export const HTF2_OF: Record<Timeframe, KlineTf> = {
  "5m": "1h",
  "15m": "4h",
  "1h": "1d",
  "4h": "1w",
};

export const APEX_INDICATORS: ApexName[] = ["APEX1", "APEX15", "APEX2"];
export const HALCYON_INDICATORS: HalcyonName[] = ["HAEG", "HVES", "HORI", "HALC"];
export const TREX_INDICATORS: TrexName[] = ["TREX12", "TREX1"];
export const KETEX_INDICATORS: KetexName[] = ["KETEX"];
export const SHETEX_INDICATORS: ShetexName[] = ["SHETEX"];

/** Highest-R first inside each family so coinciding fills prefer the larger target. */
export const SCAN_RULE: Record<Timeframe, IndicatorName[]> = {
  "5m": ["APEX2", "APEX15", "APEX1", "HORI", "HVES", "HAEG", "HALC", "TREX12", "TREX1", "KETEX", "SHETEX"],
  "15m": ["APEX2", "APEX15", "APEX1", "HORI", "HVES", "HAEG", "HALC", "TREX12", "TREX1", "KETEX", "SHETEX"],
  "1h": ["APEX2", "APEX15", "APEX1", "HORI", "HVES", "HAEG", "HALC", "TREX12", "TREX1", "KETEX", "SHETEX"],
  "4h": ["APEX2", "APEX15", "APEX1", "HORI", "HVES", "HAEG", "HALC", "TREX12", "TREX1", "KETEX", "SHETEX"],
};

export const ALL_INDICATORS: IndicatorName[] = [
  "APEX1",
  "APEX15",
  "APEX2",
  "HAEG",
  "HVES",
  "HORI",
  "HALC",
  "TREX1",
  "TREX12",
  "KETEX",
  "SHETEX",
];

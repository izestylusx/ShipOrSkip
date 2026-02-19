import type { Category } from "@/types";

export const ALL_CATEGORIES: Category[] = [
  "DEX",
  "Lending",
  "Yield",
  "Bridge",
  "Launchpad",
  "Gaming",
  "NFT",
  "Meme",
  "Stablecoin",
  "Infrastructure",
  "AI",
];

type CategorySignal = {
  term: string;
  weight: number;
};

export interface CategoryPrediction {
  category: Category;
  score: number;
  confidence: number;
  matchedSignals: string[];
}

export interface ResolvedCategoryWeight {
  category: Category;
  weight: number;
  confidence: number;
}

export type CategorySelectionSource = "user_selected" | "auto_inferred";

export interface CategoryResolution {
  source: CategorySelectionSource;
  primaryCategory: Category;
  categories: ResolvedCategoryWeight[];
  inferred: CategoryPrediction[];
}

const CATEGORY_SIGNALS: Record<Category, CategorySignal[]> = {
  DEX: [
    { term: "dex", weight: 3.2 },
    { term: "swap", weight: 2.8 },
    { term: "amm", weight: 2.6 },
    { term: "aggregator", weight: 2.2 },
    { term: "orderbook", weight: 2.0 },
    { term: "liquidity pool", weight: 2.0 },
    { term: "route", weight: 1.2 },
  ],
  Lending: [
    { term: "lending", weight: 3.0 },
    { term: "lend", weight: 2.6 },
    { term: "borrow", weight: 2.6 },
    { term: "loan", weight: 2.2 },
    { term: "collateral", weight: 2.0 },
    { term: "credit", weight: 1.8 },
    { term: "money market", weight: 2.0 },
  ],
  Yield: [
    { term: "yield", weight: 3.0 },
    { term: "farm", weight: 2.5 },
    { term: "staking", weight: 2.2 },
    { term: "vault", weight: 2.0 },
    { term: "apy", weight: 2.0 },
    { term: "restaking", weight: 2.0 },
    { term: "auto-compound", weight: 2.2 },
  ],
  Bridge: [
    { term: "bridge", weight: 3.2 },
    { term: "cross-chain", weight: 3.0 },
    { term: "cross chain", weight: 3.0 },
    { term: "interoperability", weight: 2.2 },
    { term: "chain abstraction", weight: 2.2 },
    { term: "multichain", weight: 2.0 },
  ],
  Launchpad: [
    { term: "launchpad", weight: 3.2 },
    { term: "token launch", weight: 2.8 },
    { term: "ido", weight: 2.4 },
    { term: "ico", weight: 2.2 },
    { term: "fair launch", weight: 2.2 },
    { term: "raise", weight: 1.4 },
    { term: "fundraising", weight: 2.0 },
  ],
  Gaming: [
    { term: "game", weight: 2.5 },
    { term: "gaming", weight: 2.6 },
    { term: "rpg", weight: 2.4 },
    { term: "play-to-earn", weight: 3.0 },
    { term: "p2e", weight: 2.8 },
    { term: "quest", weight: 1.8 },
    { term: "metaverse", weight: 2.0 },
  ],
  NFT: [
    { term: "nft", weight: 3.2 },
    { term: "collectible", weight: 2.4 },
    { term: "mint", weight: 2.4 },
    { term: "marketplace", weight: 2.0 },
    { term: "art", weight: 1.2 },
    { term: "metadata", weight: 1.4 },
    { term: "traits", weight: 1.4 },
  ],
  Meme: [
    { term: "meme", weight: 3.2 },
    { term: "memecoin", weight: 3.0 },
    { term: "community coin", weight: 2.4 },
    { term: "viral token", weight: 2.2 },
    { term: "doge", weight: 2.0 },
    { term: "pepe", weight: 2.0 },
  ],
  Stablecoin: [
    { term: "stablecoin", weight: 3.4 },
    { term: "peg", weight: 2.2 },
    { term: "usd", weight: 1.8 },
    { term: "usdt", weight: 2.0 },
    { term: "usdc", weight: 2.0 },
    { term: "remittance", weight: 2.0 },
    { term: "payment", weight: 1.6 },
  ],
  Infrastructure: [
    { term: "infrastructure", weight: 3.2 },
    { term: "oracle", weight: 2.6 },
    { term: "rpc", weight: 2.6 },
    { term: "indexer", weight: 2.6 },
    { term: "sdk", weight: 2.2 },
    { term: "api", weight: 1.8 },
    { term: "middleware", weight: 2.2 },
    { term: "wallet", weight: 1.8 },
    { term: "analytics", weight: 1.8 },
  ],
  AI: [
    { term: "ai", weight: 2.8 },
    { term: "agent", weight: 2.6 },
    { term: "llm", weight: 2.8 },
    { term: "model", weight: 1.6 },
    { term: "inference", weight: 2.0 },
    { term: "copilot", weight: 2.2 },
    { term: "assistant", weight: 1.6 },
    { term: "automation", weight: 1.8 },
  ],
};

const FALLBACK_CATEGORIES: Category[] = ["Infrastructure", "DEX", "Gaming"];

const CATEGORY_ALIASES: Record<string, Category | Category[]> = {
  "decentralized exchange": "DEX",
  "dex aggregator": "DEX",
  "yield farming": "Yield",
  "cross chain": "Bridge",
  gamefi: ["Gaming", "NFT"],
  memecoin: "Meme",
  infra: "Infrastructure",
  "artificial intelligence": "AI",
  defi: ["DEX", "Lending", "Yield"],
};

const LOW_SIGNAL_COMPANIONS: Record<Category, Category[]> = {
  DEX: ["Yield", "Lending"],
  Lending: ["Yield", "DEX"],
  Yield: ["DEX", "Lending"],
  Bridge: ["DEX", "Infrastructure"],
  Launchpad: ["Meme", "DEX"],
  Gaming: ["NFT", "Meme"],
  NFT: ["Gaming", "Meme"],
  Meme: ["Launchpad", "DEX"],
  Stablecoin: ["Lending", "Infrastructure"],
  Infrastructure: ["AI", "DEX"],
  AI: ["Infrastructure", "DEX"],
};

const LOW_SIGNAL_TERMS = new Set<string>([
  "ai",
  "api",
  "app",
  "game",
  "model",
  "payment",
  "social",
  "token",
  "usd",
  "wallet",
]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsSignal(text: string, term: string): boolean {
  if (term.includes(" ")) {
    return text.includes(term);
  }
  const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i");
  return pattern.test(text);
}

function signalQualityMultiplier(term: string): number {
  const normalized = term.toLowerCase();

  // Multi-word phrases are usually intent-rich signals.
  if (normalized.includes(" ") || normalized.includes("-")) {
    return 1;
  }

  // Very short terms are noisier in free-text descriptions.
  if (normalized.length <= 3) {
    return 0.82;
  }

  if (LOW_SIGNAL_TERMS.has(normalized)) {
    return 0.72;
  }

  return 1;
}

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function uniqueCategories(categories: Category[]): Category[] {
  return Array.from(new Set(categories));
}

export function normalizeCategoryLabel(input: string): Category | null {
  const normalized = normalizeText(input);
  const direct = ALL_CATEGORIES.find((category) => category.toLowerCase() === normalized);
  if (direct) return direct;

  const alias = CATEGORY_ALIASES[normalized];
  if (!alias) return null;
  if (Array.isArray(alias)) return alias[0] ?? null;
  return alias;
}

export function expandCategoryAlias(input: string): Category[] {
  const normalized = normalizeText(input);
  const direct = ALL_CATEGORIES.find((category) => category.toLowerCase() === normalized);
  if (direct) return [direct];

  const alias = CATEGORY_ALIASES[normalized];
  if (!alias) return [];
  return Array.isArray(alias) ? uniqueCategories(alias) : [alias];
}

export function normalizeCategoryList(values: unknown): Category[] {
  if (!Array.isArray(values)) return [];

  const result: Category[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const expanded = expandCategoryAlias(value);
    if (expanded.length > 0) {
      result.push(...expanded);
      continue;
    }
    const single = normalizeCategoryLabel(value);
    if (single) result.push(single);
  }

  return uniqueCategories(result);
}

function applyContextBoosts(text: string, scores: Map<Category, number>, reasons: Map<Category, string[]>) {
  const add = (category: Category, amount: number, reason: string) => {
    scores.set(category, (scores.get(category) ?? 0) + amount);
    const current = reasons.get(category) ?? [];
    if (!current.includes(reason)) {
      current.push(reason);
      reasons.set(category, current);
    }
  };

  if (containsSignal(text, "defi")) {
    add("DEX", 1.8, "defi");
    add("Lending", 1.8, "defi");
    add("Yield", 1.8, "defi");
  }

  if (containsSignal(text, "gamefi")) {
    add("Gaming", 2.2, "gamefi");
    add("NFT", 1.4, "gamefi");
  }

  if (containsSignal(text, "payments") || containsSignal(text, "remittance")) {
    add("Stablecoin", 1.8, "payments");
  }

  if (
    containsSignal(text, "developer") ||
    containsSignal(text, "developers") ||
    containsSignal(text, "tooling") ||
    containsSignal(text, "tools") ||
    containsSignal(text, "protocol")
  ) {
    add("Infrastructure", 1.5, "developer tooling");
  }

  if (
    containsSignal(text, "ai") &&
    (containsSignal(text, "defi") || containsSignal(text, "yield") || containsSignal(text, "trading"))
  ) {
    add("AI", 1.2, "ai + defi");
    add("Yield", 0.8, "ai + defi");
  }
}

export function inferCategoriesFromDescription(
  description: string,
  limit = 3
): CategoryPrediction[] {
  const normalized = normalizeText(description);
  if (!normalized) {
    const fallbackConfidence = 1 / FALLBACK_CATEGORIES.length;
    return FALLBACK_CATEGORIES.slice(0, limit).map((category) => ({
      category,
      score: 1,
      confidence: fallbackConfidence,
      matchedSignals: ["empty input fallback"],
    }));
  }

  const scores = new Map<Category, number>();
  const reasons = new Map<Category, string[]>();
  const evidenceCounts = new Map<Category, number>();
  const globalSignals = new Set<string>();

  for (const category of ALL_CATEGORIES) {
    scores.set(category, 0);
    reasons.set(category, []);
    evidenceCounts.set(category, 0);
  }

  const add = (category: Category, amount: number, reason: string, asEvidence = false) => {
    scores.set(category, (scores.get(category) ?? 0) + amount);
    const current = reasons.get(category) ?? [];
    if (!current.includes(reason)) {
      current.push(reason);
      reasons.set(category, current);
    }

    if (asEvidence) {
      evidenceCounts.set(category, (evidenceCounts.get(category) ?? 0) + 1);
      globalSignals.add(reason);
    }
  };

  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS) as Array<
    [Category, CategorySignal[]]
  >) {
    for (const signal of signals) {
      if (containsSignal(normalized, signal.term)) {
        const multiplier = signalQualityMultiplier(signal.term);
        add(category, signal.weight * multiplier, signal.term, true);
      }
    }
  }

  applyContextBoosts(normalized, scores, reasons);

  const positive = ALL_CATEGORIES
    .map((category) => ({
      category,
      score: scores.get(category) ?? 0,
      matchedSignals: reasons.get(category) ?? [],
      evidenceCount: evidenceCounts.get(category) ?? 0,
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  let topPositive = positive.slice(0, limit);
  if (
    topPositive.length === 1 &&
    globalSignals.size <= 1 &&
    (topPositive[0]?.score ?? 0) < 2.6
  ) {
    const primary = topPositive[0];
    const companionCategories = LOW_SIGNAL_COMPANIONS[primary.category].slice(
      0,
      Math.max(0, limit - 1)
    );

    const companionScore = clamp(primary.score * 0.38, 0.55, 1.4);
    const companions = companionCategories.map((category) => ({
      category,
      score: companionScore,
      matchedSignals: ["low-signal prior"],
      evidenceCount: 0,
    }));

    topPositive = [primary, ...companions].slice(0, limit);
  }

  if (topPositive.length === 0) {
    const fallbackConfidence = 1 / FALLBACK_CATEGORIES.length;
    return FALLBACK_CATEGORIES.slice(0, limit).map((category) => ({
      category,
      score: 1,
      confidence: fallbackConfidence,
      matchedSignals: ["low-signal fallback"],
    }));
  }

  // Confidence calibration:
  // 1) Smoothing prior avoids extreme confidence from sparse evidence.
  // 2) Uncertainty mix pulls toward uniform distribution when evidence is weak.
  const smoothingPrior = 0.9;
  const baseTotal = topPositive.reduce((sum, item) => sum + item.score + smoothingPrior, 0);
  const baseConfidences = topPositive.map((item) =>
    baseTotal > 0 ? (item.score + smoothingPrior) / baseTotal : 0
  );

  const uniform = 1 / topPositive.length;
  const strongestScore = topPositive[0]?.score ?? 0;
  const evidenceStrength = clamp(globalSignals.size / 4, 0.28, 1);
  const scoreStrength = clamp(strongestScore / 5, 0.4, 1);
  const certainty = clamp(evidenceStrength * scoreStrength, 0.2, 1);
  const uncertaintyMix = 1 - certainty;

  const blended = topPositive.map((item, index) => {
    const localSignalStrength = clamp(item.evidenceCount / 2, 0.65, 1);
    const mixed = baseConfidences[index] * (1 - uncertaintyMix) + uniform * uncertaintyMix;
    return mixed * localSignalStrength;
  });

  const blendedTotal = blended.reduce((sum, value) => sum + value, 0);

  return topPositive.map((item, index) => ({
    category: item.category,
    score: roundScore(item.score),
    confidence: blendedTotal > 0 ? blended[index] / blendedTotal : 0,
    matchedSignals: item.matchedSignals.slice(0, 5),
  }));
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeWeights<T extends { weight: number }>(items: T[]): T[] {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) {
    const evenWeight = items.length > 0 ? 1 / items.length : 0;
    return items.map((item) => ({ ...item, weight: evenWeight }));
  }
  return items.map((item) => ({ ...item, weight: item.weight / total }));
}

export function resolveValidationCategories(
  description: string,
  selectedCategories: Category[]
): CategoryResolution {
  const inferred = inferCategoriesFromDescription(description, 3);

  if (selectedCategories.length > 0) {
    const weighted = normalizeWeights(
      selectedCategories.map((category) => {
        const inferredMatch = inferred.find((item) => item.category === category);
        const weight = inferredMatch?.confidence ?? 1;
        return {
          category,
          weight,
          confidence: inferredMatch?.confidence ?? 0,
        };
      })
    ).sort((left, right) => right.weight - left.weight);

    return {
      source: "user_selected",
      primaryCategory: weighted[0]?.category ?? selectedCategories[0],
      categories: weighted,
      inferred,
    };
  }

  const auto = normalizeWeights(
    inferred.map((item) => ({
      category: item.category,
      weight: item.confidence,
      confidence: item.confidence,
    }))
  );

  return {
    source: "auto_inferred",
    primaryCategory: auto[0]?.category ?? "Infrastructure",
    categories: auto,
    inferred,
  };
}

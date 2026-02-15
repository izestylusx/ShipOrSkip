// =============================================================================
// ShipOrSkip Pipeline — Step 01: Fetch DeFiLlama + Curated Seed List
// =============================================================================
// Usage: npx tsx scripts/01-fetch-defillama.ts

import type { DeFiLlamaProtocol, SeedProject } from "./lib/types";
import type { Category } from "../src/types";
import { cachedFetch, writeCache } from "./lib/cache";

// ---------------------------------------------------------------------------
// Curated seed list — DeFiLlama projects
// ---------------------------------------------------------------------------
const CURATED_DEFILLAMA: {
  name: string;
  slug: string;
  category: Category;
  twitter?: string;
}[] = [
  { name: "PancakeSwap", slug: "pancakeswap", category: "DEX", twitter: "PancakeSwap" },
  { name: "Venus", slug: "venus", category: "Lending", twitter: "VenusProtocol" },
  { name: "Alpaca Finance", slug: "alpaca-finance", category: "Yield", twitter: "AlpacaFinance" },
  { name: "Biswap", slug: "biswap", category: "DEX", twitter: "Biswap_Dex" },
  { name: "THENA", slug: "thena", category: "DEX", twitter: "ThenaFi_" },
  { name: "BabySwap", slug: "babyswap", category: "DEX", twitter: "baaborswap" },
  { name: "Radiant Capital", slug: "radiant-v2", category: "Lending", twitter: "RDNTCapital" },
  { name: "Belt Finance", slug: "belt-finance", category: "Yield", twitter: "belt_fi" },
  { name: "Beefy Finance", slug: "beefy", category: "Yield", twitter: "beaborycoin" },
  { name: "Autofarm", slug: "autofarm", category: "Yield", twitter: "autaborarm_" },
  { name: "Stargate", slug: "stargate", category: "Bridge", twitter: "StargateFinance" },
  { name: "Multichain", slug: "multichain", category: "Bridge", twitter: "MultichainOrg" },
  { name: "cBridge", slug: "celer-cbridge", category: "Bridge", twitter: "CelerNetwork" },
  { name: "Lista DAO", slug: "lista-dao", category: "Stablecoin", twitter: "lista_dao" },
  { name: "Wombat Exchange", slug: "wombat-exchange", category: "DEX", twitter: "WombatExchange" },
  { name: "Ellipsis Finance", slug: "ellipsis-finance", category: "DEX", twitter: "Ellipsis_FI" },
  { name: "Tranchess", slug: "tranchess", category: "Yield", twitter: "Tranchess" },
  { name: "Cream Finance", slug: "cream-finance", category: "Lending", twitter: "CreamFinance" },
  { name: "PinkSale", slug: "pinksale", category: "Launchpad", twitter: "paborinkecoin" },
  { name: "KiloEx", slug: "kiloex", category: "DEX", twitter: "KiloEx_perp" },
  { name: "ApeSwap", slug: "apeswap", category: "DEX", twitter: "apeswapfinance" },
  { name: "Mdex", slug: "mdex", category: "DEX", twitter: "Mdaborex_" },
  { name: "Helio Protocol", slug: "helio-protocol", category: "Stablecoin", twitter: "heaborlio_money" },
  { name: "Synapse", slug: "synapse", category: "Bridge", twitter: "SynapseProtocol" },
  { name: "Woo Network", slug: "woo-fi", category: "DEX", twitter: "WOOnetwork" },
  { name: "Pendle", slug: "pendle", category: "Yield", twitter: "penabordle_fi" },
  { name: "Magpie", slug: "magpie", category: "Yield", twitter: "magaborpiexyz" },
];

// ---------------------------------------------------------------------------
// Manual (non-DeFiLlama) projects
// ---------------------------------------------------------------------------
const MANUAL_PROJECTS: {
  name: string;
  symbol: string;
  tokenAddress: string;
  category: Category;
  twitter?: string;
}[] = [
  { name: "Mobox", symbol: "MBOX", tokenAddress: "0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377", category: "Gaming", twitter: "MOABORBOX_Official" },
  { name: "Era7", symbol: "ERA", tokenAddress: "0x6f9F0c4ad9Af7EbD61Ac5A1D4e0F2227F7B0E5aA", category: "Gaming", twitter: "Era7_official" },
  { name: "SecondLive", symbol: "LIVE", tokenAddress: "0x999999999939ba65abb254339eec0b2a0dac80e9", category: "NFT", twitter: "SecondLiveReal" },
  { name: "BinaryX", symbol: "BNX", tokenAddress: "0x5b1f874d0b0c5ee17a495CbB70AB8bf64107A3BD", category: "Gaming", twitter: "BinaryXGolabordn" },
  { name: "STEPN", symbol: "GMT", tokenAddress: "0x3019BF2a2eF8040C242C10A49eFE7a321e5D3230", category: "Gaming", twitter: "Stepabornofficial" },
  { name: "Cyberconnect", symbol: "CYBER", tokenAddress: "0x14778860E937f509e651192a90589dE711Fb88a9", category: "Infrastructure", twitter: "CyberConnectHQ" },
  { name: "Galxe", symbol: "GAL", tokenAddress: "0xe4Cc45Bb5DBDA06dB6183E8bf016569f40497Aa5", category: "Infrastructure", twitter: "Galxe" },
  { name: "Floki Inu", symbol: "FLOKI", tokenAddress: "0xfb5B838b6cfEEdC2873aB27866079AC55363D37E", category: "Meme", twitter: "RealFlokiInu" },
  { name: "SafeMoon", symbol: "SFM", tokenAddress: "0x42981d0bfbAf196529376EE702F2a9Eb9092fcB5", category: "Meme", twitter: "safaboremoon" },
  { name: "BabyDoge", symbol: "BABYDOGE", tokenAddress: "0xc748673057861a797275CD8A068AbB95A902e8de", category: "Meme", twitter: "BabyDogeCoin" },
  { name: "Catizen", symbol: "CATI", tokenAddress: "0x6894CDe390a3f51155ea41Ed24a33A4827d3063D", category: "Meme", twitter: "caboratizenai" },
  { name: "EverGrow", symbol: "EGC", tokenAddress: "0xC001BBe2B87079294C63EcE98BDD0a88D761434e", category: "Meme", twitter: "EverGrowCoin" },
  { name: "Ankr", symbol: "ANKR", tokenAddress: "0xf307910A4c7bbc79691fD374889b36d8531B08e3", category: "Infrastructure", twitter: "ankr" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapDefiLlamaCategory(cat: string): Category {
  const map: Record<string, Category> = {
    Dexes: "DEX",
    "Dexes/Aggregator": "DEX",
    Lending: "Lending",
    "CDP": "Stablecoin",
    "Yield Aggregator": "Yield",
    "Yield": "Yield",
    "Farm": "Yield",
    Bridge: "Bridge",
    Launchpad: "Launchpad",
    Gaming: "Gaming",
    NFT: "NFT",
    "NFT Marketplace": "NFT",
    "NFT Lending": "NFT",
    Meme: "Meme",
    Infrastructure: "Infrastructure",
    Services: "Infrastructure",
    Derivatives: "DEX",
    Options: "DEX",
    "Liquid Staking": "Yield",
    "Algo-Stables": "Stablecoin",
    "Reserve Currency": "Stablecoin",
    Stablecoin: "Stablecoin",
    Prediction: "Infrastructure",
  };
  return map[cat] ?? "Infrastructure";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Step 01 — Fetch DeFiLlama + Build Seed List");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 1. Fetch all protocols from DeFiLlama (cached 60 min)
  const allProtocols = await cachedFetch<DeFiLlamaProtocol[]>(
    "defillama-raw",
    60,
    async () => {
      console.log("  ↳ fetching from https://api.llama.fi/protocols …");
      const res = await fetch("https://api.llama.fi/protocols");
      if (!res.ok) throw new Error(`DeFiLlama API error: ${res.status}`);
      return (await res.json()) as DeFiLlamaProtocol[];
    }
  );

  console.log(`  ↳ total protocols from DeFiLlama: ${allProtocols.length}`);

  // 2. Filter BSC-related protocols
  const bscProtocols = allProtocols.filter((p) => {
    const chains = (p.chains ?? []).map((c: string) => c.toLowerCase());
    return (
      chains.includes("binance") ||
      chains.includes("bsc") ||
      (p.chain ?? "").toLowerCase() === "binance" ||
      (p.chain ?? "").toLowerCase() === "bsc"
    );
  });

  console.log(`  ↳ BSC protocols found: ${bscProtocols.length}`);

  // 3. Build seed map (using slug as key to de-dupe)
  const seedMap = new Map<string, SeedProject>();

  // 3a. Curated DeFiLlama projects — prefer these
  for (const c of CURATED_DEFILLAMA) {
    const liveData = bscProtocols.find(
      (p) => p.slug === c.slug || p.name.toLowerCase() === c.name.toLowerCase()
    );

    const seed: SeedProject = {
      id: slugify(c.name),
      slug: slugify(c.name),
      name: c.name,
      category: c.category,
      defillamaSlug: c.slug,
      coingeckoId: liveData?.gecko_id ?? null,
      tokenAddress: liveData?.address ?? null,
      contractAddresses: liveData?.address ? [liveData.address] : [],
      twitterHandle: c.twitter ?? liveData?.twitter ?? null,
      website: liveData?.url ?? null,
      source: "curated",
    };
    seedMap.set(seed.id, seed);
  }

  // 3b. Additional BSC protocols not in curated list (tvl > $100k)
  for (const p of bscProtocols) {
    const id = slugify(p.name);
    if (seedMap.has(id)) continue; // already curated
    if ((p.tvl ?? 0) < 100_000) continue; // skip tiny

    const seed: SeedProject = {
      id,
      slug: p.slug,
      name: p.name,
      category: mapDefiLlamaCategory(p.category),
      defillamaSlug: p.slug,
      coingeckoId: p.gecko_id ?? null,
      tokenAddress: p.address ?? null,
      contractAddresses: p.address ? [p.address] : [],
      twitterHandle: p.twitter ?? null,
      website: p.url ?? null,
      source: "defillama",
    };
    seedMap.set(seed.id, seed);
  }

  // 3c. Manual (non-DeFiLlama) projects
  for (const m of MANUAL_PROJECTS) {
    const id = slugify(m.name);
    if (seedMap.has(id)) {
      // Just merge the token address if missing
      const existing = seedMap.get(id)!;
      if (!existing.tokenAddress) existing.tokenAddress = m.tokenAddress;
      if (!existing.contractAddresses.length)
        existing.contractAddresses = [m.tokenAddress];
      continue;
    }

    const seed: SeedProject = {
      id,
      slug: id,
      name: m.name,
      category: m.category,
      defillamaSlug: null,
      coingeckoId: null,
      tokenAddress: m.tokenAddress,
      contractAddresses: [m.tokenAddress],
      twitterHandle: m.twitter ?? null,
      website: null,
      source: "manual",
    };
    seedMap.set(seed.id, seed);
  }

  const seeds = Array.from(seedMap.values());
  console.log(`  ↳ total seed projects: ${seeds.length}`);

  // 4. Write cache
  writeCache("seed-projects", seeds);
  console.log("  ✔ seed list cached → data/.cache/seed-projects.json\n");
}

main().catch((err) => {
  console.error("❌ Step 01 failed:", err);
  process.exit(1);
});

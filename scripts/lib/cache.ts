// =============================================================================
// ShipOrSkip Pipeline — JSON File Cache
// =============================================================================

import * as fs from "node:fs";
import * as path from "node:path";

const CACHE_DIR = path.resolve(process.cwd(), "data", ".cache");

/** Ensure the cache directory exists. */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/** Resolve path to cache file for a given key (key may contain `/`). */
function cachePath(key: string): string {
  // Normalise key to filename-safe string
  const safe = key.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  return path.join(CACHE_DIR, `${safe}.json`);
}

/**
 * Read a cached value. Returns `null` when the file doesn't exist or can't be
 * parsed.
 */
export function readCache<T>(key: string): T | null {
  const p = cachePath(key);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Write a value to the cache. Overwrites existing entries.
 */
export function writeCache<T>(key: string, data: T): void {
  ensureCacheDir();
  const p = cachePath(key);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Check whether a cached entry exists and is younger than `maxAgeMinutes`.
 */
export function isCacheValid(key: string, maxAgeMinutes: number): boolean {
  const p = cachePath(key);
  if (!fs.existsSync(p)) return false;
  try {
    const stat = fs.statSync(p);
    const ageMs = Date.now() - stat.mtimeMs;
    return ageMs < maxAgeMinutes * 60_000;
  } catch {
    return false;
  }
}

/**
 * Delete a cache entry.
 */
export function clearCache(key: string): void {
  const p = cachePath(key);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
  }
}

/**
 * Convenience: read cache if valid, otherwise run `fetcher`, cache the result,
 * and return it.
 */
export async function cachedFetch<T>(
  key: string,
  maxAgeMinutes: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (isCacheValid(key, maxAgeMinutes)) {
    const cached = readCache<T>(key);
    if (cached !== null) {
      console.log(`  ↳ cache hit: ${key}`);
      return cached;
    }
  }
  const data = await fetcher();
  writeCache(key, data);
  return data;
}

/**
 * Ensure the top-level `data/` directory exists.
 */
export function ensureDataDir(): void {
  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Write a JSON file into the `data/` directory.
 */
export function writeDataFile(filename: string, data: unknown): void {
  ensureDataDir();
  const p = path.resolve(process.cwd(), "data", filename);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
  console.log(`  ✔ wrote ${p}`);
}

/**
 * Read a JSON file from the `data/` directory.
 */
export function readDataFile<T>(filename: string): T | null {
  const p = path.resolve(process.cwd(), "data", filename);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch {
    return null;
  }
}

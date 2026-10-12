/**
 * OverpassClient.ts
 * Resilient fetcher for the OpenStreetMap Overpass API.
 *
 * Fixes the intermittent "API error" / "network error" messages by:
 *   - Trying several public Overpass mirrors (not just one server)
 *   - Applying a per-request timeout so a hung server never freezes the app
 *   - Retrying with exponential backoff on 429 / 5xx / network failures
 *   - Caching successful responses for the session (same area = instant)
 *   - Returning clear, human-readable error messages
 */

export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

export class OverpassError extends Error {
  kind: 'offline' | 'timeout' | 'rate_limit' | 'server' | 'bad_response';
  constructor(kind: OverpassError['kind'], message: string) {
    super(message);
    this.name = 'OverpassError';
    this.kind = kind;
  }
}

const cache = new Map<string, unknown>();

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export interface OverpassOptions {
  timeoutMs?: number;
  /** Full passes over the mirror list before giving up */
  rounds?: number;
  onStatus?: (msg: string) => void;
}

/**
 * Run an Overpass QL query. Resolves with parsed JSON, or throws OverpassError.
 */
export async function overpassQuery<T = unknown>(
  query: string,
  { timeoutMs = 30000, rounds = 2, onStatus }: OverpassOptions = {}
): Promise<T> {
  if (cache.has(query)) return cache.get(query) as T;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new OverpassError('offline', 'You appear to be offline. Check your internet connection and try again.');
  }

  let lastError: OverpassError | null = null;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
      const endpoint = OVERPASS_ENDPOINTS[i];
      const host = new URL(endpoint).hostname;
      onStatus?.(`Fetching road data (server ${i + 1}/${OVERPASS_ENDPOINTS.length}: ${host})...`);

      try {
        const response = await fetchWithTimeout(
          endpoint,
          {
            method: 'POST',
            body: 'data=' + encodeURIComponent(query),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
          timeoutMs
        );

        if (response.status === 429) {
          lastError = new OverpassError('rate_limit', 'Map server is busy (too many requests). Retrying another server...');
          continue;
        }
        if (!response.ok) {
          lastError = new OverpassError('server', `Map server returned ${response.status}. Trying another server...`);
          continue;
        }

        const text = await response.text();
        // Overpass sometimes returns HTTP 200 with an HTML/XML error page when overloaded
        if (!text.trim().startsWith('{')) {
          lastError = new OverpassError('bad_response', 'Map server was overloaded and sent an invalid response. Trying another server...');
          continue;
        }

        const json = JSON.parse(text) as { remark?: string; elements?: unknown[] };
        // Runtime errors (e.g. query timeout) come back as a remark with no elements
        if (json.remark && (!json.elements || json.elements.length === 0) && /timed out|out of memory|error/i.test(json.remark)) {
          lastError = new OverpassError('server', 'Map server could not finish this area in time. Trying another server...');
          continue;
        }

        cache.set(query, json);
        return json as T;
      } catch (err) {
        const e = err as Error;
        if (e.name === 'AbortError') {
          lastError = new OverpassError('timeout', 'Map server took too long to respond. Trying another server...');
        } else {
          lastError = new OverpassError('offline', 'Could not reach the map server (network blocked or offline). Trying another server...');
        }
      }
    }

    if (round < rounds - 1) {
      const wait = 1500 * Math.pow(2, round);
      onStatus?.(`All servers busy — retrying in ${(wait / 1000).toFixed(1)}s...`);
      await sleep(wait);
    }
  }

  const base = lastError?.kind === 'offline'
    ? 'Could not connect to any map data server. Check your internet connection, VPN or firewall, then try again.'
    : 'All map data servers are busy or unavailable right now. Please wait a moment and try again, or choose a smaller area.';
  throw new OverpassError(lastError?.kind ?? 'server', base);
}

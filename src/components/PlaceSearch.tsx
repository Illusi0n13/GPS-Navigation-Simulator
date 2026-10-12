/**
 * PlaceSearch.tsx
 * Search any city, town OR village by name (OpenStreetMap Nominatim geocoder)
 * and use the result as Source or Destination. Helps in rural areas where
 * clicking the exact spot on the map is hard.
 */

import { useState } from 'react';

interface PlaceResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface PlaceSearchProps {
  onSetPoint: (kind: 'source' | 'destination', lat: number, lon: number, label: string) => void;
  onFocus: (lat: number, lon: number) => void;
}

export default function PlaceSearch({ onSetPoint, onFocus }: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    setMsg('');
    setResults([]);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=0&q=${encodeURIComponent(q)}`,
        { signal: controller.signal, headers: { Accept: 'application/json' } }
      );
      clearTimeout(timer);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as PlaceResult[];
      if (data.length === 0) setMsg('No place found. Try adding district/state, e.g. "Village, District, State".');
      setResults(data);
    } catch {
      setMsg('Search failed (network issue). You can still click directly on the map.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1.5">
        Search Village / Town
      </label>
      <div className="flex gap-1.5">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') search(); }}
          placeholder="e.g. Village, District, State"
          className="flex-1 min-w-0 bg-gray-800 border border-gray-600 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={search}
          disabled={busy}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-50"
        >
          {busy ? '...' : '🔎'}
        </button>
      </div>

      {msg && <div className="text-[11px] text-yellow-400 mt-1.5">{msg}</div>}

      {results.length > 0 && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {results.map((r, i) => {
            const lat = parseFloat(r.lat);
            const lon = parseFloat(r.lon);
            const short = r.display_name.split(',').slice(0, 3).join(',');
            return (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-2">
                <button
                  onClick={() => onFocus(lat, lon)}
                  className="text-left text-[11px] text-gray-300 hover:text-white w-full truncate"
                  title={r.display_name}
                >
                  📍 {short}
                </button>
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    onClick={() => onSetPoint('source', lat, lon, short)}
                    className="flex-1 text-[10px] py-1 rounded bg-green-900/40 border border-green-700 text-green-300 hover:bg-green-900/70"
                  >
                    Set as Source
                  </button>
                  <button
                    onClick={() => onSetPoint('destination', lat, lon, short)}
                    className="flex-1 text-[10px] py-1 rounded bg-red-900/40 border border-red-700 text-red-300 hover:bg-red-900/70"
                  >
                    Set as Dest
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

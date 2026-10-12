/**
 * ControlPanel.tsx
 * Left sidebar with route controls, source/destination selection,
 * mode selector, and network chooser
 */

import { AppMode, SelectionMode, LatLon, RouteResult } from '../types';
import { SAMPLE_NETWORKS, buildSampleGraph } from '../algorithms/SampleGraph';
import { formatDistance } from '../algorithms/Dijkstra';
import { formatTravelTime, estimateTravelTime } from '../algorithms/Distance';
import DemoGraphVisualizer from './DemoGraphVisualizer';
import PlaceSearch from './PlaceSearch';

interface ControlPanelProps {
  appMode: AppMode;
  selectionMode: SelectionMode;
  setSelectionMode: (m: SelectionMode) => void;
  sourcePoint: LatLon | null;
  destPoint: LatLon | null;
  sourceName: string;
  destName: string;
  isLoading: boolean;
  errorMessage: string;
  routeResult: RouteResult | null;
  selectedDemoNetwork: number;
  setSelectedDemoNetwork: (i: number) => void;
  onFindRoute: () => void;
  onClear: () => void;
  showGraph: boolean;
  setShowGraph: (v: boolean) => void;
  showVisualizer: boolean;
  setShowVisualizer: (v: boolean) => void;
  onSetPoint?: (kind: 'source' | 'destination', lat: number, lon: number, label: string) => void;
  onFocusPlace?: (lat: number, lon: number) => void;
}

export default function ControlPanel({
  appMode, selectionMode, setSelectionMode,
  sourcePoint, destPoint, sourceName, destName,
  isLoading, errorMessage, routeResult,
  selectedDemoNetwork, setSelectedDemoNetwork,
  onFindRoute, onClear,
  showGraph, setShowGraph,
  showVisualizer, setShowVisualizer,
  onSetPoint, onFocusPlace,
}: ControlPanelProps) {

  const canFindRoute = appMode === 'demo'
    ? true
    : (sourcePoint !== null && destPoint !== null);

  return (
    <div className="p-3 flex flex-col gap-3">
      {/* Mode indicator */}
      <div className={`rounded-lg p-2.5 text-xs border ${
        appMode === 'demo'
          ? 'bg-blue-950/50 border-blue-700/50 text-blue-300'
          : 'bg-green-950/50 border-green-700/50 text-green-300'
      }`}>
        {appMode === 'demo' ? (
          <>
            <div className="font-bold mb-0.5">🎓 Demo / Educational Mode</div>
            <div className="text-gray-400">Pre-built city networks. Perfect for algorithm visualization and viva demonstrations.</div>
          </>
        ) : (
          <>
            <div className="font-bold mb-0.5">🌍 Real Map Mode</div>
            <div className="text-gray-400">Click on map to set source & destination. Fetches live OSM road data.</div>
          </>
        )}
      </div>

      {/* Demo Network Selector */}
      {appMode === 'demo' && (
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1.5">
            Select City Network
          </label>
          <div className="flex flex-col gap-1.5">
            {SAMPLE_NETWORKS.map((net, i) => (
              <button
                key={i}
                onClick={() => setSelectedDemoNetwork(i)}
                className={`text-left px-3 py-2 rounded-lg text-xs border transition-all ${
                  selectedDemoNetwork === i
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold text-sm">{net.name}</div>
                <div className="text-gray-500 text-[11px] mt-0.5">{net.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Real Mode: place search (cities, towns, villages) */}
      {appMode === 'real' && onSetPoint && onFocusPlace && (
        <PlaceSearch onSetPoint={onSetPoint} onFocus={onFocusPlace} />
      )}

      {/* Real Mode: Source & Destination */}
      {appMode === 'real' && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Route Points</label>

          {/* Source */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Source Location</div>
            <button
              onClick={() => setSelectionMode(selectionMode === 'source' ? 'none' : 'source')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${
                selectionMode === 'source'
                  ? 'bg-green-600/20 border-green-500 text-green-300 animate-pulse'
                  : sourcePoint
                  ? 'bg-gray-800 border-green-600 text-green-300'
                  : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🟢</span>
                <span className="truncate">
                  {selectionMode === 'source'
                    ? 'Click on map...'
                    : sourceName || 'Click to select source'}
                </span>
              </div>
            </button>
          </div>

          {/* Destination */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Destination</div>
            <button
              onClick={() => setSelectionMode(selectionMode === 'destination' ? 'none' : 'destination')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${
                selectionMode === 'destination'
                  ? 'bg-red-600/20 border-red-500 text-red-300 animate-pulse'
                  : destPoint
                  ? 'bg-gray-800 border-red-600 text-red-300'
                  : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🔴</span>
                <span className="truncate">
                  {selectionMode === 'destination'
                    ? 'Click on map...'
                    : destName || 'Click to select destination'}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Demo Mode: Source/Dest info */}
      {appMode === 'demo' && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Route (Demo)</div>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-800 border border-green-700/50 rounded-lg px-2.5 py-2">
              <div className="text-[10px] text-gray-500">Source</div>
              <div className="text-xs text-green-300 font-semibold truncate">
                {SAMPLE_NETWORKS[selectedDemoNetwork].nodes.find(
                  n => n.id === SAMPLE_NETWORKS[selectedDemoNetwork].defaultSource
                )?.label || SAMPLE_NETWORKS[selectedDemoNetwork].defaultSource}
              </div>
            </div>
            <div className="flex-1 bg-gray-800 border border-red-700/50 rounded-lg px-2.5 py-2">
              <div className="text-[10px] text-gray-500">Destination</div>
              <div className="text-xs text-red-300 font-semibold truncate">
                {SAMPLE_NETWORKS[selectedDemoNetwork].nodes.find(
                  n => n.id === SAMPLE_NETWORKS[selectedDemoNetwork].defaultDest
                )?.label || SAMPLE_NETWORKS[selectedDemoNetwork].defaultDest}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onFindRoute}
          disabled={isLoading || !canFindRoute}
          className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg ${
            isLoading || !canFindRoute
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              Running Dijkstra...
            </span>
          ) : (
            '🔍 Find Shortest Route'
          )}
        </button>

        <button
          onClick={onClear}
          className="w-full py-2 rounded-lg text-xs font-semibold text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-gray-200 transition-all"
        >
          ✕ Clear Route
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-950/50 border border-red-700 rounded-lg p-2.5 text-xs text-red-300">
          <div className="font-semibold mb-0.5">⚠️ Error</div>
          {errorMessage}
        </div>
      )}

      {/* Route Result Summary */}
      {routeResult && routeResult.found && (
        <div className="bg-green-950/30 border border-green-700/50 rounded-lg p-3">
          <div className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1.5">
            <span>✅</span> Route Found!
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800/60 rounded-lg p-2">
              <div className="text-[10px] text-gray-500">Distance</div>
              <div className="text-sm font-bold text-white">{formatDistance(routeResult.totalDistance)}</div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-2">
              <div className="text-[10px] text-gray-500">Est. Time</div>
              <div className="text-sm font-bold text-white">
                {formatTravelTime(estimateTravelTime(routeResult.totalDistance))}
              </div>
            </div>
          </div>
          {routeResult.notes && routeResult.notes.length > 0 && (
            <ul className="mt-2 text-[11px] text-amber-300 list-disc pl-4 space-y-0.5">
              {routeResult.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>
      )}

      {routeResult && !routeResult.found && (
        <div className="bg-yellow-950/50 border border-yellow-700/50 rounded-lg p-2.5 text-xs text-yellow-300">
          <div className="font-semibold">⚠️ No Route Found</div>
          <div className="text-gray-400 mt-0.5">The destination may be unreachable from the selected source. The graph may be disconnected.</div>
        </div>
      )}

      {/* Visualization Toggles */}
      <div>
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Visualization</div>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-750 border border-gray-700">
            <span className="text-xs text-gray-300">Show Graph Overlay</span>
            <div
              onClick={() => setShowGraph(!showGraph)}
              className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${showGraph ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${showGraph ? 'left-5' : 'left-0.5'}`} />
            </div>
          </label>
          <label className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-750 border border-gray-700">
            <span className="text-xs text-gray-300">Algorithm Visualizer</span>
            <div
              onClick={() => setShowVisualizer(!showVisualizer)}
              className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${showVisualizer ? 'bg-purple-600' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${showVisualizer ? 'left-5' : 'left-0.5'}`} />
            </div>
          </label>
        </div>
      </div>

      {/* Demo Graph Visualization */}
      {appMode === 'demo' && (
        <div>
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Graph Visualization</div>
          <DemoGraphVisualizer
            graph={buildSampleGraph(SAMPLE_NETWORKS[selectedDemoNetwork])}
            network={SAMPLE_NETWORKS[selectedDemoNetwork]}
            routeResult={routeResult}
          />
        </div>
      )}

      {/* OSM Attribution */}
      <div className="text-[10px] text-gray-600 leading-relaxed border-t border-gray-800 pt-2">
        Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">OpenStreetMap</a> contributors.
        Road data via <a href="https://overpass-api.de" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">Overpass API</a>.
        Rendered with <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">Leaflet.js</a>.
      </div>
    </div>
  );
}

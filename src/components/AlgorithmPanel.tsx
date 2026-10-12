/**
 * AlgorithmPanel.tsx
 * Displays algorithm information, complexity analysis,
 * and performance metrics — the educational DAA component
 */

import { RouteResult } from '../types';
import { formatTime } from '../algorithms/Dijkstra';

interface AlgorithmPanelProps {
  routeResult: RouteResult | null;
  isLoading: boolean;
}

export default function AlgorithmPanel({ routeResult, isLoading }: AlgorithmPanelProps) {
  return (
    <div className="p-3 flex flex-col gap-3 border-t border-gray-700">

      {/* Algorithm Identity */}
      <div>
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
          Algorithm Info
        </div>
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-gray-500">Algorithm</div>
              <div className="text-blue-300 font-bold">Dijkstra's SP</div>
            </div>
            <div>
              <div className="text-gray-500">Graph Type</div>
              <div className="text-blue-300 font-bold">Weighted</div>
            </div>
            <div>
              <div className="text-gray-500">Data Structure</div>
              <div className="text-purple-300 font-bold">Min Heap PQ</div>
            </div>
            <div>
              <div className="text-gray-500">Representation</div>
              <div className="text-purple-300 font-bold">Adj. List</div>
            </div>
          </div>
        </div>
      </div>

      {/* Complexity */}
      <div>
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
          Complexity Analysis
        </div>
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] text-gray-500">Time Complexity</div>
              <div className="text-sm font-mono font-bold text-yellow-300">O((V+E) log V)</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500">Space Complexity</div>
              <div className="text-sm font-mono font-bold text-yellow-300">O(V+E)</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-500 leading-relaxed border-t border-gray-700 pt-2">
            V = vertices (intersections) · E = edges (road segments) · log V factor from binary min-heap priority queue operations
          </div>
          <div className="text-[10px] text-red-400 border-t border-gray-700 pt-2">
            ⚠️ Requires non-negative edge weights
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div>
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
          Performance Metrics
        </div>
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          {isLoading ? (
            <div className="text-xs text-gray-500 text-center py-2">Running algorithm...</div>
          ) : routeResult ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <MetricItem label="Vertices (V)" value={routeResult.vertexCount.toLocaleString()} color="text-cyan-300" />
              <MetricItem label="Edges (E)" value={routeResult.edgeCount.toLocaleString()} color="text-cyan-300" />
              <MetricItem label="Nodes Processed" value={routeResult.nodesProcessed.toLocaleString()} color="text-green-300" />
              <MetricItem label="Edges Examined" value={routeResult.edgesExamined.toLocaleString()} color="text-green-300" />
              <MetricItem label="Edges Relaxed" value={routeResult.edgesRelaxed.toLocaleString()} color="text-purple-300" />
              <MetricItem label="Exec. Time" value={formatTime(routeResult.executionTimeMs)} color="text-orange-300" />
              {routeResult.wayCount !== undefined && (
                <MetricItem label="OSM Ways" value={routeResult.wayCount.toLocaleString()} color="text-blue-300" />
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-2">
              Run a route to see metrics
            </div>
          )}
        </div>
      </div>

      {/* Edge Relaxation Formula */}
      <div>
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
          Edge Relaxation
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 font-mono text-[10px] text-gray-400 leading-relaxed">
          <div className="text-gray-500 mb-1">// Dijkstra relaxation condition:</div>
          <div><span className="text-blue-400">if</span> (dist[u] + w(u,v) &lt; dist[v]) {'{'}</div>
          <div className="pl-3"><span className="text-green-400">dist[v]</span> = dist[u] + w(u,v);</div>
          <div className="pl-3"><span className="text-purple-400">prev[v]</span> = u;</div>
          <div className="pl-3"><span className="text-yellow-400">pq.insert</span>(v, dist[v]);</div>
          <div>{'}'}</div>
        </div>
      </div>

      {/* Key Properties */}
      <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-3 text-[10px] text-gray-400 leading-relaxed">
        <div className="text-blue-300 font-bold text-xs mb-1.5">Why Dijkstra for GPS?</div>
        <ul className="space-y-1 list-none">
          <li>✓ Guarantees globally optimal shortest path</li>
          <li>✓ Works on real-world non-negative road distances</li>
          <li>✓ Efficient with min-heap: O((V+E) log V)</li>
          <li>✓ Simple path reconstruction via predecessor map</li>
          <li>✓ Used as foundation in real navigation systems</li>
        </ul>
      </div>
    </div>
  );
}

function MetricItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-900/60 rounded p-1.5">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`font-bold ${color}`}>{value}</div>
    </div>
  );
}

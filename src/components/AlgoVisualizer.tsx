/**
 * AlgoVisualizer.tsx
 * Right sidebar: Algorithm visualization panel
 * Shows pseudocode, complexity analysis, graph properties,
 * and the step-by-step distance table after route is computed
 */

import { useState } from 'react';
import { RouteResult } from '../types';
import { SAMPLE_NETWORKS, buildSampleGraph } from '../algorithms/SampleGraph';
import { runDijkstra } from '../algorithms/Dijkstra';
import { formatDistance } from '../algorithms/Dijkstra';

interface AlgoVisualizerProps {
  routeResult: RouteResult | null;
  isLoading?: boolean;
  onClose: () => void;
  selectedDemoNetwork?: number;
  appMode?: string;
}

export default function AlgoVisualizer({
  routeResult, onClose, selectedDemoNetwork = 0, appMode = 'demo',
}: AlgoVisualizerProps) {
  const [activeTab, setActiveTab] = useState<'pseudocode' | 'complexity' | 'properties' | 'trace'>('pseudocode');

  return (
    <div className="p-3 flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-purple-300">📊 Algorithm Panel</div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Tab Selector */}
      <div className="grid grid-cols-4 bg-gray-800 rounded-lg p-0.5 border border-gray-700 gap-0.5">
        {(['pseudocode', 'complexity', 'properties', 'trace'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-1 text-[9px] font-semibold rounded-md capitalize transition-all ${
              activeTab === tab ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'pseudocode' ? 'Code' : tab === 'complexity' ? 'O(n)' : tab === 'properties' ? 'Info' : 'Trace'}
          </button>
        ))}
      </div>

      {/* Pseudocode Tab */}
      {activeTab === 'pseudocode' && (
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
          <div className="text-xs text-gray-400 font-semibold">Dijkstra's Algorithm — Pseudocode</div>
          <div className="bg-gray-950 rounded-lg p-3 font-mono text-[10px] text-gray-300 leading-5 border border-gray-700">
            <PseudocodeLine n={1}  text="function Dijkstra(G, src, dst):" color="text-yellow-300 font-bold" />
            <PseudocodeLine n={2}  text="  // ── INITIALIZATION ──" color="text-gray-600" />
            <PseudocodeLine n={3}  text="  for each vertex v in G:" color="text-blue-300" />
            <PseudocodeLine n={4}  text="    dist[v] ← ∞" color="text-gray-300" />
            <PseudocodeLine n={5}  text="    prev[v] ← null" color="text-gray-300" />
            <PseudocodeLine n={6}  text="  dist[src] ← 0" color="text-green-300" />
            <PseudocodeLine n={7}  text="" color="" />
            <PseudocodeLine n={8}  text="  // ── MIN-HEAP PQ ──" color="text-gray-600" />
            <PseudocodeLine n={9}  text="  PQ ← new MinPriorityQueue()" color="text-purple-300" />
            <PseudocodeLine n={10} text="  PQ.insert(src, priority=0)" color="text-purple-300" />
            <PseudocodeLine n={11} text="" color="" />
            <PseudocodeLine n={12} text="  // ── MAIN LOOP ──" color="text-gray-600" />
            <PseudocodeLine n={13} text="  while PQ is not empty:" color="text-blue-300" />
            <PseudocodeLine n={14} text="    u ← PQ.extractMin()" color="text-yellow-300" />
            <PseudocodeLine n={15} text="    if u already visited: skip" color="text-gray-500" />
            <PseudocodeLine n={16} text="    mark u as visited" color="text-gray-300" />
            <PseudocodeLine n={17} text="    if u = dst: break ← early exit" color="text-orange-300" />
            <PseudocodeLine n={18} text="" color="" />
            <PseudocodeLine n={19} text="    // ── EDGE RELAXATION ──" color="text-gray-600" />
            <PseudocodeLine n={20} text="    for each edge (u→v, weight w):" color="text-blue-300" />
            <PseudocodeLine n={21} text="      candidate ← dist[u] + w" color="text-gray-300" />
            <PseudocodeLine n={22} text="      if candidate < dist[v]:" color="text-orange-300 font-bold" />
            <PseudocodeLine n={23} text="        dist[v] ← candidate" color="text-green-300" />
            <PseudocodeLine n={24} text="        prev[v] ← u" color="text-green-300" />
            <PseudocodeLine n={25} text="        PQ.insert(v, candidate)" color="text-purple-300" />
            <PseudocodeLine n={26} text="" color="" />
            <PseudocodeLine n={27} text="  // ── PATH RECONSTRUCTION ──" color="text-gray-600" />
            <PseudocodeLine n={28} text="  path ← []" color="text-gray-300" />
            <PseudocodeLine n={29} text="  cur ← dst" color="text-gray-300" />
            <PseudocodeLine n={30} text="  while cur ≠ null:" color="text-blue-300" />
            <PseudocodeLine n={31} text="    path.prepend(cur)" color="text-gray-300" />
            <PseudocodeLine n={32} text="    cur ← prev[cur]" color="text-gray-300" />
            <PseudocodeLine n={33} text="  return path, dist[dst]" color="text-yellow-300" />
          </div>

          <div className="bg-orange-950/30 border border-orange-700/30 rounded-lg p-2.5 text-[10px] text-orange-200">
            <div className="font-bold mb-1">⚡ Key Insight: Edge Relaxation</div>
            <p className="text-gray-400">For each edge (u→v, w): if going through u gives a shorter path to v, update dist[v] and remember prev[v]=u. This greedy choice is provably optimal for non-negative weights.</p>
          </div>
        </div>
      )}

      {/* Complexity Tab */}
      {activeTab === 'complexity' && (
        <div className="flex flex-col gap-3 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-3 border border-yellow-700/50">
            <div className="text-xs font-bold text-yellow-300 mb-2">⏱ Time Complexity</div>
            <div className="font-mono text-xl font-bold text-white text-center py-2">
              O((V + E) log V)
            </div>
            <div className="text-[10px] text-gray-400 mt-2 space-y-1">
              <div>• Extract-Min from heap: <span className="text-yellow-300">O(log V)</span> × V times</div>
              <div>• Decrease-key (insert): <span className="text-yellow-300">O(log V)</span> × E times</div>
              <div>• Traversing all edges: <span className="text-yellow-300">O(E)</span></div>
              <div className="pt-1 border-t border-gray-700 font-semibold text-yellow-200">
                Total: O(V log V + E log V) = O((V+E) log V)
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 border border-purple-700/50">
            <div className="text-xs font-bold text-purple-300 mb-2">💾 Space Complexity</div>
            <div className="font-mono text-xl font-bold text-white text-center py-2">O(V + E)</div>
            <div className="text-[10px] text-gray-400 mt-2 space-y-1">
              <div>• Adjacency list: <span className="text-purple-300">O(V + E)</span></div>
              <div>• dist[] array: <span className="text-purple-300">O(V)</span></div>
              <div>• prev[] array: <span className="text-purple-300">O(V)</span></div>
              <div>• Priority Queue: <span className="text-purple-300">O(V)</span></div>
              <div>• visited set: <span className="text-purple-300">O(V)</span></div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 border border-blue-700/50">
            <div className="text-xs font-bold text-blue-300 mb-2">📊 Algorithm Comparison</div>
            <table className="w-full text-[10px] text-gray-300">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  <th className="text-left pb-1.5">Algorithm</th>
                  <th className="text-center pb-1.5">Time</th>
                  <th className="text-center pb-1.5">Neg?</th>
                  <th className="text-center pb-1.5">GPS?</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Dijkstra ★', time: '(V+E)logV', neg: '✗', gps: '✓', highlight: true },
                  { name: 'A*', time: '(V+E)logV', neg: '✗', gps: '✓✓', highlight: false },
                  { name: 'Bellman-Ford', time: 'V·E', neg: '✓', gps: '✗', highlight: false },
                  { name: 'BFS', time: 'V+E', neg: 'N/A', gps: '✗', highlight: false },
                  { name: "Floyd-Warshall", time: 'V³', neg: '✓', gps: '✗', highlight: false },
                ].map(row => (
                  <tr key={row.name} className={`border-b border-gray-800 ${row.highlight ? 'bg-blue-950/30' : ''}`}>
                    <td className={`py-1 ${row.highlight ? 'text-blue-300 font-bold' : ''}`}>{row.name}</td>
                    <td className="text-center text-yellow-300 font-mono">{row.time}</td>
                    <td className={`text-center ${row.neg === '✓' ? 'text-green-400' : row.neg === '✗' ? 'text-red-400' : 'text-gray-500'}`}>{row.neg}</td>
                    <td className={`text-center ${row.gps.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>{row.gps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {routeResult && (
            <div className="bg-gray-800 rounded-lg p-3 border border-green-700/50">
              <div className="text-xs font-bold text-green-300 mb-2">📈 This Run</div>
              <div className="text-[10px] space-y-1.5">
                {[
                  { label: 'V (vertices)', value: routeResult.vertexCount.toLocaleString(), color: 'text-cyan-300' },
                  { label: 'E (edges)', value: routeResult.edgeCount.toLocaleString(), color: 'text-cyan-300' },
                  { label: 'Nodes processed', value: routeResult.nodesProcessed.toLocaleString(), color: 'text-green-300' },
                  { label: 'Edges examined', value: routeResult.edgesExamined.toLocaleString(), color: 'text-yellow-300' },
                  { label: 'Edges relaxed', value: routeResult.edgesRelaxed.toLocaleString(), color: 'text-purple-300' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-gray-500">{item.label}:</span>
                    <span className={`font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === 'properties' && (
        <div className="flex flex-col gap-3 overflow-y-auto">
          <PropertySection title="🗺️ Real World → Graph" color="text-blue-300">
            <PropertyItem icon="🔀" label="Intersection" value="→ Vertex (node)" />
            <PropertyItem icon="🛣️" label="Road segment" value="→ Edge" />
            <PropertyItem icon="📏" label="Distance" value="→ Edge Weight (m)" />
            <PropertyItem icon="🚦" label="One-way road" value="→ Directed Edge" />
            <PropertyItem icon="↔️" label="Two-way road" value="→ 2 Directed Edges" />
            <PropertyItem icon="🏁" label="Start location" value="→ Source Vertex" />
            <PropertyItem icon="🎯" label="Destination" value="→ Target Vertex" />
          </PropertySection>

          <PropertySection title="📋 Data Structures" color="text-purple-300">
            <PropertyItem icon="🏗️" label="Graph" value="Adjacency List O(V+E)" />
            <PropertyItem icon="⬇️" label="PQ" value="Binary Min-Heap" />
            <PropertyItem icon="📐" label="dist[]" value="Map<nodeId, number>" />
            <PropertyItem icon="🔗" label="prev[]" value="Map<nodeId, nodeId>" />
            <PropertyItem icon="✅" label="visited" value="Set<nodeId>" />
          </PropertySection>

          <PropertySection title="⚖️ Edge Weights" color="text-orange-300">
            <PropertyItem icon="📐" label="Formula" value="Haversine distance" />
            <PropertyItem icon="📏" label="Unit" value="Meters" />
            <PropertyItem icon="🌍" label="Input" value="lat/lon coordinates" />
            <PropertyItem icon="⚠️" label="Constraint" value="Must be ≥ 0" />
          </PropertySection>

          <PropertySection title="🔬 Algorithm Properties" color="text-green-300">
            <PropertyItem icon="✅" label="Correctness" value="Provably optimal (Greedy)" />
            <PropertyItem icon="🔄" label="Strategy" value="Greedy + DP relaxation" />
            <PropertyItem icon="⏹" label="Early stop" value="At destination" />
            <PropertyItem icon="🗑️" label="PQ deletion" value="Lazy deletion" />
            <PropertyItem icon="🚫" label="Neg weights" value="NOT supported" />
          </PropertySection>

          <div className="bg-blue-950/30 border border-blue-700/50 rounded-lg p-3 text-[10px] text-gray-400 leading-relaxed">
            <div className="text-blue-300 font-bold text-xs mb-1.5">📖 Dijkstra's Correctness</div>
            <p>At each step, Dijkstra extracts the node with the globally minimum tentative distance. By induction, this distance is provably optimal — no other path can improve it (since all edge weights are non-negative). This greedy property guarantees the algorithm always finds the shortest path.</p>
          </div>
        </div>
      )}

      {/* Trace Tab */}
      {activeTab === 'trace' && (
        <div className="flex flex-col gap-3 overflow-y-auto">
          <TracePanel
            routeResult={routeResult}
            network={SAMPLE_NETWORKS[selectedDemoNetwork]}
            appMode={appMode}
          />
        </div>
      )}
    </div>
  );
}

// ─── Trace Panel ────────────────────────────────────────────────────────────
function TracePanel({
  routeResult,
  network,
  appMode,
}: {
  routeResult: RouteResult | null;
  network: typeof SAMPLE_NETWORKS[0];
  appMode: string;
}) {
  if (!routeResult) {
    return (
      <div className="text-xs text-gray-500 text-center py-8">
        Run a route to see the algorithm trace
      </div>
    );
  }

  if (appMode !== 'demo') {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-xs text-gray-400">Path Reconstruction Trace</div>
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
          <div className="text-[10px] text-gray-400 space-y-1">
            <div className="font-bold text-green-300 mb-2">✅ Route Computed</div>
            <div>Source → Destination path reconstructed via predecessor map (prev[]).</div>
            <div className="mt-2 text-gray-500">Algorithm traced backwards from destination using prev[] map until reaching source, then reversed the path.</div>
            <div className="mt-2 font-mono text-[9px] text-blue-300">
              Path length: {routeResult.pathCoords.length} nodes
            </div>
          </div>
        </div>
        <PathSummary routeResult={routeResult} />
      </div>
    );
  }

  // Demo mode — re-run Dijkstra to get distance map for all nodes
  const graph = buildSampleGraph(network);
  const fullResult = runDijkstra(graph, network.defaultSource, network.defaultDest, false);

  // Find which nodes are on the path
  const pathSet = new Set(fullResult.path);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-gray-400 font-semibold">Dijkstra Distance Table</div>
      <div className="text-[10px] text-gray-500">Shows final shortest distance from source to every node after algorithm completes.</div>

      <div className="bg-gray-950 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-[10px]">
          <thead className="bg-gray-900">
            <tr className="text-gray-500 border-b border-gray-700">
              <th className="text-left px-2 py-2">Node</th>
              <th className="text-right px-2 py-2">dist[]</th>
              <th className="text-right px-2 py-2">prev[]</th>
              <th className="text-center px-2 py-2">Path</th>
            </tr>
          </thead>
          <tbody>
            {network.nodes.map(node => {
              const dist = fullResult.distanceMap.get(node.id) ?? Infinity;
              const prevId = fullResult.path.includes(node.id)
                ? fullResult.path[fullResult.path.indexOf(node.id) - 1] || '—'
                : '—';
              const prevNode = network.nodes.find(n => n.id === prevId);
              const isOnPath = pathSet.has(node.id);
              const isSource = node.id === network.defaultSource;
              const isDest = node.id === network.defaultDest;

              return (
                <tr
                  key={node.id}
                  className={`border-t border-gray-800 ${
                    isOnPath ? 'bg-blue-950/30' : ''
                  }`}
                >
                  <td className="px-2 py-1.5">
                    <span className={`font-semibold ${
                      isSource ? 'text-green-400' :
                      isDest ? 'text-red-400' :
                      isOnPath ? 'text-blue-300' : 'text-gray-500'
                    }`}>
                      {node.label?.split(' ')[0] || node.id}
                      {isSource && ' ●'}
                      {isDest && ' ★'}
                    </span>
                  </td>
                  <td className={`text-right px-2 py-1.5 font-mono ${isOnPath ? 'text-yellow-300' : 'text-gray-500'}`}>
                    {dist === Infinity ? '∞' : formatDistance(dist)}
                  </td>
                  <td className="text-right px-2 py-1.5 text-gray-600 font-mono text-[9px]">
                    {prevId === '—' ? '—' : prevNode?.label?.split(' ')[0] || prevId}
                  </td>
                  <td className="text-center px-2 py-1.5">
                    {isOnPath
                      ? <span className="text-blue-400 font-bold">✓</span>
                      : <span className="text-gray-700">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PathSummary routeResult={routeResult} />

      {/* Path sequence */}
      <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
        <div className="text-xs font-semibold text-gray-300 mb-2">Path Reconstruction</div>
        <div className="flex flex-wrap gap-1 items-center">
          {fullResult.path.map((nodeId, i) => {
            const node = network.nodes.find(n => n.id === nodeId);
            return (
              <span key={nodeId} className="flex items-center gap-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  i === 0 ? 'bg-green-800 text-green-200' :
                  i === fullResult.path.length - 1 ? 'bg-red-800 text-red-200' :
                  'bg-blue-900 text-blue-200'
                }`}>
                  {node?.label?.split(' ')[0] || nodeId}
                </span>
                {i < fullResult.path.length - 1 && (
                  <span className="text-gray-600 text-[10px]">→</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PathSummary({ routeResult }: { routeResult: RouteResult }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        { label: 'Total Distance', value: formatDistance(routeResult.totalDistance), color: 'text-green-300' },
        { label: 'Path Nodes', value: String(routeResult.pathCoords.length), color: 'text-blue-300' },
        { label: 'Nodes Explored', value: String(routeResult.nodesProcessed), color: 'text-yellow-300' },
        { label: 'Edges Relaxed', value: String(routeResult.edgesRelaxed), color: 'text-purple-300' },
      ].map(item => (
        <div key={item.label} className="bg-gray-900 rounded-lg p-2 border border-gray-700">
          <div className="text-[10px] text-gray-500">{item.label}</div>
          <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function PseudocodeLine({ n, text, color }: { n: number; text: string; color: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-700 w-4 flex-shrink-0 text-right select-none">{n}</span>
      <span className={color}>{text}</span>
    </div>
  );
}

function PropertySection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
      <div className={`text-xs font-bold mb-2 ${color}`}>{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function PropertyItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-[10px]">
      <span className="w-4 flex-shrink-0">{icon}</span>
      <span className="text-gray-500 w-24 flex-shrink-0">{label}:</span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}

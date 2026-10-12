/**
 * DemoGraphVisualizer.tsx
 * SVG-based visual representation of the demo graph
 * Shows nodes, edges, and the computed shortest path
 * Displays the Dijkstra distance table
 */

import { useMemo } from 'react';
import { Graph } from '../algorithms/Graph';
import { RouteResult } from '../types';
import { SampleNetwork } from '../algorithms/SampleGraph';
import { formatDistance } from '../algorithms/Dijkstra';

interface DemoGraphVisualizerProps {
  graph: Graph | null;
  network: SampleNetwork;
  routeResult: RouteResult | null;
}

export default function DemoGraphVisualizer({
  graph, network, routeResult,
}: DemoGraphVisualizerProps) {
  const WIDTH = 320;
  const HEIGHT = 220;
  const PADDING = 30;

  // Compute node positions scaled to SVG canvas
  const nodePositions = useMemo(() => {
    if (!network.nodes.length) return new Map<string, { x: number; y: number }>();

    const lats = network.nodes.map(n => n.lat);
    const lons = network.nodes.map(n => n.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latRange = maxLat - minLat || 1;
    const lonRange = maxLon - minLon || 1;

    const positions = new Map<string, { x: number; y: number }>();
    for (const node of network.nodes) {
      const x = PADDING + ((node.lon - minLon) / lonRange) * (WIDTH - 2 * PADDING);
      // Flip Y: higher lat = higher on screen
      const y = (HEIGHT - PADDING) - ((node.lat - minLat) / latRange) * (HEIGHT - 2 * PADDING);
      positions.set(node.id, { x, y });
    }
    return positions;
  }, [network]);

  // Determine which nodes are on the path
  const pathNodeSet = useMemo(() => {
    if (!routeResult || !graph) return new Set<string>();
    const set = new Set<string>();
    // Match path coords back to node IDs
    for (const node of network.nodes) {
      const onPath = routeResult.pathCoords.some(
        ([lat, lon]) =>
          Math.abs(lat - node.lat) < 0.0001 &&
          Math.abs(lon - node.lon) < 0.0001
      );
      if (onPath) set.add(node.id);
    }
    return set;
  }, [routeResult, network, graph]);

  // Determine which edges are on the path
  const pathEdges = useMemo(() => {
    if (!routeResult || !graph) return new Set<string>();
    const set = new Set<string>();
    const pathArr = Array.from(pathNodeSet);
    // Reconstruct edges from adjacent path nodes
    for (let i = 0; i < pathArr.length - 1; i++) {
      set.add(`${pathArr[i]}-${pathArr[i + 1]}`);
      set.add(`${pathArr[i + 1]}-${pathArr[i]}`);
    }
    return set;
  }, [pathNodeSet, graph]);

  const sourceId = network.defaultSource;
  const destId = network.defaultDest;

  return (
    <div className="flex flex-col gap-3">
      {/* Graph SVG */}
      <div className="bg-gray-950 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300">Graph Visualization</span>
          <span className="text-[10px] text-gray-500">{network.nodes.length} nodes · {network.edges.length} edges</span>
        </div>
        <svg width={WIDTH} height={HEIGHT} className="w-full">
          {/* Edges */}
          {network.edges.map((edge, i) => {
            const fromPos = nodePositions.get(edge.from);
            const toPos = nodePositions.get(edge.to);
            if (!fromPos || !toPos) return null;
            const isOnPath =
              pathEdges.has(`${edge.from}-${edge.to}`) ||
              pathEdges.has(`${edge.to}-${edge.from}`);
            return (
              <g key={i}>
                <line
                  x1={fromPos.x} y1={fromPos.y}
                  x2={toPos.x} y2={toPos.y}
                  stroke={isOnPath ? '#3b82f6' : '#374151'}
                  strokeWidth={isOnPath ? 3 : 1.5}
                  strokeOpacity={isOnPath ? 0.9 : 0.6}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {network.nodes.map(node => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;
            const isSource = node.id === sourceId;
            const isDest = node.id === destId;
            const isOnPath = pathNodeSet.has(node.id);

            const fillColor = isSource
              ? '#22c55e'
              : isDest
              ? '#ef4444'
              : isOnPath
              ? '#3b82f6'
              : '#4b5563';

            const strokeColor = isSource ? '#16a34a' : isDest ? '#dc2626' : isOnPath ? '#2563eb' : '#6b7280';
            const radius = isSource || isDest ? 8 : isOnPath ? 6 : 5;

            return (
              <g key={node.id}>
                <circle
                  cx={pos.x} cy={pos.y} r={radius}
                  fill={fillColor} stroke={strokeColor} strokeWidth={2}
                />
                <text
                  x={pos.x} y={pos.y - radius - 3}
                  textAnchor="middle"
                  fontSize="9"
                  fill={isOnPath ? '#93c5fd' : '#9ca3af'}
                  fontWeight={isOnPath ? 'bold' : 'normal'}
                >
                  {node.label?.split(' ')[0] || node.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-3 px-3 py-2 border-t border-gray-800">
          <LegendItem color="#22c55e" label="Source" />
          <LegendItem color="#ef4444" label="Destination" />
          <LegendItem color="#3b82f6" label="Shortest Path" />
          <LegendItem color="#4b5563" label="Other Node" />
        </div>
      </div>

      {/* Distance Table */}
      {routeResult && (
        <div className="bg-gray-950 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-700">
            <span className="text-xs font-bold text-gray-300">Final Distance Table</span>
          </div>
          <div className="overflow-y-auto max-h-40">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-gray-500">
                  <th className="text-left px-3 py-1.5">Node</th>
                  <th className="text-right px-3 py-1.5">Shortest Dist</th>
                  <th className="text-center px-2 py-1.5">Path?</th>
                </tr>
              </thead>
              <tbody>
                {network.nodes.map(node => {
                  const isOnPath = pathNodeSet.has(node.id);
                  const isSource = node.id === sourceId;
                  const isDest = node.id === destId;
                  return (
                    <tr
                      key={node.id}
                      className={`border-t border-gray-800 ${isOnPath ? 'bg-blue-950/30' : ''}`}
                    >
                      <td className="px-3 py-1">
                        <span className={`font-semibold ${
                          isSource ? 'text-green-400' :
                          isDest ? 'text-red-400' :
                          isOnPath ? 'text-blue-300' : 'text-gray-400'
                        }`}>
                          {node.label?.split(' ').slice(0, 2).join(' ') || node.id}
                          {isSource && ' 🟢'}
                          {isDest && ' 🔴'}
                        </span>
                      </td>
                      <td className="text-right px-3 py-1 font-mono">
                        <span className={isOnPath ? 'text-yellow-300' : 'text-gray-500'}>
                          {isSource
                            ? '0 m'
                            : formatDistance(routeResult.totalDistance)
                          }
                        </span>
                      </td>
                      <td className="text-center px-2 py-1">
                        {isOnPath ? <span className="text-blue-400">✓</span> : <span className="text-gray-700">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1 text-[9px] text-gray-400">
      <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: color }} />
      {label}
    </div>
  );
}

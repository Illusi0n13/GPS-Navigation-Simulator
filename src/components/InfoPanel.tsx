/**
 * InfoPanel.tsx
 * Bottom status bar showing route summary
 */

import { RouteResult } from '../types';
import { formatDistance, formatTime } from '../algorithms/Dijkstra';
import { formatTravelTime, estimateTravelTime } from '../algorithms/Distance';

interface InfoPanelProps {
  routeResult: RouteResult | null;
}

export default function InfoPanel({ routeResult }: InfoPanelProps) {
  if (!routeResult) {
    return (
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-2 flex items-center gap-4 flex-shrink-0">
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />
          Select locations and click "Find Shortest Route" to begin navigation
        </div>
        <div className="ml-auto text-xs text-gray-600 hidden md:block">
          DAA Project · B.Tech Computer Science · Dijkstra's Algorithm
        </div>
      </div>
    );
  }

  if (!routeResult.found) {
    return (
      <div className="bg-yellow-950/30 border-t border-yellow-700/50 px-4 py-2 flex items-center gap-4 flex-shrink-0">
        <span className="text-xs text-yellow-400">⚠️ No path found between selected locations</span>
      </div>
    );
  }

  const travelSecs = estimateTravelTime(routeResult.totalDistance);

  return (
    <div className="bg-gray-900 border-t border-gray-700 px-4 py-2 flex items-center gap-4 flex-shrink-0 flex-wrap">
      <StatusPill label="Route" value={`${routeResult.sourceName} → ${routeResult.destName}`} color="text-blue-300" />
      <StatusPill label="Distance" value={formatDistance(routeResult.totalDistance)} color="text-green-300" />
      <StatusPill label="Est. Time" value={formatTravelTime(travelSecs)} color="text-green-300" />
      <StatusPill label="Nodes Processed" value={routeResult.nodesProcessed.toString()} color="text-yellow-300" />
      <StatusPill label="Edges Examined" value={routeResult.edgesExamined.toString()} color="text-yellow-300" />
      <StatusPill label="Graph V" value={routeResult.vertexCount.toString()} color="text-cyan-300" />
      <StatusPill label="Graph E" value={routeResult.edgeCount.toString()} color="text-cyan-300" />
      <StatusPill label="Exec. Time" value={formatTime(routeResult.executionTimeMs)} color="text-orange-300" />
      <div className="ml-auto text-xs text-gray-500 hidden lg:block">Algorithm: Dijkstra · O((V+E) log V)</div>
    </div>
  );
}

function StatusPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-500">{label}:</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

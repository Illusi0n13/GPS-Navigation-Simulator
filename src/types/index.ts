/**
 * types/index.ts
 * Shared TypeScript type definitions for the GPS Navigation Simulator
 */

export type AppMode = 'real' | 'demo';
export type RouteStatus = 'idle' | 'loading' | 'success' | 'error';
export type SelectionMode = 'none' | 'source' | 'destination';

export interface LatLon {
  lat: number;
  lon: number;
}

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  label: string;
  type: 'source' | 'destination';
}

export interface RouteResult {
  pathCoords: Array<[number, number]>;
  totalDistance: number;
  nodesProcessed: number;
  edgesExamined: number;
  edgesRelaxed: number;
  executionTimeMs: number;
  vertexCount: number;
  edgeCount: number;
  wayCount?: number;
  found: boolean;
  sourceName: string;
  destName: string;
  /** Extra info shown to the user (e.g. expanded search area, off-road connectors) */
  notes?: string[];
  /** Straight-line connectors from clicked points to the nearest road (village / off-road) */
  connectors?: Array<[[number, number], [number, number]]>;
}

export interface AlgoStep {
  currentNode: string;
  currentLabel?: string;
  distanceTable: Array<{ node: string; label: string; distance: number }>;
  visitedCount: number;
  stepIndex: number;
}

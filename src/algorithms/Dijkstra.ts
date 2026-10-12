/**
 * Dijkstra.ts
 * Dijkstra's Shortest Path Algorithm — Core Implementation
 *
 * This is the central DAA component of the GPS Navigation Simulator.
 *
 * Algorithm Overview:
 * -------------------
 * Dijkstra's algorithm finds the shortest path from a source vertex
 * to all other vertices in a weighted graph with NON-NEGATIVE edge weights.
 *
 * Time Complexity:  O((V + E) log V)  — with binary min-heap priority queue
 * Space Complexity: O(V + E)
 *
 * Where:
 *   V = number of vertices (road intersections)
 *   E = number of edges (road segments)
 *   log V factor comes from priority queue operations
 *
 * LIMITATION: Does NOT support negative edge weights.
 *             For negative weights, use Bellman-Ford instead.
 */

import { Graph } from './Graph';
import { MinPriorityQueue } from './PriorityQueue';

export interface DijkstraStep {
  currentNode: string;
  visitedNodes: Set<string>;
  distances: Map<string, number>;
  relaxedEdges: Array<{ from: string; to: string; weight: number }>;
  queueSnapshot: Array<{ id: string; distance: number }>;
}

export interface DijkstraResult {
  path: string[];               // Sequence of node IDs from source to destination
  totalDistance: number;        // Total distance in meters
  nodesProcessed: number;       // Vertices extracted from priority queue
  edgesExamined: number;        // Total edge relaxations attempted
  edgesRelaxed: number;         // Successful relaxations (distance updated)
  executionTimeMs: number;      // Wall-clock time in milliseconds
  visited: Set<string>;         // All visited node IDs
  distanceMap: Map<string, number>; // Final shortest distances from source
  steps: DijkstraStep[];        // Step-by-step for visualization (only if enabled)
  found: boolean;               // Whether destination was reachable
}

export function runDijkstra(
  graph: Graph,
  sourceId: string,
  destinationId: string,
  captureSteps: boolean = false
): DijkstraResult {

  const startTime = performance.now();

  // ─── INITIALIZATION ───────────────────────────────────────────────────────
  // distance[v] = current known shortest distance from source to v
  // Initialized to Infinity for all nodes except source (= 0)
  const distance = new Map<string, number>();

  // previous[v] = predecessor of v on the shortest path from source
  // Used for path reconstruction
  const previous = new Map<string, string | null>();

  // visited = set of nodes whose shortest distance is finalized
  const visited = new Set<string>();

  // Steps for visualization
  const steps: DijkstraStep[] = [];

  // Statistics counters
  let nodesProcessed = 0;
  let edgesExamined = 0;
  let edgesRelaxed = 0;

  // Initialize all distances to Infinity
  for (const nodeId of graph.getAllNodeIds()) {
    distance.set(nodeId, Infinity);
    previous.set(nodeId, null);
  }

  // Source distance = 0
  distance.set(sourceId, 0);

  // ─── PRIORITY QUEUE ───────────────────────────────────────────────────────
  // Min-heap priority queue: always extracts node with minimum distance
  const pq = new MinPriorityQueue();
  pq.insert(sourceId, 0);

  // ─── MAIN DIJKSTRA LOOP ───────────────────────────────────────────────────
  while (!pq.isEmpty()) {
    // Step 1: Extract vertex with minimum known distance
    const current = pq.extractMin()!;
    const currentId = current.id;
    const currentDist = current.distance;

    // Step 2: Skip stale queue entries
    // (We use lazy deletion — a node may be in the queue multiple times
    //  with different distances; skip if already finalized)
    if (visited.has(currentId)) continue;

    // Step 3: Mark current node as visited (finalized)
    visited.add(currentId);
    nodesProcessed++;

    // Capture visualization step
    if (captureSteps && steps.length < 200) {
      steps.push({
        currentNode: currentId,
        visitedNodes: new Set(visited),
        distances: new Map(distance),
        relaxedEdges: [],
        queueSnapshot: pq.getHeapArray().map(n => ({ id: n.id, distance: n.distance })),
      });
    }

    // Step 4: Early termination — stop when destination is finalized
    if (currentId === destinationId) break;

    // Step 5: Examine all neighbors of current node
    const neighbors = graph.getNeighbors(currentId);
    const stepRelaxed: Array<{ from: string; to: string; weight: number }> = [];

    for (const edge of neighbors) {
      const neighborId = edge.to;
      const edgeWeight = edge.weight;
      edgesExamined++;

      // Skip already finalized nodes
      if (visited.has(neighborId)) continue;

      // ─── EDGE RELAXATION ─────────────────────────────────────────────────
      // If the path through currentId is shorter than the known path to neighbor:
      //
      //   if distance[current] + weight(current, neighbor) < distance[neighbor]
      //     then update distance[neighbor] and set previous[neighbor] = current
      //
      const candidateDistance = currentDist + edgeWeight;

      if (candidateDistance < (distance.get(neighborId) ?? Infinity)) {
        // Relaxation successful — found a shorter path
        distance.set(neighborId, candidateDistance);
        previous.set(neighborId, currentId);
        edgesRelaxed++;

        // Insert updated distance into priority queue
        // (lazy deletion handles old entries)
        pq.insert(neighborId, candidateDistance);

        stepRelaxed.push({ from: currentId, to: neighborId, weight: edgeWeight });
      }
    }

    // Update last step with relaxed edges
    if (captureSteps && steps.length > 0) {
      steps[steps.length - 1].relaxedEdges = stepRelaxed;
    }
  }

  const executionTimeMs = performance.now() - startTime;

  // ─── PATH RECONSTRUCTION ─────────────────────────────────────────────────
  // Trace back from destination to source using `previous` map
  // destination → prev → prev → ... → source
  // Then reverse to get: source → ... → destination
  const path: string[] = [];
  const destDist = distance.get(destinationId) ?? Infinity;
  const found = destDist !== Infinity;

  if (found) {
    let current: string | null = destinationId;
    while (current !== null) {
      path.unshift(current);
      current = previous.get(current) ?? null;
    }
  }

  return {
    path,
    totalDistance: destDist,
    nodesProcessed,
    edgesExamined,
    edgesRelaxed,
    executionTimeMs,
    visited,
    distanceMap: distance,
    steps,
    found,
  };
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Format time for display
 */
export function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} μs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

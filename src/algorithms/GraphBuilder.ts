/**
 * GraphBuilder.ts
 * Converts OpenStreetMap road-network data into our weighted graph
 *
 * Pipeline:
 *   OSM Overpass API response
 *         ↓
 *   Parse nodes and ways
 *         ↓
 *   Extract road intersections (vertices)
 *         ↓
 *   Extract road segments (edges)
 *         ↓
 *   Calculate edge weights (Haversine distance)
 *         ↓
 *   Build Graph (adjacency list)
 *
 * OSM Data Model:
 *   Node = geographic point with lat/lon
 *   Way  = ordered list of nodes representing a road
 *   Tags = key-value metadata (e.g., highway=primary, oneway=yes)
 */

import { Graph, GraphNode } from './Graph';
import { haversineDistance } from './Distance';
import { overpassQuery } from './OverpassClient';

// OSM data types
interface OSMNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OSMWay {
  type: 'way';
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
}

type OSMElement = OSMNode | OSMWay;

interface OverpassResponse {
  elements: OSMElement[];
}

// Road types that are typically one-way by default (OSM convention)
// (motorway, trunk are typically one-way in OSM data)

// Road types that are typically one-way
const DEFAULT_ONEWAY_TYPES = new Set(['motorway', 'motorway_link', 'trunk']);

export interface BuildResult {
  graph: Graph;
  nodeCount: number;
  edgeCount: number;
  wayCount: number;
  boundingBox: { south: number; west: number; north: number; east: number };
}

/**
 * Fetch road network from OpenStreetMap Overpass API
 * and build a weighted graph
 *
 * @param south  Southern latitude of bounding box
 * @param west   Western longitude of bounding box
 * @param north  Northern latitude of bounding box
 * @param east   Eastern longitude of bounding box
 */
export async function buildGraphFromOSM(
  south: number,
  west: number,
  north: number,
  east: number,
  onStatus?: (msg: string) => void
): Promise<BuildResult> {
  // Overpass QL query:
  // Fetch all highway ways (roads) within the bounding box,
  // and also fetch all referenced nodes so we have coordinates
  const query = `
    [out:json][timeout:25];
    (
      way["highway"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `;

  // Resilient fetch: multiple mirrors, timeout, retry, cache (see OverpassClient.ts)
  const data = await overpassQuery<OverpassResponse>(query, { onStatus });

  return parseOSMToGraph(data, { south, west, north, east });
}

/**
 * Parse OSM Overpass API response and build the graph
 */
export function parseOSMToGraph(
  data: OverpassResponse,
  boundingBox: { south: number; west: number; north: number; east: number }
): BuildResult {
  const graph = new Graph();

  // Separate nodes and ways from the response
  const osmNodes = new Map<number, OSMNode>();
  const osmWays: OSMWay[] = [];

  for (const element of data.elements) {
    if (element.type === 'node') {
      osmNodes.set(element.id, element as OSMNode);
    } else if (element.type === 'way') {
      osmWays.push(element as OSMWay);
    }
  }

  // Track which OSM nodes are used in valid road ways
  const usedNodeIds = new Set<number>();
  const validWays: OSMWay[] = [];

  // Filter ways to valid highway types
  for (const way of osmWays) {
    const highway = way.tags?.highway;
    if (!highway) continue;
    // Accept all highway types for routing
    validWays.push(way);
    for (const nodeId of way.nodes) {
      usedNodeIds.add(nodeId);
    }
  }

  // Add graph vertices for all used OSM nodes
  for (const nodeId of usedNodeIds) {
    const osmNode = osmNodes.get(nodeId);
    if (!osmNode) continue;

    const graphNode: GraphNode = {
      id: String(nodeId),
      lat: osmNode.lat,
      lon: osmNode.lon,
      label: osmNode.tags?.name,
    };
    graph.addVertex(graphNode);
  }

  let wayCount = 0;

  // Add graph edges for each consecutive node pair in each road way
  for (const way of validWays) {
    const highway = way.tags?.highway || 'road';
    const roadName = way.tags?.name || highway;
    const isOneway =
      way.tags?.oneway === 'yes' ||
      way.tags?.oneway === '1' ||
      way.tags?.junction === 'roundabout' ||
      DEFAULT_ONEWAY_TYPES.has(highway);

    wayCount++;

    for (let i = 0; i < way.nodes.length - 1; i++) {
      const fromId = String(way.nodes[i]);
      const toId = String(way.nodes[i + 1]);

      const fromNode = osmNodes.get(way.nodes[i]);
      const toNode = osmNodes.get(way.nodes[i + 1]);

      if (!fromNode || !toNode) continue;

      // Calculate edge weight as Haversine distance (meters)
      const distMeters = haversineDistance(
        fromNode.lat, fromNode.lon,
        toNode.lat, toNode.lon
      );

      if (isOneway) {
        // One-way road: only add forward edge
        graph.addEdge(fromId, toId, distMeters, roadName);
      } else {
        // Two-way road: add edges in both directions
        graph.addBidirectionalEdge(fromId, toId, distMeters, roadName);
      }
    }
  }

  const stats = graph.getStats();

  return {
    graph,
    nodeCount: stats.vertexCount,
    edgeCount: stats.edgeCount,
    wayCount,
    boundingBox,
  };
}

/**
 * Find the nearest graph node to given coordinates
 * Used to snap clicked map points to graph nodes
 *
 * @param graph    The road graph
 * @param lat      Target latitude
 * @param lon      Target longitude
 * @param maxDist  Maximum search radius in meters (default: 500m)
 */
export function findNearestNode(
  graph: Graph,
  lat: number,
  lon: number,
  maxDist: number = 500
): GraphNode | null {
  let nearest: GraphNode | null = null;
  let minDist = maxDist;

  for (const node of graph.getAllNodes()) {
    const d = haversineDistance(lat, lon, node.lat, node.lon);
    if (d < minDist) {
      minDist = d;
      nearest = node;
    }
  }

  return nearest;
}

/**
 * Find the K nearest graph nodes to given coordinates (sorted by distance).
 * Used so that in sparse / village areas we can try several candidate nodes
 * instead of giving up when the single nearest node is on a dead-end track.
 */
export function findNearestNodes(
  graph: Graph,
  lat: number,
  lon: number,
  maxDist: number = 5000,
  k: number = 8
): Array<{ node: GraphNode; distance: number }> {
  const found: Array<{ node: GraphNode; distance: number }> = [];
  for (const node of graph.getAllNodes()) {
    // Skip isolated nodes (no edges at all)
    if (graph.getNeighbors(node.id).length === 0) continue;
    const d = haversineDistance(lat, lon, node.lat, node.lon);
    if (d <= maxDist) found.push({ node, distance: d });
  }
  found.sort((a, b) => a.distance - b.distance);
  return found.slice(0, k);
}

/**
 * Label every node with a connected-component id (treating edges as undirected).
 * Village road data is often fragmented; knowing which fragment a node belongs
 * to lets us snap source and destination to the SAME connected road network.
 */
export function computeComponents(graph: Graph): Map<string, number> {
  // Build undirected adjacency
  const undirected = new Map<string, string[]>();
  for (const [from, edges] of graph.getAdjacencyList()) {
    if (!undirected.has(from)) undirected.set(from, []);
    for (const e of edges) {
      undirected.get(from)!.push(e.to);
      if (!undirected.has(e.to)) undirected.set(e.to, []);
      undirected.get(e.to)!.push(from);
    }
  }

  const comp = new Map<string, number>();
  let id = 0;
  for (const start of undirected.keys()) {
    if (comp.has(start)) continue;
    const stack = [start];
    comp.set(start, id);
    while (stack.length) {
      const cur = stack.pop()!;
      for (const nb of undirected.get(cur) || []) {
        if (!comp.has(nb)) {
          comp.set(nb, id);
          stack.push(nb);
        }
      }
    }
    id++;
  }
  return comp;
}

/**
 * Pick the best (source, destination) node pair that lie in the same connected
 * road network, preferring the closest snap distances. Returns null if the
 * candidates share no component.
 */
export function pickConnectedPair(
  graph: Graph,
  src: { lat: number; lon: number },
  dst: { lat: number; lon: number },
  maxSnapMeters: number
): { source: GraphNode; dest: GraphNode; sourceSnap: number; destSnap: number } | null {
  const srcCands = findNearestNodes(graph, src.lat, src.lon, maxSnapMeters, 12);
  const dstCands = findNearestNodes(graph, dst.lat, dst.lon, maxSnapMeters, 12);
  if (srcCands.length === 0 || dstCands.length === 0) return null;

  const comp = computeComponents(graph);
  let best: { s: typeof srcCands[0]; d: typeof dstCands[0]; cost: number } | null = null;

  for (const s of srcCands) {
    for (const d of dstCands) {
      if (s.node.id === d.node.id) continue;
      if (comp.get(s.node.id) !== comp.get(d.node.id)) continue;
      const cost = s.distance + d.distance;
      if (!best || cost < best.cost) best = { s, d, cost };
    }
  }
  if (!best) return null;
  return { source: best.s.node, dest: best.d.node, sourceSnap: best.s.distance, destSnap: best.d.distance };
}

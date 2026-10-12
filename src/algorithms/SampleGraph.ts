/**
 * SampleGraph.ts
 * Pre-built sample road network graphs for Demo/Visualization mode
 *
 * These graphs represent simplified but realistic road networks.
 * Used when the user wants to visualize Dijkstra step-by-step
 * on a small enough graph.
 *
 * The graphs are based on real geographic coordinates but simplified
 * for educational clarity.
 */

import { Graph, GraphNode } from './Graph';
import { haversineDistance } from './Distance';

export interface SampleNetwork {
  name: string;
  description: string;
  nodes: GraphNode[];
  edges: Array<{ from: string; to: string; bidirectional: boolean; label?: string }>;
  defaultSource: string;
  defaultDest: string;
  center: [number, number];
  zoom: number;
}

/**
 * Create a sample graph from a network definition
 */
export function buildSampleGraph(network: SampleNetwork): Graph {
  const graph = new Graph();

  // Add all vertices
  for (const node of network.nodes) {
    graph.addVertex(node);
  }

  // Add edges with calculated Haversine weights
  for (const edge of network.edges) {
    const fromNode = network.nodes.find(n => n.id === edge.from);
    const toNode = network.nodes.find(n => n.id === edge.to);

    if (!fromNode || !toNode) continue;

    const weight = haversineDistance(fromNode.lat, fromNode.lon, toNode.lat, toNode.lon);

    if (edge.bidirectional) {
      graph.addBidirectionalEdge(edge.from, edge.to, weight, edge.label);
    } else {
      graph.addEdge(edge.from, edge.to, weight, edge.label);
    }
  }

  return graph;
}

/**
 * Sample Network 1: Delhi City Center Road Network (Simplified)
 * A small educational graph representing key intersections
 */
export const DELHI_SAMPLE_NETWORK: SampleNetwork = {
  name: 'Delhi City Center (Demo)',
  description: 'Simplified road network around Connaught Place, New Delhi',
  center: [28.6315, 77.2167],
  zoom: 14,
  defaultSource: 'CP',
  defaultDest: 'ITO',
  nodes: [
    { id: 'CP', lat: 28.6315, lon: 77.2167, label: 'Connaught Place' },
    { id: 'MKT', lat: 28.6269, lon: 77.2090, label: 'Mandi House' },
    { id: 'NDLS', lat: 28.6419, lon: 77.2194, label: 'New Delhi Station' },
    { id: 'RC', lat: 28.6200, lon: 77.2295, label: 'India Gate' },
    { id: 'ITO', lat: 28.6272, lon: 77.2405, label: 'ITO' },
    { id: 'KG', lat: 28.6362, lon: 77.2274, label: 'Kashmere Gate Area' },
    { id: 'PH', lat: 28.6129, lon: 77.2295, label: 'Khan Market' },
    { id: 'JN', lat: 28.6353, lon: 77.2100, label: 'Paharganj' },
    { id: 'RK', lat: 28.6180, lon: 77.2090, label: 'Rajiv Chowk Area' },
    { id: 'SP', lat: 28.6450, lon: 77.2080, label: 'Shastri Park Area' },
  ],
  edges: [
    { from: 'CP', to: 'MKT', bidirectional: true, label: 'Connaught Circus' },
    { from: 'CP', to: 'NDLS', bidirectional: true, label: 'Barakhamba Road' },
    { from: 'CP', to: 'RC', bidirectional: true, label: 'Janpath' },
    { from: 'CP', to: 'KG', bidirectional: true, label: 'Sansad Marg' },
    { from: 'MKT', to: 'RK', bidirectional: true, label: 'Todarmal Road' },
    { from: 'MKT', to: 'ITO', bidirectional: true, label: 'Bahadur Shah Zafar Marg' },
    { from: 'NDLS', to: 'JN', bidirectional: true, label: 'Panchkuian Road' },
    { from: 'NDLS', to: 'KG', bidirectional: true, label: 'Hamilton Road' },
    { from: 'NDLS', to: 'SP', bidirectional: true, label: 'GTK Road' },
    { from: 'RC', to: 'ITO', bidirectional: true, label: 'Mathura Road' },
    { from: 'RC', to: 'PH', bidirectional: true, label: 'Lodhi Road' },
    { from: 'ITO', to: 'KG', bidirectional: true, label: 'Ring Road' },
    { from: 'KG', to: 'SP', bidirectional: true, label: 'GTK Road' },
    { from: 'JN', to: 'SP', bidirectional: true, label: 'Rohtak Road' },
    { from: 'PH', to: 'RK', bidirectional: true, label: 'Lala Lajpat Rai Road' },
    { from: 'RK', to: 'JN', bidirectional: true, label: 'Pusa Road' },
  ],
};

/**
 * Sample Network 2: Mumbai Marine Lines (Simplified)
 */
export const MUMBAI_SAMPLE_NETWORK: SampleNetwork = {
  name: 'Mumbai Marine Lines (Demo)',
  description: 'Simplified road network around Marine Lines, Mumbai',
  center: [18.9322, 72.8264],
  zoom: 14,
  defaultSource: 'CST',
  defaultDest: 'BKC',
  nodes: [
    { id: 'CST', lat: 18.9400, lon: 72.8350, label: 'CST Station' },
    { id: 'ML', lat: 18.9322, lon: 72.8264, label: 'Marine Lines' },
    { id: 'CC', lat: 18.9220, lon: 72.8347, label: 'Churchgate' },
    { id: 'CD', lat: 18.9255, lon: 72.8242, label: 'Cuffe Parade' },
    { id: 'NP', lat: 18.9550, lon: 72.8195, label: 'Nariman Point' },
    { id: 'BKC', lat: 19.0660, lon: 72.8677, label: 'BKC' },
    { id: 'DH', lat: 18.9719, lon: 72.8323, label: 'Dharavi' },
    { id: 'WO', lat: 18.9645, lon: 72.8422, label: 'Worli' },
    { id: 'MT', lat: 19.0178, lon: 72.8478, label: 'Matunga' },
    { id: 'AN', lat: 19.1197, lon: 72.8468, label: 'Andheri' },
  ],
  edges: [
    { from: 'CST', to: 'ML', bidirectional: true, label: 'Marine Drive' },
    { from: 'CST', to: 'CC', bidirectional: true, label: 'DN Road' },
    { from: 'ML', to: 'CC', bidirectional: true, label: 'Netaji Subhash Road' },
    { from: 'ML', to: 'NP', bidirectional: true, label: 'Marine Drive' },
    { from: 'CC', to: 'CD', bidirectional: true, label: 'Cuffe Parade Road' },
    { from: 'CC', to: 'DH', bidirectional: true, label: 'SV Marg' },
    { from: 'NP', to: 'WO', bidirectional: true, label: 'Worli Sea Face' },
    { from: 'DH', to: 'WO', bidirectional: true, label: 'LBS Marg' },
    { from: 'DH', to: 'MT', bidirectional: true, label: 'Eastern Express Highway' },
    { from: 'WO', to: 'MT', bidirectional: true, label: 'SV Marg' },
    { from: 'WO', to: 'BKC', bidirectional: true, label: 'Bandra-Worli Sealink' },
    { from: 'MT', to: 'BKC', bidirectional: true, label: 'CST Road' },
    { from: 'MT', to: 'AN', bidirectional: true, label: 'Western Express Highway' },
    { from: 'BKC', to: 'AN', bidirectional: true, label: 'JVLR' },
  ],
};

/**
 * Sample Network 3: Bangalore Tech Corridor (Simplified)
 */
export const BANGALORE_SAMPLE_NETWORK: SampleNetwork = {
  name: 'Bangalore Tech Corridor (Demo)',
  description: 'Simplified road network around Electronic City, Bangalore',
  center: [12.9716, 77.5946],
  zoom: 13,
  defaultSource: 'MG',
  defaultDest: 'EC',
  nodes: [
    { id: 'MG', lat: 12.9756, lon: 77.6010, label: 'MG Road' },
    { id: 'KP', lat: 12.9352, lon: 77.6245, label: 'Koramangala' },
    { id: 'JN', lat: 12.9099, lon: 77.6476, label: 'Jayanagar' },
    { id: 'EC', lat: 12.8458, lon: 77.6602, label: 'Electronic City' },
    { id: 'WF', lat: 12.9698, lon: 77.7499, label: 'Whitefield' },
    { id: 'HR', lat: 13.0297, lon: 77.5850, label: 'Hebbal' },
    { id: 'YS', lat: 12.9540, lon: 77.4969, label: 'Yeshwantpur' },
    { id: 'IN', lat: 13.1979, lon: 77.7063, label: 'Airport Road' },
    { id: 'KN', lat: 12.9279, lon: 77.5009, label: 'Kanakapura Road' },
    { id: 'BD', lat: 12.9784, lon: 77.5744, label: 'Bangalore Downtown' },
  ],
  edges: [
    { from: 'MG', to: 'KP', bidirectional: true, label: 'Hosur Road' },
    { from: 'MG', to: 'HR', bidirectional: true, label: 'Bellary Road' },
    { from: 'MG', to: 'BD', bidirectional: true, label: 'MG Road' },
    { from: 'KP', to: 'JN', bidirectional: true, label: 'Bannerghatta Road' },
    { from: 'KP', to: 'WF', bidirectional: true, label: 'Outer Ring Road' },
    { from: 'JN', to: 'EC', bidirectional: true, label: 'Hosur Road' },
    { from: 'JN', to: 'KN', bidirectional: true, label: 'Kanakapura Road' },
    { from: 'EC', to: 'KN', bidirectional: true, label: 'Kanakapura Road' },
    { from: 'HR', to: 'IN', bidirectional: true, label: 'NH 44' },
    { from: 'HR', to: 'YS', bidirectional: true, label: 'Tumkur Road' },
    { from: 'YS', to: 'BD', bidirectional: true, label: 'Seshadri Road' },
    { from: 'YS', to: 'KN', bidirectional: true, label: 'Mysore Road' },
    { from: 'BD', to: 'MG', bidirectional: true, label: 'Cunningham Road' },
    { from: 'WF', to: 'IN', bidirectional: false, label: 'NH 648' },
  ],
};

export const SAMPLE_NETWORKS = [
  DELHI_SAMPLE_NETWORK,
  MUMBAI_SAMPLE_NETWORK,
  BANGALORE_SAMPLE_NETWORK,
];

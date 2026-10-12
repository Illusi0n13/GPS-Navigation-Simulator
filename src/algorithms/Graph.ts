/**
 * Graph.ts
 * Weighted Graph using Adjacency List representation
 *
 * Converts real-world road network data into a graph structure.
 *
 * Graph Representation:
 *   Real World          →   Graph
 *   Road intersection   →   Vertex (node)
 *   Road segment        →   Edge
 *   Road distance       →   Edge weight (meters)
 *   Starting location   →   Source vertex
 *   Destination         →   Target vertex
 *
 * Space Complexity: O(V + E)
 */

export interface GraphEdge {
  to: string;         // Destination node ID
  weight: number;     // Distance in meters
  roadName?: string;  // Optional road name from OSM
}

export interface GraphNode {
  id: string;
  lat: number;
  lon: number;
  label?: string;
}

export interface GraphStats {
  vertexCount: number;
  edgeCount: number;
}

export class Graph {
  // Adjacency list: nodeId → list of edges
  private adjacencyList: Map<string, GraphEdge[]> = new Map();

  // Node metadata: nodeId → node info
  private nodes: Map<string, GraphNode> = new Map();

  /**
   * Add a vertex (intersection/node) to the graph
   */
  addVertex(node: GraphNode): void {
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, []);
      this.nodes.set(node.id, node);
    }
  }

  /**
   * Add a directed edge from `from` to `to` with given weight
   * For bidirectional roads, call twice (or use addBidirectionalEdge)
   */
  addEdge(from: string, to: string, weight: number, roadName?: string): void {
    if (!this.adjacencyList.has(from)) {
      console.warn(`Graph: vertex ${from} not found, creating implicitly`);
      this.adjacencyList.set(from, []);
    }
    const edges = this.adjacencyList.get(from)!;
    // Avoid duplicate edges
    const existing = edges.find(e => e.to === to);
    if (!existing) {
      edges.push({ to, weight, roadName });
    } else if (existing.weight > weight) {
      // Keep shortest duplicate
      existing.weight = weight;
    }
  }

  /**
   * Add a bidirectional edge (for two-way roads)
   */
  addBidirectionalEdge(from: string, to: string, weight: number, roadName?: string): void {
    this.addEdge(from, to, weight, roadName);
    this.addEdge(to, from, weight, roadName);
  }

  /**
   * Get all neighbors of a node
   */
  getNeighbors(nodeId: string): GraphEdge[] {
    return this.adjacencyList.get(nodeId) || [];
  }

  /**
   * Get node metadata
   */
  getNode(nodeId: string): GraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all node IDs
   */
  getAllNodeIds(): string[] {
    return Array.from(this.adjacencyList.keys());
  }

  /**
   * Get all nodes with their metadata
   */
  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Check if a node exists in the graph
   */
  hasNode(nodeId: string): boolean {
    return this.adjacencyList.has(nodeId);
  }

  /**
   * Get graph statistics for complexity analysis
   */
  getStats(): GraphStats {
    let edgeCount = 0;
    for (const edges of this.adjacencyList.values()) {
      edgeCount += edges.length;
    }
    return {
      vertexCount: this.adjacencyList.size,
      edgeCount,
    };
  }

  /**
   * Get the full adjacency list (for visualization)
   */
  getAdjacencyList(): Map<string, GraphEdge[]> {
    return this.adjacencyList;
  }

  /**
   * Clear the entire graph
   */
  clear(): void {
    this.adjacencyList.clear();
    this.nodes.clear();
  }

  /**
   * Total vertex count
   */
  get vertexCount(): number {
    return this.adjacencyList.size;
  }

  /**
   * Total edge count
   */
  get edgeCount(): number {
    let count = 0;
    for (const edges of this.adjacencyList.values()) {
      count += edges.length;
    }
    return count;
  }
}

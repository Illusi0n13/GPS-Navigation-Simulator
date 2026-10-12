/**
 * PriorityQueue.ts
 * Binary Min-Heap based Priority Queue for Dijkstra's Algorithm
 *
 * Used to efficiently extract the node with the minimum known distance.
 * Time Complexity: O(log n) for insert and extractMin
 * Space Complexity: O(n)
 */

export interface PQNode {
  id: string;
  distance: number;
}

export class MinPriorityQueue {
  private heap: PQNode[] = [];
  private size: number = 0;

  /** Returns number of elements in the heap */
  getSize(): number {
    return this.size;
  }

  /** Returns true if the heap is empty */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Insert a new node with given distance into the heap
   * Time: O(log n)
   */
  insert(id: string, distance: number): void {
    const node: PQNode = { id, distance };
    this.heap[this.size] = node;
    this.size++;
    this._bubbleUp(this.size - 1);
  }

  /**
   * Extract and return the node with the minimum distance
   * Time: O(log n)
   */
  extractMin(): PQNode | null {
    if (this.isEmpty()) return null;

    const min = this.heap[0];
    this.size--;

    if (this.size > 0) {
      // Move last element to root
      this.heap[0] = this.heap[this.size];
      this._sinkDown(0);
    }

    return min;
  }

  /**
   * Peek at minimum without extracting
   */
  peekMin(): PQNode | null {
    if (this.isEmpty()) return null;
    return this.heap[0];
  }

  /**
   * Bubble up element at index i to maintain heap property
   * (min-heap: parent <= children)
   */
  private _bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].distance <= this.heap[i].distance) break;
      // Swap parent and current
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  /**
   * Sink down element at index i to maintain heap property
   */
  private _sinkDown(i: number): void {
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < this.size && this.heap[left].distance < this.heap[smallest].distance) {
        smallest = left;
      }
      if (right < this.size && this.heap[right].distance < this.heap[smallest].distance) {
        smallest = right;
      }

      if (smallest === i) break;

      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }

  /** Return heap as array (for visualization) */
  getHeapArray(): PQNode[] {
    return this.heap.slice(0, this.size);
  }
}

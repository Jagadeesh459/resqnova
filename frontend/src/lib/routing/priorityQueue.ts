export interface QueueItem<T> {
  element: T;
  priority: number;
}

/**
 * High-Performance Binary Min-Heap Priority Queue for A* and D* Lite pathfinding.
 * Operates in O(log N) for insertions and extractions, with O(1) peek.
 */
export class PriorityQueue<T> {
  private heap: QueueItem<T>[] = [];

  /**
   * Insert element with a given numeric priority (smaller number = higher priority).
   */
  public enqueue(element: T, priority: number): void {
    const item: QueueItem<T> = { element, priority };
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Remove and return the element with the lowest priority value (highest urgency).
   */
  public dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop()!.element;

    const min = this.heap[0].element;
    this.heap[0] = this.heap.pop()!;
    this.sinkDown(0);
    return min;
  }

  /**
   * View the minimum element without removing it.
   */
  public peek(): T | undefined {
    return this.heap[0]?.element;
  }

  /**
   * Returns true if the queue contains no elements.
   */
  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Number of items currently queued.
   */
  public size(): number {
    return this.heap.length;
  }

  /**
   * Clears the entire priority queue.
   */
  public clear(): void {
    this.heap = [];
  }

  private bubbleUp(index: number): void {
    const item = this.heap[index];
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIdx];
      if (item.priority >= parent.priority) break;
      this.heap[index] = parent;
      index = parentIdx;
    }
    this.heap[index] = item;
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const item = this.heap[index];

    while (true) {
      const leftChildIdx = 2 * index + 1;
      const rightChildIdx = 2 * index + 2;
      let swapIdx: number | null = null;
      let minPriority = item.priority;

      if (leftChildIdx < length) {
        if (this.heap[leftChildIdx].priority < minPriority) {
          minPriority = this.heap[leftChildIdx].priority;
          swapIdx = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        if (this.heap[rightChildIdx].priority < minPriority) {
          swapIdx = rightChildIdx;
        }
      }

      if (swapIdx === null) break;
      this.heap[index] = this.heap[swapIdx];
      index = swapIdx;
    }
    this.heap[index] = item;
  }
}

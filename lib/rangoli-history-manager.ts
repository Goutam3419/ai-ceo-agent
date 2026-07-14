/**
 * HISTORY MANAGER
 * ================
 * A small, reusable undo/redo stack — deliberately NOT tied to
 * Fabric.js or any specific editor. Works with any serializable
 * snapshot type <T> (e.g. a Fabric canvas.toJSON() object today,
 * a future Website Builder's block tree tomorrow).
 *
 * Usage pattern:
 *   const history = new HistoryManager<object>();
 *   history.reset(initialSnapshot);      // baseline, after first load
 *   history.push(newSnapshot);           // after every meaningful edit
 *   const prev = history.undo();         // returns snapshot to restore, or null
 *   const next = history.redo();         // returns snapshot to restore, or null
 */
export class HistoryManager<T> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];
  private current: T | null = null;
  private readonly maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  /** Sets the baseline snapshot without affecting undo/redo stacks. */
  reset(initial: T): void {
    this.undoStack = [];
    this.redoStack = [];
    this.current = initial;
  }

  /** Records a new snapshot after a meaningful edit. Clears the redo stack. */
  push(snapshot: T): void {
    if (this.current !== null) {
      this.undoStack.push(this.current);
      if (this.undoStack.length > this.maxSize) this.undoStack.shift();
    }
    this.current = snapshot;
    this.redoStack = [];
  }

  /** Moves one step back. Returns the snapshot to restore, or null if nothing to undo. */
  undo(): T | null {
    if (this.undoStack.length === 0) return null;
    const previous = this.undoStack.pop() as T;
    if (this.current !== null) this.redoStack.push(this.current);
    this.current = previous;
    return previous;
  }

  /** Moves one step forward. Returns the snapshot to restore, or null if nothing to redo. */
  redo(): T | null {
    if (this.redoStack.length === 0) return null;
    const next = this.redoStack.pop() as T;
    if (this.current !== null) this.undoStack.push(this.current);
    this.current = next;
    return next;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}

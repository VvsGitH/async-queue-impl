/* A task is a generic function that returns a Promise */
type Task<T> = () => Promise<T>;
/* onComplete is a callback that receive the result or the rejection of a task's promise */
type OnComplete<T> = (res: T | null, rej?: unknown) => void;
/* onCompleteMultiple is a callback that receive the results or the rejections of multiple tasks' promises */
type OnCompleteMultiple<T> = (res: T[], rej?: unknown[]) => void;

export class AsyncQueue<T> {
  public static readonly NO_TASKS_TO_PULL = "NO_TASKS_TO_PULL";

  /* The list of tasks in the queue */
  private tasks: Task<T>[] = [];
  /* The list of tasks that have been unqueued and are waiting to be executed */
  private executionQueue: { task: Task<T>; onComplete?: OnComplete<T> }[] = [];
  /* The max number of tasks that can be executed in parallel */
  private maxParallel: number = 1;
  /* The number of currently running tasks */
  private runningTasks: number = 0;

  constructor(maxParallel?: number) {
    if (maxParallel != null && maxParallel > 0) this.maxParallel = maxParallel;
  }

  /* Getters... */
  getTasks(): Task<T>[] {
    return [...this.tasks];
  }
  getTasksForExecution(): Task<T>[] {
    return this.executionQueue.map((task) => task.task);
  }
  getRunningTasksNum(): number {
    return this.runningTasks;
  }

  /**
   * Update max number of tasks that can be executed in parallel
   * If the new max is greater than the precedent, execute more pending tasks (if present)
   * @param maxParallel
   */
  updateMaxParallel(maxParallel: number) {
    if (this.maxParallel < maxParallel && this.executionQueue.length > 0) {
      const numOfAdditionalTasksToExec = Math.min(maxParallel - this.maxParallel, this.executionQueue.length);
      for (let i = 0; i < numOfAdditionalTasksToExec; i++) {
        this.executeNextQueuedTask();
      }
    }
    this.maxParallel = maxParallel;
  }

  /**
   * Add a task to the end of the queue
   * @param tasks
   */
  push(tasks: Task<T> | Task<T>[]): void {
    if (Array.isArray(tasks)) {
      this.tasks.push(...tasks);
    } else {
      this.tasks.push(tasks);
    }
  }

  /**
   * Remove the first task from the queue.
   * Removed tasks are executed automatically whenever possible.
   * @param onComplete cb executed when the task is completed.
   */
  pop(onComplete: OnComplete<T>): void {
    const task = this.tasks.shift();
    if (task != null) {
      this.addToExecutionQueue(task, onComplete);
    } else {
      onComplete(null, AsyncQueue.NO_TASKS_TO_PULL);
    }
  }

  /**
   * Remove every task from the queue.
   * Every task is added to the execution queue.
   * @param onComplete cb called when all tasks are completed.
   * @returns
   */
  drain(onComplete: OnCompleteMultiple<T>): void {
    if (this.tasks.length == 0) {
      onComplete([], []);
      return;
    }

    const results: T[] = [];
    const errors: unknown[] = [];

    for (const task of this.tasks) {
      this.addToExecutionQueue(task, (res, err) => {
        if (res) results.push(res);
        if (err) errors.push(err);
        if (this.executionQueue.length == 0 && this.runningTasks == 0) onComplete(results, errors);
      });
    }

    this.tasks = [];
  }

  /**
   * Add a task to the execution queue, together with its onComplete callback.
   * The execution queue is the list of tasks that are waiting to be executed.
   * @param task
   * @param onComplete
   */
  private addToExecutionQueue(task: Task<T>, onComplete: OnComplete<T>): void {
    this.executionQueue.push({ task, onComplete });

    if (this.runningTasks < this.maxParallel) {
      this.executeNextQueuedTask();
    }
  }

  /**
   * Execute the next task in the execution queue.
   * After the execution is complete, execute the next task in the queue automatically.
   */
  private executeNextQueuedTask(): void {
    const toExecute = this.executionQueue.shift();
    if (toExecute?.task != null) {
      console.log("RUNNING TASK");
      this.runningTasks++;

      let result: T | null = null;
      let error: unknown = null;

      toExecute
        .task()
        .then((res) => {
          console.log("TASK RESOLVED WITH RESULT:", res);
          result = res;
        })
        .catch((err) => {
          console.log("TASK REJECTED WITH ERROR:", err);
          error = err;
        })
        .finally(() => {
          this.runningTasks = Math.max(this.runningTasks - 1, 0);
          toExecute.onComplete?.(result, error);
          if (this.executionQueue.length > 0 && this.runningTasks < this.maxParallel) {
            this.executeNextQueuedTask();
          }
        });
    }
  }
}

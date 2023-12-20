type Task<T> = () => Promise<T>;

/**
 * Execute tasks in parallel
 * @param tasks
 * @param onComplete
 */
function executeBatchTasks<T>(tasks: Task<T>[], onComplete: (res: T[], rej: Error[]) => void): void {
  const results: T[] = [];
  const errors: Error[] = [];

  let completed = 0;
  for (const task of tasks) {
    task()
      .then((res) => {
        console.log("TASK RESOLVED WITH RESULT:", res);
        results.push(res);
      })
      .catch((err: Error) => {
        console.log("TASK REJECTED WITH ERROR:", err);
        errors.push(err);
      })
      .finally(() => {
        completed++;
        if (completed >= tasks.length) {
          onComplete(results, errors);
        }
      });
  }
}

/**
 * Create an async queue of tasks.
 * Tasks are grouped in batches. Tasks inside one batch are executed in parallel; batches are executed in series.
 * The queue completes when all task are settled.
 * @param tasks
 * @param maxWorkers
 * @param onComplete
 */
export function createQueue<T>(
  tasks: Task<T>[],
  maxWorkers: number = 4,
  onComplete: (res: T[], rej: Error[]) => void
): void {
  const numOfTasks = tasks.length;
  const numOfBatches = Math.ceil(numOfTasks / maxWorkers);

  const results: T[] = [];
  const errors: Error[] = [];
  let completed = 0;

  const executeBatch = (batch: number) => {
    const from = batch * maxWorkers;
    const to = Math.min(batch * maxWorkers + maxWorkers, tasks.length);
    console.log("RUNNING TASKS FROM ", from + 1, "TO", to);

    executeBatchTasks(tasks.slice(from, to), (res, err) => {
      results.push(...res);
      errors.push(...err);
      completed++;

      if (completed < numOfBatches) {
        executeBatch(completed);
      } else {
        onComplete(results, errors);
      }
    });
  };

  executeBatch(0);
}

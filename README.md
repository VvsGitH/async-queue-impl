# ASYNC QUEUE

Two implementations of an async queue in TS

- CreateQueue.ts  
  This is an utility to execute a list of N async operations in batches of K operations. The K operations in one batch are run in parallel; the N/K batches are run in series, one after the other.

- AsyncQueue.ts  
  This is a class to create a queue. You can push and pop async operations to/from the queue; popping a task executes the operation. You can also specify the number of async operations that can be executed in parallel.

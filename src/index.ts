/* eslint-disable @typescript-eslint/no-unused-vars */
import { AsyncQueue } from "./AsyncQueue.js";
import { createQueue } from "./CreateQueue.js";

function testCreateQueue(): void {
  createQueue<string>(
    [
      () => new Promise((res) => setTimeout(() => res("1"), 1000)),
      () => new Promise((res) => setTimeout(() => res("2"), 500)),
      () => new Promise((res) => setTimeout(() => res("3"), 600)),
      () => new Promise((_res, rej) => setTimeout(() => rej(new Error("4")), 700)),
      () => new Promise((_res, rej) => setTimeout(() => rej(new Error("5")), 800)),
      () => new Promise((res) => setTimeout(() => res("6"), 1200)),
      () => new Promise((res) => setTimeout(() => res("7"), 1500)),
      () => new Promise((res) => setTimeout(() => res("8"), 1100)),
      () => new Promise((_res, rej) => setTimeout(() => rej(new Error("9")), 200)),
      () => new Promise((res) => setTimeout(() => res("10"), 700))
    ],
    4,
    (res, err) => {
      console.log("QUEUE COMPLETED");
      console.log("RESPONSES:", res);
      console.log("ERRORS:", err);
    }
  );
}

function testAsyncQueue(): void {
  const aQueue = new AsyncQueue<string>(5);
  aQueue.push([
    () => new Promise((res) => setTimeout(() => res("1"), 1000)),
    () => new Promise((res) => setTimeout(() => res("2"), 500)),
    () => new Promise((res) => setTimeout(() => res("3"), 600)),
    () => new Promise((_res, rej) => setTimeout(() => rej(new Error("4")), 700)),
    () => new Promise((_res, rej) => setTimeout(() => rej(new Error("5")), 800)),
    () => new Promise((res) => setTimeout(() => res("6"), 1200)),
    () => new Promise((res) => setTimeout(() => res("7"), 1500)),
    () => new Promise((res) => setTimeout(() => res("8"), 1100)),
    () => new Promise((_res, rej) => setTimeout(() => rej(new Error("9")), 200)),
    () => new Promise((res) => setTimeout(() => res("10"), 700))
  ]);
  aQueue.pop((res, err) => console.log("RES", res, "ERR", err));
  aQueue.pop((res, err) => console.log("RES", res, "ERR", err));
  aQueue.drain((res, err) => console.log("RESPONSES", res, "ERRORS", err));
}

// testCreateQueue();
testAsyncQueue();

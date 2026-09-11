import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { extractSaveBlueprintsInWorker } from "../save-blueprint-worker";

class FakeWorker {
  static instances: FakeWorker[] = [];

  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  posted = false;
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage() {
    this.posted = true;
  }

  terminate() {
    this.terminated = true;
  }
}

const originalWorker = Object.getOwnPropertyDescriptor(globalThis, "Worker");

describe("save blueprint worker cancellation", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    Object.defineProperty(globalThis, "Worker", {
      configurable: true,
      value: FakeWorker,
      writable: true,
    });
  });

  afterEach(() => {
    if (originalWorker) Object.defineProperty(globalThis, "Worker", originalWorker);
    else Reflect.deleteProperty(globalThis, "Worker");
  });

  test("terminates active extraction when its signal aborts", async () => {
    const controller = new AbortController();
    const extraction = extractSaveBlueprintsInWorker(new Uint8Array([1, 2, 3]), controller.signal);
    const worker = FakeWorker.instances[0];

    expect(worker?.posted).toBe(true);
    controller.abort();

    await expect(extraction).rejects.toMatchObject({ name: "AbortError" });
    expect(worker?.terminated).toBe(true);
  });

  test("does not post work for an already-aborted signal", async () => {
    const controller = new AbortController();
    controller.abort();
    const extraction = extractSaveBlueprintsInWorker(new Uint8Array([1]), controller.signal);
    const worker = FakeWorker.instances[0];

    await expect(extraction).rejects.toMatchObject({ name: "AbortError" });
    expect(worker?.posted).toBe(false);
    expect(worker?.terminated).toBe(true);
  });
});

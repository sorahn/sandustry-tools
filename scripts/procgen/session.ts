import { existsSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import {
  SANDUSTRY_TEST_CDP_PORT,
  SANDUSTRY_TEST_HTTP_PORT,
  SANDUSTRY_TEST_VIEWPORT_HEIGHT,
  SANDUSTRY_TEST_VIEWPORT_WIDTH,
} from "../../packages/sandustry-mod-template/modkit/test/paths.ts";
import {
  formatRendererReadySnapshot,
  GAME_READY_POLL_MS,
  GAME_READY_TIMEOUT_MS,
  isRendererReady,
  pauseRendererSim,
  readRendererReadySnapshot,
} from "../../packages/sandustry-mod-template/modkit/test/readiness.ts";
import { toPageExpression } from "../../packages/sandustry-mod-template/modkit/test/serialize.ts";
import {
  startSandustryTestHost,
  stopSandustryTestHost,
} from "../../packages/sandustry-mod-template/modkit/test/host.ts";
import { readRendererTerrainRle, type CapturedTerrainPayload } from "./terrain.ts";

export function ensureChromeEnvironment(): void {
  if (
    !process.env.CHROME &&
    process.platform === "darwin" &&
    existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
  ) {
    process.env.CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }
}

type Pending = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class ProcgenCdpClient {
  private nextId = 1;
  private tail: Promise<unknown> = Promise.resolve();
  private readonly pending = new Map<number, Pending>();
  private readonly ws: WebSocket;
  private readonly timeoutMs: number;

  private constructor(ws: WebSocket, timeoutMs = 8000) {
    this.ws = ws;
    this.timeoutMs = timeoutMs;
    ws.addEventListener("message", (event) => this.onMessage(event));
    ws.addEventListener("close", () => this.rejectAll(new Error("CDP connection closed")));
  }

  static async connect(
    port = SANDUSTRY_TEST_CDP_PORT,
    timeoutMs = 8000,
  ): Promise<ProcgenCdpClient> {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!listRes.ok) throw new Error(`CDP /json/list failed: ${listRes.status}`);
    const targets = (await listRes.json()) as Array<{
      type: string;
      webSocketDebuggerUrl?: string;
      url?: string;
      title?: string;
    }>;
    const page = targets.find(
      (entry) =>
        entry.type === "page" &&
        typeof entry.webSocketDebuggerUrl === "string" &&
        (entry.url?.includes("127.0.0.1") || /Sandustry/i.test(entry.title ?? "")),
    );
    if (!page?.webSocketDebuggerUrl) throw new Error("No integration page found on CDP");

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("CDP WebSocket timeout")), timeoutMs);
      ws.addEventListener("open", () => {
        clearTimeout(timer);
        resolve();
      });
      ws.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error("CDP WebSocket connection error"));
      });
    });

    return new ProcgenCdpClient(ws, timeoutMs);
  }

  async send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const run = this.tail.then(() => {
      const id = this.nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(`CDP command timed out: ${method}`));
        }, this.timeoutMs);
        this.pending.set(id, { resolve, reject, timer });
        this.ws.send(JSON.stringify({ id, method, params }));
      });
    });
    this.tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async evaluate<T>(expression: string): Promise<T> {
    const details = (await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })) as {
      exceptionDetails?: { exception?: { description?: string }; text?: string };
      result?: { value?: unknown };
    };
    if (details.exceptionDetails) {
      throw new Error(
        details.exceptionDetails.exception?.description ||
          details.exceptionDetails.text ||
          "CDP exception",
      );
    }
    return details.result?.value as T;
  }

  async navigate(url: string): Promise<void> {
    await this.send("Page.navigate", { url });
  }

  async lockViewport(visible = false): Promise<void> {
    if (visible) return;
    await this.send("Emulation.setDeviceMetricsOverride", {
      width: SANDUSTRY_TEST_VIEWPORT_WIDTH,
      height: SANDUSTRY_TEST_VIEWPORT_HEIGHT,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }

  close(): void {
    this.ws.close();
  }

  private onMessage(event: MessageEvent): void {
    let msg: { id?: number; error?: { message?: string }; result?: unknown };
    try {
      msg = JSON.parse(String(event.data));
    } catch {
      return;
    }
    if (typeof msg.id !== "number") return;
    const pending = this.pending.get(msg.id);
    if (!pending) return;
    this.pending.delete(msg.id);
    clearTimeout(pending.timer);
    if (msg.error) {
      pending.reject(new Error(msg.error.message || "CDP error"));
      return;
    }
    pending.resolve(msg.result);
  }

  private rejectAll(error: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }
}

export class SandustryProcgenSession {
  private cdp: ProcgenCdpClient;
  private readonly origin: string;
  private readonly visible: boolean;

  private constructor(cdp: ProcgenCdpClient, origin: string, visible: boolean) {
    this.cdp = cdp;
    this.origin = origin;
    this.visible = visible;
  }

  static async start(options?: {
    initialSeed?: string;
    worldName?: string;
    visible?: boolean;
    timeoutMs?: number;
  }): Promise<SandustryProcgenSession> {
    ensureChromeEnvironment();
    const visible = options?.visible === true;
    const origin = `http://127.0.0.1:${SANDUSTRY_TEST_HTTP_PORT}`;

    // Start host using the template host launcher
    const startResult = await startSandustryTestHost({ visible, persist: true });
    if (!startResult.ok) {
      throw new Error(`Failed to start test host: ${startResult.reason}`);
    }

    const cdp = await ProcgenCdpClient.connect(SANDUSTRY_TEST_CDP_PORT);
    const session = new SandustryProcgenSession(cdp, origin, visible);

    if (options?.initialSeed) {
      await session.navigateToSeed(options.initialSeed, {
        worldName: options.worldName,
        timeoutMs: options.timeoutMs,
      });
    }

    return session;
  }

  async evaluate<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => TResult | Promise<TResult>,
    ...args: TArgs
  ): Promise<TResult> {
    return this.cdp.evaluate<TResult>(toPageExpression(fn, args));
  }

  async navigateToSeed(
    seed: string,
    options?: { worldName?: string; timeoutMs?: number },
  ): Promise<void> {
    const worldName = options?.worldName ?? "Procgen";
    const url = `${this.origin}/?new_game=true&seed=${encodeURIComponent(seed)}&name=${encodeURIComponent(worldName)}`;

    await this.cdp.navigate(url);

    const timeoutMs = options?.timeoutMs ?? GAME_READY_TIMEOUT_MS;
    const deadline = Date.now() + timeoutMs;
    let lastSnapshot = "no snapshot";

    while (Date.now() < deadline) {
      try {
        const snapshot = (await this.evaluate(readRendererReadySnapshot)) as ReturnType<
          typeof readRendererReadySnapshot
        >;
        lastSnapshot = formatRendererReadySnapshot(snapshot);
        if (isRendererReady(snapshot)) {
          await this.cdp.lockViewport(this.visible);
          await this.evaluate(pauseRendererSim);
          return;
        }
      } catch {
        // Retry during page reload navigation
        try {
          this.cdp.close();
          this.cdp = await ProcgenCdpClient.connect(SANDUSTRY_TEST_CDP_PORT);
        } catch {
          /* wait for next poll */
        }
      }
      await sleep(GAME_READY_POLL_MS);
    }

    throw new Error(`Seeded world generation timed out (${seed}): ${lastSnapshot}`);
  }

  async captureTerrain(): Promise<CapturedTerrainPayload> {
    return this.evaluate(readRendererTerrainRle);
  }

  async close(): Promise<void> {
    this.cdp.close();
    await stopSandustryTestHost();
  }
}

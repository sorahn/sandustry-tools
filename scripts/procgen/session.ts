import { type ChildProcess } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { extname, join, normalize, relative, resolve, sep } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import * as esbuild from "esbuild";
import {
  extractedDistDir,
  sandustryTestMockPath,
  sandustryTestModsDir,
  sandustryTestUserDataDir,
  SANDUSTRY_TEST_CDP_PORT,
  SANDUSTRY_TEST_HTTP_PORT,
  SANDUSTRY_TEST_VIEWPORT_HEIGHT,
  SANDUSTRY_TEST_VIEWPORT_WIDTH,
} from "../../packages/sandustry-mod-template/modkit/test/paths.ts";
import {
  resolveChrome,
  spawnChrome,
  stopChild,
} from "../../packages/sandustry-mod-template/modkit/test/chrome.ts";
import { buildPatchedDistSources } from "../../packages/sandustry-mod-template/modkit/test/patched-dist.ts";
import { rewriteAssetJoinForHttp } from "../../packages/sandustry-mod-template/modkit/test/asset-join.ts";
import { readRendererTerrainRle, type CapturedTerrainPayload } from "./terrain.ts";

export const GAME_READY_TIMEOUT_MS = 120_000;
export const GAME_READY_POLL_MS = 500;

export function ensureChromeEnvironment(): void {
  if (
    !process.env.CHROME &&
    process.platform === "darwin" &&
    existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
  ) {
    process.env.CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".glsl": "text/plain",
};

const ISOLATION_HEADERS = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cache-Control": "no-store",
  Connection: "close",
};

export type RendererReadySnapshot = {
  api: boolean;
  scene: number | null;
  game: number | null;
  gameReady: boolean;
  loading: boolean;
};

export function isRendererReady(snapshot: RendererReadySnapshot): boolean {
  // During new game procgen, Sandustry enters Scene.Intro (2) or Scene.Deploy (3)
  // before transitioning to Scene.Game (4). The terrain simulation is fully populated
  // when gameReady is true and the loading overlay has been removed.
  return (
    snapshot.api &&
    snapshot.game != null &&
    (snapshot.scene === snapshot.game || snapshot.scene === 2 || snapshot.scene === 3) &&
    snapshot.gameReady &&
    !snapshot.loading
  );
}

export function readRendererReadySnapshot(): RendererReadySnapshot {
  const sk = (globalThis as Record<string, unknown>).sandkit as Record<string, unknown> | undefined;
  const enums = sk?.enums as Record<string, unknown> | undefined;
  const sceneEnums = enums?.Scene as Record<string, unknown> | undefined;
  const engine = sk?.engine as Record<string, unknown> | undefined;
  const state = engine?.state as Record<string, unknown> | undefined;
  const store = state?.store as Record<string, unknown> | undefined;
  const scene = store?.scene as Record<string, unknown> | undefined;
  const skState = state?.sandkit as Record<string, unknown> | undefined;

  return {
    api: Boolean(sk?.api),
    scene: typeof scene?.active === "number" ? scene.active : null,
    game: typeof sceneEnums?.Game === "number" ? (sceneEnums.Game as number) : null,
    gameReady: Boolean(skState?.gameReady),
    loading: Boolean(document.getElementById("loading")),
  };
}

export function formatRendererReadySnapshot(snapshot: RendererReadySnapshot): string {
  try {
    return JSON.stringify(snapshot);
  } catch {
    return String(snapshot);
  }
}

export function pauseRendererSim(): void {
  const sk = (globalThis as Record<string, unknown>).sandkit as Record<string, unknown> | undefined;
  const engine = sk?.engine as Record<string, unknown> | undefined;
  const state = engine?.state as Record<string, unknown> | undefined;
  const session = state?.session as Record<string, unknown> | undefined;
  if (session) session.paused = true;
}

export function toPageExpression<TArgs extends unknown[]>(
  fn: (...args: TArgs) => unknown,
  args?: TArgs,
): string {
  const callArgs = (args ?? []).map((arg) => JSON.stringify(arg)).join(", ");
  return `(${fn.toString()})(${callArgs})`;
}

function safeJoin(root: string, urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split("?")[0] ?? "");
  const rel = decoded.replace(/^\/+/, "").replaceAll("/", sep);
  const full = normalize(join(root, rel));
  const relToRoot = relative(root, full);
  if (!relToRoot || relToRoot.startsWith("..") || relToRoot.startsWith(sep)) return null;
  return full;
}

function wrapIndexHtml(distDir: string): string {
  const html = readFileSync(join(distDir, "index.html"), "utf8");
  const injected = '<script src="/electron-mock.js"></script>\n    ';
  if (html.includes("/electron-mock.js")) return html;
  return html.replace(
    '<script type="module" src="js/bundle.js"></script>',
    `${injected}<script type="module" src="js/bundle.js"></script>`,
  );
}

async function buildProcgenElectronMock(): Promise<void> {
  const entry = resolve("packages/sandustry-mod-template/modkit/test/electron-mock.ts");
  mkdirSync(sandustryTestUserDataDir(), { recursive: true });
  await esbuild.build({
    bundle: true,
    entryPoints: [entry],
    format: "iife",
    outfile: sandustryTestMockPath(),
    platform: "browser",
    target: "es2020",
    define: {
      __TEST_HOST_SETTINGS__: JSON.stringify({
        settingsVersion: 12,
        windowMode: "windowed",
        autosaveInterval: 0,
        locale: "en",
        customMaps: { showCustomMaps: true },
        sound: { masterVolume: 0, sfxVolume: 0, musicVolume: 0 },
      }),
      __TEST_HOST_LAST_PLAYED__: JSON.stringify(""),
      __TEST_HOST_SAVE_IDS__: JSON.stringify([]),
      __TEST_HOST_SAVES__: JSON.stringify({}),
    },
  });
}

function startProcgenHttpServer(
  distDir: string,
): Promise<{ server: ReturnType<typeof createServer>; close: () => Promise<void> }> {
  const patchedJs = buildPatchedDistSources(distDir);

  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const url = request.url ?? "/";
    try {
      if (url === "/" || url.startsWith("/?")) {
        response.writeHead(200, {
          ...ISOLATION_HEADERS,
          "Content-Type": "text/html; charset=utf-8",
        });
        response.end(wrapIndexHtml(distDir));
        return;
      }
      if (url === "/electron-mock.js" || url.startsWith("/electron-mock.js?")) {
        response.writeHead(200, {
          ...ISOLATION_HEADERS,
          "Content-Type": "application/javascript; charset=utf-8",
        });
        response.end(readFileSync(sandustryTestMockPath()));
        return;
      }
      if (url.startsWith("/__host/mods")) {
        response.writeHead(200, { ...ISOLATION_HEADERS, "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            ok: true,
            data: {
              mods: [
                {
                  manifest: {
                    manifestVersion: 1,
                    id: "sandustry-test.harness",
                    name: "sandustry-test harness",
                    version: "0.0.1",
                    apiVersion: 1,
                    gameVersion: { minimum: "0.5.6", maximum: "0.5.6" },
                    entry: "main.js",
                    dependencies: [],
                    loadOrder: 0,
                  },
                  entrySource: "globalThis.sandkit = sandkit;\n",
                  workerSource: null,
                  rootUrl: `http://127.0.0.1:${SANDUSTRY_TEST_HTTP_PORT}/`,
                  workshop: {
                    itemId: null,
                    folder: "/sandustry-test/mods/sandustry-test.harness",
                    discoveredVia: ["local"],
                  },
                },
              ],
              diagnostics: [],
            },
            error: null,
          }),
        );
        return;
      }
      if (url.startsWith("/__host/saves")) {
        response.writeHead(200, { ...ISOLATION_HEADERS, "Content-Type": "application/json" });
        response.end("[]\n");
        return;
      }

      const pathOnly = url.split("?")[0] ?? "";
      if (pathOnly === "/js/bundle.js") {
        const raw =
          patchedJs.get("js/bundle.js") ?? readFileSync(join(distDir, "js", "bundle.js"), "utf8");
        response.writeHead(200, {
          ...ISOLATION_HEADERS,
          "Content-Type": "application/javascript; charset=utf-8",
        });
        response.end(rewriteAssetJoinForHttp(raw));
        return;
      }
      if (pathOnly.startsWith("/js/") && patchedJs.has(pathOnly.slice(1))) {
        response.writeHead(200, {
          ...ISOLATION_HEADERS,
          "Content-Type": "application/javascript; charset=utf-8",
        });
        response.end(patchedJs.get(pathOnly.slice(1)) ?? "");
        return;
      }

      // Static files
      let filePath: string | null = null;
      if (pathOnly.startsWith("/mods/")) {
        const live = safeJoin(sandustryTestModsDir(), pathOnly.slice("/mods".length));
        if (live && existsSync(live)) filePath = live;
        else {
          const vanilla = safeJoin(distDir, pathOnly);
          if (vanilla && existsSync(vanilla)) filePath = vanilla;
        }
      } else {
        const distFile = safeJoin(distDir, pathOnly);
        if (distFile && existsSync(distFile)) filePath = distFile;
      }

      if (filePath) {
        const type = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
        response.writeHead(200, { ...ISOLATION_HEADERS, "Content-Type": type });
        response.end(readFileSync(filePath));
        return;
      }

      response.writeHead(404, { ...ISOLATION_HEADERS, "Content-Type": "text/plain" });
      response.end("Not found");
    } catch (err) {
      response.writeHead(500, { ...ISOLATION_HEADERS, "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
  });

  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(SANDUSTRY_TEST_HTTP_PORT, "127.0.0.1", () => {
      resolvePromise({
        server,
        close: () =>
          new Promise<void>((resolveClose) => {
            server.close(() => resolveClose());
          }),
      });
    });
  });
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
  private readonly chromeProcess: ChildProcess;
  private readonly serverClose: () => Promise<void>;

  private constructor(
    cdp: ProcgenCdpClient,
    origin: string,
    visible: boolean,
    chromeProcess: ChildProcess,
    serverClose: () => Promise<void>,
  ) {
    this.cdp = cdp;
    this.origin = origin;
    this.visible = visible;
    this.chromeProcess = chromeProcess;
    this.serverClose = serverClose;
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

    const chrome = resolveChrome();
    if (!chrome) {
      throw new Error("Chrome/Chromium not found. Install Google Chrome or set CHROME.");
    }
    const distDir = extractedDistDir();
    if (!distDir) {
      throw new Error("Game assets not found at sandustry/source/dist. Run setup.");
    }

    await buildProcgenElectronMock();
    const httpHost = await startProcgenHttpServer(distDir);

    const initialSeed = options?.initialSeed ?? "procgen-init";
    const initialName = options?.worldName ?? "Procgen";
    const launchUrl = `${origin}/?new_game=true&seed=${encodeURIComponent(initialSeed)}&name=${encodeURIComponent(initialName)}`;

    const child = spawnChrome(chrome, launchUrl, visible);

    let cdp: ProcgenCdpClient | undefined;
    const connectDeadline = Date.now() + 15_000;
    while (Date.now() < connectDeadline) {
      try {
        cdp = await ProcgenCdpClient.connect(SANDUSTRY_TEST_CDP_PORT);
        break;
      } catch {
        await sleep(500);
      }
    }

    if (!cdp) {
      stopChild(child);
      await httpHost.close();
      throw new Error("Failed to connect to Chromium CDP on port " + SANDUSTRY_TEST_CDP_PORT);
    }

    const session = new SandustryProcgenSession(cdp, origin, visible, child, httpHost.close);

    // Wait for the initial world to finish generation and freeze
    await session.waitForReady(options?.timeoutMs);

    return session;
  }

  async evaluate<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => TResult | Promise<TResult>,
    ...args: TArgs
  ): Promise<TResult> {
    return this.cdp.evaluate<TResult>(toPageExpression(fn, args));
  }

  async waitForReady(timeoutMs = GAME_READY_TIMEOUT_MS): Promise<void> {
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
      } catch (error) {
        lastSnapshot = error instanceof Error ? error.message : String(error);
        if (lastSnapshot.includes("closed") || lastSnapshot.includes("timeout")) {
          try {
            this.cdp.close();
            this.cdp = await ProcgenCdpClient.connect(SANDUSTRY_TEST_CDP_PORT);
          } catch {
            /* wait for next poll */
          }
        }
      }
      await sleep(GAME_READY_POLL_MS);
    }

    throw new Error(`Seeded world generation timed out: ${lastSnapshot}`);
  }

  async navigateToSeed(
    seed: string,
    options?: { worldName?: string; timeoutMs?: number },
  ): Promise<void> {
    const worldName = options?.worldName ?? "Procgen";
    const url = `${this.origin}/?new_game=true&seed=${encodeURIComponent(seed)}&name=${encodeURIComponent(worldName)}`;

    await this.cdp.navigate(url);
    await sleep(500);
    await this.waitForReady(options?.timeoutMs);
  }

  async captureTerrain(): Promise<CapturedTerrainPayload> {
    return this.evaluate(readRendererTerrainRle);
  }

  async close(): Promise<void> {
    try {
      this.cdp.close();
    } catch {
      /* ignore */
    }
    stopChild(this.chromeProcess);
    await this.serverClose();
  }
}

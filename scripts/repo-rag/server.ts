import path from "node:path";

const root = path.resolve(import.meta.dir, "../..");
const indexer = path.join(root, "scripts/repo-rag/index.ts");
const protocolVersion = "2025-06-18";

type JsonRpcRequest = {
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
};

const tools = [
  {
    name: "search_code",
    description:
      "Search indexed Sandustry code, documentation, runtime captures, and official API docs.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "number", minimum: 1, maximum: 20 } },
      required: ["query"],
    },
  },
  {
    name: "find_symbol",
    description: "Find an indexed Sandustry API, function, type, structure, or other symbol.",
    inputSchema: {
      type: "object",
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
    },
  },
  {
    name: "search_decisions",
    description: "Search repository plans, notes, and durable design decisions.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "index_status",
    description: "Report local RAG index counts, commit freshness, and dirty working-tree files.",
    inputSchema: { type: "object", properties: {} },
  },
];

function runIndexer(command: string, ...args: string[]) {
  const result = Bun.spawnSync([process.execPath, indexer, command, ...args], { cwd: root });
  if (result.exitCode !== 0) {
    throw new Error(
      new TextDecoder().decode(result.stderr).trim() || `indexer exited with ${result.exitCode}`,
    );
  }
  return JSON.parse(new TextDecoder().decode(result.stdout));
}

function freshness(status: {
  currentCommit: string;
  repository?: { commit_sha: string };
  dirtyFiles?: number;
}) {
  if (!status.repository) return "unavailable";
  if (status.dirtyFiles) return "dirty";
  return status.repository.commit_sha === status.currentCommit ? "current" : "stale";
}

function result(content: unknown, structuredContent = content) {
  return {
    content: [{ type: "text", text: JSON.stringify(content, null, 2) }],
    structuredContent,
  };
}

function callTool(name: string, args: Record<string, unknown>) {
  if (name === "index_status") return result(runIndexer("status"));
  const status = runIndexer("status") as {
    currentCommit: string;
    repository?: { commit_sha: string };
    dirtyFiles?: number;
  };
  if (name === "search_code" || name === "find_symbol" || name === "search_decisions") {
    const query = String(args.query ?? args.symbol ?? "").trim();
    if (!query) throw new Error(`${name} requires a non-empty query`);
    const response = runIndexer("search", query) as {
      query: string;
      results: Array<Record<string, unknown>>;
    };
    let matches = response.results;
    if (name === "search_decisions") {
      matches = matches.filter((match) => {
        const sourcePath = String(match.path ?? "");
        return sourcePath.startsWith("README") || sourcePath === "AGENTS.md";
      });
    }
    const limit = Math.min(Math.max(Number(args.limit ?? 8), 1), 20);
    const overallFreshness = freshness(status);
    return result({
      repository: "sandustry-tools",
      query,
      indexedCommit: status.repository?.commit_sha ?? null,
      freshness: overallFreshness,
      results: matches.slice(0, limit).map((match) => {
        const matchPath = String(match.path ?? "");
        const external = matchPath.startsWith("external/official-sandkit-docs#");
        return {
          ...match,
          freshness: overallFreshness,
          ...(external
            ? {
                sourceUrl: "https://sandustry.com/sandkit.html",
                anchor: matchPath.split("#")[1] ?? null,
              }
            : {}),
        };
      }),
    });
  }
  throw new Error(`unknown tool: ${name}`);
}

function respond(id: string | number, response: unknown) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result: response })}\n`);
}

function respondError(id: string | number, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  process.stdout.write(
    `${JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32000, message } })}\n`,
  );
}

async function handle(request: JsonRpcRequest) {
  if (
    request.method === "notifications/initialized" ||
    request.method === "notifications/cancelled"
  )
    return;
  if (request.method === "initialize") {
    return {
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "sandustry-repo-rag", version: "0.1.0" },
    };
  }
  if (request.method === "ping") return {};
  if (request.method === "tools/list") return { tools };
  if (request.method === "tools/call") {
    const params = request.params ?? {};
    return callTool(String(params.name), (params.arguments ?? {}) as Record<string, unknown>);
  }
  throw new Error(`method not found: ${request.method}`);
}

let buffer = "";
for await (const chunk of Bun.stdin.stream()) {
  buffer += new TextDecoder().decode(chunk);
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";
  for (const line of lines) {
    if (!line.trim()) continue;
    let request: JsonRpcRequest;
    try {
      request = JSON.parse(line);
      if (request.id === undefined) {
        await handle(request);
      } else {
        try {
          respond(request.id, await handle(request));
        } catch (error) {
          respondError(request.id, error);
        }
      }
    } catch (error) {
      console.error("invalid RAG MCP request", error);
    }
  }
}

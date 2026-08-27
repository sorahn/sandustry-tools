import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { readExternalCache, refreshExternal } from "./external";

type Source = {
  id: string;
  authority: string;
  include?: string[];
  exclude?: string[];
  type?: string;
  enabled?: boolean;
  url?: string;
};

type Config = {
  repository: string;
  root: string;
  sources: Source[];
  globalExclude: string[];
};

type FileRecord = {
  absolutePath: string;
  relativePath: string;
  sourceId: string;
  authority: string;
};

const root = path.resolve(import.meta.dir, "../..");
const configPath = path.join(root, "scripts/repo-rag/corpus-config.json");
const databasePath = path.join(root, ".repo-rag/index.sqlite");
const maxFileBytes = 512_000;
const chunkLines = 120;
const overlapLines = 20;

const config = (await Bun.file(configPath).json()) as Config;

function runGit(args: string[]) {
  const result = Bun.spawnSync(["git", ...args], { cwd: root });
  return new TextDecoder().decode(result.stdout).trim();
}

function hash(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function isExcluded(relativePath: string, patterns: string[]) {
  return patterns.some((pattern) => new Bun.Glob(pattern).match(relativePath));
}

async function discoverFiles(): Promise<FileRecord[]> {
  const records = new Map<string, FileRecord>();

  for (const source of config.sources) {
    if (source.type === "external-html" || source.enabled === false) continue;
    for (const pattern of source.include ?? []) {
      const glob = new Bun.Glob(pattern);
      for await (const relativePath of glob.scan({ cwd: root, onlyFiles: true, dot: true })) {
        const normalized = relativePath.replaceAll(path.sep, "/");
        if (isExcluded(normalized, [...config.globalExclude, ...(source.exclude ?? [])])) continue;
        records.set(normalized, {
          absolutePath: path.join(root, normalized),
          relativePath: normalized,
          sourceId: source.id,
          authority: source.authority,
        });
      }
    }
  }

  return [...records.values()].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function chunkFile(relativePath: string, content: string) {
  const lines = content.split("\n");
  const chunks: Array<{ startLine: number; endLine: number; type: string; content: string }> = [];
  const extension = path.extname(relativePath).toLowerCase();
  const defaultType = extension === ".md" || extension === ".txt" ? "documentation" : "module";

  for (let start = 0; start < lines.length; start += chunkLines - overlapLines) {
    const end = Math.min(lines.length, start + chunkLines);
    const section = lines.slice(start, end).join("\n").trim();
    if (!section) continue;
    const heading = section.match(/^#{1,6}\s+(.+)$/m);
    chunks.push({
      startLine: start + 1,
      endLine: end,
      type: heading ? "documentation-section" : defaultType,
      content: section,
    });
    if (end === lines.length) break;
  }
  return chunks;
}

function openDatabase() {
  const database = new Database(databasePath, { create: true });
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS repository (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      root TEXT NOT NULL,
      branch TEXT NOT NULL,
      commit_sha TEXT NOT NULL,
      indexed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL UNIQUE,
      source_id TEXT NOT NULL,
      authority TEXT NOT NULL,
      language TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      byte_length INTEGER NOT NULL,
      indexed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      start_line INTEGER NOT NULL,
      end_line INTEGER NOT NULL,
      chunk_type TEXT NOT NULL,
      content TEXT NOT NULL
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
      content,
      path UNINDEXED,
      authority UNINDEXED,
      start_line UNINDEXED,
      end_line UNINDEXED,
      chunk_type UNINDEXED,
      document_id UNINDEXED,
      chunk_id UNINDEXED
    );
  `);
  return database;
}

async function indexFiles(mode: "all" | "changed") {
  await mkdir(path.dirname(databasePath), { recursive: true });
  const database = openDatabase();
  const files = await discoverFiles();
  const branch = runGit(["branch", "--show-current"]);
  const commitSha = runGit(["rev-parse", "HEAD"]);
  const indexedAt = new Date().toISOString();
  const repositoryId = hash(`${config.repository}:${root}`).slice(0, 24);
  const existing = database
    .query("SELECT path, content_hash, source_id FROM documents")
    .all() as Array<{
    path: string;
    content_hash: string;
    source_id: string;
  }>;
  const existingHashes = new Map(existing.map((row) => [row.path, row.content_hash]));
  const seen = new Set<string>();
  let indexed = 0;
  let unchanged = 0;
  let skipped = 0;

  database.exec("BEGIN");
  try {
    database
      .query(
        `INSERT INTO repository (id, name, root, branch, commit_sha, indexed_at)
         VALUES ($id, $name, $root, $branch, $commit, $indexed)
         ON CONFLICT(id) DO UPDATE SET name=$name, root=$root, branch=$branch,
         commit_sha=$commit, indexed_at=$indexed`,
      )
      .run({
        $id: repositoryId,
        $name: config.repository,
        $root: root,
        $branch: branch,
        $commit: commitSha,
        $indexed: indexedAt,
      });

    for (const file of files) {
      seen.add(file.relativePath);
      let content: string;
      try {
        const bytes = await readFile(file.absolutePath);
        if (bytes.byteLength > maxFileBytes || bytes.includes(0)) {
          skipped++;
          continue;
        }
        content = bytes.toString("utf8");
      } catch {
        skipped++;
        continue;
      }

      const contentHash = hash(content);
      if (mode === "changed" && existingHashes.get(file.relativePath) === contentHash) {
        unchanged++;
        continue;
      }

      const documentId = hash(`${config.repository}:${file.relativePath}`).slice(0, 32);
      database
        .query("DELETE FROM chunks_fts WHERE document_id = $document")
        .run({ $document: documentId });
      database
        .query("DELETE FROM chunks WHERE document_id = $document")
        .run({ $document: documentId });
      database
        .query(
          `INSERT INTO documents (id, path, source_id, authority, language, content_hash, byte_length, indexed_at)
           VALUES ($id, $path, $source, $authority, $language, $hash, $bytes, $indexed)
           ON CONFLICT(path) DO UPDATE SET source_id=$source, authority=$authority,
           language=$language, content_hash=$hash, byte_length=$bytes, indexed_at=$indexed`,
        )
        .run({
          $id: documentId,
          $path: file.relativePath,
          $source: file.sourceId,
          $authority: file.authority,
          $language: path.extname(file.relativePath).slice(1) || "text",
          $hash: contentHash,
          $bytes: Buffer.byteLength(content),
          $indexed: indexedAt,
        });

      for (const chunk of chunkFile(file.relativePath, content)) {
        const chunkId = hash(
          `${documentId}:${chunk.startLine}:${chunk.endLine}:${contentHash}`,
        ).slice(0, 40);
        database
          .query(
            `INSERT INTO chunks (id, document_id, start_line, end_line, chunk_type, content)
             VALUES ($id, $document, $start, $end, $type, $content)`,
          )
          .run({
            $id: chunkId,
            $document: documentId,
            $start: chunk.startLine,
            $end: chunk.endLine,
            $type: chunk.type,
            $content: chunk.content,
          });
        database
          .query(
            `INSERT INTO chunks_fts (content, path, authority, start_line, end_line, chunk_type, document_id, chunk_id)
             VALUES ($content, $path, $authority, $start, $end, $type, $document, $id)`,
          )
          .run({
            $content: chunk.content,
            $path: file.relativePath,
            $authority: file.authority,
            $start: chunk.startLine,
            $end: chunk.endLine,
            $type: chunk.type,
            $document: documentId,
            $id: chunkId,
          });
      }
      indexed++;
    }

    for (const row of existing) {
      if (row.source_id === "official-sandkit-docs" || seen.has(row.path)) continue;
      const document = database
        .query("SELECT id FROM documents WHERE path = $path")
        .get({ $path: row.path }) as { id?: string } | null;
      if (!document?.id) continue;
      database
        .query("DELETE FROM chunks_fts WHERE document_id = $document")
        .run({ $document: document.id });
      database
        .query("DELETE FROM chunks WHERE document_id = $document")
        .run({ $document: document.id });
      database.query("DELETE FROM documents WHERE id = $document").run({ $document: document.id });
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  console.log(
    JSON.stringify(
      {
        mode,
        repository: config.repository,
        branch,
        commitSha,
        filesDiscovered: files.length,
        indexed,
        unchanged,
        skipped,
        indexedAt,
      },
      null,
      2,
    ),
  );
  database.close();
}

async function indexExternal() {
  const cached = await readExternalCache(root);
  if (!cached) return;
  const source = config.sources.find((entry) => entry.id === "official-sandkit-docs");
  if (!source?.enabled || !source.url) return;
  const database = openDatabase();
  for (const statement of [
    "ALTER TABLE documents ADD COLUMN source_url TEXT",
    "ALTER TABLE chunks ADD COLUMN source_url TEXT",
    "ALTER TABLE chunks ADD COLUMN anchor TEXT",
  ]) {
    try {
      database.exec(statement);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("duplicate column name"))
        throw error;
    }
  }
  const documentId = hash(`${config.repository}:external:${source.id}`).slice(0, 32);
  const documentPath = `external/${source.id}`;
  const indexedAt = new Date().toISOString();
  database.exec("BEGIN");
  try {
    database
      .query("DELETE FROM chunks_fts WHERE document_id = $document")
      .run({ $document: documentId });
    database
      .query("DELETE FROM chunks WHERE document_id = $document")
      .run({ $document: documentId });
    database.query("DELETE FROM documents WHERE id = $document").run({ $document: documentId });
    database
      .query(
        `INSERT INTO documents (id, path, source_id, authority, language, content_hash, byte_length, indexed_at, source_url)
       VALUES ($id, $path, $source, $authority, 'html', $hash, $bytes, $indexed, $url)`,
      )
      .run({
        $id: documentId,
        $path: documentPath,
        $source: source.id,
        $authority: source.authority,
        $hash: cached.metadata.contentHash,
        $bytes: Buffer.byteLength(cached.html),
        $indexed: indexedAt,
        $url: source.url,
      });
    for (const [index, chunk] of cached.chunks.entries()) {
      const chunkId = hash(`${documentId}:${index}:${chunk.anchor}:${chunk.content}`).slice(0, 40);
      database
        .query(
          `INSERT INTO chunks (id, document_id, start_line, end_line, chunk_type, content, source_url, anchor)
         VALUES ($id, $document, 0, 0, $type, $content, $url, $anchor)`,
        )
        .run({
          $id: chunkId,
          $document: documentId,
          $type: chunk.type,
          $content: chunk.content,
          $url: source.url,
          $anchor: chunk.anchor,
        });
      database
        .query(
          `INSERT INTO chunks_fts (content, path, authority, start_line, end_line, chunk_type, document_id, chunk_id)
         VALUES ($content, $path, $authority, 0, 0, $type, $document, $id)`,
        )
        .run({
          $content: chunk.content,
          $path: `${documentPath}#${chunk.anchor}`,
          $authority: source.authority,
          $type: chunk.type,
          $document: documentId,
          $id: chunkId,
        });
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    database.close();
  }
  console.log(
    JSON.stringify(
      { source: source.id, chunks: cached.chunks.length, fetchedAt: cached.metadata.fetchedAt },
      null,
      2,
    ),
  );
}

function status() {
  const database = openDatabase();
  const repository = database.query("SELECT * FROM repository LIMIT 1").get();
  const documents = database.query("SELECT COUNT(*) AS count FROM documents").get() as {
    count: number;
  };
  const chunks = database.query("SELECT COUNT(*) AS count FROM chunks").get() as { count: number };
  const currentCommit = runGit(["rev-parse", "HEAD"]);
  const dirtyFiles = runGit(["status", "--porcelain"]).split("\n").filter(Boolean);
  console.log(
    JSON.stringify(
      {
        repository,
        documents: documents.count,
        chunks: chunks.count,
        currentCommit,
        dirtyFiles: dirtyFiles.length,
        dirtyPaths: dirtyFiles.map((entry) => entry.slice(3).trim()),
        commitMatches:
          repository && (repository as { commit_sha: string }).commit_sha === currentCommit,
      },
      null,
      2,
    ),
  );
  database.close();
}

function search(query: string) {
  const database = openDatabase();
  const match = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `"${term.replaceAll('"', '""')}"*`)
    .join(" AND ");
  if (!match) throw new Error("search query cannot be empty");
  const rows = database
    .query(
      `SELECT path, authority, start_line AS startLine, end_line AS endLine,
              chunk_type AS chunkType, content, bm25(chunks_fts) AS score
       FROM chunks_fts WHERE chunks_fts MATCH $query ORDER BY score LIMIT 8`,
    )
    .all({ $query: match });
  console.log(JSON.stringify({ query, results: rows }, null, 2));
  database.close();
}

const [command = "help", argument] = process.argv.slice(2);
if (command === "index") {
  await indexFiles(argument === "--changed" ? "changed" : "all");
  await indexExternal();
} else if (command === "external") {
  const source = config.sources.find((entry) => entry.id === "official-sandkit-docs");
  if (!source?.url) throw new Error("official Sandkit docs source is not configured");
  if (argument !== "refresh") throw new Error("Usage: ... external refresh");
  console.log(JSON.stringify(await refreshExternal(root, source.url), null, 2));
} else if (command === "status") status();
else if (command === "search") search(argument ?? "");
else {
  console.log(
    "Usage: bun scripts/repo-rag/index.ts <index [--all|--changed]|external refresh|status|search <query>>",
  );
  process.exitCode = command === "help" ? 0 : 1;
}

# Sandustry repository RAG index

This is a local developer index for Sandustry code, documentation, runtime
captures, and research notes. The SQLite database is generated under the
ignored `.repo-rag/` directory and is not release or mod content.

Build or refresh the local index:

```sh
npm run repo-rag:index
npm run repo-rag:changed
npm run repo-rag:refresh-docs
```

Inspect freshness and counts:

```sh
npm run repo-rag:status
```

Search the lexical index:

```sh
npm run repo-rag:search -- "api.ui.inject"
```

Start the local stdio MCP server:

```sh
npm run repo-rag:mcp
```

It exposes `search_code`, `find_symbol`, `search_decisions`, and
`index_status`. Configure a local MCP client to launch that command from the
repository root. Search results are discovery aids; verify edits and runtime
claims against the current working tree, official documentation, or a live
Sandustry session as appropriate.

For Codex, register the server once from a shell in the repository:

```sh
codex mcp add sandustry-repo-rag -- \
  /Users/daryl/github/sandustry-tools/node_modules/.bin/bun \
  /Users/daryl/github/sandustry-tools/scripts/repo-rag/server.ts
```

Inspect it with `codex mcp get sandustry-repo-rag` and remove it with
`codex mcp remove sandustry-repo-rag`. Start a new Codex session after adding
or removing a server so the client reloads its MCP inventory.

The corpus is controlled by `corpus-config.json`. `index --changed` compares
content hashes and is safe to run repeatedly. `repo-rag:refresh-docs`
conditionally fetches the official Sandkit HTML into the ignored
`.repo-rag/cache/` directory. Every changed response also preserves a
timestamped HTML and metadata snapshot in
`.repo-rag/cache/official-sandkit-snapshots/`; unchanged content hashes do not
create duplicates, including `304` responses. A subsequent index run extracts
heading sections, API signatures, and code examples. Cache metadata keeps the
URL, fetch time, content hash, and conditional HTTP headers; if the site is
unavailable, the last successful cache remains usable.

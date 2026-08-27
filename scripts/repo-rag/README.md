# Sandustry repository RAG index

This is a local developer index for Sandustry code, documentation, runtime
captures, and research notes. The SQLite database is generated under the
ignored `.repo-rag/` directory and is not release or mod content.

Build or refresh the local index:

```sh
npm run repo-rag:index
npm run repo-rag:changed
```

Inspect freshness and counts:

```sh
npm run repo-rag:status
```

Search the lexical index:

```sh
npm run repo-rag:search -- "api.ui.inject"
```

The corpus is controlled by `corpus-config.json`. `index --changed` compares
content hashes and is safe to run repeatedly. The current implementation
indexes local repository files only; the official Sandkit HTML source is
configured but external fetching and MCP transport are later phases.

Indexed snippets are discovery aids. Always verify edits and runtime claims
against the current working tree, official documentation, or a live Sandustry
session as appropriate.

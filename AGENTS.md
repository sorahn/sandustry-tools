# Agent Notes

## Source of truth

- The Obsidian Kanban board at Boards/Sandustry Board.md owns active
  priorities, status, plans, and completion state.
- Research notes under Sandustry/Notes/ are living technical context.

Create or update a board card for work involving multiple implementation areas,
reverse engineering, compatibility risk, or deployment concerns. Keep
actionable work as checkboxes and mark it complete only after verification.

## Sandustry runtime work

Before changing registrations, UI injection, game:ready behavior, dev reload
handling, or other runtime integration, read:

Sandustry/Notes/runtime-lifecycle

Follow an existing working mod pattern for registration timing, injected UI
ownership, repaint state, disposal, and installed-versus-dev verification.

For native bundle patches:

- Extract and anchor against the exact minified bundle from the installed
  game's app.asar.
- Validate anchors against that extracted file before runtime testing or
  shipping.
- Do not derive anchors from pretty-printed captures, source maps, or
  repository reference bundles.

Use packages/sandustry-mod-template/ and its extracted sources as the runtime
API reference. Keep unstable private engine internals local to diagnostic code.
Treat first-party bundled mods as supported content; do not assume base-game
catalogs are complete, and retain fallbacks for unresolved mod definitions.

## Repository layout and boundaries

Active mods live under mods/<name>. Each owns src/, modinfo.json, assets, and a
thin Makefile including make/mod.mk. Use root or per-mod make build,
make install, make check, and make format, with MOD=<name> when needed.

Deprecated mods are reference-only: debug-lab, signal-gate-repair, and
zoom-hotkeys. Do not maintain them unless explicitly asked.

Reusable TypeScript modules belong under shared/ and must avoid mod-specific
side effects. Mod entrypoints are standalone scripts compiled with sandkit
already in scope; do not add imports or exports to shipped entrypoints.

Browser projects are separate from mods:

- Reusable browser UI belongs in packages/sandustry-ui/.
- The blueprint site belongs in apps/blueprint-site/.
- Browser code must not import mods/, shared/, Sandustry runtime types, or
  game-installed assets.
- Mod code must not import the browser UI kit.
- Keep browser projects' manifests, TypeScript, CSS, build, and test
  configuration independent of mod build rules.
- DOM captures are the source of truth for browser component structure and
  behavior; screenshots are comparison evidence only.

For blueprint-site work, run:

    npm --workspace apps/blueprint-site run tsc

Keep /components current when changing the browser UI kit or its behavior. It
is a development-only showcase and must not be added to public navigation.

## Dev mode, packaging, and installs

If the Sandustry MCP server is connected to a running dev-mode game, use the
active make dev MOD=<name> watcher and reload path. Do not run make install in
that session.

Otherwise, make install is the normal local runtime handoff for mod changes.
It installs under:

/Users/daryl/Library/Application Support/sandustry/mods

Use SANDUSTRY_MODS_DIR=/path/to/mods to override the destination. Request
elevated permission if installation is blocked by the sandbox.

Generated mods/*/build/ output and root artifacts/ archives are ignored and
must not be committed.

## Verification

Run the smallest relevant checks, then the affected project checks. Each
test-bearing package or app owns a test script; the root test script runs all
test-bearing projects. Keep the root test project list current when adding one.

The integration test starts a local host on 127.0.0.1:4173 and connects to the
game. Always request elevated permission before running:

    npm run test:integration

Do not update checked-in visual baselines during ordinary verification. Treat
snapshot differences as evidence of a behavior or catalog change. Updating
PNG/SVG baselines requires explicit user approval. Use the repository's
explicit snapshot update flags, not Bun's bare --update:

    UPDATE_SVG_SNAPSHOTS=1 bun test ...
    UPDATE_PNG_SNAPSHOTS=1 bun test ...

## Blueprint terminology

Use these native units precisely:

- Pixel: one native sprite unit.
- Cell: four native pixels in one dimension.
- Blueprint Block/Tile: sixteen native pixels in one dimension, or four cells.

Keep these separate from CSS/display pixels. Use "padding" for space inside
the rendered map, "margin" for space between map and viewport, and "policy"
for initial fit configuration.

## Git and terminal

Keep commit messages short, lowercase, and minimally punctuated. Run commands
that write Git metadata with elevated permission from the start.

Do not commit changes automatically or preemptively. Always wait for explicit
user review and approval before creating a commit.

Use rg for repository search. Avoid destructive commands unless explicitly
requested and the exact target is known. Preserve unrelated worktree changes.

In terminal-oriented responses, use plain text paths and commands rather than
Markdown links or citation glyphs.

# Agent Notes

## Runtime lifecycle notes (read first for runtime/mod work)

Before adding or changing registrations, UI, `game:ready` behavior, dev-mode
reload handling, or other runtime integrations, read
`planning/notes/runtime-lifecycle.md`. It is the canonical repository note for
registration timing, pattern-first implementation, injected UI host ownership,
repaint state, disposal, and installed-versus-dev verification. Follow an
existing working mod pattern closely before introducing a new lifecycle shape.

All native bundle patches must be developed and anchored against the exact
minified game bundle extracted directly from the installed game's `app.asar`.
Do not derive patch anchors from pretty-printed captures, source maps, or
repository reference bundles; those may differ from the bytes consumed by the
patch loader. Validate the expected match against the extracted minified file
before shipping or runtime testing a patch.

## Sandustry runtime reference

`resources/SandustryModTemplate/` is the repository's reference for Sandustry
runtime API usage, extraction, and mod tooling. Check its docs and extracted
game sources before inferring new `sandkit` or `SandustryApi` types. Keep
unstable private engine internals local to the diagnostic code that needs them.

## First-party bundled mod compatibility

Treat first-party bundled mods as supported content for anything in any
project we work on. Every feature, parser, catalog, renderer, UI, lookup, and
integration must account for bundled mod content alongside base-game content.
Prefer runtime or captured catalog data over hard-coded base-game-only
assumptions, and retain a clear fallback when a bundled mod definition cannot
be resolved.

## Blueprint renderer terminology

Use these native-unit terms precisely when discussing the blueprint renderer
and its sprite overrides:

- **Pixel**: one native sprite unit.
- **Cell**: four native pixels in one dimension (a 4×4 native-pixel unit).
- **Blueprint Block**: sixteen native pixels in one dimension (a 16×16
  native-pixel unit, or four cells).
- **Tile** and **Block** are synonyms when referring to a blueprint block.

When discussing inspector or renderer configuration, use these equivalent
names consistently:

- **Blueprint padding** and **padding**: the space inside the rendered map,
  between the blueprint content and its edge.
- **Viewport margin** and **margin**: the space between the rendered map and
  the viewport.
- **Fit policy** and **policy**: the configuration that controls initial fit
  behavior.

Keep these native units separate from CSS/display pixels. A screen zoom or
render scale may map one native blueprint block to a different number of
display pixels.

## Monorepo workflow

Active mods live under `mods/<name>`. Each mod owns `src/`, `modinfo.json`, and
its assets, and has a thin Makefile that includes `make/mod.mk`. The root
Makefile discovers active mods and supports `make build`, `make install`,
`make check`, and `make format`; add `MOD=<name>` to target one mod. Per-mod
Makefiles expose the same commands.

Mods explicitly marked deprecated, including `signal-gate-repair` and
`zoom-hotkeys`, are retained for reference only. Do not add new features,
documentation, changelogs, or other maintenance work to them unless the user
specifically asks to revive one.

### Sandustry dev-mode loading

If the Sandustry MCP server is available and can connect to the running game,
the game is in dev mode. Use the active `make dev MOD=<name>` watcher and its
reload path for mod changes; do not run `make install` during that session.
The installed-mod directory may contain a competing or stale copy and should
not be used as the dev-mode handoff path.

Each package or app with tests owns a `test` script that runs its Bun tests.
The root `test` script runs only root-level tests, while `test:all` explicitly
runs the root test and every test-bearing workspace test command. Keep
`test:all` up to date whenever a new package, app, or other test-bearing
project is added; focused test aliases should not be added to package manifests
just for convenience.

The repository toolchain is pinned in `package.json` and `package-lock.json`.
TypeScript 7 and TSX support are configured with the Sandustry JSX factory, and
the Test Blocks implementation is TypeScript compiled to a plain JavaScript
entrypoint. Optional `patches.json` files are validated and packaged beside
the entrypoint. Generated `mods/*/build/` output and the root `artifacts/`
archive directory must not be committed.

Reusable TypeScript modules belong directly under `shared/`. Mod source can
import them normally; esbuild resolves and bundles those imports into each
mod's standalone entrypoint. The shipped script still has no imports or
exports, and shared modules should avoid mod-specific side effects.

## Browser workspace boundary

The standalone browser projects live alongside the mods but are completely
separate dependency graphs:

- Put the reusable browser UI kit in `packages/sandustry-ui/` and the blueprint
  site in `apps/blueprint-site/`.
- Browser projects must not import from `mods/`, `shared/`,
  `types/sandustry.d.ts`, or any Sandustry runtime/game API.
- Browser projects must not depend on `sandkit`, mod manifests, mod entrypoint
  conventions, or game-installed assets at runtime.
- Mod source must not import the browser UI kit. In-game UI remains a separate
  mod implementation using the game runtime.
- Give browser projects their own package manifests, TypeScript, Tailwind,
  build, and test configuration; do not extend the mod build rules for them.
- Reference material and DOM captures may inform browser implementations, but
  are research data/documentation, not shared executable code.
- Screenshots may be used for visual comparison, but DOM traces are the source
  of truth for component structure, states, interactions, and implementation.
- Preserve the boundary with workspace/package rules or automated import checks
  so accidental cross-project dependencies fail early.

For blueprint-site changes, run the app-specific TypeScript check before
handing off the work:

```sh
npm --workspace apps/blueprint-site run tsc
```

The blueprint site includes a development-only component showcase at `/components`.
Keep that page up to date whenever the UI library gains or changes a component,
variant, interaction state, or accessibility behavior. Use it to exercise the
new behavior and representative states before handing off UI-library changes;
do not add the debug route to the public site navigation.

## Git workflow

Keep commit messages short, lowercase, and minimally punctuated.

Run Git operations that write inside `.git` with elevated permissions from the
start so the sandbox does not block them. This applies to staging, committing,
merging, rebasing, and other repository metadata updates.

## Planning workflow

Repository-level implementation plans live locally in the `planning/` directory
as descriptive Markdown files. Every plan filename must end with `-PLAN.md`,
such as `PICKER-CLEANUP-PLAN.md`, `BLUEPRINT-RENDERER-PLAN.md`, and
`HOTBAR-PRESETS-PLAN.md`. Plans and reverse-engineering resources are local
working material and are ignored by Git; do not rely on them being present in a
fresh clone.

- Create or update a plan when a task spans multiple implementation areas,
  involves discovery or reverse engineering, or has meaningful compatibility,
  safety, or deployment concerns.
- Use Markdown checkboxes for actionable work: unchecked items are pending and
  checked items are complete.
- Organize plans into implementation phases, verification work, and completion
  criteria. Include a suggested implementation order when the steps have
  dependencies.
- Keep the plan behavior-focused and specific enough that another agent can
  continue the work without reconstructing the original conversation.
- Record important constraints, discovered runtime behavior, fallback behavior,
  and licensing or deployment limitations in the plan.
- Update the plan as implementation progresses; do not leave completed work
  represented only in conversation notes.
- Do not mark a checkbox complete merely because code was written. Mark it
  complete after the relevant check, inspection, or runtime verification has
  been performed.
- Keep generated build output and archives out of plans and commits unless the
  task explicitly requires them.
- When a plan is complete, leave the completed checklist as a record and add
  follow-up work as a new section or a new plan rather than replacing the
  historical context.

## Research notes

Use `planning/notes/` as the persistent notebook for discoveries made while
inspecting reference bundles, runtime captures, reverse-engineering material,
or other repository evidence. Before starting related investigation, read the
relevant notes; as new facts are learned, update the notes during the task so
future agents do not have to rediscover them.

- Keep notes in descriptive Markdown files, grouped by topic or subsystem.
- Record the evidence or source, the observed behavior, confidence or
  inferences, unresolved questions, and any compatibility limitations.
- Put actionable implementation steps and completion checkboxes in the
  relevant `*-PLAN.md`; cross-reference the research note instead of copying
  large investigations into the plan.
- Treat notes as local working material. Do not add generated output, archives,
  secrets, or transient logs.

## Project goal

This repository's primary Sandustry v1 mod, Test Blocks, adds two creative
utility structures:

- **Infinite Source**: emits a configurable element continuously.
- **Infinite Trash**: removes elements in its footprint.

The blocks belong in the `production` building category and currently reuse the
two icons from the demo Creative Mode mod.

## Important version distinction

The original Creative Mode resources are for a demo/older modding environment.
They are useful as behavioral and visual references, but their APIs must not be
copied into the real v1 mod.

Do not use these demo APIs in the v1 implementation:

- `fluxloaderAPI`
- `corelib.blocks.register`
- `corelib.simulation.spawnElement`
- `entry.electron.js`, `entry.game.js`, and `entry.worker.js` as v1 entrypoint
  conventions

The real v1 mods use a single plain script declared by `entry` in `modinfo.json`.
The script is compiled with `sandkit` already in scope, so it uses:

```js
const api = sandkit.api;
```

There must be no `import` or `export` statements. Top-level `await` is allowed.

## Useful v1 API patterns discovered

The supplied real v1 mods established the following patterns:

- Manifest fields include `manifestVersion`, `id`, `name`, `version`,
  `apiVersion`, `entry`, `dependencies`, and `loadOrder`.
- Register localized text with `api.i18n.register("en", translations)`.
- Load mod assets with `await api.sprites.loadFromMod(spriteId, relativePath)`.
- Register structures with `api.structures.register(...)`.
- Structure definitions can use `categoryKey`, `order`, `buildModes`, `shape`,
  and `render.imageName`.
- Unlock structures directly with
  `api.player.buildings.unlockByType(structureId)`.
- Register recurring behavior with `api.triggers.register(triggerId, {
interval, callback
})`.
- Iterate placed structures with `api.structures.forEachOfType`.
- Register deferred behavior after native content is ready with
  `api.events.on("game:ready", callback)`.
- Store per-structure data with `api.structures.setData`.
- Read and write elements through `api.elements`.
- Use `api.world.isCellEmptyAtCell` before creating output.
- Use `api.elements.createAtCellWhenIdle` and
  `api.elements.removeAtCellWhenIdle` for main-thread deferred mutations.
- Use `api.grid.forEachCellInRect` for rectangular footprints.
- Use `api.ui.prompt` and `api.ui.toast` for the current Source configuration
  UI.

## Settings and configuration findings

The Mods tab appears only for mods with a non-empty `configSchema` in
`modinfo.json`. Settings use fields such as `boolean`, `number`, and `choice`,
with required `labelKey` values. Runtime values are available through
`api.settings.get`, `api.settings.getAll`, and `api.settings.onChange`.

The project currently uses a custom picker instead of an undocumented native
structure configuration panel. The picker is modeled on the game's filter UI:
it has a compact selected-element strip, expands into a searchable element grid
with matter-type filters and color swatches, and minimizes after selection. A
single picker promise is shared across all structures created by a line drag,
so each placed Source receives the same selection without opening competing
modals. A valid ID/type is stored in structure data. If the runtime does not
expose React or the expected modal overlay slot, the code falls back to the
text prompt. `api.action.getSelected()` identifies the held building by its
`id`, so the compact picker is shown only while the Source action is selected
and is removed when the player switches away.
The picker also uses `api.ui.navigation` for a dedicated focus scope, explicit
directional neighbors across the search, matter tabs, and four-column element
grid, controller-focused styling, and back/Escape behavior that minimizes the
expanded picker.

## Current implementation behavior

The implementation lives in `mods/test-blocks/src/entry.tsx` and its manifest is
`mods/test-blocks/modinfo.json`.

- Mod ID: `sorahn.sandustry-test-blocks`
- Current version: `0.1.11`
- Entrypoint: `entry.js`
- Structures: `sandustryTestBlocksSource` and
  `sandustryTestBlocksTrash`
- Category: `production`
- Both structures use a 4×4 footprint and the demo icons:
  - `mods/test-blocks/assets/SourceBlock.png`
  - `mods/test-blocks/assets/Trash.png`
- The structure shape is intentionally four rows of zeroes, matching the demo
  blocks. This makes the structures non-blocking overlays and avoids the red
  occupied-footprint rendering caused by an all-ones shape.
- Source output is a 4×4 area directly below the structure, for up to 16
  particles per trigger.
- Source only fills empty output cells and does not overwrite existing material.
- Source trigger interval is 500 ms, matching the demo Creative Spawner's
  `tickInterval: 500`. The earlier 100 ms interval produced material too
  quickly.
- Trash scans and removes elements throughout its 4×4 footprint every trigger.
- The picker uses the proven Steam-mod pattern `const React = sandkit.react`
  with `api.ui.inject`. It reads registered element definitions for names, IDs,
  matter types, and colors. If injection or the React runtime is unavailable,
  it falls back to the text prompt.
- `BLACKLISTED_ELEMENT_IDS` in `mods/test-blocks/src/entry.tsx` is the explicit blacklist for
  unfinished or unwanted elements. The same check is applied to picker entries,
  manual ID input, and runtime spawning. Definitions with `hidden: true` are
  also excluded automatically.
- `BLACKLISTED_ELEMENT_TYPES` handles core elements that have no string ID; type
  `2` is currently excluded because it appears as `[NO KEY]`/`[NO NAME]`.

The source tracks three states by structure position:

- `configuredSources`: structures already initialized.
- `configuringSources`: structures whose prompt is open; these must not spawn.
- `disabledSources`: structures canceled or given an invalid element ID.

The selected element is persisted through the structure data, so existing
configured Sources do not reopen the prompt after a reload. The most recently
picked element is also saved with `api.storage.local` under
`${MOD_ID}.lastElement`, so a newly placed Source starts with that selection
across worlds and game launches. Core elements without IDs are stored by
numeric type.

## Assets and packaging

The source files are under `mods/test-blocks/`. The distributable
archive is generated as `sandustry-test-blocks-0.1.11.zip` or the current
Makefile-derived archive name.
Generated zip files are written under `artifacts/build/` and are
ignored by `.gitignore`.

The Makefile provides:

```sh
make build
make install
```

`make build` packages the contents of the selected mod with `modinfo.json` at
the archive root. `make install` installs the unzipped mod contents into a directory named
exactly after the manifest ID under:

```text
/Users/daryl/Library/Application Support/sandustry/mods
```

The destination can be overridden:

```sh
make install SANDUSTRY_MODS_DIR=/path/to/mods
```

After making mod changes, run `make install` so the unzipped current version is
updated in the local Sandustry mods directory. This is the standard handoff
step for local runtime testing. Because the default destination is outside the
workspace, always run the install with requested elevated permissions when the
sandbox blocks it:

```sh
make install
```

Use the command tool's `require_escalated` permission with a concise approval
request; do not silently skip installation after a permission failure.

## Verification and limitations

### Visual baseline policy

Never update checked-in visual regression baselines as part of ordinary
verification or to make a failing test pass. Treat snapshot differences as
real evidence of a renderer or catalog change. Updating PNG or SVG baselines
requires explicit user approval for the intentional behavior change; record
which fixtures changed and verify the resulting images afterward.

For Bun snapshot tests, use the repository's explicit update environment
flags rather than `--update`, which Bun consumes for its own snapshot mode:
`UPDATE_SVG_SNAPSHOTS=1 bun test ...` or
`UPDATE_PNG_SNAPSHOTS=1 bun test ...`. The visual render script remains
`npm run visual:render -- --update [--only <fixture>]`.

Checks performed during development:

- `node --check mods/test-blocks/build/entry.js`
- JSON parsing of `mods/test-blocks/modinfo.json`
- Makefile dry runs with `make -n install`
- Archive content inspection with `unzip -l`

No in-game runtime test is available in this environment. If behavior needs
further debugging, test these cases in Sandustry:

1. Place Source and confirm no particle appears before choosing an element.
2. Cancel Source configuration and confirm the Source remains inert.
3. Choose Sand and confirm a 4×4 batch appears below the Source every 500 ms.
4. Remove output material and confirm the Source refills empty cells.
5. Place Trash over falling material and confirm its full 4×4 footprint clears it.
6. Confirm the red footprint overlay is gone with the all-zero shape.
7. Reload a world with a configured Source and confirm it does not prompt again.

If the game does not accept the all-zero structure shape or the `single` build
mode, compare against the supplied v1 Rocket Dispenser and adjust the structure
registration while preserving the 4×4 geometry and `production` category.

## Debug Lab F8 snapshots

The latest manually captured Debug Lab F8 export belongs in
`resources/f8-results.json`. It may be empty until the user performs an F8
export. When populated, treat it as the authoritative snapshot for structure
catalog and runtime-debugging work, and expect the user to replace it with the
most recent F8 results when needed.

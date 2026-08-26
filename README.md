# Sandustry Mods

This repository is a Sandustry v1 mods monorepo. The current mod,
`infinite-source-trash`, adds two creative utility structures to the `Misc`
building category:

- **Infinite Source** emits configured gases above itself and other elements
  below it when the output cell is empty. When first placed, it opens a
  configuration prompt where you can enter a registered element ID such as
  `sand` or `copper`.
- **Infinite Trash** removes an element occupying its cell.

The block icons currently reuse the Creative Spawner and Creative Deleter icons
from the demo mod, renamed to `SourceBlock.png` and `Trash.png`.

## Repository layout

Each active mod is isolated under `mods/<name>` with its source, manifest, and
assets. Reusable TypeScript helpers live under `shared/` and are compiled into
each standalone entrypoint. Shared build rules live in `make/mod.mk`; reference
material remains under `resources/`. The Infinite Source/Trash entrypoint is
TypeScript and compiles to the plain JavaScript file Sandustry expects.

## Packaging

The root Makefile builds all active mods. Use a short mod name to target one
mod:

```sh
make build
make build MOD=zoom-hotkeys
make check
make format
```

Publish a Workshop mod through SteamCMD after logging in:

```sh
make publish MOD=zoom-hotkeys
```

`publish` requires exactly one `MOD=<name>` and uses `steamcmd` from your PATH.
Before publishing, it runs the selected mod's `check` target and then forces a
fresh build so the uploaded package is produced after validation.
It reads the most recent account from Steam's `loginusers.vdf` and passes that
account to SteamCMD with `+login`. Steam client login and SteamCMD credentials
are separate; the first publish may prompt for the Steam password and Steam
Guard code. If the mod has an entry in `workshop-published-ids.json`, it
updates that item; otherwise it creates a new item and records the ID SteamCMD
writes back to the temporary VDF. Set `STEAMCMD=/path/to/steamcmd`,
`STEAM_ACCOUNT=<account>`, or `CHANGE_NOTE="..."` to override the defaults.

For development, watch one mod and keep its installed copy up to date with:

```sh
make dev MOD=test-blocks
```

The initial dev workflow targets one mod at a time. Restart-only behavior is
the safe default; renderer hot reload will be enabled explicitly for mods once
they provide disposal for their UI, timers, listeners, and other registrations.
Changes that cannot be safely hot-reloaded will restart only the Sandustry
process launched by that dev session. A pre-existing game process is not taken
over automatically.

The watcher rebuilds on changes under the selected mod's `src/` and `assets/`
directories, reusable `shared/` code, and changes to its manifest, optional
`patches.json`, preview, or root TypeScript configuration. Press `r` in the
watcher's terminal to restart the game owned by that session. Steam-managed
`workshop.json` exists only in the installed mod directory and is deliberately
preserved there, not copied from source. Its `publishedFileId` is backed up in
the tracked root-level `workshop-published-ids.json` file.
Override the installed-mod destination with
`SANDUSTRY_MODS_DIR=/path/to/sandustry/mods`.

An optional `mods/<name>/patches.json` is packaged beside `entry.js` and
validated before installation. Patches are restart-only because the game reads
them before loading the renderer bundle. The watcher removes an installed mod
directory on exit only when it created that directory for the current dev
session; pre-existing installed mods are preserved.

HMR is opt-in per mod. Add a local, un-packaged `mods/<name>/dev-reload.json`
with `{ "mode": "hmr" }` only after the mod registers cleanup for every UI,
timer, listener, and other reloadable registration. Without that file, builds
still install automatically but the dev protocol reports `restart` mode.

For VS Code debugging, press F5 and choose the `Sandustry Dev` compound. It
prompts for a mod, launches Sandustry with main-process and renderer debug
ports, attaches both debuggers, and loads the configured save directly through
`index.html?db_load=<save>`. Save selection uses this order:

1. `SANDUSTRY_DEV_SAVE`, when set.
2. `mods/<name>/.sandustry-save`, for a mod-specific test world.
3. The repository root `.sandustry-save`, for the shared default.
4. No save ID, which leaves Sandustry on its normal sandbox startup.

The dot files contain only the save ID as plain text. Leave a file empty or
omit it to continue to the next fallback. For one-off overrides, the watcher
still accepts `--save <id>`. The debug compound takes over the existing game
explicitly. The watcher discovers Sandustry through `SANDUSTRY`,
`SANDUSTRY_INSTALL`, or Steam library folders and `libraryfolders.vdf`.
`SANDUSTRY_RESOURCES` and `SANDUSTRY_ASAR` override the resource archive used
by native catalog extraction. The catalog extractor uses `@electron/asar` and
does not require a checked-in game bundle.

The dev runner starts Sandustry when it is not already running and owns that
process. For an already-running game, use `make dev MOD=test-blocks TAKEOVER=1`
to explicitly hand ownership to the dev runner. Restart-mode changes then
restart the owned game automatically.

From the repository root, run `make install` to build the current version and
copy the unzipped mod into an ID-named folder in the default Sandustry mods
directory. Override the destination with
`make install SANDUSTRY_MODS_DIR=/path/to/mods`.

To bump one mod's version and create a commit containing only its manifest:

```sh
make version MOD=zoom-hotkeys patch
make version MOD=zoom-hotkeys minor
make version MOD=zoom-hotkeys major
```

### Make completion

The mod names used by `MOD=` are discovered from `mods/*`. Source the
completion helper for your shell from the repository root:

```sh
source make/completion.zsh   # zsh
source make/completion.bash  # bash
source make/completion.fish  # fish
```

Then `make build MOD=<tab>` (or any other Make target) completes the current
mod names. Set `SANDUSTRY_MODS_ROOT` if sourcing the helper from elsewhere.

The same commands are available from inside a mod directory, without the
`MOD=` argument. The install destination can be overridden with
`SANDUSTRY_MODS_DIR=/path/to/sandustry/mods`.

Generated `build/` directories and the root `artifacts/` archive directory are
ignored. Reference mods in `resources/` are not active mods and are not
packaged.

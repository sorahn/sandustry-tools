# Blueprint visual regression tests

The catalog fixture and every `.txt` file in `blueprints/` render through the
actual blueprint site and capture a PNG with headless Chrome. The current
images are trimmed to the rendered map bounds, without the site navigation,
test controls, or viewport chrome. Current images and ImageMagick diffs are
written under `artifacts/visual/blueprint-core/`.

Visual fixture helpers use the core source by default so ordinary runs exercise
the current working tree. To exercise the publishable package entrypoint,
build core first and set `BLUEPRINT_CORE_TEST_DIST=1`:

```sh
npm --workspace @daryl.roberts/sandustry-blueprint-core run build
BLUEPRINT_CORE_TEST_DIST=1 bun test packages/sandustry-blueprint-core/tests/visual
```

Put one encoded blueprint per file in `packages/sandustry-blueprint-core/tests/visual/blueprints/`, for example
`packages/sandustry-blueprint-core/tests/visual/blueprints/thermal-line.txt`. Both v2 binary strings and v2 text
strings are accepted.

Do not update checked-in baselines during ordinary test runs. A mismatch is a
signal to inspect the renderer, catalog, asset metadata, or fixture. Only
create or replace a baseline after the user explicitly approves an intentional
visual behavior change. Then use:

```sh
npm run visual:render -- --update
```

Update one snapshot by its fixture name or blueprint filename without the
`.txt` extension:

```sh
npm run visual:render -- --update --only thermal-line
```

Render without changing the baseline with:

```sh
npm run visual:render
```

Compare the current image with the baseline with:

```sh
npm run visual:diff
```

SVG output snapshots for the catalog and every blueprint fixture are checked
with:

```sh
bun test packages/sandustry-blueprint-core/tests/visual/svg-snapshots.test.ts
```

After explicit approval for an intentional SVG renderer change, refresh them
with:

```sh
UPDATE_SVG_SNAPSHOTS=1 bun test packages/sandustry-blueprint-core/tests/visual/svg-snapshots.test.ts
```

PNG output snapshots are checked as individual Bun tests with:

```sh
bun test packages/sandustry-blueprint-core/tests/visual/png-snapshots.test.ts
```

After explicit approval for an intentional PNG renderer change, refresh the
baselines with:

```sh
UPDATE_PNG_SNAPSHOTS=1 bun test packages/sandustry-blueprint-core/tests/visual/png-snapshots.test.ts
```

The same selector can limit comparisons:

```sh
npm run visual:diff -- --only thermal-line
```

The built-in catalog fixture is in
`apps/blueprint-site/src/visual-fixtures/catalog.ts`. It intentionally covers
the sprite families currently being corrected, including belts, pyros, and
directional fans.

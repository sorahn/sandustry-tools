# Test Blocks

Creative Sources, Trash, Heat, Chill and Power for Sandustry 0.6.0. Saved
structure IDs and element selections remain compatible with existing worlds.

## Native patch audit

Verified against the installed 0.6.0 mod-enabled Steam build 26169939 on
2026-11-05. The original `dist/js/bundle.js` extracted from the installed
`app.asar` has SHA-256:

```text
b39cd21fa2dbfd24252f7cc745d7003df808158b9022aee672165f5574dc2324
```

| Patch | Decision | Reason |
| --- | --- | --- |
| `thermal-source-consumption` | Removed | Native `thermalBuffer: true` registrations support buffer membership and consumption. The old 0.5.6 anchor no longer matches. |
| `test-blocks-category-order` | Retained | The native build-category order is a fixed array; an unknown category otherwise sorts after the built-in categories. |
| `test-blocks-category-label` | Retained | The native category label helper translates only its fixed set of known category keys; an unknown key otherwise displays literally as `testBlocks`. |

The remaining patches match complete native arrays exactly once and share an
atomic group. If either anchor changes, the native patcher rolls both back.
Re-extract the installed bundle and audit both arrays when updating game
compatibility; matching old reference files does not establish compatibility.

Heat and Chill use public `thermal.getTemperature` and `adjustTemperature`
calls to refill their buffers. The game's native scheduler handles element
absorption and network diffusion, including ordinary Thermal Relays. Diffusion
may share heat immediately after a refill, so a connected source need not be
at its full target between refills. No global thermal predicate or manual
relay-diffusion implementation is installed.

## Verification

```sh
make check MOD=test-blocks
SANDUSTRY_MOD=test-blocks npm run test:integration
```

Integration runs use the isolated extracted-game host, not the Steam game or
its saves. The suite checks native patch application and grouped rollback,
the rendered build category, buffer refill and four-sided relay exchange,
native thermal-consumer admission with an unflagged control, Source material
preservation and serialization, picker expand/minimize/reopen, Trash boundaries,
and Power refill/removal.
The thermal-consumer check invokes the exact native helper diagnostically;
it is not a physical placement or every-machine processing test.

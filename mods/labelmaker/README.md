# Labelmaker development notes

## Tool registration lifecycle

Keep Labelmaker registration inside an async `initialize()` function:

1. Register the mod-level localized strings.
2. Load the tool sprite with `api.sprites.loadFromMod`.
3. Call `registerLabelmaker()` after the sprite load completes.
4. Catch and log sprite-load and registration failures.

This follows the registration pattern used by the installed
`sirmonkz.cloning_expanded` mod (`3786614145`). Do not add a `globalThis` or
other runtime singleton guard unless the loader behavior is re-investigated;
the normal development workflow restarts the game for changes that are not
safe to hot-reload.

Labelmaker is currently always available, so it grants itself through the
`game:ready` event. That callback checks the current player inventory before
calling `api.player.inventory.addFromId(ITEM_ID)`, allowing a new world to
receive the tool without adding duplicate copies on repeated ready events.

## Size limits

Labels are limited to 64 characters. The length check runs before bitmap and
placement data are generated, and oversized labels are rejected with an
in-game toast.

# @daryl.roberts/sandustry-blueprint-core

Shared blueprint encoding, preparation, SVG rendering, and PNG-platform
adapters for Sandustry tools. The package also owns the generated structure
catalog and the catalog sprite assets used by the shared renderer.

The package is built during Git installation by its `prepare` script. It
exports compiled Node-compatible ESM from `dist/` and TypeScript declarations.

The PNG renderer is platform-neutral. Callers provide image loading, canvas,
drawing, and PNG encoding through `BlueprintPngPlatform`.

`blueprintCatalog()` exposes the package-owned render catalog for browser and
Node consumers. Node applications can use `BLUEPRINT_ASSET_ROOT` as the asset
root when resolving the catalog's `catalog/...` sprite paths.

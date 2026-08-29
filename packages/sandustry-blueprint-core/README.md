# @sorahn/sandustry-blueprint-core

Shared blueprint encoding, preparation, SVG rendering, and PNG-platform
adapters for Sandustry tools.

The package is built during Git installation by its `prepare` script. It
exports compiled Node-compatible ESM from `dist/` and TypeScript declarations.

The PNG renderer is platform-neutral. Callers provide image loading, canvas,
drawing, and PNG encoding through `BlueprintPngPlatform`.

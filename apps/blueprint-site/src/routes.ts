import { createRootRoute, createRoute } from "@tanstack/react-router";
import { AppLayout } from "./components/AppLayout";
import { BlueprintCodecPage } from "./pages/Codec";
import { BlueprintInspectorPage, SavedBlueprintInspectorPage } from "./pages/Inspector";
import { VaultBlueprintInspectorPage } from "./pages/VaultInspector";
import { BlueprintVisualFixturePage } from "./pages/VisualFixture";
import { BlueprintEmbedPage } from "./pages/BlueprintEmbed";
import { ComponentsPage } from "./pages/Components";
import { HomePage } from "./pages/HomePage";
import { SaveExplorerPage } from "./pages/Explorer";

const rootRoute = createRootRoute({ component: AppLayout });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage });
const codecRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/codec",
  component: BlueprintCodecPage,
});
const inspectorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inspect",
  component: BlueprintInspectorPage,
});
const saveBlueprintRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/save/$saveId/blueprint/$blueprintId",
  component: SavedBlueprintInspectorPage,
});
const vaultInspectorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inspect/vault/$vaultId",
  component: VaultBlueprintInspectorPage,
});
const visualFixtureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inspect/fixture",
  component: BlueprintVisualFixturePage,
});
const blueprintEmbedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inspect/embed",
  component: BlueprintEmbedPage,
});
const componentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/components",
  component: ComponentsPage,
});
const explorerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explorer",
  component: SaveExplorerPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  codecRoute,
  inspectorRoute,
  saveBlueprintRoute,
  vaultInspectorRoute,
  visualFixtureRoute,
  blueprintEmbedRoute,
  componentsRoute,
  explorerRoute,
]);

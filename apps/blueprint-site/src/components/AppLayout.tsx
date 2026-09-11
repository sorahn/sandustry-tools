import { Outlet, ScrollRestoration, useLocation } from "@tanstack/react-router";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function AppLayout() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.searchStr);
  const visualCapture =
    searchParams.get("visualCapture") === "1" ||
    (location.search as Record<string, unknown> | undefined)?.visualCapture === "1";
  const embed = location.pathname.endsWith("/inspect/embed");
  if (visualCapture || embed) return <Outlet />;

  const isAppRoute =
    location.pathname === "/explorer" ||
    location.pathname === "/inspect" ||
    location.pathname.startsWith("/inspect/") ||
    location.pathname.startsWith("/save/");

  if (isAppRoute) {
    return (
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-[var(--sd-color-bg,#181c20)] text-[var(--sd-color-text,#e8eef5)] transition-colors duration-200">
        <ScrollRestoration />
        <Header fullWidth />
        <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--sd-color-bg,#181c20)] text-[var(--sd-color-text,#e8eef5)] transition-colors duration-200">
      <ScrollRestoration />
      <Header />
      <main className="site-shell mx-auto w-full flex-1 px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

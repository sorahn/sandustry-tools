import { Outlet } from "@tanstack/react-router";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function AppLayout() {
  const query =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : undefined;
  const visualCapture = query?.get("visualCapture") === "1";
  const embedMode = query?.get("mode");
  const embed =
    window.location.pathname.endsWith("/inspect/embed") &&
    (embedMode === "thumbnail" || embedMode === "inspector");
  if (visualCapture || embed) return <Outlet />;

  return (
    <div className="flex min-h-screen flex-col bg-sd-950 text-slate-100">
      <Header />
      <main className="site-shell mx-auto w-full flex-1 px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

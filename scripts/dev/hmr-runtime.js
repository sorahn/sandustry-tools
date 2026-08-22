/* Development-only renderer reload client. Prepended to watched mod bundles. */
(function installSandustryDevHmr() {
  // DevTools and the MCP bridge need access to the host-injected runtime. The
  // normal mod loader passes `sandkit` as an entrypoint parameter, so expose
  // only these debug conveniences in development bundles.
  try {
    const api = sandkit.api;
    const { enums, react } = sandkit;
    Object.assign(globalThis, { sandkit, api, enums, react });

    // Prevent the game autosave trigger from writing over a development save.
    // Manual saves remain available through the normal game controls/API.
    const settings = sandkit.state?.session?.settings;
    if (settings && "autosaveInterval" in settings) settings.autosaveInterval = 0;
  } catch {
    // The host may evaluate the prelude before its runtime argument is ready.
  }

  const config = globalThis.__sandustryDevHmrConfig__;
  if (!config || !config.url || !config.modId) return;

  const hosts = globalThis.__sandustryDevHmrHosts__ || (globalThis.__sandustryDevHmrHosts__ = {});
  const host =
    hosts[config.modId] ||
    (hosts[config.modId] = {
      eventSource: null,
      reconnectTimer: null,
      disposers: [],
      reloading: false,
      installed: false,
      source: null,
      booted: false,
      continueVisibleSince: 0,
      continueTimer: null,
    });
  const hotReloadEval = host.installed;
  const autoContinueStorageKey = `__sandustryDevAutoContinueDone__:${location.origin}:${location.pathname}`;

  function hasAutoContinueDone() {
    try {
      return sessionStorage.getItem(autoContinueStorageKey) === "1";
    } catch {
      return false;
    }
  }

  globalThis.__sandustryDevHmrActive__ = config.modId;
  globalThis.__sandustryDevOnDispose__ = (fn) => {
    if (typeof fn !== "function") return () => {};
    host.disposers.push(fn);
    return () => {
      const index = host.disposers.indexOf(fn);
      if (index >= 0) host.disposers.splice(index, 1);
    };
  };
  globalThis.__sandustryDevIsHmrEval__ = () => hotReloadEval;

  function readEntry() {
    try {
      const api = sandkit.api;
      const url = api.assets.getUrl("entry.js");
      const busted = `${url}${url.includes("?") ? "&" : "?"}hot=${Date.now()}`;
      return fetch(busted, { cache: "no-store" })
        .then((response) => (response.ok ? response.text() : null))
        .catch(() => readEntryXhr(busted));
    } catch {
      return Promise.resolve(null);
    }
  }

  function readEntryXhr(url) {
    return new Promise((resolve) => {
      try {
        const request = new XMLHttpRequest();
        request.open("GET", url);
        request.onload = () =>
          resolve(
            request.status === 0 || (request.status >= 200 && request.status < 300)
              ? request.responseText
              : null,
          );
        request.onerror = () => resolve(null);
        request.send();
      } catch {
        resolve(null);
      }
    });
  }

  function dispose() {
    for (let index = host.disposers.length - 1; index >= 0; index--) {
      try {
        host.disposers[index]();
      } catch (error) {
        console.error("[sandustry dev] dispose failed", error);
      }
    }
    host.disposers.length = 0;
  }

  function evaluate(source) {
    if (host.reloading) return;
    host.reloading = true;
    dispose();
    try {
      new Function("sandkit", source)(sandkit);
      host.source = source;
      console.log(`[${config.modId}] hot reloaded`);
      report("ok");
    } catch (error) {
      console.error(`[${config.modId}] hot reload failed`, error);
      report("failed", error);
    } finally {
      host.reloading = false;
    }
  }

  function report(status, error) {
    try {
      fetch(`${config.url}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modId: config.modId,
          status,
          error: error ? String(error) : undefined,
        }),
      }).catch(() => {});
    } catch {
      // The watcher may not be reachable while the game is starting.
    }
  }

  function connect() {
    if (host.eventSource) return;
    try {
      const source = new EventSource(config.url);
      host.eventSource = source;
      source.onmessage = (event) => {
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }
        if (payload.modId !== config.modId || payload.mode !== "hmr") return;
        void readEntry().then((next) => {
          if (!next) return report("failed", new Error("could not read updated entry.js"));
          if (payload.force || next !== host.source) evaluate(next);
        });
      };
      source.onerror = () => {
        source.close();
        if (host.eventSource === source) host.eventSource = null;
        if (!host.reconnectTimer) {
          host.reconnectTimer = setTimeout(() => {
            host.reconnectTimer = null;
            connect();
          }, 1000);
        }
      };
    } catch {
      if (!host.reconnectTimer) {
        host.reconnectTimer = setTimeout(() => {
          host.reconnectTimer = null;
          connect();
        }, 1000);
      }
    }
  }

  function autoContinue() {
    if (!config.autoContinue || host.booted || hasAutoContinueDone()) return;
    const buttons = Array.from(
      document.querySelectorAll(
        "button, [role='button'], .cursor-pointer, [class*='cursor-pointer']",
      ),
    );
    const button = buttons.find((element) => {
      const label = (element.textContent || "").trim().toLowerCase();
      return (label === "continue" || label.endsWith(" continue")) && !isPauseMenuContinue(element);
    });
    const visible = button && !button.closest("[aria-hidden='true']") && isVisible(button);
    if (!visible) {
      host.continueVisibleSince = 0;
      scheduleAutoContinue();
      return;
    }
    if (host.continueVisibleSince === 0) {
      host.continueVisibleSince = Date.now();
      scheduleAutoContinue();
      return;
    }
    if (Date.now() - host.continueVisibleSince < 400) {
      scheduleAutoContinue();
      return;
    }
    if (button) {
      finishAutoContinue();
      button.click();
      return;
    }
    scheduleAutoContinue();
  }

  function scheduleAutoContinue() {
    if (host.continueTimer !== null || host.booted) return;
    host.continueTimer = setTimeout(() => {
      host.continueTimer = null;
      autoContinue();
    }, 250);
  }

  function finishAutoContinue() {
    try {
      sessionStorage.setItem(autoContinueStorageKey, "1");
    } catch {
      // Some embedded contexts may not expose sessionStorage.
    }
    for (const otherHost of Object.values(hosts)) {
      otherHost.booted = true;
      if (otherHost.continueTimer !== null) {
        clearTimeout(otherHost.continueTimer);
        otherHost.continueTimer = null;
      }
    }
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(element);
    return (
      style.display !== "none" && style.visibility !== "hidden" && parseFloat(style.opacity) >= 0.05
    );
  }

  function isPauseMenuContinue(element) {
    const overlay = element.closest(".fixed.inset-0");
    if (!overlay) return false;
    if (overlay.classList.contains("z-[10010]")) return true;
    const text = (overlay.textContent || "").toLowerCase();
    return ["unstuck", "save", "load", "options", "exit"].every((label) => text.includes(label));
  }

  host.installed = true;
  connect();
  autoContinue();
})();

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

  // Development sessions should not overwrite the selected save when leaving
  // a map. The exit dialog is mounted on demand, so watch for its checkbox.
  if (!globalThis.__sandustryDevExitSaveGuardInstalled__) {
    const installExitSaveGuard = () => {
      if (!document.body) {
        setTimeout(installExitSaveGuard, 0);
        return;
      }
      globalThis.__sandustryDevExitSaveGuardInstalled__ = true;
      const disableExitSave = () => {
        for (const label of document.querySelectorAll("label")) {
          if (!(label.textContent || "").toLowerCase().includes("save the game before exiting"))
            continue;
          const checkbox = label.querySelector('input[type="checkbox"]');
          if (checkbox?.checked) checkbox.click();
        }
      };
      new MutationObserver(disableExitSave).observe(document.body, {
        childList: true,
        subtree: true,
      });
      disableExitSave();
    };
    installExitSaveGuard();
  }

  // Sandustry's renderer understands db_load on the index URL. The Electron
  // main process always starts index.html without a query, so redirect once
  // from the dev prelude when a save was requested. This avoids the main-menu
  // Continue click while leaving normal sessions unchanged.
  if (typeof config.initialSave === "string" && config.initialSave.trim()) {
    const requestedSave = config.initialSave.trim();
    const currentSave = new URLSearchParams(location.search).get("db_load");
    const saveRedirectStorageKey = `__sandustryDevSaveRedirectDone__:${config.devSessionId || "legacy"}:${requestedSave}`;
    let saveRedirectDone = false;
    try {
      saveRedirectDone = localStorage.getItem(saveRedirectStorageKey) === "1";
    } catch {
      // Continue without the one-time redirect guard if storage is unavailable.
    }
    if (!saveRedirectDone && currentSave !== requestedSave) {
      try {
        localStorage.setItem(saveRedirectStorageKey, "1");
      } catch {
        // The redirect is still useful when local storage is unavailable.
      }
      const target = new URL(location.href);
      target.search = "";
      target.searchParams.set("db_load", requestedSave);
      location.replace(target.href);
      return;
    }
    if (!saveRedirectDone) {
      try {
        localStorage.setItem(saveRedirectStorageKey, "1");
      } catch {
        // Ignore unavailable local storage.
      }
    }
  }

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
      overlayHtml: null,
      overlayPresent: false,
      overlayObserver: null,
    });
  const hotReloadEval = host.installed;
  const autoContinueStorageKey = `__sandustryDevAutoContinueDone__:${config.devSessionId || "legacy"}`;

  function hasAutoContinueDone() {
    try {
      return localStorage.getItem(autoContinueStorageKey) === "1";
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

  // The screen recorder's advanced overlay editor is a controlled React
  // textarea. Keep its contents sourced from the selected mod's optional
  // src/overlay.html file, while still allowing the recorder to render the
  // same HTML/CSS through its normal change handler.
  function overlayUrl() {
    try {
      return sandkit.api.assets.getUrl("overlay.html");
    } catch {
      return null;
    }
  }

  function applyOverlayHtml() {
    if (typeof host.overlayHtml !== "string") return;
    const textarea = document.querySelector('textarea[aria-label="Overlay HTML and CSS"]');
    if (!textarea || textarea.value === host.overlayHtml) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (setter) setter.call(textarea, host.overlayHtml);
    else textarea.value = host.overlayHtml;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function installOverlaySync() {
    if (host.overlayObserver || !document.body) return;
    host.overlayObserver = new MutationObserver(applyOverlayHtml);
    host.overlayObserver.observe(document.body, { childList: true, subtree: true });
    applyOverlayHtml();
  }

  function syncOverlayHtml() {
    const url = overlayUrl();
    if (!url) return Promise.resolve();
    const busted = `${url}${url.includes("?") ? "&" : "?"}hot=${Date.now()}`;
    return fetch(busted, { cache: "no-store" })
      .then((response) => {
        // overlay.html is optional. A missing file is expected for most mods.
        if (!response.ok) {
          if (!host.overlayPresent) return null;
          host.overlayPresent = false;
          host.overlayHtml = "";
          installOverlaySync();
          applyOverlayHtml();
          return null;
        }
        return response.text();
      })
      .then((html) => {
        if (html === null) return;
        host.overlayPresent = true;
        host.overlayHtml = html;
        installOverlaySync();
        applyOverlayHtml();
      })
      .catch(() => {});
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
        void syncOverlayHtml();
        if (Array.isArray(payload.changed) && payload.changed.includes("overlay.html")) return;
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
      localStorage.setItem(autoContinueStorageKey, "1");
    } catch {
      // Some embedded contexts may not expose localStorage.
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
  const installOverlayWhenReady = () => {
    if (document.body) {
      installOverlaySync();
      void syncOverlayHtml();
      return;
    }
    setTimeout(installOverlayWhenReady, 0);
  };
  installOverlayWhenReady();
  connect();
  autoContinue();
})();

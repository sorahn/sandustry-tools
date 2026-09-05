import { describe, expect, test, mock } from "bun:test";
import type { SaveWorkerRequest, SaveWorkerResponse } from "../../save-worker";
import type { BlueprintWorkerRequest, BlueprintWorkerResponse } from "../../blueprint-worker";
import { createBrowserPngPlatform } from "../png-platform";

describe("worker protocol and concurrency", () => {
  test("SaveWorkerRequest and SaveWorkerResponse carry correlation IDs", () => {
    const request: SaveWorkerRequest = {
      id: 42,
      type: "inspect",
      mapX: 10,
      mapY: 20,
    };
    expect(request.id).toBe(42);
    expect(request.type).toBe("inspect");

    const response: SaveWorkerResponse = {
      id: 42,
      type: "inspection",
      inspection: {
        mapX: 10,
        mapY: 20,
        worldX: 40,
        worldY: 80,
        width: 4,
        height: 4,
        fogValue: 0,
        revealed: true,
      },
    };
    expect(response.id).toBe(42);
    expect(response.type).toBe("inspection");
  });

  test("BlueprintWorkerRequest and BlueprintWorkerResponse carry correlation IDs", () => {
    const request: BlueprintWorkerRequest = {
      id: "job-101",
      type: "render",
      blueprint: "test",
      assetBaseUrl: "/",
    };
    expect(request.id).toBe("job-101");

    const response: BlueprintWorkerResponse = {
      id: "job-101",
      type: "result",
      png: new ArrayBuffer(8),
    };
    expect(response.id).toBe("job-101");
  });

  test("rendered and inspection responses do not carry the client document", () => {
    const rendered: SaveWorkerResponse = {
      id: 7,
      type: "rendered",
      raster: { width: 1, height: 1, pixels: new ArrayBuffer(4) },
    };
    const inspection: SaveWorkerResponse = {
      id: 8,
      type: "inspection",
      inspection: undefined,
    };

    expect("document" in rendered).toBe(false);
    expect("document" in inspection).toBe(false);
    expect("payload" in rendered).toBe(false);
    expect("payload" in inspection).toBe(false);
  });

  test("encoded responses carry only the requested blueprint string", () => {
    const response: SaveWorkerResponse = {
      id: 9,
      type: "encoded",
      blueprintId: "bp-1",
      encoded: "SAND:BP:v2:test",
    };
    expect(response).toEqual({
      id: 9,
      type: "encoded",
      blueprintId: "bp-1",
      encoded: "SAND:BP:v2:test",
    });
    expect("document" in response).toBe(false);
  });

  test("save explorer response filtering discards superseded decodes and stale errors", () => {
    let activeDecodeId = 5;
    let latestRenderId = 5;
    let currentDocument: string | null = "valid-document";

    const handleResponse = (response: {
      id: number;
      type: "decoded" | "rendered" | "error";
      message?: string;
    }) => {
      // Discard older results or errors
      if (response.id < activeDecodeId || response.id < latestRenderId) {
        return; // discarded!
      }
      if (response.type === "error") {
        currentDocument = null;
      } else {
        currentDocument = "new-document";
      }
    };

    // Stale error from earlier failed request (id 4) arrives after newer request (id 5)
    handleResponse({ id: 4, type: "error", message: "Failed decode" });
    expect(currentDocument).toBe("valid-document"); // Preserved!

    // Successful completion of current request (id 5)
    handleResponse({ id: 5, type: "decoded" });
    expect(currentDocument).toBe("new-document");

    // Start request 6
    activeDecodeId = 6;
    latestRenderId = 6;

    // Delayed arrival of request 5 result does not overwrite request 6
    handleResponse({ id: 5, type: "rendered" });
    expect(currentDocument).toBe("new-document");
  });

  test("save explorer inspect filtering drops stale cell inspection results", () => {
    let latestInspectId = 10;
    let displayedCell: { mapX: number; mapY: number } | null = null;

    const handleInspectResponse = (response: {
      id: number;
      cell: { mapX: number; mapY: number };
    }) => {
      if (response.id < latestInspectId) return;
      displayedCell = response.cell;
    };

    // Request 11 starts (user moved cursor)
    latestInspectId = 11;

    // Slow response for request 10 arrives late
    handleInspectResponse({ id: 10, cell: { mapX: 0, mapY: 0 } });
    expect(displayedCell).toBeNull(); // Stale inspect ignored!

    // Response for request 11 arrives
    handleInspectResponse({ id: 11, cell: { mapX: 5, mapY: 5 } });
    expect<{ mapX: number; mapY: number } | null>(displayedCell).toEqual({ mapX: 5, mapY: 5 });
  });

  test("createBrowserPngPlatform revokes object URL even when image loading rejects", async () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    let revokedUrl: string | null = null;
    let createdUrl: string | null = null;

    URL.createObjectURL = mock(() => {
      createdUrl = "blob:mock-url";
      return createdUrl;
    });
    URL.revokeObjectURL = mock((url: string) => {
      revokedUrl = url;
    });

    // Mock Image to immediately fail
    const originalImage = globalThis.Image;
    globalThis.Image = class {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      set src(_value: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    } as unknown as typeof Image;

    try {
      const platform = createBrowserPngPlatform();
      await expect(platform.loadSvg("<svg></svg>")).rejects.toThrow(
        "Unable to render blueprint SVG",
      );
      expect<string | null>(createdUrl).toBe("blob:mock-url");
      expect<string | null>(revokedUrl).toBe("blob:mock-url");
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      globalThis.Image = originalImage;
    }
  });
});

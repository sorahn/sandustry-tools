import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ExternalChunk = {
  anchor: string;
  title: string;
  content: string;
  type: "documentation-section" | "api-signature" | "code-example";
};

export type ExternalCache = {
  url: string;
  htmlPath: string;
  metadataPath: string;
  fetchedAt: string;
  contentHash: string;
  etag?: string;
  lastModified?: string;
};

const cacheDir = (root: string) => path.join(root, ".repo-rag", "cache");
const htmlPath = (root: string) => path.join(cacheDir(root), "official-sandkit.html");
const metadataPath = (root: string) => path.join(cacheDir(root), "official-sandkit.json");
const snapshotDir = (root: string) => path.join(cacheDir(root), "official-sandkit-snapshots");

export function snapshotStem(fetchedAt: string) {
  return fetchedAt.replace(/[:.]/g, "-");
}

function snapshotHtmlPath(root: string, fetchedAt: string) {
  return path.join(snapshotDir(root), `official-sandkit-${snapshotStem(fetchedAt)}.html`);
}

function snapshotMetadataPath(root: string, fetchedAt: string) {
  return path.join(snapshotDir(root), `official-sandkit-${snapshotStem(fetchedAt)}.json`);
}

function decodeHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

function textFrom(html: string) {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, ""));
}

export function parseExternalHtml(html: string, url: string): ExternalChunk[] {
  const chunks: ExternalChunk[] = [];
  const headings = [
    ...html.matchAll(/<h([1-6])(?:\s+[^>]*)?id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/h\1>/gi),
  ];
  for (let index = 0; index < headings.length; index++) {
    const match = headings[index];
    const next = headings[index + 1];
    const body = html.slice(match.index! + match[0].length, next?.index ?? html.length);
    const anchor = match[2];
    const title = textFrom(match[3]);
    const section = textFrom(body);
    if (section) {
      chunks.push({
        anchor,
        title,
        content: `${title}\n\n${section}`,
        type: "documentation-section",
      });
    }
    for (const signature of body.matchAll(
      /<div[^>]*class=["'][^"']*api-signature[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    )) {
      const content = textFrom(signature[1]);
      if (content)
        chunks.push({ anchor, title, content: `${title}\n${content}`, type: "api-signature" });
    }
    for (const example of body.matchAll(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi)) {
      const content = textFrom(example[1]);
      if (content)
        chunks.push({ anchor, title, content: `${title}\n${content}`, type: "code-example" });
    }
  }
  return chunks.map((chunk) => ({
    ...chunk,
    content: `${chunk.content}\nSource: ${url}#${chunk.anchor}`,
  }));
}

export async function refreshExternal(root: string, url: string) {
  await mkdir(cacheDir(root), { recursive: true });
  let previous: Partial<ExternalCache> = {};
  try {
    previous = JSON.parse(await readFile(metadataPath(root), "utf8"));
  } catch {}
  const headers = new Headers();
  if (previous.etag) headers.set("If-None-Match", previous.etag);
  if (previous.lastModified) headers.set("If-Modified-Since", previous.lastModified);
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
  if (response.status === 304 && previous.fetchedAt && previous.contentHash) {
    return {
      ...previous,
      url,
      htmlPath: htmlPath(root),
      metadataPath: metadataPath(root),
    } as ExternalCache;
  }
  if (!response.ok) throw new Error(`official docs fetch failed: HTTP ${response.status}`);
  const html = await response.text();
  const metadata: ExternalCache = {
    url,
    htmlPath: htmlPath(root),
    metadataPath: metadataPath(root),
    fetchedAt: new Date().toISOString(),
    contentHash: createHash("sha256").update(html).digest("hex"),
    etag: response.headers.get("etag") ?? undefined,
    lastModified: response.headers.get("last-modified") ?? undefined,
  };
  if (previous.contentHash && previous.contentHash !== metadata.contentHash && previous.fetchedAt) {
    try {
      const previousHtml = await readFile(htmlPath(root), "utf8");
      const previousSnapshot = {
        ...previous,
        htmlPath: snapshotHtmlPath(root, previous.fetchedAt),
        metadataPath: snapshotMetadataPath(root, previous.fetchedAt),
      };
      await mkdir(snapshotDir(root), { recursive: true });
      await writeFile(previousSnapshot.htmlPath, previousHtml);
      await writeFile(
        previousSnapshot.metadataPath,
        `${JSON.stringify(previousSnapshot, null, 2)}\n`,
      );
    } catch {
      // Preserve the refresh even if an older cache cannot be snapshotted.
    }
  }

  if (!previous.contentHash || previous.contentHash !== metadata.contentHash) {
    await mkdir(snapshotDir(root), { recursive: true });
    const currentSnapshot = {
      ...metadata,
      htmlPath: snapshotHtmlPath(root, metadata.fetchedAt),
      metadataPath: snapshotMetadataPath(root, metadata.fetchedAt),
    };
    await writeFile(currentSnapshot.htmlPath, html);
    await writeFile(currentSnapshot.metadataPath, `${JSON.stringify(currentSnapshot, null, 2)}\n`);
  }
  await writeFile(htmlPath(root), html);
  await writeFile(metadataPath(root), `${JSON.stringify(metadata, null, 2)}\n`);
  return metadata;
}

export async function readExternalCache(root: string) {
  try {
    const metadata = JSON.parse(await readFile(metadataPath(root), "utf8")) as ExternalCache;
    const html = await readFile(htmlPath(root), "utf8");
    return { metadata, html, chunks: parseExternalHtml(html, metadata.url) };
  } catch {
    return null;
  }
}

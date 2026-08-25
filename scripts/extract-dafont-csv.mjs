import fs from "node:fs";

const input = fs.readFileSync("resources/dafont.html", "utf8");
const output = "resources/dafont-fonts.csv";

function decode(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)));
}

function text(value) {
  return decode(
    value
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function absolute(url) {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `https://www.dafont.com${url}`;
  return `https://www.dafont.com/${url.replace(/^\.\//, "")}`;
}

function csv(value) {
  const normalized = value ?? "";
  return /[",\n]/.test(normalized) ? `"${normalized.replace(/"/g, '""')}"` : normalized;
}

const cardPattern =
  /<a name="(\d+)"><\/a><div class="lv1left dfbg"><a href="([^"]+\.font)"><strong>(.*?)<\/strong><\/a>(.*?)<\/div><div class="lv1right dfbg">(.*?)<\/div><div class="lv2right[^>]*">(.*?)<\/div><div class="dlbox[^>]*>(.*?)<\/div><div style="background-image:url\(([^)]+)\)" class="preview">/g;
const rows = [];
for (const match of input.matchAll(cardPattern)) {
  const [, id, page, name, left, right, stats, download, preview] = match;
  const authorMatch = left.match(/\bby\s+<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/i);
  const downloadMatch = download.match(/href="([^"]*dl\.dafont\.com\/dl\/\?f=[^"]+)"/i);
  const sizeMatch = right.match(/\(([^)]*?\d+\s*px[^)]*?)\)/i);
  const downloadsMatch = stats.match(/([\d,]+) downloads?/i);
  const licenseMatch = stats.match(/class="[^"]*help black[^"]*"[^>]*>(.*?)<\/a>/i);
  const variantMatch = stats.match(/<\/a>\s*&nbsp;-\s*([^<]+)/i);
  rows.push({
    dafont_id: id,
    name: text(name),
    font_page_url: absolute(page),
    author: authorMatch ? text(authorMatch[2]) : "",
    author_url: authorMatch ? absolute(authorMatch[1]) : "",
    recommended_size: sizeMatch ? text(sizeMatch[1]) : "",
    license: licenseMatch ? text(licenseMatch[1]) : "",
    downloads: downloadsMatch ? downloadsMatch[1] : "",
    variant_info: variantMatch ? text(variantMatch[1]) : "",
    download_url: downloadMatch ? absolute(downloadMatch[1]) : "",
    preview_url: absolute(preview),
  });
}

if (!rows.length) throw new Error("No Dafont font cards found.");
const columns = Object.keys(rows[0]);
const csvText =
  [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csv(row[column])).join(",")),
  ].join("\n") + "\n";
fs.writeFileSync(output, csvText);
console.log(`wrote ${rows.length} fonts to ${output}`);

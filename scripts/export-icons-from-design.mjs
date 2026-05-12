#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const designPath = process.argv[2];

if (!designPath) {
  console.error("Usage: export-icons-from-design.mjs <standalone-html>");
  process.exit(1);
}

const root = process.cwd();
const trayYOffset = 2.5;
const html = readFileSync(designPath, "utf8");
const templateMatch = html.match(
  /<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/,
);

if (!templateMatch) {
  throw new Error("Could not find bundled template in design file");
}

const template = JSON.parse(templateMatch[1]);

function extractSymbol(id) {
  const symbolMatch = template.match(
    new RegExp(`<symbol id="${id}" viewBox="([^"]+)">([\\s\\S]*?)<\\/symbol>`),
  );

  if (!symbolMatch) {
    throw new Error(`Could not find SVG symbol: ${id}`);
  }

  return {
    viewBox: symbolMatch[1],
    body: normalizeSvgText(
      symbolMatch[2].trim().replaceAll("currentColor", "#000000"),
    ),
  };
}

function normalizeSvgText(value) {
  return value
    .replaceAll("\u2011", "-")
    .replaceAll("\u2014", "-")
    .replaceAll("\u00b7", "/")
    .replaceAll("\u00d7", "x");
}

function writeSvg(path, svg) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${svg}\n`);
}

function traySvg(id) {
  const symbol = extractSymbol(id);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="${symbol.viewBox}">
  <g transform="translate(0 ${trayYOffset})">
    ${symbol.body}
  </g>
</svg>`;
}

function appSvg(id) {
  const symbol = extractSymbol(id);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="${symbol.viewBox}">
  ${symbol.body}
</svg>`;
}

const outputs = [
  ["tray-conn-on", "app/src-tauri/icons/tray-icon.svg", traySvg],
  ["tray-conn-off", "app/src-tauri/icons/tray-icon-off.svg", traySvg],
  ["tray-disc-on", "app/src-tauri/icons/tray-icon-disconnected-on.svg", traySvg],
  ["tray-disc-off", "app/src-tauri/icons/tray-icon-disconnected-off.svg", traySvg],
  ["appicon", "app/app-icon.svg", appSvg],
];

for (const [id, path, render] of outputs) {
  const target = join(root, path);
  writeSvg(target, render(id));
  console.log(`wrote ${path}`);
}

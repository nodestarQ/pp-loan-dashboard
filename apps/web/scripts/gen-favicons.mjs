import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../src/lib/server/og/character/character.svg");
const OUT_DIR = resolve(__dirname, "../static/favicons");
const STAGES = 8;

const base = readFileSync(SRC, "utf8");

function setDamageVisibility(svg, n, show) {
	const idMarker = `id="damage-${n}"`;
	const idIdx = svg.indexOf(idMarker);
	if (idIdx === -1) return svg;
	const tagStart = svg.lastIndexOf("<", idIdx);
	const tagEnd = svg.indexOf(">", idIdx);
	if (tagStart === -1 || tagEnd === -1) return svg;
	const head = svg.slice(0, tagStart);
	const tag = svg.slice(tagStart, tagEnd + 1);
	const tail = svg.slice(tagEnd + 1);
	const next = show ? "inline" : "none";
	return head + tag.replace(/display:(inline|none)/, `display:${next}`) + tail;
}

function atLevel(svg, level) {
	let out = svg;
	for (let n = 1; n <= STAGES; n++) out = setDamageVisibility(out, n, n <= level);
	return out;
}

mkdirSync(OUT_DIR, { recursive: true });
for (let level = 0; level <= STAGES; level++) {
	const out = resolve(OUT_DIR, `huddle-${level}.svg`);
	writeFileSync(out, atLevel(base, level));
	console.log(`wrote ${out}`);
}

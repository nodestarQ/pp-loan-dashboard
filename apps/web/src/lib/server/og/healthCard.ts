import { read } from "$app/server";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { html as toSatoriHtml } from "satori-html";

import { PPG_TOTAL_SUPPLY } from "@pp/shared";

import { deriveHealth } from "$lib/health";

import characterSvgUrl from "./character/character.svg?url";
import nunitoBoldUrl from "./fonts/Nunito-Bold.ttf?url";
import nunitoExtraBoldUrl from "./fonts/Nunito-ExtraBold.ttf?url";
import nunitoRegularUrl from "./fonts/Nunito-Regular.ttf?url";

export interface HealthCardProps {
	active: number;
	borrowers: number;
	lenders: number;
	goalTarget: number;
	total?: number;
}

type SatoriFont = Parameters<typeof satori>[1]["fonts"][number];

const DAMAGE_STAGES = 8;

let fontsPromise: Promise<SatoriFont[]> | null = null;
async function loadFonts(): Promise<SatoriFont[]> {
	if (!fontsPromise) {
		fontsPromise = Promise.all([
			read(nunitoRegularUrl).arrayBuffer(),
			read(nunitoBoldUrl).arrayBuffer(),
			read(nunitoExtraBoldUrl).arrayBuffer(),
		]).then(([regular, bold, extraBold]) => [
			{ name: "Nunito", data: regular, weight: 400, style: "normal" },
			{ name: "Nunito", data: bold, weight: 700, style: "normal" },
			{ name: "Nunito", data: extraBold, weight: 800, style: "normal" },
		]);
	}
	return fontsPromise;
}

let characterSvgPromise: Promise<string> | null = null;
async function loadCharacterSvg(): Promise<string> {
	if (!characterSvgPromise) {
		characterSvgPromise = read(characterSvgUrl).text();
	}
	return characterSvgPromise;
}

// Cumulative damage: at level N, groups id="damage-1" through id="damage-N"
// stay visible, the rest are hidden. Mirrors the Rive overlay behaviour in
// PainguClicker.svelte so the OG card matches the live character.
function characterSvgAtLevel(svg: string, level: number): string {
	let out = svg;
	for (let n = 1; n <= DAMAGE_STAGES; n++) {
		out = setDamageVisibility(out, n, n <= level);
	}
	return out;
}

function setDamageVisibility(
	svg: string,
	n: number,
	show: boolean,
): string {
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
	const updated = tag.replace(/display:(inline|none)/, `display:${next}`);
	return head + updated + tail;
}

export async function renderHealthCardPng(
	props: HealthCardProps,
): Promise<Buffer> {
	const [fonts, baseSvg] = await Promise.all([
		loadFonts(),
		loadCharacterSvg(),
	]);
	const total = props.total ?? PPG_TOTAL_SUPPLY;
	const h = deriveHealth(props.active, props.goalTarget, total);
	const damageLevel = Math.min(
		DAMAGE_STAGES,
		Math.max(0, Math.floor(h.damageRatio * DAMAGE_STAGES)),
	);
	const characterSvg = characterSvgAtLevel(baseSvg, damageLevel);
	const characterDataUrl = `data:image/svg+xml;base64,${Buffer.from(characterSvg).toString("base64")}`;

	const markup = toSatoriHtml(buildHtml(props, h, characterDataUrl));
	const svg = await satori(markup, { width: 1200, height: 630, fonts });
	return Buffer.from(
		new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
			.render()
			.asPng(),
	);
}

function buildHtml(
	props: HealthCardProps,
	h: ReturnType<typeof deriveHealth>,
	characterDataUrl: string,
): string {
	const drift =
		h.aboveBy > 0
			? `${h.aboveBy} over the line`
			: h.belowBy > 0
				? `${h.belowBy} under the line`
				: "On the line";

	return `
		<div style="display:flex;flex-direction:column;width:100%;height:100%;padding:36px;background:linear-gradient(135deg,#7fd0f5 0%,#a7e2f6 100%);font-family:Nunito;color:#1c2b36;">
			<div style="display:flex;flex-direction:column;flex:1;background:#ffffff;border-radius:28px;padding:40px 56px;box-shadow:0 20px 50px -12px rgba(28,43,54,0.18);">
				<div style="display:flex;justify-content:space-between;align-items:flex-start;">
					<div style="display:flex;flex-direction:column;flex:1;">
						<div style="display:flex;align-items:center;padding:6px 16px;border-radius:9999px;background:${withAlpha(h.statusColor, 0.12)};color:${h.statusColor};font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:2px;align-self:flex-start;">
							${h.statusLabel}
						</div>
						<div style="font-size:14px;font-weight:700;letter-spacing:3px;color:#2e4e8c;text-transform:uppercase;margin-top:14px;">Pudgy Penguins</div>
						<div style="font-size:40px;font-weight:800;color:#1c2b36;margin-top:2px;line-height:1.1;">Huddle Health</div>

						<div style="display:flex;margin-top:24px;">
							${stat(props.borrowers, "Borrowers")}
							${statDivider()}
							${stat(props.active, "Active Loans")}
							${statDivider()}
							${stat(props.lenders, "Lenders")}
						</div>
					</div>
					<img src="${characterDataUrl}" style="width:240px;height:240px;margin-left:24px;flex-shrink:0;" />
				</div>

				<div style="display:flex;flex-direction:column;margin-top:24px;">
					<div style="display:flex;font-size:28px;font-weight:800;color:${h.rallyToneColor};line-height:1.2;">
						${escapeHtml(h.rallyText)}
					</div>
					<div style="display:flex;font-size:16px;font-weight:600;color:#6b7f8e;margin-top:6px;">
						${escapeHtml(drift)} · ${h.pct.toFixed(2)}% of supply
					</div>
				</div>

				${bar(h.currentPct, h.targetPct, props.active, props.goalTarget)}

				<div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:16px;">
					<div style="display:flex;font-size:16px;font-weight:700;color:#2e4e8c;">huddle.pudgypenguins</div>
					<div style="display:flex;font-size:16px;font-weight:700;color:#6b7f8e;">Rally the HUDDLE</div>
				</div>
			</div>
		</div>
	`;
}

function stat(value: number, label: string): string {
	return `
		<div style="display:flex;flex-direction:column;align-items:flex-start;flex:1;">
			<div style="font-size:56px;font-weight:800;color:#1c2b36;line-height:1;font-variant-numeric:tabular-nums;">${value}</div>
			<div style="font-size:14px;font-weight:700;color:#6b7f8e;text-transform:uppercase;letter-spacing:2px;margin-top:6px;">${label}</div>
		</div>
	`;
}

function statDivider(): string {
	return `<div style="display:flex;width:1px;background:#c9dce8;margin:0 16px;"></div>`;
}

function bar(
	currentPct: number,
	targetPct: number,
	active: number,
	goalTarget: number,
): string {
	const showCurrentLabel = active !== goalTarget;
	return `
		<div style="display:flex;flex-direction:column;margin-top:20px;">
			<div style="display:flex;position:relative;width:100%;height:18px;background:#f4fafe;border:1px solid #c9dce8;border-radius:9999px;overflow:hidden;">
				<div style="display:flex;width:${currentPct}%;height:100%;background:linear-gradient(to right,#10B981 0%,#F59E0B ${targetPct}%,#DC2626 100%);background-size:${currentPct > 0 ? (10000 / currentPct).toFixed(2) : 100}% 100%;border-radius:9999px;"></div>
				<div style="display:flex;position:absolute;top:0;bottom:0;left:${targetPct}%;width:3px;background:#1c2b36;"></div>
			</div>
			<div style="display:flex;position:relative;width:100%;height:22px;margin-top:6px;font-size:14px;font-weight:700;color:#6b7f8e;font-variant-numeric:tabular-nums;">
				<div style="display:flex;position:absolute;left:0;top:0;">0</div>
				<div style="display:flex;position:absolute;left:${targetPct}%;top:0;transform:translateX(-50%);">${goalTarget}</div>
				${
					showCurrentLabel
						? `<div style="display:flex;position:absolute;left:${currentPct}%;top:0;transform:translateX(-50%);color:#1c2b36;font-weight:800;">${active}</div>`
						: ""
				}
			</div>
		</div>
	`;
}

function withAlpha(hex: string, alpha: number): string {
	const m = /^#([0-9a-f]{6})$/i.exec(hex);
	if (!m) return hex;
	const n = parseInt(m[1], 16);
	const r = (n >> 16) & 0xff;
	const g = (n >> 8) & 0xff;
	const b = n & 0xff;
	return `rgba(${r},${g},${b},${alpha})`;
}

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

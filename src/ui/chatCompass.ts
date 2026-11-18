/** Freyas Better Maps — CRABS-style map compass for float-chat / Members hover */
import { FBM } from "../fbm";

declare const ChatRoomMapViewIsActive: (() => boolean) | undefined;
declare const ChatRoomMapViewPerceptionRange: number | undefined;
declare const ChatRoomMapViewWidth: number | undefined;
declare const ChatRoomMapViewVisibilityMask: boolean[] | undefined;
declare const ChatRoomMapViewCharacterIsVisible: ((c: unknown) => boolean) | undefined;
declare const ChatRoomCharacter: Array<{
	MemberNumber?: number;
	LabelColor?: string;
	MapData?: { Pos?: { X: number; Y: number } };
	ActivePose?: string | string[];
	Pose?: string | string[];
}> | undefined;
declare const Player: {
	MemberNumber?: number;
	MapData?: { Pos?: { X: number; Y: number } };
} | undefined;
/** Club R133+: MainCanvas is usually the 2d context; older builds used the element. */
declare const MainCanvas: (CanvasRenderingContext2D & { canvas?: HTMLCanvasElement; getContext?: unknown }) | HTMLCanvasElement | undefined;
declare const MapManager:
	| {
			Map?: {
				isTileVisible?: (x: number | { X: number; Y: number }, y?: number) => boolean;
			};
	  }
	| undefined;

let hoveredMember: number | null = null;

/**
 * Resolve Club's draw context. R133/R134 expose `MainCanvas` as CanvasRenderingContext2D
 * (see FBM map hooks / getMainCanvasEl). Calling getContext on that returns null and
 * silently kills the compass while hover still works.
 */
function getMainCanvasCtx(): CanvasRenderingContext2D | null {
	try {
		if (typeof MainCanvas !== "undefined" && MainCanvas) {
			const mc = MainCanvas as CanvasRenderingContext2D & {
				canvas?: HTMLCanvasElement;
				getContext?: (type: string) => CanvasRenderingContext2D | null;
				save?: unknown;
				beginPath?: unknown;
			};
			if (typeof mc.save === "function" && typeof mc.beginPath === "function") {
				return mc as CanvasRenderingContext2D;
			}
			if (typeof mc.getContext === "function") {
				const ctx = mc.getContext("2d");
				if (ctx) return ctx;
			}
		}
		const el =
			typeof FBM.getMainCanvasEl === "function"
				? FBM.getMainCanvasEl()
				: document.getElementById("MainCanvas");
		if (el && typeof el.getContext === "function") return el.getContext("2d");
	} catch (e) {
		/* ignore */
	}
	return null;
}

function syncMembersCompassHighlight(mn: number | null) {
	try {
		const list = document.getElementById("fbm-fc-members-list");
		if (!list) return;
		const rows = list.querySelectorAll(".fbm-fc-mem-row");
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const rowMn = Number(row.getAttribute("data-mn"));
			if (mn != null && rowMn === mn) row.classList.add("fbm-fc-mem-compass-hot");
			else row.classList.remove("fbm-fc-mem-compass-hot");
		}
	} catch (e) {
		/* ignore */
	}
}

FBM.setFloatChatCompassTarget = function (memberNumber: number | null) {
	const n = memberNumber != null ? Number(memberNumber) : NaN;
	hoveredMember = Number.isFinite(n) && n > 0 ? n : null;
	syncMembersCompassHighlight(hoveredMember);
	if (FBM._compassDebugLog) {
		console.info("[FBM compass] target →", hoveredMember);
	}
};

FBM.clearFloatChatCompassTarget = function () {
	hoveredMember = null;
	syncMembersCompassHighlight(null);
	if (FBM._compassDebugLog) {
		console.info("[FBM compass] target cleared");
	}
};

FBM.getFloatChatCompassTarget = function () {
	return hoveredMember;
};

function colorBrightness(color: string): number {
	try {
		const ctx = document.createElement("canvas").getContext("2d");
		if (!ctx) return 128;
		ctx.fillStyle = color;
		const hex = String(ctx.fillStyle || "");
		if (hex.startsWith("#") && hex.length === 7) {
			const r = parseInt(hex.slice(1, 3), 16);
			const g = parseInt(hex.slice(3, 5), 16);
			const b = parseInt(hex.slice(5, 7), 16);
			return (r * 299 + g * 587 + b * 114) / 1000;
		}
		const rgb = /rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(hex);
		if (rgb) {
			const r = Number(rgb[1]);
			const g = Number(rgb[2]);
			const b = Number(rgb[3]);
			return (r * 299 + g * 587 + b * 114) / 1000;
		}
	} catch (e) {
		/* ignore */
	}
	return 128;
}

/** Nordic spearhead arrow (barrel-roll + shine/shadow). Tip at +X. */
function drawIndicator(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	angle: number,
	scale: number,
	color: string,
	isDark: boolean
) {
	const now = Date.now();
	ctx.save();
	try {
		ctx.translate(x, y);
		ctx.rotate(angle);
		const rollFactor = Math.sin(now / 500);
		const absRoll = Math.abs(rollFactor);
		const sign = Math.sign(rollFactor) || 1;
		const renderScaleY = Math.max(absRoll, 0.1) * sign;
		ctx.scale(scale, scale * renderScaleY);
		ctx.beginPath();
		ctx.moveTo(24, 0);
		ctx.lineTo(2, -13);
		ctx.lineTo(-4, -6);
		ctx.lineTo(-18, -10);
		ctx.lineTo(-16, 0);
		ctx.lineTo(-18, 10);
		ctx.lineTo(-4, 6);
		ctx.lineTo(2, 13);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();

		if (rollFactor > 0) {
			ctx.save();
			ctx.clip();
			const sweepX = Math.cos(now / 500) * 30;
			ctx.translate(sweepX, 0);
			const shineGrad = ctx.createLinearGradient(-10, 0, 10, 0);
			shineGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
			shineGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
			shineGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
			ctx.fillStyle = shineGrad;
			ctx.fillRect(-40, -20, 80, 40);
			ctx.restore();
		} else {
			ctx.fillStyle = "rgba(0, 0, 0, " + absRoll * 0.4 + ")";
			ctx.fill();
		}

		ctx.strokeStyle = isDark ? "#fff" : "#111";
		ctx.lineWidth = 1.5 / scale + (1 - absRoll) * 2.5;
		ctx.stroke();
	} finally {
		ctx.restore();
	}
}

function poseHeadScale(target: {
	ActivePose?: string | string[];
	Pose?: string | string[];
}): number {
	const activePoses = target.ActivePose || target.Pose || [];
	const poseStr = Array.isArray(activePoses) ? activePoses.join(" ") : String(activePoses);
	if (poseStr.includes("Lay") || poseStr.includes("Sleep") || poseStr.includes("Hogtied")) {
		return 0.35;
	}
	if (poseStr.includes("AllFours")) return 0.5;
	if (poseStr.includes("Kneel")) return 0.75;
	return 1.0;
}

function perceptionRange(): number {
	if (typeof ChatRoomMapViewPerceptionRange === "number" && isFinite(ChatRoomMapViewPerceptionRange)) {
		return ChatRoomMapViewPerceptionRange;
	}
	if (typeof FBM.mapPerceptionRange === "function") return FBM.mapPerceptionRange();
	return 7;
}

/**
 * R133: VisibilityMask is deprecated and stays empty — prefer CharacterIsVisible / Map.isTileVisible.
 * Fall back to in-range only when no modern visibility API exists.
 */
function targetIsOnScreenVisible(
	target: { MapData?: { Pos?: { X: number; Y: number } } },
	deltaX: number,
	deltaY: number,
	range: number
): boolean {
	if (typeof ChatRoomMapViewCharacterIsVisible === "function") {
		try {
			return !!ChatRoomMapViewCharacterIsVisible(target);
		} catch (e) {
			/* fall through */
		}
	}
	try {
		const pos = target.MapData && target.MapData.Pos;
		const isTile = MapManager && MapManager.Map && typeof MapManager.Map.isTileVisible === "function"
			? MapManager.Map.isTileVisible
			: null;
		if (pos && isTile) {
			return !!isTile(pos.X, pos.Y) || !!isTile(pos);
		}
	} catch (e2) {
		/* fall through */
	}
	const mask =
		typeof ChatRoomMapViewVisibilityMask !== "undefined" ? ChatRoomMapViewVisibilityMask : null;
	if (mask && mask.length > 0) {
		const mapWidth =
			typeof ChatRoomMapViewWidth === "number" && isFinite(ChatRoomMapViewWidth)
				? ChatRoomMapViewWidth
				: 0;
		if (!(mapWidth > 0) || !target.MapData || !target.MapData.Pos) return false;
		const tileIndex = target.MapData.Pos.X + target.MapData.Pos.Y * mapWidth;
		return Math.abs(deltaX) <= range && Math.abs(deltaY) <= range && !!mask[tileIndex];
	}
	return Math.abs(deltaX) <= range && Math.abs(deltaY) <= range;
}

function drawCompass() {
	try {
		const cfg = FBM.settings && FBM.settings.floatChat;
		if (!cfg || !cfg.mapCompass) return;
		if (!hoveredMember) return;
		if (typeof ChatRoomMapViewIsActive !== "function" || !ChatRoomMapViewIsActive()) return;
		if (typeof Player === "undefined" || !Player || !Player.MapData || !Player.MapData.Pos) return;
		if (typeof ChatRoomCharacter === "undefined" || !Array.isArray(ChatRoomCharacter)) return;

		const target = ChatRoomCharacter.find((c) => c && c.MemberNumber === hoveredMember);
		if (!target || !target.MapData || !target.MapData.Pos) return;

		const ctx = getMainCanvasCtx();
		if (!ctx) return;

		const rect =
			typeof FBM.mapViewRect === "function"
				? FBM.mapViewRect()
				: { Left: 0, Top: 0, Width: 1000, Height: 1000 };
		const mapLeft = rect.Left;
		const mapTop = rect.Top;
		const mapW = rect.Width;
		const mapH = rect.Height;

		const deltaX = target.MapData.Pos.X - Player.MapData.Pos.X;
		const deltaY = target.MapData.Pos.Y - Player.MapData.Pos.Y;
		const range = perceptionRange();
		const onScreen = targetIsOnScreenVisible(target, deltaX, deltaY, range);

		const scale = 0.66;
		let arrowX: number;
		let arrowY: number;
		let angle: number;

		if (onScreen) {
			const screen =
				typeof FBM.mapScreenFromTile === "function"
					? FBM.mapScreenFromTile(
							target.MapData.Pos.X,
							target.MapData.Pos.Y,
							mapLeft,
							mapTop,
							mapW,
							mapH
						)
					: null;
			if (!screen) return;
			const tileW = screen.TileWidth || screen.TileSize || 50;
			const tileH = screen.TileHeight || screen.TileSize || tileW;
			const poseScale = poseHeadScale(target);
			const tileCx = screen.Left + tileW / 2;
			const tileBottom = screen.Top + tileH;
			const headY = tileBottom - tileH * 1.67 * poseScale;
			angle = Math.PI / 2;
			arrowX = tileCx;
			arrowY = headY - 20 * scale - 5;
		} else {
			angle = Math.atan2(deltaY, deltaX);
			const cx = mapLeft + mapW / 2;
			const cy = mapTop + mapH / 2;
			const radius = Math.min(mapW, mapH) * 0.45;
			arrowX = cx + Math.cos(angle) * radius;
			arrowY = cy + Math.sin(angle) * radius;
		}

		const playerColor = target.LabelColor || "cyan";
		const isDark = colorBrightness(playerColor) < 128;
		drawIndicator(ctx, arrowX, arrowY, angle, scale, playerColor, isDark);
		if (FBM._compassDebugLog) {
			FBM._compassLastDraw = {
				at: Date.now(),
				mn: hoveredMember,
				mode: onScreen ? "head" : "edge",
				x: arrowX,
				y: arrowY,
			};
		}
	} catch (e) {
		if (FBM._compassDebugLog) console.warn("[FBM compass] draw error", e);
	}
}

FBM.drawFloatChatCompass = function () {
	drawCompass();
};

/** Console: `FBM.compassDebug()` — shows whether hover/target/draw path is alive. */
FBM.compassDebug = function () {
	const cfg = FBM.settings && FBM.settings.floatChat;
	const mapActive =
		typeof ChatRoomMapViewIsActive === "function" ? !!ChatRoomMapViewIsActive() : false;
	const hooks = FBM._hookState || {};
	let targetInfo: Record<string, unknown> | null = null;
	let mode = "idle";
	if (!cfg || !cfg.mapCompass) mode = "skipped:mapCompass off";
	else if (!hoveredMember) mode = "skipped:no hover target";
	else if (!mapActive) mode = "skipped:not on map view";
	else if (typeof ChatRoomCharacter === "undefined" || !Array.isArray(ChatRoomCharacter)) {
		mode = "skipped:no ChatRoomCharacter";
	} else {
		const target = ChatRoomCharacter.find((c) => c && c.MemberNumber === hoveredMember);
		if (!target) mode = "skipped:target not in room";
		else if (!target.MapData || !target.MapData.Pos) mode = "skipped:target has no MapData.Pos";
		else if (!Player || !Player.MapData || !Player.MapData.Pos) mode = "skipped:Player has no MapData.Pos";
		else {
			const deltaX = target.MapData.Pos.X - Player.MapData.Pos.X;
			const deltaY = target.MapData.Pos.Y - Player.MapData.Pos.Y;
			const range = perceptionRange();
			const onScreen = targetIsOnScreenVisible(target, deltaX, deltaY, range);
			mode = onScreen ? "would draw:head" : "would draw:edge";
			targetInfo = {
				mn: target.MemberNumber,
				pos: { ...target.MapData.Pos },
				delta: { x: deltaX, y: deltaY },
				range: range,
				onScreen: onScreen,
				labelColor: target.LabelColor || null,
			};
		}
	}
	const ctx = getMainCanvasCtx();
	const mainKind =
		typeof MainCanvas === "undefined" || !MainCanvas
			? "missing"
			: typeof (MainCanvas as { save?: unknown }).save === "function"
				? "context2d"
				: typeof (MainCanvas as { getContext?: unknown }).getContext === "function"
					? "element"
					: typeof MainCanvas;
	const out = {
		enabled: !!(cfg && cfg.mapCompass),
		hovered: hoveredMember,
		mapActive: mapActive,
		hookChatRoomRun: !!hooks.floatChatCompassRun,
		hookMapDrawUi: !!hooks.floatChatCompassMapUi,
		mainCanvasKind: mainKind,
		ctxOk: !!ctx,
		playerPos: Player && Player.MapData && Player.MapData.Pos ? { ...Player.MapData.Pos } : null,
		target: targetInfo,
		mode: mode,
		lastDraw: FBM._compassLastDraw || null,
		tip: "Hover a Members row with mapCompass on, then call FBM.compassDebug() again. Enable logs: FBM._compassDebugLog = true",
	};
	console.info("[FBM compassDebug]", out);
	return out;
};

FBM.installFloatChatCompass = function () {
	/* End of ChatRoomRun so arrow draws above characters. */
	const runOk = FBM.tryHook(
		"floatChatCompassRun",
		"ChatRoomRun",
		20,
		function (args: unknown[], next: (a?: unknown[]) => unknown) {
			const ret = next(args);
			try {
				drawCompass();
			} catch (e) {
				/* ignore */
			}
			return ret;
		}
	);
	/* Backup after map UI draw when chat is collapsed. */
	const uiOk = FBM.tryHook(
		"floatChatCompassMapUi",
		"ChatRoomViews.Map.DrawUi",
		30,
		function (args: unknown[], next: (a?: unknown[]) => unknown) {
			const ret = next(args);
			try {
				drawCompass();
			} catch (e) {
				/* ignore */
			}
			return ret;
		}
	);
	if (FBM._compassDebugLog) {
		console.info("[FBM compass] install hooks", { runOk: !!runOk, uiOk: !!uiOk });
	}
	return !!(runOk || uiOk);
};

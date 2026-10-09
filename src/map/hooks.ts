/** Freyas Better Maps — map/hooks.js */
import { FBM } from "../fbm";

FBM._toolbarExpanded = false;
FBM._zoomApplied = false;
FBM._prevZoomMax = null;
FBM._buildBarOpen = false;

/**
 * Collapsed: + at (10,10), FBM under it at (10,52).
 * Expanded: − / FBM placed from live panel DOM (see computeMapChromeLayout).
 */
FBM.TOOLBAR_PLUS = { x: 10, y: 10, w: 36, h: 36 };
FBM.TOOLBAR_FBM_COLLAPSED = { x: 10, y: 52, w: 36, h: 36 };
FBM.TOOLBAR_BTN = 36;
FBM.TOOLBAR_STACK_GAP = 6;
/** Expanded − sits lower than + so it clears the floating build bar. */
FBM.TOOLBAR_COLLAPSE_Y = 58;
/** Fallback when panel DOM is missing (Club logical coords). */
FBM.TOOLBAR_COLLAPSE = { x: 80, y: 10, w: 36, h: 36 };
FBM.TOOLBAR_FBM_EXPANDED = { x: 80, y: 52, w: 36, h: 36 };
FBM.TOOLBAR_FBM_PANEL = { x: 80, y: 10, w: 36, h: 36 };

function fillMask(mask) {
	if (mask == null) return false;
	if (typeof mask.fill === "function") mask.fill(true);
	else for (let i = 0; i < mask.length; i++) mask[i] = true;
	return true;
}

function mouseInRect(r) {
	return r && typeof MouseIn === "function" && MouseIn(r.x, r.y, r.w, r.h);
}

function cloneRect(r) {
	return r ? { x: r.x, y: r.y, w: r.w, h: r.h } : null;
}

function elVisible(el) {
	if (!el || !el.getBoundingClientRect) return false;
	const st = window.getComputedStyle(el);
	if (st.display === "none" || st.visibility === "hidden" || Number(st.opacity) === 0) return false;
	const r = el.getBoundingClientRect();
	return r.width > 2 && r.height > 2;
}

/**
 * Place − / FBM beside the Club HTML panel.
 * Narrow (no edit mode / items hidden): tuck next to the left button strip.
 * Fully open (data-edit-mode or wide items): sit clear of the grey panel + shadow,
 * Y aligned with the search field top.
 */
FBM.computeMapChromeLayout = function () {
	const btn = FBM.TOOLBAR_BTN || 36;
	const gap = FBM.TOOLBAR_STACK_GAP || 6;
	const plus = cloneRect(FBM.TOOLBAR_PLUS);
	const fbmCollapsed = cloneRect(FBM.TOOLBAR_FBM_COLLAPSED);

	if (FBM.toolbarShouldHide()) {
		const layout = { plus: plus, collapse: null, fbm: fbmCollapsed, fullyOpen: false };
		FBM._mapChromeLayout = layout;
		return layout;
	}

	const canvas =
		typeof FBM.getMainCanvasEl === "function"
			? FBM.getMainCanvasEl()
			: document.getElementById("MainCanvas");
	const panel = document.getElementById(FBM.MAP_EDITOR_PANEL_ID || "chat-room-map-view-panel");
	const search = document.getElementById("chat-room-map-view-panel-search");
	const buttons = document.getElementById("chat-room-map-view-panel-buttons-list");

	let collapse = cloneRect(FBM.TOOLBAR_COLLAPSE);
	let fbm = cloneRect(FBM.TOOLBAR_FBM_EXPANDED);
	let fullyOpen = false;

	if (canvas && panel && elVisible(panel) && !panel.classList.contains("fbm-panel-collapsed")) {
		const cr = canvas.getBoundingClientRect();
		if (cr.width > 1 && cr.height > 1) {
			const sx = 2000 / cr.width;
			const sy = 1000 / cr.height;
			const toClub = function (clientX, clientY) {
				return {
					x: (clientX - cr.left) * sx,
					y: (clientY - cr.top) * sy,
				};
			};

			/* Club sets data-edit-mode when tile/object/effect picker (search + items) is open. */
			fullyOpen =
				panel.hasAttribute("data-edit-mode") ||
				(typeof ChatRoomMapViewEditMode !== "undefined" && !!ChatRoomMapViewEditMode);

			const pr = panel.getBoundingClientRect();
			const br = elVisible(buttons) ? buttons.getBoundingClientRect() : null;
			let edgeClient;
			let padClient;
			let topClient;

			if (fullyOpen) {
				/* Full picker: right of grey panel, Y with search field. */
				edgeClient = pr.right;
				padClient = 16;
				topClient = elVisible(search) ? search.getBoundingClientRect().top : pr.top + 4;
			} else {
				/* Menu closed: beside tool strip, level with the first Club button (not the list padding). */
				const firstBtn =
					buttons &&
					(buttons.querySelector("button") ||
						buttons.querySelector("[role='button']") ||
						buttons.firstElementChild);
				const fr = firstBtn && elVisible(firstBtn) ? firstBtn.getBoundingClientRect() : null;
				edgeClient = fr ? fr.right : br ? br.right : pr.left + 68;
				padClient = 12;
				topClient = fr ? fr.top : br ? br.top : pr.top + 2;
			}

			const club = toClub(edgeClient + padClient, topClient);
			let x = Math.round(club.x);
			/* Below the floating build bar (higher than collapsed +). */
			let y = FBM.TOOLBAR_COLLAPSE_Y != null ? FBM.TOOLBAR_COLLAPSE_Y : 58;
			if (fullyOpen) {
				/* Extra Club units past panel right so the grey box-shadow never clips the − */
				x = Math.max(x, Math.round(toClub(pr.right, topClient).x + 22));
				if (elVisible(search)) {
					const searchY = Math.round(toClub(0, search.getBoundingClientRect().top).y);
					/* Prefer search top, but never sit under the build bar. */
					y = Math.max(y, searchY);
				}
			} else {
				/* Nudge right of the strip. */
				x = Math.max(88, Math.min(x + 6, 130));
			}

			collapse = { x: x, y: y, w: btn, h: btn };
			fbm = { x: x, y: y + btn + gap, w: btn, h: btn };
		}
	}

	const m = FBM.mapBag();
	const showCollapse = !!(m.hideBuildToolbar && FBM._toolbarExpanded);
	if (!showCollapse) {
		/* No − : FBM occupies the top slot of the side column. */
		fbm = collapse ? { x: collapse.x, y: collapse.y, w: btn, h: btn } : cloneRect(FBM.TOOLBAR_FBM_PANEL);
		collapse = null;
	}

	const layout = { plus: plus, collapse: collapse, fbm: fbm, fullyOpen: fullyOpen };
	FBM._mapChromeLayout = layout;
	return layout;
};

function fbmToolsRect() {
	const layout = FBM._mapChromeLayout || FBM.computeMapChromeLayout();
	if (layout && layout.fbm) return layout.fbm;
	if (FBM.toolbarShouldHide()) return FBM.TOOLBAR_FBM_COLLAPSED;
	return FBM.TOOLBAR_FBM_PANEL;
}

function collapseRect() {
	const layout = FBM._mapChromeLayout || FBM.computeMapChromeLayout();
	return layout && layout.collapse ? layout.collapse : FBM.TOOLBAR_COLLAPSE;
}

/* ---------- typing ---------- */

FBM.mapDrawTypingIndicators = function (Left, Top, Width, Height) {
	const m = FBM.mapBag();
	if (!m.typingIndicator) return 0;
	if (!Player || !Player.MapData || !Player.MapData.Pos) return 0;
	if (typeof ChatRoomCharacter === "undefined" || !ChatRoomCharacter) return 0;
	Left = Number(Left) || 0;
	Top = Number(Top) || 0;
	Width = Number(Width) || 1000;
	Height = Number(Height) || 1000;
	const range = FBM.mapPerceptionRange();
	const span = range * 2 + 1;
	const TileWidth = Width / span;
	const TileHeight = Height / span;
	const px = Player.MapData.Pos.X;
	const py = Player.MapData.Pos.Y;
	const frame = FBM.mapTalkFrame();
	const icon = FBM.mapTalkIconPath(frame);
	const size = FBM.mapTalkSize(TileWidth);
	let drawn = 0;
	ChatRoomCharacter.forEach(function (C) {
		if (!FBM.mapShouldDrawTalk(C)) return;
		if (!C.MapData || !C.MapData.Pos) return;
		if (!FBM.mapCharVisible(C)) return;
		const X = C.MapData.Pos.X;
		const Y = C.MapData.Pos.Y;
		const ScreenX = (X - px) * TileWidth + range * TileWidth;
		const ScreenY = (Y - py) * TileHeight + range * TileWidth;
		const CharX = Left + ScreenX + TileWidth * 0.05;
		const CharY = Top + ScreenY - TileHeight * 0.85;
		const zoom = (TileHeight * 1.8) / 1000;
		const bx = CharX + 250 * zoom - size.w / 2;
		const by = CharY - size.h - 4 * size.scale;
		if (typeof DrawImageResize === "function") DrawImageResize(icon, bx, by, size.w, size.h);
		drawn += 1;
	});
	return drawn;
};

/* ---------- grid ---------- */

FBM.mapDrawGridOverlay = function (Left, Top, Width, Height) {
	const m = FBM.mapBag();
	if (!m.buildingTools || !m.gridOn) return;
	if (!Player || !Player.MapData || !Player.MapData.Pos) return;
	if (typeof DrawEmptyRect !== "function" && typeof DrawRect !== "function") return;
	const range = FBM.mapPerceptionRange();
	const span = range * 2 + 1;
	const TileWidth = Width / span;
	const TileHeight = Height / span;
	const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
	const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
	const px = Player.MapData.Pos.X;
	const py = Player.MapData.Pos.Y;
	const xMin = Math.max(0, px - range);
	const xMax = Math.min(w - 1, px + range);
	const yMin = Math.max(0, py - range);
	const yMax = Math.min(h - 1, py + range);
	const midX = Math.floor(w / 2);
	const midY = Math.floor(h / 2);

	function vline(worldX, color, thick) {
		if (worldX < xMin || worldX > xMax) return;
		const sx = Left + (worldX - px) * TileWidth + range * TileWidth;
		if (typeof DrawRect === "function") DrawRect(sx, Top, thick || 1, Height, color);
	}
	function hline(worldY, color, thick) {
		if (worldY < yMin || worldY > yMax) return;
		const sy = Top + (worldY - py) * TileHeight + range * TileWidth;
		if (typeof DrawRect === "function") DrawRect(Left, sy, Width, thick || 1, color);
	}

	for (let x = 0; x < w; x += 5) vline(x, "rgba(255,255,255,0.22)", 1);
	for (let y = 0; y < h; y += 5) hline(y, "rgba(255,255,255,0.22)", 1);
	vline(midX, "rgba(212,160,23,0.55)", 2);
	hline(midY, "rgba(212,160,23,0.55)", 2);
};

/* ---------- blindfold ---------- */

FBM.mapIsMaxBlind = function () {
	if (!Player || typeof Player.GetBlindLevel !== "function") return false;
	return Player.GetBlindLevel() >= 3;
};

/** Club map avatar placement for a tile at (dx,dy) from player. */
FBM.mapCharDrawPos = function (Left, Top, TileWidth, TileHeight, range, dx, dy) {
	const ScreenX = Left + dx * TileWidth + range * TileWidth;
	const ScreenY = Top + dy * TileHeight + range * TileWidth;
	return {
		x: ScreenX + TileWidth * 0.05,
		y: ScreenY - TileHeight * 0.85,
		zoom: (TileHeight * 1.8) / 1000,
	};
};

FBM.mapDrawCharacterGrey = function (C, x, y, zoom) {
	if (typeof DrawCharacter !== "function" || !C) return;
	const canvas = typeof MainCanvas !== "undefined" ? MainCanvas : null;
	const prev = canvas && canvas.filter != null ? canvas.filter : "none";
	try {
		if (canvas) canvas.filter = "grayscale(100%) brightness(0.65)";
		DrawCharacter(C, x, y, zoom);
	} finally {
		if (canvas) canvas.filter = prev || "none";
	}
};

/**
 * Procedural standing silhouette in Club character canvas space (500×1000),
 * placed at the same anchor as DrawCharacter(x, y, zoom).
 */
FBM.mapDrawGenericSilhouette = function (x, y, zoom) {
	const ctx = typeof MainCanvas !== "undefined" ? MainCanvas : null;
	if (!ctx || typeof ctx.beginPath !== "function") return;
	zoom = Number(zoom) || 1;
	const z = zoom;
	const ox = x;
	const oy = y;
	const fill = "#6e6e6e";
	ctx.save();
	try {
		ctx.fillStyle = fill;
		ctx.beginPath();
		/* head */
		ctx.ellipse(ox + 250 * z, oy + 110 * z, 55 * z, 70 * z, 0, 0, Math.PI * 2);
		ctx.fill();
		/* neck + torso + hips */
		ctx.beginPath();
		ctx.moveTo(ox + 220 * z, oy + 175 * z);
		ctx.lineTo(ox + 280 * z, oy + 175 * z);
		ctx.lineTo(ox + 310 * z, oy + 220 * z);
		ctx.lineTo(ox + 340 * z, oy + 480 * z);
		ctx.lineTo(ox + 300 * z, oy + 520 * z);
		ctx.lineTo(ox + 200 * z, oy + 520 * z);
		ctx.lineTo(ox + 160 * z, oy + 480 * z);
		ctx.lineTo(ox + 190 * z, oy + 220 * z);
		ctx.closePath();
		ctx.fill();
		/* arms */
		ctx.beginPath();
		ctx.moveTo(ox + 190 * z, oy + 230 * z);
		ctx.lineTo(ox + 120 * z, oy + 420 * z);
		ctx.lineTo(ox + 155 * z, oy + 435 * z);
		ctx.lineTo(ox + 200 * z, oy + 280 * z);
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(ox + 310 * z, oy + 230 * z);
		ctx.lineTo(ox + 380 * z, oy + 420 * z);
		ctx.lineTo(ox + 345 * z, oy + 435 * z);
		ctx.lineTo(ox + 300 * z, oy + 280 * z);
		ctx.closePath();
		ctx.fill();
		/* legs */
		ctx.beginPath();
		ctx.moveTo(ox + 200 * z, oy + 520 * z);
		ctx.lineTo(ox + 235 * z, oy + 520 * z);
		ctx.lineTo(ox + 245 * z, oy + 900 * z);
		ctx.lineTo(ox + 185 * z, oy + 900 * z);
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(ox + 265 * z, oy + 520 * z);
		ctx.lineTo(ox + 300 * z, oy + 520 * z);
		ctx.lineTo(ox + 315 * z, oy + 900 * z);
		ctx.lineTo(ox + 255 * z, oy + 900 * z);
		ctx.closePath();
		ctx.fill();
	} finally {
		ctx.restore();
	}
};

FBM.mapDrawBlindfold = function (Left, Top, Width, Height) {
	const m = FBM.mapBag();
	if (!m.fullBlindfold || !FBM.mapIsMaxBlind()) return;
	if (!Player || !Player.MapData || !Player.MapData.Pos) return;
	const range = FBM.mapPerceptionRange();
	const span = range * 2 + 1;
	const TileWidth = Width / span;
	const TileHeight = Height / span;
	const px = Player.MapData.Pos.X;
	const py = Player.MapData.Pos.Y;
	const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
	const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
	const othersStyle = m.blindfoldOthersStyle === "silhouette" ? "silhouette" : "greyscale";

	for (let dy = -range; dy <= range; dy++) {
		for (let dx = -range; dx <= range; dx++) {
			const X = px + dx;
			const Y = py + dy;
			if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
			const cheb = Math.max(Math.abs(dx), Math.abs(dy));
			const ScreenX = Left + dx * TileWidth + range * TileWidth;
			const ScreenY = Top + dy * TileHeight + range * TileWidth;
			if (cheb > 1) {
				if (typeof DrawRect === "function") DrawRect(ScreenX, ScreenY, TileWidth + 0.5, TileHeight + 0.5, "#000000");
				continue;
			}
			/* cheb 0: hide player tile; cheb 1: darker walls / lighter blocked objects / black walkable */
			const isWall = FBM.mapIsWall(X, Y);
			const blocked = isWall || (FBM.mapIsBlocked ? FBM.mapIsBlocked(X, Y) : false);
			if (cheb === 0 || !blocked) {
				if (typeof DrawRect === "function") DrawRect(ScreenX, ScreenY, TileWidth + 0.5, TileHeight + 0.5, "#000000");
			} else if (typeof DrawRect === "function") {
				DrawRect(ScreenX, ScreenY, TileWidth + 0.5, TileHeight + 0.5, isWall ? "#3a3a3a" : "#7a7a7a");
			}
		}
	}

	/* Adjacent others */
	if (typeof ChatRoomCharacter !== "undefined" && ChatRoomCharacter) {
		ChatRoomCharacter.forEach(function (C) {
			if (!C || !C.MapData || !C.MapData.Pos) return;
			if (typeof C.IsPlayer === "function" && C.IsPlayer()) return;
			if (Player && C.MemberNumber === Player.MemberNumber) return;
			const dx = C.MapData.Pos.X - px;
			const dy = C.MapData.Pos.Y - py;
			if (Math.max(Math.abs(dx), Math.abs(dy)) > 1) return;
			const pos = FBM.mapCharDrawPos(Left, Top, TileWidth, TileHeight, range, dx, dy);
			if (othersStyle === "silhouette") {
				FBM.mapDrawGenericSilhouette(pos.x, pos.y, pos.zoom);
			} else if (typeof DrawCharacter === "function") {
				FBM.mapDrawCharacterGrey(C, pos.x, pos.y, pos.zoom);
			}
		});
	}

	/* Self: full-color avatar on top of blacked-out tile */
	if (typeof DrawCharacter === "function") {
		const self = FBM.mapCharDrawPos(Left, Top, TileWidth, TileHeight, range, 0, 0);
		DrawCharacter(Player, self.x, self.y, self.zoom);
	}
};

/* ---------- zoom ---------- */

FBM.applyZoomSetting = function () {
	const m = FBM.mapBag();
	if (typeof ChatRoomMapViewPerceptionRangeMax !== "number") return;
	const cur = ChatRoomMapViewPerceptionRangeMax;
	if (m.fullZoomOut) {
		if (cur !== FBM.ZOOM_DEFAULT_MAX && cur !== FBM.ZOOM_SUPER_MAX) return;
		if (!FBM._zoomApplied) FBM._prevZoomMax = cur;
		ChatRoomMapViewPerceptionRangeMax = FBM.ZOOM_SUPER_MAX;
		FBM._zoomApplied = true;
	} else if (FBM._zoomApplied) {
		if (cur === FBM.ZOOM_SUPER_MAX) {
			ChatRoomMapViewPerceptionRangeMax = FBM._prevZoomMax != null ? FBM._prevZoomMax : FBM.ZOOM_DEFAULT_MAX;
		}
		FBM._zoomApplied = false;
	}
};

FBM.zoomOutForBuild = function () {
	FBM.applyZoomSetting();
	const m = FBM.mapBag();
	if (!m.fullZoomOut) {
		FBM.localMsg("FBM: enable Full map zoom-out in settings first.");
		return;
	}
	if (typeof ChatRoomMapViewPerceptionRange === "number" && typeof ChatRoomMapViewPerceptionRangeMax === "number") {
		ChatRoomMapViewPerceptionRange = ChatRoomMapViewPerceptionRangeMax;
	}
	if (typeof ChatRoomMapViewVisibilityMask !== "undefined") fillMask(ChatRoomMapViewVisibilityMask);
	if (typeof ChatRoomMapViewCalculatePerceptionMasks === "function") {
		ChatRoomMapViewCalculatePerceptionMasks();
		if (typeof ChatRoomMapViewVisibilityMask !== "undefined") fillMask(ChatRoomMapViewVisibilityMask);
	}
};

/* ---------- toolbar collapse + FBM tools button ---------- */

FBM.MAP_EDITOR_PANEL_ID = "chat-room-map-view-panel";

FBM.toolbarShouldHide = function () {
	const m = FBM.mapBag();
	return !!(m.hideBuildToolbar && !FBM._toolbarExpanded);
};

/**
 * R132+ draws zoom/edit chrome in #chat-room-map-view-panel (always created while map is active).
 * Hide via CSS class — do not ElementRemove (ShowEditor recreates it every DrawUi).
 */
FBM.syncMapEditorPanel = function () {
	const panel =
		typeof ElementWrap === "function"
			? ElementWrap(FBM.MAP_EDITOR_PANEL_ID)
			: document.getElementById(FBM.MAP_EDITOR_PANEL_ID);
	if (!panel) return false;
	const hide = FBM.toolbarShouldHide();
	panel.classList.toggle("fbm-panel-collapsed", hide);
	if (hide) {
		panel.setAttribute("aria-hidden", "true");
		panel.setAttribute("inert", "");
	} else {
		panel.removeAttribute("aria-hidden");
		panel.removeAttribute("inert");
	}
	return true;
};

/** Empty DrawButton + centered Club icon (text “+”/“−” sits off-center in small squares). */
function drawChromeIconButton(r, iconPath) {
	DrawButton(r.x, r.y, r.w, r.h, "", "White", "");
	const pad = Math.max(3, Math.round(Math.min(r.w, r.h) * 0.12));
	if (typeof DrawImageResize === "function") {
		DrawImageResize(iconPath, r.x + pad, r.y + pad, r.w - pad * 2, r.h - pad * 2);
	} else if (typeof DrawImageEx === "function") {
		DrawImageEx(
			iconPath,
			r.x + pad,
			r.y + pad,
			{ Width: r.w - pad * 2, Height: r.h - pad * 2 } as unknown as number
		);
	}
}

FBM.drawMapChromeButtons = function () {
	if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return;
	FBM.syncMapEditorPanel();
	if (typeof DrawButton !== "function") return;
	const m = FBM.mapBag();
	const layout = FBM.computeMapChromeLayout();
	const draw = function () {
		if (FBM.toolbarShouldHide()) {
			drawChromeIconButton(layout.plus || FBM.TOOLBAR_PLUS, "Icons/Plus.png");
		} else if (layout.collapse) {
			drawChromeIconButton(layout.collapse, "Icons/Minus.png");
		}
		if (m.buildingTools && FBM.mapIsAdmin() && layout.fbm) {
			const r = layout.fbm;
			const on = !!FBM._buildBarOpen;
			DrawButton(r.x, r.y, r.w, r.h, "FBM", on ? "#80FF80" : "White", "");
		}
	};
	if (FBM.withLeftDrawButtons) FBM.withLeftDrawButtons(draw);
	else draw();
};

FBM.handleMapChromeClick = function () {
	const m = FBM.mapBag();
	const layout = FBM.computeMapChromeLayout();
	if (FBM.toolbarShouldHide() && mouseInRect(layout.plus || FBM.TOOLBAR_PLUS)) {
		FBM._toolbarExpanded = true;
		FBM.syncMapEditorPanel();
		return true;
	}
	if (layout.collapse && mouseInRect(layout.collapse)) {
		FBM._toolbarExpanded = false;
		FBM.syncMapEditorPanel();
		return true;
	}
	if (m.buildingTools && FBM.mapIsAdmin() && mouseInRect(layout.fbm)) {
		FBM.setBuildBarOpen(!FBM._buildBarOpen);
		return true;
	}
	/* Legacy R130 canvas left-stack click swallow */
	if (FBM.toolbarShouldHide() && typeof MouseX === "number" && MouseX <= 100 && typeof MouseY === "number" && MouseY <= 500) {
		return true;
	}
	return false;
};

/* ---------- whisper ---------- */

/**
 * Club hearing tiles for whisper. GetHearingRange() uses PerceptionRangeMax, which FBM
 * SuperZoom raises to 50 — that must not widen whispers. Prefer Club max when not inflated.
 */
FBM.mapHearingRangeTiles = function () {
	let max = FBM.ZOOM_DEFAULT_MAX || 7;
	if (typeof ChatRoomMapViewPerceptionRangeMax === "number" && isFinite(ChatRoomMapViewPerceptionRangeMax)) {
		if (FBM._zoomApplied || ChatRoomMapViewPerceptionRangeMax === FBM.ZOOM_SUPER_MAX) {
			max = FBM.ZOOM_DEFAULT_MAX || 7;
		} else {
			max = ChatRoomMapViewPerceptionRangeMax;
		}
	}
	let deaf = 0;
	if (Player && typeof Player.GetDeafLevel === "function") deaf = Player.GetDeafLevel() || 0;
	return Math.max(0, max - deaf);
};

FBM.mapHearingWhisperOk = function (C) {
	if (!C || !C.MapData || !C.MapData.Pos || !Player || !Player.MapData || !Player.MapData.Pos) return false;
	const Distance = Math.max(
		Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X),
		Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y)
	);
	if (Distance > FBM.mapHearingRangeTiles()) return false;
	/* Match Club chat hearing (walls / BlockHearing via AudibilityMask) */
	if (typeof ChatRoomMapViewCharacterIsHearable === "function") {
		return !!ChatRoomMapViewCharacterIsHearable(C);
	}
	return true;
};

/* ---------- keyboard / typing ---------- */

/** True when focus is in a field that should receive WASD as text, not map move. */
FBM.mapTypingTargetActive = function () {
	const el = document.activeElement as HTMLElement | null;
	if (!el) return false;
	const tag = (el.tagName || "").toUpperCase();
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	if (el.isContentEditable) return true;
	return false;
};

FBM.clearMapMoveKeys = function () {
	if (typeof ChatRoomMapViewKeysPressed === "undefined" || !ChatRoomMapViewKeysPressed) return;
	const k = ChatRoomMapViewKeysPressed as Record<string, boolean>;
	if ("North" in k) {
		k.North = k.South = k.West = k.East = false;
	} else {
		k.u = k.d = k.l = k.r = false;
	}
};

/** Stop Club map keys from seeing keystrokes typed inside FBM UI. */
FBM.installUiKeyGuard = function () {
	if (FBM._uiKeyGuardBound) return;
	FBM._uiKeyGuardBound = true;
	const guard = function (e) {
		const t = e && (e.target as HTMLElement | null);
		if (!t) return;
		const tag = (t.tagName || "").toUpperCase();
		const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
		if (!typing) return;
		if (!t.closest || !t.closest("#fbm-root")) return;
		e.stopPropagation();
		if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
		if (FBM.clearMapMoveKeys) FBM.clearMapMoveKeys();
	};
	document.addEventListener("keydown", guard, true);
	document.addEventListener("keyup", guard, true);
};

/* ---------- install ---------- */

FBM.installMap = function () {
	FBM.applyZoomSetting();
	FBM.installDrawButtonFilter();
	FBM.patchMapViewMethods();
	if (FBM.installRoomUpdateHide) FBM.installRoomUpdateHide();
	if (FBM.installCopyEscape) FBM.installCopyEscape();
	FBM.installUiKeyGuard();

	FBM.tryHook("mapKeyDown", "ChatRoomMapViewKeyDown", 20, function (args, next) {
		if (FBM.mapTypingTargetActive()) {
			FBM.clearMapMoveKeys();
			return false;
		}
		return next(args);
	});

	FBM.tryHook("whisper", "ChatRoomMapViewCharacterOnWhisperRange", 4, function (args, next) {
		if (FBM.mapBag().hearingWhisper && FBM.mapIsMapRoom()) {
			return FBM.mapHearingWhisperOk(args[0]);
		}
		return next(args);
	});

	FBM.tryHook("drawGrid", "ChatRoomMapViewDrawGrid", 4, function (args, next) {
		FBM.patchMapViewMethods();
		const ret = next(args);
		const Left = args[0];
		const Top = args[1];
		const Width = args[2];
		const Height = args[3];
		FBM.mapDrawBlindfold(Left, Top, Width, Height);
		FBM.mapDrawGridOverlay(Left, Top, Width, Height);
		FBM.copyDrawHighlight(Left, Top, Width, Height);
		FBM.mapDrawTypingIndicators(Left, Top, Width, Height);
		return ret;
	});

	FBM.tryHook("updateFlag", "ChatRoomMapViewUpdateFlag", 4, function (args, next) {
		const ret = next(args);
		if (FBM.mapIsAdmin()) FBM.markMapDirty();
		return ret;
	});

	FBM.tryHook("activateView", "ChatRoomActivateView", 0, function (args, next) {
		const ret = next(args);
		FBM.installDrawButtonFilter();
		FBM.patchMapViewMethods();
		FBM.syncMapEditorPanel();
		return ret;
	});

	FBM.tryHook("mapActivate", "ChatRoomMapViewActivate", 0, function (args, next) {
		const ret = next(args);
		FBM.patchMapViewMethods();
		FBM.syncMapEditorPanel();
		return ret;
	});

	/* R132: panel is created/refreshed here — re-apply collapse after Club rebuilds children */
	FBM.tryHook("mapShowEditor", "ChatRoomMapViewShowEditor", 0, function (args, next) {
		const ret = next(args);
		FBM.syncMapEditorPanel();
		return ret;
	});
	FBM.tryHook("mapReloadEditor", "ChatRoomMapViewReloadEditorPanel", 0, function (args, next) {
		const ret = next(args);
		FBM.syncMapEditorPanel();
		return ret;
	});
};

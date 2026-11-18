/** Freyas Better Maps — map/model.js */
import { FBM } from "../fbm";

FBM.mapBag = function () {
	if (!FBM.settings) FBM.loadSettings();
	return FBM.settings;
};

FBM.mapIsMapRoom = function () {
	if (typeof ChatRoomData === "undefined" || !ChatRoomData) return false;
	const md = ChatRoomData.MapData;
	if (!md || md.Type == null || md.Type === "Never") return false;
	return true;
};

FBM.mapIsAdmin = function () {
	return typeof ChatRoomPlayerIsAdmin === "function" && !!ChatRoomPlayerIsAdmin();
};

FBM.mapPerceptionRange = function () {
	if (typeof ChatRoomMapViewPerceptionRange === "number" && ChatRoomMapViewPerceptionRange > 0) {
		return ChatRoomMapViewPerceptionRange;
	}
	return 4;
};

FBM.mapTalkScale = function (tileWidth) {
	const ref = 1000 / (FBM.MAP_TALK_REF_SPAN || 3);
	const tw = Number(tileWidth);
	if (!isFinite(tw) || tw <= 0) return 1;
	return tw / ref;
};

FBM.mapTalkSize = function (tileWidth) {
	const scale = FBM.mapTalkScale(tileWidth);
	return {
		w: Math.max(FBM.MAP_TALK_MIN_W || 8, (FBM.MAP_TALK_W || 40) * scale),
		h: Math.max(FBM.MAP_TALK_MIN_H || 5, (FBM.MAP_TALK_H || 24) * scale),
		scale: scale,
	};
};

FBM.mapTalkFrame = function (nowMs) {
	const t =
		typeof nowMs === "number" && isFinite(nowMs)
			? nowMs
			: typeof CommonTime === "function"
				? CommonTime()
				: 0;
	return Math.floor(t / 1000) % 3;
};

FBM.mapTalkIconPath = function (frame) {
	const n = Number(frame);
	const f = n === 1 || n === 2 ? n : 0;
	return "Icons/Status/Talk" + f + ".png";
};

FBM.mapShouldDrawTalk = function (C) {
	const m = FBM.mapBag();
	if (!m.typingIndicator) return false;
	if (typeof Player !== "undefined" && Player && Player.OnlineSettings && Player.OnlineSettings.ShowStatus === false) {
		return false;
	}
	if (typeof ChatRoomHideIconState !== "undefined" && ChatRoomHideIconState >= 2) return false;
	if (!C || C.Status !== "Talk") return false;
	if (C.StatusTimer != null && typeof CommonTime === "function" && C.StatusTimer < CommonTime()) return false;
	return true;
};

FBM.mapCharVisible = function (C) {
	if (typeof ChatRoomMapViewCharacterIsVisible === "function") {
		return !!ChatRoomMapViewCharacterIsVisible(C);
	}
	return !!(C && C.MapData && C.MapData.Pos);
};

FBM.mapTileIndex = function (X, Y) {
	const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
	return X + Y * w;
};

FBM.mapIsWall = function (X, Y) {
	if (typeof ChatRoomMapViewIsWall === "function") {
		return !!ChatRoomMapViewIsWall(X, Y);
	}
	if (!ChatRoomData || !ChatRoomData.MapData || !ChatRoomData.MapData.Tiles) return false;
	const tiles = ChatRoomData.MapData.Tiles;
	const idx = FBM.mapTileIndex(X, Y);
	const code = tiles.charCodeAt(idx);
	const lookup = typeof ChatRoomMapViewTileLookup !== "undefined" ? ChatRoomMapViewTileLookup : null;
	if (lookup && lookup[code] && lookup[code].Type === "Wall") return true;
	return false;
};

/** Non-walkable for blindfold silhouette: walls, trees, locked doors, glass, etc. */
FBM.mapIsBlocked = function (X, Y) {
	if (FBM.mapIsWall(X, Y)) return true;
	if (typeof ChatRoomMapViewPositionIsBlocked === "function") {
		return !!ChatRoomMapViewPositionIsBlocked(X, Y);
	}
	const getObj =
		typeof MapGetCell === "function"
			? function (x, y) {
					return MapGetCell("Object", x, y);
			  }
			: typeof ChatRoomMapViewGetObjectAtPos === "function"
				? ChatRoomMapViewGetObjectAtPos
				: null;
	const getTile =
		typeof MapGetCell === "function"
			? function (x, y) {
					return MapGetCell("Tile", x, y);
			  }
			: typeof ChatRoomMapViewGetTileAtPos === "function"
				? ChatRoomMapViewGetTileAtPos
				: null;
	const O = getObj ? getObj(X, Y) : null;
	if (O && typeof O.CanEnter === "function" && !O.CanEnter("")) return true;
	const T = getTile ? getTile(X, Y) : null;
	if (T && typeof T.CanEnter === "function" && !T.CanEnter("")) return true;
	return false;
};

/**
 * Live Club map draw rect. Prefer the last ChatRoomMapViewDrawGrid args (source of truth).
 * Fallback is classic Club 1000×1000 — do not use ChatRoomMapViewSplitPosition as canvas
 * width (often 2000 while DrawGrid still paints the left 1000).
 */
FBM.mapViewRect = function () {
	const last = FBM._mapDrawRect;
	if (
		last &&
		typeof last.Width === "number" &&
		last.Width > 0 &&
		typeof last.Height === "number" &&
		last.Height > 0
	) {
		return {
			Left: Number(last.Left) || 0,
			Top: Number(last.Top) || 0,
			Width: last.Width,
			Height: last.Height,
		};
	}
	return { Left: 0, Top: 0, Width: 1000, Height: 1000 };
};

/**
 * Club tile layout for DrawGrid(Left, Top, Width, Height).
 * Live Club (SplitPosition): square TileSize = Height/span, player centered via Offset.
 * When Width === Height this matches classic R130/R133 stretch math too.
 */
FBM.mapTileLayout = function (Left, Top, Width, Height) {
	Left = Number(Left);
	Top = Number(Top);
	Width = Number(Width);
	Height = Number(Height);
	if (!isFinite(Left)) Left = 0;
	if (!isFinite(Top)) Top = 0;
	if (!isFinite(Width) || Width <= 0) Width = 1000;
	if (!isFinite(Height) || Height <= 0) Height = 1000;
	const range = FBM.mapPerceptionRange();
	const span = Math.max(range * 2 + 1, 1);
	const TileSize = Height / span;
	if (!isFinite(TileSize) || TileSize <= 0) {
		return {
			Left: Left,
			Top: Top,
			Width: Width,
			Height: Height,
			range: range,
			span: span,
			TileSize: Width / span,
			TileWidth: Width / span,
			TileHeight: Height / span,
			OffsetX: range * (Width / span),
			OffsetY: range * (Width / span),
		};
	}
	const OffsetX = (Width - TileSize) / 2;
	const OffsetY = (Height - TileSize) / 2;
	return {
		Left: Left,
		Top: Top,
		Width: Width,
		Height: Height,
		range: range,
		span: span,
		TileSize: TileSize,
		TileWidth: TileSize,
		TileHeight: TileSize,
		OffsetX: OffsetX,
		OffsetY: OffsetY,
	};
};

FBM.mapScreenFromTile = function (X, Y, Left, Top, Width, Height) {
	const layout = FBM.mapTileLayout(Left, Top, Width, Height);
	const px = Player && Player.MapData && Player.MapData.Pos ? Player.MapData.Pos.X : 0;
	const py = Player && Player.MapData && Player.MapData.Pos ? Player.MapData.Pos.Y : 0;
	const tw = layout.TileWidth;
	const th = layout.TileHeight;
	const ScreenX = (X - px) * tw + layout.OffsetX;
	const ScreenY = (Y - py) * th + layout.OffsetY;
	return {
		ScreenX: ScreenX,
		ScreenY: ScreenY,
		TileWidth: tw,
		TileHeight: th,
		TileSize: layout.TileSize,
		Left: layout.Left + ScreenX,
		Top: layout.Top + ScreenY,
	};
};

FBM.mapTileFromMouse = function (mouseX, mouseY, Left, Top, Width, Height) {
	if (!Player || !Player.MapData || !Player.MapData.Pos) return null;
	if (typeof mouseX !== "number" || typeof mouseY !== "number" || !isFinite(mouseX) || !isFinite(mouseY)) {
		return null;
	}

	/* Use the same rect we draw with (DrawGrid args / mapViewRect) — not Club's helper first.
	 * Club PixelToTileCoordinates can disagree with DrawGrid when SplitPosition drifts. */
	if (Left == null || Top == null || Width == null || Height == null) {
		const view = FBM.mapViewRect();
		Left = view.Left;
		Top = view.Top;
		Width = view.Width;
		Height = view.Height;
	}

	const layout = FBM.mapTileLayout(Left, Top, Width, Height);
	const tw = layout.TileWidth;
	const th = layout.TileHeight;
	if (!(tw > 0) || !(th > 0)) return null;

	/* Reject pointer outside the map panel (chat side). */
	if (mouseX < layout.Left || mouseX >= layout.Left + layout.Width) return null;
	if (mouseY < layout.Top || mouseY >= layout.Top + layout.Height) return null;

	const ScreenX = mouseX - layout.Left - layout.OffsetX;
	const ScreenY = mouseY - layout.Top - layout.OffsetY;
	const tx = Math.floor(ScreenX / tw) + Player.MapData.Pos.X;
	const ty = Math.floor(ScreenY / th) + Player.MapData.Pos.Y;
	const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
	const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
	if (tx < 0 || ty < 0 || tx >= w || ty >= h) return null;
	if (!isFinite(tx) || !isFinite(ty)) return null;
	return { X: tx, Y: ty };
};

FBM.localMsg = function (text) {
	if (typeof ChatRoomSendLocal === "function") ChatRoomSendLocal(String(text), 10000);
};

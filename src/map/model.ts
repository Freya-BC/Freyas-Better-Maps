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

FBM.mapScreenFromTile = function (X, Y, Left, Top, Width, Height) {
	const range = FBM.mapPerceptionRange();
	const span = range * 2 + 1;
	const TileWidth = Width / span;
	const TileHeight = Height / span;
	const px = Player.MapData.Pos.X;
	const py = Player.MapData.Pos.Y;
	const ScreenX = (X - px) * TileWidth + range * TileWidth;
	const ScreenY = (Y - py) * TileHeight + range * TileWidth;
	return {
		ScreenX: ScreenX,
		ScreenY: ScreenY,
		TileWidth: TileWidth,
		TileHeight: TileHeight,
		Left: Left + ScreenX,
		Top: Top + ScreenY,
	};
};

FBM.mapTileFromMouse = function (MouseX, MouseY, Left, Top, Width, Height) {
	if (!Player || !Player.MapData || !Player.MapData.Pos) return null;
	const range = FBM.mapPerceptionRange();
	const span = range * 2 + 1;
	const TileWidth = Width / span;
	const TileHeight = Height / span;
	const relX = MouseX - Left;
	const relY = MouseY - Top;
	if (relX < 0 || relY < 0 || relX >= Width || relY >= Height) return null;
	const tx = Math.floor(relX / TileWidth) - range + Player.MapData.Pos.X;
	const ty = Math.floor(relY / TileHeight) - range + Player.MapData.Pos.Y;
	const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
	const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
	if (tx < 0 || ty < 0 || tx >= w || ty >= h) return null;
	return { X: tx, Y: ty };
};

FBM.localMsg = function (text) {
	if (typeof ChatRoomSendLocal === "function") ChatRoomSendLocal(String(text), 10000);
};

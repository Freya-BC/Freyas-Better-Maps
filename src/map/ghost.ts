/** Freyas Better Maps — map cell ghost / thumb drawing via Club assets */
import { FBM } from "../fbm";

function doodadFromChar(kind, ch) {
	if (ch == null || ch === "") return null;
	const id = String(ch).charCodeAt(0);
	if (typeof MapGetDoodad === "function") return MapGetDoodad(kind, id);
	if (kind === "Tile" && typeof MapDataGetTile === "function") return MapDataGetTile(id);
	if (kind === "Object" && typeof MapDataGetObject === "function") return MapDataGetObject(id);
	return null;
}

function blankObjectId() {
	return typeof ChatRoomMapViewObjectStartID === "number" ? ChatRoomMapViewObjectStartID : 100;
}

function defaultObjectSize() {
	return typeof MapObjectDefaultSize === "number" ? MapObjectDefaultSize : 100;
}

function drawSource(ctx, source, x, y, w, h, opts) {
	opts = opts || {};
	if (!source) return false;
	const options = {
		Width: w,
		Height: h,
		Alpha: opts.alpha != null ? opts.alpha : 1,
		Rotation: opts.rotation || 0,
	};
	if (ctx && typeof DrawImageEx === "function") {
		return !!DrawImageEx(source, ctx, x, y, options);
	}
	if (!ctx && typeof DrawImageResize === "function") {
		return !!DrawImageResize(source, x, y, w, h, options);
	}
	return false;
}

function resolveObjectImage(obj, settings) {
	if (!obj) return null;
	const imageName = obj.Style;
	if (!imageName) return null;
	const url =
		typeof MapGetAssetUrl === "function"
			? MapGetAssetUrl("Object", obj.Type, imageName)
			: typeof MapGetDoodadAssetUrl === "function"
				? MapGetDoodadAssetUrl(obj)
				: null;
	if (!url) return null;
	if (
		settings &&
		Array.isArray(settings.Colors) &&
		typeof ChatRoomMapViewGetColoredObjectImage === "function"
	) {
		try {
			const colored = ChatRoomMapViewGetColoredObjectImage(obj, imageName, settings.Colors);
			if (colored) return colored;
		} catch (e) {
			/* fall through to plain URL */
		}
	}
	return url;
}

/**
 * Draw one template cell (tile + object) onto MainCanvas (ctx=null) or an offscreen 2d context.
 * destRect: { Left, Top, TileWidth, TileHeight } in canvas pixels.
 * opts: { alpha?, useSettings? }
 * @returns {{ drewTile: boolean, drewObject: boolean }}
 */
FBM.drawMapCellGhost = function (ctx, tileCh, objectCh, settings, destRect, opts) {
	opts = opts || {};
	const alpha = opts.alpha != null ? opts.alpha : 0.4;
	const useSettings = opts.useSettings !== false && settings;
	const out = { drewTile: false, drewObject: false };
	if (!destRect) return out;
	const tileSize = destRect.TileWidth;
	const left = destRect.Left;
	const top = destRect.Top;
	if (!(tileSize > 0)) return out;

	const tile = doodadFromChar("Tile", tileCh);
	if (tile) {
		const url =
			typeof MapGetDoodadAssetUrl === "function"
				? MapGetDoodadAssetUrl(tile)
				: typeof MapGetAssetUrl === "function"
					? MapGetAssetUrl("Tile", tile.Type, tile.Style)
					: null;
		if (url) {
			const img = typeof DrawGetImage === "function" ? DrawGetImage(url) : null;
			if (img) {
				const widthScale = tile.Width != null ? tile.Width : 1;
				const heightScale = tile.Height != null ? tile.Height : 1;
				const tileLeft = tile.Left != null ? tile.Left : 0;
				const tileTop = tile.Top != null ? tile.Top : 0;
				const w = Math.ceil(tileSize * widthScale);
				const h = Math.ceil(tileSize * heightScale);
				const x = Math.floor(left + tileSize * tileLeft);
				const y = Math.floor(top + tileSize * tileTop);
				out.drewTile = drawSource(ctx, img, x, y, w, h, {
					alpha: alpha,
					rotation: tile.Rotation || 0,
				});
			}
		}
	}

	const obj = doodadFromChar("Object", objectCh);
	if (obj && obj.ID > blankObjectId() && obj.Type !== "EmptySpace") {
		const objectSize = (useSettings && settings && settings.Size != null ? settings.Size : defaultObjectSize()) / 100;
		const objectRotation =
			(obj.Rotation || 0) + (useSettings && settings && settings.Rotation != null ? settings.Rotation : 0);
		const width = tileSize * (obj.Width != null ? obj.Width : 1);
		const height = tileSize * (obj.Height != null ? obj.Height : 1);
		const ox = Math.floor(left + tileSize * (obj.Left != null ? obj.Left : 0) + (width * (1 - objectSize)) / 2);
		const oy = Math.floor(top + tileSize * (obj.Top != null ? obj.Top : 0) + height * (1 - objectSize));
		const ow = Math.ceil(width * objectSize);
		const oh = Math.ceil(height * objectSize);
		const source = resolveObjectImage(obj, useSettings ? settings : null);
		if (source) {
			const img =
				typeof source === "string" && typeof DrawGetImage === "function" ? DrawGetImage(source) : source;
			if (img) {
				out.drewObject = drawSource(ctx, img, ox, oy, ow, oh, {
					alpha: alpha,
					rotation: objectRotation,
				});
			} else if (typeof source === "string") {
				/* URL not loaded yet — try DrawImageEx string path to kick cache */
				out.drewObject = drawSource(ctx, source, ox, oy, ow, oh, {
					alpha: alpha,
					rotation: objectRotation,
				});
			}
		}
	}

	return out;
};

FBM.doodadFromChar = doodadFromChar;

/** Bounding box of tile (0..1) plus object Left/Top/Width/Height in tile units. */
function objectThumbBounds(obj: any) {
	const oLeft = obj && obj.Left != null ? obj.Left : 0;
	const oTop = obj && obj.Top != null ? obj.Top : 0;
	const oW = obj && obj.Width != null ? obj.Width : 1;
	const oH = obj && obj.Height != null ? obj.Height : 1;
	const minX = Math.min(0, oLeft);
	const minY = Math.min(0, oTop);
	const maxX = Math.max(1, oLeft + oW);
	const maxY = Math.max(1, oTop + oH);
	return { minX: minX, minY: minY, maxX: maxX, maxY: maxY, spanX: maxX - minX, spanY: maxY - minY };
}

/**
 * Render a single map cell (tile + object + ObjectSettings) to a PNG data URL for variant thumbs.
 * Scales so the full object footprint (e.g. Cabinet Top:-0.9 Height:2) fits in the square.
 */
FBM.snapshotObjectVariantThumb = function (opts: {
	tileId?: number | null;
	objectId?: number | null;
	settings?: any;
	size?: number;
	X?: number;
	Y?: number;
}) {
	opts = opts || {};
	const size = opts.size && opts.size > 0 ? opts.size : 96;
	const blank = blankObjectId();
	const tileId = opts.tileId != null ? opts.tileId : blank;
	const objectId = opts.objectId != null ? opts.objectId : blank;
	const tileCh = String.fromCharCode(tileId);
	const objectCh = String.fromCharCode(objectId);
	const obj = objectId > blank ? doodadFromChar("Object", objectCh) : null;

	try {
		const canvas = document.createElement("canvas");
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext("2d");
		if (!ctx) return "";
		ctx.fillStyle = "#2a3038";
		ctx.fillRect(0, 0, size, size);

		const bounds = objectThumbBounds(obj);
		const span = Math.max(bounds.spanX, bounds.spanY, 1);
		const margin = 0.06;
		const tileSize = size / (span * (1 + margin * 2));
		const originX = (size - bounds.spanX * tileSize) / 2 - bounds.minX * tileSize;
		const originY = (size - bounds.spanY * tileSize) / 2 - bounds.minY * tileSize;
		const dest = {
			Left: originX,
			Top: originY,
			TileWidth: tileSize,
			TileHeight: tileSize,
		};
		/* Prefer live map crop when coordinates are known (true on-screen look + colors). */
		if (opts.X != null && opts.Y != null) {
			const live =
				FBM.snapshotMapCellFromCanvas && FBM.snapshotMapCellFromCanvas(opts.X, opts.Y, size, obj);
			if (live) return live;
		}

		const drew = FBM.drawMapCellGhost(ctx, tileCh, objectCh, opts.settings || null, dest, {
			alpha: 1,
			useSettings: true,
		});
		void drew;
		return canvas.toDataURL("image/png");
	} catch (e) {
		return "";
	}
};

/** Grab the object footprint from the live MainCanvas buffer. */
FBM.snapshotMapCellFromCanvas = function (X: number, Y: number, outSize: number, obj?: any) {
	try {
		const el =
			typeof FBM.getMainCanvasEl === "function"
				? FBM.getMainCanvasEl()
				: document.getElementById("MainCanvas");
		if (!el || !el.getContext) return "";
		const view = FBM.mapViewRect ? FBM.mapViewRect() : { Left: 0, Top: 0, Width: 1000, Height: 1000 };
		const screen =
			FBM.mapScreenFromTile &&
			FBM.mapScreenFromTile(X, Y, view.Left, view.Top, view.Width, view.Height);
		if (!screen) return "";
		const clubW = 2000;
		const clubH = 1000;
		const bounds = objectThumbBounds(obj);
		const margin = 0.08;
		const clubLeft = screen.Left + bounds.minX * screen.TileWidth - margin * screen.TileWidth;
		const clubTop = screen.Top + bounds.minY * screen.TileHeight - margin * screen.TileHeight;
		const clubBoxW = bounds.spanX * screen.TileWidth + margin * 2 * screen.TileWidth;
		const clubBoxH = bounds.spanY * screen.TileHeight + margin * 2 * screen.TileHeight;
		if (clubLeft + clubBoxW < 0 || clubTop + clubBoxH < 0) return "";
		if (clubLeft > view.Width || clubTop > view.Height) return "";

		const sx = (clubLeft / clubW) * el.width;
		const sy = (clubTop / clubH) * el.height;
		const sw = (clubBoxW / clubW) * el.width;
		const sh = (clubBoxH / clubH) * el.height;
		if (!(sw > 1 && sh > 1)) return "";

		const out = document.createElement("canvas");
		out.width = outSize;
		out.height = outSize;
		const ctx = out.getContext("2d");
		if (!ctx) return "";
		ctx.fillStyle = "#2a3038";
		ctx.fillRect(0, 0, outSize, outSize);
		/* Fit the footprint into the square without stretching. */
		const scale = Math.min(outSize / sw, outSize / sh);
		const dw = sw * scale;
		const dh = sh * scale;
		ctx.drawImage(el, sx, sy, sw, sh, (outSize - dw) / 2, (outSize - dh) / 2, dw, dh);
		return out.toDataURL("image/png");
	} catch (e) {
		return "";
	}
};

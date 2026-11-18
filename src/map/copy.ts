/** Freyas Better Maps — map/copy.js */
import { FBM } from "../fbm";

FBM._copy = {
	mode: "", // "" | "a" | "b" | "edit" | "paste"
	a: null,
	b: null,
	cells: {}, // "x,y" -> { tile, object, config?, settings? }
	pasteId: null,
};

function cellKey(X, Y) {
	return X + "," + Y;
}

function mapApi() {
	if (typeof MapManager !== "undefined" && MapManager && MapManager.Map) return MapManager.Map;
	if (typeof ChatRoomMapManager !== "undefined" && ChatRoomMapManager && ChatRoomMapManager.Map) {
		return ChatRoomMapManager.Map;
	}
	return null;
}

function cloneJson(v) {
	if (v == null) return null;
	try {
		return typeof CommonCloneDeep === "function" ? CommonCloneDeep(v) : JSON.parse(JSON.stringify(v));
	} catch (e) {
		return null;
	}
}

function includeObjectSettings() {
	return !(FBM.settings && FBM.settings.copyObjectSettings === false);
}

function charFromId(id) {
	if (id == null || !isFinite(id)) return null;
	try {
		return String.fromCharCode(id);
	} catch (e) {
		return null;
	}
}

function doodadFromChar(kind, ch) {
	if (ch == null || ch === "") return null;
	const id = String(ch).charCodeAt(0);
	if (typeof MapGetDoodad === "function") return MapGetDoodad(kind, id);
	if (kind === "Tile" && typeof MapDataGetTile === "function") return MapDataGetTile(id);
	if (kind === "Object" && typeof MapDataGetObject === "function") return MapDataGetObject(id);
	return null;
}

/**
 * Capture one cell. When includeSettings is true, also clone CellData config + ObjectSettings.
 */
function readCell(X, Y, includeSettings) {
	const map = mapApi();
	if (map && typeof map.getTileId === "function" && typeof map.getObjectId === "function") {
		const tileId = map.getTileId(X, Y);
		const objectId = map.getObjectId(X, Y);
		const tile = charFromId(tileId);
		const object = charFromId(objectId);
		if (tile == null || object == null) return null;
		const out = { X: X, Y: Y, tile: tile, object: object };
		if (includeSettings) {
			if (typeof map.getObjectConfig === "function") {
				const cfg = map.getObjectConfig(X, Y);
				if (cfg) out.config = cloneJson(cfg);
			}
			if (typeof map.getObjectSettings === "function") {
				const st = map.getObjectSettings(X, Y);
				if (st) out.settings = cloneJson(st);
			}
		}
		return out;
	}
	const md = ChatRoomData && ChatRoomData.MapData;
	if (!md || !md.Tiles || !md.Objects) return null;
	const idx = FBM.mapTileIndex(X, Y);
	const out = {
		X: X,
		Y: Y,
		tile: md.Tiles.charAt(idx),
		object: md.Objects.charAt(idx),
	};
	if (includeSettings && md.CellData && typeof md.CellData === "object") {
		const cfg = md.CellData[idx];
		if (cfg) out.config = cloneJson(cfg);
	}
	return out;
}

/** Relativize Teleporter destinations that sit inside the selection AABB. */
function prepareConfigForTemplate(config, bounds) {
	const cfg = cloneJson(config);
	if (!cfg || cfg.Type !== "Teleporter" || !cfg.Destination || !bounds) return cfg;
	const d = cfg.Destination;
	if (
		typeof d.X === "number" &&
		typeof d.Y === "number" &&
		d.X >= bounds.x0 &&
		d.X <= bounds.x1 &&
		d.Y >= bounds.y0 &&
		d.Y <= bounds.y1
	) {
		cfg.Destination = { X: d.X - bounds.x0, Y: d.Y - bounds.y0 };
		cfg.DestinationRelative = true;
	}
	return cfg;
}

/** Resolve template Teleporter dest to absolute map coords at paste origin. */
function prepareConfigForPaste(config, originX, originY) {
	const cfg = cloneJson(config);
	if (!cfg) return null;
	if (cfg.Type === "Teleporter" && cfg.DestinationRelative && cfg.Destination) {
		cfg.Destination = {
			X: originX + cfg.Destination.X,
			Y: originY + cfg.Destination.Y,
		};
		delete cfg.DestinationRelative;
	}
	return cfg;
}

/** Drop Rotation/Size/Colors/Decal so Club `#cleanObjectSettings` deletes the entry. */
function clearObjectSettingsAt(map, X, Y) {
	if (!map || typeof map.setObjectSettings !== "function") return;
	if (typeof map.getObjectSettings !== "function") return;
	const cur = map.getObjectSettings(X, Y);
	if (!cur) return;
	const colors = Array.isArray(cur.Colors) ? cur.Colors.map(function () {
		return "Default";
	}) : undefined;
	try {
		map.setObjectSettings(
			X,
			Y,
			{
				Rotation: 0,
				Size: typeof MapObjectDefaultSize === "number" ? MapObjectDefaultSize : 100,
				...(colors ? { Colors: colors } : {}),
				Decal: undefined,
				DecalColor: undefined,
			},
			false
		);
	} catch (e) {
		/* ignore — object may not accept customization */
	}
}

FBM.copyReset = function () {
	FBM._copy.mode = "";
	FBM._copy.a = null;
	FBM._copy.b = null;
	FBM._copy.cells = {};
	FBM._copy.pasteId = null;
	if (FBM.refreshBuildBar) FBM.refreshBuildBar();
};

/** Cancel copy/paste (or close template picker). Returns true if something was cancelled. */
FBM.copyCancel = function () {
	const tpl = document.getElementById("fbm-templates");
	const tplOpen = tpl && !tpl.hidden;
	const mode = FBM._copy && FBM._copy.mode;
	if (!mode && !tplOpen) return false;
	if (tplOpen && FBM.hideTemplatesUi) FBM.hideTemplatesUi();
	if (mode) FBM.copyReset();
	if (typeof ChatRoomSendLocal === "function") ChatRoomSendLocal("FBM: copy/paste cancelled.", 4000);
	else if (FBM.localMsg) FBM.localMsg("FBM: copy/paste cancelled.");
	return true;
};

FBM.installCopyEscape = function () {
	if (FBM._copyEscapeBound) return;
	FBM._copyEscapeBound = true;
	document.addEventListener(
		"keydown",
		function (e) {
			if (!e || (e.key !== "Escape" && e.code !== "Escape")) return;
			if (FBM._capturingHotkey) return;
			/* In-plugin prompt owns Escape while open. */
			if (FBM._promptOpen) return;
			const t = e.target as HTMLElement | null;
			if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) {
				/* still allow Escape to cancel copy while focused in FBM fields */
				if (!t.closest || !t.closest("#fbm-root")) return;
			}
			const tpl = document.getElementById("fbm-templates");
			const busy = (FBM._copy && FBM._copy.mode) || (tpl && !tpl.hidden);
			if (!busy) return;
			e.preventDefault();
			e.stopPropagation();
			FBM.copyCancel();
		},
		true
	);
};

FBM.copyStart = function () {
	FBM._copy.mode = "a";
	FBM._copy.a = null;
	FBM._copy.b = null;
	FBM._copy.cells = {};
	FBM._copy.pasteId = null;
	FBM.localMsg("FBM: click top-left tile, then bottom-right. Esc cancels.");
	if (FBM.refreshBuildBar) FBM.refreshBuildBar();
};

FBM.copyFillRect = function (a, b) {
	const x0 = Math.min(a.X, b.X);
	const x1 = Math.max(a.X, b.X);
	const y0 = Math.min(a.Y, b.Y);
	const y1 = Math.max(a.Y, b.Y);
	const withSettings = includeObjectSettings();
	const cells = {};
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			const c = readCell(x, y, withSettings);
			if (c) cells[cellKey(x, y)] = c;
		}
	}
	FBM._copy.cells = cells;
	FBM._copy.a = { X: x0, Y: y0 };
	FBM._copy.b = { X: x1, Y: y1 };
};

FBM.copyToggleCell = function (X, Y) {
	const k = cellKey(X, Y);
	if (FBM._copy.cells[k]) {
		delete FBM._copy.cells[k];
	} else {
		const c = readCell(X, Y, includeObjectSettings());
		if (c) FBM._copy.cells[k] = c;
	}
};

FBM.copyBounds = function (cells) {
	const list = Object.keys(cells || FBM._copy.cells).map(function (k) {
		const p = k.split(",");
		return { X: +p[0], Y: +p[1] };
	});
	if (!list.length) return null;
	let x0 = list[0].X;
	let x1 = list[0].X;
	let y0 = list[0].Y;
	let y1 = list[0].Y;
	list.forEach(function (p) {
		x0 = Math.min(x0, p.X);
		x1 = Math.max(x1, p.X);
		y0 = Math.min(y0, p.Y);
		y1 = Math.max(y1, p.Y);
	});
	return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
};

FBM.copyMakeThumb = function (cells, bounds) {
	try {
		let tw = 24;
		const maxSide = 480;
		if (bounds.w * tw > maxSide) tw = Math.max(8, Math.floor(maxSide / Math.max(1, bounds.w)));
		if (bounds.h * tw > maxSide) tw = Math.min(tw, Math.max(8, Math.floor(maxSide / Math.max(1, bounds.h))));
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, bounds.w * tw);
		canvas.height = Math.max(1, bounds.h * tw);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#1a1e24";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		Object.keys(cells).forEach(function (k) {
			const c = cells[k];
			const dest = {
				Left: (c.X - bounds.x0) * tw,
				Top: (c.Y - bounds.y0) * tw,
				TileWidth: tw,
				TileHeight: tw,
			};
			let ok = false;
			if (FBM.drawMapCellGhost) {
				const r = FBM.drawMapCellGhost(ctx, c.tile, c.object, c.settings, dest, {
					alpha: 1,
					useSettings: !!c.settings,
				});
				ok = !!(r && (r.drewTile || r.drewObject));
			}
			if (!ok) {
				const wall = FBM.mapIsWall(c.X, c.Y);
				ctx.fillStyle = wall ? "#6a7078" : "#3a90a8";
				ctx.fillRect(dest.Left, dest.Top, tw - 1, tw - 1);
			}
		});
		return canvas.toDataURL("image/png");
	} catch (e) {
		return "";
	}
};

FBM.copySaveTemplate = function (name) {
	const cells = FBM._copy.cells;
	const bounds = FBM.copyBounds(cells);
	if (!bounds) {
		FBM.localMsg("FBM: nothing selected.");
		return null;
	}
	const withSettings = includeObjectSettings();
	const rel = [];
	Object.keys(cells).forEach(function (k) {
		const c = cells[k];
		const entry = {
			dx: c.X - bounds.x0,
			dy: c.Y - bounds.y0,
			tile: c.tile,
			object: c.object,
		};
		if (withSettings) {
			if (c.config) entry.config = prepareConfigForTemplate(c.config, bounds);
			if (c.settings) entry.settings = cloneJson(c.settings);
		}
		rel.push(entry);
	});
	FBM.loadTemplates();
	const entry = {
		id: "t" + Date.now().toString(36),
		name: String(name || "Room").trim().slice(0, 40) || "Room",
		w: bounds.w,
		h: bounds.h,
		cells: rel,
		withObjectSettings: withSettings,
		thumb: FBM.copyMakeThumb(cells, bounds),
		savedAt: Date.now(),
	};
	FBM.templates.unshift(entry);
	while (FBM.templates.length > 40) FBM.templates.pop();
	FBM.saveTemplates();
	FBM.localMsg(
		"FBM: template “" +
			entry.name +
			"” saved (" +
			bounds.w +
			" × " +
			bounds.h +
			(withSettings ? ", with object settings" : ", tiles/objects only") +
			")."
	);
	FBM.copyReset();
	if (FBM.refreshTemplatesUi) FBM.refreshTemplatesUi();
	return entry;
};

FBM.copyDeleteTemplate = function (id) {
	FBM.loadTemplates();
	FBM.templates = (FBM.templates || []).filter(function (t) {
		return t && t.id !== id;
	});
	FBM.saveTemplates();
	if (FBM.refreshTemplatesUi) FBM.refreshTemplatesUi();
};

FBM.copyBeginPaste = function (templateId) {
	FBM.loadTemplates();
	const t = (FBM.templates || []).find(function (x) {
		return x && x.id === templateId;
	});
	if (!t) {
		FBM.localMsg("FBM: template missing.");
		return;
	}
	FBM._copy.mode = "paste";
	FBM._copy.pasteId = templateId;
	FBM.localMsg("FBM: click top-left paste origin. Esc cancels.");
	if (FBM.hideTemplatesUi) FBM.hideTemplatesUi();
	if (FBM.refreshBuildBar) FBM.refreshBuildBar();
};

/**
 * Apply template at origin via MapManager when available (new BC), else legacy string mutate.
 */
FBM.copyApplyPaste = function (originX, originY) {
	if (!FBM.mapIsAdmin()) {
		FBM.localMsg("FBM: admin required to paste.");
		return false;
	}
	FBM.loadTemplates();
	const t = (FBM.templates || []).find(function (x) {
		return x && x.id === FBM._copy.pasteId;
	});
	if (!t || !Array.isArray(t.cells)) return false;

	const map = mapApi();
	/* Toggle gates paste as well as capture — off strips stored config/settings. */
	const applySettings = includeObjectSettings();
	const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
	const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;

	if (map && typeof map.setTile === "function" && typeof map.setObject === "function") {
		/* Club brush undo: startUndoStroke/endUndoStroke → one Undo reverts the whole paste. */
		const stroke =
			typeof map.startUndoStroke === "function" && typeof map.endUndoStroke === "function";
		if (stroke) map.startUndoStroke();
		try {
			/* Snapshot teleporter configs outside the paste set — setObject may auto-pair pads. */
			const pasteKeys = {};
			const teleporterSnap = {};
			t.cells.forEach(function (c) {
				const X = originX + c.dx;
				const Y = originY + c.dy;
				if (X < 0 || Y < 0 || X >= w || Y >= h) return;
				pasteKeys[cellKey(X, Y)] = true;
			});
			if (typeof map.getObjectConfig === "function") {
				for (let y = 0; y < h; y++) {
					for (let x = 0; x < w; x++) {
						if (pasteKeys[cellKey(x, y)]) continue;
						const cfg = map.getObjectConfig(x, y);
						if (cfg && cfg.Type === "Teleporter") teleporterSnap[cellKey(x, y)] = cloneJson(cfg);
					}
				}
			}

			t.cells.forEach(function (c) {
				const X = originX + c.dx;
				const Y = originY + c.dy;
				if (X < 0 || Y < 0 || X >= w || Y >= h) return;
				const tile = doodadFromChar("Tile", c.tile);
				const object = doodadFromChar("Object", c.object);
				if (tile) map.setTile(X, Y, tile);
				if (object != null) map.setObject(X, Y, object);

				if (applySettings && c.config && typeof map.setObjectConfig === "function") {
					const cfg = prepareConfigForPaste(c.config, originX, originY);
					map.setObjectConfig(X, Y, cfg);
				} else if (typeof map.setObjectConfig === "function") {
					map.setObjectConfig(X, Y, undefined);
				}
				if (applySettings && c.settings && typeof map.setObjectSettings === "function") {
					const st = cloneJson(c.settings) || {};
					delete st.ID;
					/* false = merge into prior step; inside a stroke the whole paste is one Undo. */
					map.setObjectSettings(X, Y, st, false);
				} else {
					clearObjectSettingsAt(map, X, Y);
				}
			});

			/* Restore teleporters outside the paste region after auto-pair side effects. */
			if (typeof map.setObjectConfig === "function") {
				Object.keys(teleporterSnap).forEach(function (k) {
					const p = k.split(",");
					const x = +p[0];
					const y = +p[1];
					map.setObjectConfig(x, y, teleporterSnap[k]);
				});
			}
		} finally {
			if (stroke) map.endUndoStroke();
		}

		FBM.pushMapRoomSync({ viaMapManager: true });
		FBM.localMsg("FBM: pasted “" + t.name + "”.");
		FBM.copyReset();
		return true;
	}

	/* Legacy path: mutate Tiles/Objects (+ CellData when present). */
	const md = ChatRoomData && ChatRoomData.MapData;
	if (!md || typeof md.Tiles !== "string" || typeof md.Objects !== "string") return false;
	let backup = null;
	try {
		backup = typeof CommonCloneDeep === "function" ? CommonCloneDeep(md) : JSON.parse(JSON.stringify(md));
	} catch (e) {
		backup = null;
	}
	const tiles = md.Tiles.split("");
	const objects = md.Objects.split("");
	const cellData =
		md.CellData && typeof md.CellData === "object" ? Object.assign({}, md.CellData) : {};
	t.cells.forEach(function (c) {
		const X = originX + c.dx;
		const Y = originY + c.dy;
		if (X < 0 || Y < 0 || X >= w || Y >= h) return;
		const idx = X + Y * w;
		if (c.tile != null) tiles[idx] = c.tile;
		if (c.object != null) objects[idx] = c.object;
		if (applySettings && c.config) {
			cellData[idx] = prepareConfigForPaste(c.config, originX, originY);
		} else if (cellData[idx] != null) {
			delete cellData[idx];
		}
	});
	md.Tiles = tiles.join("");
	md.Objects = objects.join("");
	if (applySettings || md.CellData) md.CellData = cellData;
	FBM.pushMapRoomSync({ backup: backup });
	FBM.localMsg("FBM: pasted “" + t.name + "”.");
	FBM.copyReset();
	return true;
};

FBM.copyHandleTileClick = function (tile) {
	if (!tile || !FBM._copy.mode) return false;
	if (FBM._copy.mode === "a") {
		FBM._copy.a = { X: tile.X, Y: tile.Y };
		FBM._copy.mode = "b";
		FBM.localMsg("FBM: now click bottom-right.");
		return true;
	}
	if (FBM._copy.mode === "b") {
		FBM.copyFillRect(FBM._copy.a, tile);
		FBM._copy.mode = "edit";
		FBM.localMsg("FBM: toggle tiles, then Save selection.");
		if (FBM.refreshBuildBar) FBM.refreshBuildBar();
		return true;
	}
	if (FBM._copy.mode === "edit") {
		FBM.copyToggleCell(tile.X, tile.Y);
		return true;
	}
	if (FBM._copy.mode === "paste") {
		FBM.copyApplyPaste(tile.X, tile.Y);
		return true;
	}
	return false;
};

FBM.copyDrawHighlight = function (Left, Top, Width, Height) {
	const mode = FBM._copy.mode;
	if (!mode) return;
	if (typeof DrawRect !== "function" && typeof DrawEmptyRect !== "function") return;

	const cells = FBM._copy.cells;
	const keys = Object.keys(cells || {});

	/* Fixed corner while waiting for bottom-right. */
	if (mode === "b" && FBM._copy.a) {
		const s = FBM.mapScreenFromTile(FBM._copy.a.X, FBM._copy.a.Y, Left, Top, Width, Height);
		if (typeof DrawEmptyRect === "function") {
			DrawEmptyRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "#5bc0de", 2);
		}
	}

	/* Saved / toggle selection fill. */
	if (mode === "edit" || (mode !== "b" && keys.length)) {
		keys.forEach(function (k) {
			const c = cells[k];
			const s = FBM.mapScreenFromTile(c.X, c.Y, Left, Top, Width, Height);
			if (typeof DrawRect === "function") {
				DrawRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "rgba(91,192,222,0.28)");
			}
			if (typeof DrawEmptyRect === "function") {
				DrawEmptyRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "#5bc0de", 2);
			}
		});
	}

	/* Live hover — Club-style cyan outline on the tile under the cursor. */
	if (typeof MouseX !== "number" || typeof MouseY !== "number") return;
	if (!FBM.mapTileFromMouse) return;
	const hover = FBM.mapTileFromMouse(MouseX, MouseY, Left, Top, Width, Height);
	if (!hover) return;

	/* Mode b: preview the AABB from corner A to the hovered tile. */
	if (mode === "b" && FBM._copy.a) {
		const x0 = Math.min(FBM._copy.a.X, hover.X);
		const x1 = Math.max(FBM._copy.a.X, hover.X);
		const y0 = Math.min(FBM._copy.a.Y, hover.Y);
		const y1 = Math.max(FBM._copy.a.Y, hover.Y);
		for (let y = y0; y <= y1; y++) {
			for (let x = x0; x <= x1; x++) {
				const s = FBM.mapScreenFromTile(x, y, Left, Top, Width, Height);
				if (typeof DrawRect === "function") {
					DrawRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "rgba(91,192,222,0.18)");
				}
			}
		}
	}

	/* Paste: translucent asset ghost (or fill fallback) with hover as top-left origin. */
	if (mode === "paste" && FBM._copy.pasteId) {
		if (!FBM.templates) FBM.loadTemplates();
		const tpl = (FBM.templates || []).find(function (x) {
			return x && x.id === FBM._copy.pasteId;
		});
		const mw = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
		const mh = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
		const wantSettings = includeObjectSettings();
		if (tpl && Array.isArray(tpl.cells)) {
			tpl.cells.forEach(function (c) {
				const X = hover.X + c.dx;
				const Y = hover.Y + c.dy;
				if (X < 0 || Y < 0 || X >= mw || Y >= mh) return;
				const s = FBM.mapScreenFromTile(X, Y, Left, Top, Width, Height);
				/* Cull cells far outside the current map viewport box. */
				if (s.Left + s.TileWidth < Left || s.Top + s.TileHeight < Top) return;
				if (s.Left > Left + Width || s.Top > Top + Height) return;
				let drew = false;
				if (FBM.drawMapCellGhost) {
					const r = FBM.drawMapCellGhost(
						null,
						c.tile,
						c.object,
						wantSettings ? c.settings : null,
						s,
						{ alpha: 0.4, useSettings: wantSettings && !!c.settings }
					);
					drew = !!(r && (r.drewTile || r.drewObject));
				}
				if (!drew && typeof DrawRect === "function") {
					DrawRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "rgba(91,192,222,0.28)");
				}
				if (typeof DrawEmptyRect === "function") {
					DrawEmptyRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "#5bc0de", 2);
				}
			});
		}
	}

	const hs = FBM.mapScreenFromTile(hover.X, hover.Y, Left, Top, Width, Height);
	if (typeof DrawEmptyRect === "function") {
		DrawEmptyRect(hs.Left, hs.Top, hs.TileWidth, hs.TileHeight, "cyan", 3);
	}
};

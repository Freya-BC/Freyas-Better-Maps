/**
 * Freyas Better Maps — region copy / paste / templates
 */
(function (FBM) {
	"use strict";

	FBM._copy = {
		mode: "", // "" | "a" | "b" | "edit" | "paste"
		a: null,
		b: null,
		cells: {}, // "x,y" -> { tile, object }
		pasteId: null,
	};

	function cellKey(X, Y) {
		return X + "," + Y;
	}

	function readCell(X, Y) {
		const md = ChatRoomData && ChatRoomData.MapData;
		if (!md || !md.Tiles || !md.Objects) return null;
		const idx = FBM.mapTileIndex(X, Y);
		return {
			X: X,
			Y: Y,
			tile: md.Tiles.charAt(idx),
			object: md.Objects.charAt(idx),
		};
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
		try {
			if (typeof ChatRoomSendLocal === "function") ChatRoomSendLocal("FBM: copy/paste cancelled.", 4000);
			else if (FBM.localMsg) FBM.localMsg("FBM: copy/paste cancelled.");
		} catch (e) {
			/* ignore */
		}
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
				const t = e.target;
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
		const cells = {};
		for (let y = y0; y <= y1; y++) {
			for (let x = x0; x <= x1; x++) {
				const c = readCell(x, y);
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
			const c = readCell(X, Y);
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
			const canvas = document.createElement("canvas");
			const tw = 8;
			canvas.width = Math.max(1, bounds.w * tw);
			canvas.height = Math.max(1, bounds.h * tw);
			const ctx = canvas.getContext("2d");
			ctx.fillStyle = "#1a1e24";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			Object.keys(cells).forEach(function (k) {
				const c = cells[k];
				const wall = FBM.mapIsWall(c.X, c.Y);
				ctx.fillStyle = wall ? "#6a7078" : "#3a90a8";
				ctx.fillRect((c.X - bounds.x0) * tw, (c.Y - bounds.y0) * tw, tw - 1, tw - 1);
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
		const rel = [];
		Object.keys(cells).forEach(function (k) {
			const c = cells[k];
			rel.push({
				dx: c.X - bounds.x0,
				dy: c.Y - bounds.y0,
				tile: c.tile,
				object: c.object,
			});
		});
		FBM.loadTemplates();
		const entry = {
			id: "t" + Date.now().toString(36),
			name: String(name || "Room").trim().slice(0, 40) || "Room",
			w: bounds.w,
			h: bounds.h,
			cells: rel,
			thumb: FBM.copyMakeThumb(cells, bounds),
			savedAt: Date.now(),
		};
		FBM.templates.unshift(entry);
		while (FBM.templates.length > 40) FBM.templates.pop();
		FBM.saveTemplates();
		FBM.localMsg("FBM: template “" + entry.name + "” saved (" + bounds.w + " × " + bounds.h + ").");
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
		const md = ChatRoomData && ChatRoomData.MapData;
		if (!md || typeof md.Tiles !== "string" || typeof md.Objects !== "string") return false;
		const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
		const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
		let backup = null;
		try {
			backup = typeof CommonCloneDeep === "function" ? CommonCloneDeep(md) : JSON.parse(JSON.stringify(md));
		} catch (e) {
			backup = null;
		}
		const tiles = md.Tiles.split("");
		const objects = md.Objects.split("");
		t.cells.forEach(function (c) {
			const X = originX + c.dx;
			const Y = originY + c.dy;
			if (X < 0 || Y < 0 || X >= w || Y >= h) return;
			const idx = X + Y * w;
			if (c.tile != null) tiles[idx] = c.tile;
			if (c.object != null) objects[idx] = c.object;
		});
		md.Tiles = tiles.join("");
		md.Objects = objects.join("");
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
		if (!mode || mode === "a") return;
		const cells = FBM._copy.cells;
		const keys = Object.keys(cells);
		if (!keys.length && mode !== "b") return;
		if (typeof DrawRect !== "function" && typeof DrawEmptyRect !== "function") return;
		if (mode === "b" && FBM._copy.a) {
			const s = FBM.mapScreenFromTile(FBM._copy.a.X, FBM._copy.a.Y, Left, Top, Width, Height);
			if (typeof DrawEmptyRect === "function") {
				DrawEmptyRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "#5bc0de", 2);
			}
			return;
		}
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
	};
})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

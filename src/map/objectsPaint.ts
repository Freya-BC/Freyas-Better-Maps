/** Freyas Better Maps — Objects Build brush / eraser / pipet / fog / undo */
import { FBM } from "../fbm";

FBM._objectsPaint = {
	armed: false,
	kind: "", // tile | object | effect
	clubId: null as number | null,
	settings: null as any,
	single: false,
	pipet: false,
	lastPaintKey: "",
	applying: false,
};

function mapApi() {
	if (typeof MapManager !== "undefined" && MapManager && MapManager.Map) return MapManager.Map;
	if (typeof ChatRoomMapManager !== "undefined" && ChatRoomMapManager && ChatRoomMapManager.Map) {
		return ChatRoomMapManager.Map;
	}
	return null;
}

function resolveDoodad(kind: string, id: number) {
	if (kind === "tile" && typeof MapDataGetTile === "function") return MapDataGetTile(id);
	if (kind === "object" && typeof MapDataGetObject === "function") return MapDataGetObject(id);
	if (kind === "effect" && typeof MapDataGetEffect === "function") return MapDataGetEffect(id);
	if (typeof MapGetDoodad === "function") {
		const k = kind === "tile" ? "Tile" : kind === "object" ? "Object" : "Effect";
		return MapGetDoodad(k, id);
	}
	return null;
}

function editRange(): number {
	const r = typeof ChatRoomMapViewEditRange === "number" ? ChatRoomMapViewEditRange - 1 : 0;
	return r > 0 ? r : 0;
}

/**
 * Disarm FBM paint and exit Club edit mode.
 * R134: character clicks are ignored while EditMode is Tile/Object/ObjectSettings —
 * clearing only ActiveTool left mode stuck after Esc/✕, so players could not be clicked.
 */
FBM.objectsClearBrush = function () {
	FBM._objectsPaint.armed = false;
	FBM._objectsPaint.kind = "";
	FBM._objectsPaint.clubId = null;
	FBM._objectsPaint.settings = null;
	FBM._objectsPaint.lastPaintKey = "";
	try {
		if (typeof ChatRoomMapViewEditorSetMode === "function") {
			ChatRoomMapViewEditorSetMode("", "");
		} else {
			ChatRoomMapViewEditMode = "";
			ChatRoomMapViewEditObject = null;
			if (typeof ChatRoomMapViewEditSubMode !== "undefined") ChatRoomMapViewEditSubMode = "";
		}
	} catch (e) {
		/* ignore */
	}
	if (typeof ChatRoomMapViewSetActiveTool === "function") ChatRoomMapViewSetActiveTool("");
	try {
		if (typeof ChatRoomMapViewReloadEditorPanel === "function") ChatRoomMapViewReloadEditorPanel();
	} catch (e) {
		/* ignore */
	}
};

FBM.objectsArmBrush = function (opts: {
	kind: string;
	clubId: number;
	settings?: any;
	single?: boolean;
}) {
	if (!FBM.mapIsAdmin || !FBM.mapIsAdmin()) {
		if (FBM.localMsg) FBM.localMsg("FBM: admin required to paint.");
		return false;
	}
	const doodad = resolveDoodad(opts.kind, opts.clubId);
	if (!doodad) {
		if (FBM.localMsg) FBM.localMsg("FBM: doodad not found.");
		return false;
	}
	const type =
		opts.kind === "tile" ? "Tile" : opts.kind === "object" ? "Object" : opts.kind === "effect" ? "Effect" : "";
	if (!type) return false;

	FBM._objectsPaint.armed = true;
	FBM._objectsPaint.kind = opts.kind;
	FBM._objectsPaint.clubId = opts.clubId;
	FBM._objectsPaint.settings = opts.settings || null;
	FBM._objectsPaint.single = !!opts.single;
	FBM._objectsPaint.pipet = false;

	if (typeof ChatRoomMapViewEditorSetSelection === "function") {
		ChatRoomMapViewEditorSetSelection(doodad, type, false);
	} else if (typeof ChatRoomMapViewSetSelection === "function") {
		ChatRoomMapViewSetSelection(doodad, type, false);
	} else {
		ChatRoomMapViewEditMode = type;
		ChatRoomMapViewEditObject = doodad;
		if (typeof ChatRoomMapViewSetActiveTool === "function") ChatRoomMapViewSetActiveTool("Brush");
	}
	FBM.installObjectsPaintHook && FBM.installObjectsPaintHook();
	return true;
};

FBM.objectsArmEraser = function () {
	if (!FBM.mapIsAdmin || !FBM.mapIsAdmin()) {
		if (FBM.localMsg) FBM.localMsg("FBM: admin required.");
		return false;
	}
	FBM._objectsPaint.armed = false;
	FBM._objectsPaint.settings = null;
	FBM._objectsPaint.pipet = false;
	if (!ChatRoomMapViewEditMode || ChatRoomMapViewEditMode === "") {
		ChatRoomMapViewEditMode = "Object";
	}
	if (typeof ChatRoomMapViewSetActiveTool === "function") ChatRoomMapViewSetActiveTool("Eraser");
	return true;
};

FBM.objectsToggleFog = function () {
	const map = mapApi();
	if (!map) return false;
	map.hasFogEnabled = !map.hasFogEnabled;
	if (typeof map.updatePlayerPerception === "function") map.updatePlayerPerception();
	return !!map.hasFogEnabled;
};

FBM.objectsUndo = function () {
	if (typeof ChatRoomMapViewUndo === "function") {
		ChatRoomMapViewUndo();
		return true;
	}
	const map = mapApi();
	if (map && typeof map.undo === "function") return !!map.undo();
	return false;
};

/** Force-place the armed doodad (Club setObject can no-op on same-cell / failed canSet). */
FBM.objectsForcePlace = function (X: number, Y: number) {
	if (!FBM._objectsPaint.armed || FBM._objectsPaint.clubId == null) return false;
	const map = mapApi();
	if (!map) return false;
	const doodad = resolveDoodad(FBM._objectsPaint.kind, FBM._objectsPaint.clubId);
	if (!doodad) return false;
	const range = editRange();
	try {
		if (FBM._objectsPaint.kind === "tile" && typeof map.setTile === "function") {
			map.setTile(X, Y, doodad, range);
			return true;
		}
		if (FBM._objectsPaint.kind === "object" && typeof map.setObject === "function") {
			map.setObject(X, Y, doodad, range);
			return true;
		}
		if (FBM._objectsPaint.kind === "effect") {
			const blank = typeof ChatRoomMapViewEffectStartID === "number" ? ChatRoomMapViewEffectStartID : 10;
			if (doodad.ID === blank && typeof map.setEffects === "function") {
				map.setEffects(X, Y, [], range);
				return true;
			}
			if (typeof map.addEffect === "function") {
				map.addEffect(X, Y, doodad, range);
				return true;
			}
			if (typeof map.setEffects === "function") {
				map.setEffects(X, Y, [doodad], range);
				return true;
			}
		}
	} catch (e) {
		return false;
	}
	return false;
};

FBM.objectsApplyPendingSettings = function (X: number, Y: number) {
	const st = FBM._objectsPaint.settings;
	if (!st || FBM._objectsPaint.kind !== "object") return;
	const map = mapApi();
	if (!map || typeof map.setObjectSettings !== "function") return;
	const changes: any = {};
	if (st.rotation != null) changes.Rotation = st.rotation;
	if (st.size != null) changes.Size = st.size;
	if (Array.isArray(st.colors) && st.colors.length) {
		changes.Colors = st.colors.map(function (c: any) {
			return c === "Default" || c == null ? "Default" : c;
		});
	}
	if (!Object.keys(changes).length) return;
	try {
		map.setObjectSettings(X, Y, changes, false);
	} catch (e) {
		/* ignore */
	}
};

function syncMapAfterPaint() {
	const map = mapApi();
	if (map && typeof map.updateGlobalMapData === "function") map.updateGlobalMapData();
	else if (FBM.pushMapRoomSync) FBM.pushMapRoomSync({ viaMapManager: true });
	if (FBM.markMapDirty) FBM.markMapDirty();
}

/** After Club paints a cell while FBM brush is armed. */
FBM.objectsOnPainted = function (X: number, Y: number) {
	if (!FBM._objectsPaint.armed || FBM._objectsPaint.applying) return;
	FBM._objectsPaint.applying = true;
	try {
		const key = X + "," + Y;
		FBM._objectsPaint.lastPaintKey = key;
		/* Re-assert placement so overdraw always replaces the object, then restore settings. */
		FBM.objectsForcePlace(X, Y);
		FBM.objectsApplyPendingSettings(X, Y);
		syncMapAfterPaint();
		if (FBM._objectsPaint.single) {
			if (FBM.clearObjectsSelection) FBM.clearObjectsSelection();
			else {
				FBM.objectsClearBrush();
				if (FBM.refreshObjectsBuildUi) FBM.refreshObjectsBuildUi();
			}
			if (FBM.localMsg) FBM.localMsg("FBM: placed (single).");
		}
	} finally {
		FBM._objectsPaint.applying = false;
	}
};

FBM.objectsSetPipet = function (on: boolean) {
	FBM._objectsPaint.pipet = !!on;
	if (on) {
		FBM.objectsClearBrush();
		FBM._objectsPaint.pipet = true;
	}
};

FBM.objectsPipetSample = function (X: number, Y: number) {
	if (!FBM._objectsPaint.pipet) return null;
	const map = mapApi();
	if (!map) return null;
	const tileId = typeof map.getTileId === "function" ? map.getTileId(X, Y) : null;
	const objId = typeof map.getObjectId === "function" ? map.getObjectId(X, Y) : null;
	const settings = typeof map.getObjectSettings === "function" ? map.getObjectSettings(X, Y) : null;
	const blank = typeof ChatRoomMapViewObjectStartID === "number" ? ChatRoomMapViewObjectStartID : 100;

	let kind = "tile";
	let clubId = tileId;
	if (objId != null && objId > blank) {
		kind = "object";
		clubId = objId;
	}

	const cat = FBM.getCatalog && FBM.getCatalog();
	if (!cat) return null;

	let found: any = null;
	cat.sections.forEach(function (sec: any) {
		sec.categories.forEach(function (c: any) {
			(c.bases || []).forEach(function (b: any) {
				if (found) return;
				if (kind === "object" && b.kind === "object") {
					const v = (b.variants || []).find(function (x: any) {
						return x.clubId === clubId;
					});
					if (v || b.clubId === clubId) found = { base: b, section: sec, category: c, variant: v };
				}
				if (kind === "tile" && b.kind === "tile") {
					const v = (b.variants || []).find(function (x: any) {
						return x.clubId === clubId;
					});
					if (v) found = { base: b, section: sec, category: c, variant: v };
				}
			});
		});
	});
	if (!found) {
		if (FBM.localMsg) FBM.localMsg("FBM: pipet — no catalog match.");
		return null;
	}

	const thumb =
		FBM.snapshotObjectVariantThumb &&
		FBM.snapshotObjectVariantThumb({
			X: X,
			Y: Y,
			tileId: tileId,
			objectId: kind === "object" ? clubId : null,
			settings: kind === "object" ? settings : null,
			size: 96,
		});

	if (kind === "object" && found.base.canCustomize && settings) {
		const isDefault =
			(!settings.Rotation || settings.Rotation === 0) &&
			(!settings.Size || settings.Size === 100) &&
			(!settings.Colors ||
				!settings.Colors.some(function (c: any) {
					return c && c !== "Default";
				}));
		if (!isDefault && FBM.promptText) {
			/* Defer name prompt so Electron (no window.prompt) still works; selection applies first. */
			const baseId = found.base.id;
			const style = found.base.style;
			const colors = Array.isArray(settings.Colors) ? settings.Colors.slice() : [];
			const rotation = settings.Rotation || 0;
			const size = settings.Size || 100;
			const thumbUrl = thumb || "";
			const sampleClubId = clubId;
			FBM._objectsPaint.pipet = false;
			FBM.promptText("Save sampled look as variant name?", {
				initial: "Sampled",
				confirmLabel: "Save",
				maxlength: 40,
			}).then(function (name: string | null) {
				if (name == null || !String(name).trim()) return;
				const variant = {
					id: "custom-" + Date.now().toString(36),
					name: String(name).trim().slice(0, 40),
					clubId: sampleClubId,
					style: style,
					colors: colors,
					rotation: rotation,
					size: size,
					thumbUrl: thumbUrl,
					custom: true,
				};
				FBM.saveCustomVariant(baseId, variant);
				if (FBM._objectsUi) {
					FBM._objectsUi.baseId = baseId;
					FBM._objectsUi.variantId = variant.id;
				}
				if (FBM.refreshObjectsBuildUi) FBM.refreshObjectsBuildUi();
				if (FBM.localMsg) FBM.localMsg("FBM: pipet saved “" + variant.name + "”.");
			});
			return found;
		}
	}

	FBM._objectsPaint.pipet = false;
	return found;
};

function wrapPaintFn(fn: Function, label: string) {
	if (!fn || (fn as any)._fbmWrapped) return fn;
	const orig = typeof fn === "function" ? fn : null;
	if (!orig) return fn;
	const wrapped = function (this: any) {
		const args = arguments as unknown as any[];
		const ret = orig.apply(this, args);
		if (FBM._objectsPaint && FBM._objectsPaint.armed && !FBM._objectsPaint.applying) {
			let x = args[0];
			let y = args[1];
			/* setObject/setTile may be (index, doodad) or (x, y, doodad) */
			if (typeof y !== "number" && typeof x === "number" && typeof MapIndexToCoordinates === "function") {
				try {
					const pos = MapIndexToCoordinates(x);
					x = pos.X;
					y = pos.Y;
				} catch (e) {
					return ret;
				}
			}
			if (typeof x === "number" && typeof y === "number") {
				FBM.objectsOnPainted(x, y);
			}
		}
		return ret;
	};
	(wrapped as any)._fbmWrapped = true;
	(wrapped as any)._fbmLabel = label;
	return wrapped;
}

/**
 * Translucent hover ghost for the armed Objects Build brush.
 * Draws only when General → placementGhost is on and Club canSet* allows the cell.
 */
FBM.objectsDrawPlacementGhost = function (Left: number, Top: number, Width: number, Height: number) {
	if (!FBM.settings || FBM.settings.placementGhost === false) return;
	const paint = FBM._objectsPaint;
	if (!paint || !paint.armed || paint.pipet || paint.clubId == null) return;
	if (FBM._copy && FBM._copy.mode) return;
	if (FBM.mapIsAdmin && !FBM.mapIsAdmin()) return;
	if (!FBM.mapTileFromMouse || !FBM.mapScreenFromTile || !FBM.drawMapCellGhost) return;

	const hover = FBM.mapTileFromMouse(MouseX, MouseY, Left, Top, Width, Height);
	if (!hover) return;

	const doodad = resolveDoodad(paint.kind, paint.clubId);
	if (!doodad) return;

	const map = mapApi();
	const mw = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
	const mh = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
	if (hover.X < 0 || hover.Y < 0 || hover.X >= mw || hover.Y >= mh) return;

	let ok = true;
	try {
		if (paint.kind === "tile") {
			ok = map && typeof map.canSetTile === "function" ? !!map.canSetTile(hover.X, hover.Y, doodad) : true;
		} else if (paint.kind === "object") {
			ok = map && typeof map.canSetObject === "function" ? !!map.canSetObject(hover.X, hover.Y, doodad) : true;
		} else if (paint.kind === "effect") {
			ok = true;
		} else {
			return;
		}
	} catch (e) {
		return;
	}
	if (!ok) return;

	const s = FBM.mapScreenFromTile(hover.X, hover.Y, Left, Top, Width, Height);
	if (s.Left + s.TileWidth < Left || s.Top + s.TileHeight < Top) return;
	if (s.Left > Left + Width || s.Top > Top + Height) return;

	const ch = String.fromCharCode(paint.clubId);
	let tileCh: string | null = null;
	let objectCh: string | null = null;
	let settings: any = null;
	let useSettings = false;
	if (paint.kind === "tile") {
		tileCh = ch;
	} else if (paint.kind === "object") {
		objectCh = ch;
		const st = paint.settings;
		if (st) {
			settings = {
				Rotation: st.rotation != null ? st.rotation : 0,
				Size: st.size != null ? st.size : 100,
				Colors: Array.isArray(st.colors) ? st.colors : [],
			};
			useSettings = true;
		}
	} else {
		/* Effects: no asset ghost in drawMapCellGhost — soft fill like paste fallback. */
		if (typeof DrawRect === "function") {
			DrawRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "rgba(91,192,222,0.28)");
		}
		if (typeof DrawEmptyRect === "function") {
			DrawEmptyRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "#5bc0de", 2);
		}
		return;
	}

	const r = FBM.drawMapCellGhost(null, tileCh, objectCh, settings, s, {
		alpha: 0.4,
		useSettings: useSettings,
	});
	const drew = !!(r && (r.drewTile || r.drewObject));
	if (!drew && typeof DrawRect === "function") {
		DrawRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "rgba(91,192,222,0.28)");
	}
};

FBM.installObjectsPaintHook = function () {
	/* Club Brush tool (newer builds) */
	if (typeof ChatRoomMapViewTools !== "undefined" && ChatRoomMapViewTools && ChatRoomMapViewTools.Brush) {
		const brush = ChatRoomMapViewTools.Brush;
		if (brush && typeof brush.paint === "function" && !brush._fbmWrapped) {
			const orig = brush.paint.bind(brush);
			brush.paint = function (x: number, y: number, range: number, event: any) {
				orig(x, y, range, event);
				if (FBM._objectsPaint && FBM._objectsPaint.armed) {
					FBM.objectsOnPainted(x, y);
				}
			};
			brush._fbmWrapped = true;
			FBM._objectsPaintHooked = true;
		}
	}

	/* R133 path: MouseMove → MapManager.Map.setObject / setTile / addEffect */
	const map = mapApi();
	if (map && !map._fbmObjectsPaintWrapped) {
		if (typeof map.setObject === "function") {
			map.setObject = wrapPaintFn(map.setObject, "setObject");
		}
		if (typeof map.setTile === "function") {
			map.setTile = wrapPaintFn(map.setTile, "setTile");
		}
		if (typeof map.addEffect === "function") {
			map.addEffect = wrapPaintFn(map.addEffect, "addEffect");
		}
		if (typeof map.setEffects === "function") {
			map.setEffects = wrapPaintFn(map.setEffects, "setEffects");
		}
		map._fbmObjectsPaintWrapped = true;
		FBM._objectsPaintHooked = true;
	}
};

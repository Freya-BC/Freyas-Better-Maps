/** Freyas Better Maps — Object Settings floating modal (Club toolbar independent) */
import { FBM, type FBMMarkedElement } from "../fbm";

function $(id: string): FBMMarkedElement | null {
	return document.getElementById(id) as FBMMarkedElement | null;
}

function mapApi() {
	if (typeof MapManager !== "undefined" && MapManager && MapManager.Map) return MapManager.Map;
	return null;
}

function defaultSize() {
	return typeof MapObjectDefaultSize === "number" ? MapObjectDefaultSize : 100;
}

function canCustomize(object: any) {
	if (typeof MapCanCustomizeObject === "function") return !!MapCanCustomizeObject(object);
	return object && object.CanBeCustomized !== false;
}

function canTransform(object: any) {
	if (typeof MapCanTransformObject === "function") return !!MapCanTransformObject(object);
	return object && !object.JoinsNeighbors && !object.CanPlaceOnWalls;
}

function colorableLayers(object: any): any[] {
	if (typeof MapGetColorableLayers === "function") return MapGetColorableLayers(object) || [];
	return (object && object.Layers ? object.Layers : []).filter(function (L: any) {
		return L && L.IsColorable;
	});
}

function isTetherPoint(pos: { X: number; Y: number }) {
	if (typeof ChatRoomMapViewIsTetherPoint === "function") return !!ChatRoomMapViewIsTetherPoint(pos);
	const map = mapApi();
	if (!map || typeof map.getObjectConfig !== "function") return false;
	const cfg = map.getObjectConfig(pos.X, pos.Y);
	return !!(cfg && cfg.Type === "Tether");
}

function objectDisplayName(object: any) {
	if (typeof ChatRoomMapViewGetObjectDisplayName === "function") {
		try {
			return ChatRoomMapViewGetObjectDisplayName(object);
		} catch (e) {
			/* fall through */
		}
	}
	if (object && object.Name) return object.Name;
	if (object && object.Style) {
		return String(object.Style)
			.replace(/([a-z])([A-Z])/g, "$1 $2")
			.replace(/_/g, " ");
	}
	return "Object";
}

function layerDisplayName(layer: any) {
	if (layer && layer.Name) return layer.Name;
	if (typeof TextGet === "function") {
		const t = TextGet("ObjectSettingsColor");
		if (t && t !== "ObjectSettingsColor") return t;
	}
	return "Color";
}

function parseHex(value: string): string | null {
	let color = String(value || "").trim();
	if (!color.startsWith("#")) color = "#" + color;
	if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toUpperCase();
	return null;
}

function toStoredColors(layers: any[], colors: string[]) {
	return layers.map(function (layer, i) {
		const color = (colors[i] || "").toUpperCase();
		const def = (layer.DefaultColor || "#FFFFFF").toUpperCase();
		return !color || color === def ? "Default" : color;
	});
}

function layerColorsResolved(pos: { X: number; Y: number }, object: any) {
	if (typeof MapGetObjectLayerColors === "function") return MapGetObjectLayerColors(pos, object);
	const layers = colorableLayers(object);
	const map = mapApi();
	const settings = map && typeof map.getObjectSettings === "function" ? map.getObjectSettings(pos.X, pos.Y) : null;
	const colors = (settings && settings.Colors) || [];
	return layers.map(function (layer: any, i: number) {
		const c = colors[i];
		return c && c !== "Default" ? c : layer.DefaultColor || "#FFFFFF";
	});
}

function tileIndex(X: number, Y: number) {
	if (typeof MapCoordinatesToIndex === "function") return MapCoordinatesToIndex(X, Y);
	const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
	return X + Y * w;
}

function syncMap() {
	const map = mapApi();
	if (map && typeof map.updateGlobalMapData === "function") map.updateGlobalMapData();
	else if (FBM.pushMapRoomSync) FBM.pushMapRoomSync({ viaMapManager: true });
	if (FBM.markMapDirty) FBM.markMapDirty();
}

function setStatus(msg: string) {
	const el = $("fbm-objset-status");
	if (el) el.textContent = msg || "";
}

FBM._objectSettings = {
	pick: false,
	panelOpen: false,
	bound: false,
	pos: null as { X: number; Y: number } | null,
	objectId: null as number | null,
	sliderChanging: false,
	color: {
		open: false,
		layerIndex: -1,
		original: [] as string[],
		current: [] as string[],
		eyedrop: false,
	},
};

function hasObjectSettingsApi() {
	const map = mapApi();
	return !!(map && typeof map.getObjectSettings === "function" && typeof map.setObjectSettings === "function");
}

function clearColorPreview() {
	if (typeof ChatRoomMapViewColorPreview !== "undefined") {
		try {
			ChatRoomMapViewColorPreview = null;
		} catch (e) {
			/* ignore */
		}
	}
}

function setColorPreview(pos: { X: number; Y: number }, colors: string[]) {
	if (typeof ChatRoomMapViewColorPreview !== "undefined") {
		try {
			ChatRoomMapViewColorPreview = { Index: tileIndex(pos.X, pos.Y), Colors: colors.slice() };
			return true;
		} catch (e) {
			/* fall through */
		}
	}
	return false;
}

function livePreviewColors(pos: { X: number; Y: number }, object: any, colors: string[]) {
	if (setColorPreview(pos, colors)) return;
	const map = mapApi();
	if (!map) return;
	const stored = toStoredColors(colorableLayers(object), colors);
	map.setObjectSettings(pos.X, pos.Y, { Colors: stored }, false);
}

function hsvToRgb(h: number, s: number, v: number) {
	const c = v * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = v - c;
	let r = 0;
	let g = 0;
	let b = 0;
	if (h < 60) {
		r = c;
		g = x;
	} else if (h < 120) {
		r = x;
		g = c;
	} else if (h < 180) {
		g = c;
		b = x;
	} else if (h < 240) {
		g = x;
		b = c;
	} else if (h < 300) {
		r = x;
		b = c;
	} else {
		r = c;
		b = x;
	}
	const toHex = function (n: number) {
		return Math.round((n + m) * 255)
			.toString(16)
			.toUpperCase()
			.padStart(2, "0");
	};
	return "#" + toHex(r) + toHex(g) + toHex(b);
}

function rgbToHsv(hex: string) {
	const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
	if (!m) return { h: 0, s: 0, v: 1 };
	const n = parseInt(m[1], 16);
	const r = ((n >> 16) & 255) / 255;
	const g = ((n >> 8) & 255) / 255;
	const b = (n & 255) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	let h = 0;
	if (d) {
		if (max === r) h = ((g - b) / d) % 6;
		else if (max === g) h = (b - r) / d + 2;
		else h = (r - g) / d + 4;
		h *= 60;
		if (h < 0) h += 360;
	}
	const s = max === 0 ? 0 : d / max;
	return { h: h, s: s, v: max };
}

FBM.objectSettingsMarkup = function () {
	return (
		'<div class="fbm-objset" id="fbm-objset" hidden>' +
		'<div class="fbm-objset-main">' +
		'<div class="fbm-header" id="fbm-objset-header">' +
		'<div class="fbm-header-title">Object Settings <span class="fbm-badge" id="fbm-objset-title">pick</span></div>' +
		'<button type="button" class="fbm-icon-btn" id="fbm-objset-close" title="Close">×</button></div>' +
		'<div class="fbm-objset-body" id="fbm-objset-body">' +
		'<p class="fbm-muted fbm-hint" id="fbm-objset-hint">Click a customizable object on the map.</p>' +
		'<div id="fbm-objset-controls" hidden></div>' +
		"</div>" +
		'<div class="fbm-objset-footer" id="fbm-objset-footer" hidden>' +
		'<button type="button" class="fbm-btn fbm-btn-accent" id="fbm-objset-save-variant" title="Save current look as an Objects Build custom variant">Save Variant</button>' +
		"</div>" +
		'<div class="fbm-objset-status" id="fbm-objset-status"></div>' +
		"</div>" +
		'<div class="fbm-colorpick" id="fbm-colorpick" hidden>' +
		'<div class="fbm-colorpick-head">' +
		'<span id="fbm-colorpick-title">Color</span>' +
		'<button type="button" class="fbm-icon-btn" id="fbm-colorpick-close" title="Cancel">×</button></div>' +
		'<div class="fbm-colorpick-body">' +
		'<div class="fbm-colorpick-sv" id="fbm-colorpick-sv">' +
		'<div class="fbm-colorpick-cursor" id="fbm-colorpick-cursor"></div></div>' +
		'<input type="range" id="fbm-colorpick-hue" class="fbm-colorpick-hue" min="0" max="360" value="0" />' +
		'<div class="fbm-row">' +
		'<div class="fbm-colorpick-swatch" id="fbm-colorpick-swatch"></div>' +
		'<input type="text" id="fbm-colorpick-hex" maxlength="7" spellcheck="false" autocomplete="off" />' +
		'<button type="button" class="fbm-icon-btn" id="fbm-colorpick-eyedrop" title="Sample from map">' +
		'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4.5l5 5M3 21l7.5-7.5M12 8l4 4M14 6l2-2a1.5 1.5 0 0 1 2 2l-2 2"/></svg>' +
		"</button></div>" +
		'<div class="fbm-row">' +
		'<button type="button" class="fbm-btn" id="fbm-colorpick-cancel">Cancel</button>' +
		'<button type="button" class="fbm-btn fbm-btn-accent" id="fbm-colorpick-ok">Save (Enter)</button></div>' +
		'<p class="fbm-muted fbm-hint">Live preview while adjusting. Enter saves, Esc cancels.</p>' +
		"</div></div></div>"
	);
};

FBM.refreshObjectSettingsToolUi = function () {
	const gear = $("fbm-obj-settings-tool");
	if (gear) {
		gear.classList.toggle(
			"fbm-on",
			!!(FBM._objectSettings.pick || FBM._objectSettings.panelOpen || FBM._objectSettings.color.open)
		);
	}
};

FBM.openObjectSettingsPick = function () {
	if (!hasObjectSettingsApi()) {
		if (FBM.localMsg) FBM.localMsg("FBM: Object Settings need a newer Club map build.");
		return;
	}
	if (!FBM.mapIsAdmin || !FBM.mapIsAdmin()) {
		if (FBM.localMsg) FBM.localMsg("FBM: admin required.");
		return;
	}
	FBM.ensureUi();
	FBM.bindObjectSettingsUi();
	FBM._objectSettings.pick = true;
	FBM.closeObjectSettingsPanel(true);
	const panel = $("fbm-objset");
	if (panel) {
		panel.hidden = false;
		FBM._objectSettings.panelOpen = true;
	}
	const hint = $("fbm-objset-hint");
	const controls = $("fbm-objset-controls");
	const title = $("fbm-objset-title");
	const footer = $("fbm-objset-footer");
	if (hint) {
		hint.hidden = false;
		hint.textContent = "Click a customizable object on the map.";
	}
	if (controls) {
		controls.hidden = true;
		controls.innerHTML = "";
	}
	if (footer) footer.hidden = true;
	if (title) title.textContent = "pick";
	setStatus("Pick mode — click a map object.");
	FBM.refreshObjectSettingsToolUi();
};

FBM.closeObjectSettingsPick = function () {
	FBM._objectSettings.pick = false;
	FBM.closeColorPicker(false);
	FBM.closeObjectSettingsPanel(false);
	FBM.refreshObjectSettingsToolUi();
};

FBM.toggleObjectSettingsPick = function () {
	if (FBM._objectSettings.pick || FBM._objectSettings.panelOpen) FBM.closeObjectSettingsPick();
	else FBM.openObjectSettingsPick();
};

FBM.closeObjectSettingsPanel = function (keepPick: boolean) {
	clearColorPreview();
	FBM.closeColorPicker(false);
	const panel = $("fbm-objset");
	if (panel && !keepPick) panel.hidden = true;
	if (!keepPick) FBM._objectSettings.panelOpen = false;
	FBM._objectSettings.pos = null;
	FBM._objectSettings.objectId = null;
	const footer = $("fbm-objset-footer");
	if (footer && !keepPick) footer.hidden = true;
	FBM.refreshObjectSettingsToolUi();
};

FBM.objectSettingsHandleMapClick = function (tile: { X: number; Y: number }) {
	if (FBM._objectSettings.color.eyedrop) {
		FBM.sampleColorFromMapClick(tile);
		return true;
	}
	if (!FBM._objectSettings.pick && !FBM._objectSettings.panelOpen) return false;
	if (!hasObjectSettingsApi()) return true;
	const map = mapApi();
	if (!map) return true;
	const blank = typeof ChatRoomMapViewObjectStartID === "number" ? ChatRoomMapViewObjectStartID : 100;
	const objectId = typeof map.getObjectId === "function" ? map.getObjectId(tile.X, tile.Y) : null;
	if (objectId == null || objectId <= blank) {
		setStatus("No object on that tile.");
		return true;
	}
	const object =
		typeof MapDataGetObject === "function"
			? MapDataGetObject(objectId)
			: typeof MapGetDoodad === "function"
				? MapGetDoodad("Object", objectId)
				: null;
	if (!object || !canCustomize(object)) {
		setStatus("That object cannot be customized.");
		return true;
	}
	FBM.openObjectSettingsFor(tile, objectId, object);
	return true;
};

FBM.openObjectSettingsFor = function (pos: { X: number; Y: number }, objectId: number, object: any) {
	FBM.ensureUi();
	FBM.bindObjectSettingsUi();
	FBM._objectSettings.pick = false;
	FBM._objectSettings.pos = { X: pos.X, Y: pos.Y };
	FBM._objectSettings.objectId = objectId;
	FBM._objectSettings.panelOpen = true;
	const panel = $("fbm-objset");
	if (panel) panel.hidden = false;
	const hint = $("fbm-objset-hint");
	if (hint) hint.hidden = true;
	const title = $("fbm-objset-title");
	if (title) title.textContent = objectDisplayName(object);
	const footer = $("fbm-objset-footer");
	if (footer) footer.hidden = false;
	FBM.renderObjectSettingsControls(pos, object);
	setStatus("Editing “" + objectDisplayName(object) + "” at " + pos.X + "," + pos.Y + ".");
	FBM.refreshObjectSettingsToolUi();
};

function findCatalogHitForObjectId(objectId: number) {
	if (FBM.prepareObjectsCatalog) FBM.prepareObjectsCatalog();
	const cat = FBM.getCatalog && FBM.getCatalog();
	if (!cat) return null;
	let found: any = null;
	cat.sections.forEach(function (sec: any) {
		sec.categories.forEach(function (c: any) {
			(c.bases || []).forEach(function (b: any) {
				if (found || b.kind !== "object") return;
				const v = (b.variants || []).find(function (x: any) {
					return x.clubId === objectId;
				});
				if (v || b.clubId === objectId) found = { base: b, section: sec, category: c, variant: v };
			});
		});
	});
	return found;
}

FBM.saveObjectSettingsAsVariant = function () {
	const st = FBM._objectSettings;
	if (!st.pos || st.objectId == null) {
		setStatus("Pick an object first.");
		return;
	}
	const map = mapApi();
	if (!map) return;
	const found = findCatalogHitForObjectId(st.objectId);
	if (!found || !found.base) {
		setStatus("No Objects Build catalog match for this object.");
		return;
	}
	if (!found.base.canCustomize) {
		setStatus("That catalog item is baked — variants come from Style.");
		return;
	}
	const settings = typeof map.getObjectSettings === "function" ? map.getObjectSettings(st.pos.X, st.pos.Y) : null;
	const tileId = typeof map.getTileId === "function" ? map.getTileId(st.pos.X, st.pos.Y) : null;
	if (!FBM.promptText) {
		setStatus("Save variant unavailable.");
		return;
	}
	FBM.promptText("Save current look as variant name?", {
		initial: "Custom",
		confirmLabel: "Save",
		maxlength: 40,
	}).then(function (name: string | null) {
		if (name == null || !String(name).trim()) {
			setStatus("Save variant cancelled.");
			return;
		}
		const thumb =
			FBM.snapshotObjectVariantThumb &&
			FBM.snapshotObjectVariantThumb({
				X: st.pos.X,
				Y: st.pos.Y,
				tileId: tileId,
				objectId: st.objectId,
				settings: settings,
				size: 96,
			});
		const variant = {
			id: "custom-" + Date.now().toString(36),
			name: String(name).trim().slice(0, 40),
			clubId: st.objectId,
			style: found.base.style,
			colors: settings && Array.isArray(settings.Colors) ? settings.Colors.slice() : [],
			rotation: (settings && settings.Rotation) || 0,
			size: (settings && settings.Size) || defaultSize(),
			thumbUrl: thumb || "",
			custom: true,
		};
		FBM.saveCustomVariant(found.base.id, variant);
		if (FBM._objectsUi) {
			FBM._objectsUi.baseId = found.base.id;
			FBM._objectsUi.sectionId = found.section.id;
			FBM._objectsUi.categoryId = found.category.id;
			FBM._objectsUi.variantId = variant.id;
		}
		if (FBM.refreshObjectsBuildUi) FBM.refreshObjectsBuildUi();
		setStatus("Saved variant “" + variant.name + "”.");
		if (FBM.localMsg) FBM.localMsg("FBM: saved variant “" + variant.name + "”.");
	});
};

FBM.renderObjectSettingsControls = function (pos: { X: number; Y: number }, object: any) {
	const box = $("fbm-objset-controls");
	if (!box) return;
	box.hidden = false;
	box.innerHTML = "";
	const map = mapApi();
	if (!map) return;
	const settings = typeof map.getObjectSettings === "function" ? map.getObjectSettings(pos.X, pos.Y) : null;

	if (canTransform(object)) {
		const rot = settings && settings.Rotation != null ? settings.Rotation : 0;
		const size = settings && settings.Size != null ? settings.Size : defaultSize();
		box.appendChild(FBM.makeObjSetSlider(pos, "Rotation", 0, 359, rot));
		box.appendChild(FBM.makeObjSetSlider(pos, "Size", 50, 200, size));
		const resetRow = document.createElement("div");
		resetRow.className = "fbm-row";
		const resetBtn = document.createElement("button");
		resetBtn.type = "button";
		resetBtn.className = "fbm-btn";
		resetBtn.textContent = "Reset rotation / size";
		resetBtn.addEventListener("click", function () {
			map.setObjectSettings(pos.X, pos.Y, { Rotation: 0, Size: defaultSize() });
			syncMap();
			FBM.renderObjectSettingsControls(pos, object);
		});
		resetRow.appendChild(resetBtn);
		box.appendChild(resetRow);
	}

	if (object.CanBeTetherPoint) {
		const row = document.createElement("label");
		row.className = "fbm-check-row";
		const cb = document.createElement("input");
		cb.type = "checkbox";
		cb.checked = isTetherPoint(pos);
		cb.addEventListener("change", function () {
			if (typeof map.setObjectConfig === "function") {
				map.setObjectConfig(pos.X, pos.Y, cb.checked ? { Type: "Tether" } : undefined);
				syncMap();
			}
		});
		const span = document.createElement("span");
		span.textContent = "Tether point";
		row.appendChild(cb);
		row.appendChild(span);
		box.appendChild(row);
	}

	const layers = colorableLayers(object);
	if (layers.length) {
		const head = document.createElement("div");
		head.className = "fbm-section-head";
		head.textContent = "Colors";
		box.appendChild(head);
		const colors = layerColorsResolved(pos, object);
		layers.forEach(function (layer: any, i: number) {
			const row = document.createElement("div");
			row.className = "fbm-objset-layer-row";
			const name = document.createElement("span");
			name.className = "fbm-muted";
			name.textContent = layerDisplayName(layer);
			const sw = document.createElement("button");
			sw.type = "button";
			sw.className = "fbm-objset-swatch";
			sw.style.backgroundColor = colors[i];
			sw.title = "Edit " + layerDisplayName(layer);
			sw.addEventListener("click", function () {
				FBM.openColorPicker(pos, object, i);
			});
			const hex = document.createElement("input");
			hex.type = "text";
			hex.maxLength = 7;
			hex.value = colors[i];
			hex.spellcheck = false;
			hex.autocomplete = "off";
			hex.addEventListener("change", function () {
				const parsed = parseHex(hex.value);
				if (!parsed) {
					hex.value = colors[i];
					return;
				}
				const next = layerColorsResolved(pos, object).slice();
				next[i] = parsed;
				map.setObjectSettings(pos.X, pos.Y, { Colors: toStoredColors(layers, next) });
				syncMap();
				FBM.renderObjectSettingsControls(pos, object);
			});
			row.appendChild(name);
			row.appendChild(sw);
			row.appendChild(hex);
			box.appendChild(row);
		});
		const colorBtns = document.createElement("div");
		colorBtns.className = "fbm-row";
		const resetColors = document.createElement("button");
		resetColors.type = "button";
		resetColors.className = "fbm-btn";
		resetColors.textContent = "Reset colors";
		resetColors.addEventListener("click", function () {
			map.setObjectSettings(pos.X, pos.Y, {
				Colors: layers.map(function () {
					return "Default";
				}),
			});
			syncMap();
			FBM.renderObjectSettingsControls(pos, object);
		});
		colorBtns.appendChild(resetColors);
		box.appendChild(colorBtns);
	}

	if (object.DecalArea && typeof AssetGetDecals === "function") {
		const head = document.createElement("div");
		head.className = "fbm-section-head";
		head.textContent = "Decal";
		box.appendChild(head);
		const row = document.createElement("div");
		row.className = "fbm-row";
		const select = document.createElement("select");
		const none = document.createElement("option");
		none.value = "";
		none.textContent = "None";
		select.appendChild(none);
		AssetGetDecals().forEach(function (d: any) {
			const opt = document.createElement("option");
			opt.value = d.Name;
			opt.textContent = d.Description || d.Name;
			select.appendChild(opt);
		});
		select.value = (settings && settings.Decal) || "";
		select.addEventListener("change", function () {
			const decal = select.value || undefined;
			map.setObjectSettings(pos.X, pos.Y, { Decal: decal, DecalColor: decal ? settings && settings.DecalColor : undefined });
			syncMap();
			FBM.renderObjectSettingsControls(pos, object);
		});
		row.appendChild(select);
		box.appendChild(row);
		if (settings && settings.Decal) {
			const dRow = document.createElement("div");
			dRow.className = "fbm-objset-layer-row";
			const dName = document.createElement("span");
			dName.className = "fbm-muted";
			dName.textContent = "Decal color";
			const dSw = document.createElement("button");
			dSw.type = "button";
			dSw.className = "fbm-objset-swatch";
			const dColor = settings.DecalColor || "#FFFFFF";
			dSw.style.backgroundColor = dColor;
			dSw.addEventListener("click", function () {
				FBM.openDecalColorPicker(pos, object, dColor);
			});
			dRow.appendChild(dName);
			dRow.appendChild(dSw);
			box.appendChild(dRow);
		}
	}
};

FBM.makeObjSetSlider = function (pos: { X: number; Y: number }, key: string, min: number, max: number, value: number) {
	const wrap = document.createElement("label");
	wrap.className = "fbm-objset-slider";
	const lab = document.createElement("span");
	lab.textContent = key;
	const input = document.createElement("input");
	input.type = "range";
	input.min = String(min);
	input.max = String(max);
	input.value = String(value);
	const out = document.createElement("span");
	out.className = "fbm-muted";
	out.textContent = String(value);
	input.addEventListener("input", function () {
		const map = mapApi();
		if (!map) return;
		const n = Number(input.value);
		out.textContent = String(n);
		const changes: any = {};
		changes[key] = n;
		map.setObjectSettings(pos.X, pos.Y, changes, !FBM._objectSettings.sliderChanging);
		FBM._objectSettings.sliderChanging = true;
	});
	input.addEventListener("change", function () {
		FBM._objectSettings.sliderChanging = false;
		syncMap();
	});
	wrap.appendChild(lab);
	wrap.appendChild(input);
	wrap.appendChild(out);
	return wrap;
};

FBM.openColorPicker = function (pos: { X: number; Y: number }, object: any, layerIndex: number) {
	const layers = colorableLayers(object);
	const colors = layerColorsResolved(pos, object);
	FBM._objectSettings.color.open = true;
	FBM._objectSettings.color.layerIndex = layerIndex;
	FBM._objectSettings.color.original = colors.slice();
	FBM._objectSettings.color.current = colors.slice();
	FBM._objectSettings.color.eyedrop = false;
	const pick = $("fbm-colorpick");
	if (pick) pick.hidden = false;
	const title = $("fbm-colorpick-title");
	if (title) title.textContent = objectDisplayName(object) + " — " + layerDisplayName(layers[layerIndex]);
	FBM.setColorPickerUI(colors[layerIndex]);
	livePreviewColors(pos, object, colors);
	FBM.refreshObjectSettingsToolUi();
};

FBM.openDecalColorPicker = function (pos: { X: number; Y: number }, object: any, color: string) {
	FBM._objectSettings.color.open = true;
	FBM._objectSettings.color.layerIndex = -2; /* decal sentinel */
	FBM._objectSettings.color.original = [color];
	FBM._objectSettings.color.current = [color];
	FBM._objectSettings.color.eyedrop = false;
	const pick = $("fbm-colorpick");
	if (pick) pick.hidden = false;
	const title = $("fbm-colorpick-title");
	if (title) title.textContent = objectDisplayName(object) + " — Decal";
	FBM.setColorPickerUI(color);
	FBM.refreshObjectSettingsToolUi();
};

FBM.setColorPickerUI = function (hex: string) {
	const hsv = rgbToHsv(hex);
	const hue = $("fbm-colorpick-hue") as HTMLInputElement | null;
	const hexEl = $("fbm-colorpick-hex") as HTMLInputElement | null;
	const sw = $("fbm-colorpick-swatch");
	const sv = $("fbm-colorpick-sv");
	const cur = $("fbm-colorpick-cursor");
	if (hue) hue.value = String(Math.round(hsv.h));
	if (hexEl) hexEl.value = hex.toUpperCase();
	if (sw) sw.style.backgroundColor = hex;
	if (sv) sv.style.backgroundColor = hsvToRgb(hsv.h, 1, 1);
	if (cur) {
		cur.style.left = hsv.s * 100 + "%";
		cur.style.top = (1 - hsv.v) * 100 + "%";
	}
};

FBM.applyLiveColorFromPicker = function () {
	const st = FBM._objectSettings;
	if (!st.color.open || !st.pos || st.objectId == null) return;
	const map = mapApi();
	if (!map) return;
	const object =
		typeof MapDataGetObject === "function"
			? MapDataGetObject(st.objectId)
			: typeof MapGetDoodad === "function"
				? MapGetDoodad("Object", st.objectId)
				: null;
	if (!object) return;
	const hexEl = $("fbm-colorpick-hex") as HTMLInputElement | null;
	const hex = parseHex((hexEl && hexEl.value) || "") || st.color.current[0];
	if (st.color.layerIndex === -2) {
		st.color.current[0] = hex;
		map.setObjectSettings(st.pos.X, st.pos.Y, { DecalColor: hex }, false);
		return;
	}
	const colors = st.color.current.slice();
	colors[st.color.layerIndex] = hex;
	st.color.current = colors;
	livePreviewColors(st.pos, object, colors);
};

FBM.commitColorPicker = function () {
	const st = FBM._objectSettings;
	if (!st.color.open || !st.pos || st.objectId == null) return;
	const map = mapApi();
	if (!map) return;
	const object =
		typeof MapDataGetObject === "function"
			? MapDataGetObject(st.objectId)
			: typeof MapGetDoodad === "function"
				? MapGetDoodad("Object", st.objectId)
				: null;
	if (!object) return;
	const hexEl = $("fbm-colorpick-hex") as HTMLInputElement | null;
	const hex = parseHex((hexEl && hexEl.value) || "") || st.color.current[Math.max(0, st.color.layerIndex)];
	if (st.color.layerIndex === -2) {
		map.setObjectSettings(st.pos.X, st.pos.Y, { DecalColor: hex });
		syncMap();
		FBM.closeColorPicker(true);
		FBM.renderObjectSettingsControls(st.pos, object);
		return;
	}
	const colors = st.color.current.slice();
	colors[st.color.layerIndex] = hex;
	clearColorPreview();
	map.setObjectSettings(st.pos.X, st.pos.Y, { Colors: toStoredColors(colorableLayers(object), colors) });
	syncMap();
	FBM.closeColorPicker(true);
	FBM.renderObjectSettingsControls(st.pos, object);
	setStatus("Color saved.");
};

FBM.closeColorPicker = function (keep: boolean) {
	const st = FBM._objectSettings;
	if (!st.color.open) return;
	clearColorPreview();
	if (!keep && st.pos && st.objectId != null) {
		const map = mapApi();
		const object =
			typeof MapDataGetObject === "function"
				? MapDataGetObject(st.objectId)
				: typeof MapGetDoodad === "function"
					? MapGetDoodad("Object", st.objectId)
					: null;
		/* Restore only when live preview wrote map data (no ColorPreview, or decal). */
		const usedPreviewGlobal = typeof ChatRoomMapViewColorPreview !== "undefined";
		if (map && object && st.color.layerIndex >= 0 && !usedPreviewGlobal) {
			map.setObjectSettings(st.pos.X, st.pos.Y, {
				Colors: toStoredColors(colorableLayers(object), st.color.original),
			}, false);
		}
		if (map && object && st.color.layerIndex === -2) {
			map.setObjectSettings(
				st.pos.X,
				st.pos.Y,
				{ DecalColor: st.color.original[0] === "#FFFFFF" ? undefined : st.color.original[0] },
				false
			);
		}
	}
	st.color.open = false;
	st.color.eyedrop = false;
	st.color.layerIndex = -1;
	const pick = $("fbm-colorpick");
	if (pick) pick.hidden = true;
	document.body.classList.remove("fbm-eyedrop-cursor");
	FBM.refreshObjectSettingsToolUi();
};

FBM.sampleColorFromMapClick = function (_tile: { X: number; Y: number }) {
	const el =
		typeof FBM.getMainCanvasEl === "function" ? FBM.getMainCanvasEl() : document.getElementById("MainCanvas");
	if (!el || !(el as HTMLCanvasElement).getContext) {
		FBM._objectSettings.color.eyedrop = false;
		document.body.classList.remove("fbm-eyedrop-cursor");
		return;
	}
	const canvas = el as HTMLCanvasElement;
	const clubW = 2000;
	const clubH = 1000;
	const mx = typeof MouseX === "number" ? MouseX : 500;
	const my = typeof MouseY === "number" ? MouseY : 500;
	const px = Math.max(0, Math.min(canvas.width - 1, Math.floor((mx / clubW) * canvas.width)));
	const py = Math.max(0, Math.min(canvas.height - 1, Math.floor((my / clubH) * canvas.height)));
	try {
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const data = ctx.getImageData(px, py, 1, 1).data;
		const hex =
			"#" +
			[data[0], data[1], data[2]]
				.map(function (n) {
					return n.toString(16).toUpperCase().padStart(2, "0");
				})
				.join("");
		FBM.setColorPickerUI(hex);
		const hexEl = $("fbm-colorpick-hex") as HTMLInputElement | null;
		if (hexEl) hexEl.value = hex;
		FBM.applyLiveColorFromPicker();
		setStatus("Sampled " + hex + ".");
	} catch (e) {
		setStatus("Could not sample canvas pixel.");
	}
	FBM._objectSettings.color.eyedrop = false;
	document.body.classList.remove("fbm-eyedrop-cursor");
};

FBM.bindObjectSettingsUi = function () {
	if (FBM._objectSettings.bound) return;
	FBM._objectSettings.bound = true;
	const panel = $("fbm-objset");
	const header = $("fbm-objset-header");
	const close = $("fbm-objset-close");
	if (close) {
		close.addEventListener("click", function () {
			FBM.closeObjectSettingsPick();
		});
	}
	const saveVar = $("fbm-objset-save-variant");
	if (saveVar) {
		saveVar.addEventListener("click", function () {
			FBM.saveObjectSettingsAsVariant();
		});
	}
	if (panel && header) {
		let dragging = false;
		let ox = 0;
		let oy = 0;
		header.addEventListener("pointerdown", function (e) {
			if ((e.target as HTMLElement).closest("button")) return;
			dragging = true;
			panel.style.transform = "none";
			const r = panel.getBoundingClientRect();
			ox = e.clientX - r.left;
			oy = e.clientY - r.top;
			header.setPointerCapture(e.pointerId);
		});
		header.addEventListener("pointermove", function (e) {
			if (!dragging) return;
			panel.style.left = Math.max(0, e.clientX - ox) + "px";
			panel.style.top = Math.max(0, e.clientY - oy) + "px";
		});
		header.addEventListener("pointerup", function () {
			dragging = false;
		});
	}

	const cancel = $("fbm-colorpick-cancel");
	const ok = $("fbm-colorpick-ok");
	const closePick = $("fbm-colorpick-close");
	if (cancel) cancel.addEventListener("click", function () {
		FBM.closeColorPicker(false);
	});
	if (closePick) closePick.addEventListener("click", function () {
		FBM.closeColorPicker(false);
	});
	if (ok) ok.addEventListener("click", function () {
		FBM.commitColorPicker();
	});

	const hue = $("fbm-colorpick-hue") as HTMLInputElement | null;
	const hex = $("fbm-colorpick-hex") as HTMLInputElement | null;
	const sv = $("fbm-colorpick-sv");
	if (hue) {
		hue.addEventListener("input", function () {
			const curHex = parseHex((hex && hex.value) || "#FFFFFF") || "#FFFFFF";
			const hsv = rgbToHsv(curHex);
			hsv.h = Number(hue.value);
			const next = hsvToRgb(hsv.h, hsv.s, hsv.v);
			FBM.setColorPickerUI(next);
			if (hex) hex.value = next;
			FBM.applyLiveColorFromPicker();
		});
	}
	if (hex) {
		hex.addEventListener("input", function () {
			const parsed = parseHex(hex.value);
			if (!parsed) return;
			FBM.setColorPickerUI(parsed);
			FBM.applyLiveColorFromPicker();
		});
	}
	if (sv) {
		const pickSv = function (e: PointerEvent) {
			const r = sv.getBoundingClientRect();
			const s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
			const v = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
			const h = Number((hue && hue.value) || 0);
			const next = hsvToRgb(h, s, v);
			FBM.setColorPickerUI(next);
			if (hex) hex.value = next;
			FBM.applyLiveColorFromPicker();
		};
		let dragging = false;
		sv.addEventListener("pointerdown", function (e) {
			dragging = true;
			sv.setPointerCapture(e.pointerId);
			pickSv(e);
		});
		sv.addEventListener("pointermove", function (e) {
			if (dragging) pickSv(e);
		});
		sv.addEventListener("pointerup", function () {
			dragging = false;
		});
	}

	const eye = $("fbm-colorpick-eyedrop");
	if (eye) {
		eye.addEventListener("click", function () {
			FBM._objectSettings.color.eyedrop = !FBM._objectSettings.color.eyedrop;
			document.body.classList.toggle("fbm-eyedrop-cursor", FBM._objectSettings.color.eyedrop);
			setStatus(FBM._objectSettings.color.eyedrop ? "Click the map to sample a color." : "Eyedropper off.");
		});
	}

	document.addEventListener(
		"keydown",
		function (e) {
			if (!FBM._objectSettings.color.open && !FBM._objectSettings.panelOpen) return;
			if (e.key === "Enter" && FBM._objectSettings.color.open) {
				e.preventDefault();
				FBM.commitColorPicker();
			}
			if (e.key === "Escape") {
				if (FBM._objectSettings.color.eyedrop) {
					FBM._objectSettings.color.eyedrop = false;
					document.body.classList.remove("fbm-eyedrop-cursor");
					e.preventDefault();
					return;
				}
				if (FBM._objectSettings.color.open) {
					FBM.closeColorPicker(false);
					e.preventDefault();
					return;
				}
				if (FBM._objectSettings.panelOpen) {
					FBM.closeObjectSettingsPick();
					e.preventDefault();
				}
			}
		},
		true
	);
};

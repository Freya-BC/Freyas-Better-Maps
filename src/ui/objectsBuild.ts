/** Freyas Better Maps — Objects Build floating window */
import { FBM, type FBMMarkedElement } from "../fbm";

function $(id: string): FBMMarkedElement | null {
	return document.getElementById(id) as FBMMarkedElement | null;
}

const ICONS = {
	pipet: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4.5l5 5M3 21l7.5-7.5M12 8l4 4M14 6l2-2a1.5 1.5 0 0 1 2 2l-2 2"/></svg>',
	eraser: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 21h14M3.5 13.5l7-7 6 6-7 7H5.5l-2-2z"/></svg>',
	gear: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
	fog: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h12a4 4 0 1 0-1-7.9A5 5 0 0 0 5 11H4a3 3 0 0 0 0 6h1M8 20h10M6 17h12"/></svg>',
	undo: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14 4 9l5-5M4 9h10a5 5 0 0 1 0 10h-2"/></svg>',
	single: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h6v6H4zM14 4h6v6h-6zM9 14l6 6M15 14l-6 6"/></svg>',
	clear: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>',
	save: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
	load: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
};

FBM._objectsUi = {
	open: false,
	sectionId: "tiles",
	categoryId: "",
	baseId: null as string | null,
	variantId: null as string | null,
	search: "",
	fogOn: false,
	eraserOn: false,
	bound: false,
	collapsedSections: {} as Record<string, boolean>,
};

function applyThumbStyle(el: HTMLElement | null, src: { thumbUrl?: string; thumbCss?: string } | null) {
	if (!el || !src) return;
	if (src.thumbUrl) {
		el.style.backgroundImage = 'url("' + src.thumbUrl + '")';
		el.style.backgroundSize = "contain";
		el.style.backgroundRepeat = "no-repeat";
		el.style.backgroundPosition = "center";
		el.style.backgroundColor = "#2a3038";
	} else if (src.thumbCss) {
		el.style.backgroundImage = "";
		el.style.backgroundColor = src.thumbCss;
	}
}

function setStatus(msg: string) {
	const el = $("fbm-obj-status");
	if (el) el.textContent = msg || "";
}

function applyObjectsIconSize(size?: number) {
	if (!FBM.objectsState) FBM.loadObjectsState();
	const n = FBM.clampObjectsIconSize(
		size != null ? size : FBM.objectsState && FBM.objectsState.ui && FBM.objectsState.ui.iconSize
	);
	if (FBM.objectsState && FBM.objectsState.ui) FBM.objectsState.ui.iconSize = n;
	const panel = $("fbm-objects");
	if (panel) panel.style.setProperty("--fbm-obj-cell-min", n + "px");
	const slider = document.getElementById("fbm-obj-icon-size") as HTMLInputElement | null;
	if (slider) slider.value = String(n);
	const val = $("fbm-obj-icon-size-val");
	if (val) val.textContent = String(n);
}

function matchesSearch(text: string) {
	const q = (FBM._objectsUi.search || "").trim().toLowerCase();
	if (!q) return true;
	return String(text || "").toLowerCase().includes(q);
}

function baseMatches(base: any) {
	if (matchesSearch(base.name) || matchesSearch(base.type) || matchesSearch(base.style)) return true;
	return (base.variants || []).some(function (v: any) {
		return matchesSearch(v.name) || matchesSearch(v.displayName) || matchesSearch(v.colorHint);
	});
}

function categoryMatches(cat: any) {
	if (matchesSearch(cat.label)) return true;
	return (cat.bases || []).some(baseMatches);
}

function currentCatalog() {
	return FBM.prepareObjectsCatalog ? FBM.prepareObjectsCatalog() : FBM.getCatalog();
}

function findVariant(base: any, variantId: string | null) {
	return (base.variants || []).find(function (v: any) {
		return v && v.id === variantId;
	});
}

function placeSettingsFor(base: any, variant: any) {
	if (!base.canCustomize || !variant) return null;
	return {
		rotation: variant.rotation || 0,
		size: variant.size != null ? variant.size : 100,
		colors: Array.isArray(variant.colors) ? variant.colors.slice() : [],
	};
}

function armSelection() {
	const hit = FBM.findCatalogBase(FBM._objectsUi.baseId);
	if (!hit) return;
	const v = findVariant(hit.base, FBM._objectsUi.variantId) || hit.base.variants[0];
	if (!v) return;
	const single = !!(FBM.objectsState && FBM.objectsState.singlePlace);
	FBM._objectsUi.eraserOn = false;
	FBM.objectsArmBrush({
		kind: hit.base.kind,
		clubId: v.clubId,
		settings: placeSettingsFor(hit.base, v),
		single: single,
	});
	FBM.pushObjectsRecent(hit.base.id, v.id);
	setStatus((single ? "Single" : "Brush") + ": " + hit.base.name + " / " + v.name + " — Esc / ✕ clears");
	FBM.refreshObjectsBuildUi();
}

function hasDrawingSelection() {
	return !!(
		(FBM._objectsPaint && (FBM._objectsPaint.armed || FBM._objectsPaint.pipet)) ||
		FBM._objectsUi.eraserOn ||
		FBM._objectsUi.baseId
	);
}

/** Clear armed brush / eraser / pipet and catalog highlight. */
FBM.clearObjectsSelection = function () {
	FBM.objectsClearBrush && FBM.objectsClearBrush();
	FBM.objectsSetPipet && FBM.objectsSetPipet(false);
	FBM._objectsUi.eraserOn = false;
	FBM._objectsUi.baseId = null;
	FBM._objectsUi.variantId = null;
	if (FBM.refreshObjectsBuildUi) FBM.refreshObjectsBuildUi();
	setStatus("Selection cleared.");
};

FBM.installObjectsSelectionEscape = function () {
	if (FBM._objectsEscBound) return;
	FBM._objectsEscBound = true;
	document.addEventListener(
		"keydown",
		function (e) {
			if (!e || (e.key !== "Escape" && e.code !== "Escape")) return;
			if (FBM._capturingHotkey) return;
			if (
				FBM._objectSettings &&
				(FBM._objectSettings.color.open || FBM._objectSettings.panelOpen || FBM._objectSettings.pick)
			)
				return;
			if (FBM._copy && FBM._copy.mode) return;
			const tpl = document.getElementById("fbm-templates");
			if (tpl && !tpl.hidden) return;
			if (!hasDrawingSelection()) return;
			const t = e.target as HTMLElement | null;
			if (
				t &&
				(t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable) &&
				(!t.closest || !t.closest("#fbm-root"))
			)
				return;
			e.preventDefault();
			e.stopPropagation();
			FBM.clearObjectsSelection();
		},
		true
	);
};

FBM.objectsBuildMarkup = function () {
	return (
		'<div class="fbm-objects" id="fbm-objects" hidden>' +
		'<div class="fbm-header" id="fbm-obj-header">' +
		'<div class="fbm-header-title">Objects Build <span class="fbm-badge">beta</span></div>' +
		'<button type="button" class="fbm-icon-btn" id="fbm-obj-close" title="Close">×</button></div>' +
		'<div class="fbm-obj-actionbar">' +
		'<input type="search" id="fbm-obj-search" class="fbm-obj-search" placeholder="Search…" autocomplete="off" />' +
		'<button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-pipet" title="Pipet">' +
		ICONS.pipet +
		"</button>" +
		'<button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-eraser" title="Eraser">' +
		ICONS.eraser +
		"</button>" +
		'<button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-settings-tool" title="Object settings (FBM)">' +
		ICONS.gear +
		"</button>" +
		'<button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-fog" title="Fog">' +
		ICONS.fog +
		"</button>" +
		'<button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-undo" title="Undo">' +
		ICONS.undo +
		"</button>" +
		'<span class="fbm-obj-action-sep"></span>' +
		'<button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-single" title="Single place">' +
		ICONS.single +
		"</button>" +
		'<button type="button" class="fbm-icon-btn fbm-obj-tool fbm-obj-clear" id="fbm-obj-clear" title="Clear drawing selection (Esc)">' +
		ICONS.clear +
		"</button>" +
		'<span class="fbm-obj-action-sep"></span>' +
		'<button type="button" class="fbm-icon-btn" id="fbm-obj-save-cat" title="Export catalog JSON">' +
		ICONS.save +
		"</button>" +
		'<button type="button" class="fbm-icon-btn" id="fbm-obj-load-cat" title="Import catalog JSON">' +
		ICONS.load +
		"</button>" +
		'<input type="file" id="fbm-obj-load-file" accept="application/json,.json" hidden />' +
		'<label class="fbm-obj-icon-size" title="Catalog icon size">' +
		"<span>Icons</span>" +
		'<input type="range" id="fbm-obj-icon-size" min="48" max="96" step="8" value="96" />' +
		'<span id="fbm-obj-icon-size-val">96</span>' +
		"</label>" +
		"</div>" +
		'<div class="fbm-obj-body" id="fbm-obj-body">' +
		'<aside class="fbm-obj-tree" id="fbm-obj-tree"></aside>' +
		'<section class="fbm-obj-grid-wrap"><div class="fbm-obj-grid-head"><span id="fbm-obj-grid-title">Select a category</span>' +
		'<span class="fbm-muted fbm-hint" id="fbm-obj-brush-label"></span></div>' +
		'<div class="fbm-obj-grid" id="fbm-obj-grid"></div></section>' +
		'<div class="fbm-obj-splitter" id="fbm-obj-splitter" title="Resize detail"></div>' +
		'<aside class="fbm-obj-ext" id="fbm-obj-ext">' +
		'<p class="fbm-muted fbm-hint" id="fbm-obj-ext-empty">Select an item to see variants.</p>' +
		'<div id="fbm-obj-ext-body" hidden>' +
		'<div class="fbm-obj-preview"><div class="fbm-obj-preview-swatch" id="fbm-obj-preview-swatch"></div>' +
		'<div class="fbm-obj-preview-text"><div class="fbm-obj-preview-name" id="fbm-obj-preview-name"></div>' +
		'<div class="fbm-muted fbm-hint" id="fbm-obj-preview-meta"></div></div></div>' +
		'<div class="fbm-section-head">Variants</div>' +
		'<div class="fbm-obj-variants" id="fbm-obj-variants"></div>' +
		'<div class="fbm-row" id="fbm-obj-custom-actions" hidden>' +
		'<button type="button" class="fbm-btn" id="fbm-obj-edit-variant" title="Rename this custom variant">Rename</button>' +
		'<button type="button" class="fbm-btn fbm-btn-danger" id="fbm-obj-del-variant">Delete</button></div>' +
		"</div></aside></div>" +
		'<div class="fbm-obj-recent-wrap"><div class="fbm-obj-recent-label">Recent</div>' +
		'<div class="fbm-obj-recent" id="fbm-obj-recent"></div></div>' +
		'<div class="fbm-obj-status" id="fbm-obj-status"></div></div>'
	);
};

function isSectionCollapsed(secId: string) {
	if (!FBM.objectsState) FBM.loadObjectsState();
	const stored = FBM.objectsState && FBM.objectsState.ui && FBM.objectsState.ui.collapsedSections;
	if (stored && typeof stored[secId] === "boolean") return stored[secId];
	return !!FBM._objectsUi.collapsedSections[secId];
}

function toggleSectionCollapsed(secId: string) {
	if (!FBM.objectsState) FBM.loadObjectsState();
	if (!FBM.objectsState.ui.collapsedSections) FBM.objectsState.ui.collapsedSections = {};
	const next = !isSectionCollapsed(secId);
	FBM.objectsState.ui.collapsedSections[secId] = next;
	FBM._objectsUi.collapsedSections[secId] = next;
	FBM.saveObjectsState();
	FBM.refreshObjectsBuildUi();
}

function renderTree() {
	const tree = $("fbm-obj-tree");
	const cat = currentCatalog();
	if (!tree || !cat) return;
	tree.innerHTML = "";
	cat.sections.forEach(function (sec: any) {
		const wrap = document.createElement("div");
		wrap.className = "fbm-obj-sec" + (isSectionCollapsed(sec.id) ? " fbm-collapsed" : "");
		const title = document.createElement("button");
		title.type = "button";
		title.className = "fbm-obj-sec-title";
		title.textContent = sec.label;
		title.title = "Click to collapse / expand";
		title.addEventListener("click", function () {
			toggleSectionCollapsed(sec.id);
		});
		wrap.appendChild(title);
		(sec.categories || []).forEach(function (c: any, idx: number) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "fbm-obj-cat";
			if (sec.id === FBM._objectsUi.sectionId && c.id === FBM._objectsUi.categoryId) btn.classList.add("fbm-on");
			if (!categoryMatches(c)) btn.classList.add("fbm-cat-hidden");
			btn.draggable = true;
			btn.dataset.section = sec.id;
			btn.dataset.category = c.id;
			btn.innerHTML = '<span class="fbm-obj-cat-handle">⋮⋮</span><span></span>';
			(btn.querySelector("span:last-child") as HTMLElement).textContent = c.label;
			btn.addEventListener("click", function () {
				FBM._objectsUi.sectionId = sec.id;
				FBM._objectsUi.categoryId = c.id;
				FBM._objectsUi.baseId = null;
				FBM._objectsUi.variantId = null;
				FBM.refreshObjectsBuildUi();
			});
			btn.addEventListener("dragstart", function (e) {
				e.dataTransfer!.setData("text/plain", sec.id + "|" + c.id);
				e.dataTransfer!.effectAllowed = "move";
			});
			btn.addEventListener("dragover", function (e) {
				e.preventDefault();
				btn.classList.add("fbm-drag-over");
			});
			btn.addEventListener("dragleave", function () {
				btn.classList.remove("fbm-drag-over");
			});
			btn.addEventListener("drop", function (e) {
				e.preventDefault();
				btn.classList.remove("fbm-drag-over");
				const parts = (e.dataTransfer!.getData("text/plain") || "").split("|");
				if (parts[0] !== sec.id || !parts[1] || parts[1] === c.id) return;
				const list = sec.categories;
				const fromIdx = list.findIndex(function (x: any) {
					return x.id === parts[1];
				});
				const toIdx = idx;
				if (fromIdx < 0) return;
				const moved = list.splice(fromIdx, 1)[0];
				list.splice(toIdx, 0, moved);
				if (!FBM.objectsState) FBM.loadObjectsState();
				FBM.objectsState.categoryOrder[sec.id] = list.map(function (x: any) {
					return x.id;
				});
				FBM.saveObjectsState();
				FBM.refreshObjectsBuildUi();
			});
			wrap.appendChild(btn);
		});
		tree.appendChild(wrap);
	});
}

function renderGrid() {
	const grid = $("fbm-obj-grid");
	const title = $("fbm-obj-grid-title");
	const brush = $("fbm-obj-brush-label");
	const cat = currentCatalog();
	if (!grid || !cat) return;
	const sec = cat.sections.find(function (s: any) {
		return s.id === FBM._objectsUi.sectionId;
	});
	const category = sec && (sec.categories || []).find(function (c: any) {
		return c.id === FBM._objectsUi.categoryId;
	});
	if (title) title.textContent = category ? sec.label + " · " + category.label : "Select a category";
	if (brush) {
		const mode = FBM.objectsState && FBM.objectsState.singlePlace ? "Single" : "Brush";
		const armed = FBM._objectsPaint && FBM._objectsPaint.armed;
		brush.textContent = armed ? "Place: " + mode + " (armed)" : "Place: " + mode;
	}
	grid.innerHTML = "";
	if (!category) return;
	const bases = (category.bases || []).filter(baseMatches);
	if (!bases.length) {
		grid.innerHTML = '<p class="fbm-muted fbm-hint">No items match.</p>';
		return;
	}
	bases.forEach(function (base: any) {
		const card = document.createElement("button");
		card.type = "button";
		card.className = "fbm-obj-card";
		if (base.id === FBM._objectsUi.baseId) card.classList.add("fbm-on");
		const thumb = document.createElement("div");
		thumb.className = "fbm-obj-card-thumb";
		applyThumbStyle(thumb, base);
		const name = document.createElement("div");
		name.className = "fbm-obj-card-name";
		name.textContent = base.name;
		const meta = document.createElement("div");
		meta.className = "fbm-obj-card-meta";
		meta.textContent = (base.variants || []).length + " var.";
		card.appendChild(thumb);
		card.appendChild(name);
		card.appendChild(meta);
		card.addEventListener("click", function () {
			if (base.id === FBM._objectsUi.baseId && hasDrawingSelection()) {
				FBM.clearObjectsSelection();
				return;
			}
			FBM._objectsUi.baseId = base.id;
			FBM._objectsUi.variantId = base.variants[0] ? base.variants[0].id : null;
			armSelection();
		});
		grid.appendChild(card);
	});
}

function renderExtended() {
	const empty = $("fbm-obj-ext-empty");
	const body = $("fbm-obj-ext-body");
	const hit = FBM._objectsUi.baseId ? FBM.findCatalogBase(FBM._objectsUi.baseId) : null;
	if (!body) return;
	if (!hit) {
		if (empty) empty.hidden = false;
		body.hidden = true;
		return;
	}
	if (empty) empty.hidden = true;
	body.hidden = false;
	const base = hit.base;
	const variant = findVariant(base, FBM._objectsUi.variantId) || base.variants[0];
	const name = $("fbm-obj-preview-name");
	const meta = $("fbm-obj-preview-meta");
	const sw = $("fbm-obj-preview-swatch");
	const customActs = $("fbm-obj-custom-actions");
	if (name) name.textContent = base.name;
	if (meta) {
		meta.textContent =
			base.kind +
			(variant ? " · " + variant.name : "") +
			(variant && variant.clubId != null ? " · ID " + variant.clubId : "") +
			(base.canCustomize ? " · customizable" : " · baked");
	}
	if (sw) applyThumbStyle(sw, variant && (variant.thumbUrl || variant.thumbCss) ? variant : base);
	if (customActs) customActs.hidden = !(variant && variant.custom === true);
	const variantsEl = $("fbm-obj-variants");
	if (variantsEl) {
		variantsEl.innerHTML = "";
		(base.variants || [])
			.filter(function (v: any) {
				return !FBM._objectsUi.search || matchesSearch(v.name) || matchesSearch(base.name);
			})
			.forEach(function (v: any) {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "fbm-obj-variant" + (v.custom ? " fbm-obj-variant-custom" : "");
				if (v.id === FBM._objectsUi.variantId) btn.classList.add("fbm-on");
				btn.innerHTML =
					'<span class="fbm-obj-variant-swatch"></span><span class="fbm-obj-variant-name"></span>';
				const swEl = btn.querySelector(".fbm-obj-variant-swatch") as HTMLElement;
				applyThumbStyle(swEl, v.thumbUrl || v.thumbCss ? v : base);
				(btn.querySelector(".fbm-obj-variant-name") as HTMLElement).textContent =
					v.name + (v.custom ? " ★" : "");
				btn.addEventListener("click", function () {
					if (
						v.id === FBM._objectsUi.variantId &&
						base.id === FBM._objectsUi.baseId &&
						hasDrawingSelection()
					) {
						FBM.clearObjectsSelection();
						return;
					}
					FBM._objectsUi.variantId = v.id;
					armSelection();
				});
				variantsEl.appendChild(btn);
			});
	}
}

function renderRecent() {
	const row = $("fbm-obj-recent");
	if (!row) return;
	if (!FBM.objectsState) FBM.loadObjectsState();
	row.innerHTML = "";
	const list = FBM.objectsState.recent || [];
	if (!list.length) {
		row.innerHTML = '<span class="fbm-obj-recent-empty">No recent items.</span>';
		return;
	}
	const maxFit = Math.max(1, Math.floor((row.clientWidth || 400) / 42));
	list.slice(0, maxFit).forEach(function (r: any) {
		const hit = FBM.findCatalogBase(r.baseId);
		if (!hit) return;
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "fbm-obj-recent-item";
		btn.title = hit.base.name;
		const recentVar = findVariant(hit.base, r.variantId);
		applyThumbStyle(btn, recentVar && (recentVar.thumbUrl || recentVar.thumbCss) ? recentVar : hit.base);
		btn.addEventListener("click", function () {
			if (
				r.baseId === FBM._objectsUi.baseId &&
				r.variantId === FBM._objectsUi.variantId &&
				hasDrawingSelection()
			) {
				FBM.clearObjectsSelection();
				return;
			}
			FBM._objectsUi.baseId = r.baseId;
			FBM._objectsUi.variantId = r.variantId;
			FBM._objectsUi.sectionId = hit.section.id;
			FBM._objectsUi.categoryId = hit.category.id;
			armSelection();
		});
		row.appendChild(btn);
	});
}

function renderTools() {
	const single = $("fbm-obj-single");
	const pipet = $("fbm-obj-pipet");
	const eraser = $("fbm-obj-eraser");
	const fog = $("fbm-obj-fog");
	const clear = $("fbm-obj-clear");
	if (single) single.classList.toggle("fbm-on", !!(FBM.objectsState && FBM.objectsState.singlePlace));
	if (pipet) pipet.classList.toggle("fbm-on", !!(FBM._objectsPaint && FBM._objectsPaint.pipet));
	if (eraser) eraser.classList.toggle("fbm-on", !!FBM._objectsUi.eraserOn);
	if (fog) fog.classList.toggle("fbm-on", !!FBM._objectsUi.fogOn);
	if (clear) {
		clear.classList.toggle("fbm-on", hasDrawingSelection());
		clear.disabled = !hasDrawingSelection();
	}
	const bar = $("fbm-bar-objects");
	const panel = $("fbm-objects");
	if (bar && panel) bar.classList.toggle("fbm-on", !panel.hidden);
}

FBM.refreshObjectsBuildUi = function () {
	const panel = $("fbm-objects");
	if (!panel || panel.hidden) {
		renderTools();
		return;
	}
	const cat = currentCatalog();
	if (cat && !FBM._objectsUi.categoryId) {
		const sec = cat.sections[0];
		if (sec && sec.categories[0]) {
			FBM._objectsUi.sectionId = sec.id;
			FBM._objectsUi.categoryId = sec.categories[0].id;
		}
	}
	renderTree();
	renderGrid();
	renderExtended();
	renderRecent();
	renderTools();
};

FBM.openObjectsBuild = function () {
	FBM.ensureUi();
	FBM.installObjectsPaintHook && FBM.installObjectsPaintHook();
	FBM.installObjectsSelectionEscape && FBM.installObjectsSelectionEscape();
	FBM.prepareObjectsCatalog && FBM.prepareObjectsCatalog();
	FBM.loadObjectsState && FBM.loadObjectsState();
	const panel = $("fbm-objects");
	if (!panel) return;
	panel.hidden = false;
	FBM._objectsUi.open = true;
	const ui = FBM.objectsState && FBM.objectsState.ui;
	if (ui) {
		if (ui.left != null) {
			panel.style.left = ui.left + "px";
			panel.style.top = (ui.top || 96) + "px";
			panel.style.transform = "none";
		}
		if (ui.width) panel.style.width = ui.width + "px";
		if (ui.height) panel.style.height = ui.height + "px";
		const body = $("fbm-obj-body");
		if (body && ui.extWidth) body.style.setProperty("--fbm-obj-ext-w", ui.extWidth + "px");
	}
	applyObjectsIconSize();
	FBM.bindObjectsBuildUi();
	FBM.refreshObjectsBuildUi();
	setStatus("Objects Build ready.");
};

FBM.closeObjectsBuild = function () {
	const panel = $("fbm-objects");
	if (panel) panel.hidden = true;
	FBM._objectsUi.open = false;
	FBM.clearObjectsSelection();
};

FBM.toggleObjectsBuild = function () {
	const panel = $("fbm-objects");
	if (panel && !panel.hidden) FBM.closeObjectsBuild();
	else FBM.openObjectsBuild();
};

FBM.bindObjectsBuildUi = function () {
	if (FBM._objectsUi.bound) return;
	FBM._objectsUi.bound = true;
	const panel = $("fbm-objects");
	const header = $("fbm-obj-header");
	const close = $("fbm-obj-close");
	if (close) {
		close.addEventListener("click", function () {
			FBM.closeObjectsBuild();
		});
	}
	if (panel && header) {
		let ox = 0;
		let oy = 0;
		let dragging = false;
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
			if (!FBM.objectsState) FBM.loadObjectsState();
			const r = panel.getBoundingClientRect();
			FBM.objectsState.ui.left = Math.round(r.left);
			FBM.objectsState.ui.top = Math.round(r.top);
			FBM.objectsState.ui.width = Math.round(r.width);
			FBM.objectsState.ui.height = Math.round(r.height);
			FBM.saveObjectsState();
		});
	}
	const split = $("fbm-obj-splitter");
	const body = $("fbm-obj-body");
	if (split && body) {
		let dragging = false;
		split.addEventListener("pointerdown", function (e) {
			dragging = true;
			split.classList.add("fbm-on");
			split.setPointerCapture(e.pointerId);
		});
		split.addEventListener("pointermove", function (e) {
			if (!dragging) return;
			const r = body.getBoundingClientRect();
			const w = Math.min(Math.max(200, r.right - e.clientX), r.width - 168 - 6 - 180);
			body.style.setProperty("--fbm-obj-ext-w", w + "px");
		});
		split.addEventListener("pointerup", function () {
			dragging = false;
			split.classList.remove("fbm-on");
			if (!FBM.objectsState) FBM.loadObjectsState();
			const w = parseInt(getComputedStyle(body).getPropertyValue("--fbm-obj-ext-w"), 10);
			if (isFinite(w)) {
				FBM.objectsState.ui.extWidth = w;
				FBM.saveObjectsState();
			}
			renderRecent();
		});
	}
	const search = $("fbm-obj-search") as HTMLInputElement | null;
	if (search) {
		search.addEventListener("input", function () {
			FBM._objectsUi.search = search.value || "";
			FBM.refreshObjectsBuildUi();
		});
	}
	const iconSize = document.getElementById("fbm-obj-icon-size") as HTMLInputElement | null;
	if (iconSize && !(iconSize as FBMMarkedElement)._fbmBound) {
		(iconSize as FBMMarkedElement)._fbmBound = true;
		iconSize.addEventListener("input", function () {
			applyObjectsIconSize(Number(iconSize.value));
			FBM.saveObjectsState();
		});
	}
	const single = $("fbm-obj-single");
	if (single) {
		single.addEventListener("click", function () {
			if (!FBM.objectsState) FBM.loadObjectsState();
			FBM.objectsState.singlePlace = !FBM.objectsState.singlePlace;
			FBM.saveObjectsState();
			if (FBM._objectsPaint && FBM._objectsPaint.armed) armSelection();
			FBM.refreshObjectsBuildUi();
		});
	}
	const clearBtn = $("fbm-obj-clear");
	if (clearBtn) {
		clearBtn.addEventListener("click", function () {
			FBM.clearObjectsSelection();
		});
	}
	const pipet = $("fbm-obj-pipet");
	if (pipet) {
		pipet.addEventListener("click", function () {
			const on = !(FBM._objectsPaint && FBM._objectsPaint.pipet);
			FBM.objectsSetPipet(on);
			FBM._objectsUi.eraserOn = false;
			setStatus(on ? "Pipet on — click a map tile." : "Pipet off.");
			renderTools();
		});
	}
	const eraser = $("fbm-obj-eraser");
	if (eraser) {
		eraser.addEventListener("click", function () {
			FBM._objectsUi.eraserOn = !FBM._objectsUi.eraserOn;
			if (FBM._objectsUi.eraserOn) {
				FBM.objectsArmEraser();
				FBM.objectsSetPipet(false);
				setStatus("Eraser on.");
			} else {
				FBM.objectsClearBrush();
				setStatus("Eraser off.");
			}
			renderTools();
		});
	}
	const fog = $("fbm-obj-fog");
	if (fog) {
		fog.addEventListener("click", function () {
			FBM._objectsUi.fogOn = !!FBM.objectsToggleFog();
			setStatus("Fog " + (FBM._objectsUi.fogOn ? "on" : "off") + ".");
			renderTools();
		});
	}
	const undo = $("fbm-obj-undo");
	if (undo) {
		undo.addEventListener("click", function () {
			FBM.objectsUndo();
			setStatus("Undo.");
		});
	}
	const editVar = $("fbm-obj-edit-variant");
	if (editVar) {
		editVar.addEventListener("click", function () {
			const hit = FBM.findCatalogBase(FBM._objectsUi.baseId);
			const v = hit && findVariant(hit.base, FBM._objectsUi.variantId);
			if (!v || !v.custom) return;
			if (!FBM.promptText) return;
			FBM.promptText("Rename variant", {
				initial: v.name || "",
				confirmLabel: "Rename",
				maxlength: 40,
			}).then(function (next: string | null) {
				if (next == null) return;
				const trimmed = String(next).trim().slice(0, 40);
				if (!trimmed) return;
				v.name = trimmed;
				FBM.saveCustomVariant(hit.base.id, v);
				FBM.refreshObjectsBuildUi();
				setStatus("Renamed to “" + v.name + "”.");
			});
		});
	}
	const delVar = $("fbm-obj-del-variant");
	if (delVar) {
		delVar.addEventListener("click", function () {
			const hit = FBM.findCatalogBase(FBM._objectsUi.baseId);
			const v = hit && findVariant(hit.base, FBM._objectsUi.variantId);
			if (!v || !v.custom) return;
			if (!confirm("Delete custom variant “" + v.name + "”?")) return;
			FBM.deleteCustomVariant(hit.base.id, v.id);
			FBM._objectsUi.variantId = hit.base.variants[0] ? hit.base.variants[0].id : null;
			armSelection();
		});
	}
	const saveCat = $("fbm-obj-save-cat");
	if (saveCat) {
		saveCat.addEventListener("click", function () {
			const payload = {
				objectsState: FBM.objectsState,
				catalogFingerprint: FBM._catalog && FBM._catalog.fingerprint,
				exportedAt: Date.now(),
			};
			const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = "fbm-objects-catalog.json";
			a.click();
			URL.revokeObjectURL(a.href);
			setStatus("Exported Objects Build data.");
		});
	}
	const loadCat = $("fbm-obj-load-cat");
	const loadFile = $("fbm-obj-load-file") as HTMLInputElement | null;
	if (loadCat && loadFile) {
		loadCat.addEventListener("click", function () {
			loadFile.click();
		});
		loadFile.addEventListener("change", function () {
			const f = loadFile.files && loadFile.files[0];
			if (!f) return;
			const reader = new FileReader();
			reader.onload = function () {
				try {
					const data = JSON.parse(String(reader.result || ""));
					if (data.objectsState) {
						FBM.objectsState = Object.assign(FBM.loadObjectsState(), data.objectsState);
						FBM.saveObjectsState();
					}
					FBM.prepareObjectsCatalog();
					FBM.refreshObjectsBuildUi();
					setStatus("Imported “" + f.name + "”.");
				} catch (e) {
					setStatus("Import failed.");
				}
				loadFile.value = "";
			};
			reader.readAsText(f);
		});
	}
	const settingsTool = $("fbm-obj-settings-tool");
	if (settingsTool) {
		settingsTool.addEventListener("click", function () {
			if (FBM.toggleObjectSettingsPick) FBM.toggleObjectSettingsPick();
			else setStatus("Object Settings unavailable.");
		});
	}
};

/** Map click while Objects pipet is on. */
FBM.objectsHandleMapClick = function (tile: { X: number; Y: number }) {
	if (!FBM._objectsPaint || !FBM._objectsPaint.pipet) return false;
	const found = FBM.objectsPipetSample(tile.X, tile.Y);
	if (!found) return true;
	FBM._objectsUi.baseId = found.base.id;
	FBM._objectsUi.sectionId = found.section.id;
	FBM._objectsUi.categoryId = found.category.id;
	FBM._objectsUi.variantId = found.variant ? found.variant.id : found.base.variants[0] && found.base.variants[0].id;
	armSelection();
	return true;
};

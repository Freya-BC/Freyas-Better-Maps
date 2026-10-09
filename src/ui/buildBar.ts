/** Freyas Better Maps — ui/buildBar.js */
import { FBM, type FBMMarkedElement } from "../fbm";

function $(id: string): FBMMarkedElement | null {
	return document.getElementById(id) as FBMMarkedElement | null;
}

FBM.setBuildBarOpen = function (on) {
	FBM._buildBarOpen = !!on;
	if (!FBM._buildBarOpen) {
		/* Hide → show always respawns at the default map-center position. */
		FBM._buildBarPos = null;
		FBM._buildBarDragging = false;
		if (FBM.hideTemplatesUi) FBM.hideTemplatesUi();
	}
	FBM.refreshBuildBar();
	return FBM._buildBarOpen;
};

FBM.toggleBuildBar = function () {
	return FBM.setBuildBarOpen(!FBM._buildBarOpen);
};

FBM.buildBarShouldShow = function () {
	const m = FBM.mapBag();
	if (!m.buildingTools) return false;
	if (!FBM._buildBarOpen) return false;
	if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return false;
	if (!FBM.mapIsMapRoom()) return false;
	if (!FBM.mapIsAdmin()) return false;
	return true;
};

/** True when the open bar is still allowed on the current map/room (ignores _buildBarOpen). */
FBM.buildBarStillOnMap = function () {
	const m = FBM.mapBag();
	if (!m.buildingTools) return false;
	if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return false;
	if (!FBM.mapIsMapRoom()) return false;
	if (!FBM.mapIsAdmin()) return false;
	return true;
};

/** Close the bar when leaving the map/room (keeps state in sync with the DOM). */
FBM.closeBuildBarIfOffMap = function () {
	if (!FBM._buildBarOpen) return false;
	if (FBM.buildBarStillOnMap()) return false;
	FBM.setBuildBarOpen(false);
	return true;
};

FBM.getMainCanvasEl = function () {
	if (typeof MainCanvas !== "undefined" && MainCanvas && MainCanvas.canvas) return MainCanvas.canvas;
	return document.getElementById("MainCanvas");
};

/** Club logical coords (2000×1000) → client pixels; map is left 1000×1000. */
FBM.mapAreaGeometry = function () {
	const c = FBM.getMainCanvasEl();
	if (!c || !c.getBoundingClientRect) return null;
	const r = c.getBoundingClientRect();
	if (!r.width || !r.height) return null;
	return {
		left: r.left,
		top: r.top,
		width: r.width / 2,
		height: r.height,
		centerX: r.left + r.width / 4,
		/* Top padding inside the map (Club Y ≈ 18) */
		barTop: r.top + (18 / 1000) * r.height,
	};
};

FBM.layoutBuildBar = function () {
	const bar = $("fbm-build-bar");
	if (!bar) return;
	const geo = FBM.mapAreaGeometry();
	const tpl = $("fbm-templates");
	const userPos = FBM._buildBarPos;

	if (userPos) {
		bar.classList.add("fbm-bar-placed");
		bar.style.left = userPos.left + "px";
		bar.style.top = userPos.top + "px";
		bar.style.transform = "none";
		bar.style.maxWidth = geo ? Math.max(200, geo.width - 12) + "px" : "min(980px, 48vw)";
	} else if (!geo) {
		bar.classList.remove("fbm-bar-placed");
		bar.style.left = "25%";
		bar.style.top = "12px";
		bar.style.transform = "translateX(-50%)";
		bar.style.maxWidth = "min(980px, 48vw)";
	} else {
		/* Default spawn: top-center of the map area. */
		bar.classList.remove("fbm-bar-placed");
		bar.style.left = geo.centerX + "px";
		bar.style.top = Math.max(4, geo.barTop) + "px";
		bar.style.transform = "translateX(-50%)";
		bar.style.maxWidth = Math.max(200, geo.width - 12) + "px";
	}

	if (tpl && !tpl.hidden) {
		const br = bar.getBoundingClientRect();
		const anchorX = userPos ? br.left + br.width / 2 : geo ? geo.centerX : br.left + br.width / 2;
		tpl.style.left = Math.round(anchorX) + "px";
		tpl.style.top = Math.round(br.bottom + 8) + "px";
		tpl.style.transform = "translateX(-50%)";
		const maxW = geo ? geo.width - 12 : window.innerWidth - 24;
		tpl.style.width = Math.min(560, Math.max(260, maxW)) + "px";
		tpl.style.maxHeight = Math.max(160, Math.min(420, window.innerHeight - br.bottom - 24)) + "px";
	}
};

FBM.bindBuildBarDrag = function () {
	const bar = $("fbm-build-bar");
	const grip = $("fbm-bar-grip");
	if (!bar || !grip || grip._fbmBound) return;
	grip._fbmBound = true;
	let dragging = false;
	let ox = 0;
	let oy = 0;
	grip.addEventListener("pointerdown", function (e) {
		if (e.button != null && e.button !== 0) return;
		dragging = true;
		FBM._buildBarDragging = true;
		const r = bar.getBoundingClientRect();
		ox = e.clientX - r.left;
		oy = e.clientY - r.top;
		bar.classList.add("fbm-bar-placed");
		bar.style.left = r.left + "px";
		bar.style.top = r.top + "px";
		bar.style.transform = "none";
		try {
			grip.setPointerCapture(e.pointerId);
		} catch (err) {
			/* ignore */
		}
		e.preventDefault();
	});
	grip.addEventListener("pointermove", function (e) {
		if (!dragging) return;
		const left = Math.max(0, Math.min(window.innerWidth - 40, e.clientX - ox));
		const top = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - oy));
		bar.style.left = left + "px";
		bar.style.top = top + "px";
		const tpl = $("fbm-templates");
		if (tpl && !tpl.hidden) {
			const br = bar.getBoundingClientRect();
			tpl.style.left = Math.round(br.left + br.width / 2) + "px";
			tpl.style.top = Math.round(br.bottom + 8) + "px";
			tpl.style.transform = "translateX(-50%)";
		}
	});
	function endDrag() {
		if (!dragging) return;
		dragging = false;
		FBM._buildBarDragging = false;
		const r = bar.getBoundingClientRect();
		FBM._buildBarPos = { left: Math.round(r.left), top: Math.round(r.top) };
	}
	grip.addEventListener("pointerup", endDrag);
	grip.addEventListener("pointercancel", endDrag);
};

FBM._ensureBuildBarLayoutWatch = function () {
	if (FBM._buildBarLayoutBound) return;
	FBM._buildBarLayoutBound = true;
	const relayout = function () {
		if (FBM.layoutBuildBar) FBM.layoutBuildBar();
	};
	window.addEventListener("resize", relayout);
	if (window.visualViewport) {
		window.visualViewport.addEventListener("resize", relayout);
		window.visualViewport.addEventListener("scroll", relayout);
	}
};

FBM.refreshBuildBar = function () {
	FBM.ensureUi();
	const bar = $("fbm-build-bar");
	if (!bar) return;
	/* Leaving map/room while open — clear open state (not only hide CSS). */
	if (FBM._buildBarOpen && !FBM.buildBarStillOnMap()) {
		FBM._buildBarOpen = false;
		FBM._buildBarPos = null;
		FBM._buildBarDragging = false;
		if (FBM.hideTemplatesUi) FBM.hideTemplatesUi();
	}
	const show = FBM.buildBarShouldShow();
	bar.classList.toggle("fbm-show", show);
	if (!show) {
		FBM._buildBarPos = null;
		FBM._buildBarDragging = false;
		bar.classList.remove("fbm-bar-placed");
		bar.style.left = "";
		bar.style.top = "";
		bar.style.transform = "";
		bar.style.maxWidth = "";
	}
	const gridBtn = $("fbm-bar-grid");
	if (gridBtn) gridBtn.classList.toggle("fbm-on", !!(FBM.settings && FBM.settings.gridOn));
	const saveBtn = $("fbm-bar-save") as HTMLButtonElement | null;
	if (saveBtn) saveBtn.disabled = !(FBM._copy && FBM._copy.mode === "edit" && Object.keys(FBM._copy.cells || {}).length);
	const copyBtn = $("fbm-bar-copy");
	if (copyBtn) {
		const on = FBM._copy && (FBM._copy.mode === "a" || FBM._copy.mode === "b" || FBM._copy.mode === "edit");
		copyBtn.classList.toggle("fbm-on", !!on);
	}
	const pasteBtn = $("fbm-bar-paste");
	if (pasteBtn) pasteBtn.classList.toggle("fbm-on", !!(FBM._copy && FBM._copy.mode === "paste"));
	const sync = $("fbm-bar-sync");
	if (sync) {
		if (FBM._roomSyncSavedAt) {
			const t = FBM.formatSyncTime ? FBM.formatSyncTime(FBM._roomSyncSavedAt) : "";
			sync.textContent = t ? "Saved & synced · " + t : "Saved & synced";
			sync.hidden = false;
		} else {
			sync.textContent = "";
			sync.hidden = true;
		}
	}
	if (show) {
		FBM._ensureBuildBarLayoutWatch();
		if (FBM.bindBuildBarDrag) FBM.bindBuildBarDrag();
		if (!FBM._buildBarDragging) FBM.layoutBuildBar();
		if (!FBM._buildBarRaf) {
			const tick = function () {
				FBM._buildBarRaf = 0;
				if (!FBM.buildBarShouldShow()) {
					/* Map DrawUi stopped (left map/room) — sync hide + close state. */
					if (FBM.refreshBuildBar) FBM.refreshBuildBar();
					return;
				}
				if (!FBM._buildBarDragging) FBM.layoutBuildBar();
				FBM._buildBarRaf = requestAnimationFrame(tick);
			};
			FBM._buildBarRaf = requestAnimationFrame(tick);
		}
	} else if (FBM._buildBarRaf) {
		cancelAnimationFrame(FBM._buildBarRaf);
		FBM._buildBarRaf = 0;
	}
};

FBM.refreshTemplatesUi = function () {
	FBM.loadTemplates();
	const grid = $("fbm-tpl-grid");
	if (!grid) return;
	grid.innerHTML = "";
	(FBM.templates || []).forEach(function (t) {
		const card = document.createElement("div");
		card.className = "fbm-tpl-card";
		const del = document.createElement("button");
		del.type = "button";
		del.className = "fbm-tpl-del";
		del.title = "Delete";
		del.textContent = "×";
		del.addEventListener("click", function (e) {
			e.stopPropagation();
			if (!confirm("Delete template “" + (t.name || "") + "”?")) return;
			FBM.copyDeleteTemplate(t.id);
		});
		const thumbEl = t.thumb ? document.createElement("img") : document.createElement("div");
		thumbEl.className = "fbm-tpl-thumb";
		if (t.thumb && thumbEl instanceof HTMLImageElement) {
			thumbEl.src = t.thumb;
			thumbEl.alt = "";
		}
		const name = document.createElement("div");
		name.textContent = t.name || "Room";
		const size = document.createElement("div");
		size.className = "fbm-tpl-size";
		size.textContent = (t.w || "?") + " × " + (t.h || "?");
		card.appendChild(del);
		card.appendChild(thumbEl);
		card.appendChild(name);
		card.appendChild(size);
		card.addEventListener("click", function () {
			FBM.copyBeginPaste(t.id);
		});
		grid.appendChild(card);
	});
	if (!(FBM.templates || []).length) {
		grid.innerHTML = '<p class="fbm-muted fbm-hint">No templates yet. Use Copy → Save selection.</p>';
	}
};

FBM.showTemplatesUi = function () {
	FBM.ensureUi();
	const el = $("fbm-templates");
	if (!el) return;
	el.hidden = false;
	FBM.refreshTemplatesUi();
	if (FBM.layoutBuildBar) FBM.layoutBuildBar();
};

FBM.hideTemplatesUi = function () {
	const el = $("fbm-templates");
	if (el) el.hidden = true;
};

FBM.bindBuildBar = function () {
	const gridBtn = $("fbm-bar-grid");
	if (gridBtn && !gridBtn._fbmBound) {
		gridBtn._fbmBound = true;
		gridBtn.addEventListener("click", function () {
			FBM.settings.gridOn = !FBM.settings.gridOn;
			FBM.saveSettings();
			FBM.refreshBuildBar();
		});
	}
	const copyBtn = $("fbm-bar-copy");
	if (copyBtn && !copyBtn._fbmBound) {
		copyBtn._fbmBound = true;
		copyBtn.addEventListener("click", function () {
			if (FBM._copy && FBM._copy.mode) FBM.copyReset();
			else FBM.copyStart();
			FBM.refreshBuildBar();
		});
	}
	const saveBtn = $("fbm-bar-save");
	if (saveBtn && !saveBtn._fbmBound) {
		saveBtn._fbmBound = true;
		saveBtn.addEventListener("click", function () {
			const name = prompt("Template name", "Room");
			if (name == null) return;
			FBM.copySaveTemplate(name);
			FBM.refreshBuildBar();
		});
	}
	const pasteBtn = $("fbm-bar-paste");
	if (pasteBtn && !pasteBtn._fbmBound) {
		pasteBtn._fbmBound = true;
		pasteBtn.addEventListener("click", function () {
			FBM.showTemplatesUi();
		});
	}
	const settingsBtn = $("fbm-bar-settings");
	if (settingsBtn && !settingsBtn._fbmBound) {
		settingsBtn._fbmBound = true;
		settingsBtn.addEventListener("click", function () {
			if (FBM.togglePanel) FBM.togglePanel();
			else if (FBM.openPanel) FBM.openPanel();
		});
	}
	if (FBM.bindBuildBarDrag) FBM.bindBuildBarDrag();
	const closeTpl = $("fbm-tpl-close");
	if (closeTpl && !closeTpl._fbmBound) {
		closeTpl._fbmBound = true;
		closeTpl.addEventListener("click", function () {
			FBM.hideTemplatesUi();
		});
	}
};

/** Parse "Alt+B" / "Ctrl+Shift+M" style shortcuts. */
FBM.hotkeyMatches = function (e, spec) {
	const s = String(spec || "").trim();
	if (!s || !e) return false;
	const parts = s.split("+").map(function (p) {
		return p.trim().toLowerCase();
	});
	if (!parts.length) return false;
	const key = parts[parts.length - 1];
	const needAlt = parts.indexOf("alt") !== -1;
	const needCtrl = parts.indexOf("ctrl") !== -1 || parts.indexOf("control") !== -1;
	const needShift = parts.indexOf("shift") !== -1;
	const needMeta = parts.indexOf("meta") !== -1 || parts.indexOf("cmd") !== -1;
	if (!!e.altKey !== needAlt) return false;
	if (!!e.ctrlKey !== needCtrl) return false;
	if (!!e.shiftKey !== needShift) return false;
	if (!!e.metaKey !== needMeta) return false;
	const ek = (e.key || "").toLowerCase();
	const ec = (e.code || "").toLowerCase();
	if (key === ek) return true;
	if (key.length === 1 && ec === "key" + key) return true;
	if (/^digit[0-9]$/.test(ec) && key === ec.slice(5)) return true;
	return false;
};

FBM.installBuildBarHotkey = function () {
	if (FBM._hotkeyBound) return;
	FBM._hotkeyBound = true;
	document.addEventListener(
		"keydown",
		function (e) {
			if (!FBM.settings || !FBM.settings.buildingTools) return;
			if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return;
			if (!FBM.mapIsAdmin()) return;
			const t = e.target as HTMLElement | null;
			if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
			const spec = FBM.settings.buildBarHotkey || "Alt+B";
			if (!FBM.hotkeyMatches(e, spec)) return;
			e.preventDefault();
			e.stopPropagation();
			FBM.toggleBuildBar();
			FBM.localMsg(FBM._buildBarOpen ? "FBM: build bar on." : "FBM: build bar off.");
		},
		true
	);
};

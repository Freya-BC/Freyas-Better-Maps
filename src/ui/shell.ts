/** Freyas Better Maps — ui/shell.js */
import { FBM } from "../fbm";

function $(id) {
	return document.getElementById(id);
}

FBM.setStatus = function (msg) {
	const el = $("fbm-status");
	if (el) el.textContent = msg || "";
};

FBM.openPanel = function () {
	FBM.ensureUi();
	const panel = $("fbm-panel");
	if (!panel) return;
	panel.classList.add("fbm-open");
	FBM.applyUiGeometry();
	FBM.refreshSettingsUi();
};

FBM.closePanel = function () {
	const panel = $("fbm-panel");
	if (panel) panel.classList.remove("fbm-open");
	FBM.persistUiGeometry();
};

FBM.togglePanel = function () {
	const panel = $("fbm-panel");
	if (panel && panel.classList.contains("fbm-open")) FBM.closePanel();
	else FBM.openPanel();
};

FBM.applyUiGeometry = function () {
	const panel = $("fbm-panel");
	const ui = (FBM.settings && FBM.settings.ui) || {};
	if (!panel) return;
	if (ui.width) panel.style.width = ui.width + "px";
	if (ui.height) panel.style.height = ui.height + "px";
	if (ui.left != null) {
		panel.style.left = ui.left + "px";
		panel.style.right = "auto";
	}
	if (ui.top != null) panel.style.top = ui.top + "px";
};

FBM.persistUiGeometry = function () {
	const panel = $("fbm-panel");
	if (!panel || !FBM.settings) return;
	const r = panel.getBoundingClientRect();
	FBM.settings.ui = FBM.settings.ui || {};
	FBM.settings.ui.left = Math.round(r.left);
	FBM.settings.ui.top = Math.round(r.top);
	FBM.settings.ui.width = Math.round(r.width);
	FBM.settings.ui.height = Math.round(r.height);
	FBM.saveSettings();
};

function bindDrag(panel, header) {
	let dragging = false;
	let ox = 0;
	let oy = 0;
	header.addEventListener("pointerdown", function (e) {
		if ((e.target as HTMLElement | null)?.closest("button")) return;
		dragging = true;
		const r = panel.getBoundingClientRect();
		ox = e.clientX - r.left;
		oy = e.clientY - r.top;
		try {
			header.setPointerCapture(e.pointerId);
		} catch (err) {
			/* ignore */
		}
	});
	header.addEventListener("pointermove", function (e) {
		if (!dragging) return;
		panel.style.left = Math.max(0, e.clientX - ox) + "px";
		panel.style.top = Math.max(0, e.clientY - oy) + "px";
		panel.style.right = "auto";
	});
	header.addEventListener("pointerup", function () {
		dragging = false;
		FBM.persistUiGeometry();
	});
}

function aboutFeat(title, desc, steps) {
	let lis = "";
	for (let i = 0; i < steps.length; i++) {
		lis += "<li>" + steps[i] + "</li>";
	}
	return (
		'<details class="fbm-about-feat"><summary>' +
		title +
		"</summary>" +
		'<div class="fbm-about-feat-body">' +
		'<p class="fbm-about-desc">' +
		desc +
		"</p>" +
		'<p class="fbm-about-label">How to use</p>' +
		'<ul class="fbm-about-steps">' +
		lis +
		"</ul></div></details>"
	);
}

FBM.ensureUi = function () {
	if ($("fbm-root")) return;
	FBM.injectStyles();
	const root = document.createElement("div");
	root.id = "fbm-root";
	root.innerHTML =
		'<div class="fbm-build-bar" id="fbm-build-bar">' +
		'<span class="fbm-bar-grip" id="fbm-bar-grip" title="Drag" aria-label="Drag build bar">⋮⋮</span>' +
		'<button type="button" class="fbm-btn" id="fbm-bar-grid">Grid</button>' +
		'<button type="button" class="fbm-btn" id="fbm-bar-copy">Copy</button>' +
		'<button type="button" class="fbm-btn" id="fbm-bar-save" disabled>Save selection</button>' +
		'<button type="button" class="fbm-btn" id="fbm-bar-paste">Paste…</button>' +
		'<button type="button" class="fbm-btn" id="fbm-bar-settings">Settings</button>' +
		'<span class="fbm-bar-sync" id="fbm-bar-sync" hidden></span>' +
		"</div>" +
		'<div class="fbm-templates" id="fbm-templates" hidden>' +
		'<div class="fbm-templates-head"><span>Templates</span>' +
		'<button type="button" class="fbm-icon-btn" id="fbm-tpl-close" title="Close">×</button></div>' +
		'<p class="fbm-muted fbm-hint">Select a room, then click the map tile for the top-left paste origin.</p>' +
		'<div class="fbm-tpl-grid" id="fbm-tpl-grid"></div></div>' +
		'<div class="fbm-panel" id="fbm-panel">' +
		'<div class="fbm-header" id="fbm-header">' +
		'<div class="fbm-header-title">Freyas Better Maps <span class="fbm-badge">settings</span></div>' +
		'<button type="button" class="fbm-icon-btn" id="fbm-close" title="Close">×</button></div>' +
		'<div class="fbm-tabs" role="tablist">' +
		'<button type="button" class="fbm-tab fbm-on" data-tab="general">General</button>' +
		'<button type="button" class="fbm-tab" data-tab="maps">Map storage</button>' +
		'<button type="button" class="fbm-tab" data-tab="about">About</button></div>' +
		'<div class="fbm-page fbm-on" id="fbm-page-general">' +
		'<p class="fbm-muted fbm-hint">Local map helpers. Synced via ExtensionSettings. If FAM Map typing is also on, bubbles may double — turn one off.</p>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-typing" /> <span>Show typing bubbles on the map</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-hide-toolbar" /> <span>Hide Club map toolbar (R132 panel + zoom) behind a small +</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-building" /> <span>Allow building tools (FBM button on map bar)</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-blindfold" /> <span>Full blindfold (grey walls; hide your tile)</span></label>' +
		'<div class="fbm-row fbm-indent" id="fbm-blindfold-style-row">' +
		'<label class="fbm-muted" for="fbm-blindfold-style">Others look like</label>' +
		'<select id="fbm-blindfold-style">' +
		'<option value="greyscale">Greyscale models</option>' +
		'<option value="silhouette">Generic silhouette</option>' +
		"</select></div>" +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-whisper" /> <span>Whisper at hearing range (walls apply; not SuperZoom)</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-zoom" /> <span>Full map zoom-out (raise zoom max)</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-hide-room-update" /> <span>Hide duplicate “updated the room” chat spam</span></label>' +
		'<div class="fbm-row fbm-indent" id="fbm-room-update-cool-row">' +
		'<label class="fbm-muted" for="fbm-room-update-cool">Cooldown (minutes)</label>' +
		'<input type="number" id="fbm-room-update-cool" min="1" max="120" step="1" value="5" />' +
		"</div>" +
		'<div class="fbm-section"><div class="fbm-section-head">Build bar hotkey</div>' +
		'<p class="fbm-muted fbm-hint">Toggles the floating build bar when the map is active (admin). Default Alt+B. Also use the FBM button on the left map bar.</p>' +
		'<div class="fbm-row"><input type="text" id="fbm-build-hotkey" placeholder="Alt+B" maxlength="32" />' +
		'<button type="button" class="fbm-btn" id="fbm-build-hotkey-capture">Capture</button></div></div>' +
		'<div class="fbm-status" id="fbm-status"></div></div>' +
		'<div class="fbm-page" id="fbm-page-maps">' +
		'<p class="fbm-muted fbm-hint">Save uses Club map export (/mapcopy). Load requires admin (/mappaste). Limit 10 maps + 1 autosave.</p>' +
		'<div class="fbm-section"><div class="fbm-section-head">Save current map</div>' +
		'<div class="fbm-row"><input type="text" id="fbm-map-name" placeholder="Map name" maxlength="48" />' +
		'<button type="button" class="fbm-btn fbm-btn-accent" id="fbm-map-save">Save</button></div></div>' +
		'<div class="fbm-section"><div class="fbm-section-head">Load</div><div class="fbm-map-list" id="fbm-map-list"></div></div>' +
		'<div class="fbm-section"><div class="fbm-section-head">Autosave</div>' +
		'<p class="fbm-muted fbm-hint">After you edit the map, autosaves at most once per 60 seconds.</p>' +
		'<div class="fbm-map-item"><span id="fbm-autosave-label">Autosave — empty</span>' +
		'<button type="button" class="fbm-btn" id="fbm-autosave-load" disabled>Load</button></div></div></div>' +
		'<div class="fbm-page" id="fbm-page-about">' +
		'<p class="fbm-muted fbm-hint">Version <span id="fbm-about-ver"></span>. Developed by Freya (245450).</p>' +
		'<p class="fbm-muted fbm-hint">Open via Preference → Extensions → Freyas Better Maps, or the build bar <strong>Settings</strong> button.</p>' +
		'<p class="fbm-muted fbm-hint">Expand a feature below for a short description and how to use it.</p>' +
		'<div class="fbm-about-feats">' +
		aboutFeat(
			"Typing bubbles",
			"Shows a readable Talk bubble above characters who are typing on the map. Scales with zoom.",
			[
				"Turn on <strong>Show typing bubbles</strong> under General (on by default).",
				"Join a map room and type — others with FBM see your bubble.",
				"If FAM Map typing is also on, bubbles may stack; turn one off.",
			]
		) +
		aboutFeat(
			"Hide Club map toolbar",
			"Collapses Club’s left map buttons and zoom controls behind a small <strong>+</strong> so the map stays clear.",
			[
				"Enable <strong>Hide Club map toolbar</strong> under General.",
				"Click the small <strong>+</strong> on the left to expand Club’s tools again; click the <strong>−</strong> beside the Club tools to collapse.",
				"While only the tool strip is showing, <strong>−</strong> stays near the left buttons; when the tile/search panel opens fully, it moves to the right of the grey panel (aligned with the search field).",
				"Works with R132’s HTML map panel and canvas zoom buttons.",
			]
		) +
		aboutFeat(
			"Building tools &amp; build bar",
			"Optional FBM toolbar for grid, region copy/paste, zoom-out, and Settings — hidden until you need it.",
			[
				"Enable <strong>Allow building tools</strong> under General.",
				"On the map (as admin), click the <strong>FBM</strong> button (under <strong>+</strong> when collapsed, under <strong>−</strong> when the Club panel is open), or press the build-bar hotkey (default <strong>Alt+B</strong>).",
				"The bar opens at the top-center of the map area. Drag the <strong>⋮⋮</strong> grip to move it; hiding and showing the bar resets it to the default spot.",
				"Change the hotkey under General → Build bar hotkey (Capture or type e.g. Alt+B).",
				"While typing in FBM fields, WASD will not move you on the map.",
			]
		) +
		aboutFeat(
			"Grid overlay",
			"Draws a light grid every 5 tiles plus center X/Y axes to line up builds.",
			[
				"Open the build bar, then click <strong>Grid</strong> to toggle.",
				"Grid state is remembered in your settings.",
			]
		) +
		aboutFeat(
			"Copy, templates &amp; paste",
			"Select a rectangle of tiles, save it as a local template, and paste elsewhere (or later).",
			[
				"Build bar → <strong>Copy</strong>: drag or click tiles for an AABB selection (toggle tiles as needed).",
				"<strong>Save selection</strong> stores a thumbnail template in localStorage.",
				"<strong>Paste…</strong> opens the template picker; choose one, then click the map tile for the top-left origin.",
				"Press <strong>Esc</strong> to cancel copy or paste mode.",
				"Paste pushes an immediate room update (same path as Club paint).",
			]
		) +
		aboutFeat(
			"Map storage &amp; autosave",
			"Save up to 10 named maps plus one autosave slot using Club’s map export format. Load requires room admin.",
			[
				"Open Settings → <strong>Map storage</strong>.",
				"Enter a name and click <strong>Save</strong> (uses /mapcopy-style export).",
				"Click <strong>Load</strong> on a saved map (admin; applies like /mappaste and syncs the room).",
				"After you edit the map, autosave runs at most once per 60 seconds; load it from the Autosave row.",
			]
		) +
		aboutFeat(
			"Full blindfold",
			"At maximum blindness, the map becomes a short-range silhouette: walkable tiles black, walls darker grey, other blockers (doors, trees, glass, …) lighter grey. You still see your full-color avatar on your tile; adjacent players are greyscale or generic silhouettes.",
			[
				"Enable <strong>Full blindfold</strong> under General.",
				"Choose <strong>Others look like</strong>: greyscale models or generic silhouette.",
				"Equip a full blindfold in Club and stand on the map — only yourself and the 8 adjacent tiles stay visible.",
			]
		) +
		aboutFeat(
			"Hearing-range whisper",
			"Allows whispering to someone when Club considers them hearable (walls / audibility) and within hearing distance. SuperZoom’s larger view does not extend whisper range.",
			[
				"Enable <strong>Whisper at hearing range</strong> under General.",
				"On the map, open a whisper to a nearby character who can hear you.",
				"If they are blocked by walls or too far for hearing, the whisper stays blocked.",
			]
		) +
		aboutFeat(
			"Full map zoom-out",
			"Raises Club’s map zoom maximum (SuperZoom-style) so you can see more of the map at once.",
			[
				"Enable <strong>Full map zoom-out</strong> under General.",
				"Use Club’s map zoom controls to pull back.",
				"If another mod already changed the zoom max away from Club’s defaults, FBM leaves it alone.",
			]
		) +
		aboutFeat(
			"Hide room-update spam",
			"Stops identical “updated the room” chat lines from repeating while you (or others) paint. The editor still sees a short <strong>Saved &amp; synced</strong> stamp on the build bar.",
			[
				"Enable <strong>Hide duplicate “updated the room” chat spam</strong> under General.",
				"Set the cooldown in minutes (default 5) — matching updates within that window are suppressed.",
				"Useful when pasting templates or editing large regions.",
			]
		) +
		aboutFeat(
			"Install &amp; reload",
			"Runs as a Tampermonkey userscript, FUSAM loader, or bookmark that loads the gist IIFE.",
			[
				"Tampermonkey: install <code>freyas-better-maps.user.js</code>.",
				"Bookmark: run the bookmarklet; reload the page to pick up the newest gist build without logging out.",
				"Settings sync via ExtensionSettings (<code>FreyasBetterMaps</code>).",
			]
		) +
		"</div></div></div>";
	document.body.appendChild(root);
	bindDrag($("fbm-panel"), $("fbm-header"));
	$("fbm-close").addEventListener("click", function () {
		FBM.closePanel();
	});
	root.querySelectorAll(".fbm-tab").forEach(function (tab) {
		tab.addEventListener("click", function () {
			root.querySelectorAll(".fbm-tab").forEach(function (t) {
				t.classList.toggle("fbm-on", t === tab);
			});
			const tabEl = tab as HTMLElement;
			root.querySelectorAll(".fbm-page").forEach(function (p) {
				p.classList.toggle("fbm-on", p.id === "fbm-page-" + tabEl.dataset.tab);
			});
		});
	});
	if (FBM.bindSettingsUi) FBM.bindSettingsUi();
	if (FBM.bindBuildBar) FBM.bindBuildBar();
};

FBM.leavePreferenceToGame = function () {
	if (typeof PreferenceExtensionsCurrent !== "undefined" && PreferenceExtensionsCurrent) {
		PreferenceExtensionsCurrent.unload?.();
		PreferenceExtensionsCurrent = null;
	}
	if (typeof ChatRoomData !== "undefined" && ChatRoomData && typeof CommonSetScreen === "function") {
		CommonSetScreen("Online", "ChatRoom");
		return;
	}
	if (
		typeof InformationSheetReturnScreen !== "undefined" &&
		InformationSheetReturnScreen &&
		typeof CommonSetScreen === "function"
	) {
		CommonSetScreen.apply(null, InformationSheetReturnScreen);
		return;
	}
	if (typeof CommonSetScreen === "function") CommonSetScreen("Room", "MainHall");
};

FBM.registerPreference = function () {
	if (typeof PreferenceRegisterExtensionSetting !== "function") return;
	if (typeof PreferenceExtensionsSettings !== "undefined" && PreferenceExtensionsSettings.FreyasBetterMaps) return;
	PreferenceRegisterExtensionSetting({
		Identifier: "FreyasBetterMaps",
		ButtonText: "Freyas Better Maps",
		Image: "Icons/MapTypeAlways.png",
		load: function () {
			FBM.openPanel();
			FBM.leavePreferenceToGame();
		},
		run: function () {},
		click: function () {},
		exit: function () {
			return true;
		},
		unload: function () {},
	});
};

FBM.prepareReload = function () {
	["fbm-root", "fbm-styles"].forEach(function (id) {
		const el = document.getElementById(id);
		if (el && el.parentNode) el.parentNode.removeChild(el);
	});
	window.__FreyasBetterMapsPageLoaded = false;
	if (window.FreyasBetterMaps) window.FreyasBetterMaps._booted = false;
};

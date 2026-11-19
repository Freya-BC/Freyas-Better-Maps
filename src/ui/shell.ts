/** Freyas Better Maps — ui/shell.js */
import { FBM } from "../fbm";

function $(id) {
	return document.getElementById(id);
}

FBM.setStatus = function (msg) {
	const el = $("fbm-status");
	if (el) el.textContent = msg || "";
};

/** Short floating toast (visible even when Settings is closed). */
FBM.showToast = function (msg, ms) {
	FBM.ensureUi();
	const el = $("fbm-toast");
	if (!el) {
		FBM.setStatus(msg || "");
		return;
	}
	el.textContent = msg || "";
	el.hidden = false;
	el.classList.add("fbm-toast-show");
	if (FBM._toastTimer) clearTimeout(FBM._toastTimer);
	FBM._toastTimer = setTimeout(function () {
		el.classList.remove("fbm-toast-show");
		el.hidden = true;
	}, typeof ms === "number" && ms > 0 ? ms : 4500);
};

FBM.selectPanelTab = function (tab: string) {
	const root = $("fbm-root");
	if (!root) return;
	const id = String(tab || "general");
	root.querySelectorAll(".fbm-tab").forEach(function (t) {
		const el = t as HTMLElement;
		t.classList.toggle("fbm-on", el.dataset.tab === id);
	});
	root.querySelectorAll(".fbm-page").forEach(function (p) {
		p.classList.toggle("fbm-on", p.id === "fbm-page-" + id);
	});
};

FBM.openPanel = function (opts?: { tab?: string }) {
	FBM.ensureUi();
	const panel = $("fbm-panel");
	if (!panel) return;
	panel.classList.add("fbm-open");
	FBM.applyUiGeometry();
	FBM.refreshSettingsUi();
	if (opts && opts.tab) FBM.selectPanelTab(opts.tab);
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
		'<button type="button" class="fbm-btn" id="fbm-bar-objects" title="Build — catalog, brush, variants">Build</button>' +
		'<button type="button" class="fbm-btn" id="fbm-bar-copy">Copy</button>' +
		'<button type="button" class="fbm-btn" id="fbm-bar-objset" title="Include Sign/Tether/Rotation/Size/Color when saving a selection">Obj settings</button>' +
		'<button type="button" class="fbm-btn" id="fbm-bar-save" disabled>Save selection</button>' +
		'<button type="button" class="fbm-btn" id="fbm-bar-paste">Paste…</button>' +
		'<button type="button" class="fbm-btn fbm-bar-star" id="fbm-bar-star" title="SuperPowers" hidden>' +
		'<img id="fbm-bar-star-img" src="Icons/SuperPowersInactive.png" alt="" width="18" height="18" />' +
		"</button>" +
		'<button type="button" class="fbm-btn" id="fbm-bar-settings">Settings</button>' +
		'<span class="fbm-bar-sync" id="fbm-bar-sync" hidden></span>' +
		"</div>" +
		'<div class="fbm-templates" id="fbm-templates" hidden>' +
		'<div class="fbm-templates-head"><span>Templates</span>' +
		'<button type="button" class="fbm-icon-btn" id="fbm-tpl-close" title="Close">×</button></div>' +
		'<p class="fbm-muted fbm-hint">Select a room, then click the map tile for the top-left paste origin.</p>' +
		'<div class="fbm-tpl-grid" id="fbm-tpl-grid"></div></div>' +
		(FBM.objectsBuildMarkup ? FBM.objectsBuildMarkup() : "") +
		(FBM.objectSettingsMarkup ? FBM.objectSettingsMarkup() : "") +
		(FBM.floatChatMarkup ? FBM.floatChatMarkup() : "") +
		(FBM.changelogMarkup ? FBM.changelogMarkup() : "") +
		'<div id="fbm-toast" class="fbm-toast" hidden role="status" aria-live="polite"></div>' +
		'<div class="fbm-panel" id="fbm-panel">' +
		'<div class="fbm-header" id="fbm-header">' +
		'<div class="fbm-header-title">Freyas Better Maps <span class="fbm-badge">settings</span></div>' +
		'<button type="button" class="fbm-icon-btn" id="fbm-close" title="Close">×</button></div>' +
		'<div class="fbm-tabs" role="tablist">' +
		'<button type="button" class="fbm-tab fbm-on" data-tab="general">General</button>' +
		'<button type="button" class="fbm-tab" data-tab="chat">Chat</button>' +
		'<button type="button" class="fbm-tab" data-tab="maps">Map storage</button>' +
		'<button type="button" class="fbm-tab" data-tab="about">About</button></div>' +
		'<div class="fbm-page fbm-on" id="fbm-page-general">' +
		'<p class="fbm-muted fbm-hint">Local map helpers. Toggles are synced via ExtensionSettings; window positions stay on this device. FBM map typing hides Club’s foot-level Talk icon; if FAM Map typing is also on, bubbles may still double — turn one off.</p>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-typing" /> <span>Show typing bubbles on the map</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-hide-toolbar" /> <span>Hide Club map toolbar (R132 panel + zoom) behind a small +</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-hide-arrows" /> <span>Hide Arrow Keys (and Club SuperPowers; ★ on the FBM build bar)</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-building" /> <span>Allow building tools (FBM button on map bar)</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-invisible-walls" /> <span>Show invisible walls (EmptySpace Impassable red X)</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-copy-objset" /> <span>Object settings on copy &amp; paste (Sign, Tether, Rotation, Size, Color)</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-placement-ghost" /> <span>Show placement ghost while building (only on valid tiles)</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-blindfold" /> <span>Full blindfold (grey walls; hide your tile)</span></label>' +
		'<div class="fbm-row fbm-indent" id="fbm-blindfold-style-row">' +
		'<label class="fbm-muted" for="fbm-blindfold-style">Others look like</label>' +
		'<select id="fbm-blindfold-style">' +
		'<option value="greyscale">Greyscale models</option>' +
		'<option value="silhouette">Generic silhouette</option>' +
		"</select></div>" +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-whisper" /> <span>Whisper at hearing range (walls apply; not SuperZoom)</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-zoom" /> <span>Full map zoom-out (raise zoom max, admin only)</span></label>' +
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
		'<div class="fbm-page" id="fbm-page-chat">' +
		'<p class="fbm-muted fbm-hint">Floatable Chat for when Club chat is collapsed on the map. Preferences are synced via ExtensionSettings; position and size stay on this device.</p>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-fc-enabled" /> <span>Enable Floatable Chat</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-fc-autoshow" /> <span>Autoshow when default Club chat is hidden</span></label>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-fc-autoclose" /> <span>Autoclose chat joining a MAP room</span></label>' +
		'<div class="fbm-section"><div class="fbm-section-head">Hotkey</div>' +
		'<div class="fbm-row"><input type="text" id="fbm-fc-hotkey" placeholder="Alt+C" maxlength="32" />' +
		'<button type="button" class="fbm-btn" id="fbm-fc-hotkey-capture">Capture</button></div></div>' +
		'<div class="fbm-section"><div class="fbm-section-head">Typography</div>' +
		'<div class="fbm-row"><label class="fbm-muted" for="fbm-fc-size">Text size</label>' +
		'<input type="range" id="fbm-fc-size" min="11" max="18" step="1" value="13" />' +
		'<span class="fbm-muted" id="fbm-fc-size-val">13px</span></div>' +
		'<div class="fbm-row"><label class="fbm-muted" for="fbm-fc-transparency">Transparency</label>' +
		'<input type="range" id="fbm-fc-transparency" min="0" max="60" step="1" value="15" />' +
		'<span class="fbm-muted" id="fbm-fc-transparency-val">15%</span></div>' +
		'<p class="fbm-muted fbm-hint">0% is solid Seidr chrome; higher values let the map show through.</p>' +
		'<div class="fbm-row"><label class="fbm-muted" for="fbm-fc-font">Font</label>' +
		'<select id="fbm-fc-font" class="fbm-fc-font-select"></select></div>' +
		'<div class="fbm-row" id="fbm-fc-font-custom-row" hidden>' +
		'<label class="fbm-muted" for="fbm-fc-font-custom">Custom font</label>' +
		'<input type="text" id="fbm-fc-font-custom" placeholder="e.g. Comic Code" maxlength="80" /></div>' +
		'<p class="fbm-muted fbm-hint">Type in the dropdown to jump. Choose Custom… to enter any installed family.</p></div>' +
		'<div class="fbm-section"><div class="fbm-section-head">Style</div>' +
		'<div class="fbm-row"><label class="fbm-muted" for="fbm-fc-style">Theme</label>' +
		'<select id="fbm-fc-style">' +
		'<option value="dark">Dark (Seidr)</option>' +
		'<option value="light">Light Seidr</option>' +
		'<option value="custom">Custom CSS</option>' +
		"</select></div>" +
		'<div id="fbm-fc-custom-wrap" hidden>' +
		'<p class="fbm-muted fbm-hint">CSS applied to <code>#fbm-float-chat</code>.</p>' +
		'<textarea id="fbm-fc-css" class="fbm-fc-css" spellcheck="false" rows="8"></textarea>' +
		'<div class="fbm-row"><button type="button" class="fbm-btn fbm-btn-accent" id="fbm-fc-css-apply">Apply</button>' +
		'<button type="button" class="fbm-btn" id="fbm-fc-css-reset">Reset to Dark</button></div></div></div>' +
		'<div class="fbm-section"><div class="fbm-section-head">Highlights</div>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-fc-hl-own" /> <span>Highlight own names / words in messages</span></label>' +
		'<div class="fbm-indent" id="fbm-fc-hl-own-opts">' +
		'<p class="fbm-muted fbm-hint">One name or word per line (or comma-separated). Defaults to your Club name. Matches in message text are highlighted.</p>' +
		'<textarea id="fbm-fc-own-names" class="fbm-fc-own-names" rows="4" spellcheck="false" placeholder=""></textarea>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-fc-hl-seidr" /> <span>Use Seidr highlight color</span></label>' +
		'<div class="fbm-row" id="fbm-fc-hl-color-row"><label class="fbm-muted" for="fbm-fc-hl-color">Color</label>' +
		'<input type="color" id="fbm-fc-hl-color" value="#d4a017" /></div></div>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-fc-hl-others" /> <span>Highlight other users’ names in message text (Seidr color)</span></label>' +
		'<p class="fbm-muted fbm-hint">Does not change the sender name color — only mentions inside the message body.</p>' +
		"</div>" +
		'<div class="fbm-section"><div class="fbm-section-head">Compose extras</div>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-fc-whisper-avatar" /> <span>Whisper avatar beside input</span></label>' +
		'<p class="fbm-muted fbm-hint">When whispering, show a small face crop of the target next to the float compose field (FCM-style).</p>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-fc-map-compass" /> <span>Map compass (Members / chat name hover)</span></label>' +
		'<p class="fbm-muted fbm-hint">On map view, hover a Members name (or float-chat name): animated arrow above a visible player, or edge direction if fogged / out of range.</p>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-fc-confirm-leave" /> <span>Confirm before Leave</span></label>' +
		'<p class="fbm-muted fbm-hint">Shows a confirm dialog when using the float chat Leave button.</p>' +
		'<label class="fbm-check-row"><input type="checkbox" id="fbm-fc-ooc-protect" /> <span>OOC Protection</span></label>' +
		'<p class="fbm-muted fbm-hint">Refuse send when parentheses in the message body are unbalanced (broken OOC / whisper / beep).</p>' +
		"</div>" +
		'<div class="fbm-section" id="fbm-trusted-hosts">' +
		'<div class="fbm-section-head">Trusted image hosts</div>' +
		'<p class="fbm-muted fbm-hint">Permanent hosts for Floatable Chat image embeds. Session trusts clear on relog. Some CDNs (cdn.discordapp.com, i.imgur.com, Tenor, …) are built-in; others ask in chat.</p>' +
		'<div class="fbm-map-list" id="fbm-trusted-host-list"></div>' +
		'<p class="fbm-muted fbm-hint" id="fbm-trusted-host-empty" hidden>No permanent hosts yet.</p>' +
		"</div>" +
		'<div class="fbm-row"><button type="button" class="fbm-btn fbm-btn-accent" id="fbm-fc-open">Show float chat</button></div>' +
		"</div>" +
		'<div class="fbm-page" id="fbm-page-maps">' +
		'<p class="fbm-muted fbm-hint">Save uses Club map export (/mapcopy). Load requires admin (/mappaste). Limit 10 maps + 1 autosave (autosave is kept on this device only).</p>' +
		'<div class="fbm-section"><div class="fbm-section-head">Save current map</div>' +
		'<div class="fbm-row"><input type="text" id="fbm-map-name" placeholder="Map name" maxlength="48" />' +
		'<button type="button" class="fbm-btn fbm-btn-accent" id="fbm-map-save">Save</button></div></div>' +
		'<div class="fbm-section"><div class="fbm-section-head">Load</div><div class="fbm-map-list" id="fbm-map-list"></div></div>' +
		'<div class="fbm-section"><div class="fbm-section-head">Autosave</div>' +
		'<p class="fbm-muted fbm-hint">After you edit the map, autosaves at most once per 60 seconds.</p>' +
		'<div class="fbm-map-item"><span id="fbm-autosave-label">Autosave — empty</span>' +
		'<button type="button" class="fbm-btn" id="fbm-autosave-load" disabled>Load</button></div></div>' +
		"</div>" +
		'<div class="fbm-page" id="fbm-page-about">' +
		'<p class="fbm-muted fbm-hint">Version <span id="fbm-about-ver"></span>. Developed by Freya (245450).</p>' +
		'<p class="fbm-muted fbm-hint">Open via Preference → Extensions → Freyas Better Maps, or the build bar <strong>Settings</strong> button.</p>' +
		'<div class="fbm-row" style="margin-bottom:10px">' +
		'<button type="button" class="fbm-btn fbm-btn-accent" id="fbm-about-changelog">What’s new</button>' +
		'<a class="fbm-btn" id="fbm-about-docs" href="#" target="_blank" rel="noopener noreferrer">Documentation</a>' +
		"</div>" +
		'<p class="fbm-muted fbm-hint">Expand a feature below for a short description and how to use it.</p>' +
		'<div class="fbm-about-feats">' +
		aboutFeat(
			"Typing bubbles",
			"Shows a readable Talk bubble above characters who are typing on the map. Scales with zoom.",
			[
				"Turn on <strong>Show typing bubbles</strong> under General (on by default).",
				"Join a map room and type — others with FBM see your bubble.",
				"Hides Club’s small foot-level Talk icon on the map while this is on. If FAM Map typing is also on, bubbles may still stack; turn one off.",
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
			"Hide Arrow Keys",
			"Hides Club’s on-map movement arrows and SuperPowers control. Admins get a ★ on the FBM build bar that toggles SuperPowers the same way.",
			[
				"Enable <strong>Hide Arrow Keys</strong> under General.",
				"WASD / keyboard movement still works; only the on-screen pad is hidden.",
				"Open the FBM build bar (admin) and click ★ to toggle SuperPowers.",
			]
		) +
		aboutFeat(
			"Building tools &amp; build bar",
			"Optional FBM toolbar for grid, Build catalog, region copy/paste, zoom-out, and Settings — hidden until you need it.",
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
			"Objects Build",
			"Alternate tile/object/effect picker with hybrid color grouping, custom variants (rotation / size / layers), brush or single place, pipet, eraser, fog, and undo.",
			[
				"Build bar → <strong>Build</strong> opens the floating catalog (admin).",
				"Pick a category, then a card — Club Brush is armed. Toggle <strong>Single</strong> for one-shot place.",
				"On customizable objects, use the gear for place settings; <strong>Save as new variant</strong> stores locally. Edit/Delete only apply to your custom variants.",
				"<strong>Pipet</strong> samples a placed object (optionally saving its settings as a variant).",
				"Category order, customs, recent, and window size persist in localStorage.",
			]
		) +
		aboutFeat(
			"Copy, templates &amp; paste",
			"Select a rectangle of tiles, save it as a local template, and paste elsewhere (or later).",
			[
				"Build bar → <strong>Copy</strong>: drag or click tiles for an AABB selection (toggle tiles as needed).",
				"<strong>Obj settings</strong> (on by default) includes Sign text, Tether points, Teleporter links, Rotation, Size, and Colors when you <strong>save</strong> a selection. At <strong>paste</strong> time, turn it off to place tiles/objects only even if the template stored settings.",
				"<strong>Save selection</strong> stores a thumbnail (real map assets when loaded) in localStorage.",
				"<strong>Paste…</strong> opens the template picker; choose one, then aim with the translucent ghost preview and click the top-left origin.",
				"Press <strong>Esc</strong> to cancel copy or paste mode.",
				"Paste syncs through Club’s MapManager (same path as map paint / room Update).",
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
			"Raises Club’s map zoom maximum (SuperZoom-style) so you can see more of the map at once. Only applies while you are a <strong>room admin</strong>.",
			[
				"Enable <strong>Full map zoom-out</strong> under General (checkbox is enabled when you are admin).",
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
			"Floatable Chat",
			"A movable Seidr-styled chat panel when Club chat is collapsed on the map. Mirrors room messages, Leave/Kneel/Wardrobe toolbar, and Club slash-tag autocomplete.",
			[
				"Open Settings → <strong>Chat</strong> (or hotkey, default <strong>Alt+C</strong>).",
				"Enable <strong>Autoshow when default Club chat is hidden</strong> to pop the panel when the map chat is collapsed.",
				"<strong>Autoclose chat joining a MAP room</strong> collapses Club chat on join in Always-map rooms only — not Hybrid or normal (toast warns if Autoshow is off).",
				"Type <code>/</code> for Club command tags. Send copies into Club’s InputChat so emotes, whispers, and registered commands still work.",
				"Whispers/beeps show <strong>from/to</strong> labels. Hover <strong>↩</strong> to reply (including your own messages). Cancel with the red ×.",
				"Click a name to copy the ID and prep <code>/whisper id</code>. Compose border turns purple for whisper and teal for beep.",
				"<strong>Members</strong> opens a slide panel of everyone in the room (admin Kick/Ban/Promote/Whitelist when you are room admin).",
				"Right-click a message: Copy ID; Mute; Kick/Ban; Whitelist/Blacklist; Add as Friend — confirmed.",
				"Tab stays in the compose field; <code>/</code> and <code>.</code> commands autocomplete (dot via Club InputChat proxy).",
				"Optional under Chat → Compose extras: whisper avatar, map compass (Members/chat hover → arrow or edge direction), confirm Leave. Font picker lists local fonts / accepts typed families.",
				"Image links from trusted hosts embed inline (WCE-style). Unknown hosts show <strong>Trust</strong> / <strong>Trust permanently</strong> in the message — manage permanent hosts under Settings → <strong>Chat</strong>.",
				"Optional highlights: own name/words and other users’ names inside message text (sender labels keep Club colors).",
				"Seidr Room Manager appears on the toolbar when Seidr is loaded (Seidr’s floating ⌂ hides while this panel is open). Tab / Fast Select autocomplete uses Seidr when both mods are loaded.",
			]
		) +
		aboutFeat(
			"Install &amp; reload",
			"Runs as a Tampermonkey userscript, FUSAM loader, or bookmark that loads the gist IIFE.",
			[
				"Tampermonkey: install <code>freyas-better-maps.user.js</code>.",
				"Bookmark: run the bookmarklet; reload the page to pick up the newest gist build without logging out.",
				"Settings sync via ExtensionSettings (<code>FreyasBetterMaps</code>, maps in <code>FreyasBetterMapsMaps</code>); window geometry and autosave stay in localStorage.",
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
	if (FBM.bindFloatChatUi) FBM.bindFloatChatUi();
	if (FBM.bindChangelogUi) FBM.bindChangelogUi();
	const aboutCl = $("fbm-about-changelog");
	if (aboutCl) {
		aboutCl.addEventListener("click", function () {
			if (FBM.openChangelogModal) FBM.openChangelogModal();
		});
	}
	const aboutDocs = $("fbm-about-docs") as HTMLAnchorElement | null;
	if (aboutDocs) {
		aboutDocs.href = String(FBM.DOCS_URL || "https://freya-bc.github.io/Freyas-Better-Maps/");
	}
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
	try {
		if (FBM.flushSettings) FBM.flushSettings();
	} catch (e) {
		/* ignore */
	}
	["fbm-root", "fbm-styles", "fbm-fc-custom-style"].forEach(function (id) {
		const el = document.getElementById(id);
		if (el && el.parentNode) el.parentNode.removeChild(el);
	});
	window.__FreyasBetterMapsPageLoaded = false;
	if (window.FreyasBetterMaps) window.FreyasBetterMaps._booted = false;
};

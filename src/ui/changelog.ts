/** Freyas Better Maps — update banner + changelog modal */
import { FBM } from "../fbm";

function $(id: string): HTMLElement | null {
	return document.getElementById(id);
}

function docsUrl(): string {
	return String(FBM.DOCS_URL || "https://freya-bc.github.io/Freyas-Better-Maps/");
}

function changelogId(): string {
	return String(FBM.CHANGELOG_ID || "r134-major");
}

function isDismissed(): boolean {
	if (!FBM.settings) FBM.loadSettings();
	return !!(FBM.settings && FBM.settings.dismissedChangelogId === changelogId());
}

function featureListHtml(): string {
	const items = [
		{
			title: "Objects Build",
			body: "Floating catalog for tiles, objects, and effects — search, brush/pipet/eraser, fog, undo, and custom variants without relying on Club’s map toolbar.",
		},
		{
			title: "Object Settings",
			body: "Rotate, resize, recolor layers, tether, and decals from an FBM modal (works while Club chrome is hidden). Save looks as reusable variants.",
		},
		{
			title: "Floatable Chat",
			body: "Seidr-styled chat panel when Club chat is collapsed on the map. Send, tag autocomplete, image embeds, and optional name highlights.",
		},
		{
			title: "Copy / Paste & ghosts",
			body: "Improved AABB copy with object-settings capture, template thumbs, and a translucent paste ghost that follows your cursor.",
		},
		{
			title: "Chat-split alignment",
			body: "Markers, grid, and paste previews stay locked to Club tiles when you drag the map/chat splitter (R134 square-tile layout).",
		},
		{
			title: "Hide more UI",
			body: "Collapse Club’s map toolbar behind a small +, optionally hide arrow keys / SuperPowers, and keep a ★ on the FBM bar for SuperPowers.",
		},
		{
			title: "Map helpers",
			body: "Typing bubbles, invisible-wall marks, hearing-range whisper, SuperZoom (admin), full blindfold silhouettes, and map library + autosave.",
		},
	];
	let html = '<ul class="fbm-cl-features">';
	for (let i = 0; i < items.length; i++) {
		html +=
			"<li><strong>" +
			items[i].title +
			"</strong> — " +
			items[i].body +
			"</li>";
	}
	html += "</ul>";
	return html;
}

FBM.changelogMarkup = function () {
	const docs = docsUrl();
	return (
		'<button type="button" class="fbm-cl-banner" id="fbm-cl-banner" hidden>' +
		'<span class="fbm-cl-banner-badge">update</span>' +
		'<span class="fbm-cl-banner-text">Freya’s Better Maps Update</span>' +
		"</button>" +
		'<div class="fbm-cl-modal" id="fbm-cl-modal" hidden role="dialog" aria-modal="true" aria-labelledby="fbm-cl-title">' +
		'<div class="fbm-cl-backdrop" id="fbm-cl-backdrop" aria-hidden="true"></div>' +
		'<div class="fbm-cl-card">' +
		'<div class="fbm-cl-head">' +
		'<div class="fbm-cl-title" id="fbm-cl-title">Freya’s Better Maps Update</div>' +
		'<button type="button" class="fbm-icon-btn" id="fbm-cl-x" title="Close">×</button>' +
		"</div>" +
		'<div class="fbm-cl-body">' +
		"<p>Thank you for using Freya’s Better Maps.</p>" +
		"<p>I’m happy to announce that we released a very big update. Most of the features use the new methods from <strong>R134</strong>.</p>" +
		'<p class="fbm-cl-label">What’s new</p>' +
		featureListHtml() +
		'<p class="fbm-cl-docs">Full player guide: <a id="fbm-cl-docs" href="' +
		docs +
		'" target="_blank" rel="noopener noreferrer">' +
		docs.replace(/^https?:\/\//, "") +
		"</a></p>" +
		"</div>" +
		'<div class="fbm-cl-actions">' +
		'<button type="button" class="fbm-btn" id="fbm-cl-close">Close</button>' +
		'<button type="button" class="fbm-btn fbm-btn-accent" id="fbm-cl-dismiss">Close and Don’t show again</button>' +
		"</div>" +
		"</div></div>"
	);
};

FBM.bindChangelogUi = function () {
	if (FBM._changelogBound) return;
	FBM._changelogBound = true;
	const banner = $("fbm-cl-banner");
	const modal = $("fbm-cl-modal");
	if (!banner || !modal) return;

	const openModal = function () {
		modal.hidden = false;
		banner.hidden = true;
	};
	const hideModal = function () {
		modal.hidden = true;
	};
	const showBanner = function () {
		if (FBM._changelogSessionClosed || isDismissed()) {
			banner.hidden = true;
			return;
		}
		banner.hidden = false;
	};

	banner.addEventListener("click", function () {
		openModal();
	});
	const closeOnly = function () {
		hideModal();
		FBM._changelogSessionClosed = true;
		banner.hidden = true;
	};
	const dismissForever = function () {
		if (!FBM.settings) FBM.loadSettings();
		FBM.settings.dismissedChangelogId = changelogId();
		FBM.saveSettings();
		FBM._changelogSessionClosed = true;
		hideModal();
		banner.hidden = true;
		if (FBM.setStatus) FBM.setStatus("Update notice dismissed.");
	};

	const x = $("fbm-cl-x");
	const backdrop = $("fbm-cl-backdrop");
	const closeBtn = $("fbm-cl-close");
	const dismissBtn = $("fbm-cl-dismiss");
	if (x) x.addEventListener("click", closeOnly);
	if (backdrop) backdrop.addEventListener("click", closeOnly);
	if (closeBtn) closeBtn.addEventListener("click", closeOnly);
	if (dismissBtn) dismissBtn.addEventListener("click", dismissForever);

	document.addEventListener(
		"keydown",
		function (e) {
			if (!e || (e.key !== "Escape" && e.code !== "Escape")) return;
			if (modal.hidden) return;
			e.preventDefault();
			closeOnly();
		},
		true
	);

	FBM._changelogShowBanner = showBanner;
	FBM._changelogOpenModal = openModal;
};

/** Show the bottom-right update banner after boot (unless dismissed). */
FBM.refreshChangelogBanner = function () {
	FBM.ensureUi();
	if (FBM.bindChangelogUi) FBM.bindChangelogUi();
	if (FBM._changelogShowBanner) FBM._changelogShowBanner();
};

/** Open the changelog modal (e.g. from About). */
FBM.openChangelogModal = function () {
	FBM.ensureUi();
	if (FBM.bindChangelogUi) FBM.bindChangelogUi();
	if (FBM._changelogOpenModal) FBM._changelogOpenModal();
};

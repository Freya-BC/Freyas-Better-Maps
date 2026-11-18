/** Freyas Better Maps — ui/styles.js (Seidr-aligned purple/gold chrome) */
import { FBM } from "../fbm";

FBM.STYLES = `
/* R132+ Club map editor chrome — collapse the editor/dialog, not the outer shell
   (#chat-room-map-view-panel is a full-map positioning layer; hiding it broke R134 expand). */
#chat-room-map-view-panel-editor.fbm-panel-collapsed,
#chat-room-map-view-dialog-menu.fbm-panel-collapsed {
	display: none !important;
	pointer-events: none !important;
	visibility: hidden !important;
}
/* Hide Club map movement / SuperPowers pad (HTML controls on R134+) */
body.fbm-hide-arrow-keys #chat-room-map-controls,
#chat-room-map-controls.fbm-arrow-keys-hidden {
	display: none !important;
	pointer-events: none !important;
	visibility: hidden !important;
}
#fbm-root {
	--fbm-bg: rgba(28, 22, 38, 0.96);
	--fbm-surface: rgba(42, 34, 56, 0.95);
	--fbm-surface2: rgba(60, 48, 80, 0.9);
	--fbm-field: rgba(20, 16, 28, 0.9);
	--fbm-border: rgba(255, 255, 255, 0.12);
	--fbm-text: #f0e6d4;
	--fbm-muted: #a898b0;
	--fbm-accent: #d4a017;
	--fbm-accent-soft: rgba(212, 160, 23, 0.18);
	--fbm-danger: #e06c75;
	--fbm-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
	--fbm-thumb: #2a2038;
	--fbm-thumb-deep: #1e1830;
	font: 13px/1.35 system-ui, -apple-system, Segoe UI, sans-serif;
	color: var(--fbm-text);
	pointer-events: none;
	z-index: 12000;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
#fbm-root * { box-sizing: border-box; }
#fbm-root button, #fbm-root input, #fbm-root select, #fbm-root textarea, #fbm-root .fbm-panel, #fbm-root .fbm-panel *,
#fbm-root .fbm-build-bar, #fbm-root .fbm-build-bar *,
#fbm-root .fbm-templates, #fbm-root .fbm-templates *,
#fbm-root .fbm-objects, #fbm-root .fbm-objects *,
#fbm-root .fbm-objset, #fbm-root .fbm-objset *,
#fbm-root .fbm-colorpick, #fbm-root .fbm-colorpick *,
#fbm-root .fbm-float-chat, #fbm-root .fbm-float-chat *,
#fbm-root .fbm-toast,
#fbm-root .fbm-cl-banner,
#fbm-root .fbm-cl-modal, #fbm-root .fbm-cl-modal *,
#fbm-root .fbm-prompt-overlay, #fbm-root .fbm-prompt-overlay * { pointer-events: auto; }
/* Club character dialog (restraints / activities): hide FBM overlays, keep open state. */
#fbm-root.fbm-dialog-suspend > .fbm-float-chat,
#fbm-root.fbm-dialog-suspend > .fbm-panel,
#fbm-root.fbm-dialog-suspend > .fbm-objects,
#fbm-root.fbm-dialog-suspend > .fbm-build-bar,
#fbm-root.fbm-dialog-suspend > .fbm-templates,
#fbm-root.fbm-dialog-suspend > .fbm-objset,
#fbm-root.fbm-dialog-suspend > .fbm-colorpick,
#fbm-root.fbm-dialog-suspend > .fbm-cl-banner,
#fbm-root.fbm-dialog-suspend > .fbm-cl-modal {
	visibility: hidden !important;
	pointer-events: none !important;
}
/* Keep name prompts usable even while Club dialog suspends other chrome. */
#fbm-root.fbm-dialog-suspend > .fbm-prompt-overlay {
	visibility: visible !important;
	pointer-events: auto !important;
}
#fbm-root ::-webkit-scrollbar { width: 8px; height: 8px; }
#fbm-root ::-webkit-scrollbar-track {
	background: rgba(20, 16, 28, 0.9); border-radius: 4px;
}
#fbm-root ::-webkit-scrollbar-thumb {
	background: rgba(212, 160, 23, 0.55); border-radius: 4px;
}
#fbm-root ::-webkit-scrollbar-thumb:hover {
	background: rgba(212, 160, 23, 0.8);
}
.fbm-panel {
	position: fixed; z-index: 120; top: 72px; right: 56px;
	width: min(440px, calc(100vw - 32px)); height: min(640px, calc(100vh - 96px));
	min-width: 320px; min-height: 360px; display: none; flex-direction: column;
	background: var(--fbm-bg); border: 1px solid var(--fbm-border); border-radius: 8px;
	box-shadow: var(--fbm-shadow); resize: both; overflow: hidden;
}
.fbm-panel.fbm-open { display: flex; }
.fbm-header {
	display: flex; align-items: center; justify-content: space-between; gap: 8px;
	padding: 8px 10px; background: var(--fbm-surface); border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	cursor: grab; user-select: none;
}
.fbm-header:active { cursor: grabbing; }
.fbm-header-title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.fbm-badge {
	font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
	color: var(--fbm-accent); border: 1px solid rgba(212, 160, 23, 0.35);
	border-radius: 999px; padding: 2px 7px; background: transparent;
}
.fbm-icon-btn {
	width: 28px; height: 28px; border: 1px solid var(--fbm-border); border-radius: 6px;
	background: transparent; color: inherit; display: grid; place-items: center; cursor: pointer;
	padding: 0;
}
.fbm-icon-btn:hover { border-color: var(--fbm-accent); color: var(--fbm-accent); }
.fbm-tabs {
	display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 10px 0;
	background: var(--fbm-surface); border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.fbm-tab {
	border: 1px solid transparent; border-bottom: none; border-radius: 6px 6px 0 0;
	background: transparent; color: var(--fbm-muted); padding: 6px 12px; cursor: pointer;
	font: inherit; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;
}
.fbm-tab:hover { color: var(--fbm-accent); }
.fbm-tab.fbm-on {
	color: var(--fbm-accent); border-color: var(--fbm-border); border-bottom-color: transparent;
	background: var(--fbm-bg);
}
.fbm-page {
	display: none; flex: 1; overflow: auto; padding: 12px 14px;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-page.fbm-on { display: block; }
.fbm-muted { color: var(--fbm-muted); }
.fbm-hint { font-size: 12px; line-height: 1.45; margin: 0 0 12px; }
.fbm-section { margin-top: 16px; }
.fbm-section-head {
	font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
	color: var(--fbm-accent); margin-bottom: 8px;
}
.fbm-check-row { display: flex; align-items: flex-start; gap: 10px; margin: 10px 0; cursor: pointer; }
.fbm-check-row input { margin-top: 2px; }
.fbm-row { display: flex; gap: 8px; align-items: center; margin: 8px 0; }
.fbm-row[hidden],
#fbm-obj-custom-actions[hidden],
#fbm-obj-ext-body[hidden] { display: none !important; }
.fbm-indent { margin-left: 1.6em; }
.fbm-row input[type="text"],
.fbm-row input[type="number"],
.fbm-row select,
.fbm-objset input[type="text"],
.fbm-objset select,
.fbm-colorpick input[type="text"] {
	flex: 1; min-width: 0; background: var(--fbm-field); border: 1px solid rgba(255, 255, 255, 0.14);
	color: var(--fbm-text); border-radius: 4px; padding: 6px 8px;
}
.fbm-row select:disabled,
.fbm-row input:disabled { opacity: 0.45; }
.fbm-bar-sync {
	align-self: center; font-size: 11px; color: var(--fbm-muted); padding: 0 6px; white-space: nowrap;
}
.fbm-btn {
	border: 1px solid rgba(255, 255, 255, 0.14); background: var(--fbm-surface2); color: var(--fbm-text);
	border-radius: 4px; padding: 4px 10px; cursor: pointer; font: inherit;
}
.fbm-btn:hover { border-color: var(--fbm-accent); }
.fbm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.fbm-btn-accent { background: var(--fbm-accent-soft); border-color: var(--fbm-accent); color: var(--fbm-accent); }
.fbm-btn-danger { color: var(--fbm-danger); border-color: rgba(224, 108, 117, 0.45); }
.fbm-map-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.fbm-map-item {
	display: flex; align-items: center; gap: 8px; padding: 8px 10px;
	background: rgba(42, 34, 56, 0.85); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px;
}
.fbm-map-item span { flex: 1; min-width: 0; }
.fbm-map-meta { font-size: 11px; color: var(--fbm-muted); }
.fbm-status { margin-top: 10px; font-size: 12px; color: var(--fbm-muted); min-height: 1.2em; }
.fbm-toast {
	position: fixed; z-index: 130; left: 50%; bottom: 28px; transform: translateX(-50%) translateY(12px);
	max-width: min(420px, calc(100vw - 32px)); padding: 10px 14px;
	background: rgba(28, 22, 38, 0.96); color: var(--fbm-text);
	border: 1px solid rgba(212, 160, 23, 0.45); border-radius: 8px;
	box-shadow: var(--fbm-shadow); font-size: 12px; line-height: 1.4;
	opacity: 0; transition: opacity 0.18s ease, transform 0.18s ease;
	pointer-events: none;
}
.fbm-toast.fbm-toast-show {
	opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto;
}

/* —— Update changelog banner + modal —— */
.fbm-cl-banner {
	position: fixed; z-index: 121; right: 16px; bottom: 16px;
	display: inline-flex; align-items: center; gap: 10px;
	max-width: min(360px, calc(100vw - 32px));
	padding: 10px 14px;
	background: rgba(28, 22, 38, 0.96); color: var(--fbm-text);
	border: 1px solid rgba(212, 160, 23, 0.5); border-radius: 8px;
	box-shadow: var(--fbm-shadow); cursor: pointer; font: inherit; text-align: left;
	backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
	transition: border-color 0.15s ease, transform 0.15s ease;
}
.fbm-cl-banner[hidden] { display: none !important; }
.fbm-cl-banner:hover { border-color: var(--fbm-accent); transform: translateY(-1px); }
.fbm-cl-banner-badge {
	flex-shrink: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
	padding: 2px 7px; border-radius: 999px; color: var(--fbm-accent);
	background: var(--fbm-accent-soft); border: 1px solid rgba(212, 160, 23, 0.35);
}
.fbm-cl-banner-text { font-weight: 600; font-size: 13px; line-height: 1.3; }
.fbm-cl-modal {
	position: fixed; inset: 0; z-index: 140;
	display: flex; align-items: center; justify-content: center;
	padding: 16px;
}
.fbm-cl-modal[hidden] { display: none !important; }
.fbm-cl-backdrop {
	position: absolute; inset: 0; background: rgba(8, 6, 12, 0.62);
	backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
}
.fbm-cl-card {
	position: relative; z-index: 1; width: min(520px, calc(100vw - 32px));
	max-height: min(720px, calc(100vh - 32px));
	display: flex; flex-direction: column;
	background: var(--fbm-bg); color: var(--fbm-text);
	border: 1px solid var(--fbm-border); border-radius: 10px;
	box-shadow: var(--fbm-shadow); overflow: hidden;
}
.fbm-cl-head {
	flex-shrink: 0; display: flex; align-items: center; gap: 10px;
	padding: 12px 14px; background: var(--fbm-surface);
	border-bottom: 1px solid var(--fbm-border);
}
.fbm-cl-title { flex: 1; font-weight: 700; font-size: 15px; min-width: 0; }
.fbm-cl-body {
	flex: 1; overflow: auto; padding: 14px 16px 8px;
	font-size: 13px; line-height: 1.45;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-cl-body p { margin: 0 0 10px; }
.fbm-cl-label {
	margin: 14px 0 8px !important; font-weight: 600; color: var(--fbm-accent);
	font-size: 12px; letter-spacing: 0.03em; text-transform: uppercase;
}
.fbm-cl-features {
	margin: 0 0 12px; padding-left: 1.15em;
	display: flex; flex-direction: column; gap: 8px;
}
.fbm-cl-features li { color: var(--fbm-text); }
.fbm-cl-features strong { color: var(--fbm-accent); font-weight: 600; }
.fbm-cl-docs { margin-top: 12px !important; font-size: 12px; color: var(--fbm-muted); }
.fbm-cl-docs a { color: var(--fbm-accent); text-decoration: underline; text-underline-offset: 2px; }
.fbm-cl-docs a:hover { color: #e8c04a; }
.fbm-cl-actions {
	flex-shrink: 0; display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end;
	padding: 12px 14px; border-top: 1px solid var(--fbm-border); background: var(--fbm-surface);
}
.fbm-cl-actions .fbm-btn { min-height: 32px; }
/* —— In-plugin text prompt (replaces window.prompt) —— */
.fbm-prompt-overlay {
	position: fixed; inset: 0; z-index: 140;
	background: rgba(0, 0, 0, 0.45);
	display: flex; align-items: center; justify-content: center;
	pointer-events: auto;
}
.fbm-prompt-dialog {
	width: min(92vw, 420px);
	background: var(--fbm-bg); border: 1px solid var(--fbm-border); border-radius: 8px;
	padding: 14px; display: flex; flex-direction: column; gap: 8px;
	color: var(--fbm-text); box-shadow: var(--fbm-shadow);
}
.fbm-prompt-dialog h4 { margin: 0; color: var(--fbm-accent); font-size: 14px; }
.fbm-prompt-msg { margin: 0; font-size: 13px; line-height: 1.4; color: var(--fbm-text); }
.fbm-prompt-field input {
	width: 100%; background: var(--fbm-field); border: 1px solid rgba(255, 255, 255, 0.14);
	color: var(--fbm-text); border-radius: 4px; padding: 8px 10px; font: inherit;
}
.fbm-prompt-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.fbm-build-bar {
	position: fixed; z-index: 118; top: 12px; left: 25%; transform: translateX(-50%);
	display: none; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; padding: 8px;
	max-width: min(980px, 48vw);
	background: rgba(36, 28, 48, 0.92);
	border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 8px; box-shadow: var(--fbm-shadow);
	backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.fbm-build-bar.fbm-show { display: flex; }
.fbm-build-bar.fbm-bar-placed { transform: none; }
.fbm-build-bar .fbm-btn.fbm-on { background: var(--fbm-accent-soft); border-color: var(--fbm-accent); color: var(--fbm-accent); }
.fbm-build-bar .fbm-bar-star {
	display: inline-flex; align-items: center; justify-content: center;
	min-width: 36px; padding: 4px 8px;
}
.fbm-build-bar .fbm-bar-star[hidden] { display: none !important; }
.fbm-build-bar .fbm-bar-star img {
	display: block; width: 18px; height: 18px; object-fit: contain; pointer-events: none;
}
.fbm-bar-grip {
	display: inline-flex; align-items: center; justify-content: center;
	width: 18px; height: 28px; margin-right: 2px; cursor: grab; user-select: none;
	color: var(--fbm-muted); font-size: 12px; letter-spacing: -2px; line-height: 1;
}
.fbm-bar-grip:active { cursor: grabbing; }
.fbm-templates {
	position: fixed; z-index: 119; top: 64px; left: 25%; transform: translateX(-50%);
	width: min(560px, 48vw, calc(100vw - 24px)); max-height: min(420px, calc(100vh - 100px));
	overflow: auto; padding: 12px; background: var(--fbm-bg); border: 1px solid var(--fbm-border);
	border-radius: 8px; box-shadow: var(--fbm-shadow);
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-templates[hidden] { display: none !important; }
.fbm-templates-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-weight: 600; }
.fbm-tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.fbm-tpl-card {
	position: relative; border: 1px solid var(--fbm-border); border-radius: 4px;
	background: var(--fbm-thumb); padding: 8px; cursor: pointer; text-align: center;
}
.fbm-tpl-card:hover, .fbm-tpl-card.fbm-on { border-color: var(--fbm-accent); }
.fbm-tpl-thumb { width: 100%; aspect-ratio: 1; border-radius: 4px; background: var(--fbm-thumb-deep); margin-bottom: 6px; object-fit: cover; }
.fbm-tpl-size { font-size: 11px; color: var(--fbm-muted); }
.fbm-tpl-del {
	position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 4px;
	border: 1px solid rgba(224, 108, 117, 0.5); background: rgba(0, 0, 0, 0.72); color: var(--fbm-danger);
	font-size: 12px; line-height: 1; cursor: pointer;
}
.fbm-tpl-del:hover { color: var(--fbm-accent); border-color: var(--fbm-accent); }
.fbm-about-feats { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.fbm-about-feat {
	margin: 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px;
	background: rgba(42, 34, 56, 0.85);
}
.fbm-about-feat > summary {
	cursor: pointer; padding: 9px 12px; font-weight: 600; list-style: none; user-select: none;
}
.fbm-about-feat > summary::-webkit-details-marker { display: none; }
.fbm-about-feat > summary::before {
	content: "▸"; display: inline-block; width: 1em; margin-right: 4px; color: var(--fbm-accent);
	transition: transform 0.12s ease;
}
.fbm-about-feat[open] > summary::before { transform: rotate(90deg); }
.fbm-about-feat-body { padding: 0 12px 10px; }
.fbm-about-desc { margin: 0 0 8px; font-size: 12px; line-height: 1.45; color: var(--fbm-muted); }
.fbm-about-label {
	margin: 0 0 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
	text-transform: uppercase; color: var(--fbm-accent);
}
.fbm-about-steps {
	margin: 0; padding-left: 1.2em; font-size: 12px; line-height: 1.5; color: var(--fbm-text);
}
.fbm-about-steps li { margin: 3px 0; }

.fbm-objects {
	position: fixed; z-index: 121; top: 96px; left: 50%; transform: translateX(-50%);
	width: min(900px, calc(100vw - 32px)); height: min(560px, calc(100vh - 120px));
	min-width: 640px; min-height: 420px; display: flex; flex-direction: column;
	background: var(--fbm-bg); border: 1px solid var(--fbm-border); border-radius: 8px;
	box-shadow: var(--fbm-shadow); resize: both; overflow: hidden;
}
.fbm-objects[hidden] { display: none !important; }
.fbm-obj-actionbar {
	display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
	padding: 8px 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-surface);
}
.fbm-obj-search {
	flex: 1 1 160px; min-width: 120px; max-width: 280px;
	background: var(--fbm-field); border: 1px solid rgba(255, 255, 255, 0.14); color: var(--fbm-text);
	border-radius: 4px; padding: 6px 8px;
}
.fbm-obj-action-sep { width: 1px; height: 22px; background: var(--fbm-border); margin: 0 2px; }
.fbm-obj-tool.fbm-on {
	background: var(--fbm-accent-soft); border-color: var(--fbm-accent); color: var(--fbm-accent);
}
.fbm-obj-clear {
	color: var(--fbm-danger); border-color: rgba(224, 108, 117, 0.45);
}
.fbm-obj-clear:hover:not(:disabled), .fbm-obj-clear.fbm-on {
	background: rgba(224, 108, 117, 0.16); border-color: var(--fbm-danger); color: var(--fbm-danger);
}
.fbm-obj-clear:disabled { opacity: 0.35; cursor: default; }
.fbm-obj-actionbar .fbm-icon-btn { flex-shrink: 0; }
.fbm-obj-body {
	--fbm-obj-ext-w: 260px;
	flex: 1; min-height: 0; display: grid;
	grid-template-columns: max-content minmax(180px, 1fr) 6px var(--fbm-obj-ext-w);
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	overflow: hidden;
}
.fbm-obj-splitter {
	width: 6px; cursor: col-resize; background: var(--fbm-border); position: relative; z-index: 2;
}
.fbm-obj-splitter:hover, .fbm-obj-splitter.fbm-on { background: var(--fbm-accent); }
.fbm-obj-splitter::after { content: ""; position: absolute; inset: 0 -4px; }
.fbm-obj-tree {
	min-height: 0; overflow: auto; padding: 8px 6px 12px;
	border-right: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-bg);
	width: max-content; min-width: 148px; max-width: 220px;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-obj-sec { margin-top: 8px; }
.fbm-obj-sec:first-child { margin-top: 0; }
.fbm-obj-sec-title {
	display: block; width: 100%; text-align: left; border: 0; background: transparent; cursor: pointer;
	font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
	color: var(--fbm-accent); padding: 4px 8px 6px;
}
.fbm-obj-sec-title::before { content: "▾ "; opacity: 0.8; }
.fbm-obj-sec.fbm-collapsed .fbm-obj-sec-title::before { content: "▸ "; }
.fbm-obj-sec.fbm-collapsed .fbm-obj-cat { display: none; }
.fbm-obj-cat {
	display: flex; align-items: center; gap: 6px; padding: 6px 8px; margin: 2px 0;
	border-radius: 6px; border: 1px solid transparent; background: transparent; color: var(--fbm-text);
	cursor: grab; user-select: none; width: 100%; text-align: left; font-size: 12px;
}
.fbm-obj-cat:hover { background: var(--fbm-surface); }
.fbm-obj-cat.fbm-on {
	background: var(--fbm-accent-soft); border-color: var(--fbm-accent); color: var(--fbm-accent);
}
.fbm-obj-cat.fbm-drag-over { border-color: var(--fbm-accent); outline: 1px dashed var(--fbm-accent); }
.fbm-obj-cat-handle { color: var(--fbm-muted); font-size: 11px; letter-spacing: -1px; cursor: grab; }
.fbm-obj-cat.fbm-cat-hidden { display: none; }
.fbm-obj-grid-wrap {
	min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: rgba(42, 34, 56, 0.55);
}
.fbm-obj-grid-head {
	display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
	padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-weight: 600;
}
.fbm-obj-grid-head .fbm-hint { margin: 0; font-weight: 400; }
.fbm-obj-grid {
	flex: 1; overflow: auto; padding: 10px;
	display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; align-content: start;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-obj-card {
	border: 1px solid var(--fbm-border); border-radius: 4px; background: var(--fbm-thumb);
	padding: 8px; cursor: pointer; text-align: center; color: var(--fbm-text);
}
.fbm-obj-card:hover, .fbm-obj-card.fbm-on { border-color: var(--fbm-accent); }
.fbm-obj-card-thumb {
	width: 100%; aspect-ratio: 1; border-radius: 4px; margin-bottom: 6px;
	background: var(--fbm-thumb-deep); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
.fbm-obj-card-name { font-size: 11px; line-height: 1.3; word-break: break-word; }
.fbm-obj-card-meta { font-size: 10px; color: var(--fbm-muted); margin-top: 2px; }
.fbm-obj-ext {
	min-width: 0; min-height: 0; overflow: auto; padding: 10px 12px 14px; background: var(--fbm-bg);
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-obj-preview { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.fbm-obj-preview-text { flex: 1; min-width: 0; }
.fbm-obj-preview-swatch {
	width: 96px; height: 96px; border-radius: 6px; border: 1px solid var(--fbm-border);
	background: var(--fbm-thumb-deep); flex-shrink: 0;
}
.fbm-obj-preview-name { font-weight: 600; }
.fbm-obj-variants {
	display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; margin-bottom: 12px;
}
.fbm-obj-variant {
	display: flex; flex-direction: column; align-items: stretch; gap: 6px; padding: 8px;
	border: 1px solid var(--fbm-border); border-radius: 4px;
	background: rgba(42, 34, 56, 0.85); cursor: pointer; color: var(--fbm-text); text-align: center;
}
.fbm-obj-variant:hover, .fbm-obj-variant.fbm-on { border-color: var(--fbm-accent); }
.fbm-obj-variant-swatch {
	width: 100%; aspect-ratio: 1; border-radius: 4px; background: var(--fbm-thumb-deep);
	box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
.fbm-obj-variant-name { font-size: 11px; line-height: 1.3; word-break: break-word; }
.fbm-obj-variant-custom { outline: 1px dashed rgba(212, 160, 23, 0.5); }
.fbm-obj-recent-wrap {
	display: flex; align-items: center; gap: 8px; padding: 6px 10px;
	border-top: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-surface); min-height: 52px;
}
.fbm-obj-recent-label {
	font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
	color: var(--fbm-accent); flex-shrink: 0;
}
.fbm-obj-recent { flex: 1; min-width: 0; display: flex; gap: 6px; overflow: hidden; }
.fbm-obj-recent-item {
	width: 36px; height: 36px; flex-shrink: 0; border-radius: 4px; border: 1px solid var(--fbm-border);
	background: var(--fbm-thumb-deep); cursor: pointer; padding: 0;
}
.fbm-obj-recent-item:hover, .fbm-obj-recent-item.fbm-on {
	border-color: var(--fbm-accent); outline: 1px solid var(--fbm-accent);
}
.fbm-obj-recent-empty { font-size: 11px; color: var(--fbm-muted); align-self: center; }
.fbm-obj-status {
	padding: 6px 12px; font-size: 11px; color: var(--fbm-muted); background: var(--fbm-bg); min-height: 1.4em;
}
.fbm-objset {
	position: fixed; z-index: 130; top: 96px; left: 56px;
	max-width: calc(100vw - 32px); max-height: min(560px, calc(100vh - 96px));
	display: flex; flex-direction: row; align-items: stretch;
	background: var(--fbm-bg); border: 1px solid var(--fbm-border); border-radius: 8px;
	box-shadow: var(--fbm-shadow); overflow: hidden;
}
.fbm-objset[hidden] { display: none !important; }
.fbm-objset-main {
	width: min(320px, calc(100vw - 32px)); min-width: 260px; max-height: inherit;
	display: flex; flex-direction: column; min-width: 0;
}
.fbm-objset-body {
	flex: 1; overflow: auto; padding: 10px 12px 12px; min-height: 0;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-objset-footer {
	display: flex; gap: 8px; padding: 8px 12px;
	border-top: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-surface);
}
.fbm-objset-footer[hidden] { display: none !important; }
.fbm-objset-footer .fbm-btn { flex: 1; }
.fbm-objset-status {
	padding: 6px 12px; font-size: 11px; color: var(--fbm-muted);
	border-top: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-field); min-height: 1.4em;
}
.fbm-objset-slider {
	display: grid; grid-template-columns: 72px 1fr 36px; gap: 8px; align-items: center;
	margin: 8px 0;
}
.fbm-objset-slider input[type="range"] { width: 100%; }
.fbm-objset-layer-row {
	display: grid; grid-template-columns: 1fr 28px minmax(72px, 88px); gap: 8px; align-items: center;
	margin: 6px 0;
}
.fbm-objset-swatch {
	width: 28px; height: 28px; border-radius: 4px; border: 1px solid var(--fbm-border);
	padding: 0; cursor: pointer; background: #fff;
}
.fbm-objset .fbm-section-head {
	margin-top: 12px; margin-bottom: 4px; font-size: 10px; font-weight: 700;
	letter-spacing: 0.06em; text-transform: uppercase; color: var(--fbm-accent);
}
.fbm-objset .fbm-check-row {
	display: flex; align-items: center; gap: 8px; margin: 10px 0; cursor: pointer;
}
.fbm-colorpick {
	position: relative; z-index: 1; width: 240px; flex-shrink: 0;
	display: flex; flex-direction: column;
	background: var(--fbm-field); border: 0; border-left: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 0; box-shadow: none; overflow: hidden;
}
.fbm-colorpick[hidden] { display: none !important; }
.fbm-objset:has(#fbm-colorpick:not([hidden])) .fbm-objset-main {
	border-right: 0;
}
.fbm-colorpick-head {
	display: flex; align-items: center; justify-content: space-between; gap: 8px;
	padding: 8px 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-surface);
	font-weight: 600; font-size: 12px; min-height: 40px;
}
.fbm-colorpick-body { padding: 10px 12px 12px; }
.fbm-colorpick-sv {
	position: relative; width: 100%; aspect-ratio: 1; border-radius: 6px; cursor: crosshair;
	background: #f00;
	background-image:
		linear-gradient(to top, #000, transparent),
		linear-gradient(to right, #fff, transparent);
}
.fbm-colorpick-cursor {
	position: absolute; width: 12px; height: 12px; margin: -6px 0 0 -6px;
	border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.5);
	pointer-events: none;
}
.fbm-colorpick-hue {
	width: 100%; margin: 10px 0;
	background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
	border-radius: 4px; height: 14px; appearance: none;
}
.fbm-colorpick-hue::-webkit-slider-thumb {
	appearance: none; width: 14px; height: 14px; border-radius: 50%;
	background: #fff; border: 1px solid #333; cursor: pointer;
}
.fbm-colorpick-swatch {
	width: 28px; height: 28px; border-radius: 4px; border: 1px solid var(--fbm-border); flex-shrink: 0;
}
.fbm-colorpick #fbm-colorpick-hex { width: 88px; }
body.fbm-eyedrop-cursor, body.fbm-eyedrop-cursor * { cursor: crosshair !important; }

/* —— Floatable Chat —— */
.fbm-float-chat {
	--fbm-fc-bg: rgba(28, 22, 38, 0.96);
	--fbm-fc-surface: rgba(42, 34, 56, 0.95);
	--fbm-fc-surface2: rgba(60, 48, 80, 0.9);
	--fbm-fc-field: rgba(20, 16, 28, 0.9);
	--fbm-fc-border: rgba(255, 255, 255, 0.12);
	--fbm-fc-text: #f0e6d4;
	--fbm-fc-muted: #a898b0;
	--fbm-fc-accent: #d4a017;
	--fbm-fc-accent-soft: rgba(212, 160, 23, 0.18);
	--fbm-fc-row-a: transparent;
	--fbm-fc-row-b: rgba(255, 255, 255, 0.03);
	--fbm-fc-sep: rgba(255, 255, 255, 0.08);
	--fbm-fc-emote-fg: #c9b48a;
	--fbm-fc-action-fg: #9aafc4;
	--fbm-fc-whisper-fg: #b8a4d4;
	--fbm-fc-whisper-mode: #9b7ed9;
	--fbm-fc-whisper-mode-soft: rgba(155, 126, 217, 0.2);
	--fbm-fc-beep-fg: #7ec8b8;
	--fbm-fc-beep-mode: #3db8a0;
	--fbm-fc-beep-mode-soft: rgba(61, 184, 160, 0.18);
	--fbm-fc-system-bg: rgba(255, 255, 255, 0.045);
	--fbm-fc-size: 13px;
	--fbm-fc-font: system-ui, -apple-system, Segoe UI, sans-serif;
	position: fixed; z-index: 119; display: flex; flex-direction: column;
	width: 380px; height: 480px; min-width: 300px; min-height: 240px;
	max-width: calc(100vw - 16px); max-height: calc(100vh - 16px);
	left: 48px; top: 64px;
	background: var(--fbm-fc-bg); color: var(--fbm-fc-text);
	border: 1px solid var(--fbm-fc-border); border-radius: 8px;
	box-shadow: var(--fbm-shadow); overflow: hidden;
	font-family: var(--fbm-fc-font); font-size: var(--fbm-fc-size); line-height: 1.4;
}
.fbm-float-chat[hidden] { display: none !important; }
.fbm-float-chat[data-fc-theme="light"] {
	/* Alpha overridden by applyFloatChatTheme from Settings → Transparency. */
	--fbm-fc-bg: rgba(244, 238, 248, 0.85); --fbm-fc-surface: rgba(235, 227, 242, 0.81);
	--fbm-fc-surface2: rgba(224, 213, 235, 0.77); --fbm-fc-field: rgba(255, 250, 252, 0.9);
	--fbm-fc-border: rgba(42, 32, 56, 0.14);
	--fbm-fc-text: #2a2038; --fbm-fc-muted: #6e5f7a; --fbm-fc-accent: #b8860b;
	--fbm-fc-accent-soft: rgba(184, 134, 11, 0.16);
	--fbm-fc-row-b: rgba(42, 32, 56, 0.04); --fbm-fc-sep: rgba(42, 32, 56, 0.1);
	--fbm-fc-emote-fg: #8a7340; --fbm-fc-action-fg: #4a6a88; --fbm-fc-whisper-fg: #6a5490;
	--fbm-fc-whisper-mode: #7a5cb8; --fbm-fc-whisper-mode-soft: rgba(122, 92, 184, 0.16);
	--fbm-fc-beep-fg: #2f8f7c; --fbm-fc-beep-mode: #2f9e88; --fbm-fc-beep-mode-soft: rgba(47, 158, 136, 0.14);
	--fbm-fc-system-bg: rgba(42, 32, 56, 0.06);
}
.fbm-fc-header {
	flex-shrink: 0; display: flex; align-items: center; gap: 8px;
	padding: 8px 10px; background: var(--fbm-fc-surface);
	border-bottom: 1px solid var(--fbm-fc-border); cursor: grab; user-select: none;
}
.fbm-fc-header:active { cursor: grabbing; }
.fbm-fc-header-title {
	flex: 1; display: flex; align-items: baseline; gap: 8px; font-weight: 600; min-width: 0;
}
.fbm-fc-room-name {
	min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fbm-fc-room-count {
	flex: 0 0 auto; font-weight: 600; font-variant-numeric: tabular-nums;
	color: var(--fbm-fc-accent); white-space: nowrap;
}
.fbm-fc-hotkey-hint { font-size: 11px; color: var(--fbm-fc-muted); white-space: nowrap; }
.fbm-fc-toolbar {
	flex-shrink: 0; display: flex; flex-wrap: nowrap; gap: 6px; padding: 6px 8px;
	background: var(--fbm-fc-surface); border-bottom: 1px solid var(--fbm-fc-border);
	align-items: stretch; overflow: visible; position: relative; z-index: 6;
}
.fbm-fc-tool {
	display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
	gap: 2px; min-width: 52px; flex: 0 0 auto; border: 1px solid var(--fbm-fc-border);
	background: var(--fbm-fc-surface2); color: var(--fbm-fc-text); border-radius: 4px;
	padding: 4px 6px 3px; font: inherit; font-size: 9px; letter-spacing: 0.02em;
	text-transform: uppercase; cursor: pointer;
}
.fbm-fc-tool[hidden] { display: none !important; }
.fbm-fc-tool img {
	display: block; height: 22px; width: auto; max-width: 48px; object-fit: contain;
	/* Club Rectangle PNGs → Seidr gold (#d4a017 / accent). */
	filter: invert(72%) sepia(62%) saturate(620%) hue-rotate(2deg) brightness(0.98) contrast(1.05);
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-tool img {
	filter: invert(52%) sepia(70%) saturate(560%) hue-rotate(8deg) brightness(0.92) contrast(1.02);
}
.fbm-fc-tool:hover img {
	filter: invert(78%) sepia(55%) saturate(680%) hue-rotate(2deg) brightness(1.08) contrast(1.05);
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-tool:hover img {
	filter: invert(46%) sepia(75%) saturate(600%) hue-rotate(8deg) brightness(0.98) contrast(1.05);
}
/* Keep Seidr logo colors (do not gold-tint). */
.fbm-fc-tool-seidr img,
.fbm-fc-tool-seidr:hover img,
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-tool-seidr img,
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-tool-seidr:hover img {
	filter: drop-shadow(0 0 0.5px rgba(0, 0, 0, 0.35));
}
.fbm-fc-tool-glyph {
	display: grid; place-items: center; height: 22px; font-size: 16px; line-height: 1;
	color: var(--fbm-fc-accent);
}
.fbm-fc-tool:hover { border-color: var(--fbm-fc-accent); }
.fbm-fc-tool:hover .fbm-fc-tool-glyph { color: var(--fbm-fc-accent); filter: brightness(1.12); }
.fbm-fc-tool.fbm-fc-on {
	background: var(--fbm-fc-accent-soft); border-color: var(--fbm-fc-accent); color: var(--fbm-fc-accent);
}
.fbm-fc-tool-seidr { border-color: rgba(212, 160, 23, 0.45); }
.fbm-fc-more-wrap { position: relative; margin-left: auto; flex: 0 0 auto; z-index: 7; }
.fbm-fc-more-wrap[hidden] { display: none !important; }
.fbm-fc-more-menu {
	position: absolute; right: 0; top: calc(100% + 4px); z-index: 80;
	width: 180px; min-width: 180px; max-width: 180px; box-sizing: border-box;
	padding: 4px;
	background: rgba(28, 22, 38, 0.98); border: 1px solid var(--fbm-fc-border);
	border-radius: 6px; box-shadow: 0 12px 28px rgba(0,0,0,0.45);
	display: flex; flex-direction: column; gap: 2px;
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-more-menu {
	background: rgba(244, 238, 248, 0.98); color: #2a2038;
	border-color: rgba(42, 32, 56, 0.14);
}
.fbm-fc-more-menu[hidden] { display: none !important; }
.fbm-fc-more-item {
	display: block; width: 100%; text-align: left; cursor: pointer;
	background: transparent; color: inherit; border: 1px solid transparent;
	border-radius: 4px; padding: 7px 10px; font: inherit; font-size: 12px;
	box-sizing: border-box; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.fbm-fc-more-item:hover { border-color: var(--fbm-fc-accent); background: var(--fbm-fc-accent-soft); }
.fbm-fc-body {
	flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
	position: relative; background: var(--fbm-fc-bg);
}
.fbm-fc-log {
	flex: 1 1 auto; min-height: 80px; overflow: auto; padding: 4px 0 6px;
	display: flex; flex-direction: column; gap: 0;
	position: relative; z-index: 1; background: var(--fbm-fc-bg);
}
.fbm-fc-members {
	flex: 0 0 30%; flex-grow: 0; flex-shrink: 0;
	min-height: 0; max-height: 70%;
	display: flex; flex-direction: column;
	overflow: hidden;
	border-bottom: 1px solid var(--fbm-fc-border);
	background: var(--fbm-fc-surface);
	position: relative; z-index: 2;
}
.fbm-fc-members[hidden] { display: none !important; }
.fbm-fc-members-resize {
	flex: 0 0 5px; flex-grow: 0; flex-shrink: 0; cursor: row-resize;
	background: var(--fbm-fc-border);
	position: relative; z-index: 2;
}
.fbm-fc-members-resize::after {
	content: ""; position: absolute; left: 50%; top: 1px; transform: translateX(-50%);
	width: 36px; height: 3px; border-radius: 2px; background: var(--fbm-fc-accent);
	opacity: 0.55;
}
.fbm-fc-members-resize[hidden] { display: none !important; }
.fbm-fc-members-head {
	flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
	padding: 6px 10px; font-weight: 600; color: var(--fbm-fc-accent);
	border-bottom: 1px solid var(--fbm-fc-border);
}
.fbm-fc-members-list {
	flex: 1; min-height: 0; overflow: auto; padding: 6px 8px 10px;
	display: flex; flex-direction: column; gap: 6px;
}
.fbm-fc-members-empty { color: var(--fbm-fc-muted); margin: 8px; font-size: 12px; }
.fbm-fc-mem-row {
	display: grid; grid-template-columns: 36px minmax(0, 1.3fr) minmax(72px, 0.7fr) minmax(0, 0.9fr) minmax(0, 0.7fr);
	gap: 6px 8px; align-items: start;
	padding: 8px; border-radius: 6px;
	background: var(--fbm-fc-surface2); border: 1px solid var(--fbm-fc-border);
}
.fbm-fc-mem-row.fbm-fc-mem-self { opacity: 0.85; }
.fbm-fc-mem-row.fbm-fc-mem-compass-hot {
	border-color: var(--fbm-fc-accent);
	box-shadow: inset 0 0 0 1px var(--fbm-fc-accent-soft);
	background: var(--fbm-fc-accent-soft);
}
.fbm-fc-mem-av {
	box-sizing: border-box;
	width: 36px; height: 36px; min-width: 36px; min-height: 36px;
	max-width: 36px; max-height: 36px;
	flex: 0 0 36px;
	border-radius: 6px; overflow: hidden;
	display: grid; place-items: center; font-size: 11px; font-weight: 700;
	background: rgba(20, 16, 28, 0.9); border: 1px solid rgba(155, 126, 217, 0.45);
	color: #c8b0e8;
	position: relative;
}
.fbm-fc-mem-av .fbm-fc-face-img,
.fbm-fc-mem-av img,
.fbm-fc-mem-av .fbm-fc-face-canvas,
.fbm-fc-mem-av canvas {
	display: block; width: 36px !important; height: 36px !important;
	max-width: 36px !important; max-height: 36px !important;
	object-fit: cover; position: relative;
}
.fbm-fc-mem-av .fbm-fc-face-initials { line-height: 1; }
.fbm-fc-mem-ident { min-width: 0; }
.fbm-fc-mem-nick { font-weight: 700; color: var(--fbm-fc-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fbm-fc-mem-name { font-size: 11px; color: var(--fbm-fc-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fbm-fc-mem-id {
	appearance: none; border: 1px solid transparent; background: transparent;
	padding: 0; margin: 0; text-align: left; cursor: pointer;
	font: inherit; font-size: 13px; font-weight: 600; line-height: 1.35;
	color: var(--fbm-fc-text); font-variant-numeric: tabular-nums;
}
.fbm-fc-mem-id:hover { color: var(--fbm-fc-accent); text-decoration: underline; }
.fbm-fc-mem-pills { display: flex; flex-wrap: wrap; gap: 4px; align-content: flex-start; }
.fbm-fc-pill {
	display: inline-flex; align-items: center; padding: 1px 7px; border-radius: 999px;
	font-size: 10px; font-weight: 700; letter-spacing: 0.02em;
	border: 1px solid currentColor; background: rgba(0,0,0,0.2);
}
.fbm-fc-pill-friend { color: #6ea8ff; }
.fbm-fc-pill-lover { color: #ff7eb6; }
.fbm-fc-pill-sub { color: #c9a0ff; }
.fbm-fc-pill-wl { color: #5fd6a0; }
.fbm-fc-pill-admin { color: #ff6b6b; }
.fbm-fc-pill-visitor { color: #a898b0; }
.fbm-fc-mem-actions {
	grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 4px;
}
.fbm-fc-mem-btn {
	border: 1px solid rgba(255,255,255,0.14); background: rgba(42, 34, 56, 0.95);
	color: #d8e6ff; border-radius: 4px; padding: 3px 7px; font: inherit; font-size: 11px; cursor: pointer;
}
.fbm-fc-mem-btn:hover { filter: brightness(1.08); }
.fbm-fc-mem-pos { color: #9ec0ff; }
.fbm-fc-mem-ok { color: #5fd6a0; }
.fbm-fc-mem-neg { color: #ff8fa3; }
.fbm-fc-mem-warn { color: #ffb86b; }
.fbm-fc-mem-danger { color: #ff6b6b; border-color: rgba(255, 107, 107, 0.45); }
.fbm-fc-font-select {
	flex: 1; min-width: 0; box-sizing: border-box;
	background: var(--fbm-field); color: var(--fbm-text);
	border: 1px solid rgba(255,255,255,0.14); border-radius: 4px; padding: 6px 8px; font: inherit;
}
.fbm-fc-msg {
	display: flex; align-items: flex-start; gap: 10px; padding: 3px 12px;
	border-bottom: 1px solid var(--fbm-fc-sep); background: var(--fbm-fc-row-a); line-height: 1.4;
	position: relative;
}
.fbm-fc-msg:nth-child(even) { background: var(--fbm-fc-row-b); }
.fbm-fc-msg-main { flex: 1; min-width: 0; word-break: break-word; position: relative; padding-right: 28px; }
.fbm-fc-msg-line { display: block; }
.fbm-fc-msg-name, .fbm-fc-msg-colon { font-weight: 600; }
.fbm-fc-msg-name-btn { cursor: pointer; text-decoration: underline; text-decoration-color: transparent; }
.fbm-fc-msg-name-btn:hover { text-decoration-color: currentColor; filter: brightness(1.08); }
.fbm-fc-msg-dir {
	font-weight: 700; font-size: 0.92em; letter-spacing: 0.02em;
	color: var(--fbm-fc-muted); text-transform: none;
}
.fbm-fc-msg-whisper .fbm-fc-msg-dir { color: var(--fbm-fc-whisper-fg); }
.fbm-fc-msg-beep .fbm-fc-msg-dir { color: var(--fbm-fc-beep-fg); }
.fbm-fc-msg-reply {
	display: block; max-width: 92%; margin: 0 0 2px;
	color: var(--fbm-fc-muted); font-size: 0.75em; line-height: 1.15;
	opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.fbm-fc-msg-reply::before { content: "↱ "; }
.fbm-fc-msg-body { display: inline; white-space: pre-wrap; }
.fbm-fc-reply-btn {
	position: absolute; top: 0; right: 0;
	display: none; align-items: center; justify-content: center;
	margin: 0; padding: 0 4px; min-width: 1.5em; height: 1.4em;
	border: 1px solid var(--fbm-fc-border); border-radius: 4px;
	background: rgba(255,255,255,0.06); color: var(--fbm-fc-accent);
	cursor: pointer; font: inherit; line-height: 1;
}
.fbm-fc-msg:hover .fbm-fc-reply-btn { display: inline-flex; }
.fbm-fc-reply-btn:hover { border-color: var(--fbm-fc-accent); background: rgba(212,160,23,0.12); }
.fbm-fc-msg-body a { color: #a9ceff; word-break: break-all; }
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-msg-body a { color: #003f91; }
.fbm-fc-img-link { vertical-align: top; display: inline-block; max-width: 100%; }
.fbm-fc-img {
	max-height: 25rem; max-width: 90%; display: block;
	border: 1px solid rgba(212, 160, 23, 0.35); border-radius: 4px; padding: 0.1rem;
	margin: 4px 0;
}
.fbm-fc-trust-actions-inline { white-space: nowrap; }
.fbm-fc-trust-link {
	display: inline; margin: 0; padding: 0; border: none; background: none;
	color: var(--fbm-fc-accent); font: inherit; cursor: pointer; text-decoration: underline;
}
.fbm-fc-trust-link:hover { filter: brightness(1.1); }
.fbm-fc-hl-own, .fbm-fc-hl-other { font-weight: 700; background: transparent; padding: 0; }
.fbm-fc-own-names {
	width: 100%; min-height: 72px; resize: vertical; margin: 4px 0 8px;
	background: var(--fbm-field); color: var(--fbm-text);
	border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 4px; padding: 6px 8px;
	font: inherit; box-sizing: border-box;
}
#fbm-fc-hl-own-opts[hidden],
#fbm-fc-hl-color-row[hidden] { display: none !important; }
#fbm-fc-hl-color { width: 48px; height: 28px; padding: 0; border: 1px solid rgba(255,255,255,0.2); background: transparent; cursor: pointer; }
.fbm-fc-msg-meta {
	flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end;
	margin-top: 1px; font-size: 10px; line-height: 1.15; color: var(--fbm-fc-muted);
	opacity: 0.8; font-variant-numeric: tabular-nums; white-space: nowrap;
}
.fbm-fc-msg-whisper {
	background: rgba(155, 126, 217, 0.08);
	border-left: 3px solid var(--fbm-fc-whisper-mode);
}
.fbm-fc-msg-whisper:nth-child(even) { background: rgba(155, 126, 217, 0.11); }
.fbm-fc-msg-whisper .fbm-fc-msg-body { font-style: italic; color: var(--fbm-fc-whisper-fg); }
.fbm-fc-msg-whisper.fbm-fc-msg-dir-to { border-left-color: #c4a8ef; }
.fbm-fc-msg-whisper.fbm-fc-msg-dir-from { border-left-color: var(--fbm-fc-whisper-mode); }
.fbm-fc-msg-emote .fbm-fc-msg-main { font-style: italic; color: var(--fbm-fc-emote-fg); }
.fbm-fc-msg-action .fbm-fc-msg-main { color: var(--fbm-fc-action-fg); }
.fbm-fc-ctx {
	position: fixed; z-index: 13000; min-width: 160px; padding: 4px;
	background: rgba(28, 22, 38, 0.98); color: #f0e6d4;
	border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 6px;
	box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
	font: 13px/1.35 system-ui, -apple-system, Segoe UI, sans-serif;
}
.fbm-fc-ctx[hidden] { display: none !important; }
.fbm-fc-ctx-item {
	display: block; width: 100%; text-align: left; cursor: pointer;
	background: transparent; color: inherit; border: 1px solid transparent;
	border-radius: 4px; padding: 6px 10px; font: inherit;
}
.fbm-fc-ctx-item:hover { border-color: #d4a017; background: rgba(60, 48, 80, 0.9); }
.fbm-fc-confirm {
	position: fixed; inset: 0; z-index: 13100; display: flex;
	align-items: center; justify-content: center;
	background: rgba(10, 8, 16, 0.55);
}
.fbm-fc-confirm[hidden] { display: none !important; }
.fbm-fc-confirm-card {
	min-width: 280px; max-width: min(420px, 92vw);
	background: rgba(28, 22, 38, 0.98); color: #f0e6d4;
	border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 8px;
	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55); padding: 14px 16px;
	font: 13px/1.4 system-ui, -apple-system, Segoe UI, sans-serif;
}
.fbm-fc-confirm-title { font-weight: 700; color: #d4a017; margin-bottom: 8px; }
.fbm-fc-confirm-body { color: #f0e6d4; margin-bottom: 14px; }
.fbm-fc-confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
.fbm-fc-confirm-cancel, .fbm-fc-confirm-ok {
	border-radius: 6px; padding: 6px 12px; font: inherit; cursor: pointer;
	border: 1px solid rgba(255,255,255,0.16); background: rgba(60, 48, 80, 0.9); color: inherit;
}
.fbm-fc-confirm-ok {
	border-color: rgba(212, 160, 23, 0.55); background: rgba(212, 160, 23, 0.18); color: #d4a017;
}
.fbm-fc-msg-system { background: var(--fbm-fc-system-bg); color: var(--fbm-fc-muted); }
.fbm-fc-msg-system:nth-child(even) { background: var(--fbm-fc-system-bg); }
/* WCE pending echo — muted lag cue; replaced by the real line on ack. */
.fbm-fc-msg-pending {
	opacity: 0.58;
	border-left: 3px solid rgba(212, 160, 23, 0.55);
	color: var(--fbm-fc-muted);
}
.fbm-fc-msg-pending .fbm-fc-msg-body,
.fbm-fc-msg-pending .fbm-fc-msg-name,
.fbm-fc-msg-pending .fbm-fc-msg-colon {
	font-style: italic;
	color: var(--fbm-fc-muted);
}
.fbm-fc-msg-pending .fbm-fc-reply-btn { display: none !important; }
.fbm-fc-msg-beep {
	background: rgba(61, 184, 160, 0.08);
	border-left: 3px solid var(--fbm-fc-beep-mode);
	color: var(--fbm-fc-text);
}
.fbm-fc-msg-beep:nth-child(even) { background: rgba(61, 184, 160, 0.11); }
.fbm-fc-msg-beep .fbm-fc-msg-body { color: var(--fbm-fc-beep-fg); }
.fbm-fc-msg-beep.fbm-fc-msg-dir-to { border-left-color: #7ed9c6; }
.fbm-fc-msg-beep.fbm-fc-msg-dir-from { border-left-color: var(--fbm-fc-beep-mode); }
.fbm-fc-compose-wrap {
	flex-shrink: 0; position: relative; border-top: 1px solid var(--fbm-fc-border);
	background: var(--fbm-fc-surface); padding: 8px;
}
.fbm-fc-reply {
	display: flex; align-items: center; gap: 8px; margin: 0 0 6px;
	padding: 6px 8px; border-radius: 4px;
	background: #111; color: #fff; border: 1px solid rgba(255,255,255,0.12);
}
.fbm-fc-reply[hidden] { display: none !important; }
.fbm-fc-reply-text { flex: 1; min-width: 0; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fbm-fc-reply-close {
	flex-shrink: 0; width: 28px; height: 28px; border: none; border-radius: 4px;
	background: transparent; color: #ff3b3b; font-size: 18px; line-height: 1; cursor: pointer;
}
.fbm-fc-reply-close:hover { background: rgba(255, 59, 59, 0.15); }
.fbm-fc-wav {
	flex: 0 0 48px; flex-shrink: 0; width: 48px; height: 48px;
	max-width: 48px; max-height: 48px; border-radius: 8px; overflow: hidden;
	border: 1px solid var(--fbm-fc-whisper-mode); background: rgba(20, 16, 28, 0.9);
	align-self: center;
}
.fbm-fc-wav[hidden] { display: none !important; }
.fbm-fc-wav .fbm-fc-face-img,
.fbm-fc-wav .fbm-fc-face-canvas,
.fbm-fc-wav canvas,
.fbm-fc-wav img,
.fbm-fc-wav-img, .fbm-fc-wav-canvas {
	display: block; width: 48px !important; height: 48px !important;
	max-width: 48px !important; max-height: 48px !important;
	object-fit: cover; pointer-events: none;
}
.fbm-fc-wav .fbm-fc-face-initials {
	display: grid; place-items: center; width: 100%; height: 100%;
	font-size: 14px; font-weight: 700; color: #c8b0e8;
}
.fbm-fc-ac {
	position: absolute; left: 8px; right: 8px; bottom: 100%; margin-bottom: 4px;
	max-height: min(320px, 45vh); overflow: auto; overflow-x: hidden;
	display: none; flex-direction: column; gap: 2px; padding: 6px; z-index: 3;
	background: rgba(28, 22, 38, 0.96); color: #f0e6d4;
	border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px;
	box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
	font: 13px/1.35 system-ui, -apple-system, Segoe UI, sans-serif;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-ac {
	background: rgba(244, 238, 248, 0.96); color: #2a2038;
	border-color: rgba(42, 32, 56, 0.14);
	box-shadow: 0 12px 36px rgba(42, 32, 56, 0.18);
}
.fbm-fc-ac.fbm-fc-open { display: flex; }
.fbm-fc-ac[hidden] { display: none !important; }
.fbm-fc-ac-item {
	display: flex; align-items: baseline; gap: 8px; width: 100%;
	text-align: left; cursor: pointer;
	background: rgba(42, 34, 56, 0.85); color: #f0e6d4;
	border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px;
	padding: 6px 10px; font: inherit;
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-ac-item {
	background: rgba(224, 213, 235, 0.9); color: #2a2038;
	border-color: rgba(42, 32, 56, 0.12);
}
.fbm-fc-ac-item:hover, .fbm-fc-ac-item.fbm-fc-ac-on {
	border-color: #d4a017; color: inherit;
	background: rgba(60, 48, 80, 0.95);
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-ac-item:hover,
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-ac-item.fbm-fc-ac-on {
	background: rgba(212, 160, 23, 0.16); border-color: #b8860b;
}
.fbm-fc-ac-label { flex: 1; min-width: 0; }
.fbm-fc-ac-hint {
	flex: 0 0 auto; font-size: 11px; color: #a898b0;
	font-variant-numeric: tabular-nums;
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-ac-hint { color: #6e5f7a; }
.fbm-fc-compose { display: flex; gap: 8px; align-items: center; }
.fbm-fc-compose textarea {
	flex: 1; min-height: 44px; max-height: 120px; resize: vertical;
	background: var(--fbm-fc-field); color: var(--fbm-fc-text);
	border: 1px solid var(--fbm-fc-border); border-radius: 6px; padding: 8px;
	font: inherit; font-family: var(--fbm-fc-font); font-size: var(--fbm-fc-size);
}
.fbm-fc-compose-wrap[data-fc-mode="chat"] .fbm-fc-compose textarea:focus {
	outline: 1px solid var(--fbm-fc-accent); border-color: var(--fbm-fc-accent);
}
.fbm-fc-compose-wrap[data-fc-mode="whisper"] .fbm-fc-compose textarea {
	border-color: var(--fbm-fc-whisper-mode);
	box-shadow: inset 0 0 0 1px var(--fbm-fc-whisper-mode-soft);
}
.fbm-fc-compose-wrap[data-fc-mode="whisper"] .fbm-fc-compose textarea:focus {
	outline: 1px solid var(--fbm-fc-whisper-mode); border-color: var(--fbm-fc-whisper-mode);
}
.fbm-fc-compose-wrap[data-fc-mode="beep"] .fbm-fc-compose textarea {
	border-color: var(--fbm-fc-beep-mode);
	box-shadow: inset 0 0 0 1px var(--fbm-fc-beep-mode-soft);
}
.fbm-fc-compose-wrap[data-fc-mode="beep"] .fbm-fc-compose textarea:focus {
	outline: 1px solid var(--fbm-fc-beep-mode); border-color: var(--fbm-fc-beep-mode);
}
.fbm-fc-send {
	border: 1px solid rgba(212, 160, 23, 0.45); background: var(--fbm-fc-accent-soft);
	color: var(--fbm-fc-accent); border-radius: 6px; padding: 8px 12px; font: inherit; cursor: pointer;
}
.fbm-fc-compose-wrap[data-fc-mode="whisper"] .fbm-fc-send {
	border-color: rgba(155, 126, 217, 0.55); background: var(--fbm-fc-whisper-mode-soft);
	color: var(--fbm-fc-whisper-mode);
}
.fbm-fc-compose-wrap[data-fc-mode="beep"] .fbm-fc-send {
	border-color: rgba(61, 184, 160, 0.55); background: var(--fbm-fc-beep-mode-soft);
	color: var(--fbm-fc-beep-mode);
}
.fbm-fc-send:hover { filter: brightness(1.08); }
.fbm-fc-resize {
	position: absolute; right: 0; bottom: 0; width: 16px; height: 16px; cursor: nwse-resize;
	background: linear-gradient(135deg, transparent 50%, rgba(212, 160, 23, 0.45) 50%);
}
.fbm-fc-css {
	width: 100%; min-height: 120px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	font-size: 11px; background: var(--fbm-field); color: var(--fbm-text);
	border: 1px solid var(--fbm-border); border-radius: 6px; padding: 8px; resize: vertical;
}
`;

	FBM.injectStyles = function () {
		let el = document.getElementById("fbm-styles") as HTMLStyleElement | null;
		if (!el) {
			el = document.createElement("style");
			el.id = "fbm-styles";
			(document.head || document.documentElement).appendChild(el);
		}
		el.textContent = FBM.STYLES;
	};

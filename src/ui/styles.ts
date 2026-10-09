/** Freyas Better Maps — ui/styles.js */
import { FBM } from "../fbm";

FBM.STYLES = `
/* R132+ Club map editor is HTML (#chat-room-map-view-panel), not canvas DrawButton */
#chat-room-map-view-panel.fbm-panel-collapsed {
	display: none !important;
	pointer-events: none !important;
	visibility: hidden !important;
}
#fbm-root {
	--fbm-bg: #1a1c20;
	--fbm-surface: #24272e;
	--fbm-surface2: #2e323b;
	--fbm-border: rgba(255, 255, 255, 0.1);
	--fbm-text: #e8eaed;
	--fbm-muted: #9aa0a8;
	--fbm-accent: #d4a017;
	--fbm-accent-soft: rgba(212, 160, 23, 0.18);
	--fbm-danger: #e06c75;
	--fbm-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
	font-family: system-ui, -apple-system, Segoe UI, sans-serif;
	font-size: 13px;
	color: var(--fbm-text);
	pointer-events: none;
	z-index: 12000;
}
#fbm-root * { box-sizing: border-box; }
#fbm-root button, #fbm-root input, #fbm-root .fbm-panel, #fbm-root .fbm-panel *,
#fbm-root .fbm-build-bar, #fbm-root .fbm-build-bar *,
#fbm-root .fbm-templates, #fbm-root .fbm-templates * { pointer-events: auto; }
.fbm-panel {
	position: fixed; z-index: 120; top: 72px; right: 56px;
	width: min(440px, calc(100vw - 32px)); height: min(640px, calc(100vh - 96px));
	min-width: 320px; min-height: 360px; display: none; flex-direction: column;
	background: var(--fbm-bg); border: 1px solid var(--fbm-border); border-radius: 10px;
	box-shadow: var(--fbm-shadow); resize: both; overflow: hidden;
}
.fbm-panel.fbm-open { display: flex; }
.fbm-header {
	display: flex; align-items: center; justify-content: space-between; gap: 8px;
	padding: 10px 12px; background: var(--fbm-surface); border-bottom: 1px solid var(--fbm-border);
	cursor: grab; user-select: none;
}
.fbm-header:active { cursor: grabbing; }
.fbm-header-title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.fbm-badge {
	font-size: 11px; font-weight: 500; color: var(--fbm-accent);
	background: var(--fbm-accent-soft); padding: 2px 6px; border-radius: 4px;
}
.fbm-icon-btn {
	width: 32px; height: 32px; border: 1px solid var(--fbm-border); border-radius: 6px;
	background: var(--fbm-surface2); color: var(--fbm-text); display: grid; place-items: center; cursor: pointer;
}
.fbm-icon-btn:hover { border-color: var(--fbm-accent); }
.fbm-tabs {
	display: flex; gap: 4px; padding: 8px 10px 0; border-bottom: 1px solid var(--fbm-border);
}
.fbm-tab {
	border: 1px solid transparent; border-bottom: none; border-radius: 6px 6px 0 0;
	background: transparent; color: var(--fbm-muted); padding: 8px 12px; cursor: pointer;
}
.fbm-tab.fbm-on { background: var(--fbm-surface); color: var(--fbm-text); border-color: var(--fbm-border); }
.fbm-page { display: none; flex: 1; overflow: auto; padding: 14px 16px 20px; }
.fbm-page.fbm-on { display: block; }
.fbm-muted { color: var(--fbm-muted); }
.fbm-hint { font-size: 12px; line-height: 1.45; margin: 0 0 12px; }
.fbm-section { margin-top: 16px; }
.fbm-section-head { font-weight: 600; margin-bottom: 6px; }
.fbm-check-row { display: flex; align-items: flex-start; gap: 10px; margin: 10px 0; cursor: pointer; }
.fbm-check-row input { margin-top: 2px; }
.fbm-row { display: flex; gap: 8px; align-items: center; margin: 8px 0; }
.fbm-indent { margin-left: 1.6em; }
.fbm-row input[type="text"],
.fbm-row input[type="number"],
.fbm-row select {
	flex: 1; min-width: 0; background: var(--fbm-surface2); border: 1px solid var(--fbm-border);
	color: var(--fbm-text); border-radius: 6px; padding: 8px 10px;
}
.fbm-row select:disabled,
.fbm-row input:disabled { opacity: 0.45; }
.fbm-bar-sync {
	align-self: center; font-size: 11px; color: var(--fbm-muted); padding: 0 6px; white-space: nowrap;
}
.fbm-btn {
	border: 1px solid var(--fbm-border); background: var(--fbm-surface2); color: var(--fbm-text);
	border-radius: 6px; padding: 7px 12px; cursor: pointer;
}
.fbm-btn:hover { border-color: var(--fbm-accent); }
.fbm-btn:disabled { opacity: 0.45; cursor: default; }
.fbm-btn-accent { background: var(--fbm-accent-soft); border-color: var(--fbm-accent); color: var(--fbm-accent); }
.fbm-btn-danger { color: var(--fbm-danger); border-color: rgba(224, 108, 117, 0.45); }
.fbm-map-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.fbm-map-item {
	display: flex; align-items: center; gap: 8px; padding: 8px 10px;
	background: var(--fbm-surface); border: 1px solid var(--fbm-border); border-radius: 8px;
}
.fbm-map-item span { flex: 1; min-width: 0; }
.fbm-map-meta { font-size: 11px; color: var(--fbm-muted); }
.fbm-status { margin-top: 10px; font-size: 12px; color: var(--fbm-muted); min-height: 1.2em; }
.fbm-build-bar {
	position: fixed; z-index: 118; top: 12px; left: 25%; transform: translateX(-50%);
	display: none; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; padding: 8px;
	max-width: min(980px, 48vw);
	background: rgba(26, 28, 32, 0.92);
	border: 1px solid var(--fbm-border); border-radius: 10px; box-shadow: var(--fbm-shadow);
}
.fbm-build-bar.fbm-show { display: flex; }
.fbm-build-bar.fbm-bar-placed { transform: none; }
.fbm-build-bar .fbm-btn.fbm-on { background: var(--fbm-accent-soft); border-color: var(--fbm-accent); color: var(--fbm-accent); }
.fbm-bar-grip {
	display: inline-flex; align-items: center; justify-content: center;
	width: 18px; height: 32px; margin-right: 2px; cursor: grab; user-select: none;
	color: var(--fbm-muted); font-size: 12px; letter-spacing: -2px; line-height: 1;
}
.fbm-bar-grip:active { cursor: grabbing; }
.fbm-templates {
	position: fixed; z-index: 119; top: 64px; left: 25%; transform: translateX(-50%);
	width: min(560px, 48vw, calc(100vw - 24px)); max-height: min(420px, calc(100vh - 100px));
	overflow: auto; padding: 12px; background: var(--fbm-bg); border: 1px solid var(--fbm-border);
	border-radius: 10px; box-shadow: var(--fbm-shadow);
}
.fbm-templates[hidden] { display: none !important; }
.fbm-templates-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-weight: 600; }
.fbm-tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.fbm-tpl-card {
	position: relative; border: 1px solid var(--fbm-border); border-radius: 8px;
	background: var(--fbm-surface); padding: 8px; cursor: pointer; text-align: center;
}
.fbm-tpl-card:hover, .fbm-tpl-card.fbm-on { border-color: var(--fbm-accent); }
.fbm-tpl-thumb { width: 100%; aspect-ratio: 1; border-radius: 4px; background: #2a3038; margin-bottom: 6px; object-fit: cover; }
.fbm-tpl-size { font-size: 11px; color: var(--fbm-muted); }
.fbm-tpl-del {
	position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 4px;
	border: 1px solid rgba(224, 108, 117, 0.5); background: var(--fbm-surface2); color: var(--fbm-danger);
	font-size: 12px; line-height: 1; cursor: pointer;
}
.fbm-about-feats { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.fbm-about-feat {
	margin: 0; border: 1px solid var(--fbm-border); border-radius: 8px;
	background: var(--fbm-surface);
}
.fbm-about-feat > summary {
	cursor: pointer; padding: 9px 12px; font-weight: 600; list-style: none; user-select: none;
}
.fbm-about-feat > summary::-webkit-details-marker { display: none; }
.fbm-about-feat > summary::before {
	content: "▸"; display: inline-block; width: 1em; margin-right: 4px; opacity: 0.7;
}
.fbm-about-feat[open] > summary::before { content: "▾"; }
.fbm-about-feat-body { padding: 0 12px 10px; }
.fbm-about-desc { margin: 0 0 8px; font-size: 12px; line-height: 1.45; color: var(--fbm-muted); }
.fbm-about-label {
	margin: 0 0 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.03em;
	text-transform: uppercase; color: var(--fbm-accent);
}
.fbm-about-steps {
	margin: 0; padding-left: 1.2em; font-size: 12px; line-height: 1.5; color: var(--fbm-text);
}
.fbm-about-steps li { margin: 3px 0; }
`;

	FBM.injectStyles = function () {
		if (document.getElementById("fbm-styles")) return;
		const el = document.createElement("style");
		el.id = "fbm-styles";
		el.textContent = FBM.STYLES;
		(document.head || document.documentElement).appendChild(el);
	};

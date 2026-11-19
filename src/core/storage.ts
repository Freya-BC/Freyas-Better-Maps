/** Freyas Better Maps — core/storage.js */
import { FBM, type FBMSettings } from "../fbm";

function memberKey(suffix) {
	const n =
		typeof Player !== "undefined" && Player && Player.MemberNumber != null
			? Player.MemberNumber
			: "0";
	return FBM.EXTENSION_KEY + "_" + n + (suffix ? "_" + suffix : "");
}

function cloneDefaults(): FBMSettings {
	return JSON.parse(JSON.stringify(FBM.DEFAULT_SETTINGS || {})) as FBMSettings;
}

FBM.normalizeSettings = function (raw: unknown): FBMSettings {
	const d = cloneDefaults();
	const s = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
	const out = Object.assign({}, d, s);
	out.version = FBM.VERSION;
	out.typingIndicator = s.typingIndicator !== false;
	out.hideBuildToolbar = s.hideBuildToolbar !== false;
	out.buildingTools = s.buildingTools !== false;
	out.fullBlindfold = !!s.fullBlindfold;
	out.blindfoldOthersStyle =
		s.blindfoldOthersStyle === "silhouette" ? "silhouette" : "greyscale";
	out.hearingWhisper = !!s.hearingWhisper;
	out.fullZoomOut = !!s.fullZoomOut;
	out.hideRoomUpdateSpam = !!s.hideRoomUpdateSpam;
	{
		const cool = Number(s.roomUpdateHideCooldownMin);
		out.roomUpdateHideCooldownMin =
			isFinite(cool) && cool >= 1 ? Math.min(120, Math.floor(cool)) : d.roomUpdateHideCooldownMin || 5;
	}
	out.hideArrowKeys = !!s.hideArrowKeys;
	out.gridOn = !!s.gridOn;
	out.showInvisibleWalls = !!s.showInvisibleWalls;
	out.copyObjectSettings = s.copyObjectSettings !== false;
	out.placementGhost = s.placementGhost !== false;
	out.buildBarHotkey =
		typeof s.buildBarHotkey === "string" && s.buildBarHotkey.trim()
			? s.buildBarHotkey.trim()
			: d.buildBarHotkey || "Alt+B";
	out.ui = Object.assign({}, d.ui, s.ui && typeof s.ui === "object" ? s.ui : {});
	{
		const dfc = (d.floatChat || {}) as FBMSettings["floatChat"];
		const sfc =
			s.floatChat && typeof s.floatChat === "object"
				? (s.floatChat as Partial<FBMSettings["floatChat"]> & Record<string, unknown>)
				: ({} as Partial<FBMSettings["floatChat"]>);
		const styleRaw = String(sfc.style || dfc.style || "dark");
		const style: "dark" | "light" | "custom" =
			styleRaw === "light" || styleRaw === "custom" ? styleRaw : "dark";
		let fontSize = Number(sfc.fontSize != null ? sfc.fontSize : dfc.fontSize);
		if (!isFinite(fontSize) || fontSize < 11) fontSize = 13;
		if (fontSize > 18) fontSize = 18;
		let transparency = Number(
			sfc.transparency != null ? sfc.transparency : dfc.transparency != null ? dfc.transparency : 15
		);
		if (!isFinite(transparency)) transparency = 15;
		transparency = Math.max(0, Math.min(60, Math.round(transparency)));
		const trustedRaw = Array.isArray(sfc.trustedHosts)
			? sfc.trustedHosts
			: Array.isArray(dfc.trustedHosts)
				? dfc.trustedHosts
				: [];
		const trustedHosts: string[] = [];
		for (let i = 0; i < trustedRaw.length; i++) {
			const h = String(trustedRaw[i] || "").trim().replace(/\/$/, "");
			if (!h || trustedHosts.indexOf(h) >= 0) continue;
			try {
				const u = new URL(h.includes("://") ? h : "https://" + h);
				if (u.protocol === "http:" || u.protocol === "https:") {
					trustedHosts.push(u.origin);
				}
			} catch (e) {
				/* skip */
			}
		}
		const ownNamesRaw = Array.isArray(sfc.ownNames)
			? sfc.ownNames
			: Array.isArray(dfc.ownNames)
				? dfc.ownNames
				: [];
		const ownNames: string[] = [];
		for (let i = 0; i < ownNamesRaw.length; i++) {
			const n = String(ownNamesRaw[i] || "").trim();
			if (n && ownNames.indexOf(n) < 0) ownNames.push(n);
		}
		let ownColor = String(
			sfc.ownHighlightColor != null ? sfc.ownHighlightColor : dfc.ownHighlightColor || "#d4a017"
		).trim();
		if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(ownColor)) ownColor = "#d4a017";
		out.floatChat = {
			enabled: sfc.enabled !== false,
			autoshow: sfc.autoshow !== false,
			autoCloseOnJoin: !!sfc.autoCloseOnJoin,
			hotkey:
				typeof sfc.hotkey === "string" && String(sfc.hotkey).trim()
					? String(sfc.hotkey).trim()
					: dfc.hotkey || "Alt+C",
			hidden: !!sfc.hidden,
			style: style,
			fontSize: Math.floor(fontSize),
			transparency: transparency,
			fontFamily:
				typeof sfc.fontFamily === "string" && sfc.fontFamily.trim()
					? sfc.fontFamily
					: dfc.fontFamily || "system-ui, -apple-system, Segoe UI, sans-serif",
			customCss: typeof sfc.customCss === "string" ? sfc.customCss : dfc.customCss || "",
			trustedHosts: trustedHosts,
			highlightOwn: !!sfc.highlightOwn,
			ownNames: ownNames,
			ownHighlightSeidr: sfc.ownHighlightSeidr !== false,
			ownHighlightColor: ownColor,
			highlightOthers: !!sfc.highlightOthers,
			whisperAvatar: !!sfc.whisperAvatar,
			mapCompass: !!sfc.mapCompass,
			confirmLeave: !!sfc.confirmLeave,
			oocProtection: sfc.oocProtection !== false,
			membersHeightPct: (function () {
				const n = Number(sfc.membersHeightPct != null ? sfc.membersHeightPct : dfc.membersHeightPct);
				if (!isFinite(n)) return 30;
				return Math.max(15, Math.min(70, Math.round(n)));
			})(),
			ui: Object.assign(
				{
					left: null as number | null,
					top: null as number | null,
					width: 380,
					height: 480,
				},
				dfc.ui || {},
				sfc.ui && typeof sfc.ui === "object" ? sfc.ui : {}
			),
		};
	}
	out.maps = Array.isArray(s.maps) ? s.maps.slice(0, FBM.MAP_MAX || 10) : [];
	out.autosave = s.autosave && typeof s.autosave === "object" ? s.autosave : null;
	out.dismissedChangelogId =
		typeof s.dismissedChangelogId === "string" ? s.dismissedChangelogId : d.dismissedChangelogId || "";
	return out;
};

/*
 * Persistence layout (server-load diet, see docs/OPTIMIZATION.md)
 *
 *   ExtensionSettings.FreyasBetterMaps      toggles + float-chat prefs (marker migrated:2)
 *   ExtensionSettings.FreyasBetterMapsMaps  named maps (older ones become stubs over the byte cap)
 *   localStorage  <key>_<member>_ui         panel / float-chat geometry, float hidden flag,
 *                                           members split %, dismissed changelog id
 *   localStorage  <key>_<member>_autosave   map autosave (never uploaded)
 *   localStorage  <key>_<member>_settings   copy of the synced settings part (offline fallback)
 *   localStorage  <key>_<member>_maps       full copy of the maps (overflow / fallback)
 *
 * FBM.settings in memory keeps its old shape (maps, autosave, ui ... all inside).
 * Uploads are debounced, deduped against the last value sent, and flushed on room leave / unload.
 */

interface FbmParts {
	settings: Record<string, unknown>;
	maps: unknown[];
	ui: Record<string, unknown>;
	autosave: unknown;
}

const memo: Record<string, string> = {};
const pending: Record<string, boolean> = {};
const sent: Record<string, string> = {};
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function keySettings(): string {
	return FBM.EXTENSION_KEY;
}

function keyMaps(): string {
	return FBM.EXTENSION_KEY_MAPS || FBM.EXTENSION_KEY + "Maps";
}

function esBag(): Record<string, string> | null {
	if (typeof Player === "undefined" || !Player) return null;
	if (!Player.ExtensionSettings) Player.ExtensionSettings = {};
	return Player.ExtensionSettings as unknown as Record<string, string>;
}

function lsRead(suffix: string): any {
	try {
		const raw = localStorage.getItem(memberKey(suffix));
		return raw ? FBM.lzReadLocal(raw) : null;
	} catch (e) {
		return null;
	}
}

function lsWrite(suffix: string, value: string) {
	try {
		localStorage.setItem(memberKey(suffix), value);
	} catch (e) {
		console.warn("[FBM] localStorage save " + suffix, e);
	}
}

function lsRemove(suffix: string) {
	try {
		localStorage.removeItem(memberKey(suffix));
	} catch (e) {
		/* ignore */
	}
}

/** Split the in-memory settings into what is synced and what stays on this device. */
function splitSettings(s: FBMSettings): FbmParts {
	const fc = (s.floatChat || {}) as FBMSettings["floatChat"];
	const synced: Record<string, unknown> = Object.assign({}, s);
	delete synced.ui;
	delete synced.maps;
	delete synced.autosave;
	delete synced.dismissedChangelogId;
	const fcSynced: Record<string, unknown> = Object.assign({}, fc);
	delete fcSynced.ui;
	delete fcSynced.hidden;
	delete fcSynced.membersHeightPct;
	synced.floatChat = fcSynced;
	synced.migrated = 2;
	return {
		settings: synced,
		maps: Array.isArray(s.maps) ? s.maps : [],
		ui: {
			ui: s.ui,
			floatUi: fc.ui,
			floatHidden: !!fc.hidden,
			membersHeightPct: fc.membersHeightPct,
			dismissedChangelogId: s.dismissedChangelogId,
		},
		autosave: s.autosave || null,
	};
}

/** Pack the maps; when over the byte cap, the oldest maps are reduced to stubs until it fits. */
function packMaps(maps: unknown[]): string {
	const cap = FBM.ES_MAPS_MAX_BYTES || 150000;
	const list = maps.slice();
	let packed: string = FBM.lzPackSync({ migrated: 2, maps: list });
	for (let i = list.length - 1; i >= 0 && packed.length > cap; i--) {
		const m = list[i] as Record<string, unknown> | null;
		if (!m || m.overflow) continue;
		list[i] = { id: m.id, name: m.name, savedAt: m.savedAt, overflow: true };
		packed = FBM.lzPackSync({ migrated: 2, maps: list });
	}
	return packed;
}

/** Local full copy of the maps: keep full entries when memory only holds stubs for an id. */
function mergeLocalMaps(maps: unknown[]): unknown[] {
	const existing = lsRead("maps");
	const byId: Record<string, unknown> = {};
	if (existing && Array.isArray(existing.maps)) {
		existing.maps.forEach(function (m: any) {
			if (m && m.id && !m.overflow) byId[m.id] = m;
		});
	}
	return maps.map(function (m: any) {
		return m && m.overflow && byId[m.id] ? byId[m.id] : m;
	});
}

function scheduleFlush() {
	if (flushTimer != null) return;
	flushTimer = setTimeout(function () {
		flushTimer = null;
		FBM.flushSettings();
	}, FBM.ES_FLUSH_MS || 1500);
}

/** Upload keys whose value changed since the last upload (no-op when nothing is pending). */
FBM.flushSettings = function () {
	if (flushTimer != null) {
		clearTimeout(flushTimer);
		flushTimer = null;
	}
	const es = esBag();
	if (!es) return false;
	let any = false;
	[keySettings(), keyMaps()].forEach(function (key) {
		if (!pending[key]) return;
		pending[key] = false;
		const value = es[key];
		if (typeof value !== "string" || value === sent[key]) return;
		if (typeof ServerPlayerExtensionSettingsSync === "function") {
			ServerPlayerExtensionSettingsSync(key);
			sent[key] = value;
			any = true;
		}
	});
	return any;
};

FBM.installStorageFlush = function () {
	if (FBM._storageFlushInstalled) return;
	FBM._storageFlushInstalled = true;
	FBM.tryHook("settingsFlushLeave", "ChatRoomLeave", 0, function (args: unknown[], next: (a: unknown[]) => unknown) {
		try {
			FBM.flushSettings();
		} catch (e) {
			/* ignore */
		}
		return next(args);
	});
	const flush = function () {
		try {
			FBM.flushSettings();
		} catch (e) {
			/* ignore */
		}
	};
	window.addEventListener("beforeunload", flush);
	window.addEventListener("pagehide", flush);
};

/** Reset cached state (tests / account switch). */
FBM.resetStorageState = function () {
	Object.keys(memo).forEach(function (k) { delete memo[k]; });
	Object.keys(pending).forEach(function (k) { delete pending[k]; });
	Object.keys(sent).forEach(function (k) { delete sent[k]; });
	if (flushTimer != null) {
		clearTimeout(flushTimer);
		flushTimer = null;
	}
};

FBM.loadSettings = function () {
	const es = esBag();
	let main: any = null;
	if (es && es[keySettings()]) main = FBM.lzReadLocal(es[keySettings()]);
	if (!main) main = lsRead("settings");
	/* Old builds stored everything (maps, autosave, geometry) in one blob without the marker. */
	const legacy = !!main && main.migrated !== 2;
	const out: Record<string, any> = Object.assign({}, main || {});
	if (!legacy) {
		let mapsObj: any = es && es[keyMaps()] ? FBM.lzReadLocal(es[keyMaps()]) : null;
		if (!mapsObj) mapsObj = lsRead("maps");
		out.maps = mapsObj && Array.isArray(mapsObj.maps) ? mapsObj.maps : [];
		const auto = lsRead("autosave");
		out.autosave = auto && auto.data ? auto : null;
		const ui = lsRead("ui");
		if (ui) {
			if (ui.ui && typeof ui.ui === "object") out.ui = ui.ui;
			out.floatChat = Object.assign({}, out.floatChat || {});
			if (ui.floatUi && typeof ui.floatUi === "object") out.floatChat.ui = ui.floatUi;
			if (ui.floatHidden != null) out.floatChat.hidden = !!ui.floatHidden;
			if (ui.membersHeightPct != null) out.floatChat.membersHeightPct = ui.membersHeightPct;
			if (typeof ui.dismissedChangelogId === "string") out.dismissedChangelogId = ui.dismissedChangelogId;
		}
	}
	FBM.settings = FBM.normalizeSettings(out);
	if (es) {
		if (typeof es[keySettings()] === "string") sent[keySettings()] = es[keySettings()];
		if (typeof es[keyMaps()] === "string") sent[keyMaps()] = es[keyMaps()];
	}
	if (legacy) {
		/* One-time split: maps -> own key, autosave/geometry -> localStorage, then upload once. */
		try {
			FBM.loadMapOverflow();
		} catch (e) {
			/* ignore */
		}
		FBM.saveSettings();
		FBM.flushSettings();
	}
	return FBM.settings;
};

FBM.saveSettings = function () {
	if (!FBM.settings) FBM.loadSettings();
	FBM.settings.version = FBM.VERSION;
	const parts = splitSettings(FBM.settings);
	const es = esBag();

	/* Device-local state (no server traffic). */
	const uiJson = JSON.stringify(parts.ui);
	if (memo.ui !== uiJson) {
		memo.ui = uiJson;
		lsWrite("ui", FBM.lzPackLocal(parts.ui));
	}
	const autoJson = JSON.stringify(parts.autosave);
	if (memo.autosave !== autoJson) {
		memo.autosave = autoJson;
		if (parts.autosave) lsWrite("autosave", FBM.lzPackLocal(parts.autosave));
		else lsRemove("autosave");
	}

	/* Synced settings part. */
	const setJson = JSON.stringify(parts.settings);
	if (memo.settings !== setJson) {
		memo.settings = setJson;
		const packed = FBM.lzPackSync(parts.settings);
		lsWrite("settings", packed);
		if (es) {
			es[keySettings()] = packed;
			pending[keySettings()] = true;
		}
	}

	/* Synced maps part (own key). */
	const mapsJson = JSON.stringify(parts.maps);
	if (memo.maps !== mapsJson) {
		memo.maps = mapsJson;
		lsWrite("maps", FBM.lzPackLocal({ maps: mergeLocalMaps(parts.maps) }));
		if (es && (parts.maps.length || es[keyMaps()])) {
			es[keyMaps()] = packMaps(parts.maps);
			pending[keyMaps()] = true;
		}
	}

	if (pending[keySettings()] || pending[keyMaps()]) scheduleFlush();
	return FBM.settings;
};

FBM.loadMapOverflow = function () {
	try {
		const data = lsRead("maps");
		if (!data) return;
		if (Array.isArray(data.maps) && FBM.settings) {
			const byId: Record<string, any> = {};
			data.maps.forEach(function (m: any) {
				if (m && m.id) byId[m.id] = m;
			});
			FBM.settings.maps = (FBM.settings.maps || []).map(function (m: any) {
				if (m && m.overflow && byId[m.id] && !byId[m.id].overflow) return byId[m.id];
				return m;
			});
			if ((!FBM.settings.maps.length || FBM.settings.maps.every(function (m: any) { return m.overflow; })) && data.maps.length) {
				FBM.settings.maps = data.maps.slice(0, FBM.MAP_MAX || 10);
			}
		}
		/* Autosave from the old overflow file (pre-split builds). */
		if (data.autosave && FBM.settings && (!FBM.settings.autosave || FBM.settings.autosave.overflow)) {
			FBM.settings.autosave = data.autosave;
		}
	} catch (e) {
		/* ignore */
	}
};

FBM.templatesKey = function () {
	return memberKey("templates");
};

FBM.loadTemplates = function () {
	try {
		const raw = localStorage.getItem(FBM.templatesKey());
		const data = raw ? FBM.lzReadLocal(raw) : null;
		FBM.templates = Array.isArray(data) ? data : Array.isArray(data && data.templates) ? data.templates : [];
	} catch (e) {
		FBM.templates = [];
	}
	return FBM.templates;
};

FBM.saveTemplates = function () {
	try {
		localStorage.setItem(FBM.templatesKey(), FBM.lzPackLocal({ templates: FBM.templates || [] }));
	} catch (e) {
		console.warn("[FBM] templates save", e);
	}
};

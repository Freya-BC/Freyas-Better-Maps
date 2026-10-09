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
	out.gridOn = !!s.gridOn;
	out.buildBarHotkey =
		typeof s.buildBarHotkey === "string" && s.buildBarHotkey.trim()
			? s.buildBarHotkey.trim()
			: d.buildBarHotkey || "Alt+B";
	out.ui = Object.assign({}, d.ui, s.ui && typeof s.ui === "object" ? s.ui : {});
	out.maps = Array.isArray(s.maps) ? s.maps.slice(0, FBM.MAP_MAX || 10) : [];
	out.autosave = s.autosave && typeof s.autosave === "object" ? s.autosave : null;
	return out;
};

FBM.loadSettings = function () {
	let loaded = null;
	if (Player && Player.ExtensionSettings && Player.ExtensionSettings[FBM.EXTENSION_KEY]) {
		loaded = FBM.lzReadLocal(Player.ExtensionSettings[FBM.EXTENSION_KEY]);
	}
	if (!loaded) {
		try {
			const raw = localStorage.getItem(memberKey("settings"));
			if (raw) loaded = FBM.lzReadLocal(raw);
		} catch (e) {
			/* ignore */
		}
	}
	FBM.settings = FBM.normalizeSettings(loaded);
	return FBM.settings;
};

FBM.saveSettings = function () {
	if (!FBM.settings) FBM.loadSettings();
	FBM.settings.version = FBM.VERSION;
	const packed = FBM.lzPackLocal(FBM.settings);
	try {
		localStorage.setItem(memberKey("settings"), packed);
	} catch (e) {
		console.warn("[FBM] localStorage save", e);
	}
	if (typeof Player !== "undefined" && Player) {
		if (!Player.ExtensionSettings) Player.ExtensionSettings = {};
		let esPayload = packed;
		const soft = FBM.ES_SOFT_MAX || 90000;
		if (typeof esPayload === "string" && esPayload.length > soft) {
			const slim = Object.assign({}, FBM.settings, {
				maps: (FBM.settings.maps || []).map(function (m) {
					return { id: m.id, name: m.name, savedAt: m.savedAt, overflow: true };
				}),
				autosave: FBM.settings.autosave
					? { savedAt: FBM.settings.autosave.savedAt, overflow: true }
					: null,
			});
			esPayload = FBM.lzPackLocal(slim);
			try {
				localStorage.setItem(memberKey("maps"), FBM.lzPackLocal({
					maps: FBM.settings.maps,
					autosave: FBM.settings.autosave,
				}));
			} catch (e2) {
				console.warn("[FBM] map overflow save", e2);
			}
		}
		Player.ExtensionSettings[FBM.EXTENSION_KEY] = esPayload;
		if (typeof ServerPlayerExtensionSettingsSync === "function") {
			ServerPlayerExtensionSettingsSync(FBM.EXTENSION_KEY);
		}
	}
	return FBM.settings;
};

FBM.loadMapOverflow = function () {
	try {
		const raw = localStorage.getItem(memberKey("maps"));
		const data = raw ? FBM.lzReadLocal(raw) : null;
		if (!data) return;
		if (Array.isArray(data.maps) && FBM.settings) {
			const byId = {};
			data.maps.forEach(function (m) {
				if (m && m.id) byId[m.id] = m;
			});
			FBM.settings.maps = (FBM.settings.maps || []).map(function (m) {
				if (m && m.overflow && byId[m.id]) return byId[m.id];
				return m;
			});
			if ((!FBM.settings.maps.length || FBM.settings.maps.every(function (m) { return m.overflow; })) && data.maps.length) {
				FBM.settings.maps = data.maps.slice(0, FBM.MAP_MAX || 10);
			}
		}
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

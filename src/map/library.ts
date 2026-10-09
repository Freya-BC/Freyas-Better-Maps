/** Freyas Better Maps — map/library.js */
import { FBM } from "../fbm";

FBM._mapDirty = false;
FBM._autosaveTimer = null;
FBM._lastAutosaveAt = 0;

function newId() {
	return "m" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
}

FBM.exportCurrentMap = function () {
	if (!FBM.mapIsMapRoom()) return null;
	if (
		typeof ChatRoomMapManager !== "undefined" &&
		ChatRoomMapManager &&
		ChatRoomMapManager.Map &&
		typeof ChatRoomMapManager.Map.exportString === "function"
	) {
		return ChatRoomMapManager.Map.exportString();
	}
	return null;
};

FBM.importMapString = function (mapString) {
	if (typeof mapString !== "string" || !mapString.length) {
		FBM.localMsg("FBM: nothing to paste.");
		return false;
	}
	if (!FBM.mapIsAdmin()) {
		FBM.localMsg("FBM: admin required to load a map.");
		return false;
	}
	if (!ChatRoomMapManager || !ChatRoomMapManager.Map || typeof ChatRoomMapManager.Map.importString !== "function") {
		FBM.localMsg("FBM: map import unavailable.");
		return false;
	}
	let backup = null;
	try {
		if (ChatRoomData && ChatRoomData.MapData) {
			backup =
				typeof CommonCloneDeep === "function"
					? CommonCloneDeep(ChatRoomData.MapData)
					: JSON.parse(JSON.stringify(ChatRoomData.MapData));
		}
	} catch (e) {
		backup = null;
	}
	if (!ChatRoomMapManager.Map.importString(mapString)) {
		FBM.localMsg("FBM: map paste failed.");
		return false;
	}
	FBM.pushMapRoomSync({ backup: backup });
	FBM.localMsg("FBM: map loaded.");
	return true;
};

FBM.saveNamedMap = function (name) {
	const data = FBM.exportCurrentMap();
	if (!data) {
		FBM.localMsg("FBM: no map to save.");
		return null;
	}
	const s = FBM.mapBag();
	const entry = {
		id: newId(),
		name: String(name || "Untitled").trim().slice(0, 48) || "Untitled",
		data: data,
		savedAt: Date.now(),
	};
	s.maps = Array.isArray(s.maps) ? s.maps : [];
	s.maps.unshift(entry);
	while (s.maps.length > (FBM.MAP_MAX || 10)) s.maps.pop();
	FBM.saveSettings();
	FBM.localMsg("FBM: saved “" + entry.name + "”.");
	return entry;
};

FBM.deleteNamedMap = function (id) {
	const s = FBM.mapBag();
	s.maps = (s.maps || []).filter(function (m) {
		return m && m.id !== id;
	});
	FBM.saveSettings();
};

FBM.loadNamedMap = function (id) {
	FBM.loadMapOverflow();
	const s = FBM.mapBag();
	const entry = (s.maps || []).find(function (m) {
		return m && m.id === id;
	});
	if (!entry || !entry.data) {
		FBM.localMsg("FBM: map not found (overflow?).");
		return false;
	}
	return FBM.importMapString(entry.data);
};

FBM.loadAutosave = function () {
	FBM.loadMapOverflow();
	const s = FBM.mapBag();
	if (!s.autosave || !s.autosave.data) {
		FBM.localMsg("FBM: autosave empty.");
		return false;
	}
	return FBM.importMapString(s.autosave.data);
};

FBM.markMapDirty = function () {
	if (!FBM.mapIsAdmin()) return;
	FBM._mapDirty = true;
	FBM.scheduleAutosave();
};

FBM.scheduleAutosave = function () {
	if (FBM._autosaveTimer) return;
	const cool = FBM.AUTOSAVE_COOLDOWN_MS || 60000;
	const wait = Math.max(0, cool - (Date.now() - (FBM._lastAutosaveAt || 0)));
	FBM._autosaveTimer = setTimeout(function () {
		FBM._autosaveTimer = null;
		FBM.runAutosave();
	}, wait || 0);
};

FBM.runAutosave = function () {
	if (!FBM._mapDirty) return;
	if (!FBM.mapIsMapRoom() || !FBM.mapIsAdmin()) return;
	const data = FBM.exportCurrentMap();
	if (!data) return;
	const s = FBM.mapBag();
	s.autosave = { data: data, savedAt: Date.now() };
	FBM._mapDirty = false;
	FBM._lastAutosaveAt = Date.now();
	FBM.saveSettings();
	if (FBM.refreshSettingsUi) FBM.refreshSettingsUi();
};

/** Freyas Better Maps — map/sync.js */
import { FBM } from "../fbm";

FBM._roomUpdateLastKey = "";
FBM._roomUpdateLastAt = 0;
FBM._roomSyncSavedAt = null;
FBM._roomUpdateHandlerInstalled = false;

FBM.formatSyncTime = function (ts) {
	try {
		const d = new Date(ts || Date.now());
		const pad = function (n) {
			return (n < 10 ? "0" : "") + n;
		};
		return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
	} catch (e) {
		return "";
	}
};

FBM.noteRoomSyncSaved = function (ts) {
	FBM._roomSyncSavedAt = ts != null ? Number(ts) : Date.now();
	if (FBM.refreshBuildBar) FBM.refreshBuildBar();
};

function mapApi() {
	if (typeof MapManager !== "undefined" && MapManager && MapManager.Map) return MapManager.Map;
	if (typeof ChatRoomMapManager !== "undefined" && ChatRoomMapManager && ChatRoomMapManager.Map) {
		return ChatRoomMapManager.Map;
	}
	return null;
}

/**
 * After local MapData mutation: undo backup (legacy), perception, schedule room Update.
 *
 * opts.viaMapManager — caller already mutated through MapManager; call updateGlobalMapData
 * (new BC) which validates, encodes CellData/ObjectSettings, and schedules the room Update.
 * opts.skipUpdate — MapManager already called updateGlobalMapData (e.g. importString).
 * opts.backup — optional deep clone for ChatRoomMapViewEditBackup (legacy undo).
 */
FBM.pushMapRoomSync = function (opts) {
	opts = opts || {};
	const backup = opts.backup;
	if (backup && typeof ChatRoomMapViewEditBackup !== "undefined" && ChatRoomMapViewEditBackup) {
		if (JSON.stringify(backup) !== JSON.stringify(ChatRoomData && ChatRoomData.MapData)) {
			if (ChatRoomMapViewEditBackup.length > 100) {
				ChatRoomMapViewEditBackup = ChatRoomMapViewEditBackup.slice(-100);
			}
			ChatRoomMapViewEditBackup.push(backup);
		}
	}

	let synced = false;
	const map = mapApi();

	if (!opts.skipUpdate && opts.viaMapManager && map && typeof map.updateGlobalMapData === "function") {
		try {
			synced = !!map.updateGlobalMapData();
		} catch (e) {
			synced = false;
		}
	} else if (!opts.skipUpdate) {
		/* Legacy Club: UpdateFlag + UpdateRoomSync. No-ops on upcoming BC. */
		if (typeof ChatRoomMapViewUpdateFlag === "function") ChatRoomMapViewUpdateFlag();
		if (typeof ChatRoomMapViewUpdateRoomNext !== "undefined") {
			ChatRoomMapViewUpdateRoomNext = typeof CommonTime === "function" ? CommonTime() : 0;
		}
		if (typeof ChatRoomMapViewCalculatePerceptionMasks === "function") {
			ChatRoomMapViewCalculatePerceptionMasks();
		} else if (map && typeof map.updatePlayerPerception === "function") {
			map.updatePlayerPerception();
		}
		if (typeof ChatRoomMapViewUpdateRoomSync === "function") {
			ChatRoomMapViewUpdateRoomSync();
			synced = true;
		}
		if (
			!synced &&
			typeof ChatRoomMapViewScheduleMapUpdate === "function" &&
			map &&
			typeof map.updateGlobalMapData === "function"
		) {
			/* Mutated ChatRoomData.MapData directly — reload MapManager then schedule. */
			if (typeof MapManager !== "undefined" && MapManager && typeof MapManager.OnMapDataUpdated === "function") {
				MapManager.OnMapDataUpdated();
			} else if (typeof map.loadGlobalMapData === "function" && ChatRoomData && ChatRoomData.MapData) {
				map.loadGlobalMapData(ChatRoomData.MapData);
			}
			try {
				synced = !!map.updateGlobalMapData();
			} catch (e) {
				ChatRoomMapViewScheduleMapUpdate();
				synced = true;
			}
		}
	} else {
		synced = true;
		if (map && typeof map.updatePlayerPerception === "function") {
			map.updatePlayerPerception();
		} else if (typeof ChatRoomMapViewCalculatePerceptionMasks === "function") {
			ChatRoomMapViewCalculatePerceptionMasks();
		}
	}

	if (synced) FBM.noteRoomSyncSaved(Date.now());
	FBM.markMapDirty();
};

FBM.installRoomUpdateHide = function () {
	if (FBM._roomUpdateHandlerInstalled) return true;
	if (typeof ChatRoomRegisterMessageHandler !== "function") return false;
	ChatRoomRegisterMessageHandler({
		Description: "FBM hide duplicate ServerUpdateRoom",
		Priority: 100,
		Callback: function (data, sender, msg) {
			const m = FBM.mapBag ? FBM.mapBag() : FBM.settings;
			if (!m || !m.hideRoomUpdateSpam) return false;
			if (!data || data.Type !== "Action" || data.Content !== "ServerUpdateRoom") return false;
			const key = String(msg || "");
			const now = Date.now();
			let coolMin = Number(m.roomUpdateHideCooldownMin);
			if (!isFinite(coolMin) || coolMin < 1) coolMin = 5;
			if (coolMin > 120) coolMin = 120;
			const coolMs = coolMin * 60 * 1000;
			if (key && key === FBM._roomUpdateLastKey && now - FBM._roomUpdateLastAt < coolMs) {
				if (
					sender &&
					Player &&
					(sender === Player ||
						(typeof sender.IsPlayer === "function" && sender.IsPlayer()) ||
						sender.MemberNumber === Player.MemberNumber)
				) {
					FBM.noteRoomSyncSaved(now);
				}
				return true;
			}
			FBM._roomUpdateLastKey = key;
			FBM._roomUpdateLastAt = now;
			if (
				sender &&
				Player &&
				(sender === Player ||
					(typeof sender.IsPlayer === "function" && sender.IsPlayer()) ||
					sender.MemberNumber === Player.MemberNumber)
			) {
				FBM.noteRoomSyncSaved(now);
			}
			return false;
		},
	});
	FBM._roomUpdateHandlerInstalled = true;
	return true;
};

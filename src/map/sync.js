/**
 * Freyas Better Maps — push map edits to Club room sync + room-update spam hide
 */
(function (FBM) {
	"use strict";

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

	/**
	 * After local MapData mutation: undo backup, perception, schedule immediate room Update.
	 */
	FBM.pushMapRoomSync = function (opts) {
		opts = opts || {};
		const backup = opts.backup;
		try {
			if (backup && typeof ChatRoomMapViewEditBackup !== "undefined" && ChatRoomMapViewEditBackup) {
				if (JSON.stringify(backup) !== JSON.stringify(ChatRoomData && ChatRoomData.MapData)) {
					if (ChatRoomMapViewEditBackup.length > 100) {
						ChatRoomMapViewEditBackup = ChatRoomMapViewEditBackup.slice(-100);
					}
					ChatRoomMapViewEditBackup.push(backup);
				}
			}
		} catch (e) {
			/* ignore */
		}
		try {
			if (typeof ChatRoomMapViewUpdateFlag === "function") ChatRoomMapViewUpdateFlag();
		} catch (e) {
			/* ignore */
		}
		try {
			if (typeof ChatRoomMapViewUpdateRoomNext !== "undefined") {
				ChatRoomMapViewUpdateRoomNext = typeof CommonTime === "function" ? CommonTime() : 0;
			}
		} catch (e) {
			/* ignore */
		}
		try {
			if (typeof ChatRoomMapViewCalculatePerceptionMasks === "function") {
				ChatRoomMapViewCalculatePerceptionMasks();
			}
		} catch (e) {
			/* ignore */
		}
		let synced = false;
		try {
			if (typeof ChatRoomMapViewUpdateRoomSync === "function") {
				ChatRoomMapViewUpdateRoomSync();
				synced = true;
			}
		} catch (e) {
			/* ignore */
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
})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

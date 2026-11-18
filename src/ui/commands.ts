/** Freyas Better Maps — chat commands (/fbm, /build) */
import { FBM } from "../fbm";

FBM.registerChatCommands = function () {
	if (FBM._commandsRegistered) return;
	if (typeof CommandCombine !== "function") return;
	FBM._commandsRegistered = true;
	try {
		CommandCombine([
			{
				Tag: "fbm",
				Description: "[FBM] Open the Freyas Better Maps build bar (room admin)",
				Action: function () {
					if (!FBM.mapIsAdmin || !FBM.mapIsAdmin()) {
						if (FBM.localMsg) FBM.localMsg("FBM: room admin required.");
						return;
					}
					FBM.ensureUi();
					const m = FBM.mapBag && FBM.mapBag();
					if (m && !m.buildingTools) {
						if (FBM.localMsg) FBM.localMsg("FBM: enable Building tools in Settings first.");
						return;
					}
					FBM.setBuildBarOpen(true);
					if (!FBM.buildBarShouldShow || !FBM.buildBarShouldShow()) {
						if (FBM.localMsg) FBM.localMsg("FBM: open a map room to use the build bar.");
					}
				},
			},
			{
				Tag: "build",
				Description: "[FBM] Open Objects Build catalog (room admin)",
				Action: function () {
					if (!FBM.mapIsAdmin || !FBM.mapIsAdmin()) {
						if (FBM.localMsg) FBM.localMsg("FBM: room admin required.");
						return;
					}
					FBM.ensureUi();
					if (FBM.openObjectsBuild) FBM.openObjectsBuild();
				},
			},
			{
				Tag: "chat",
				Description: "[FBM] Toggle Floatable Chat panel",
				Action: function () {
					FBM.ensureUi();
					const cfg = FBM.settings && FBM.settings.floatChat;
					if (cfg && cfg.enabled === false) {
						cfg.enabled = true;
						FBM.saveSettings();
					}
					if (FBM.toggleFloatChat) FBM.toggleFloatChat();
				},
			},
		]);
	} catch (e) {
		FBM._commandsRegistered = false;
		console.warn("[FBM] CommandCombine failed", e);
	}
};

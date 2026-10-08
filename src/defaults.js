/**
 * Freyas Better Maps — defaults / constants
 */
(function (FBM) {
	"use strict";

	FBM.VERSION = "0.1.34";
	FBM.FULL_NAME = "Freyas Better Maps";
	FBM.EXTENSION_KEY = "FreyasBetterMaps";
	FBM.BOOKMARK_GIST_ID = "4eabb4efd75be5de6602bb0a31d5479b";
	FBM.REPO_URL = "";
	FBM.RAW_SCRIPT_URL = "";
	FBM.RAW_LOADER_URL = "";

	FBM.LZ_PREFIX = "FBMLz1:";
	FBM.LZ_FORMAT = "FBMLz";
	FBM.LZ_MIN = 800;
	FBM.MAP_MAX = 10;
	FBM.AUTOSAVE_COOLDOWN_MS = 60000;
	FBM.ES_SOFT_MAX = 90000;

	FBM.MAP_TALK_W = 40;
	FBM.MAP_TALK_H = 24;
	FBM.MAP_TALK_REF_SPAN = 3;
	FBM.MAP_TALK_MIN_W = 8;
	FBM.MAP_TALK_MIN_H = 5;

	FBM.ZOOM_DEFAULT_MAX = 7;
	FBM.ZOOM_SUPER_MAX = 50;

	try {
		window.FBM = FBM;
	} catch (e) {
		/* ignore */
	}

	FBM.DEFAULT_SETTINGS = {
		version: FBM.VERSION,
		typingIndicator: true,
		hideBuildToolbar: true,
		buildingTools: true,
		fullBlindfold: false,
		blindfoldOthersStyle: "greyscale",
		hearingWhisper: false,
		fullZoomOut: false,
		hideRoomUpdateSpam: false,
		roomUpdateHideCooldownMin: 5,
		gridOn: false,
		buildBarHotkey: "Alt+B",
		ui: {
			left: null,
			top: null,
			width: 440,
			height: 640,
		},
		maps: [],
		autosave: null,
	};
})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

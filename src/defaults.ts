/** Freyas Better Maps — defaults.js */
import { FBM } from "./fbm";

FBM.VERSION = "1.0.2";
FBM.FULL_NAME = "Freyas Better Maps";
FBM.EXTENSION_KEY = "FreyasBetterMaps";
/** Named maps live in their own synced key so settings changes never re-upload them. */
FBM.EXTENSION_KEY_MAPS = "FreyasBetterMapsMaps";
FBM.BOOKMARK_GIST_ID = "4eabb4efd75be5de6602bb0a31d5479b";
FBM.REPO_URL = "https://github.com/Freya-BC/Freyas-Better-Maps";
FBM.RAW_SCRIPT_URL = "https://freya-bc.github.io/Freyas-Better-Maps/freyas-better-maps.js";
FBM.RAW_LOADER_URL = "https://freya-bc.github.io/Freyas-Better-Maps/loader.js";
/** Player docs on GitHub Pages (changelog modal + About). */
FBM.DOCS_URL = "https://freya-bc.github.io/Freyas-Better-Maps/";
/**
 * Bump this when shipping a new “what’s new” notice. Users who dismissed an older
 * id will see the banner again for the new id.
 */
FBM.CHANGELOG_ID = "r134-major";

FBM.LZ_PREFIX = "FBMLz1:";
FBM.LZ_FORMAT = "FBMLz";
FBM.LZ_MIN = 800;
FBM.MAP_MAX = 10;
FBM.AUTOSAVE_COOLDOWN_MS = 60000;
/** Max stored bytes (Base64 chars) of the synced maps value; older maps become stubs (overflow) beyond it. */
FBM.ES_MAPS_MAX_BYTES = 150000;
/** Debounce before changed ExtensionSettings keys are uploaded (ms). */
FBM.ES_FLUSH_MS = 1500;
FBM.LZ_PREFIX_B64 = "FBMLz2:";

FBM.MAP_TALK_W = 40;
FBM.MAP_TALK_H = 24;
FBM.MAP_TALK_REF_SPAN = 3;
FBM.MAP_TALK_MIN_W = 8;
FBM.MAP_TALK_MIN_H = 5;

FBM.ZOOM_DEFAULT_MAX = 7;
FBM.ZOOM_SUPER_MAX = 50;

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
	hideArrowKeys: false,
	gridOn: false,
	showInvisibleWalls: false,
	copyObjectSettings: true,
	buildBarHotkey: "Alt+B",
	ui: {
		left: null,
		top: null,
		width: 440,
		height: 640,
	},
	floatChat: {
		enabled: true,
		autoshow: true,
		autoCloseOnJoin: false,
		hotkey: "Alt+C",
		hidden: false,
		style: "dark",
		fontSize: 13,
		/** 0 = solid (~opaque), 60 = very translucent. Default mild glass. */
		transparency: 15,
		fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
		customCss: "",
		trustedHosts: [],
		highlightOwn: false,
		ownNames: [],
		ownHighlightSeidr: true,
		ownHighlightColor: "#d4a017",
		highlightOthers: false,
		whisperAvatar: false,
		mapCompass: false,
		confirmLeave: false,
		oocProtection: true,
		membersHeightPct: 30,
		ui: {
			left: null,
			top: null,
			width: 380,
			height: 480,
		},
	},
	maps: [],
	autosave: null,
	/** Last changelog id the player chose “Don’t show again” for. */
	dismissedChangelogId: "",
};

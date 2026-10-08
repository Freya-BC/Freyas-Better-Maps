// ==UserScript==
// @name         Freyas Better Maps
// @namespace    https://www.bondageprojects.com/
// @version      0.1.34
// @description  Bondage Club map helpers — typing, blindfold, build tools, map library
// @author       FreyaCoding
// @match        https://bondageprojects.elementfx.com/*
// @match        https://www.bondageprojects.elementfx.com/*
// @match        https://bondage-europe.com/*
// @match        https://www.bondage-europe.com/*
// @match        https://bondageeurope.com/*
// @match        https://www.bondageeurope.com/*
// @match        https://bondage-asia.com/*
// @match        https://www.bondage-asia.com/*
// @match        https://bondageprojects.com/*
// @match        https://www.bondageprojects.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

/*
 * Freyas Better Maps — single-file Tampermonkey install
 * Bookmark: bookmark.js loads the gist IIFE (docs/GIST.md).
 * Settings: Preference → Extensions → Freyas Better Maps
 */
(function () {
	"use strict";

	function inject(fn) {
		const script = document.createElement("script");
		script.textContent = "(" + fn.toString() + ")();";
		(document.head || document.documentElement).appendChild(script);
		script.remove();
	}

	inject(function () {
		"use strict";
		if (window.__FreyasBetterMapsPageLoaded) return;
		window.__FreyasBetterMapsPageLoaded = true;
		window.FreyasBetterMaps = window.FreyasBetterMaps || {};
		var FBM = window.FreyasBetterMaps;

		/* ========== EDITABLE: DEFAULTS ========== */
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

		/* ========== src/core/lz.js ========== */
		/**
		 * Freyas Better Maps — LZString envelopes (Club LZString)
		 */
		(function (FBM) {
			"use strict";
		
			function lz() {
				try {
					if (typeof LZString !== "undefined" && LZString) return LZString;
				} catch (e) {
					/* ignore */
				}
				try {
					if (typeof window !== "undefined" && window.LZString) return window.LZString;
				} catch (e) {
					/* ignore */
				}
				return null;
			}
		
			FBM.lzAvailable = function () {
				const L = lz();
				return !!(L && typeof L.compressToUTF16 === "function" && typeof L.decompressFromUTF16 === "function");
			};
		
			function parseJson(text) {
				if (text == null || text === "") return null;
				try {
					return JSON.parse(text);
				} catch (e) {
					return null;
				}
			}
		
			function unpackEnvelope(env) {
				if (!env || env.format !== (FBM.LZ_FORMAT || "FBMLz") || !env.data) return null;
				const L = lz();
				if (!L) return null;
				let plain = null;
				try {
					if (env.algo === "lz-utf16" && L.decompressFromUTF16) plain = L.decompressFromUTF16(env.data);
					else if (L.decompressFromBase64) plain = L.decompressFromBase64(env.data);
				} catch (e) {
					return null;
				}
				return plain ? parseJson(plain) : null;
			}
		
			FBM.lzUnpack = function (raw) {
				if (raw == null || raw === "") return null;
				if (typeof raw === "object") {
					if (raw.format === (FBM.LZ_FORMAT || "FBMLz") && raw.data) return unpackEnvelope(raw);
					return raw;
				}
				if (typeof raw !== "string") return null;
				const prefix = FBM.LZ_PREFIX || "FBMLz1:";
				if (raw.indexOf(prefix) === 0) {
					const L = lz();
					if (!L || !L.decompressFromUTF16) return null;
					let plain = null;
					try {
						plain = L.decompressFromUTF16(raw.slice(prefix.length));
					} catch (e) {
						return null;
					}
					return plain ? parseJson(plain) : null;
				}
				const first = raw.charAt(0);
				if (first === "{" || first === "[") {
					const parsed = parseJson(raw);
					if (parsed && parsed.format === (FBM.LZ_FORMAT || "FBMLz") && parsed.data) {
						return unpackEnvelope(parsed) || parsed;
					}
					return parsed;
				}
				return null;
			};
		
			FBM.lzPackLocal = function (obj) {
				const json = JSON.stringify(obj);
				const min = FBM.LZ_MIN || 800;
				const L = lz();
				if (!L || json.length < min) return json;
				try {
					const packed = L.compressToUTF16(json);
					if (!packed || packed.length >= json.length) return json;
					return (FBM.LZ_PREFIX || "FBMLz1:") + packed;
				} catch (e) {
					return json;
				}
			};
		
			FBM.lzReadLocal = function (raw) {
				const parsed = FBM.lzUnpack(raw);
				return parsed && typeof parsed === "object" ? parsed : null;
			};
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

		/* ========== src/core/storage.js ========== */
		/**
		 * Freyas Better Maps — ExtensionSettings + localStorage
		 */
		(function (FBM) {
			"use strict";
		
			function memberKey(suffix) {
				const n =
					typeof Player !== "undefined" && Player && Player.MemberNumber != null
						? Player.MemberNumber
						: "0";
				return FBM.EXTENSION_KEY + "_" + n + (suffix ? "_" + suffix : "");
			}
		
			function cloneDefaults() {
				return JSON.parse(JSON.stringify(FBM.DEFAULT_SETTINGS || {}));
			}
		
			FBM.normalizeSettings = function (raw) {
				const d = cloneDefaults();
				const s = raw && typeof raw === "object" ? raw : {};
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
				try {
					if (Player && Player.ExtensionSettings && Player.ExtensionSettings[FBM.EXTENSION_KEY]) {
						loaded = FBM.lzReadLocal(Player.ExtensionSettings[FBM.EXTENSION_KEY]);
					}
				} catch (e) {
					console.warn("[FBM] parse ExtensionSettings", e);
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
				try {
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
				} catch (e) {
					console.warn("[FBM] sync ExtensionSettings", e);
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
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

		/* ========== src/core/sdk.js ========== */
		/**
		 * Freyas Better Maps — bcModSdk + view patches
		 */
		(function (FBM) {
			"use strict";
		
			FBM.registerBcModSdk = function () {
				if (FBM.bcMod) return FBM.bcMod;
				try {
					if (typeof bcModSdk !== "undefined" && bcModSdk && typeof bcModSdk.registerMod === "function") {
						const info = {
							name: "FreyasBetterMaps",
							fullName: FBM.FULL_NAME || "Freyas Better Maps",
							version: FBM.VERSION,
						};
						if (FBM.REPO_URL) info.repository = FBM.REPO_URL;
						FBM.bcMod = bcModSdk.registerMod(info);
					}
				} catch (e) {
					console.warn("[FBM] bcModSdk register failed", e);
				}
				return FBM.bcMod || null;
			};
		
			FBM.hookFunction = function (name, priority, hook) {
				const sdk = FBM.registerBcModSdk();
				if (sdk && typeof sdk.hookFunction === "function") {
					try {
						sdk.hookFunction(name, priority, hook);
						return true;
					} catch (e) {
						console.warn("[FBM] bcModSdk.hookFunction failed for " + name, e);
					}
				}
				const original = window[name];
				if (typeof original !== "function") {
					console.warn("[FBM] Cannot hook missing function " + name);
					return false;
				}
				window[name] = function () {
					const args = Array.prototype.slice.call(arguments);
					return hook(args, function (nextArgs) {
						return original.apply(window, nextArgs || args);
					});
				};
				return true;
			};
		
			FBM.tryHook = function (stateKey, name, priority, hook) {
				FBM._hookState = FBM._hookState || {};
				if (FBM._hookState[stateKey || name]) return true;
				if (typeof window[name] !== "function" && typeof globalThis[name] !== "function") return false;
				const ok = FBM.hookFunction(name, priority, hook);
				if (ok) FBM._hookState[stateKey || name] = true;
				return ok;
			};
		
			FBM.shouldSuppressMapLeftButton = function (x, y) {
				if (!FBM.toolbarShouldHide || !FBM.toolbarShouldHide()) return false;
				if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return false;
				x = Number(x);
				y = Number(y);
				if (!isFinite(x) || !isFinite(y)) return false;
				return x <= 100 && y <= 500;
			};
		
			/**
			 * Persistent DrawButton filter — hides Club left map chrome while collapsed.
			 * Must go through bcModSdk (raw window.DrawButton overwrite triggers BCX).
			 * Flag `_fbmAllowLeftDrawButton` lets drawMapChromeButtons draw through it.
			 */
			FBM.installDrawButtonFilter = function () {
				return FBM.tryHook("DrawButtonFilter", "DrawButton", 20, function (args, next) {
					const Left = args[0];
					const Top = args[1];
					if (!FBM._fbmAllowLeftDrawButton && FBM.shouldSuppressMapLeftButton(Left, Top)) {
						return;
					}
					return next(args);
				});
			};
		
			FBM.withLeftDrawButtons = function (fn) {
				const prev = FBM._fbmAllowLeftDrawButton;
				FBM._fbmAllowLeftDrawButton = true;
				try {
					return fn();
				} finally {
					FBM._fbmAllowLeftDrawButton = prev;
				}
			};
		
			/**
			 * Patch ChatRoomViews.Map.DrawUi / Click on the view object itself.
			 * Club calls ChatRoomActiveView.DrawUi() from a stored reference — global hooks alone are not enough.
			 */
			FBM.patchMapViewMethods = function () {
				try {
					if (typeof ChatRoomViews === "undefined" || !ChatRoomViews || !ChatRoomViews.Map) return false;
					const map = ChatRoomViews.Map;
		
					if (!map._fbmDrawUiPatched && typeof map.DrawUi === "function") {
						const origDrawUi = map.DrawUi;
						map._fbmOrigDrawUi = origDrawUi;
						map.DrawUi = function () {
							FBM.installDrawButtonFilter();
							const ret = origDrawUi.apply(this, arguments);
							FBM.withLeftDrawButtons(function () {
								if (FBM.drawMapChromeButtons) FBM.drawMapChromeButtons();
							});
							if (FBM.refreshBuildBar) FBM.refreshBuildBar();
							return ret;
						};
						map._fbmDrawUiPatched = true;
					}
		
					if (!map._fbmClickPatched && typeof map.Click === "function") {
						const origClick = map.Click;
						map._fbmOrigClick = origClick;
						map.Click = function () {
							if (FBM.handleMapChromeClick && FBM.handleMapChromeClick()) return;
							if (FBM._copy && FBM._copy.mode && typeof MouseX === "number" && MouseX <= 1000) {
								const tile = FBM.mapTileFromMouse && FBM.mapTileFromMouse(MouseX, MouseY, 0, 0, 1000, 1000);
								if (tile && FBM.copyHandleTileClick && FBM.copyHandleTileClick(tile)) return;
							}
							const before = typeof ChatRoomMapViewEditStarted !== "undefined" ? ChatRoomMapViewEditStarted : null;
							const ret = origClick.apply(this, arguments);
							if (FBM.mapIsAdmin && FBM.mapIsAdmin()) {
								if (
									ChatRoomMapViewEditMode === "Tile" ||
									ChatRoomMapViewEditMode === "Object" ||
									ChatRoomMapViewEditMode === "Effect"
								) {
									if (FBM.markMapDirty) FBM.markMapDirty();
								} else if (before !== ChatRoomMapViewEditStarted && ChatRoomMapViewEditStarted) {
									if (FBM.markMapDirty) FBM.markMapDirty();
								}
							}
							return ret;
						};
						map._fbmClickPatched = true;
					}
		
					/* Club calls ActiveView.KeyDown from a stored ref — global ModSDK alone misses FBM inputs */
					if (!map._fbmKeyDownPatched && typeof map.KeyDown === "function") {
						const origKeyDown = map.KeyDown;
						map._fbmOrigKeyDown = origKeyDown;
						map.KeyDown = function () {
							if (FBM.mapTypingTargetActive && FBM.mapTypingTargetActive()) {
								if (FBM.clearMapMoveKeys) FBM.clearMapMoveKeys();
								return false;
							}
							return origKeyDown.apply(this, arguments);
						};
						map._fbmKeyDownPatched = true;
					}
		
					return !!(map._fbmDrawUiPatched && map._fbmClickPatched);
				} catch (e) {
					console.warn("[FBM] patchMapViewMethods", e);
					return false;
				}
			};
		
			/** @deprecated use patchMapViewMethods */
			FBM.rebindMapViewMethods = function () {
				return FBM.patchMapViewMethods();
			};
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

		/* ========== src/map/model.js ========== */
		/**
		 * Freyas Better Maps — map helpers / talk sizing
		 */
		(function (FBM) {
			"use strict";
		
			FBM.mapBag = function () {
				if (!FBM.settings) FBM.loadSettings();
				return FBM.settings;
			};
		
			FBM.mapIsMapRoom = function () {
				if (typeof ChatRoomData === "undefined" || !ChatRoomData) return false;
				const md = ChatRoomData.MapData;
				if (!md || md.Type == null || md.Type === "Never") return false;
				return true;
			};
		
			FBM.mapIsAdmin = function () {
				try {
					return typeof ChatRoomPlayerIsAdmin === "function" && !!ChatRoomPlayerIsAdmin();
				} catch (e) {
					return false;
				}
			};
		
			FBM.mapPerceptionRange = function () {
				if (typeof ChatRoomMapViewPerceptionRange === "number" && ChatRoomMapViewPerceptionRange > 0) {
					return ChatRoomMapViewPerceptionRange;
				}
				return 4;
			};
		
			FBM.mapTalkScale = function (tileWidth) {
				const ref = 1000 / (FBM.MAP_TALK_REF_SPAN || 3);
				const tw = Number(tileWidth);
				if (!isFinite(tw) || tw <= 0) return 1;
				return tw / ref;
			};
		
			FBM.mapTalkSize = function (tileWidth) {
				const scale = FBM.mapTalkScale(tileWidth);
				return {
					w: Math.max(FBM.MAP_TALK_MIN_W || 8, (FBM.MAP_TALK_W || 40) * scale),
					h: Math.max(FBM.MAP_TALK_MIN_H || 5, (FBM.MAP_TALK_H || 24) * scale),
					scale: scale,
				};
			};
		
			FBM.mapTalkFrame = function (nowMs) {
				const t =
					typeof nowMs === "number" && isFinite(nowMs)
						? nowMs
						: typeof CommonTime === "function"
							? CommonTime()
							: 0;
				return Math.floor(t / 1000) % 3;
			};
		
			FBM.mapTalkIconPath = function (frame) {
				const n = Number(frame);
				const f = n === 1 || n === 2 ? n : 0;
				return "Icons/Status/Talk" + f + ".png";
			};
		
			FBM.mapShouldDrawTalk = function (C) {
				const m = FBM.mapBag();
				if (!m.typingIndicator) return false;
				if (typeof Player !== "undefined" && Player && Player.OnlineSettings && Player.OnlineSettings.ShowStatus === false) {
					return false;
				}
				if (typeof ChatRoomHideIconState !== "undefined" && ChatRoomHideIconState >= 2) return false;
				if (!C || C.Status !== "Talk") return false;
				if (C.StatusTimer != null && typeof CommonTime === "function" && C.StatusTimer < CommonTime()) return false;
				return true;
			};
		
			FBM.mapCharVisible = function (C) {
				if (typeof ChatRoomMapViewCharacterIsVisible === "function") {
					try {
						return !!ChatRoomMapViewCharacterIsVisible(C);
					} catch (e) {
						return false;
					}
				}
				return !!(C && C.MapData && C.MapData.Pos);
			};
		
			FBM.mapTileIndex = function (X, Y) {
				const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
				return X + Y * w;
			};
		
			FBM.mapIsWall = function (X, Y) {
				if (typeof ChatRoomMapViewIsWall === "function") {
					try {
						return !!ChatRoomMapViewIsWall(X, Y);
					} catch (e) {
						/* fall through */
					}
				}
				try {
					if (!ChatRoomData || !ChatRoomData.MapData || !ChatRoomData.MapData.Tiles) return false;
					const tiles = ChatRoomData.MapData.Tiles;
					const idx = FBM.mapTileIndex(X, Y);
					const code = tiles.charCodeAt(idx);
					const lookup = typeof ChatRoomMapViewTileLookup !== "undefined" ? ChatRoomMapViewTileLookup : null;
					if (lookup && lookup[code] && lookup[code].Type === "Wall") return true;
				} catch (e) {
					/* ignore */
				}
				return false;
			};
		
			/** Non-walkable for blindfold silhouette: walls, trees, locked doors, glass, etc. */
			FBM.mapIsBlocked = function (X, Y) {
				if (FBM.mapIsWall(X, Y)) return true;
				if (typeof ChatRoomMapViewPositionIsBlocked === "function") {
					try {
						return !!ChatRoomMapViewPositionIsBlocked(X, Y);
					} catch (e) {
						/* fall through */
					}
				}
				try {
					const getObj =
						typeof MapGetCell === "function"
							? function (x, y) {
									return MapGetCell("Object", x, y);
							  }
							: typeof ChatRoomMapViewGetObjectAtPos === "function"
								? ChatRoomMapViewGetObjectAtPos
								: null;
					const getTile =
						typeof MapGetCell === "function"
							? function (x, y) {
									return MapGetCell("Tile", x, y);
							  }
							: typeof ChatRoomMapViewGetTileAtPos === "function"
								? ChatRoomMapViewGetTileAtPos
								: null;
					const O = getObj ? getObj(X, Y) : null;
					if (O && typeof O.CanEnter === "function" && !O.CanEnter("")) return true;
					const T = getTile ? getTile(X, Y) : null;
					if (T && typeof T.CanEnter === "function" && !T.CanEnter("")) return true;
				} catch (e) {
					/* ignore */
				}
				return false;
			};
		
			FBM.mapScreenFromTile = function (X, Y, Left, Top, Width, Height) {
				const range = FBM.mapPerceptionRange();
				const span = range * 2 + 1;
				const TileWidth = Width / span;
				const TileHeight = Height / span;
				const px = Player.MapData.Pos.X;
				const py = Player.MapData.Pos.Y;
				const ScreenX = (X - px) * TileWidth + range * TileWidth;
				const ScreenY = (Y - py) * TileHeight + range * TileWidth;
				return {
					ScreenX: ScreenX,
					ScreenY: ScreenY,
					TileWidth: TileWidth,
					TileHeight: TileHeight,
					Left: Left + ScreenX,
					Top: Top + ScreenY,
				};
			};
		
			FBM.mapTileFromMouse = function (MouseX, MouseY, Left, Top, Width, Height) {
				if (!Player || !Player.MapData || !Player.MapData.Pos) return null;
				const range = FBM.mapPerceptionRange();
				const span = range * 2 + 1;
				const TileWidth = Width / span;
				const TileHeight = Height / span;
				const relX = MouseX - Left;
				const relY = MouseY - Top;
				if (relX < 0 || relY < 0 || relX >= Width || relY >= Height) return null;
				const tx = Math.floor(relX / TileWidth) - range + Player.MapData.Pos.X;
				const ty = Math.floor(relY / TileHeight) - range + Player.MapData.Pos.Y;
				const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
				const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
				if (tx < 0 || ty < 0 || tx >= w || ty >= h) return null;
				return { X: tx, Y: ty };
			};
		
			FBM.localMsg = function (text) {
				try {
					if (typeof ChatRoomSendLocal === "function") ChatRoomSendLocal(String(text), 10000);
				} catch (e) {
					/* ignore */
				}
			};
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

		/* ========== src/map/sync.js ========== */
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

		/* ========== src/map/library.js ========== */
		/**
		 * Freyas Better Maps — full map save / load / autosave
		 */
		(function (FBM) {
			"use strict";
		
			FBM._mapDirty = false;
			FBM._autosaveTimer = null;
			FBM._lastAutosaveAt = 0;
		
			function newId() {
				return "m" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
			}
		
			FBM.exportCurrentMap = function () {
				if (!FBM.mapIsMapRoom()) return null;
				try {
					if (typeof ChatRoomMapManager !== "undefined" && ChatRoomMapManager && ChatRoomMapManager.Map && typeof ChatRoomMapManager.Map.exportString === "function") {
						return ChatRoomMapManager.Map.exportString();
					}
				} catch (e) {
					console.warn("[FBM] exportString", e);
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
				try {
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
				} catch (e) {
					console.warn("[FBM] importString", e);
					FBM.localMsg("FBM: map paste error.");
					return false;
				}
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
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

		/* ========== src/map/copy.js ========== */
		/**
		 * Freyas Better Maps — region copy / paste / templates
		 */
		(function (FBM) {
			"use strict";
		
			FBM._copy = {
				mode: "", // "" | "a" | "b" | "edit" | "paste"
				a: null,
				b: null,
				cells: {}, // "x,y" -> { tile, object }
				pasteId: null,
			};
		
			function cellKey(X, Y) {
				return X + "," + Y;
			}
		
			function readCell(X, Y) {
				const md = ChatRoomData && ChatRoomData.MapData;
				if (!md || !md.Tiles || !md.Objects) return null;
				const idx = FBM.mapTileIndex(X, Y);
				return {
					X: X,
					Y: Y,
					tile: md.Tiles.charAt(idx),
					object: md.Objects.charAt(idx),
				};
			}
		
			FBM.copyReset = function () {
				FBM._copy.mode = "";
				FBM._copy.a = null;
				FBM._copy.b = null;
				FBM._copy.cells = {};
				FBM._copy.pasteId = null;
				if (FBM.refreshBuildBar) FBM.refreshBuildBar();
			};
		
			/** Cancel copy/paste (or close template picker). Returns true if something was cancelled. */
			FBM.copyCancel = function () {
				const tpl = document.getElementById("fbm-templates");
				const tplOpen = tpl && !tpl.hidden;
				const mode = FBM._copy && FBM._copy.mode;
				if (!mode && !tplOpen) return false;
				if (tplOpen && FBM.hideTemplatesUi) FBM.hideTemplatesUi();
				if (mode) FBM.copyReset();
				try {
					if (typeof ChatRoomSendLocal === "function") ChatRoomSendLocal("FBM: copy/paste cancelled.", 4000);
					else if (FBM.localMsg) FBM.localMsg("FBM: copy/paste cancelled.");
				} catch (e) {
					/* ignore */
				}
				return true;
			};
		
			FBM.installCopyEscape = function () {
				if (FBM._copyEscapeBound) return;
				FBM._copyEscapeBound = true;
				document.addEventListener(
					"keydown",
					function (e) {
						if (!e || (e.key !== "Escape" && e.code !== "Escape")) return;
						if (FBM._capturingHotkey) return;
						const t = e.target;
						if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) {
							/* still allow Escape to cancel copy while focused in FBM fields */
							if (!t.closest || !t.closest("#fbm-root")) return;
						}
						const tpl = document.getElementById("fbm-templates");
						const busy = (FBM._copy && FBM._copy.mode) || (tpl && !tpl.hidden);
						if (!busy) return;
						e.preventDefault();
						e.stopPropagation();
						FBM.copyCancel();
					},
					true
				);
			};
		
			FBM.copyStart = function () {
				FBM._copy.mode = "a";
				FBM._copy.a = null;
				FBM._copy.b = null;
				FBM._copy.cells = {};
				FBM._copy.pasteId = null;
				FBM.localMsg("FBM: click top-left tile, then bottom-right. Esc cancels.");
				if (FBM.refreshBuildBar) FBM.refreshBuildBar();
			};
		
			FBM.copyFillRect = function (a, b) {
				const x0 = Math.min(a.X, b.X);
				const x1 = Math.max(a.X, b.X);
				const y0 = Math.min(a.Y, b.Y);
				const y1 = Math.max(a.Y, b.Y);
				const cells = {};
				for (let y = y0; y <= y1; y++) {
					for (let x = x0; x <= x1; x++) {
						const c = readCell(x, y);
						if (c) cells[cellKey(x, y)] = c;
					}
				}
				FBM._copy.cells = cells;
				FBM._copy.a = { X: x0, Y: y0 };
				FBM._copy.b = { X: x1, Y: y1 };
			};
		
			FBM.copyToggleCell = function (X, Y) {
				const k = cellKey(X, Y);
				if (FBM._copy.cells[k]) {
					delete FBM._copy.cells[k];
				} else {
					const c = readCell(X, Y);
					if (c) FBM._copy.cells[k] = c;
				}
			};
		
			FBM.copyBounds = function (cells) {
				const list = Object.keys(cells || FBM._copy.cells).map(function (k) {
					const p = k.split(",");
					return { X: +p[0], Y: +p[1] };
				});
				if (!list.length) return null;
				let x0 = list[0].X;
				let x1 = list[0].X;
				let y0 = list[0].Y;
				let y1 = list[0].Y;
				list.forEach(function (p) {
					x0 = Math.min(x0, p.X);
					x1 = Math.max(x1, p.X);
					y0 = Math.min(y0, p.Y);
					y1 = Math.max(y1, p.Y);
				});
				return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
			};
		
			FBM.copyMakeThumb = function (cells, bounds) {
				try {
					const canvas = document.createElement("canvas");
					const tw = 8;
					canvas.width = Math.max(1, bounds.w * tw);
					canvas.height = Math.max(1, bounds.h * tw);
					const ctx = canvas.getContext("2d");
					ctx.fillStyle = "#1a1e24";
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					Object.keys(cells).forEach(function (k) {
						const c = cells[k];
						const wall = FBM.mapIsWall(c.X, c.Y);
						ctx.fillStyle = wall ? "#6a7078" : "#3a90a8";
						ctx.fillRect((c.X - bounds.x0) * tw, (c.Y - bounds.y0) * tw, tw - 1, tw - 1);
					});
					return canvas.toDataURL("image/png");
				} catch (e) {
					return "";
				}
			};
		
			FBM.copySaveTemplate = function (name) {
				const cells = FBM._copy.cells;
				const bounds = FBM.copyBounds(cells);
				if (!bounds) {
					FBM.localMsg("FBM: nothing selected.");
					return null;
				}
				const rel = [];
				Object.keys(cells).forEach(function (k) {
					const c = cells[k];
					rel.push({
						dx: c.X - bounds.x0,
						dy: c.Y - bounds.y0,
						tile: c.tile,
						object: c.object,
					});
				});
				FBM.loadTemplates();
				const entry = {
					id: "t" + Date.now().toString(36),
					name: String(name || "Room").trim().slice(0, 40) || "Room",
					w: bounds.w,
					h: bounds.h,
					cells: rel,
					thumb: FBM.copyMakeThumb(cells, bounds),
					savedAt: Date.now(),
				};
				FBM.templates.unshift(entry);
				while (FBM.templates.length > 40) FBM.templates.pop();
				FBM.saveTemplates();
				FBM.localMsg("FBM: template “" + entry.name + "” saved (" + bounds.w + " × " + bounds.h + ").");
				FBM.copyReset();
				if (FBM.refreshTemplatesUi) FBM.refreshTemplatesUi();
				return entry;
			};
		
			FBM.copyDeleteTemplate = function (id) {
				FBM.loadTemplates();
				FBM.templates = (FBM.templates || []).filter(function (t) {
					return t && t.id !== id;
				});
				FBM.saveTemplates();
				if (FBM.refreshTemplatesUi) FBM.refreshTemplatesUi();
			};
		
			FBM.copyBeginPaste = function (templateId) {
				FBM.loadTemplates();
				const t = (FBM.templates || []).find(function (x) {
					return x && x.id === templateId;
				});
				if (!t) {
					FBM.localMsg("FBM: template missing.");
					return;
				}
				FBM._copy.mode = "paste";
				FBM._copy.pasteId = templateId;
				FBM.localMsg("FBM: click top-left paste origin. Esc cancels.");
				if (FBM.hideTemplatesUi) FBM.hideTemplatesUi();
				if (FBM.refreshBuildBar) FBM.refreshBuildBar();
			};
		
			FBM.copyApplyPaste = function (originX, originY) {
				if (!FBM.mapIsAdmin()) {
					FBM.localMsg("FBM: admin required to paste.");
					return false;
				}
				FBM.loadTemplates();
				const t = (FBM.templates || []).find(function (x) {
					return x && x.id === FBM._copy.pasteId;
				});
				if (!t || !Array.isArray(t.cells)) return false;
				const md = ChatRoomData && ChatRoomData.MapData;
				if (!md || typeof md.Tiles !== "string" || typeof md.Objects !== "string") return false;
				const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
				const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
				let backup = null;
				try {
					backup = typeof CommonCloneDeep === "function" ? CommonCloneDeep(md) : JSON.parse(JSON.stringify(md));
				} catch (e) {
					backup = null;
				}
				const tiles = md.Tiles.split("");
				const objects = md.Objects.split("");
				t.cells.forEach(function (c) {
					const X = originX + c.dx;
					const Y = originY + c.dy;
					if (X < 0 || Y < 0 || X >= w || Y >= h) return;
					const idx = X + Y * w;
					if (c.tile != null) tiles[idx] = c.tile;
					if (c.object != null) objects[idx] = c.object;
				});
				md.Tiles = tiles.join("");
				md.Objects = objects.join("");
				FBM.pushMapRoomSync({ backup: backup });
				FBM.localMsg("FBM: pasted “" + t.name + "”.");
				FBM.copyReset();
				return true;
			};
		
			FBM.copyHandleTileClick = function (tile) {
				if (!tile || !FBM._copy.mode) return false;
				if (FBM._copy.mode === "a") {
					FBM._copy.a = { X: tile.X, Y: tile.Y };
					FBM._copy.mode = "b";
					FBM.localMsg("FBM: now click bottom-right.");
					return true;
				}
				if (FBM._copy.mode === "b") {
					FBM.copyFillRect(FBM._copy.a, tile);
					FBM._copy.mode = "edit";
					FBM.localMsg("FBM: toggle tiles, then Save selection.");
					if (FBM.refreshBuildBar) FBM.refreshBuildBar();
					return true;
				}
				if (FBM._copy.mode === "edit") {
					FBM.copyToggleCell(tile.X, tile.Y);
					return true;
				}
				if (FBM._copy.mode === "paste") {
					FBM.copyApplyPaste(tile.X, tile.Y);
					return true;
				}
				return false;
			};
		
			FBM.copyDrawHighlight = function (Left, Top, Width, Height) {
				const mode = FBM._copy.mode;
				if (!mode || mode === "a") return;
				const cells = FBM._copy.cells;
				const keys = Object.keys(cells);
				if (!keys.length && mode !== "b") return;
				if (typeof DrawRect !== "function" && typeof DrawEmptyRect !== "function") return;
				if (mode === "b" && FBM._copy.a) {
					const s = FBM.mapScreenFromTile(FBM._copy.a.X, FBM._copy.a.Y, Left, Top, Width, Height);
					if (typeof DrawEmptyRect === "function") {
						DrawEmptyRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "#5bc0de", 2);
					}
					return;
				}
				keys.forEach(function (k) {
					const c = cells[k];
					const s = FBM.mapScreenFromTile(c.X, c.Y, Left, Top, Width, Height);
					if (typeof DrawRect === "function") {
						DrawRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "rgba(91,192,222,0.28)");
					}
					if (typeof DrawEmptyRect === "function") {
						DrawEmptyRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "#5bc0de", 2);
					}
				});
			};
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

		/* ========== src/map/hooks.js ========== */
		/**
		 * Freyas Better Maps — Club map hooks
		 */
		(function (FBM) {
			"use strict";
		
			FBM._toolbarExpanded = false;
			FBM._zoomApplied = false;
			FBM._prevZoomMax = null;
			FBM._buildBarOpen = false;
		
			/**
			 * Collapsed: + at (10,10), FBM under it at (10,52).
			 * Expanded: − / FBM placed from live panel DOM (see computeMapChromeLayout).
			 */
			FBM.TOOLBAR_PLUS = { x: 10, y: 10, w: 36, h: 36 };
			FBM.TOOLBAR_FBM_COLLAPSED = { x: 10, y: 52, w: 36, h: 36 };
			FBM.TOOLBAR_BTN = 36;
			FBM.TOOLBAR_STACK_GAP = 6;
			/** Expanded − sits lower than + so it clears the floating build bar. */
			FBM.TOOLBAR_COLLAPSE_Y = 58;
			/** Fallback when panel DOM is missing (Club logical coords). */
			FBM.TOOLBAR_COLLAPSE = { x: 80, y: 10, w: 36, h: 36 };
			FBM.TOOLBAR_FBM_EXPANDED = { x: 80, y: 52, w: 36, h: 36 };
			FBM.TOOLBAR_FBM_PANEL = { x: 80, y: 10, w: 36, h: 36 };
		
			function fillMask(mask) {
				if (mask == null) return false;
				if (typeof mask.fill === "function") mask.fill(true);
				else for (let i = 0; i < mask.length; i++) mask[i] = true;
				return true;
			}
		
			function mouseInRect(r) {
				return r && typeof MouseIn === "function" && MouseIn(r.x, r.y, r.w, r.h);
			}
		
			function cloneRect(r) {
				return r ? { x: r.x, y: r.y, w: r.w, h: r.h } : null;
			}
		
			function elVisible(el) {
				if (!el || !el.getBoundingClientRect) return false;
				try {
					const st = window.getComputedStyle(el);
					if (st.display === "none" || st.visibility === "hidden" || Number(st.opacity) === 0) return false;
				} catch (e) {
					/* ignore */
				}
				const r = el.getBoundingClientRect();
				return r.width > 2 && r.height > 2;
			}
		
			/**
			 * Place − / FBM beside the Club HTML panel.
			 * Narrow (no edit mode / items hidden): tuck next to the left button strip.
			 * Fully open (data-edit-mode or wide items): sit clear of the grey panel + shadow,
			 * Y aligned with the search field top.
			 */
			FBM.computeMapChromeLayout = function () {
				const btn = FBM.TOOLBAR_BTN || 36;
				const gap = FBM.TOOLBAR_STACK_GAP || 6;
				const plus = cloneRect(FBM.TOOLBAR_PLUS);
				const fbmCollapsed = cloneRect(FBM.TOOLBAR_FBM_COLLAPSED);
		
				if (FBM.toolbarShouldHide()) {
					const layout = { plus: plus, collapse: null, fbm: fbmCollapsed, fullyOpen: false };
					FBM._mapChromeLayout = layout;
					return layout;
				}
		
				const canvas =
					typeof FBM.getMainCanvasEl === "function"
						? FBM.getMainCanvasEl()
						: document.getElementById("MainCanvas");
				const panel = document.getElementById(FBM.MAP_EDITOR_PANEL_ID || "chat-room-map-view-panel");
				const search = document.getElementById("chat-room-map-view-panel-search");
				const buttons = document.getElementById("chat-room-map-view-panel-buttons-list");
		
				let collapse = cloneRect(FBM.TOOLBAR_COLLAPSE);
				let fbm = cloneRect(FBM.TOOLBAR_FBM_EXPANDED);
				let fullyOpen = false;
		
				if (canvas && panel && elVisible(panel) && !panel.classList.contains("fbm-panel-collapsed")) {
					const cr = canvas.getBoundingClientRect();
					if (cr.width > 1 && cr.height > 1) {
						const sx = 2000 / cr.width;
						const sy = 1000 / cr.height;
						const toClub = function (clientX, clientY) {
							return {
								x: (clientX - cr.left) * sx,
								y: (clientY - cr.top) * sy,
							};
						};
		
						/* Club sets data-edit-mode when tile/object/effect picker (search + items) is open. */
						fullyOpen =
							panel.hasAttribute("data-edit-mode") ||
							(typeof ChatRoomMapViewEditMode !== "undefined" &&
								!!ChatRoomMapViewEditMode &&
								ChatRoomMapViewEditMode !== "");
		
						const pr = panel.getBoundingClientRect();
						const br = elVisible(buttons) ? buttons.getBoundingClientRect() : null;
						let edgeClient;
						let padClient;
						let topClient;
		
						if (fullyOpen) {
							/* Full picker: right of grey panel, Y with search field. */
							edgeClient = pr.right;
							padClient = 16;
							topClient = elVisible(search) ? search.getBoundingClientRect().top : pr.top + 4;
						} else {
							/* Menu closed: beside tool strip, level with the first Club button (not the list padding). */
							const firstBtn =
								buttons &&
								(buttons.querySelector("button") ||
									buttons.querySelector("[role='button']") ||
									buttons.firstElementChild);
							const fr = firstBtn && elVisible(firstBtn) ? firstBtn.getBoundingClientRect() : null;
							edgeClient = fr ? fr.right : br ? br.right : pr.left + 68;
							padClient = 12;
							topClient = fr ? fr.top : br ? br.top : pr.top + 2;
						}
		
						const club = toClub(edgeClient + padClient, topClient);
						let x = Math.round(club.x);
						/* Below the floating build bar (higher than collapsed +). */
						let y = FBM.TOOLBAR_COLLAPSE_Y != null ? FBM.TOOLBAR_COLLAPSE_Y : 58;
						if (fullyOpen) {
							/* Extra Club units past panel right so the grey box-shadow never clips the − */
							x = Math.max(x, Math.round(toClub(pr.right, topClient).x + 22));
							if (elVisible(search)) {
								const searchY = Math.round(toClub(0, search.getBoundingClientRect().top).y);
								/* Prefer search top, but never sit under the build bar. */
								y = Math.max(y, searchY);
							}
						} else {
							/* Nudge right of the strip. */
							x = Math.max(88, Math.min(x + 6, 130));
						}
		
						collapse = { x: x, y: y, w: btn, h: btn };
						fbm = { x: x, y: y + btn + gap, w: btn, h: btn };
					}
				}
		
				const m = FBM.mapBag();
				const showCollapse = !!(m.hideBuildToolbar && FBM._toolbarExpanded);
				if (!showCollapse) {
					/* No − : FBM occupies the top slot of the side column. */
					fbm = collapse ? { x: collapse.x, y: collapse.y, w: btn, h: btn } : cloneRect(FBM.TOOLBAR_FBM_PANEL);
					collapse = null;
				}
		
				const layout = { plus: plus, collapse: collapse, fbm: fbm, fullyOpen: fullyOpen };
				FBM._mapChromeLayout = layout;
				return layout;
			};
		
			function fbmToolsRect() {
				const layout = FBM._mapChromeLayout || FBM.computeMapChromeLayout();
				if (layout && layout.fbm) return layout.fbm;
				if (FBM.toolbarShouldHide()) return FBM.TOOLBAR_FBM_COLLAPSED;
				return FBM.TOOLBAR_FBM_PANEL;
			}
		
			function collapseRect() {
				const layout = FBM._mapChromeLayout || FBM.computeMapChromeLayout();
				return layout && layout.collapse ? layout.collapse : FBM.TOOLBAR_COLLAPSE;
			}
		
			/* ---------- typing ---------- */
		
			FBM.mapDrawTypingIndicators = function (Left, Top, Width, Height) {
				const m = FBM.mapBag();
				if (!m.typingIndicator) return 0;
				if (!Player || !Player.MapData || !Player.MapData.Pos) return 0;
				if (typeof ChatRoomCharacter === "undefined" || !ChatRoomCharacter) return 0;
				Left = Number(Left) || 0;
				Top = Number(Top) || 0;
				Width = Number(Width) || 1000;
				Height = Number(Height) || 1000;
				const range = FBM.mapPerceptionRange();
				const span = range * 2 + 1;
				const TileWidth = Width / span;
				const TileHeight = Height / span;
				const px = Player.MapData.Pos.X;
				const py = Player.MapData.Pos.Y;
				const frame = FBM.mapTalkFrame();
				const icon = FBM.mapTalkIconPath(frame);
				const size = FBM.mapTalkSize(TileWidth);
				let drawn = 0;
				ChatRoomCharacter.forEach(function (C) {
					if (!FBM.mapShouldDrawTalk(C)) return;
					if (!C.MapData || !C.MapData.Pos) return;
					if (!FBM.mapCharVisible(C)) return;
					const X = C.MapData.Pos.X;
					const Y = C.MapData.Pos.Y;
					const ScreenX = (X - px) * TileWidth + range * TileWidth;
					const ScreenY = (Y - py) * TileHeight + range * TileWidth;
					const CharX = Left + ScreenX + TileWidth * 0.05;
					const CharY = Top + ScreenY - TileHeight * 0.85;
					const zoom = (TileHeight * 1.8) / 1000;
					const bx = CharX + 250 * zoom - size.w / 2;
					const by = CharY - size.h - 4 * size.scale;
					if (typeof DrawImageResize === "function") DrawImageResize(icon, bx, by, size.w, size.h);
					drawn += 1;
				});
				return drawn;
			};
		
			/* ---------- grid ---------- */
		
			FBM.mapDrawGridOverlay = function (Left, Top, Width, Height) {
				const m = FBM.mapBag();
				if (!m.buildingTools || !m.gridOn) return;
				if (!Player || !Player.MapData || !Player.MapData.Pos) return;
				if (typeof DrawEmptyRect !== "function" && typeof DrawRect !== "function") return;
				const range = FBM.mapPerceptionRange();
				const span = range * 2 + 1;
				const TileWidth = Width / span;
				const TileHeight = Height / span;
				const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
				const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
				const px = Player.MapData.Pos.X;
				const py = Player.MapData.Pos.Y;
				const xMin = Math.max(0, px - range);
				const xMax = Math.min(w - 1, px + range);
				const yMin = Math.max(0, py - range);
				const yMax = Math.min(h - 1, py + range);
				const midX = Math.floor(w / 2);
				const midY = Math.floor(h / 2);
		
				function vline(worldX, color, thick) {
					if (worldX < xMin || worldX > xMax) return;
					const sx = Left + (worldX - px) * TileWidth + range * TileWidth;
					if (typeof DrawRect === "function") DrawRect(sx, Top, thick || 1, Height, color);
				}
				function hline(worldY, color, thick) {
					if (worldY < yMin || worldY > yMax) return;
					const sy = Top + (worldY - py) * TileHeight + range * TileWidth;
					if (typeof DrawRect === "function") DrawRect(Left, sy, Width, thick || 1, color);
				}
		
				for (let x = 0; x < w; x += 5) vline(x, "rgba(255,255,255,0.22)", 1);
				for (let y = 0; y < h; y += 5) hline(y, "rgba(255,255,255,0.22)", 1);
				vline(midX, "rgba(212,160,23,0.55)", 2);
				hline(midY, "rgba(212,160,23,0.55)", 2);
			};
		
			/* ---------- blindfold ---------- */
		
			FBM.mapIsMaxBlind = function () {
				try {
					if (!Player || typeof Player.GetBlindLevel !== "function") return false;
					return Player.GetBlindLevel() >= 3;
				} catch (e) {
					return false;
				}
			};
		
			/** Club map avatar placement for a tile at (dx,dy) from player. */
			FBM.mapCharDrawPos = function (Left, Top, TileWidth, TileHeight, range, dx, dy) {
				const ScreenX = Left + dx * TileWidth + range * TileWidth;
				const ScreenY = Top + dy * TileHeight + range * TileWidth;
				return {
					x: ScreenX + TileWidth * 0.05,
					y: ScreenY - TileHeight * 0.85,
					zoom: (TileHeight * 1.8) / 1000,
				};
			};
		
			FBM.mapDrawCharacterGrey = function (C, x, y, zoom) {
				if (typeof DrawCharacter !== "function" || !C) return;
				const canvas = typeof MainCanvas !== "undefined" ? MainCanvas : null;
				const prev = canvas && canvas.filter != null ? canvas.filter : "none";
				try {
					if (canvas) canvas.filter = "grayscale(100%) brightness(0.65)";
					DrawCharacter(C, x, y, zoom);
				} finally {
					if (canvas) canvas.filter = prev || "none";
				}
			};
		
			/**
			 * Procedural standing silhouette in Club character canvas space (500×1000),
			 * placed at the same anchor as DrawCharacter(x, y, zoom).
			 */
			FBM.mapDrawGenericSilhouette = function (x, y, zoom) {
				const ctx = typeof MainCanvas !== "undefined" ? MainCanvas : null;
				if (!ctx || typeof ctx.beginPath !== "function") return;
				zoom = Number(zoom) || 1;
				const z = zoom;
				const ox = x;
				const oy = y;
				const fill = "#6e6e6e";
				ctx.save();
				try {
					ctx.fillStyle = fill;
					ctx.beginPath();
					/* head */
					ctx.ellipse(ox + 250 * z, oy + 110 * z, 55 * z, 70 * z, 0, 0, Math.PI * 2);
					ctx.fill();
					/* neck + torso + hips */
					ctx.beginPath();
					ctx.moveTo(ox + 220 * z, oy + 175 * z);
					ctx.lineTo(ox + 280 * z, oy + 175 * z);
					ctx.lineTo(ox + 310 * z, oy + 220 * z);
					ctx.lineTo(ox + 340 * z, oy + 480 * z);
					ctx.lineTo(ox + 300 * z, oy + 520 * z);
					ctx.lineTo(ox + 200 * z, oy + 520 * z);
					ctx.lineTo(ox + 160 * z, oy + 480 * z);
					ctx.lineTo(ox + 190 * z, oy + 220 * z);
					ctx.closePath();
					ctx.fill();
					/* arms */
					ctx.beginPath();
					ctx.moveTo(ox + 190 * z, oy + 230 * z);
					ctx.lineTo(ox + 120 * z, oy + 420 * z);
					ctx.lineTo(ox + 155 * z, oy + 435 * z);
					ctx.lineTo(ox + 200 * z, oy + 280 * z);
					ctx.closePath();
					ctx.fill();
					ctx.beginPath();
					ctx.moveTo(ox + 310 * z, oy + 230 * z);
					ctx.lineTo(ox + 380 * z, oy + 420 * z);
					ctx.lineTo(ox + 345 * z, oy + 435 * z);
					ctx.lineTo(ox + 300 * z, oy + 280 * z);
					ctx.closePath();
					ctx.fill();
					/* legs */
					ctx.beginPath();
					ctx.moveTo(ox + 200 * z, oy + 520 * z);
					ctx.lineTo(ox + 235 * z, oy + 520 * z);
					ctx.lineTo(ox + 245 * z, oy + 900 * z);
					ctx.lineTo(ox + 185 * z, oy + 900 * z);
					ctx.closePath();
					ctx.fill();
					ctx.beginPath();
					ctx.moveTo(ox + 265 * z, oy + 520 * z);
					ctx.lineTo(ox + 300 * z, oy + 520 * z);
					ctx.lineTo(ox + 315 * z, oy + 900 * z);
					ctx.lineTo(ox + 255 * z, oy + 900 * z);
					ctx.closePath();
					ctx.fill();
				} finally {
					ctx.restore();
				}
			};
		
			FBM.mapDrawBlindfold = function (Left, Top, Width, Height) {
				const m = FBM.mapBag();
				if (!m.fullBlindfold || !FBM.mapIsMaxBlind()) return;
				if (!Player || !Player.MapData || !Player.MapData.Pos) return;
				const range = FBM.mapPerceptionRange();
				const span = range * 2 + 1;
				const TileWidth = Width / span;
				const TileHeight = Height / span;
				const px = Player.MapData.Pos.X;
				const py = Player.MapData.Pos.Y;
				const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
				const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
				const othersStyle = m.blindfoldOthersStyle === "silhouette" ? "silhouette" : "greyscale";
		
				for (let dy = -range; dy <= range; dy++) {
					for (let dx = -range; dx <= range; dx++) {
						const X = px + dx;
						const Y = py + dy;
						if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
						const cheb = Math.max(Math.abs(dx), Math.abs(dy));
						const ScreenX = Left + dx * TileWidth + range * TileWidth;
						const ScreenY = Top + dy * TileHeight + range * TileWidth;
						if (cheb > 1) {
							if (typeof DrawRect === "function") DrawRect(ScreenX, ScreenY, TileWidth + 0.5, TileHeight + 0.5, "#000000");
							continue;
						}
						/* cheb 0: hide player tile; cheb 1: darker walls / lighter blocked objects / black walkable */
						const isWall = FBM.mapIsWall(X, Y);
						const blocked = isWall || (FBM.mapIsBlocked ? FBM.mapIsBlocked(X, Y) : false);
						if (cheb === 0 || !blocked) {
							if (typeof DrawRect === "function") DrawRect(ScreenX, ScreenY, TileWidth + 0.5, TileHeight + 0.5, "#000000");
						} else if (typeof DrawRect === "function") {
							DrawRect(ScreenX, ScreenY, TileWidth + 0.5, TileHeight + 0.5, isWall ? "#3a3a3a" : "#7a7a7a");
						}
					}
				}
		
				/* Adjacent others */
				if (typeof ChatRoomCharacter !== "undefined" && ChatRoomCharacter) {
					ChatRoomCharacter.forEach(function (C) {
						if (!C || !C.MapData || !C.MapData.Pos) return;
						if (typeof C.IsPlayer === "function" && C.IsPlayer()) return;
						if (Player && C.MemberNumber === Player.MemberNumber) return;
						const dx = C.MapData.Pos.X - px;
						const dy = C.MapData.Pos.Y - py;
						if (Math.max(Math.abs(dx), Math.abs(dy)) > 1) return;
						const pos = FBM.mapCharDrawPos(Left, Top, TileWidth, TileHeight, range, dx, dy);
						if (othersStyle === "silhouette") {
							FBM.mapDrawGenericSilhouette(pos.x, pos.y, pos.zoom);
						} else if (typeof DrawCharacter === "function") {
							FBM.mapDrawCharacterGrey(C, pos.x, pos.y, pos.zoom);
						}
					});
				}
		
				/* Self: full-color avatar on top of blacked-out tile */
				if (typeof DrawCharacter === "function") {
					const self = FBM.mapCharDrawPos(Left, Top, TileWidth, TileHeight, range, 0, 0);
					DrawCharacter(Player, self.x, self.y, self.zoom);
				}
			};
		
			/* ---------- zoom ---------- */
		
			FBM.applyZoomSetting = function () {
				const m = FBM.mapBag();
				if (typeof ChatRoomMapViewPerceptionRangeMax !== "number") return;
				const cur = ChatRoomMapViewPerceptionRangeMax;
				if (m.fullZoomOut) {
					if (cur !== FBM.ZOOM_DEFAULT_MAX && cur !== FBM.ZOOM_SUPER_MAX) return;
					if (!FBM._zoomApplied) FBM._prevZoomMax = cur;
					ChatRoomMapViewPerceptionRangeMax = FBM.ZOOM_SUPER_MAX;
					FBM._zoomApplied = true;
				} else if (FBM._zoomApplied) {
					if (cur === FBM.ZOOM_SUPER_MAX) {
						ChatRoomMapViewPerceptionRangeMax = FBM._prevZoomMax != null ? FBM._prevZoomMax : FBM.ZOOM_DEFAULT_MAX;
					}
					FBM._zoomApplied = false;
				}
			};
		
			FBM.zoomOutForBuild = function () {
				FBM.applyZoomSetting();
				const m = FBM.mapBag();
				if (!m.fullZoomOut) {
					FBM.localMsg("FBM: enable Full map zoom-out in settings first.");
					return;
				}
				if (typeof ChatRoomMapViewPerceptionRange === "number" && typeof ChatRoomMapViewPerceptionRangeMax === "number") {
					ChatRoomMapViewPerceptionRange = ChatRoomMapViewPerceptionRangeMax;
				}
				if (typeof ChatRoomMapViewVisibilityMask !== "undefined") fillMask(ChatRoomMapViewVisibilityMask);
				if (typeof ChatRoomMapViewCalculatePerceptionMasks === "function") {
					try {
						ChatRoomMapViewCalculatePerceptionMasks();
					} catch (e) {
						/* ignore */
					}
					if (typeof ChatRoomMapViewVisibilityMask !== "undefined") fillMask(ChatRoomMapViewVisibilityMask);
				}
			};
		
			/* ---------- toolbar collapse + FBM tools button ---------- */
		
			FBM.MAP_EDITOR_PANEL_ID = "chat-room-map-view-panel";
		
			FBM.toolbarShouldHide = function () {
				const m = FBM.mapBag();
				return !!(m.hideBuildToolbar && !FBM._toolbarExpanded);
			};
		
			/**
			 * R132+ draws zoom/edit chrome in #chat-room-map-view-panel (always created while map is active).
			 * Hide via CSS class — do not ElementRemove (ShowEditor recreates it every DrawUi).
			 */
			FBM.syncMapEditorPanel = function () {
				const panel =
					typeof ElementWrap === "function"
						? ElementWrap(FBM.MAP_EDITOR_PANEL_ID)
						: document.getElementById(FBM.MAP_EDITOR_PANEL_ID);
				if (!panel) return false;
				const hide = FBM.toolbarShouldHide();
				panel.classList.toggle("fbm-panel-collapsed", hide);
				if (hide) {
					panel.setAttribute("aria-hidden", "true");
					panel.setAttribute("inert", "");
				} else {
					panel.removeAttribute("aria-hidden");
					panel.removeAttribute("inert");
				}
				return true;
			};
		
			/** Empty DrawButton + centered Club icon (text “+”/“−” sits off-center in small squares). */
			function drawChromeIconButton(r, iconPath) {
				DrawButton(r.x, r.y, r.w, r.h, "", "White", "");
				const pad = Math.max(3, Math.round(Math.min(r.w, r.h) * 0.12));
				if (typeof DrawImageResize === "function") {
					DrawImageResize(iconPath, r.x + pad, r.y + pad, r.w - pad * 2, r.h - pad * 2);
				} else if (typeof DrawImageEx === "function") {
					DrawImageEx(iconPath, r.x + pad, r.y + pad, { Width: r.w - pad * 2, Height: r.h - pad * 2 });
				}
			}
		
			FBM.drawMapChromeButtons = function () {
				if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return;
				FBM.syncMapEditorPanel();
				if (typeof DrawButton !== "function") return;
				const m = FBM.mapBag();
				const layout = FBM.computeMapChromeLayout();
				const draw = function () {
					if (FBM.toolbarShouldHide()) {
						drawChromeIconButton(layout.plus || FBM.TOOLBAR_PLUS, "Icons/Plus.png");
					} else if (layout.collapse) {
						drawChromeIconButton(layout.collapse, "Icons/Minus.png");
					}
					if (m.buildingTools && FBM.mapIsAdmin() && layout.fbm) {
						const r = layout.fbm;
						const on = !!FBM._buildBarOpen;
						DrawButton(r.x, r.y, r.w, r.h, "FBM", on ? "#80FF80" : "White", "");
					}
				};
				if (FBM.withLeftDrawButtons) FBM.withLeftDrawButtons(draw);
				else draw();
			};
		
			FBM.handleMapChromeClick = function () {
				const m = FBM.mapBag();
				const layout = FBM.computeMapChromeLayout();
				if (FBM.toolbarShouldHide() && mouseInRect(layout.plus || FBM.TOOLBAR_PLUS)) {
					FBM._toolbarExpanded = true;
					FBM.syncMapEditorPanel();
					return true;
				}
				if (layout.collapse && mouseInRect(layout.collapse)) {
					FBM._toolbarExpanded = false;
					FBM.syncMapEditorPanel();
					return true;
				}
				if (m.buildingTools && FBM.mapIsAdmin() && mouseInRect(layout.fbm)) {
					FBM.setBuildBarOpen(!FBM._buildBarOpen);
					return true;
				}
				/* Legacy R130 canvas left-stack click swallow */
				if (FBM.toolbarShouldHide() && typeof MouseX === "number" && MouseX <= 100 && typeof MouseY === "number" && MouseY <= 500) {
					return true;
				}
				return false;
			};
		
			/* ---------- whisper ---------- */
		
			/**
			 * Club hearing tiles for whisper. GetHearingRange() uses PerceptionRangeMax, which FBM
			 * SuperZoom raises to 50 — that must not widen whispers. Prefer Club max when not inflated.
			 */
			FBM.mapHearingRangeTiles = function () {
				let max = FBM.ZOOM_DEFAULT_MAX || 7;
				try {
					if (typeof ChatRoomMapViewPerceptionRangeMax === "number" && isFinite(ChatRoomMapViewPerceptionRangeMax)) {
						if (FBM._zoomApplied || ChatRoomMapViewPerceptionRangeMax === FBM.ZOOM_SUPER_MAX) {
							max = FBM.ZOOM_DEFAULT_MAX || 7;
						} else {
							max = ChatRoomMapViewPerceptionRangeMax;
						}
					}
				} catch (e) {
					/* ignore */
				}
				let deaf = 0;
				try {
					if (Player && typeof Player.GetDeafLevel === "function") deaf = Player.GetDeafLevel() || 0;
				} catch (e) {
					deaf = 0;
				}
				return Math.max(0, max - deaf);
			};
		
			FBM.mapHearingWhisperOk = function (C) {
				if (!C || !C.MapData || !C.MapData.Pos || !Player || !Player.MapData || !Player.MapData.Pos) return false;
				const Distance = Math.max(
					Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X),
					Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y)
				);
				if (Distance > FBM.mapHearingRangeTiles()) return false;
				/* Match Club chat hearing (walls / BlockHearing via AudibilityMask) */
				if (typeof ChatRoomMapViewCharacterIsHearable === "function") {
					try {
						return !!ChatRoomMapViewCharacterIsHearable(C);
					} catch (e) {
						return true;
					}
				}
				return true;
			};
		
			/* ---------- keyboard / typing ---------- */
		
			/** True when focus is in a field that should receive WASD as text, not map move. */
			FBM.mapTypingTargetActive = function () {
				const el = document.activeElement;
				if (!el) return false;
				const tag = (el.tagName || "").toUpperCase();
				if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
				if (el.isContentEditable) return true;
				return false;
			};
		
			FBM.clearMapMoveKeys = function () {
				try {
					if (typeof ChatRoomMapViewKeysPressed === "undefined" || !ChatRoomMapViewKeysPressed) return;
					const k = ChatRoomMapViewKeysPressed;
					if ("North" in k) {
						k.North = k.South = k.West = k.East = false;
					} else {
						k.u = k.d = k.l = k.r = false;
					}
				} catch (e) {
					/* ignore */
				}
			};
		
			/** Stop Club map keys from seeing keystrokes typed inside FBM UI. */
			FBM.installUiKeyGuard = function () {
				if (FBM._uiKeyGuardBound) return;
				FBM._uiKeyGuardBound = true;
				const guard = function (e) {
					const t = e && e.target;
					if (!t) return;
					const tag = (t.tagName || "").toUpperCase();
					const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
					if (!typing) return;
					if (!t.closest || !t.closest("#fbm-root")) return;
					e.stopPropagation();
					if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
					if (FBM.clearMapMoveKeys) FBM.clearMapMoveKeys();
				};
				document.addEventListener("keydown", guard, true);
				document.addEventListener("keyup", guard, true);
			};
		
			/* ---------- install ---------- */
		
			FBM.installMap = function () {
				FBM.applyZoomSetting();
				FBM.installDrawButtonFilter();
				FBM.patchMapViewMethods();
				if (FBM.installRoomUpdateHide) FBM.installRoomUpdateHide();
				if (FBM.installCopyEscape) FBM.installCopyEscape();
				FBM.installUiKeyGuard();
		
				FBM.tryHook("mapKeyDown", "ChatRoomMapViewKeyDown", 20, function (args, next) {
					if (FBM.mapTypingTargetActive()) {
						FBM.clearMapMoveKeys();
						return false;
					}
					return next(args);
				});
		
				FBM.tryHook("whisper", "ChatRoomMapViewCharacterOnWhisperRange", 4, function (args, next) {
					if (FBM.mapBag().hearingWhisper && FBM.mapIsMapRoom()) {
						return FBM.mapHearingWhisperOk(args[0]);
					}
					return next(args);
				});
		
				FBM.tryHook("drawGrid", "ChatRoomMapViewDrawGrid", 4, function (args, next) {
					FBM.patchMapViewMethods();
					const ret = next(args);
					const Left = args[0];
					const Top = args[1];
					const Width = args[2];
					const Height = args[3];
					FBM.mapDrawBlindfold(Left, Top, Width, Height);
					FBM.mapDrawGridOverlay(Left, Top, Width, Height);
					FBM.copyDrawHighlight(Left, Top, Width, Height);
					FBM.mapDrawTypingIndicators(Left, Top, Width, Height);
					return ret;
				});
		
				FBM.tryHook("updateFlag", "ChatRoomMapViewUpdateFlag", 4, function (args, next) {
					const ret = next(args);
					if (FBM.mapIsAdmin()) FBM.markMapDirty();
					return ret;
				});
		
				FBM.tryHook("activateView", "ChatRoomActivateView", 0, function (args, next) {
					const ret = next(args);
					FBM.installDrawButtonFilter();
					FBM.patchMapViewMethods();
					FBM.syncMapEditorPanel();
					return ret;
				});
		
				FBM.tryHook("mapActivate", "ChatRoomMapViewActivate", 0, function (args, next) {
					const ret = next(args);
					FBM.patchMapViewMethods();
					FBM.syncMapEditorPanel();
					return ret;
				});
		
				/* R132: panel is created/refreshed here — re-apply collapse after Club rebuilds children */
				FBM.tryHook("mapShowEditor", "ChatRoomMapViewShowEditor", 0, function (args, next) {
					const ret = next(args);
					FBM.syncMapEditorPanel();
					return ret;
				});
				FBM.tryHook("mapReloadEditor", "ChatRoomMapViewReloadEditorPanel", 0, function (args, next) {
					const ret = next(args);
					FBM.syncMapEditorPanel();
					return ret;
				});
			};
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

		/* ========== src/ui/styles.js ========== */
		/**
		 * Freyas Better Maps — injected CSS
		 */
		(function (FBM) {
			"use strict";
		
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
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

		/* ========== src/ui/shell.js ========== */
		/**
		 * Freyas Better Maps — draggable settings shell + Preference entry
		 */
		(function (FBM) {
			"use strict";
		
			function $(id) {
				return document.getElementById(id);
			}
		
			FBM.setStatus = function (msg) {
				const el = $("fbm-status");
				if (el) el.textContent = msg || "";
			};
		
			FBM.openPanel = function () {
				FBM.ensureUi();
				const panel = $("fbm-panel");
				if (!panel) return;
				panel.classList.add("fbm-open");
				FBM.applyUiGeometry();
				FBM.refreshSettingsUi();
			};
		
			FBM.closePanel = function () {
				const panel = $("fbm-panel");
				if (panel) panel.classList.remove("fbm-open");
				FBM.persistUiGeometry();
			};
		
			FBM.togglePanel = function () {
				const panel = $("fbm-panel");
				if (panel && panel.classList.contains("fbm-open")) FBM.closePanel();
				else FBM.openPanel();
			};
		
			FBM.applyUiGeometry = function () {
				const panel = $("fbm-panel");
				const ui = (FBM.settings && FBM.settings.ui) || {};
				if (!panel) return;
				if (ui.width) panel.style.width = ui.width + "px";
				if (ui.height) panel.style.height = ui.height + "px";
				if (ui.left != null) {
					panel.style.left = ui.left + "px";
					panel.style.right = "auto";
				}
				if (ui.top != null) panel.style.top = ui.top + "px";
			};
		
			FBM.persistUiGeometry = function () {
				const panel = $("fbm-panel");
				if (!panel || !FBM.settings) return;
				const r = panel.getBoundingClientRect();
				FBM.settings.ui = FBM.settings.ui || {};
				FBM.settings.ui.left = Math.round(r.left);
				FBM.settings.ui.top = Math.round(r.top);
				FBM.settings.ui.width = Math.round(r.width);
				FBM.settings.ui.height = Math.round(r.height);
				FBM.saveSettings();
			};
		
			function bindDrag(panel, header) {
				let dragging = false;
				let ox = 0;
				let oy = 0;
				header.addEventListener("pointerdown", function (e) {
					if (e.target.closest("button")) return;
					dragging = true;
					const r = panel.getBoundingClientRect();
					ox = e.clientX - r.left;
					oy = e.clientY - r.top;
					try {
						header.setPointerCapture(e.pointerId);
					} catch (err) {
						/* ignore */
					}
				});
				header.addEventListener("pointermove", function (e) {
					if (!dragging) return;
					panel.style.left = Math.max(0, e.clientX - ox) + "px";
					panel.style.top = Math.max(0, e.clientY - oy) + "px";
					panel.style.right = "auto";
				});
				header.addEventListener("pointerup", function () {
					dragging = false;
					FBM.persistUiGeometry();
				});
			}
		
			function aboutFeat(title, desc, steps) {
				let lis = "";
				for (let i = 0; i < steps.length; i++) {
					lis += "<li>" + steps[i] + "</li>";
				}
				return (
					'<details class="fbm-about-feat"><summary>' +
					title +
					"</summary>" +
					'<div class="fbm-about-feat-body">' +
					'<p class="fbm-about-desc">' +
					desc +
					"</p>" +
					'<p class="fbm-about-label">How to use</p>' +
					'<ul class="fbm-about-steps">' +
					lis +
					"</ul></div></details>"
				);
			}
		
			FBM.ensureUi = function () {
				if ($("fbm-root")) return;
				FBM.injectStyles();
				const root = document.createElement("div");
				root.id = "fbm-root";
				root.innerHTML =
					'<div class="fbm-build-bar" id="fbm-build-bar">' +
					'<span class="fbm-bar-grip" id="fbm-bar-grip" title="Drag" aria-label="Drag build bar">⋮⋮</span>' +
					'<button type="button" class="fbm-btn" id="fbm-bar-grid">Grid</button>' +
					'<button type="button" class="fbm-btn" id="fbm-bar-copy">Copy</button>' +
					'<button type="button" class="fbm-btn" id="fbm-bar-save" disabled>Save selection</button>' +
					'<button type="button" class="fbm-btn" id="fbm-bar-paste">Paste…</button>' +
					'<button type="button" class="fbm-btn" id="fbm-bar-settings">Settings</button>' +
					'<span class="fbm-bar-sync" id="fbm-bar-sync" hidden></span>' +
					"</div>" +
					'<div class="fbm-templates" id="fbm-templates" hidden>' +
					'<div class="fbm-templates-head"><span>Templates</span>' +
					'<button type="button" class="fbm-icon-btn" id="fbm-tpl-close" title="Close">×</button></div>' +
					'<p class="fbm-muted fbm-hint">Select a room, then click the map tile for the top-left paste origin.</p>' +
					'<div class="fbm-tpl-grid" id="fbm-tpl-grid"></div></div>' +
					'<div class="fbm-panel" id="fbm-panel">' +
					'<div class="fbm-header" id="fbm-header">' +
					'<div class="fbm-header-title">Freyas Better Maps <span class="fbm-badge">settings</span></div>' +
					'<button type="button" class="fbm-icon-btn" id="fbm-close" title="Close">×</button></div>' +
					'<div class="fbm-tabs" role="tablist">' +
					'<button type="button" class="fbm-tab fbm-on" data-tab="general">General</button>' +
					'<button type="button" class="fbm-tab" data-tab="maps">Map storage</button>' +
					'<button type="button" class="fbm-tab" data-tab="about">About</button></div>' +
					'<div class="fbm-page fbm-on" id="fbm-page-general">' +
					'<p class="fbm-muted fbm-hint">Local map helpers. Synced via ExtensionSettings. If FAM Map typing is also on, bubbles may double — turn one off.</p>' +
					'<label class="fbm-check-row"><input type="checkbox" id="fbm-typing" /> <span>Show typing bubbles on the map</span></label>' +
					'<label class="fbm-check-row"><input type="checkbox" id="fbm-hide-toolbar" /> <span>Hide Club map toolbar (R132 panel + zoom) behind a small +</span></label>' +
					'<label class="fbm-check-row"><input type="checkbox" id="fbm-building" /> <span>Allow building tools (FBM button on map bar)</span></label>' +
					'<label class="fbm-check-row"><input type="checkbox" id="fbm-blindfold" /> <span>Full blindfold (grey walls; hide your tile)</span></label>' +
					'<div class="fbm-row fbm-indent" id="fbm-blindfold-style-row">' +
					'<label class="fbm-muted" for="fbm-blindfold-style">Others look like</label>' +
					'<select id="fbm-blindfold-style">' +
					'<option value="greyscale">Greyscale models</option>' +
					'<option value="silhouette">Generic silhouette</option>' +
					"</select></div>" +
					'<label class="fbm-check-row"><input type="checkbox" id="fbm-whisper" /> <span>Whisper at hearing range (walls apply; not SuperZoom)</span></label>' +
					'<label class="fbm-check-row"><input type="checkbox" id="fbm-zoom" /> <span>Full map zoom-out (raise zoom max)</span></label>' +
					'<label class="fbm-check-row"><input type="checkbox" id="fbm-hide-room-update" /> <span>Hide duplicate “updated the room” chat spam</span></label>' +
					'<div class="fbm-row fbm-indent" id="fbm-room-update-cool-row">' +
					'<label class="fbm-muted" for="fbm-room-update-cool">Cooldown (minutes)</label>' +
					'<input type="number" id="fbm-room-update-cool" min="1" max="120" step="1" value="5" />' +
					"</div>" +
					'<div class="fbm-section"><div class="fbm-section-head">Build bar hotkey</div>' +
					'<p class="fbm-muted fbm-hint">Toggles the floating build bar when the map is active (admin). Default Alt+B. Also use the FBM button on the left map bar.</p>' +
					'<div class="fbm-row"><input type="text" id="fbm-build-hotkey" placeholder="Alt+B" maxlength="32" />' +
					'<button type="button" class="fbm-btn" id="fbm-build-hotkey-capture">Capture</button></div></div>' +
					'<div class="fbm-status" id="fbm-status"></div></div>' +
					'<div class="fbm-page" id="fbm-page-maps">' +
					'<p class="fbm-muted fbm-hint">Save uses Club map export (/mapcopy). Load requires admin (/mappaste). Limit 10 maps + 1 autosave.</p>' +
					'<div class="fbm-section"><div class="fbm-section-head">Save current map</div>' +
					'<div class="fbm-row"><input type="text" id="fbm-map-name" placeholder="Map name" maxlength="48" />' +
					'<button type="button" class="fbm-btn fbm-btn-accent" id="fbm-map-save">Save</button></div></div>' +
					'<div class="fbm-section"><div class="fbm-section-head">Load</div><div class="fbm-map-list" id="fbm-map-list"></div></div>' +
					'<div class="fbm-section"><div class="fbm-section-head">Autosave</div>' +
					'<p class="fbm-muted fbm-hint">After you edit the map, autosaves at most once per 60 seconds.</p>' +
					'<div class="fbm-map-item"><span id="fbm-autosave-label">Autosave — empty</span>' +
					'<button type="button" class="fbm-btn" id="fbm-autosave-load" disabled>Load</button></div></div></div>' +
					'<div class="fbm-page" id="fbm-page-about">' +
					'<p class="fbm-muted fbm-hint">Version <span id="fbm-about-ver"></span>. Developed by Freya (245450).</p>' +
					'<p class="fbm-muted fbm-hint">Open via Preference → Extensions → Freyas Better Maps, or the build bar <strong>Settings</strong> button.</p>' +
					'<p class="fbm-muted fbm-hint">Expand a feature below for a short description and how to use it.</p>' +
					'<div class="fbm-about-feats">' +
					aboutFeat(
						"Typing bubbles",
						"Shows a readable Talk bubble above characters who are typing on the map. Scales with zoom.",
						[
							"Turn on <strong>Show typing bubbles</strong> under General (on by default).",
							"Join a map room and type — others with FBM see your bubble.",
							"If FAM Map typing is also on, bubbles may stack; turn one off.",
						]
					) +
					aboutFeat(
						"Hide Club map toolbar",
						"Collapses Club’s left map buttons and zoom controls behind a small <strong>+</strong> so the map stays clear.",
						[
							"Enable <strong>Hide Club map toolbar</strong> under General.",
							"Click the small <strong>+</strong> on the left to expand Club’s tools again; click the <strong>−</strong> beside the Club tools to collapse.",
							"While only the tool strip is showing, <strong>−</strong> stays near the left buttons; when the tile/search panel opens fully, it moves to the right of the grey panel (aligned with the search field).",
							"Works with R132’s HTML map panel and canvas zoom buttons.",
						]
					) +
					aboutFeat(
						"Building tools &amp; build bar",
						"Optional FBM toolbar for grid, region copy/paste, zoom-out, and Settings — hidden until you need it.",
						[
							"Enable <strong>Allow building tools</strong> under General.",
							"On the map (as admin), click the <strong>FBM</strong> button (under <strong>+</strong> when collapsed, under <strong>−</strong> when the Club panel is open), or press the build-bar hotkey (default <strong>Alt+B</strong>).",
							"The bar opens at the top-center of the map area. Drag the <strong>⋮⋮</strong> grip to move it; hiding and showing the bar resets it to the default spot.",
							"Change the hotkey under General → Build bar hotkey (Capture or type e.g. Alt+B).",
							"While typing in FBM fields, WASD will not move you on the map.",
						]
					) +
					aboutFeat(
						"Grid overlay",
						"Draws a light grid every 5 tiles plus center X/Y axes to line up builds.",
						[
							"Open the build bar, then click <strong>Grid</strong> to toggle.",
							"Grid state is remembered in your settings.",
						]
					) +
					aboutFeat(
						"Copy, templates &amp; paste",
						"Select a rectangle of tiles, save it as a local template, and paste elsewhere (or later).",
						[
							"Build bar → <strong>Copy</strong>: drag or click tiles for an AABB selection (toggle tiles as needed).",
							"<strong>Save selection</strong> stores a thumbnail template in localStorage.",
							"<strong>Paste…</strong> opens the template picker; choose one, then click the map tile for the top-left origin.",
							"Press <strong>Esc</strong> to cancel copy or paste mode.",
							"Paste pushes an immediate room update (same path as Club paint).",
						]
					) +
					aboutFeat(
						"Map storage &amp; autosave",
						"Save up to 10 named maps plus one autosave slot using Club’s map export format. Load requires room admin.",
						[
							"Open Settings → <strong>Map storage</strong>.",
							"Enter a name and click <strong>Save</strong> (uses /mapcopy-style export).",
							"Click <strong>Load</strong> on a saved map (admin; applies like /mappaste and syncs the room).",
							"After you edit the map, autosave runs at most once per 60 seconds; load it from the Autosave row.",
						]
					) +
					aboutFeat(
						"Full blindfold",
						"At maximum blindness, the map becomes a short-range silhouette: walkable tiles black, walls darker grey, other blockers (doors, trees, glass, …) lighter grey. You still see your full-color avatar on your tile; adjacent players are greyscale or generic silhouettes.",
						[
							"Enable <strong>Full blindfold</strong> under General.",
							"Choose <strong>Others look like</strong>: greyscale models or generic silhouette.",
							"Equip a full blindfold in Club and stand on the map — only yourself and the 8 adjacent tiles stay visible.",
						]
					) +
					aboutFeat(
						"Hearing-range whisper",
						"Allows whispering to someone when Club considers them hearable (walls / audibility) and within hearing distance. SuperZoom’s larger view does not extend whisper range.",
						[
							"Enable <strong>Whisper at hearing range</strong> under General.",
							"On the map, open a whisper to a nearby character who can hear you.",
							"If they are blocked by walls or too far for hearing, the whisper stays blocked.",
						]
					) +
					aboutFeat(
						"Full map zoom-out",
						"Raises Club’s map zoom maximum (SuperZoom-style) so you can see more of the map at once.",
						[
							"Enable <strong>Full map zoom-out</strong> under General.",
							"Use Club’s map zoom controls to pull back.",
							"If another mod already changed the zoom max away from Club’s defaults, FBM leaves it alone.",
						]
					) +
					aboutFeat(
						"Hide room-update spam",
						"Stops identical “updated the room” chat lines from repeating while you (or others) paint. The editor still sees a short <strong>Saved &amp; synced</strong> stamp on the build bar.",
						[
							"Enable <strong>Hide duplicate “updated the room” chat spam</strong> under General.",
							"Set the cooldown in minutes (default 5) — matching updates within that window are suppressed.",
							"Useful when pasting templates or editing large regions.",
						]
					) +
					aboutFeat(
						"Install &amp; reload",
						"Runs as a Tampermonkey userscript, FUSAM loader, or bookmark that loads the gist IIFE.",
						[
							"Tampermonkey: install <code>freyas-better-maps.user.js</code>.",
							"Bookmark: run the bookmarklet; reload the page to pick up the newest gist build without logging out.",
							"Settings sync via ExtensionSettings (<code>FreyasBetterMaps</code>).",
						]
					) +
					"</div></div></div>";
				document.body.appendChild(root);
				bindDrag($("fbm-panel"), $("fbm-header"));
				$("fbm-close").addEventListener("click", function () {
					FBM.closePanel();
				});
				root.querySelectorAll(".fbm-tab").forEach(function (tab) {
					tab.addEventListener("click", function () {
						root.querySelectorAll(".fbm-tab").forEach(function (t) {
							t.classList.toggle("fbm-on", t === tab);
						});
						root.querySelectorAll(".fbm-page").forEach(function (p) {
							p.classList.toggle("fbm-on", p.id === "fbm-page-" + tab.dataset.tab);
						});
					});
				});
				if (FBM.bindSettingsUi) FBM.bindSettingsUi();
				if (FBM.bindBuildBar) FBM.bindBuildBar();
			};
		
			FBM.leavePreferenceToGame = function () {
				try {
					if (typeof PreferenceExtensionsCurrent !== "undefined" && PreferenceExtensionsCurrent) {
						try {
							PreferenceExtensionsCurrent.unload?.();
						} catch (e) {
							/* ignore */
						}
						PreferenceExtensionsCurrent = null;
					}
				} catch (e) {
					/* ignore */
				}
				try {
					if (typeof ChatRoomData !== "undefined" && ChatRoomData && typeof CommonSetScreen === "function") {
						CommonSetScreen("Online", "ChatRoom");
						return;
					}
				} catch (e) {
					/* ignore */
				}
				try {
					if (
						typeof InformationSheetReturnScreen !== "undefined" &&
						InformationSheetReturnScreen &&
						typeof CommonSetScreen === "function"
					) {
						CommonSetScreen.apply(null, InformationSheetReturnScreen);
						return;
					}
				} catch (e) {
					/* ignore */
				}
				try {
					if (typeof CommonSetScreen === "function") CommonSetScreen("Room", "MainHall");
				} catch (e) {
					/* ignore */
				}
			};
		
			FBM.registerPreference = function () {
				if (typeof PreferenceRegisterExtensionSetting !== "function") return;
				try {
					if (typeof PreferenceExtensionsSettings !== "undefined" && PreferenceExtensionsSettings.FreyasBetterMaps) return;
				} catch (e) {
					/* ignore */
				}
				PreferenceRegisterExtensionSetting({
					Identifier: "FreyasBetterMaps",
					ButtonText: "Freyas Better Maps",
					Image: "Icons/MapTypeAlways.png",
					load: function () {
						FBM.openPanel();
						FBM.leavePreferenceToGame();
					},
					run: function () {},
					click: function () {},
					exit: function () {
						return true;
					},
					unload: function () {},
				});
			};
		
			FBM.prepareReload = function () {
				["fbm-root", "fbm-styles"].forEach(function (id) {
					const el = document.getElementById(id);
					if (el && el.parentNode) el.parentNode.removeChild(el);
				});
				window.__FreyasBetterMapsPageLoaded = false;
				if (window.FreyasBetterMaps) window.FreyasBetterMaps._booted = false;
			};
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

		/* ========== src/ui/settings.js ========== */
		/**
		 * Freyas Better Maps — settings bindings
		 */
		(function (FBM) {
			"use strict";
		
			function $(id) {
				return document.getElementById(id);
			}
		
			function fmtTime(ts) {
				if (!ts) return "";
				try {
					return new Date(ts).toLocaleString();
				} catch (e) {
					return String(ts);
				}
			}
		
			FBM.refreshSettingsUi = function () {
				if (!FBM.settings) return;
				FBM.loadMapOverflow();
				const s = FBM.settings;
				const set = function (id, on) {
					const el = $(id);
					if (el) el.checked = !!on;
				};
				set("fbm-typing", s.typingIndicator);
				set("fbm-hide-toolbar", s.hideBuildToolbar);
				set("fbm-building", s.buildingTools);
				set("fbm-blindfold", s.fullBlindfold);
				set("fbm-whisper", s.hearingWhisper);
				set("fbm-zoom", s.fullZoomOut);
				set("fbm-hide-room-update", s.hideRoomUpdateSpam);
				const styleSel = $("fbm-blindfold-style");
				if (styleSel) {
					styleSel.value = s.blindfoldOthersStyle === "silhouette" ? "silhouette" : "greyscale";
					styleSel.disabled = !s.fullBlindfold;
				}
				const cool = $("fbm-room-update-cool");
				if (cool) {
					cool.value = String(s.roomUpdateHideCooldownMin != null ? s.roomUpdateHideCooldownMin : 5);
					cool.disabled = !s.hideRoomUpdateSpam;
				}
				const hk = $("fbm-build-hotkey");
				if (hk) hk.value = s.buildBarHotkey || "Alt+B";
				const ver = $("fbm-about-ver");
				if (ver) ver.textContent = FBM.VERSION || "";
		
				const list = $("fbm-map-list");
				if (list) {
					list.innerHTML = "";
					(s.maps || []).forEach(function (m) {
						if (!m) return;
						const row = document.createElement("div");
						row.className = "fbm-map-item";
						const span = document.createElement("span");
						span.innerHTML =
							"<strong></strong><div class=\"fbm-map-meta\"></div>";
						span.querySelector("strong").textContent = m.name || "Untitled";
						span.querySelector(".fbm-map-meta").textContent = fmtTime(m.savedAt) + (m.overflow ? " · overflow" : "");
						const load = document.createElement("button");
						load.type = "button";
						load.className = "fbm-btn";
						load.textContent = "Load";
						load.addEventListener("click", function () {
							FBM.loadNamedMap(m.id);
						});
						const del = document.createElement("button");
						del.type = "button";
						del.className = "fbm-btn fbm-btn-danger";
						del.textContent = "×";
						del.title = "Delete";
						del.addEventListener("click", function () {
							if (!confirm("Delete map “" + (m.name || "") + "”?")) return;
							FBM.deleteNamedMap(m.id);
							FBM.refreshSettingsUi();
							FBM.setStatus("Deleted map.");
						});
						row.appendChild(span);
						row.appendChild(load);
						row.appendChild(del);
						list.appendChild(row);
					});
					if (!(s.maps || []).length) {
						list.innerHTML = '<p class="fbm-muted fbm-hint">No saved maps yet.</p>';
					}
				}
		
				const asLabel = $("fbm-autosave-label");
				const asBtn = $("fbm-autosave-load");
				if (asLabel && asBtn) {
					if (s.autosave && (s.autosave.data || s.autosave.overflow)) {
						asLabel.textContent = "Autosave — " + fmtTime(s.autosave.savedAt);
						asBtn.disabled = false;
					} else {
						asLabel.textContent = "Autosave — empty";
						asBtn.disabled = true;
					}
				}
			};
		
			FBM.bindSettingsUi = function () {
				function bindToggle(id, key, after) {
					const el = $(id);
					if (!el || el._fbmBound) return;
					el._fbmBound = true;
					el.addEventListener("change", function () {
						FBM.settings[key] = !!el.checked;
						FBM.saveSettings();
						if (after) after(el.checked);
						FBM.setStatus((el.nextElementSibling && el.nextElementSibling.textContent) + (el.checked ? " on." : " off."));
						if (FBM.refreshBuildBar) FBM.refreshBuildBar();
					});
				}
				bindToggle("fbm-typing", "typingIndicator");
				bindToggle("fbm-hide-toolbar", "hideBuildToolbar", function () {
					FBM._toolbarExpanded = false;
					if (FBM.syncMapEditorPanel) FBM.syncMapEditorPanel();
				});
				bindToggle("fbm-building", "buildingTools");
				bindToggle("fbm-blindfold", "fullBlindfold", function () {
					const styleSel = $("fbm-blindfold-style");
					if (styleSel) styleSel.disabled = !FBM.settings.fullBlindfold;
				});
				bindToggle("fbm-whisper", "hearingWhisper");
				bindToggle("fbm-zoom", "fullZoomOut", function () {
					FBM.applyZoomSetting();
				});
				bindToggle("fbm-hide-room-update", "hideRoomUpdateSpam", function () {
					const cool = $("fbm-room-update-cool");
					if (cool) cool.disabled = !FBM.settings.hideRoomUpdateSpam;
				});
		
				const styleSel = $("fbm-blindfold-style");
				if (styleSel && !styleSel._fbmBound) {
					styleSel._fbmBound = true;
					styleSel.addEventListener("change", function () {
						FBM.settings.blindfoldOthersStyle =
							styleSel.value === "silhouette" ? "silhouette" : "greyscale";
						FBM.saveSettings();
						FBM.setStatus(
							"Blindfold others: " +
								(FBM.settings.blindfoldOthersStyle === "silhouette"
									? "generic silhouette"
									: "greyscale models") +
								"."
						);
					});
				}
		
				const cool = $("fbm-room-update-cool");
				if (cool && !cool._fbmBound) {
					cool._fbmBound = true;
					cool.addEventListener("change", function () {
						let n = Math.floor(Number(cool.value));
						if (!isFinite(n) || n < 1) n = 5;
						if (n > 120) n = 120;
						cool.value = String(n);
						FBM.settings.roomUpdateHideCooldownMin = n;
						FBM.saveSettings();
						FBM.setStatus("Room-update hide cooldown: " + n + " min.");
					});
				}
		
				const hk = $("fbm-build-hotkey");
				if (hk && !hk._fbmBound) {
					hk._fbmBound = true;
					hk.addEventListener("change", function () {
						const v = (hk.value || "").trim() || "Alt+B";
						hk.value = v;
						FBM.settings.buildBarHotkey = v;
						FBM.saveSettings();
						FBM.setStatus("Build bar hotkey: " + v);
					});
				}
				const cap = $("fbm-build-hotkey-capture");
				if (cap && !cap._fbmBound) {
					cap._fbmBound = true;
					cap.addEventListener("click", function () {
						if (FBM._capturingHotkey) return;
						FBM._capturingHotkey = true;
						const prevLabel = cap.textContent;
						cap.textContent = "Listening…";
						FBM.setStatus("Press a shortcut (e.g. Alt+B)… Esc cancels.");
						let timer = null;
						function finish(spec) {
							FBM._capturingHotkey = false;
							document.removeEventListener("keydown", onKey, true);
							if (timer) clearTimeout(timer);
							cap.textContent = prevLabel || "Capture";
							if (spec) {
								FBM.settings.buildBarHotkey = spec;
								if (hk) hk.value = spec;
								FBM.saveSettings();
								FBM.setStatus("Build bar hotkey: " + spec);
							} else {
								FBM.setStatus("Hotkey capture cancelled.");
							}
						}
						function onKey(e) {
							e.preventDefault();
							e.stopPropagation();
							const raw = e.key || "";
							if (raw === "Escape") {
								finish(null);
								return;
							}
							/* Modifier-only: keep listening (Alt then B arrives as two events). */
							if (!raw || raw === "Control" || raw === "Alt" || raw === "Shift" || raw === "Meta") return;
							const parts = [];
							if (e.ctrlKey) parts.push("Ctrl");
							if (e.altKey) parts.push("Alt");
							if (e.shiftKey) parts.push("Shift");
							if (e.metaKey) parts.push("Meta");
							let key = raw;
							const code = e.code || "";
							if (/^Key[A-Z]$/i.test(code)) key = code.slice(3).toUpperCase();
							else if (/^Digit[0-9]$/.test(code)) key = code.slice(5);
							else if (key.length === 1) key = key.toUpperCase();
							parts.push(key);
							finish(parts.join("+"));
						}
						document.addEventListener("keydown", onKey, true);
						timer = setTimeout(function () {
							finish(null);
						}, 10000);
					});
				}
		
				const saveBtn = $("fbm-map-save");
				if (saveBtn && !saveBtn._fbmBound) {
					saveBtn._fbmBound = true;
					saveBtn.addEventListener("click", function () {
						const name = ($("fbm-map-name").value || "").trim();
						FBM.saveNamedMap(name);
						$("fbm-map-name").value = "";
						FBM.refreshSettingsUi();
					});
				}
				const asBtn = $("fbm-autosave-load");
				if (asBtn && !asBtn._fbmBound) {
					asBtn._fbmBound = true;
					asBtn.addEventListener("click", function () {
						FBM.loadAutosave();
					});
				}
			};
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

		/* ========== src/ui/buildBar.js ========== */
		/**
		 * Freyas Better Maps — building action bar + template picker
		 */
		(function (FBM) {
			"use strict";
		
			function $(id) {
				return document.getElementById(id);
			}
		
			FBM.setBuildBarOpen = function (on) {
				FBM._buildBarOpen = !!on;
				if (!FBM._buildBarOpen) {
					/* Hide → show always respawns at the default map-center position. */
					FBM._buildBarPos = null;
					FBM._buildBarDragging = false;
					if (FBM.hideTemplatesUi) FBM.hideTemplatesUi();
				}
				FBM.refreshBuildBar();
				return FBM._buildBarOpen;
			};
		
			FBM.toggleBuildBar = function () {
				return FBM.setBuildBarOpen(!FBM._buildBarOpen);
			};
		
			FBM.buildBarShouldShow = function () {
				const m = FBM.mapBag();
				if (!m.buildingTools) return false;
				if (!FBM._buildBarOpen) return false;
				if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return false;
				if (!FBM.mapIsMapRoom()) return false;
				if (!FBM.mapIsAdmin()) return false;
				return true;
			};
		
			FBM.getMainCanvasEl = function () {
				try {
					if (typeof MainCanvas !== "undefined" && MainCanvas && MainCanvas.canvas) return MainCanvas.canvas;
				} catch (e) {
					/* ignore */
				}
				return document.getElementById("MainCanvas");
			};
		
			/** Club logical coords (2000×1000) → client pixels; map is left 1000×1000. */
			FBM.mapAreaGeometry = function () {
				const c = FBM.getMainCanvasEl();
				if (!c || !c.getBoundingClientRect) return null;
				const r = c.getBoundingClientRect();
				if (!r.width || !r.height) return null;
				return {
					left: r.left,
					top: r.top,
					width: r.width / 2,
					height: r.height,
					centerX: r.left + r.width / 4,
					/* Top padding inside the map (Club Y ≈ 18) */
					barTop: r.top + (18 / 1000) * r.height,
				};
			};
		
			FBM.layoutBuildBar = function () {
				const bar = $("fbm-build-bar");
				if (!bar) return;
				const geo = FBM.mapAreaGeometry();
				const tpl = $("fbm-templates");
				const userPos = FBM._buildBarPos;
		
				if (userPos) {
					bar.classList.add("fbm-bar-placed");
					bar.style.left = userPos.left + "px";
					bar.style.top = userPos.top + "px";
					bar.style.transform = "none";
					bar.style.maxWidth = geo ? Math.max(200, geo.width - 12) + "px" : "min(980px, 48vw)";
				} else if (!geo) {
					bar.classList.remove("fbm-bar-placed");
					bar.style.left = "25%";
					bar.style.top = "12px";
					bar.style.transform = "translateX(-50%)";
					bar.style.maxWidth = "min(980px, 48vw)";
				} else {
					/* Default spawn: top-center of the map area. */
					bar.classList.remove("fbm-bar-placed");
					bar.style.left = geo.centerX + "px";
					bar.style.top = Math.max(4, geo.barTop) + "px";
					bar.style.transform = "translateX(-50%)";
					bar.style.maxWidth = Math.max(200, geo.width - 12) + "px";
				}
		
				if (tpl && !tpl.hidden) {
					const br = bar.getBoundingClientRect();
					const anchorX = userPos ? br.left + br.width / 2 : geo ? geo.centerX : br.left + br.width / 2;
					tpl.style.left = Math.round(anchorX) + "px";
					tpl.style.top = Math.round(br.bottom + 8) + "px";
					tpl.style.transform = "translateX(-50%)";
					const maxW = geo ? geo.width - 12 : window.innerWidth - 24;
					tpl.style.width = Math.min(560, Math.max(260, maxW)) + "px";
					tpl.style.maxHeight = Math.max(160, Math.min(420, window.innerHeight - br.bottom - 24)) + "px";
				}
			};
		
			FBM.bindBuildBarDrag = function () {
				const bar = $("fbm-build-bar");
				const grip = $("fbm-bar-grip");
				if (!bar || !grip || grip._fbmBound) return;
				grip._fbmBound = true;
				let dragging = false;
				let ox = 0;
				let oy = 0;
				grip.addEventListener("pointerdown", function (e) {
					if (e.button != null && e.button !== 0) return;
					dragging = true;
					FBM._buildBarDragging = true;
					const r = bar.getBoundingClientRect();
					ox = e.clientX - r.left;
					oy = e.clientY - r.top;
					bar.classList.add("fbm-bar-placed");
					bar.style.left = r.left + "px";
					bar.style.top = r.top + "px";
					bar.style.transform = "none";
					try {
						grip.setPointerCapture(e.pointerId);
					} catch (err) {
						/* ignore */
					}
					e.preventDefault();
				});
				grip.addEventListener("pointermove", function (e) {
					if (!dragging) return;
					const left = Math.max(0, Math.min(window.innerWidth - 40, e.clientX - ox));
					const top = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - oy));
					bar.style.left = left + "px";
					bar.style.top = top + "px";
					const tpl = $("fbm-templates");
					if (tpl && !tpl.hidden) {
						const br = bar.getBoundingClientRect();
						tpl.style.left = Math.round(br.left + br.width / 2) + "px";
						tpl.style.top = Math.round(br.bottom + 8) + "px";
						tpl.style.transform = "translateX(-50%)";
					}
				});
				function endDrag() {
					if (!dragging) return;
					dragging = false;
					FBM._buildBarDragging = false;
					const r = bar.getBoundingClientRect();
					FBM._buildBarPos = { left: Math.round(r.left), top: Math.round(r.top) };
				}
				grip.addEventListener("pointerup", endDrag);
				grip.addEventListener("pointercancel", endDrag);
			};
		
			FBM._ensureBuildBarLayoutWatch = function () {
				if (FBM._buildBarLayoutBound) return;
				FBM._buildBarLayoutBound = true;
				const relayout = function () {
					if (FBM.layoutBuildBar) FBM.layoutBuildBar();
				};
				window.addEventListener("resize", relayout);
				if (window.visualViewport) {
					window.visualViewport.addEventListener("resize", relayout);
					window.visualViewport.addEventListener("scroll", relayout);
				}
			};
		
			FBM.refreshBuildBar = function () {
				FBM.ensureUi();
				const bar = $("fbm-build-bar");
				if (!bar) return;
				const show = FBM.buildBarShouldShow();
				bar.classList.toggle("fbm-show", show);
				if (!show) {
					FBM._buildBarPos = null;
					FBM._buildBarDragging = false;
					bar.classList.remove("fbm-bar-placed");
					bar.style.left = "";
					bar.style.top = "";
					bar.style.transform = "";
					bar.style.maxWidth = "";
				}
				const gridBtn = $("fbm-bar-grid");
				if (gridBtn) gridBtn.classList.toggle("fbm-on", !!(FBM.settings && FBM.settings.gridOn));
				const saveBtn = $("fbm-bar-save");
				if (saveBtn) saveBtn.disabled = !(FBM._copy && FBM._copy.mode === "edit" && Object.keys(FBM._copy.cells || {}).length);
				const copyBtn = $("fbm-bar-copy");
				if (copyBtn) {
					const on = FBM._copy && (FBM._copy.mode === "a" || FBM._copy.mode === "b" || FBM._copy.mode === "edit");
					copyBtn.classList.toggle("fbm-on", !!on);
				}
				const pasteBtn = $("fbm-bar-paste");
				if (pasteBtn) pasteBtn.classList.toggle("fbm-on", !!(FBM._copy && FBM._copy.mode === "paste"));
				const sync = $("fbm-bar-sync");
				if (sync) {
					if (FBM._roomSyncSavedAt) {
						const t = FBM.formatSyncTime ? FBM.formatSyncTime(FBM._roomSyncSavedAt) : "";
						sync.textContent = t ? "Saved & synced · " + t : "Saved & synced";
						sync.hidden = false;
					} else {
						sync.textContent = "";
						sync.hidden = true;
					}
				}
				if (show) {
					FBM._ensureBuildBarLayoutWatch();
					if (FBM.bindBuildBarDrag) FBM.bindBuildBarDrag();
					if (!FBM._buildBarDragging) FBM.layoutBuildBar();
					if (!FBM._buildBarRaf) {
						const tick = function () {
							FBM._buildBarRaf = 0;
							if (!FBM.buildBarShouldShow()) return;
							if (!FBM._buildBarDragging) FBM.layoutBuildBar();
							FBM._buildBarRaf = requestAnimationFrame(tick);
						};
						FBM._buildBarRaf = requestAnimationFrame(tick);
					}
				} else if (FBM._buildBarRaf) {
					cancelAnimationFrame(FBM._buildBarRaf);
					FBM._buildBarRaf = 0;
				}
			};
		
			FBM.refreshTemplatesUi = function () {
				FBM.loadTemplates();
				const grid = $("fbm-tpl-grid");
				if (!grid) return;
				grid.innerHTML = "";
				(FBM.templates || []).forEach(function (t) {
					const card = document.createElement("div");
					card.className = "fbm-tpl-card";
					const del = document.createElement("button");
					del.type = "button";
					del.className = "fbm-tpl-del";
					del.title = "Delete";
					del.textContent = "×";
					del.addEventListener("click", function (e) {
						e.stopPropagation();
						if (!confirm("Delete template “" + (t.name || "") + "”?")) return;
						FBM.copyDeleteTemplate(t.id);
					});
					const img = document.createElement(t.thumb ? "img" : "div");
					img.className = "fbm-tpl-thumb";
					if (t.thumb) {
						img.src = t.thumb;
						img.alt = "";
					}
					const name = document.createElement("div");
					name.textContent = t.name || "Room";
					const size = document.createElement("div");
					size.className = "fbm-tpl-size";
					size.textContent = (t.w || "?") + " × " + (t.h || "?");
					card.appendChild(del);
					card.appendChild(img);
					card.appendChild(name);
					card.appendChild(size);
					card.addEventListener("click", function () {
						FBM.copyBeginPaste(t.id);
					});
					grid.appendChild(card);
				});
				if (!(FBM.templates || []).length) {
					grid.innerHTML = '<p class="fbm-muted fbm-hint">No templates yet. Use Copy → Save selection.</p>';
				}
			};
		
			FBM.showTemplatesUi = function () {
				FBM.ensureUi();
				const el = $("fbm-templates");
				if (!el) return;
				el.hidden = false;
				FBM.refreshTemplatesUi();
				if (FBM.layoutBuildBar) FBM.layoutBuildBar();
			};
		
			FBM.hideTemplatesUi = function () {
				const el = $("fbm-templates");
				if (el) el.hidden = true;
			};
		
			FBM.bindBuildBar = function () {
				const gridBtn = $("fbm-bar-grid");
				if (gridBtn && !gridBtn._fbmBound) {
					gridBtn._fbmBound = true;
					gridBtn.addEventListener("click", function () {
						FBM.settings.gridOn = !FBM.settings.gridOn;
						FBM.saveSettings();
						FBM.refreshBuildBar();
					});
				}
				const copyBtn = $("fbm-bar-copy");
				if (copyBtn && !copyBtn._fbmBound) {
					copyBtn._fbmBound = true;
					copyBtn.addEventListener("click", function () {
						if (FBM._copy && FBM._copy.mode) FBM.copyReset();
						else FBM.copyStart();
						FBM.refreshBuildBar();
					});
				}
				const saveBtn = $("fbm-bar-save");
				if (saveBtn && !saveBtn._fbmBound) {
					saveBtn._fbmBound = true;
					saveBtn.addEventListener("click", function () {
						const name = prompt("Template name", "Room");
						if (name == null) return;
						FBM.copySaveTemplate(name);
						FBM.refreshBuildBar();
					});
				}
				const pasteBtn = $("fbm-bar-paste");
				if (pasteBtn && !pasteBtn._fbmBound) {
					pasteBtn._fbmBound = true;
					pasteBtn.addEventListener("click", function () {
						FBM.showTemplatesUi();
					});
				}
				const settingsBtn = $("fbm-bar-settings");
				if (settingsBtn && !settingsBtn._fbmBound) {
					settingsBtn._fbmBound = true;
					settingsBtn.addEventListener("click", function () {
						if (FBM.togglePanel) FBM.togglePanel();
						else if (FBM.openPanel) FBM.openPanel();
					});
				}
				if (FBM.bindBuildBarDrag) FBM.bindBuildBarDrag();
				const closeTpl = $("fbm-tpl-close");
				if (closeTpl && !closeTpl._fbmBound) {
					closeTpl._fbmBound = true;
					closeTpl.addEventListener("click", function () {
						FBM.hideTemplatesUi();
					});
				}
			};
		
			/** Parse "Alt+B" / "Ctrl+Shift+M" style shortcuts. */
			FBM.hotkeyMatches = function (e, spec) {
				const s = String(spec || "").trim();
				if (!s || !e) return false;
				const parts = s.split("+").map(function (p) {
					return p.trim().toLowerCase();
				});
				if (!parts.length) return false;
				const key = parts[parts.length - 1];
				const needAlt = parts.indexOf("alt") !== -1;
				const needCtrl = parts.indexOf("ctrl") !== -1 || parts.indexOf("control") !== -1;
				const needShift = parts.indexOf("shift") !== -1;
				const needMeta = parts.indexOf("meta") !== -1 || parts.indexOf("cmd") !== -1;
				if (!!e.altKey !== needAlt) return false;
				if (!!e.ctrlKey !== needCtrl) return false;
				if (!!e.shiftKey !== needShift) return false;
				if (!!e.metaKey !== needMeta) return false;
				const ek = (e.key || "").toLowerCase();
				const ec = (e.code || "").toLowerCase();
				if (key === ek) return true;
				if (key.length === 1 && ec === "key" + key) return true;
				if (/^digit[0-9]$/.test(ec) && key === ec.slice(5)) return true;
				return false;
			};
		
			FBM.installBuildBarHotkey = function () {
				if (FBM._hotkeyBound) return;
				FBM._hotkeyBound = true;
				document.addEventListener(
					"keydown",
					function (e) {
						if (!FBM.settings || !FBM.settings.buildingTools) return;
						if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return;
						if (!FBM.mapIsAdmin()) return;
						const t = e.target;
						if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
						const spec = FBM.settings.buildBarHotkey || "Alt+B";
						if (!FBM.hotkeyMatches(e, spec)) return;
						e.preventDefault();
						e.stopPropagation();
						FBM.toggleBuildBar();
						FBM.localMsg(FBM._buildBarOpen ? "FBM: build bar on." : "FBM: build bar off.");
					},
					true
				);
			};
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

		/* ========== src/main.js ========== */
		/**
		 * Freyas Better Maps — boot after login
		 */
		(function (FBM) {
			"use strict";
		
			function hasAccount() {
				return typeof Player !== "undefined" && Player && Player.MemberNumber != null;
			}
		
			function ready() {
				return (
					hasAccount() &&
					typeof document !== "undefined" &&
					document.body &&
					typeof PreferenceRegisterExtensionSetting === "function"
				);
			}
		
			FBM.boot = function () {
				if (FBM._booted) return;
				if (!ready()) return;
				FBM._booted = true;
				FBM.registerBcModSdk();
				FBM.loadSettings();
				FBM.loadMapOverflow();
				FBM.loadTemplates();
				FBM._buildBarOpen = false;
				FBM.ensureUi();
				FBM.registerPreference();
				FBM.installMap();
				FBM.installDrawButtonFilter();
				FBM.patchMapViewMethods();
				FBM.applyZoomSetting();
				FBM.installBuildBarHotkey();
		
				FBM.tryHook("chatRoomLoad", "ChatRoomLoad", 0, function (args, next) {
					const ret = next(args);
					FBM.installMap();
					FBM.installDrawButtonFilter();
					FBM.patchMapViewMethods();
					FBM.refreshBuildBar();
					return ret;
				});
		
				console.info("[FBM] Freyas Better Maps v" + FBM.VERSION + " ready");
			};
		
			function waitBoot() {
				if (ready()) {
					FBM.boot();
					return;
				}
				setTimeout(waitBoot, 250);
			}
		
			waitBoot();
		})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});
	});
})();

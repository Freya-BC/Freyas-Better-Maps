/* Freyas Better Maps v1.0.1 — page-context IIFE. Bookmark gist / FUSAM sibling. */
(function () {
	"use strict";
	if (window.__FreyasBetterMapsPageLoaded) return;
	window.__FreyasBetterMapsPageLoaded = true;
(() => {
  // src/fbm.ts
  var FBM = {};
  window.FreyasBetterMaps = FBM;
  window.FBM = FBM;

  // src/defaults.ts
  FBM.VERSION = "1.0.1";
  FBM.FULL_NAME = "Freyas Better Maps";
  FBM.EXTENSION_KEY = "FreyasBetterMaps";
  FBM.EXTENSION_KEY_MAPS = "FreyasBetterMapsMaps";
  FBM.BOOKMARK_GIST_ID = "4eabb4efd75be5de6602bb0a31d5479b";
  FBM.REPO_URL = "https://github.com/Freya-BC/Freyas-Better-Maps";
  FBM.RAW_SCRIPT_URL = "https://freya-bc.github.io/Freyas-Better-Maps/freyas-better-maps.js";
  FBM.RAW_LOADER_URL = "https://freya-bc.github.io/Freyas-Better-Maps/loader.js";
  FBM.DOCS_URL = "https://freya-bc.github.io/Freyas-Better-Maps/";
  FBM.CHANGELOG_ID = "r134-major";
  FBM.LZ_PREFIX = "FBMLz1:";
  FBM.LZ_FORMAT = "FBMLz";
  FBM.LZ_MIN = 800;
  FBM.MAP_MAX = 10;
  FBM.AUTOSAVE_COOLDOWN_MS = 6e4;
  FBM.ES_MAPS_MAX_BYTES = 15e4;
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
      height: 640
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
        height: 480
      }
    },
    maps: [],
    autosave: null,
    /** Last changelog id the player chose “Don’t show again” for. */
    dismissedChangelogId: ""
  };

  // src/core/lz.ts
  function lz() {
    try {
      if (typeof LZString !== "undefined" && LZString) return LZString;
    } catch (e) {
    }
    try {
      if (typeof window !== "undefined" && window.LZString) return window.LZString;
    } catch (e) {
    }
    return null;
  }
  FBM.lzAvailable = function() {
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
  FBM.lzUnpack = function(raw) {
    if (raw == null || raw === "") return null;
    if (typeof raw === "object") {
      const env = raw;
      if (env.format === (FBM.LZ_FORMAT || "FBMLz") && env.data) return unpackEnvelope(env);
      return raw;
    }
    if (typeof raw !== "string") return null;
    const prefixB64 = FBM.LZ_PREFIX_B64 || "FBMLz2:";
    if (raw.indexOf(prefixB64) === 0) {
      const Lb = lz();
      if (!Lb || !Lb.decompressFromBase64) return null;
      let plainB64 = null;
      try {
        plainB64 = Lb.decompressFromBase64(raw.slice(prefixB64.length));
      } catch (e) {
        return null;
      }
      return plainB64 ? parseJson(plainB64) : null;
    }
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
  FBM.lzPackLocal = function(obj) {
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
  FBM.lzReadLocal = function(raw) {
    const parsed = FBM.lzUnpack(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  };
  FBM.lzPackSync = function(obj) {
    const json = JSON.stringify(obj);
    const min = FBM.LZ_MIN || 800;
    const L = lz();
    if (!L || typeof L.compressToBase64 !== "function" || json.length < min) return json;
    try {
      const packed = L.compressToBase64(json);
      if (!packed || packed.length + 7 >= json.length) return json;
      return (FBM.LZ_PREFIX_B64 || "FBMLz2:") + packed;
    } catch (e) {
      return json;
    }
  };

  // src/core/storage.ts
  function memberKey(suffix) {
    const n = typeof Player !== "undefined" && Player && Player.MemberNumber != null ? Player.MemberNumber : "0";
    return FBM.EXTENSION_KEY + "_" + n + (suffix ? "_" + suffix : "");
  }
  function cloneDefaults() {
    return JSON.parse(JSON.stringify(FBM.DEFAULT_SETTINGS || {}));
  }
  FBM.normalizeSettings = function(raw) {
    const d = cloneDefaults();
    const s = raw && typeof raw === "object" ? raw : {};
    const out = Object.assign({}, d, s);
    out.version = FBM.VERSION;
    out.typingIndicator = s.typingIndicator !== false;
    out.hideBuildToolbar = s.hideBuildToolbar !== false;
    out.buildingTools = s.buildingTools !== false;
    out.fullBlindfold = !!s.fullBlindfold;
    out.blindfoldOthersStyle = s.blindfoldOthersStyle === "silhouette" ? "silhouette" : "greyscale";
    out.hearingWhisper = !!s.hearingWhisper;
    out.fullZoomOut = !!s.fullZoomOut;
    out.hideRoomUpdateSpam = !!s.hideRoomUpdateSpam;
    {
      const cool = Number(s.roomUpdateHideCooldownMin);
      out.roomUpdateHideCooldownMin = isFinite(cool) && cool >= 1 ? Math.min(120, Math.floor(cool)) : d.roomUpdateHideCooldownMin || 5;
    }
    out.hideArrowKeys = !!s.hideArrowKeys;
    out.gridOn = !!s.gridOn;
    out.showInvisibleWalls = !!s.showInvisibleWalls;
    out.copyObjectSettings = s.copyObjectSettings !== false;
    out.buildBarHotkey = typeof s.buildBarHotkey === "string" && s.buildBarHotkey.trim() ? s.buildBarHotkey.trim() : d.buildBarHotkey || "Alt+B";
    out.ui = Object.assign({}, d.ui, s.ui && typeof s.ui === "object" ? s.ui : {});
    {
      const dfc = d.floatChat || {};
      const sfc = s.floatChat && typeof s.floatChat === "object" ? s.floatChat : {};
      const styleRaw = String(sfc.style || dfc.style || "dark");
      const style = styleRaw === "light" || styleRaw === "custom" ? styleRaw : "dark";
      let fontSize = Number(sfc.fontSize != null ? sfc.fontSize : dfc.fontSize);
      if (!isFinite(fontSize) || fontSize < 11) fontSize = 13;
      if (fontSize > 18) fontSize = 18;
      let transparency = Number(
        sfc.transparency != null ? sfc.transparency : dfc.transparency != null ? dfc.transparency : 15
      );
      if (!isFinite(transparency)) transparency = 15;
      transparency = Math.max(0, Math.min(60, Math.round(transparency)));
      const trustedRaw = Array.isArray(sfc.trustedHosts) ? sfc.trustedHosts : Array.isArray(dfc.trustedHosts) ? dfc.trustedHosts : [];
      const trustedHosts = [];
      for (let i = 0; i < trustedRaw.length; i++) {
        const h = String(trustedRaw[i] || "").trim().replace(/\/$/, "");
        if (!h || trustedHosts.indexOf(h) >= 0) continue;
        try {
          const u = new URL(h.includes("://") ? h : "https://" + h);
          if (u.protocol === "http:" || u.protocol === "https:") {
            trustedHosts.push(u.origin);
          }
        } catch (e) {
        }
      }
      const ownNamesRaw = Array.isArray(sfc.ownNames) ? sfc.ownNames : Array.isArray(dfc.ownNames) ? dfc.ownNames : [];
      const ownNames = [];
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
        hotkey: typeof sfc.hotkey === "string" && String(sfc.hotkey).trim() ? String(sfc.hotkey).trim() : dfc.hotkey || "Alt+C",
        hidden: !!sfc.hidden,
        style,
        fontSize: Math.floor(fontSize),
        transparency,
        fontFamily: typeof sfc.fontFamily === "string" && sfc.fontFamily.trim() ? sfc.fontFamily : dfc.fontFamily || "system-ui, -apple-system, Segoe UI, sans-serif",
        customCss: typeof sfc.customCss === "string" ? sfc.customCss : dfc.customCss || "",
        trustedHosts,
        highlightOwn: !!sfc.highlightOwn,
        ownNames,
        ownHighlightSeidr: sfc.ownHighlightSeidr !== false,
        ownHighlightColor: ownColor,
        highlightOthers: !!sfc.highlightOthers,
        whisperAvatar: !!sfc.whisperAvatar,
        mapCompass: !!sfc.mapCompass,
        confirmLeave: !!sfc.confirmLeave,
        oocProtection: sfc.oocProtection !== false,
        membersHeightPct: (function() {
          const n = Number(sfc.membersHeightPct != null ? sfc.membersHeightPct : dfc.membersHeightPct);
          if (!isFinite(n)) return 30;
          return Math.max(15, Math.min(70, Math.round(n)));
        })(),
        ui: Object.assign(
          {
            left: null,
            top: null,
            width: 380,
            height: 480
          },
          dfc.ui || {},
          sfc.ui && typeof sfc.ui === "object" ? sfc.ui : {}
        )
      };
    }
    out.maps = Array.isArray(s.maps) ? s.maps.slice(0, FBM.MAP_MAX || 10) : [];
    out.autosave = s.autosave && typeof s.autosave === "object" ? s.autosave : null;
    out.dismissedChangelogId = typeof s.dismissedChangelogId === "string" ? s.dismissedChangelogId : d.dismissedChangelogId || "";
    return out;
  };
  var memo = {};
  var pending = {};
  var sent = {};
  var flushTimer = null;
  function keySettings() {
    return FBM.EXTENSION_KEY;
  }
  function keyMaps() {
    return FBM.EXTENSION_KEY_MAPS || FBM.EXTENSION_KEY + "Maps";
  }
  function esBag() {
    if (typeof Player === "undefined" || !Player) return null;
    if (!Player.ExtensionSettings) Player.ExtensionSettings = {};
    return Player.ExtensionSettings;
  }
  function lsRead(suffix) {
    try {
      const raw = localStorage.getItem(memberKey(suffix));
      return raw ? FBM.lzReadLocal(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function lsWrite(suffix, value) {
    try {
      localStorage.setItem(memberKey(suffix), value);
    } catch (e) {
      console.warn("[FBM] localStorage save " + suffix, e);
    }
  }
  function lsRemove(suffix) {
    try {
      localStorage.removeItem(memberKey(suffix));
    } catch (e) {
    }
  }
  function splitSettings(s) {
    const fc = s.floatChat || {};
    const synced = Object.assign({}, s);
    delete synced.ui;
    delete synced.maps;
    delete synced.autosave;
    delete synced.dismissedChangelogId;
    const fcSynced = Object.assign({}, fc);
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
        dismissedChangelogId: s.dismissedChangelogId
      },
      autosave: s.autosave || null
    };
  }
  function packMaps(maps) {
    const cap = FBM.ES_MAPS_MAX_BYTES || 15e4;
    const list = maps.slice();
    let packed = FBM.lzPackSync({ migrated: 2, maps: list });
    for (let i = list.length - 1; i >= 0 && packed.length > cap; i--) {
      const m = list[i];
      if (!m || m.overflow) continue;
      list[i] = { id: m.id, name: m.name, savedAt: m.savedAt, overflow: true };
      packed = FBM.lzPackSync({ migrated: 2, maps: list });
    }
    return packed;
  }
  function mergeLocalMaps(maps) {
    const existing = lsRead("maps");
    const byId = {};
    if (existing && Array.isArray(existing.maps)) {
      existing.maps.forEach(function(m) {
        if (m && m.id && !m.overflow) byId[m.id] = m;
      });
    }
    return maps.map(function(m) {
      return m && m.overflow && byId[m.id] ? byId[m.id] : m;
    });
  }
  function scheduleFlush() {
    if (flushTimer != null) return;
    flushTimer = setTimeout(function() {
      flushTimer = null;
      FBM.flushSettings();
    }, FBM.ES_FLUSH_MS || 1500);
  }
  FBM.flushSettings = function() {
    if (flushTimer != null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    const es = esBag();
    if (!es) return false;
    let any = false;
    [keySettings(), keyMaps()].forEach(function(key) {
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
  FBM.installStorageFlush = function() {
    if (FBM._storageFlushInstalled) return;
    FBM._storageFlushInstalled = true;
    FBM.tryHook("settingsFlushLeave", "ChatRoomLeave", 0, function(args, next) {
      try {
        FBM.flushSettings();
      } catch (e) {
      }
      return next(args);
    });
    const flush = function() {
      try {
        FBM.flushSettings();
      } catch (e) {
      }
    };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
  };
  FBM.resetStorageState = function() {
    Object.keys(memo).forEach(function(k) {
      delete memo[k];
    });
    Object.keys(pending).forEach(function(k) {
      delete pending[k];
    });
    Object.keys(sent).forEach(function(k) {
      delete sent[k];
    });
    if (flushTimer != null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  };
  FBM.loadSettings = function() {
    const es = esBag();
    let main = null;
    if (es && es[keySettings()]) main = FBM.lzReadLocal(es[keySettings()]);
    if (!main) main = lsRead("settings");
    const legacy = !!main && main.migrated !== 2;
    const out = Object.assign({}, main || {});
    if (!legacy) {
      let mapsObj = es && es[keyMaps()] ? FBM.lzReadLocal(es[keyMaps()]) : null;
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
      try {
        FBM.loadMapOverflow();
      } catch (e) {
      }
      FBM.saveSettings();
      FBM.flushSettings();
    }
    return FBM.settings;
  };
  FBM.saveSettings = function() {
    if (!FBM.settings) FBM.loadSettings();
    FBM.settings.version = FBM.VERSION;
    const parts = splitSettings(FBM.settings);
    const es = esBag();
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
  FBM.loadMapOverflow = function() {
    try {
      const data = lsRead("maps");
      if (!data) return;
      if (Array.isArray(data.maps) && FBM.settings) {
        const byId = {};
        data.maps.forEach(function(m) {
          if (m && m.id) byId[m.id] = m;
        });
        FBM.settings.maps = (FBM.settings.maps || []).map(function(m) {
          if (m && m.overflow && byId[m.id] && !byId[m.id].overflow) return byId[m.id];
          return m;
        });
        if ((!FBM.settings.maps.length || FBM.settings.maps.every(function(m) {
          return m.overflow;
        })) && data.maps.length) {
          FBM.settings.maps = data.maps.slice(0, FBM.MAP_MAX || 10);
        }
      }
      if (data.autosave && FBM.settings && (!FBM.settings.autosave || FBM.settings.autosave.overflow)) {
        FBM.settings.autosave = data.autosave;
      }
    } catch (e) {
    }
  };
  FBM.templatesKey = function() {
    return memberKey("templates");
  };
  FBM.loadTemplates = function() {
    try {
      const raw = localStorage.getItem(FBM.templatesKey());
      const data = raw ? FBM.lzReadLocal(raw) : null;
      FBM.templates = Array.isArray(data) ? data : Array.isArray(data && data.templates) ? data.templates : [];
    } catch (e) {
      FBM.templates = [];
    }
    return FBM.templates;
  };
  FBM.saveTemplates = function() {
    try {
      localStorage.setItem(FBM.templatesKey(), FBM.lzPackLocal({ templates: FBM.templates || [] }));
    } catch (e) {
      console.warn("[FBM] templates save", e);
    }
  };

  // src/core/sdk.ts
  FBM.resolveGlobalPath = function(name) {
    if (!name || typeof name !== "string") return void 0;
    const parts = name.split(".");
    let cur = globalThis;
    for (let i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== "object" && typeof cur !== "function") return void 0;
      cur = cur[parts[i]];
    }
    return cur;
  };
  FBM.registerBcModSdk = function() {
    if (FBM.bcMod) return FBM.bcMod;
    if (typeof bcModSdk !== "undefined" && bcModSdk && typeof bcModSdk.registerMod === "function") {
      const info = {
        name: "FreyasBetterMaps",
        fullName: FBM.FULL_NAME || "Freyas Better Maps",
        version: FBM.VERSION,
        ...FBM.REPO_URL ? { repository: FBM.REPO_URL } : {}
      };
      FBM.bcMod = bcModSdk.registerMod(info);
    }
    return FBM.bcMod || null;
  };
  FBM.hookFunction = function(name, priority, hook) {
    const sdk = FBM.registerBcModSdk();
    if (sdk && typeof sdk.hookFunction === "function") {
      sdk.hookFunction(name, priority, hook);
      return true;
    }
    const parts = String(name || "").split(".");
    if (parts.length === 1) {
      const win = window;
      const original2 = win[name];
      if (typeof original2 !== "function") {
        console.warn("[FBM] Cannot hook missing function " + name);
        return false;
      }
      win[name] = function(...args) {
        return hook(args, function(nextArgs) {
          return original2.apply(window, nextArgs || args);
        });
      };
      return true;
    }
    let parent = globalThis;
    for (let i = 0; i < parts.length - 1; i++) {
      if (parent == null || typeof parent !== "object" && typeof parent !== "function") {
        console.warn("[FBM] Cannot hook missing path " + name);
        return false;
      }
      parent = parent[parts[i]];
    }
    const key = parts[parts.length - 1];
    if (parent == null || typeof parent !== "object" && typeof parent !== "function") {
      console.warn("[FBM] Cannot hook missing path " + name);
      return false;
    }
    const obj = parent;
    const original = obj[key];
    if (typeof original !== "function") {
      console.warn("[FBM] Cannot hook missing function " + name);
      return false;
    }
    console.warn("[FBM] ModSDK missing \u2014 raw wrap of " + name + " (may trip BCX if ModSDK loads later)");
    obj[key] = function(...args) {
      return hook(args, function(nextArgs) {
        return original.apply(this, nextArgs || args);
      });
    };
    return true;
  };
  FBM.tryHook = function(stateKey, name, priority, hook) {
    FBM._hookState = FBM._hookState || {};
    if (FBM._hookState[stateKey || name]) return true;
    const target = FBM.resolveGlobalPath(name);
    if (typeof target !== "function") return false;
    const ok = FBM.hookFunction(name, priority, hook);
    if (ok) FBM._hookState[stateKey || name] = true;
    return ok;
  };
  FBM.shouldSuppressMapLeftButton = function(x, y) {
    if (!FBM.toolbarShouldHide || !FBM.toolbarShouldHide()) return false;
    if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return false;
    x = Number(x);
    y = Number(y);
    if (!isFinite(x) || !isFinite(y)) return false;
    return x <= 100 && y <= 500;
  };
  FBM.shouldSuppressMapArrowButtons = function(x, y) {
    if (!FBM.settings || !FBM.settings.hideArrowKeys) return false;
    if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return false;
    x = Number(x);
    y = Number(y);
    if (!isFinite(x) || !isFinite(y)) return false;
    return x >= 790 && x <= 990 && y >= 860 && y <= 1e3;
  };
  FBM.syncHideArrowKeysDom = function() {
    const on = !!(FBM.settings && FBM.settings.hideArrowKeys);
    if (typeof document !== "undefined" && document.body) {
      document.body.classList.toggle("fbm-hide-arrow-keys", on);
    }
  };
  FBM.installDrawButtonFilter = function() {
    return FBM.tryHook("DrawButtonFilter", "DrawButton", 20, function(args, next) {
      const Left = args[0];
      const Top = args[1];
      if (!FBM._fbmAllowLeftDrawButton && FBM.shouldSuppressMapLeftButton(Left, Top)) {
        return;
      }
      if (FBM.shouldSuppressMapArrowButtons && FBM.shouldSuppressMapArrowButtons(Left, Top)) {
        return;
      }
      return next(args);
    });
  };
  FBM.withLeftDrawButtons = function(fn) {
    const prev = FBM._fbmAllowLeftDrawButton;
    FBM._fbmAllowLeftDrawButton = true;
    try {
      return fn();
    } finally {
      FBM._fbmAllowLeftDrawButton = prev;
    }
  };
  FBM.patchMapViewMethods = function() {
    if (typeof ChatRoomViews === "undefined" || !ChatRoomViews || !ChatRoomViews.Map) return false;
    const drawOk = FBM.tryHook("mapViewDrawUi", "ChatRoomViews.Map.DrawUi", 10, function(args, next) {
      FBM.installDrawButtonFilter();
      const ret = next(args);
      FBM.withLeftDrawButtons(function() {
        if (FBM.drawMapChromeButtons) FBM.drawMapChromeButtons();
      });
      if (FBM.refreshBuildBar) FBM.refreshBuildBar();
      return ret;
    });
    const clickOk = FBM.tryHook("mapViewClick", "ChatRoomViews.Map.Click", 10, function(args, next) {
      if (FBM.handleMapChromeClick && FBM.handleMapChromeClick()) return;
      const view = FBM.mapViewRect ? FBM.mapViewRect() : { Left: 0, Top: 0, Width: 1e3, Height: 1e3 };
      const mapClick = function() {
        try {
          return FBM.mapTileFromMouse && FBM.mapTileFromMouse(MouseX, MouseY, view.Left, view.Top, view.Width, view.Height);
        } catch (e) {
          console.error("[FBM] mapTileFromMouse", e);
          return null;
        }
      };
      const onMap = typeof MouseX === "number" && typeof MouseY === "number" && MouseX >= view.Left && MouseX < view.Left + view.Width && MouseY >= view.Top && MouseY < view.Top + view.Height;
      if (onMap && FBM._objectSettings && (FBM._objectSettings.pick || FBM._objectSettings.color?.eyedrop || FBM._objectSettings.panelOpen)) {
        const tile = mapClick();
        if (tile && FBM.objectSettingsHandleMapClick && FBM.objectSettingsHandleMapClick(tile)) return;
      }
      if (onMap && FBM._objectsPaint && FBM._objectsPaint.pipet) {
        const tile = mapClick();
        if (tile && FBM.objectsHandleMapClick && FBM.objectsHandleMapClick(tile)) return;
      }
      if (onMap && FBM._copy && FBM._copy.mode) {
        const tile = mapClick();
        if (tile && FBM.copyHandleTileClick && FBM.copyHandleTileClick(tile)) return;
      }
      const before = typeof ChatRoomMapViewEditStarted !== "undefined" ? ChatRoomMapViewEditStarted : null;
      const ret = next(args);
      if (FBM.mapIsAdmin && FBM.mapIsAdmin()) {
        if (ChatRoomMapViewEditMode === "Tile" || ChatRoomMapViewEditMode === "Object" || ChatRoomMapViewEditMode === "Effect") {
          if (FBM.markMapDirty) FBM.markMapDirty();
        } else if (before !== ChatRoomMapViewEditStarted && ChatRoomMapViewEditStarted) {
          if (FBM.markMapDirty) FBM.markMapDirty();
        }
      }
      return ret;
    });
    FBM.tryHook("mapViewKeyDown", "ChatRoomViews.Map.KeyDown", 20, function(args, next) {
      if (FBM.mapTypingTargetActive && FBM.mapTypingTargetActive()) {
        if (FBM.clearMapMoveKeys) FBM.clearMapMoveKeys();
        return false;
      }
      return next(args);
    });
    return !!(drawOk && clickOk);
  };
  FBM.rebindMapViewMethods = function() {
    return FBM.patchMapViewMethods();
  };

  // src/map/model.ts
  FBM.mapBag = function() {
    if (!FBM.settings) FBM.loadSettings();
    return FBM.settings;
  };
  FBM.mapIsMapRoom = function() {
    if (typeof ChatRoomData === "undefined" || !ChatRoomData) return false;
    const md = ChatRoomData.MapData;
    if (!md || md.Type == null || md.Type === "Never") return false;
    return true;
  };
  FBM.mapIsAdmin = function() {
    return typeof ChatRoomPlayerIsAdmin === "function" && !!ChatRoomPlayerIsAdmin();
  };
  FBM.mapPerceptionRange = function() {
    if (typeof ChatRoomMapViewPerceptionRange === "number" && ChatRoomMapViewPerceptionRange > 0) {
      return ChatRoomMapViewPerceptionRange;
    }
    return 4;
  };
  FBM.mapTalkScale = function(tileWidth) {
    const ref = 1e3 / (FBM.MAP_TALK_REF_SPAN || 3);
    const tw = Number(tileWidth);
    if (!isFinite(tw) || tw <= 0) return 1;
    return tw / ref;
  };
  FBM.mapTalkSize = function(tileWidth) {
    const scale = FBM.mapTalkScale(tileWidth);
    return {
      w: Math.max(FBM.MAP_TALK_MIN_W || 8, (FBM.MAP_TALK_W || 40) * scale),
      h: Math.max(FBM.MAP_TALK_MIN_H || 5, (FBM.MAP_TALK_H || 24) * scale),
      scale
    };
  };
  FBM.mapTalkFrame = function(nowMs) {
    const t = typeof nowMs === "number" && isFinite(nowMs) ? nowMs : typeof CommonTime === "function" ? CommonTime() : 0;
    return Math.floor(t / 1e3) % 3;
  };
  FBM.mapTalkIconPath = function(frame) {
    const n = Number(frame);
    const f = n === 1 || n === 2 ? n : 0;
    return "Icons/Status/Talk" + f + ".png";
  };
  FBM.mapShouldDrawTalk = function(C) {
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
  FBM.mapCharVisible = function(C) {
    if (typeof ChatRoomMapViewCharacterIsVisible === "function") {
      return !!ChatRoomMapViewCharacterIsVisible(C);
    }
    return !!(C && C.MapData && C.MapData.Pos);
  };
  FBM.mapTileIndex = function(X, Y) {
    const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
    return X + Y * w;
  };
  FBM.mapIsWall = function(X, Y) {
    if (typeof ChatRoomMapViewIsWall === "function") {
      return !!ChatRoomMapViewIsWall(X, Y);
    }
    if (!ChatRoomData || !ChatRoomData.MapData || !ChatRoomData.MapData.Tiles) return false;
    const tiles = ChatRoomData.MapData.Tiles;
    const idx = FBM.mapTileIndex(X, Y);
    const code = tiles.charCodeAt(idx);
    const lookup = typeof ChatRoomMapViewTileLookup !== "undefined" ? ChatRoomMapViewTileLookup : null;
    if (lookup && lookup[code] && lookup[code].Type === "Wall") return true;
    return false;
  };
  FBM.mapIsBlocked = function(X, Y) {
    if (FBM.mapIsWall(X, Y)) return true;
    if (typeof ChatRoomMapViewPositionIsBlocked === "function") {
      return !!ChatRoomMapViewPositionIsBlocked(X, Y);
    }
    const getObj = typeof MapGetCell === "function" ? function(x, y) {
      return MapGetCell("Object", x, y);
    } : typeof ChatRoomMapViewGetObjectAtPos === "function" ? ChatRoomMapViewGetObjectAtPos : null;
    const getTile = typeof MapGetCell === "function" ? function(x, y) {
      return MapGetCell("Tile", x, y);
    } : typeof ChatRoomMapViewGetTileAtPos === "function" ? ChatRoomMapViewGetTileAtPos : null;
    const O = getObj ? getObj(X, Y) : null;
    if (O && typeof O.CanEnter === "function" && !O.CanEnter("")) return true;
    const T = getTile ? getTile(X, Y) : null;
    if (T && typeof T.CanEnter === "function" && !T.CanEnter("")) return true;
    return false;
  };
  FBM.mapViewRect = function() {
    const last = FBM._mapDrawRect;
    if (last && typeof last.Width === "number" && last.Width > 0 && typeof last.Height === "number" && last.Height > 0) {
      return {
        Left: Number(last.Left) || 0,
        Top: Number(last.Top) || 0,
        Width: last.Width,
        Height: last.Height
      };
    }
    return { Left: 0, Top: 0, Width: 1e3, Height: 1e3 };
  };
  FBM.mapTileLayout = function(Left, Top, Width, Height) {
    Left = Number(Left);
    Top = Number(Top);
    Width = Number(Width);
    Height = Number(Height);
    if (!isFinite(Left)) Left = 0;
    if (!isFinite(Top)) Top = 0;
    if (!isFinite(Width) || Width <= 0) Width = 1e3;
    if (!isFinite(Height) || Height <= 0) Height = 1e3;
    const range = FBM.mapPerceptionRange();
    const span = Math.max(range * 2 + 1, 1);
    const TileSize = Height / span;
    if (!isFinite(TileSize) || TileSize <= 0) {
      return {
        Left,
        Top,
        Width,
        Height,
        range,
        span,
        TileSize: Width / span,
        TileWidth: Width / span,
        TileHeight: Height / span,
        OffsetX: range * (Width / span),
        OffsetY: range * (Width / span)
      };
    }
    const OffsetX = (Width - TileSize) / 2;
    const OffsetY = (Height - TileSize) / 2;
    return {
      Left,
      Top,
      Width,
      Height,
      range,
      span,
      TileSize,
      TileWidth: TileSize,
      TileHeight: TileSize,
      OffsetX,
      OffsetY
    };
  };
  FBM.mapScreenFromTile = function(X, Y, Left, Top, Width, Height) {
    const layout = FBM.mapTileLayout(Left, Top, Width, Height);
    const px = Player && Player.MapData && Player.MapData.Pos ? Player.MapData.Pos.X : 0;
    const py = Player && Player.MapData && Player.MapData.Pos ? Player.MapData.Pos.Y : 0;
    const tw = layout.TileWidth;
    const th = layout.TileHeight;
    const ScreenX = (X - px) * tw + layout.OffsetX;
    const ScreenY = (Y - py) * th + layout.OffsetY;
    return {
      ScreenX,
      ScreenY,
      TileWidth: tw,
      TileHeight: th,
      TileSize: layout.TileSize,
      Left: layout.Left + ScreenX,
      Top: layout.Top + ScreenY
    };
  };
  FBM.mapTileFromMouse = function(mouseX, mouseY, Left, Top, Width, Height) {
    if (!Player || !Player.MapData || !Player.MapData.Pos) return null;
    if (typeof mouseX !== "number" || typeof mouseY !== "number" || !isFinite(mouseX) || !isFinite(mouseY)) {
      return null;
    }
    if (Left == null || Top == null || Width == null || Height == null) {
      const view = FBM.mapViewRect();
      Left = view.Left;
      Top = view.Top;
      Width = view.Width;
      Height = view.Height;
    }
    const layout = FBM.mapTileLayout(Left, Top, Width, Height);
    const tw = layout.TileWidth;
    const th = layout.TileHeight;
    if (!(tw > 0) || !(th > 0)) return null;
    if (mouseX < layout.Left || mouseX >= layout.Left + layout.Width) return null;
    if (mouseY < layout.Top || mouseY >= layout.Top + layout.Height) return null;
    const ScreenX = mouseX - layout.Left - layout.OffsetX;
    const ScreenY = mouseY - layout.Top - layout.OffsetY;
    const tx = Math.floor(ScreenX / tw) + Player.MapData.Pos.X;
    const ty = Math.floor(ScreenY / th) + Player.MapData.Pos.Y;
    const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
    const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
    if (tx < 0 || ty < 0 || tx >= w || ty >= h) return null;
    if (!isFinite(tx) || !isFinite(ty)) return null;
    return { X: tx, Y: ty };
  };
  FBM.localMsg = function(text) {
    if (typeof ChatRoomSendLocal === "function") ChatRoomSendLocal(String(text), 1e4);
  };

  // src/map/sync.ts
  FBM._roomUpdateLastKey = "";
  FBM._roomUpdateLastAt = 0;
  FBM._roomSyncSavedAt = null;
  FBM._roomUpdateHandlerInstalled = false;
  FBM.formatSyncTime = function(ts) {
    try {
      const d = new Date(ts || Date.now());
      const pad = function(n) {
        return (n < 10 ? "0" : "") + n;
      };
      return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    } catch (e) {
      return "";
    }
  };
  FBM.noteRoomSyncSaved = function(ts) {
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
  FBM.pushMapRoomSync = function(opts) {
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
      if (!synced && typeof ChatRoomMapViewScheduleMapUpdate === "function" && map && typeof map.updateGlobalMapData === "function") {
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
  FBM.installRoomUpdateHide = function() {
    if (FBM._roomUpdateHandlerInstalled) return true;
    if (typeof ChatRoomRegisterMessageHandler !== "function") return false;
    ChatRoomRegisterMessageHandler({
      Description: "FBM hide duplicate ServerUpdateRoom",
      Priority: 100,
      Callback: function(data, sender, msg) {
        const m = FBM.mapBag ? FBM.mapBag() : FBM.settings;
        if (!m || !m.hideRoomUpdateSpam) return false;
        if (!data || data.Type !== "Action" || data.Content !== "ServerUpdateRoom") return false;
        const key = String(msg || "");
        const now = Date.now();
        let coolMin = Number(m.roomUpdateHideCooldownMin);
        if (!isFinite(coolMin) || coolMin < 1) coolMin = 5;
        if (coolMin > 120) coolMin = 120;
        const coolMs = coolMin * 60 * 1e3;
        if (key && key === FBM._roomUpdateLastKey && now - FBM._roomUpdateLastAt < coolMs) {
          if (sender && Player && (sender === Player || typeof sender.IsPlayer === "function" && sender.IsPlayer() || sender.MemberNumber === Player.MemberNumber)) {
            FBM.noteRoomSyncSaved(now);
          }
          return true;
        }
        FBM._roomUpdateLastKey = key;
        FBM._roomUpdateLastAt = now;
        if (sender && Player && (sender === Player || typeof sender.IsPlayer === "function" && sender.IsPlayer() || sender.MemberNumber === Player.MemberNumber)) {
          FBM.noteRoomSyncSaved(now);
        }
        return false;
      }
    });
    FBM._roomUpdateHandlerInstalled = true;
    return true;
  };

  // src/map/library.ts
  FBM._mapDirty = false;
  FBM._autosaveTimer = null;
  FBM._lastAutosaveAt = 0;
  function newId() {
    return "m" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  }
  FBM.exportCurrentMap = function() {
    if (!FBM.mapIsMapRoom()) return null;
    if (typeof ChatRoomMapManager !== "undefined" && ChatRoomMapManager && ChatRoomMapManager.Map && typeof ChatRoomMapManager.Map.exportString === "function") {
      return ChatRoomMapManager.Map.exportString();
    }
    return null;
  };
  FBM.importMapString = function(mapString) {
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
        backup = typeof CommonCloneDeep === "function" ? CommonCloneDeep(ChatRoomData.MapData) : JSON.parse(JSON.stringify(ChatRoomData.MapData));
      }
    } catch (e) {
      backup = null;
    }
    if (!ChatRoomMapManager.Map.importString(mapString)) {
      FBM.localMsg("FBM: map paste failed.");
      return false;
    }
    FBM.pushMapRoomSync({ backup, skipUpdate: true });
    FBM.localMsg("FBM: map loaded.");
    return true;
  };
  FBM.saveNamedMap = function(name) {
    const data = FBM.exportCurrentMap();
    if (!data) {
      FBM.localMsg("FBM: no map to save.");
      return null;
    }
    const s = FBM.mapBag();
    const entry = {
      id: newId(),
      name: String(name || "Untitled").trim().slice(0, 48) || "Untitled",
      data,
      savedAt: Date.now()
    };
    s.maps = Array.isArray(s.maps) ? s.maps : [];
    s.maps.unshift(entry);
    while (s.maps.length > (FBM.MAP_MAX || 10)) s.maps.pop();
    FBM.saveSettings();
    FBM.localMsg("FBM: saved \u201C" + entry.name + "\u201D.");
    return entry;
  };
  FBM.deleteNamedMap = function(id) {
    const s = FBM.mapBag();
    s.maps = (s.maps || []).filter(function(m) {
      return m && m.id !== id;
    });
    FBM.saveSettings();
  };
  FBM.loadNamedMap = function(id) {
    FBM.loadMapOverflow();
    const s = FBM.mapBag();
    const entry = (s.maps || []).find(function(m) {
      return m && m.id === id;
    });
    if (!entry || !entry.data) {
      FBM.localMsg("FBM: map not found (overflow?).");
      return false;
    }
    return FBM.importMapString(entry.data);
  };
  FBM.loadAutosave = function() {
    FBM.loadMapOverflow();
    const s = FBM.mapBag();
    if (!s.autosave || !s.autosave.data) {
      FBM.localMsg("FBM: autosave empty.");
      return false;
    }
    return FBM.importMapString(s.autosave.data);
  };
  FBM.markMapDirty = function() {
    if (!FBM.mapIsAdmin()) return;
    FBM._mapDirty = true;
    FBM.scheduleAutosave();
  };
  FBM.scheduleAutosave = function() {
    if (FBM._autosaveTimer) return;
    const cool = FBM.AUTOSAVE_COOLDOWN_MS || 6e4;
    const wait = Math.max(0, cool - (Date.now() - (FBM._lastAutosaveAt || 0)));
    FBM._autosaveTimer = setTimeout(function() {
      FBM._autosaveTimer = null;
      FBM.runAutosave();
    }, wait || 0);
  };
  FBM.runAutosave = function() {
    if (!FBM._mapDirty) return;
    if (!FBM.mapIsMapRoom() || !FBM.mapIsAdmin()) return;
    const data = FBM.exportCurrentMap();
    if (!data) return;
    const s = FBM.mapBag();
    s.autosave = { data, savedAt: Date.now() };
    FBM._mapDirty = false;
    FBM._lastAutosaveAt = Date.now();
    FBM.saveSettings();
    if (FBM.refreshSettingsUi) FBM.refreshSettingsUi();
  };

  // src/map/ghost.ts
  function doodadFromChar(kind, ch) {
    if (ch == null || ch === "") return null;
    const id = String(ch).charCodeAt(0);
    if (typeof MapGetDoodad === "function") return MapGetDoodad(kind, id);
    if (kind === "Tile" && typeof MapDataGetTile === "function") return MapDataGetTile(id);
    if (kind === "Object" && typeof MapDataGetObject === "function") return MapDataGetObject(id);
    return null;
  }
  function blankObjectId() {
    return typeof ChatRoomMapViewObjectStartID === "number" ? ChatRoomMapViewObjectStartID : 100;
  }
  function defaultObjectSize() {
    return typeof MapObjectDefaultSize === "number" ? MapObjectDefaultSize : 100;
  }
  function drawSource(ctx, source, x, y, w, h, opts) {
    opts = opts || {};
    if (!source) return false;
    const options = {
      Width: w,
      Height: h,
      Alpha: opts.alpha != null ? opts.alpha : 1,
      Rotation: opts.rotation || 0
    };
    if (ctx && typeof DrawImageEx === "function") {
      return !!DrawImageEx(source, ctx, x, y, options);
    }
    if (!ctx && typeof DrawImageResize === "function") {
      return !!DrawImageResize(source, x, y, w, h, options);
    }
    return false;
  }
  function resolveObjectImage(obj, settings) {
    if (!obj) return null;
    const imageName = obj.Style;
    if (!imageName) return null;
    const url = typeof MapGetAssetUrl === "function" ? MapGetAssetUrl("Object", obj.Type, imageName) : typeof MapGetDoodadAssetUrl === "function" ? MapGetDoodadAssetUrl(obj) : null;
    if (!url) return null;
    if (settings && Array.isArray(settings.Colors) && typeof ChatRoomMapViewGetColoredObjectImage === "function") {
      try {
        const colored = ChatRoomMapViewGetColoredObjectImage(obj, imageName, settings.Colors);
        if (colored) return colored;
      } catch (e) {
      }
    }
    return url;
  }
  FBM.drawMapCellGhost = function(ctx, tileCh, objectCh, settings, destRect, opts) {
    opts = opts || {};
    const alpha = opts.alpha != null ? opts.alpha : 0.4;
    const useSettings = opts.useSettings !== false && settings;
    const out = { drewTile: false, drewObject: false };
    if (!destRect) return out;
    const tileSize = destRect.TileWidth;
    const left = destRect.Left;
    const top = destRect.Top;
    if (!(tileSize > 0)) return out;
    const tile = doodadFromChar("Tile", tileCh);
    if (tile) {
      const url = typeof MapGetDoodadAssetUrl === "function" ? MapGetDoodadAssetUrl(tile) : typeof MapGetAssetUrl === "function" ? MapGetAssetUrl("Tile", tile.Type, tile.Style) : null;
      if (url) {
        const img = typeof DrawGetImage === "function" ? DrawGetImage(url) : null;
        if (img) {
          const widthScale = tile.Width != null ? tile.Width : 1;
          const heightScale = tile.Height != null ? tile.Height : 1;
          const tileLeft = tile.Left != null ? tile.Left : 0;
          const tileTop = tile.Top != null ? tile.Top : 0;
          const w = Math.ceil(tileSize * widthScale);
          const h = Math.ceil(tileSize * heightScale);
          const x = Math.floor(left + tileSize * tileLeft);
          const y = Math.floor(top + tileSize * tileTop);
          out.drewTile = drawSource(ctx, img, x, y, w, h, {
            alpha,
            rotation: tile.Rotation || 0
          });
        }
      }
    }
    const obj = doodadFromChar("Object", objectCh);
    if (obj && obj.ID > blankObjectId() && obj.Type !== "EmptySpace") {
      const objectSize = (useSettings && settings && settings.Size != null ? settings.Size : defaultObjectSize()) / 100;
      const objectRotation = (obj.Rotation || 0) + (useSettings && settings && settings.Rotation != null ? settings.Rotation : 0);
      const width = tileSize * (obj.Width != null ? obj.Width : 1);
      const height = tileSize * (obj.Height != null ? obj.Height : 1);
      const ox = Math.floor(left + tileSize * (obj.Left != null ? obj.Left : 0) + width * (1 - objectSize) / 2);
      const oy = Math.floor(top + tileSize * (obj.Top != null ? obj.Top : 0) + height * (1 - objectSize));
      const ow = Math.ceil(width * objectSize);
      const oh = Math.ceil(height * objectSize);
      const source = resolveObjectImage(obj, useSettings ? settings : null);
      if (source) {
        const img = typeof source === "string" && typeof DrawGetImage === "function" ? DrawGetImage(source) : source;
        if (img) {
          out.drewObject = drawSource(ctx, img, ox, oy, ow, oh, {
            alpha,
            rotation: objectRotation
          });
        } else if (typeof source === "string") {
          out.drewObject = drawSource(ctx, source, ox, oy, ow, oh, {
            alpha,
            rotation: objectRotation
          });
        }
      }
    }
    return out;
  };
  FBM.doodadFromChar = doodadFromChar;
  function objectThumbBounds(obj) {
    const oLeft = obj && obj.Left != null ? obj.Left : 0;
    const oTop = obj && obj.Top != null ? obj.Top : 0;
    const oW = obj && obj.Width != null ? obj.Width : 1;
    const oH = obj && obj.Height != null ? obj.Height : 1;
    const minX = Math.min(0, oLeft);
    const minY = Math.min(0, oTop);
    const maxX = Math.max(1, oLeft + oW);
    const maxY = Math.max(1, oTop + oH);
    return { minX, minY, maxX, maxY, spanX: maxX - minX, spanY: maxY - minY };
  }
  FBM.snapshotObjectVariantThumb = function(opts) {
    opts = opts || {};
    const size = opts.size && opts.size > 0 ? opts.size : 96;
    const blank = blankObjectId();
    const tileId = opts.tileId != null ? opts.tileId : blank;
    const objectId = opts.objectId != null ? opts.objectId : blank;
    const tileCh = String.fromCharCode(tileId);
    const objectCh = String.fromCharCode(objectId);
    const obj = objectId > blank ? doodadFromChar("Object", objectCh) : null;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.fillStyle = "#2a3038";
      ctx.fillRect(0, 0, size, size);
      const bounds = objectThumbBounds(obj);
      const span = Math.max(bounds.spanX, bounds.spanY, 1);
      const margin = 0.06;
      const tileSize = size / (span * (1 + margin * 2));
      const originX = (size - bounds.spanX * tileSize) / 2 - bounds.minX * tileSize;
      const originY = (size - bounds.spanY * tileSize) / 2 - bounds.minY * tileSize;
      const dest = {
        Left: originX,
        Top: originY,
        TileWidth: tileSize,
        TileHeight: tileSize
      };
      if (opts.X != null && opts.Y != null) {
        const live = FBM.snapshotMapCellFromCanvas && FBM.snapshotMapCellFromCanvas(opts.X, opts.Y, size, obj);
        if (live) return live;
      }
      const drew = FBM.drawMapCellGhost(ctx, tileCh, objectCh, opts.settings || null, dest, {
        alpha: 1,
        useSettings: true
      });
      void drew;
      return canvas.toDataURL("image/png");
    } catch (e) {
      return "";
    }
  };
  FBM.snapshotMapCellFromCanvas = function(X, Y, outSize, obj) {
    try {
      const el = typeof FBM.getMainCanvasEl === "function" ? FBM.getMainCanvasEl() : document.getElementById("MainCanvas");
      if (!el || !el.getContext) return "";
      const view = FBM.mapViewRect ? FBM.mapViewRect() : { Left: 0, Top: 0, Width: 1e3, Height: 1e3 };
      const screen = FBM.mapScreenFromTile && FBM.mapScreenFromTile(X, Y, view.Left, view.Top, view.Width, view.Height);
      if (!screen) return "";
      const clubW = 2e3;
      const clubH = 1e3;
      const bounds = objectThumbBounds(obj);
      const margin = 0.08;
      const clubLeft = screen.Left + bounds.minX * screen.TileWidth - margin * screen.TileWidth;
      const clubTop = screen.Top + bounds.minY * screen.TileHeight - margin * screen.TileHeight;
      const clubBoxW = bounds.spanX * screen.TileWidth + margin * 2 * screen.TileWidth;
      const clubBoxH = bounds.spanY * screen.TileHeight + margin * 2 * screen.TileHeight;
      if (clubLeft + clubBoxW < 0 || clubTop + clubBoxH < 0) return "";
      if (clubLeft > view.Width || clubTop > view.Height) return "";
      const sx = clubLeft / clubW * el.width;
      const sy = clubTop / clubH * el.height;
      const sw = clubBoxW / clubW * el.width;
      const sh = clubBoxH / clubH * el.height;
      if (!(sw > 1 && sh > 1)) return "";
      const out = document.createElement("canvas");
      out.width = outSize;
      out.height = outSize;
      const ctx = out.getContext("2d");
      if (!ctx) return "";
      ctx.fillStyle = "#2a3038";
      ctx.fillRect(0, 0, outSize, outSize);
      const scale = Math.min(outSize / sw, outSize / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      ctx.drawImage(el, sx, sy, sw, sh, (outSize - dw) / 2, (outSize - dh) / 2, dw, dh);
      return out.toDataURL("image/png");
    } catch (e) {
      return "";
    }
  };

  // src/map/copy.ts
  FBM._copy = {
    mode: "",
    // "" | "a" | "b" | "edit" | "paste"
    a: null,
    b: null,
    cells: {},
    // "x,y" -> { tile, object, config?, settings? }
    pasteId: null
  };
  function cellKey(X, Y) {
    return X + "," + Y;
  }
  function mapApi2() {
    if (typeof MapManager !== "undefined" && MapManager && MapManager.Map) return MapManager.Map;
    if (typeof ChatRoomMapManager !== "undefined" && ChatRoomMapManager && ChatRoomMapManager.Map) {
      return ChatRoomMapManager.Map;
    }
    return null;
  }
  function cloneJson(v) {
    if (v == null) return null;
    try {
      return typeof CommonCloneDeep === "function" ? CommonCloneDeep(v) : JSON.parse(JSON.stringify(v));
    } catch (e) {
      return null;
    }
  }
  function includeObjectSettings() {
    return !(FBM.settings && FBM.settings.copyObjectSettings === false);
  }
  function charFromId(id) {
    if (id == null || !isFinite(id)) return null;
    try {
      return String.fromCharCode(id);
    } catch (e) {
      return null;
    }
  }
  function doodadFromChar2(kind, ch) {
    if (ch == null || ch === "") return null;
    const id = String(ch).charCodeAt(0);
    if (typeof MapGetDoodad === "function") return MapGetDoodad(kind, id);
    if (kind === "Tile" && typeof MapDataGetTile === "function") return MapDataGetTile(id);
    if (kind === "Object" && typeof MapDataGetObject === "function") return MapDataGetObject(id);
    return null;
  }
  function readCell(X, Y, includeSettings) {
    const map = mapApi2();
    if (map && typeof map.getTileId === "function" && typeof map.getObjectId === "function") {
      const tileId = map.getTileId(X, Y);
      const objectId = map.getObjectId(X, Y);
      const tile = charFromId(tileId);
      const object = charFromId(objectId);
      if (tile == null || object == null) return null;
      const out2 = { X, Y, tile, object };
      if (includeSettings) {
        if (typeof map.getObjectConfig === "function") {
          const cfg = map.getObjectConfig(X, Y);
          if (cfg) out2.config = cloneJson(cfg);
        }
        if (typeof map.getObjectSettings === "function") {
          const st = map.getObjectSettings(X, Y);
          if (st) out2.settings = cloneJson(st);
        }
      }
      return out2;
    }
    const md = ChatRoomData && ChatRoomData.MapData;
    if (!md || !md.Tiles || !md.Objects) return null;
    const idx = FBM.mapTileIndex(X, Y);
    const out = {
      X,
      Y,
      tile: md.Tiles.charAt(idx),
      object: md.Objects.charAt(idx)
    };
    if (includeSettings && md.CellData && typeof md.CellData === "object") {
      const cfg = md.CellData[idx];
      if (cfg) out.config = cloneJson(cfg);
    }
    return out;
  }
  function prepareConfigForTemplate(config, bounds) {
    const cfg = cloneJson(config);
    if (!cfg || cfg.Type !== "Teleporter" || !cfg.Destination || !bounds) return cfg;
    const d = cfg.Destination;
    if (typeof d.X === "number" && typeof d.Y === "number" && d.X >= bounds.x0 && d.X <= bounds.x1 && d.Y >= bounds.y0 && d.Y <= bounds.y1) {
      cfg.Destination = { X: d.X - bounds.x0, Y: d.Y - bounds.y0 };
      cfg.DestinationRelative = true;
    }
    return cfg;
  }
  function prepareConfigForPaste(config, originX, originY) {
    const cfg = cloneJson(config);
    if (!cfg) return null;
    if (cfg.Type === "Teleporter" && cfg.DestinationRelative && cfg.Destination) {
      cfg.Destination = {
        X: originX + cfg.Destination.X,
        Y: originY + cfg.Destination.Y
      };
      delete cfg.DestinationRelative;
    }
    return cfg;
  }
  function clearObjectSettingsAt(map, X, Y) {
    if (!map || typeof map.setObjectSettings !== "function") return;
    if (typeof map.getObjectSettings !== "function") return;
    const cur = map.getObjectSettings(X, Y);
    if (!cur) return;
    const colors = Array.isArray(cur.Colors) ? cur.Colors.map(function() {
      return "Default";
    }) : void 0;
    try {
      map.setObjectSettings(
        X,
        Y,
        {
          Rotation: 0,
          Size: typeof MapObjectDefaultSize === "number" ? MapObjectDefaultSize : 100,
          ...colors ? { Colors: colors } : {},
          Decal: void 0,
          DecalColor: void 0
        },
        false
      );
    } catch (e) {
    }
  }
  FBM.copyReset = function() {
    FBM._copy.mode = "";
    FBM._copy.a = null;
    FBM._copy.b = null;
    FBM._copy.cells = {};
    FBM._copy.pasteId = null;
    if (FBM.refreshBuildBar) FBM.refreshBuildBar();
  };
  FBM.copyCancel = function() {
    const tpl = document.getElementById("fbm-templates");
    const tplOpen = tpl && !tpl.hidden;
    const mode = FBM._copy && FBM._copy.mode;
    if (!mode && !tplOpen) return false;
    if (tplOpen && FBM.hideTemplatesUi) FBM.hideTemplatesUi();
    if (mode) FBM.copyReset();
    if (typeof ChatRoomSendLocal === "function") ChatRoomSendLocal("FBM: copy/paste cancelled.", 4e3);
    else if (FBM.localMsg) FBM.localMsg("FBM: copy/paste cancelled.");
    return true;
  };
  FBM.installCopyEscape = function() {
    if (FBM._copyEscapeBound) return;
    FBM._copyEscapeBound = true;
    document.addEventListener(
      "keydown",
      function(e) {
        if (!e || e.key !== "Escape" && e.code !== "Escape") return;
        if (FBM._capturingHotkey) return;
        if (FBM._promptOpen) return;
        const t = e.target;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) {
          if (!t.closest || !t.closest("#fbm-root")) return;
        }
        const tpl = document.getElementById("fbm-templates");
        const busy = FBM._copy && FBM._copy.mode || tpl && !tpl.hidden;
        if (!busy) return;
        e.preventDefault();
        e.stopPropagation();
        FBM.copyCancel();
      },
      true
    );
  };
  FBM.copyStart = function() {
    FBM._copy.mode = "a";
    FBM._copy.a = null;
    FBM._copy.b = null;
    FBM._copy.cells = {};
    FBM._copy.pasteId = null;
    FBM.localMsg("FBM: click top-left tile, then bottom-right. Esc cancels.");
    if (FBM.refreshBuildBar) FBM.refreshBuildBar();
  };
  FBM.copyFillRect = function(a, b) {
    const x0 = Math.min(a.X, b.X);
    const x1 = Math.max(a.X, b.X);
    const y0 = Math.min(a.Y, b.Y);
    const y1 = Math.max(a.Y, b.Y);
    const withSettings = includeObjectSettings();
    const cells = {};
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const c = readCell(x, y, withSettings);
        if (c) cells[cellKey(x, y)] = c;
      }
    }
    FBM._copy.cells = cells;
    FBM._copy.a = { X: x0, Y: y0 };
    FBM._copy.b = { X: x1, Y: y1 };
  };
  FBM.copyToggleCell = function(X, Y) {
    const k = cellKey(X, Y);
    if (FBM._copy.cells[k]) {
      delete FBM._copy.cells[k];
    } else {
      const c = readCell(X, Y, includeObjectSettings());
      if (c) FBM._copy.cells[k] = c;
    }
  };
  FBM.copyBounds = function(cells) {
    const list = Object.keys(cells || FBM._copy.cells).map(function(k) {
      const p = k.split(",");
      return { X: +p[0], Y: +p[1] };
    });
    if (!list.length) return null;
    let x0 = list[0].X;
    let x1 = list[0].X;
    let y0 = list[0].Y;
    let y1 = list[0].Y;
    list.forEach(function(p) {
      x0 = Math.min(x0, p.X);
      x1 = Math.max(x1, p.X);
      y0 = Math.min(y0, p.Y);
      y1 = Math.max(y1, p.Y);
    });
    return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  };
  FBM.copyMakeThumb = function(cells, bounds) {
    try {
      let tw = 24;
      const maxSide = 480;
      if (bounds.w * tw > maxSide) tw = Math.max(8, Math.floor(maxSide / Math.max(1, bounds.w)));
      if (bounds.h * tw > maxSide) tw = Math.min(tw, Math.max(8, Math.floor(maxSide / Math.max(1, bounds.h))));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, bounds.w * tw);
      canvas.height = Math.max(1, bounds.h * tw);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#1a1e24";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      Object.keys(cells).forEach(function(k) {
        const c = cells[k];
        const dest = {
          Left: (c.X - bounds.x0) * tw,
          Top: (c.Y - bounds.y0) * tw,
          TileWidth: tw,
          TileHeight: tw
        };
        let ok = false;
        if (FBM.drawMapCellGhost) {
          const r = FBM.drawMapCellGhost(ctx, c.tile, c.object, c.settings, dest, {
            alpha: 1,
            useSettings: !!c.settings
          });
          ok = !!(r && (r.drewTile || r.drewObject));
        }
        if (!ok) {
          const wall = FBM.mapIsWall(c.X, c.Y);
          ctx.fillStyle = wall ? "#6a7078" : "#3a90a8";
          ctx.fillRect(dest.Left, dest.Top, tw - 1, tw - 1);
        }
      });
      return canvas.toDataURL("image/png");
    } catch (e) {
      return "";
    }
  };
  FBM.copySaveTemplate = function(name) {
    const cells = FBM._copy.cells;
    const bounds = FBM.copyBounds(cells);
    if (!bounds) {
      FBM.localMsg("FBM: nothing selected.");
      return null;
    }
    const withSettings = includeObjectSettings();
    const rel = [];
    Object.keys(cells).forEach(function(k) {
      const c = cells[k];
      const entry2 = {
        dx: c.X - bounds.x0,
        dy: c.Y - bounds.y0,
        tile: c.tile,
        object: c.object
      };
      if (withSettings) {
        if (c.config) entry2.config = prepareConfigForTemplate(c.config, bounds);
        if (c.settings) entry2.settings = cloneJson(c.settings);
      }
      rel.push(entry2);
    });
    FBM.loadTemplates();
    const entry = {
      id: "t" + Date.now().toString(36),
      name: String(name || "Room").trim().slice(0, 40) || "Room",
      w: bounds.w,
      h: bounds.h,
      cells: rel,
      withObjectSettings: withSettings,
      thumb: FBM.copyMakeThumb(cells, bounds),
      savedAt: Date.now()
    };
    FBM.templates.unshift(entry);
    while (FBM.templates.length > 40) FBM.templates.pop();
    FBM.saveTemplates();
    FBM.localMsg(
      "FBM: template \u201C" + entry.name + "\u201D saved (" + bounds.w + " \xD7 " + bounds.h + (withSettings ? ", with object settings" : ", tiles/objects only") + ")."
    );
    FBM.copyReset();
    if (FBM.refreshTemplatesUi) FBM.refreshTemplatesUi();
    return entry;
  };
  FBM.copyDeleteTemplate = function(id) {
    FBM.loadTemplates();
    FBM.templates = (FBM.templates || []).filter(function(t) {
      return t && t.id !== id;
    });
    FBM.saveTemplates();
    if (FBM.refreshTemplatesUi) FBM.refreshTemplatesUi();
  };
  FBM.copyBeginPaste = function(templateId) {
    FBM.loadTemplates();
    const t = (FBM.templates || []).find(function(x) {
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
  FBM.copyApplyPaste = function(originX, originY) {
    if (!FBM.mapIsAdmin()) {
      FBM.localMsg("FBM: admin required to paste.");
      return false;
    }
    FBM.loadTemplates();
    const t = (FBM.templates || []).find(function(x) {
      return x && x.id === FBM._copy.pasteId;
    });
    if (!t || !Array.isArray(t.cells)) return false;
    const map = mapApi2();
    const applySettings = includeObjectSettings();
    const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
    const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
    if (map && typeof map.setTile === "function" && typeof map.setObject === "function") {
      const stroke = typeof map.startUndoStroke === "function" && typeof map.endUndoStroke === "function";
      if (stroke) map.startUndoStroke();
      try {
        const pasteKeys = {};
        const teleporterSnap = {};
        t.cells.forEach(function(c) {
          const X = originX + c.dx;
          const Y = originY + c.dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) return;
          pasteKeys[cellKey(X, Y)] = true;
        });
        if (typeof map.getObjectConfig === "function") {
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              if (pasteKeys[cellKey(x, y)]) continue;
              const cfg = map.getObjectConfig(x, y);
              if (cfg && cfg.Type === "Teleporter") teleporterSnap[cellKey(x, y)] = cloneJson(cfg);
            }
          }
        }
        t.cells.forEach(function(c) {
          const X = originX + c.dx;
          const Y = originY + c.dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) return;
          const tile = doodadFromChar2("Tile", c.tile);
          const object = doodadFromChar2("Object", c.object);
          if (tile) map.setTile(X, Y, tile);
          if (object != null) map.setObject(X, Y, object);
          if (applySettings && c.config && typeof map.setObjectConfig === "function") {
            const cfg = prepareConfigForPaste(c.config, originX, originY);
            map.setObjectConfig(X, Y, cfg);
          } else if (typeof map.setObjectConfig === "function") {
            map.setObjectConfig(X, Y, void 0);
          }
          if (applySettings && c.settings && typeof map.setObjectSettings === "function") {
            const st = cloneJson(c.settings) || {};
            delete st.ID;
            map.setObjectSettings(X, Y, st, false);
          } else {
            clearObjectSettingsAt(map, X, Y);
          }
        });
        if (typeof map.setObjectConfig === "function") {
          Object.keys(teleporterSnap).forEach(function(k) {
            const p = k.split(",");
            const x = +p[0];
            const y = +p[1];
            map.setObjectConfig(x, y, teleporterSnap[k]);
          });
        }
      } finally {
        if (stroke) map.endUndoStroke();
      }
      FBM.pushMapRoomSync({ viaMapManager: true });
      FBM.localMsg("FBM: pasted \u201C" + t.name + "\u201D.");
      FBM.copyReset();
      return true;
    }
    const md = ChatRoomData && ChatRoomData.MapData;
    if (!md || typeof md.Tiles !== "string" || typeof md.Objects !== "string") return false;
    let backup = null;
    try {
      backup = typeof CommonCloneDeep === "function" ? CommonCloneDeep(md) : JSON.parse(JSON.stringify(md));
    } catch (e) {
      backup = null;
    }
    const tiles = md.Tiles.split("");
    const objects = md.Objects.split("");
    const cellData = md.CellData && typeof md.CellData === "object" ? Object.assign({}, md.CellData) : {};
    t.cells.forEach(function(c) {
      const X = originX + c.dx;
      const Y = originY + c.dy;
      if (X < 0 || Y < 0 || X >= w || Y >= h) return;
      const idx = X + Y * w;
      if (c.tile != null) tiles[idx] = c.tile;
      if (c.object != null) objects[idx] = c.object;
      if (applySettings && c.config) {
        cellData[idx] = prepareConfigForPaste(c.config, originX, originY);
      } else if (cellData[idx] != null) {
        delete cellData[idx];
      }
    });
    md.Tiles = tiles.join("");
    md.Objects = objects.join("");
    if (applySettings || md.CellData) md.CellData = cellData;
    FBM.pushMapRoomSync({ backup });
    FBM.localMsg("FBM: pasted \u201C" + t.name + "\u201D.");
    FBM.copyReset();
    return true;
  };
  FBM.copyHandleTileClick = function(tile) {
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
  FBM.copyDrawHighlight = function(Left, Top, Width, Height) {
    const mode = FBM._copy.mode;
    if (!mode) return;
    if (typeof DrawRect !== "function" && typeof DrawEmptyRect !== "function") return;
    const cells = FBM._copy.cells;
    const keys = Object.keys(cells || {});
    if (mode === "b" && FBM._copy.a) {
      const s = FBM.mapScreenFromTile(FBM._copy.a.X, FBM._copy.a.Y, Left, Top, Width, Height);
      if (typeof DrawEmptyRect === "function") {
        DrawEmptyRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "#5bc0de", 2);
      }
    }
    if (mode === "edit" || mode !== "b" && keys.length) {
      keys.forEach(function(k) {
        const c = cells[k];
        const s = FBM.mapScreenFromTile(c.X, c.Y, Left, Top, Width, Height);
        if (typeof DrawRect === "function") {
          DrawRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "rgba(91,192,222,0.28)");
        }
        if (typeof DrawEmptyRect === "function") {
          DrawEmptyRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "#5bc0de", 2);
        }
      });
    }
    if (typeof MouseX !== "number" || typeof MouseY !== "number") return;
    if (!FBM.mapTileFromMouse) return;
    const hover = FBM.mapTileFromMouse(MouseX, MouseY, Left, Top, Width, Height);
    if (!hover) return;
    if (mode === "b" && FBM._copy.a) {
      const x0 = Math.min(FBM._copy.a.X, hover.X);
      const x1 = Math.max(FBM._copy.a.X, hover.X);
      const y0 = Math.min(FBM._copy.a.Y, hover.Y);
      const y1 = Math.max(FBM._copy.a.Y, hover.Y);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const s = FBM.mapScreenFromTile(x, y, Left, Top, Width, Height);
          if (typeof DrawRect === "function") {
            DrawRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "rgba(91,192,222,0.18)");
          }
        }
      }
    }
    if (mode === "paste" && FBM._copy.pasteId) {
      if (!FBM.templates) FBM.loadTemplates();
      const tpl = (FBM.templates || []).find(function(x) {
        return x && x.id === FBM._copy.pasteId;
      });
      const mw = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
      const mh = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
      const wantSettings = includeObjectSettings();
      if (tpl && Array.isArray(tpl.cells)) {
        tpl.cells.forEach(function(c) {
          const X = hover.X + c.dx;
          const Y = hover.Y + c.dy;
          if (X < 0 || Y < 0 || X >= mw || Y >= mh) return;
          const s = FBM.mapScreenFromTile(X, Y, Left, Top, Width, Height);
          if (s.Left + s.TileWidth < Left || s.Top + s.TileHeight < Top) return;
          if (s.Left > Left + Width || s.Top > Top + Height) return;
          let drew = false;
          if (FBM.drawMapCellGhost) {
            const r = FBM.drawMapCellGhost(
              null,
              c.tile,
              c.object,
              wantSettings ? c.settings : null,
              s,
              { alpha: 0.4, useSettings: wantSettings && !!c.settings }
            );
            drew = !!(r && (r.drewTile || r.drewObject));
          }
          if (!drew && typeof DrawRect === "function") {
            DrawRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "rgba(91,192,222,0.28)");
          }
          if (typeof DrawEmptyRect === "function") {
            DrawEmptyRect(s.Left, s.Top, s.TileWidth, s.TileHeight, "#5bc0de", 2);
          }
        });
      }
    }
    const hs = FBM.mapScreenFromTile(hover.X, hover.Y, Left, Top, Width, Height);
    if (typeof DrawEmptyRect === "function") {
      DrawEmptyRect(hs.Left, hs.Top, hs.TileWidth, hs.TileHeight, "cyan", 3);
    }
  };

  // src/map/catalog.ts
  var VARIANT_SUFFIXES = [
    "LightBlue",
    "LightGreen",
    "LightRed",
    "LightPink",
    "LightPurple",
    "LightGray",
    "LightGrey",
    "LightYellow",
    "LightOrange",
    "LightBrown",
    "DarkBlue",
    "DarkGreen",
    "DarkRed",
    "DarkGray",
    "DarkGrey",
    "Dark",
    "Red2",
    /* wood / log species (before plain White/Black color) */
    "Pine",
    "Maple",
    "Acacia",
    "Mahogany",
    "Mangrove",
    "Cherry",
    "Oak",
    /* colors */
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Orange",
    "Purple",
    "Pink",
    "White",
    "Black",
    "Brown",
    "Grey",
    "Gray",
    "Cyan",
    "Teal",
    "Gold",
    "Silver",
    "Violet",
    "Magenta",
    "Lime",
    "Navy",
    "Beige",
    "Tan"
  ];
  var DOOR_FAMILIES = ["BrownDoor", "RoyalDoor", "SteelDoor", "GrayDoor", "Wood", "Metal"];
  var EFFECT_LABELS = {
    10: "Blank",
    11: "Shadow Light",
    12: "Shadow Medium",
    13: "Shadow Dark",
    14: "Tint Red",
    15: "Tint Blue",
    16: "Tint Green",
    17: "Glow Yellow"
  };
  FBM.CATALOG_CACHE_VERSION = 2;
  function humanize(style) {
    return String(style || "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").trim();
  }
  function stripVariantSuffix(style) {
    const s = String(style || "");
    if (s.endsWith("Wood") && s.length > 4) {
      const species = s.slice(0, -4);
      if (species.length >= 3) return { base: "Wood", variant: species };
    }
    for (let i = 0; i < VARIANT_SUFFIXES.length; i++) {
      const c = VARIANT_SUFFIXES[i];
      if (s.length > c.length && s.endsWith(c)) {
        const base = s.slice(0, -c.length);
        if (base.length >= 2) return { base, variant: c };
      }
    }
    return { base: s, variant: null };
  }
  function doorFamilySplit(style) {
    const s = String(style || "");
    if (s === "Blank") return { base: "Blank", variant: null };
    for (let i = 0; i < DOOR_FAMILIES.length; i++) {
      const f = DOOR_FAMILIES[i];
      if (s === f) return { base: f === "Metal" ? "Metal" : f === "Wood" ? "Wood" : f, variant: null };
      if (s.startsWith(f) && s.length > f.length) {
        return { base: f, variant: s.slice(f.length) };
      }
    }
    return stripVariantSuffix(s);
  }
  function typeDisplayName(kind, type) {
    const key = kind === "tile" ? "TileTypeName" + type : kind === "object" ? "ObjectTypeName" + type : "EffectTypeName" + type;
    if (typeof TextGet === "function") {
      const t = TextGet(key);
      if (t && t !== key) return t;
    }
    return humanize(type);
  }
  function itemDisplayName(raw) {
    if (raw.name && String(raw.name).trim()) return String(raw.name).trim();
    return humanize(raw.style) || "Item " + raw.id;
  }
  function doodadUrl(kind, type, style) {
    if (typeof MapGetAssetUrl === "function") {
      return MapGetAssetUrl(kind === "Tile" ? "Tile" : "Object", type, style);
    }
    const folder = kind === "Tile" ? "Tiles" : "Objects";
    return "Assets/Map/" + folder + "/" + type + "/" + style + ".png";
  }
  function tileThumbUrl(id, type, style) {
    if (typeof MapGetDoodadAssetUrl === "function" && typeof MapDataGetTile === "function") {
      try {
        const u = MapGetDoodadAssetUrl(MapDataGetTile(id));
        if (u) return u;
      } catch (e) {
      }
    }
    return doodadUrl("Tile", type, style);
  }
  function objectThumbUrl(id, type, style) {
    if (typeof MapGetDoodadAssetUrl === "function" && typeof MapDataGetObject === "function") {
      try {
        const u = MapGetDoodadAssetUrl(MapDataGetObject(id));
        if (u) return u;
      } catch (e) {
      }
    }
    return doodadUrl("Object", type, style);
  }
  function effectThumbCss(color) {
    if (!color || !color.length) return "#2a3038";
    if (typeof RgbaArrayToHTMLColor === "function") {
      try {
        return RgbaArrayToHTMLColor(color);
      } catch (e) {
      }
    }
    const r = color[0] || 0;
    const g = color[1] || 0;
    const b = color[2] || 0;
    const a = color[3] != null ? color[3] : 1;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
  function catalogFingerprint(entries) {
    return "v" + FBM.CATALOG_CACHE_VERSION + "|" + entries.map(function(e) {
      return e.id + ":" + e.type + ":" + e.style;
    }).join("|");
  }
  function collectRaw() {
    const tiles = [];
    const objects = [];
    const effects = [];
    const tileMap = typeof MapDataTiles !== "undefined" ? MapDataTiles : null;
    const objMap = typeof MapDataObjects !== "undefined" ? MapDataObjects : null;
    const fxMap = typeof MapDataEffects !== "undefined" ? MapDataEffects : null;
    if (tileMap && typeof tileMap.forEach === "function") {
      tileMap.forEach(function(t) {
        if (!t || t.ID == null || !t.Type || !t.Style) return;
        if (t.DeprecatedID != null) return;
        tiles.push({ id: t.ID, type: t.Type, style: t.Style, name: t.Name });
      });
    }
    if (objMap && typeof objMap.forEach === "function") {
      objMap.forEach(function(o) {
        if (!o || o.ID == null || !o.Type || !o.Style) return;
        if (o.DeprecatedID != null) return;
        const canCustomize2 = o.CanBeCustomized !== false;
        const layers = [];
        if (Array.isArray(o.Layers)) {
          o.Layers.forEach(function(L) {
            if (L && L.IsColorable) {
              layers.push({
                name: L.Name || "",
                defaultColor: typeof L.DefaultColor === "string" ? L.DefaultColor : "#FFFFFF"
              });
            }
          });
        }
        const canTransform2 = typeof MapCanTransformObject === "function" ? !!MapCanTransformObject(o) : !o.JoinsNeighbors && !o.CanPlaceOnWalls;
        objects.push({
          id: o.ID,
          type: o.Type,
          style: o.Style,
          name: o.Name,
          canCustomize: canCustomize2,
          layers,
          canTransform: canTransform2
        });
      });
    }
    if (fxMap && typeof fxMap.forEach === "function") {
      fxMap.forEach(function(e) {
        if (!e || e.ID == null) return;
        const label = e.Name || EFFECT_LABELS[e.ID] || "Effect " + e.ID;
        effects.push({
          id: e.ID,
          type: e.Type || "StaticLighting",
          style: label.replace(/\s+/g, ""),
          name: label,
          color: Array.isArray(e.Color) ? e.Color : null
        });
      });
    }
    return { tiles, objects, effects };
  }
  function groupTiles(tiles) {
    const byType = {};
    tiles.forEach(function(t) {
      if (!byType[t.type]) byType[t.type] = [];
      byType[t.type].push(t);
    });
    const categories = [];
    Object.keys(byType).sort().forEach(function(type) {
      const list = byType[type];
      const groups = {};
      list.forEach(function(t) {
        const g = stripVariantSuffix(t.style);
        const key = g.base;
        if (!groups[key]) {
          groups[key] = {
            id: "tile:" + type + ":" + key,
            name: humanize(key),
            kind: "tile",
            type,
            groupKey: key,
            canCustomize: false,
            layers: [],
            canTransform: false,
            thumbStyle: t.style,
            thumbId: t.id,
            thumbUrl: "",
            variants: []
          };
        }
        const vName = g.variant ? humanize(g.variant) : t.name && !g.variant ? "Default" : "Default";
        groups[key].variants.push({
          id: "tile-v:" + t.id,
          name: g.variant ? humanize(g.variant) : "Default",
          displayName: itemDisplayName(t),
          clubId: t.id,
          style: t.style,
          colorHint: g.variant,
          thumbUrl: tileThumbUrl(t.id, type, t.style),
          baked: true,
          custom: false
        });
        if (!g.variant) {
          groups[key].thumbStyle = t.style;
          groups[key].thumbId = t.id;
          if (t.name) groups[key].name = humanize(key);
          void vName;
        }
      });
      const bases = Object.keys(groups).sort().map(function(k) {
        const b = groups[k];
        b.variants.sort(function(a, b2) {
          if (a.name === "Default") return -1;
          if (b2.name === "Default") return 1;
          return String(a.name).localeCompare(String(b2.name));
        });
        b.thumbUrl = tileThumbUrl(b.thumbId, type, b.thumbStyle);
        return b;
      });
      categories.push({
        id: "tile-cat:" + type,
        label: typeDisplayName("tile", type),
        typeKey: type,
        kind: "tile",
        bases
      });
    });
    return categories;
  }
  function groupObjects(objects) {
    const byType = {};
    objects.forEach(function(o) {
      if (!byType[o.type]) byType[o.type] = [];
      byType[o.type].push(o);
    });
    const categories = [];
    Object.keys(byType).sort().forEach(function(type) {
      const list = byType[type];
      const useDoorFamilies = type === "WallPath";
      const groups = {};
      list.forEach(function(o) {
        const g = useDoorFamilies ? doorFamilySplit(o.style) : stripVariantSuffix(o.style);
        const canGroup = useDoorFamilies || !!g.variant;
        const key = canGroup ? g.base : "solo:" + o.id;
        const baseName = canGroup ? useDoorFamilies ? humanize(g.base === "Blank" ? "Blank" : g.base) : humanize(g.base) : itemDisplayName(o);
        if (!groups[key]) {
          groups[key] = {
            id: canGroup ? "obj:" + type + ":" + g.base : "obj:" + o.id,
            name: baseName,
            kind: "object",
            type,
            clubId: o.id,
            style: o.style,
            canCustomize: o.canCustomize && (o.layers.length > 0 || o.canTransform),
            layers: o.layers,
            canTransform: o.canTransform,
            thumbUrl: objectThumbUrl(o.id, type, o.style),
            variants: []
          };
        }
        const variantName = g.variant ? humanize(g.variant) : canGroup ? "Default" : "Default";
        groups[key].variants.push({
          id: "obj-v:" + o.id + (canGroup ? ":" + (g.variant || "default") : ":default"),
          name: variantName,
          displayName: itemDisplayName(o),
          clubId: o.id,
          style: o.style,
          colors: o.layers.map(function(L) {
            return L.defaultColor || "Default";
          }),
          rotation: 0,
          size: 100,
          thumbUrl: objectThumbUrl(o.id, type, o.style),
          baked: !groups[key].canCustomize,
          custom: false
        });
        if (!g.variant || /Closed$|Door$/.test(o.style) || o.style === g.base) {
          groups[key].clubId = o.id;
          groups[key].style = o.style;
          groups[key].thumbUrl = objectThumbUrl(o.id, type, o.style);
          groups[key].canCustomize = o.canCustomize && (o.layers.length > 0 || o.canTransform);
          groups[key].layers = o.layers;
          groups[key].canTransform = o.canTransform;
        }
      });
      const bases = Object.keys(groups).sort(function(a, b) {
        return String(groups[a].name).localeCompare(String(groups[b].name));
      }).map(function(k) {
        const b = groups[k];
        b.variants.sort(function(a, b2) {
          if (a.name === "Default") return -1;
          if (b2.name === "Default") return 1;
          return String(a.name).localeCompare(String(b2.name));
        });
        return b;
      });
      categories.push({
        id: "obj-cat:" + type,
        label: typeDisplayName("object", type),
        typeKey: type,
        kind: "object",
        bases
      });
    });
    return categories;
  }
  function groupEffects(effects) {
    const byType = {};
    effects.forEach(function(e) {
      if (!byType[e.type]) byType[e.type] = [];
      byType[e.type].push(e);
    });
    const categories = [];
    Object.keys(byType).sort().forEach(function(type) {
      const bases = byType[type].slice().sort(function(a, b) {
        return a.id - b.id;
      }).map(function(e) {
        const label = e.name || EFFECT_LABELS[e.id] || humanize(e.style) || "Effect " + e.id;
        const css = effectThumbCss(e.color);
        return {
          id: "fx:" + e.id,
          name: label,
          kind: "effect",
          type,
          clubId: e.id,
          style: e.style,
          canCustomize: false,
          layers: [],
          canTransform: false,
          thumbUrl: "",
          thumbCss: css,
          variants: [
            {
              id: "fx-v:" + e.id,
              name: "Default",
              displayName: label,
              clubId: e.id,
              style: e.style,
              thumbUrl: "",
              thumbCss: css,
              baked: true,
              custom: false
            }
          ]
        };
      });
      categories.push({
        id: "fx-cat:" + type,
        label: typeDisplayName("effect", type),
        typeKey: type,
        kind: "effect",
        bases
      });
    });
    return categories;
  }
  FBM.buildMapCatalog = function() {
    const raw = collectRaw();
    const fp = catalogFingerprint(
      raw.tiles.map(function(t) {
        return { id: t.id, type: t.type, style: t.style };
      }).concat(
        raw.objects.map(function(o) {
          return { id: o.id, type: o.type, style: o.style };
        })
      ).concat(
        raw.effects.map(function(e) {
          return { id: e.id, type: e.type, style: e.style };
        })
      )
    );
    const sections = [
      { id: "tiles", label: "Tiles", categories: groupTiles(raw.tiles) },
      { id: "objects", label: "Objects", categories: groupObjects(raw.objects) },
      { id: "effects", label: "Effects", categories: groupEffects(raw.effects) }
    ];
    return {
      fingerprint: fp,
      builtAt: Date.now(),
      sections,
      counts: { tiles: raw.tiles.length, objects: raw.objects.length, effects: raw.effects.length }
    };
  };
  FBM.catalogCacheKey = function() {
    const n = Player && Player.MemberNumber != null ? Player.MemberNumber : "0";
    return FBM.EXTENSION_KEY + "_" + n + "_catalog_v" + FBM.CATALOG_CACHE_VERSION;
  };
  FBM.loadOrBuildCatalog = function() {
    const live = FBM.buildMapCatalog();
    let cached = null;
    try {
      const raw = localStorage.getItem(FBM.catalogCacheKey());
      cached = raw ? FBM.lzReadLocal(raw) : null;
    } catch (e) {
      cached = null;
    }
    if (cached && cached.fingerprint === live.fingerprint && cached.sections) {
      FBM._catalog = cached;
      return cached;
    }
    try {
      localStorage.setItem(FBM.catalogCacheKey(), FBM.lzPackLocal(live));
    } catch (e) {
    }
    FBM._catalog = live;
    return live;
  };
  FBM.getCatalog = function() {
    if (FBM._catalog && FBM._catalog.sections) return FBM._catalog;
    return FBM.loadOrBuildCatalog();
  };
  FBM.findCatalogBase = function(baseId) {
    const cat = FBM.getCatalog();
    if (!cat) return null;
    for (let s = 0; s < cat.sections.length; s++) {
      const sec = cat.sections[s];
      for (let c = 0; c < sec.categories.length; c++) {
        const category = sec.categories[c];
        const base = (category.bases || []).find(function(b) {
          return b && b.id === baseId;
        });
        if (base) return { base, section: sec, category };
      }
    }
    return null;
  };

  // src/map/objectsStore.ts
  function memberKey2(suffix) {
    const n = Player && Player.MemberNumber != null ? Player.MemberNumber : "0";
    return FBM.EXTENSION_KEY + "_" + n + "_" + suffix;
  }
  FBM.DEFAULT_OBJECTS_STATE = {
    categoryOrder: {},
    customVariants: {},
    recent: [],
    singlePlace: false,
    ui: {
      left: null,
      top: null,
      width: 900,
      height: 560,
      extWidth: 260,
      collapsedSections: {}
    }
  };
  FBM.loadObjectsState = function() {
    let data = null;
    try {
      data = FBM.lzReadLocal(localStorage.getItem(memberKey2("objects")));
    } catch (e) {
      data = null;
    }
    const d = FBM.DEFAULT_OBJECTS_STATE;
    const s = data && typeof data === "object" ? data : {};
    FBM.objectsState = {
      categoryOrder: s.categoryOrder && typeof s.categoryOrder === "object" ? s.categoryOrder : {},
      customVariants: s.customVariants && typeof s.customVariants === "object" ? s.customVariants : {},
      recent: Array.isArray(s.recent) ? s.recent.slice(0, 20) : [],
      singlePlace: !!s.singlePlace,
      ui: Object.assign({}, d.ui, s.ui && typeof s.ui === "object" ? s.ui : {})
    };
    return FBM.objectsState;
  };
  FBM.saveObjectsState = function() {
    if (!FBM.objectsState) FBM.loadObjectsState();
    try {
      localStorage.setItem(memberKey2("objects"), FBM.lzPackLocal(FBM.objectsState));
    } catch (e) {
      if (FBM.localMsg) FBM.localMsg("FBM: could not save Objects Build state (storage full?).");
    }
  };
  FBM.applyCategoryOrder = function(catalog) {
    if (!FBM.objectsState) FBM.loadObjectsState();
    const order = FBM.objectsState.categoryOrder || {};
    (catalog.sections || []).forEach(function(sec) {
      const ids = order[sec.id];
      if (!Array.isArray(ids) || !ids.length) return;
      const map = {};
      sec.categories.forEach(function(c) {
        map[c.id] = c;
      });
      const next = [];
      ids.forEach(function(id) {
        if (map[id]) {
          next.push(map[id]);
          delete map[id];
        }
      });
      Object.keys(map).forEach(function(id) {
        next.push(map[id]);
      });
      sec.categories = next;
    });
  };
  FBM.mergeCustomVariants = function(catalog) {
    if (!FBM.objectsState) FBM.loadObjectsState();
    const customs = FBM.objectsState.customVariants || {};
    Object.keys(customs).forEach(function(baseId) {
      const hit = FBM.findCatalogBase(baseId);
      if (!hit || !hit.base) return;
      const list = customs[baseId];
      if (!Array.isArray(list)) return;
      list.forEach(function(v) {
        if (!v || !v.id) return;
        if (hit.base.variants.some(function(x) {
          return x.id === v.id;
        }))
          return;
        hit.base.variants.push(v);
      });
    });
  };
  FBM.prepareObjectsCatalog = function() {
    const cat = FBM.loadOrBuildCatalog();
    FBM.loadObjectsState();
    FBM.applyCategoryOrder(cat);
    FBM.mergeCustomVariants(cat);
    return cat;
  };
  FBM.pushObjectsRecent = function(baseId, variantId) {
    if (!FBM.objectsState) FBM.loadObjectsState();
    const key = baseId + ":" + variantId;
    FBM.objectsState.recent = (FBM.objectsState.recent || []).filter(function(r) {
      return r && r.key !== key;
    });
    FBM.objectsState.recent.unshift({ key, baseId, variantId });
    while (FBM.objectsState.recent.length > 20) FBM.objectsState.recent.pop();
    FBM.saveObjectsState();
  };
  FBM.saveCustomVariant = function(baseId, variant) {
    if (!FBM.objectsState) FBM.loadObjectsState();
    const hit = FBM.findCatalogBase(baseId);
    if (!hit) return null;
    variant.custom = true;
    hit.base.variants = (hit.base.variants || []).filter(function(v) {
      return v.id !== variant.id;
    });
    hit.base.variants.push(variant);
    if (!FBM.objectsState.customVariants[baseId]) FBM.objectsState.customVariants[baseId] = [];
    FBM.objectsState.customVariants[baseId] = FBM.objectsState.customVariants[baseId].filter(function(v) {
      return v.id !== variant.id;
    });
    FBM.objectsState.customVariants[baseId].push(variant);
    FBM.saveObjectsState();
    return variant;
  };
  FBM.deleteCustomVariant = function(baseId, variantId) {
    if (!FBM.objectsState) FBM.loadObjectsState();
    const hit = FBM.findCatalogBase(baseId);
    if (hit) {
      hit.base.variants = (hit.base.variants || []).filter(function(v) {
        return v.id !== variantId;
      });
    }
    if (FBM.objectsState.customVariants[baseId]) {
      FBM.objectsState.customVariants[baseId] = FBM.objectsState.customVariants[baseId].filter(function(v) {
        return v.id !== variantId;
      });
    }
    FBM.saveObjectsState();
  };

  // src/map/objectsPaint.ts
  FBM._objectsPaint = {
    armed: false,
    kind: "",
    // tile | object | effect
    clubId: null,
    settings: null,
    single: false,
    pipet: false,
    lastPaintKey: "",
    applying: false
  };
  function mapApi3() {
    if (typeof MapManager !== "undefined" && MapManager && MapManager.Map) return MapManager.Map;
    if (typeof ChatRoomMapManager !== "undefined" && ChatRoomMapManager && ChatRoomMapManager.Map) {
      return ChatRoomMapManager.Map;
    }
    return null;
  }
  function resolveDoodad(kind, id) {
    if (kind === "tile" && typeof MapDataGetTile === "function") return MapDataGetTile(id);
    if (kind === "object" && typeof MapDataGetObject === "function") return MapDataGetObject(id);
    if (kind === "effect" && typeof MapDataGetEffect === "function") return MapDataGetEffect(id);
    if (typeof MapGetDoodad === "function") {
      const k = kind === "tile" ? "Tile" : kind === "object" ? "Object" : "Effect";
      return MapGetDoodad(k, id);
    }
    return null;
  }
  function editRange() {
    const r = typeof ChatRoomMapViewEditRange === "number" ? ChatRoomMapViewEditRange - 1 : 0;
    return r > 0 ? r : 0;
  }
  FBM.objectsClearBrush = function() {
    FBM._objectsPaint.armed = false;
    FBM._objectsPaint.kind = "";
    FBM._objectsPaint.clubId = null;
    FBM._objectsPaint.settings = null;
    FBM._objectsPaint.lastPaintKey = "";
    if (typeof ChatRoomMapViewSetActiveTool === "function") ChatRoomMapViewSetActiveTool("");
  };
  FBM.objectsArmBrush = function(opts) {
    if (!FBM.mapIsAdmin || !FBM.mapIsAdmin()) {
      if (FBM.localMsg) FBM.localMsg("FBM: admin required to paint.");
      return false;
    }
    const doodad = resolveDoodad(opts.kind, opts.clubId);
    if (!doodad) {
      if (FBM.localMsg) FBM.localMsg("FBM: doodad not found.");
      return false;
    }
    const type = opts.kind === "tile" ? "Tile" : opts.kind === "object" ? "Object" : opts.kind === "effect" ? "Effect" : "";
    if (!type) return false;
    FBM._objectsPaint.armed = true;
    FBM._objectsPaint.kind = opts.kind;
    FBM._objectsPaint.clubId = opts.clubId;
    FBM._objectsPaint.settings = opts.settings || null;
    FBM._objectsPaint.single = !!opts.single;
    FBM._objectsPaint.pipet = false;
    if (typeof ChatRoomMapViewEditorSetSelection === "function") {
      ChatRoomMapViewEditorSetSelection(doodad, type, false);
    } else if (typeof ChatRoomMapViewSetSelection === "function") {
      ChatRoomMapViewSetSelection(doodad, type, false);
    } else {
      ChatRoomMapViewEditMode = type;
      ChatRoomMapViewEditObject = doodad;
      if (typeof ChatRoomMapViewSetActiveTool === "function") ChatRoomMapViewSetActiveTool("Brush");
    }
    FBM.installObjectsPaintHook && FBM.installObjectsPaintHook();
    return true;
  };
  FBM.objectsArmEraser = function() {
    if (!FBM.mapIsAdmin || !FBM.mapIsAdmin()) {
      if (FBM.localMsg) FBM.localMsg("FBM: admin required.");
      return false;
    }
    FBM._objectsPaint.armed = false;
    FBM._objectsPaint.settings = null;
    FBM._objectsPaint.pipet = false;
    if (!ChatRoomMapViewEditMode || ChatRoomMapViewEditMode === "") {
      ChatRoomMapViewEditMode = "Object";
    }
    if (typeof ChatRoomMapViewSetActiveTool === "function") ChatRoomMapViewSetActiveTool("Eraser");
    return true;
  };
  FBM.objectsToggleFog = function() {
    const map = mapApi3();
    if (!map) return false;
    map.hasFogEnabled = !map.hasFogEnabled;
    if (typeof map.updatePlayerPerception === "function") map.updatePlayerPerception();
    return !!map.hasFogEnabled;
  };
  FBM.objectsUndo = function() {
    if (typeof ChatRoomMapViewUndo === "function") {
      ChatRoomMapViewUndo();
      return true;
    }
    const map = mapApi3();
    if (map && typeof map.undo === "function") return !!map.undo();
    return false;
  };
  FBM.objectsForcePlace = function(X, Y) {
    if (!FBM._objectsPaint.armed || FBM._objectsPaint.clubId == null) return false;
    const map = mapApi3();
    if (!map) return false;
    const doodad = resolveDoodad(FBM._objectsPaint.kind, FBM._objectsPaint.clubId);
    if (!doodad) return false;
    const range = editRange();
    try {
      if (FBM._objectsPaint.kind === "tile" && typeof map.setTile === "function") {
        map.setTile(X, Y, doodad, range);
        return true;
      }
      if (FBM._objectsPaint.kind === "object" && typeof map.setObject === "function") {
        map.setObject(X, Y, doodad, range);
        return true;
      }
      if (FBM._objectsPaint.kind === "effect") {
        const blank = typeof ChatRoomMapViewEffectStartID === "number" ? ChatRoomMapViewEffectStartID : 10;
        if (doodad.ID === blank && typeof map.setEffects === "function") {
          map.setEffects(X, Y, [], range);
          return true;
        }
        if (typeof map.addEffect === "function") {
          map.addEffect(X, Y, doodad, range);
          return true;
        }
        if (typeof map.setEffects === "function") {
          map.setEffects(X, Y, [doodad], range);
          return true;
        }
      }
    } catch (e) {
      return false;
    }
    return false;
  };
  FBM.objectsApplyPendingSettings = function(X, Y) {
    const st = FBM._objectsPaint.settings;
    if (!st || FBM._objectsPaint.kind !== "object") return;
    const map = mapApi3();
    if (!map || typeof map.setObjectSettings !== "function") return;
    const changes = {};
    if (st.rotation != null) changes.Rotation = st.rotation;
    if (st.size != null) changes.Size = st.size;
    if (Array.isArray(st.colors) && st.colors.length) {
      changes.Colors = st.colors.map(function(c) {
        return c === "Default" || c == null ? "Default" : c;
      });
    }
    if (!Object.keys(changes).length) return;
    try {
      map.setObjectSettings(X, Y, changes, false);
    } catch (e) {
    }
  };
  function syncMapAfterPaint() {
    const map = mapApi3();
    if (map && typeof map.updateGlobalMapData === "function") map.updateGlobalMapData();
    else if (FBM.pushMapRoomSync) FBM.pushMapRoomSync({ viaMapManager: true });
    if (FBM.markMapDirty) FBM.markMapDirty();
  }
  FBM.objectsOnPainted = function(X, Y) {
    if (!FBM._objectsPaint.armed || FBM._objectsPaint.applying) return;
    FBM._objectsPaint.applying = true;
    try {
      const key = X + "," + Y;
      FBM._objectsPaint.lastPaintKey = key;
      FBM.objectsForcePlace(X, Y);
      FBM.objectsApplyPendingSettings(X, Y);
      syncMapAfterPaint();
      if (FBM._objectsPaint.single) {
        if (FBM.clearObjectsSelection) FBM.clearObjectsSelection();
        else {
          FBM.objectsClearBrush();
          if (FBM.refreshObjectsBuildUi) FBM.refreshObjectsBuildUi();
        }
        if (FBM.localMsg) FBM.localMsg("FBM: placed (single).");
      }
    } finally {
      FBM._objectsPaint.applying = false;
    }
  };
  FBM.objectsSetPipet = function(on) {
    FBM._objectsPaint.pipet = !!on;
    if (on) {
      FBM.objectsClearBrush();
      FBM._objectsPaint.pipet = true;
    }
  };
  FBM.objectsPipetSample = function(X, Y) {
    if (!FBM._objectsPaint.pipet) return null;
    const map = mapApi3();
    if (!map) return null;
    const tileId = typeof map.getTileId === "function" ? map.getTileId(X, Y) : null;
    const objId = typeof map.getObjectId === "function" ? map.getObjectId(X, Y) : null;
    const settings = typeof map.getObjectSettings === "function" ? map.getObjectSettings(X, Y) : null;
    const blank = typeof ChatRoomMapViewObjectStartID === "number" ? ChatRoomMapViewObjectStartID : 100;
    let kind = "tile";
    let clubId = tileId;
    if (objId != null && objId > blank) {
      kind = "object";
      clubId = objId;
    }
    const cat = FBM.getCatalog && FBM.getCatalog();
    if (!cat) return null;
    let found = null;
    cat.sections.forEach(function(sec) {
      sec.categories.forEach(function(c) {
        (c.bases || []).forEach(function(b) {
          if (found) return;
          if (kind === "object" && b.kind === "object") {
            const v = (b.variants || []).find(function(x) {
              return x.clubId === clubId;
            });
            if (v || b.clubId === clubId) found = { base: b, section: sec, category: c, variant: v };
          }
          if (kind === "tile" && b.kind === "tile") {
            const v = (b.variants || []).find(function(x) {
              return x.clubId === clubId;
            });
            if (v) found = { base: b, section: sec, category: c, variant: v };
          }
        });
      });
    });
    if (!found) {
      if (FBM.localMsg) FBM.localMsg("FBM: pipet \u2014 no catalog match.");
      return null;
    }
    const thumb = FBM.snapshotObjectVariantThumb && FBM.snapshotObjectVariantThumb({
      X,
      Y,
      tileId,
      objectId: kind === "object" ? clubId : null,
      settings: kind === "object" ? settings : null,
      size: 96
    });
    if (kind === "object" && found.base.canCustomize && settings) {
      const isDefault = (!settings.Rotation || settings.Rotation === 0) && (!settings.Size || settings.Size === 100) && (!settings.Colors || !settings.Colors.some(function(c) {
        return c && c !== "Default";
      }));
      if (!isDefault && FBM.promptText) {
        const baseId = found.base.id;
        const style = found.base.style;
        const colors = Array.isArray(settings.Colors) ? settings.Colors.slice() : [];
        const rotation = settings.Rotation || 0;
        const size = settings.Size || 100;
        const thumbUrl = thumb || "";
        const sampleClubId = clubId;
        FBM._objectsPaint.pipet = false;
        FBM.promptText("Save sampled look as variant name?", {
          initial: "Sampled",
          confirmLabel: "Save",
          maxlength: 40
        }).then(function(name) {
          if (name == null || !String(name).trim()) return;
          const variant = {
            id: "custom-" + Date.now().toString(36),
            name: String(name).trim().slice(0, 40),
            clubId: sampleClubId,
            style,
            colors,
            rotation,
            size,
            thumbUrl,
            custom: true
          };
          FBM.saveCustomVariant(baseId, variant);
          if (FBM._objectsUi) {
            FBM._objectsUi.baseId = baseId;
            FBM._objectsUi.variantId = variant.id;
          }
          if (FBM.refreshObjectsBuildUi) FBM.refreshObjectsBuildUi();
          if (FBM.localMsg) FBM.localMsg("FBM: pipet saved \u201C" + variant.name + "\u201D.");
        });
        return found;
      }
    }
    FBM._objectsPaint.pipet = false;
    return found;
  };
  function wrapPaintFn(fn, label) {
    if (!fn || fn._fbmWrapped) return fn;
    const orig = typeof fn === "function" ? fn : null;
    if (!orig) return fn;
    const wrapped = function() {
      const args = arguments;
      const ret = orig.apply(this, args);
      if (FBM._objectsPaint && FBM._objectsPaint.armed && !FBM._objectsPaint.applying) {
        let x = args[0];
        let y = args[1];
        if (typeof y !== "number" && typeof x === "number" && typeof MapIndexToCoordinates === "function") {
          try {
            const pos = MapIndexToCoordinates(x);
            x = pos.X;
            y = pos.Y;
          } catch (e) {
            return ret;
          }
        }
        if (typeof x === "number" && typeof y === "number") {
          FBM.objectsOnPainted(x, y);
        }
      }
      return ret;
    };
    wrapped._fbmWrapped = true;
    wrapped._fbmLabel = label;
    return wrapped;
  }
  FBM.installObjectsPaintHook = function() {
    if (typeof ChatRoomMapViewTools !== "undefined" && ChatRoomMapViewTools && ChatRoomMapViewTools.Brush) {
      const brush = ChatRoomMapViewTools.Brush;
      if (brush && typeof brush.paint === "function" && !brush._fbmWrapped) {
        const orig = brush.paint.bind(brush);
        brush.paint = function(x, y, range, event) {
          orig(x, y, range, event);
          if (FBM._objectsPaint && FBM._objectsPaint.armed) {
            FBM.objectsOnPainted(x, y);
          }
        };
        brush._fbmWrapped = true;
        FBM._objectsPaintHooked = true;
      }
    }
    const map = mapApi3();
    if (map && !map._fbmObjectsPaintWrapped) {
      if (typeof map.setObject === "function") {
        map.setObject = wrapPaintFn(map.setObject, "setObject");
      }
      if (typeof map.setTile === "function") {
        map.setTile = wrapPaintFn(map.setTile, "setTile");
      }
      if (typeof map.addEffect === "function") {
        map.addEffect = wrapPaintFn(map.addEffect, "addEffect");
      }
      if (typeof map.setEffects === "function") {
        map.setEffects = wrapPaintFn(map.setEffects, "setEffects");
      }
      map._fbmObjectsPaintWrapped = true;
      FBM._objectsPaintHooked = true;
    }
  };

  // src/map/hooks.ts
  FBM._toolbarExpanded = false;
  FBM._zoomApplied = false;
  FBM._prevZoomMax = null;
  FBM._buildBarOpen = false;
  FBM.TOOLBAR_PLUS = { x: 10, y: 10, w: 36, h: 36 };
  FBM.TOOLBAR_FBM_COLLAPSED = { x: 10, y: 52, w: 36, h: 36 };
  FBM.TOOLBAR_BTN = 36;
  FBM.TOOLBAR_STACK_GAP = 6;
  FBM.TOOLBAR_COLLAPSE_Y = 58;
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
    const st = window.getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden" || Number(st.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  }
  FBM.computeMapChromeLayout = function() {
    const btn = FBM.TOOLBAR_BTN || 36;
    const gap = FBM.TOOLBAR_STACK_GAP || 6;
    const plus = cloneRect(FBM.TOOLBAR_PLUS);
    const fbmCollapsed = cloneRect(FBM.TOOLBAR_FBM_COLLAPSED);
    if (FBM.toolbarShouldHide()) {
      const layout2 = { plus, collapse: null, fbm: fbmCollapsed, fullyOpen: false };
      FBM._mapChromeLayout = layout2;
      return layout2;
    }
    const canvas = typeof FBM.getMainCanvasEl === "function" ? FBM.getMainCanvasEl() : document.getElementById("MainCanvas");
    const panel = document.getElementById(FBM.MAP_EDITOR_PANEL_ID || "chat-room-map-view-panel");
    const search = document.getElementById("chat-room-map-view-panel-search");
    const buttons = document.getElementById("chat-room-map-view-panel-buttons-list");
    let collapse = cloneRect(FBM.TOOLBAR_COLLAPSE);
    let fbm = cloneRect(FBM.TOOLBAR_FBM_EXPANDED);
    let fullyOpen = false;
    if (canvas && panel && elVisible(panel) && !panel.classList.contains("fbm-panel-collapsed")) {
      const cr = canvas.getBoundingClientRect();
      if (cr.width > 1 && cr.height > 1) {
        const sx = 2e3 / cr.width;
        const sy = 1e3 / cr.height;
        const toClub = function(clientX, clientY) {
          return {
            x: (clientX - cr.left) * sx,
            y: (clientY - cr.top) * sy
          };
        };
        fullyOpen = panel.hasAttribute("data-edit-mode") || typeof ChatRoomMapViewEditMode !== "undefined" && !!ChatRoomMapViewEditMode;
        const pr = panel.getBoundingClientRect();
        const br = elVisible(buttons) ? buttons.getBoundingClientRect() : null;
        let edgeClient;
        let padClient;
        let topClient;
        if (fullyOpen) {
          edgeClient = pr.right;
          padClient = 16;
          topClient = elVisible(search) ? search.getBoundingClientRect().top : pr.top + 4;
        } else {
          const firstBtn = buttons && (buttons.querySelector("button") || buttons.querySelector("[role='button']") || buttons.firstElementChild);
          const fr = firstBtn && elVisible(firstBtn) ? firstBtn.getBoundingClientRect() : null;
          edgeClient = fr ? fr.right : br ? br.right : pr.left + 68;
          padClient = 12;
          topClient = fr ? fr.top : br ? br.top : pr.top + 2;
        }
        const club = toClub(edgeClient + padClient, topClient);
        let x = Math.round(club.x);
        let y = FBM.TOOLBAR_COLLAPSE_Y != null ? FBM.TOOLBAR_COLLAPSE_Y : 58;
        if (fullyOpen) {
          x = Math.max(x, Math.round(toClub(pr.right, topClient).x + 22));
          if (elVisible(search)) {
            const searchY = Math.round(toClub(0, search.getBoundingClientRect().top).y);
            y = Math.max(y, searchY);
          }
        } else {
          x = Math.max(88, Math.min(x + 6, 130));
        }
        collapse = { x, y, w: btn, h: btn };
        fbm = { x, y: y + btn + gap, w: btn, h: btn };
      }
    }
    const m = FBM.mapBag();
    const showCollapse = !!(m.hideBuildToolbar && FBM._toolbarExpanded);
    if (!showCollapse) {
      fbm = collapse ? { x: collapse.x, y: collapse.y, w: btn, h: btn } : cloneRect(FBM.TOOLBAR_FBM_PANEL);
      collapse = null;
    }
    const layout = { plus, collapse, fbm, fullyOpen };
    FBM._mapChromeLayout = layout;
    return layout;
  };
  FBM.mapDrawTypingIndicators = function(Left, Top, Width, Height) {
    const m = FBM.mapBag();
    if (!m.typingIndicator) return 0;
    if (!Player || !Player.MapData || !Player.MapData.Pos) return 0;
    if (typeof ChatRoomCharacter === "undefined" || !ChatRoomCharacter) return 0;
    if (typeof FBM.mapTileLayout !== "function" || typeof FBM.mapScreenFromTile !== "function") return 0;
    const layout = FBM.mapTileLayout(Left, Top, Width, Height);
    const TileSize = layout.TileSize;
    if (!(TileSize > 0) || !isFinite(TileSize)) return 0;
    const frame = FBM.mapTalkFrame();
    const icon = FBM.mapTalkIconPath(frame);
    const size = FBM.mapTalkSize(TileSize);
    let drawn = 0;
    ChatRoomCharacter.forEach(function(C) {
      if (!FBM.mapShouldDrawTalk(C)) return;
      if (!C.MapData || !C.MapData.Pos) return;
      if (!FBM.mapCharVisible(C)) return;
      const s = FBM.mapScreenFromTile(C.MapData.Pos.X, C.MapData.Pos.Y, layout.Left, layout.Top, layout.Width, layout.Height);
      const CharX = s.Left + TileSize * 0.05;
      const CharY = s.Top - TileSize * 0.85;
      const zoom = TileSize * 1.8 / 1e3;
      const bx = CharX + 250 * zoom - size.w / 2;
      const by = CharY - size.h - 4 * size.scale;
      if (typeof DrawImageResize === "function") DrawImageResize(icon, bx, by, size.w, size.h);
      drawn += 1;
    });
    return drawn;
  };
  FBM.mapDrawInvisibleWalls = function(Left, Top, Width, Height) {
    const m = FBM.mapBag();
    if (!m || !m.showInvisibleWalls) return;
    if (!Player || !Player.MapData || !Player.MapData.Pos) return;
    const map = typeof MapManager !== "undefined" && MapManager && MapManager.Map ? MapManager.Map : null;
    if (!map || typeof map.getObject !== "function") return;
    const layout = FBM.mapTileLayout(Left, Top, Width, Height);
    const TileSize = layout.TileSize;
    const range = layout.range;
    const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
    const h = typeof ChatRoomMapViewHeight === "number" ? ChatRoomMapViewHeight : 40;
    const px = Player.MapData.Pos.X;
    const py = Player.MapData.Pos.Y;
    const xMin = Math.max(0, px - range);
    const xMax = Math.min(w - 1, px + range);
    const yMin = Math.max(0, py - range);
    const yMax = Math.min(h - 1, py + range);
    const fogOn = typeof ChatRoomMapFogIsActive === "function" && ChatRoomMapFogIsActive();
    function blocksStanding(obj) {
      if (!obj || obj.Type !== "EmptySpace") return false;
      if (typeof ChatRoomMapViewObjectBlocksStanding === "function") {
        return !!ChatRoomMapViewObjectBlocksStanding(obj);
      }
      return !!(obj.CanEnter && obj.CanEnter("") === false);
    }
    function drawMark(rect) {
      if (typeof ChatRoomMapViewDrawObstacleMark === "function") {
        ChatRoomMapViewDrawObstacleMark(rect);
        return;
      }
      if (typeof MainCanvas === "undefined" || !MainCanvas) return;
      const insetX = rect.w * 0.18;
      const insetY = rect.h * 0.18;
      MainCanvas.save();
      MainCanvas.beginPath();
      MainCanvas.lineWidth = Math.max(2, Math.min(rect.w, rect.h) * 0.08);
      MainCanvas.lineCap = "round";
      MainCanvas.strokeStyle = "#e02020";
      MainCanvas.moveTo(rect.x + insetX, rect.y + insetY);
      MainCanvas.lineTo(rect.x + rect.w - insetX, rect.y + rect.h - insetY);
      MainCanvas.moveTo(rect.x + rect.w - insetX, rect.y + insetY);
      MainCanvas.lineTo(rect.x + insetX, rect.y + rect.h - insetY);
      MainCanvas.stroke();
      MainCanvas.restore();
    }
    for (let Y = yMin; Y <= yMax; Y++) {
      for (let X = xMin; X <= xMax; X++) {
        if (fogOn && typeof ChatRoomMapViewTileIsHidden === "function" && ChatRoomMapViewTileIsHidden(X, Y)) {
          continue;
        }
        const obj = map.getObject(X, Y);
        if (!blocksStanding(obj)) continue;
        const s = FBM.mapScreenFromTile(X, Y, layout.Left, layout.Top, layout.Width, layout.Height);
        drawMark({ x: s.Left, y: s.Top, w: TileSize, h: TileSize });
      }
    }
  };
  FBM.mapDrawGridOverlay = function(Left, Top, Width, Height) {
    const m = FBM.mapBag();
    if (!m.buildingTools || !m.gridOn) return;
    if (!Player || !Player.MapData || !Player.MapData.Pos) return;
    if (typeof DrawEmptyRect !== "function" && typeof DrawRect !== "function") return;
    const layout = FBM.mapTileLayout(Left, Top, Width, Height);
    const range = layout.range;
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
      const s = FBM.mapScreenFromTile(worldX, py, layout.Left, layout.Top, layout.Width, layout.Height);
      if (typeof DrawRect === "function") DrawRect(s.Left, layout.Top, thick || 1, layout.Height, color);
    }
    function hline(worldY, color, thick) {
      if (worldY < yMin || worldY > yMax) return;
      const s = FBM.mapScreenFromTile(px, worldY, layout.Left, layout.Top, layout.Width, layout.Height);
      if (typeof DrawRect === "function") DrawRect(layout.Left, s.Top, layout.Width, thick || 1, color);
    }
    for (let x = 0; x < w; x += 5) vline(x, "rgba(255,255,255,0.22)", 1);
    for (let y = 0; y < h; y += 5) hline(y, "rgba(255,255,255,0.22)", 1);
    vline(midX, "rgba(212,160,23,0.55)", 2);
    hline(midY, "rgba(212,160,23,0.55)", 2);
  };
  FBM.mapIsMaxBlind = function() {
    if (!Player || typeof Player.GetBlindLevel !== "function") return false;
    return Player.GetBlindLevel() >= 3;
  };
  FBM.mapCharDrawPos = function(Left, Top, Width, Height, dx, dy) {
    const px = Player && Player.MapData && Player.MapData.Pos ? Player.MapData.Pos.X : 0;
    const py = Player && Player.MapData && Player.MapData.Pos ? Player.MapData.Pos.Y : 0;
    const s = FBM.mapScreenFromTile(px + dx, py + dy, Left, Top, Width, Height);
    const TileSize = s.TileSize || s.TileWidth;
    return {
      x: s.Left + TileSize * 0.05,
      y: s.Top - TileSize * 0.85,
      zoom: TileSize * 1.8 / 1e3
    };
  };
  FBM.mapDrawCharacterGrey = function(C, x, y, zoom) {
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
  FBM.mapDrawGenericSilhouette = function(x, y, zoom) {
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
      ctx.ellipse(ox + 250 * z, oy + 110 * z, 55 * z, 70 * z, 0, 0, Math.PI * 2);
      ctx.fill();
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
  FBM.mapDrawBlindfold = function(Left, Top, Width, Height) {
    const m = FBM.mapBag();
    if (!m.fullBlindfold || !FBM.mapIsMaxBlind()) return;
    if (!Player || !Player.MapData || !Player.MapData.Pos) return;
    const layout = FBM.mapTileLayout(Left, Top, Width, Height);
    const TileSize = layout.TileSize;
    const range = layout.range;
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
        const s = FBM.mapScreenFromTile(X, Y, layout.Left, layout.Top, layout.Width, layout.Height);
        if (cheb > 1) {
          if (typeof DrawRect === "function") DrawRect(s.Left, s.Top, TileSize + 0.5, TileSize + 0.5, "#000000");
          continue;
        }
        const isWall = FBM.mapIsWall(X, Y);
        const blocked = isWall || (FBM.mapIsBlocked ? FBM.mapIsBlocked(X, Y) : false);
        if (cheb === 0 || !blocked) {
          if (typeof DrawRect === "function") DrawRect(s.Left, s.Top, TileSize + 0.5, TileSize + 0.5, "#000000");
        } else if (typeof DrawRect === "function") {
          DrawRect(s.Left, s.Top, TileSize + 0.5, TileSize + 0.5, isWall ? "#3a3a3a" : "#7a7a7a");
        }
      }
    }
    if (typeof ChatRoomCharacter !== "undefined" && ChatRoomCharacter) {
      ChatRoomCharacter.forEach(function(C) {
        if (!C || !C.MapData || !C.MapData.Pos) return;
        if (typeof C.IsPlayer === "function" && C.IsPlayer()) return;
        if (Player && C.MemberNumber === Player.MemberNumber) return;
        const dx = C.MapData.Pos.X - px;
        const dy = C.MapData.Pos.Y - py;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 1) return;
        const pos = FBM.mapCharDrawPos(layout.Left, layout.Top, layout.Width, layout.Height, dx, dy);
        if (othersStyle === "silhouette") {
          FBM.mapDrawGenericSilhouette(pos.x, pos.y, pos.zoom);
        } else if (typeof DrawCharacter === "function") {
          FBM.mapDrawCharacterGrey(C, pos.x, pos.y, pos.zoom);
        }
      });
    }
    if (typeof DrawCharacter === "function") {
      const self = FBM.mapCharDrawPos(layout.Left, layout.Top, layout.Width, layout.Height, 0, 0);
      DrawCharacter(Player, self.x, self.y, self.zoom);
    }
  };
  FBM.applyZoomSetting = function() {
    const m = FBM.mapBag();
    if (typeof ChatRoomMapViewPerceptionRangeMax !== "number") return;
    const cur = ChatRoomMapViewPerceptionRangeMax;
    const want = !!(m.fullZoomOut && FBM.mapIsAdmin && FBM.mapIsAdmin());
    if (want) {
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
  FBM.zoomOutForBuild = function() {
    FBM.applyZoomSetting();
    const m = FBM.mapBag();
    if (!m.fullZoomOut) {
      FBM.localMsg("FBM: enable Full map zoom-out in settings first.");
      return;
    }
    if (!FBM.mapIsAdmin || !FBM.mapIsAdmin()) {
      FBM.localMsg("FBM: Full map zoom-out is admin-only.");
      return;
    }
    if (typeof ChatRoomMapViewPerceptionRange === "number" && typeof ChatRoomMapViewPerceptionRangeMax === "number") {
      ChatRoomMapViewPerceptionRange = ChatRoomMapViewPerceptionRangeMax;
    }
    if (typeof ChatRoomMapViewVisibilityMask !== "undefined") fillMask(ChatRoomMapViewVisibilityMask);
    if (typeof ChatRoomMapViewCalculatePerceptionMasks === "function") {
      ChatRoomMapViewCalculatePerceptionMasks();
      if (typeof ChatRoomMapViewVisibilityMask !== "undefined") fillMask(ChatRoomMapViewVisibilityMask);
    }
  };
  FBM.MAP_EDITOR_PANEL_ID = "chat-room-map-view-panel";
  FBM.toolbarShouldHide = function() {
    const m = FBM.mapBag();
    return !!(m.hideBuildToolbar && !FBM._toolbarExpanded);
  };
  FBM.syncMapEditorPanel = function() {
    const panel = typeof ElementWrap === "function" ? ElementWrap(FBM.MAP_EDITOR_PANEL_ID) : document.getElementById(FBM.MAP_EDITOR_PANEL_ID);
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
  function drawChromeIconButton(r, iconPath) {
    DrawButton(r.x, r.y, r.w, r.h, "", "White", "");
    const pad = Math.max(3, Math.round(Math.min(r.w, r.h) * 0.12));
    if (typeof DrawImageResize === "function") {
      DrawImageResize(iconPath, r.x + pad, r.y + pad, r.w - pad * 2, r.h - pad * 2);
    } else if (typeof DrawImageEx === "function") {
      DrawImageEx(
        iconPath,
        r.x + pad,
        r.y + pad,
        { Width: r.w - pad * 2, Height: r.h - pad * 2 }
      );
    }
  }
  FBM.toggleMapSuperPowers = function() {
    if (!FBM.mapIsAdmin || !FBM.mapIsAdmin()) return false;
    try {
      ChatRoomMapViewSuperPowersActive = !ChatRoomMapViewSuperPowersActive;
    } catch (e) {
      return false;
    }
    try {
      if (typeof MapManager !== "undefined" && MapManager && MapManager.Map && typeof MapManager.Map.updatePlayerPerception === "function") {
        MapManager.Map.updatePlayerPerception();
      }
    } catch (e) {
    }
    const btn = document.getElementById("chat-room-map-superpowers-btn");
    if (btn && typeof ElementButton !== "undefined" && ElementButton && typeof ElementButton.SetImage === "function") {
      try {
        ElementButton.SetImage(
          btn,
          "Icons/" + (ChatRoomMapViewSuperPowersActive ? "SuperPowersActive" : "SuperPowersInactive") + ".png"
        );
      } catch (e) {
      }
    }
    if (FBM.refreshBuildBarStar) FBM.refreshBuildBarStar();
    return true;
  };
  FBM.drawMapChromeButtons = function() {
    if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return;
    FBM.syncMapEditorPanel();
    if (FBM.syncHideArrowKeysDom) FBM.syncHideArrowKeysDom();
    if (typeof DrawButton !== "function") return;
    const m = FBM.mapBag();
    const layout = FBM.computeMapChromeLayout();
    const draw = function() {
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
  FBM.handleMapChromeClick = function() {
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
    if (m.hideArrowKeys && typeof MouseX === "number" && typeof MouseY === "number" && MouseX >= 790 && MouseX <= 990 && MouseY >= 860 && MouseY <= 1e3) {
      return true;
    }
    if (FBM.toolbarShouldHide() && typeof MouseX === "number" && MouseX <= 100 && typeof MouseY === "number" && MouseY <= 500) {
      return true;
    }
    return false;
  };
  FBM.mapHearingRangeTiles = function() {
    let max = FBM.ZOOM_DEFAULT_MAX || 7;
    if (typeof ChatRoomMapViewPerceptionRangeMax === "number" && isFinite(ChatRoomMapViewPerceptionRangeMax)) {
      if (FBM._zoomApplied || ChatRoomMapViewPerceptionRangeMax === FBM.ZOOM_SUPER_MAX) {
        max = FBM.ZOOM_DEFAULT_MAX || 7;
      } else {
        max = ChatRoomMapViewPerceptionRangeMax;
      }
    }
    let deaf = 0;
    if (Player && typeof Player.GetDeafLevel === "function") deaf = Player.GetDeafLevel() || 0;
    return Math.max(0, max - deaf);
  };
  FBM.mapHearingWhisperOk = function(C) {
    if (!C || !C.MapData || !C.MapData.Pos || !Player || !Player.MapData || !Player.MapData.Pos) return false;
    const Distance = Math.max(
      Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X),
      Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y)
    );
    if (Distance > FBM.mapHearingRangeTiles()) return false;
    if (typeof ChatRoomMapViewCharacterIsHearable === "function") {
      return !!ChatRoomMapViewCharacterIsHearable(C);
    }
    return true;
  };
  FBM.mapTypingTargetActive = function() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = (el.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (el.isContentEditable) return true;
    return false;
  };
  FBM.clearMapMoveKeys = function() {
    if (typeof ChatRoomMapViewKeysPressed === "undefined" || !ChatRoomMapViewKeysPressed) return;
    const k = ChatRoomMapViewKeysPressed;
    if ("North" in k) {
      k.North = k.South = k.West = k.East = false;
    } else {
      k.u = k.d = k.l = k.r = false;
    }
  };
  FBM.installUiKeyGuard = function() {
    if (FBM._uiKeyGuardBound) return;
    FBM._uiKeyGuardBound = true;
    const guard = function(e) {
      const t = e && e.target;
      if (!t) return;
      const tag = (t.tagName || "").toUpperCase();
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
      if (!typing) return;
      if (!t.closest || !t.closest("#fbm-root")) return;
      if (FBM.clearMapMoveKeys) FBM.clearMapMoveKeys();
      if (t.id === "fbm-fc-input" || t.closest && t.closest("#fbm-fc-ac")) return;
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    };
    document.addEventListener("keydown", guard, true);
    document.addEventListener("keyup", guard, true);
  };
  FBM.installMap = function() {
    FBM.applyZoomSetting();
    FBM.installDrawButtonFilter();
    FBM.patchMapViewMethods();
    if (FBM.installRoomUpdateHide) FBM.installRoomUpdateHide();
    if (FBM.installCopyEscape) FBM.installCopyEscape();
    if (FBM.installObjectsPaintHook) FBM.installObjectsPaintHook();
    if (FBM.installObjectsSelectionEscape) FBM.installObjectsSelectionEscape();
    FBM.installUiKeyGuard();
    FBM.tryHook("mapKeyDown", "ChatRoomMapViewKeyDown", 20, function(args, next) {
      if (FBM.mapTypingTargetActive()) {
        FBM.clearMapMoveKeys();
        return false;
      }
      return next(args);
    });
    FBM.tryHook("whisper", "ChatRoomMapViewCharacterOnWhisperRange", 4, function(args, next) {
      if (FBM.mapBag().hearingWhisper && FBM.mapIsMapRoom()) {
        return FBM.mapHearingWhisperOk(args[0]);
      }
      return next(args);
    });
    FBM.tryHook("drawGrid", "ChatRoomMapViewDrawGrid", 4, function(args, next) {
      const ret = next(args);
      const Left = args[0];
      const Top = args[1];
      const Width = args[2];
      const Height = args[3];
      FBM._mapDrawRect = {
        Left: Number(Left) || 0,
        Top: Number(Top) || 0,
        Width: Number(Width) > 0 ? Number(Width) : 1e3,
        Height: Number(Height) > 0 ? Number(Height) : 1e3
      };
      const run = function(label, fn) {
        try {
          fn();
        } catch (e) {
          console.error("[FBM] map overlay:" + label, e);
        }
      };
      run("patch", function() {
        FBM.patchMapViewMethods();
      });
      run("blindfold", function() {
        if (FBM.mapDrawBlindfold) FBM.mapDrawBlindfold(Left, Top, Width, Height);
      });
      run("invisibleWalls", function() {
        if (FBM.mapDrawInvisibleWalls) FBM.mapDrawInvisibleWalls(Left, Top, Width, Height);
      });
      run("grid", function() {
        if (FBM.mapDrawGridOverlay) FBM.mapDrawGridOverlay(Left, Top, Width, Height);
      });
      run("copyHighlight", function() {
        if (FBM.copyDrawHighlight) FBM.copyDrawHighlight(Left, Top, Width, Height);
      });
      run("typing", function() {
        if (FBM.mapDrawTypingIndicators) FBM.mapDrawTypingIndicators(Left, Top, Width, Height);
      });
      return ret;
    });
    FBM.tryHook("updateFlag", "ChatRoomMapViewUpdateFlag", 4, function(args, next) {
      const ret = next(args);
      if (FBM.mapIsAdmin()) FBM.markMapDirty();
      return ret;
    });
    FBM.tryHook("activateView", "ChatRoomActivateView", 0, function(args, next) {
      const ret = next(args);
      FBM.installDrawButtonFilter();
      FBM.patchMapViewMethods();
      FBM.syncMapEditorPanel();
      if (FBM.closeBuildBarIfOffMap) FBM.closeBuildBarIfOffMap();
      else if (FBM.refreshBuildBar) FBM.refreshBuildBar();
      return ret;
    });
    FBM.tryHook("mapActivate", "ChatRoomMapViewActivate", 0, function(args, next) {
      const ret = next(args);
      FBM.patchMapViewMethods();
      FBM.syncMapEditorPanel();
      if (FBM.closeBuildBarIfOffMap) FBM.closeBuildBarIfOffMap();
      else if (FBM.refreshBuildBar) FBM.refreshBuildBar();
      return ret;
    });
    FBM.tryHook("mapShowEditor", "ChatRoomMapViewShowEditor", 0, function(args, next) {
      const ret = next(args);
      FBM.syncMapEditorPanel();
      return ret;
    });
    FBM.tryHook("mapReloadEditor", "ChatRoomMapViewReloadEditorPanel", 0, function(args, next) {
      const ret = next(args);
      FBM.syncMapEditorPanel();
      return ret;
    });
  };

  // src/ui/styles.ts
  FBM.STYLES = `
/* R132+ Club map editor is HTML (#chat-room-map-view-panel), not canvas DrawButton */
#chat-room-map-view-panel.fbm-panel-collapsed {
	display: none !important;
	pointer-events: none !important;
	visibility: hidden !important;
}
/* Hide Club map movement / SuperPowers pad (HTML controls on newer Club) */
body.fbm-hide-arrow-keys #chat-room-map-controls {
	display: none !important;
	pointer-events: none !important;
	visibility: hidden !important;
}
#fbm-root {
	--fbm-bg: rgba(28, 22, 38, 0.96);
	--fbm-surface: rgba(42, 34, 56, 0.95);
	--fbm-surface2: rgba(60, 48, 80, 0.9);
	--fbm-field: rgba(20, 16, 28, 0.9);
	--fbm-border: rgba(255, 255, 255, 0.12);
	--fbm-text: #f0e6d4;
	--fbm-muted: #a898b0;
	--fbm-accent: #d4a017;
	--fbm-accent-soft: rgba(212, 160, 23, 0.18);
	--fbm-danger: #e06c75;
	--fbm-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
	--fbm-thumb: #2a2038;
	--fbm-thumb-deep: #1e1830;
	font: 13px/1.35 system-ui, -apple-system, Segoe UI, sans-serif;
	color: var(--fbm-text);
	pointer-events: none;
	z-index: 12000;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
#fbm-root * { box-sizing: border-box; }
#fbm-root button, #fbm-root input, #fbm-root select, #fbm-root textarea, #fbm-root .fbm-panel, #fbm-root .fbm-panel *,
#fbm-root .fbm-build-bar, #fbm-root .fbm-build-bar *,
#fbm-root .fbm-templates, #fbm-root .fbm-templates *,
#fbm-root .fbm-objects, #fbm-root .fbm-objects *,
#fbm-root .fbm-objset, #fbm-root .fbm-objset *,
#fbm-root .fbm-colorpick, #fbm-root .fbm-colorpick *,
#fbm-root .fbm-float-chat, #fbm-root .fbm-float-chat *,
#fbm-root .fbm-toast,
#fbm-root .fbm-cl-banner,
#fbm-root .fbm-cl-modal, #fbm-root .fbm-cl-modal *,
#fbm-root .fbm-prompt-overlay, #fbm-root .fbm-prompt-overlay * { pointer-events: auto; }
/* Club character dialog (restraints / activities): hide FBM overlays, keep open state. */
#fbm-root.fbm-dialog-suspend > .fbm-float-chat,
#fbm-root.fbm-dialog-suspend > .fbm-panel,
#fbm-root.fbm-dialog-suspend > .fbm-objects,
#fbm-root.fbm-dialog-suspend > .fbm-build-bar,
#fbm-root.fbm-dialog-suspend > .fbm-templates,
#fbm-root.fbm-dialog-suspend > .fbm-objset,
#fbm-root.fbm-dialog-suspend > .fbm-colorpick,
#fbm-root.fbm-dialog-suspend > .fbm-cl-banner,
#fbm-root.fbm-dialog-suspend > .fbm-cl-modal {
	visibility: hidden !important;
	pointer-events: none !important;
}
/* Keep name prompts usable even while Club dialog suspends other chrome. */
#fbm-root.fbm-dialog-suspend > .fbm-prompt-overlay {
	visibility: visible !important;
	pointer-events: auto !important;
}
#fbm-root ::-webkit-scrollbar { width: 8px; height: 8px; }
#fbm-root ::-webkit-scrollbar-track {
	background: rgba(20, 16, 28, 0.9); border-radius: 4px;
}
#fbm-root ::-webkit-scrollbar-thumb {
	background: rgba(212, 160, 23, 0.55); border-radius: 4px;
}
#fbm-root ::-webkit-scrollbar-thumb:hover {
	background: rgba(212, 160, 23, 0.8);
}
.fbm-panel {
	position: fixed; z-index: 120; top: 72px; right: 56px;
	width: min(440px, calc(100vw - 32px)); height: min(640px, calc(100vh - 96px));
	min-width: 320px; min-height: 360px; display: none; flex-direction: column;
	background: var(--fbm-bg); border: 1px solid var(--fbm-border); border-radius: 8px;
	box-shadow: var(--fbm-shadow); resize: both; overflow: hidden;
}
.fbm-panel.fbm-open { display: flex; }
.fbm-header {
	display: flex; align-items: center; justify-content: space-between; gap: 8px;
	padding: 8px 10px; background: var(--fbm-surface); border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	cursor: grab; user-select: none;
}
.fbm-header:active { cursor: grabbing; }
.fbm-header-title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.fbm-badge {
	font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
	color: var(--fbm-accent); border: 1px solid rgba(212, 160, 23, 0.35);
	border-radius: 999px; padding: 2px 7px; background: transparent;
}
.fbm-icon-btn {
	width: 28px; height: 28px; border: 1px solid var(--fbm-border); border-radius: 6px;
	background: transparent; color: inherit; display: grid; place-items: center; cursor: pointer;
	padding: 0;
}
.fbm-icon-btn:hover { border-color: var(--fbm-accent); color: var(--fbm-accent); }
.fbm-tabs {
	display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 10px 0;
	background: var(--fbm-surface); border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.fbm-tab {
	border: 1px solid transparent; border-bottom: none; border-radius: 6px 6px 0 0;
	background: transparent; color: var(--fbm-muted); padding: 6px 12px; cursor: pointer;
	font: inherit; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;
}
.fbm-tab:hover { color: var(--fbm-accent); }
.fbm-tab.fbm-on {
	color: var(--fbm-accent); border-color: var(--fbm-border); border-bottom-color: transparent;
	background: var(--fbm-bg);
}
.fbm-page {
	display: none; flex: 1; overflow: auto; padding: 12px 14px;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-page.fbm-on { display: block; }
.fbm-muted { color: var(--fbm-muted); }
.fbm-hint { font-size: 12px; line-height: 1.45; margin: 0 0 12px; }
.fbm-section { margin-top: 16px; }
.fbm-section-head {
	font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
	color: var(--fbm-accent); margin-bottom: 8px;
}
.fbm-check-row { display: flex; align-items: flex-start; gap: 10px; margin: 10px 0; cursor: pointer; }
.fbm-check-row input { margin-top: 2px; }
.fbm-row { display: flex; gap: 8px; align-items: center; margin: 8px 0; }
.fbm-row[hidden],
#fbm-obj-custom-actions[hidden],
#fbm-obj-ext-body[hidden] { display: none !important; }
.fbm-indent { margin-left: 1.6em; }
.fbm-row input[type="text"],
.fbm-row input[type="number"],
.fbm-row select,
.fbm-objset input[type="text"],
.fbm-objset select,
.fbm-colorpick input[type="text"] {
	flex: 1; min-width: 0; background: var(--fbm-field); border: 1px solid rgba(255, 255, 255, 0.14);
	color: var(--fbm-text); border-radius: 4px; padding: 6px 8px;
}
.fbm-row select:disabled,
.fbm-row input:disabled { opacity: 0.45; }
.fbm-bar-sync {
	align-self: center; font-size: 11px; color: var(--fbm-muted); padding: 0 6px; white-space: nowrap;
}
.fbm-btn {
	border: 1px solid rgba(255, 255, 255, 0.14); background: var(--fbm-surface2); color: var(--fbm-text);
	border-radius: 4px; padding: 4px 10px; cursor: pointer; font: inherit;
}
.fbm-btn:hover { border-color: var(--fbm-accent); }
.fbm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.fbm-btn-accent { background: var(--fbm-accent-soft); border-color: var(--fbm-accent); color: var(--fbm-accent); }
.fbm-btn-danger { color: var(--fbm-danger); border-color: rgba(224, 108, 117, 0.45); }
.fbm-map-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.fbm-map-item {
	display: flex; align-items: center; gap: 8px; padding: 8px 10px;
	background: rgba(42, 34, 56, 0.85); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px;
}
.fbm-map-item span { flex: 1; min-width: 0; }
.fbm-map-meta { font-size: 11px; color: var(--fbm-muted); }
.fbm-status { margin-top: 10px; font-size: 12px; color: var(--fbm-muted); min-height: 1.2em; }
.fbm-toast {
	position: fixed; z-index: 130; left: 50%; bottom: 28px; transform: translateX(-50%) translateY(12px);
	max-width: min(420px, calc(100vw - 32px)); padding: 10px 14px;
	background: rgba(28, 22, 38, 0.96); color: var(--fbm-text);
	border: 1px solid rgba(212, 160, 23, 0.45); border-radius: 8px;
	box-shadow: var(--fbm-shadow); font-size: 12px; line-height: 1.4;
	opacity: 0; transition: opacity 0.18s ease, transform 0.18s ease;
	pointer-events: none;
}
.fbm-toast.fbm-toast-show {
	opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto;
}

/* \u2014\u2014 Update changelog banner + modal \u2014\u2014 */
.fbm-cl-banner {
	position: fixed; z-index: 121; right: 16px; bottom: 16px;
	display: inline-flex; align-items: center; gap: 10px;
	max-width: min(360px, calc(100vw - 32px));
	padding: 10px 14px;
	background: rgba(28, 22, 38, 0.96); color: var(--fbm-text);
	border: 1px solid rgba(212, 160, 23, 0.5); border-radius: 8px;
	box-shadow: var(--fbm-shadow); cursor: pointer; font: inherit; text-align: left;
	backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
	transition: border-color 0.15s ease, transform 0.15s ease;
}
.fbm-cl-banner[hidden] { display: none !important; }
.fbm-cl-banner:hover { border-color: var(--fbm-accent); transform: translateY(-1px); }
.fbm-cl-banner-badge {
	flex-shrink: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
	padding: 2px 7px; border-radius: 999px; color: var(--fbm-accent);
	background: var(--fbm-accent-soft); border: 1px solid rgba(212, 160, 23, 0.35);
}
.fbm-cl-banner-text { font-weight: 600; font-size: 13px; line-height: 1.3; }
.fbm-cl-modal {
	position: fixed; inset: 0; z-index: 140;
	display: flex; align-items: center; justify-content: center;
	padding: 16px;
}
.fbm-cl-modal[hidden] { display: none !important; }
.fbm-cl-backdrop {
	position: absolute; inset: 0; background: rgba(8, 6, 12, 0.62);
	backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
}
.fbm-cl-card {
	position: relative; z-index: 1; width: min(520px, calc(100vw - 32px));
	max-height: min(720px, calc(100vh - 32px));
	display: flex; flex-direction: column;
	background: var(--fbm-bg); color: var(--fbm-text);
	border: 1px solid var(--fbm-border); border-radius: 10px;
	box-shadow: var(--fbm-shadow); overflow: hidden;
}
.fbm-cl-head {
	flex-shrink: 0; display: flex; align-items: center; gap: 10px;
	padding: 12px 14px; background: var(--fbm-surface);
	border-bottom: 1px solid var(--fbm-border);
}
.fbm-cl-title { flex: 1; font-weight: 700; font-size: 15px; min-width: 0; }
.fbm-cl-body {
	flex: 1; overflow: auto; padding: 14px 16px 8px;
	font-size: 13px; line-height: 1.45;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-cl-body p { margin: 0 0 10px; }
.fbm-cl-label {
	margin: 14px 0 8px !important; font-weight: 600; color: var(--fbm-accent);
	font-size: 12px; letter-spacing: 0.03em; text-transform: uppercase;
}
.fbm-cl-features {
	margin: 0 0 12px; padding-left: 1.15em;
	display: flex; flex-direction: column; gap: 8px;
}
.fbm-cl-features li { color: var(--fbm-text); }
.fbm-cl-features strong { color: var(--fbm-accent); font-weight: 600; }
.fbm-cl-docs { margin-top: 12px !important; font-size: 12px; color: var(--fbm-muted); }
.fbm-cl-docs a { color: var(--fbm-accent); text-decoration: underline; text-underline-offset: 2px; }
.fbm-cl-docs a:hover { color: #e8c04a; }
.fbm-cl-actions {
	flex-shrink: 0; display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end;
	padding: 12px 14px; border-top: 1px solid var(--fbm-border); background: var(--fbm-surface);
}
.fbm-cl-actions .fbm-btn { min-height: 32px; }
/* \u2014\u2014 In-plugin text prompt (replaces window.prompt) \u2014\u2014 */
.fbm-prompt-overlay {
	position: fixed; inset: 0; z-index: 140;
	background: rgba(0, 0, 0, 0.45);
	display: flex; align-items: center; justify-content: center;
	pointer-events: auto;
}
.fbm-prompt-dialog {
	width: min(92vw, 420px);
	background: var(--fbm-bg); border: 1px solid var(--fbm-border); border-radius: 8px;
	padding: 14px; display: flex; flex-direction: column; gap: 8px;
	color: var(--fbm-text); box-shadow: var(--fbm-shadow);
}
.fbm-prompt-dialog h4 { margin: 0; color: var(--fbm-accent); font-size: 14px; }
.fbm-prompt-msg { margin: 0; font-size: 13px; line-height: 1.4; color: var(--fbm-text); }
.fbm-prompt-field input {
	width: 100%; background: var(--fbm-field); border: 1px solid rgba(255, 255, 255, 0.14);
	color: var(--fbm-text); border-radius: 4px; padding: 8px 10px; font: inherit;
}
.fbm-prompt-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.fbm-build-bar {
	position: fixed; z-index: 118; top: 12px; left: 25%; transform: translateX(-50%);
	display: none; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; padding: 8px;
	max-width: min(980px, 48vw);
	background: rgba(36, 28, 48, 0.92);
	border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 8px; box-shadow: var(--fbm-shadow);
	backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.fbm-build-bar.fbm-show { display: flex; }
.fbm-build-bar.fbm-bar-placed { transform: none; }
.fbm-build-bar .fbm-btn.fbm-on { background: var(--fbm-accent-soft); border-color: var(--fbm-accent); color: var(--fbm-accent); }
.fbm-build-bar .fbm-bar-star {
	display: inline-flex; align-items: center; justify-content: center;
	min-width: 36px; padding: 4px 8px;
}
.fbm-build-bar .fbm-bar-star[hidden] { display: none !important; }
.fbm-build-bar .fbm-bar-star img {
	display: block; width: 18px; height: 18px; object-fit: contain; pointer-events: none;
}
.fbm-bar-grip {
	display: inline-flex; align-items: center; justify-content: center;
	width: 18px; height: 28px; margin-right: 2px; cursor: grab; user-select: none;
	color: var(--fbm-muted); font-size: 12px; letter-spacing: -2px; line-height: 1;
}
.fbm-bar-grip:active { cursor: grabbing; }
.fbm-templates {
	position: fixed; z-index: 119; top: 64px; left: 25%; transform: translateX(-50%);
	width: min(560px, 48vw, calc(100vw - 24px)); max-height: min(420px, calc(100vh - 100px));
	overflow: auto; padding: 12px; background: var(--fbm-bg); border: 1px solid var(--fbm-border);
	border-radius: 8px; box-shadow: var(--fbm-shadow);
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-templates[hidden] { display: none !important; }
.fbm-templates-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-weight: 600; }
.fbm-tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.fbm-tpl-card {
	position: relative; border: 1px solid var(--fbm-border); border-radius: 4px;
	background: var(--fbm-thumb); padding: 8px; cursor: pointer; text-align: center;
}
.fbm-tpl-card:hover, .fbm-tpl-card.fbm-on { border-color: var(--fbm-accent); }
.fbm-tpl-thumb { width: 100%; aspect-ratio: 1; border-radius: 4px; background: var(--fbm-thumb-deep); margin-bottom: 6px; object-fit: cover; }
.fbm-tpl-size { font-size: 11px; color: var(--fbm-muted); }
.fbm-tpl-del {
	position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 4px;
	border: 1px solid rgba(224, 108, 117, 0.5); background: rgba(0, 0, 0, 0.72); color: var(--fbm-danger);
	font-size: 12px; line-height: 1; cursor: pointer;
}
.fbm-tpl-del:hover { color: var(--fbm-accent); border-color: var(--fbm-accent); }
.fbm-about-feats { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.fbm-about-feat {
	margin: 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px;
	background: rgba(42, 34, 56, 0.85);
}
.fbm-about-feat > summary {
	cursor: pointer; padding: 9px 12px; font-weight: 600; list-style: none; user-select: none;
}
.fbm-about-feat > summary::-webkit-details-marker { display: none; }
.fbm-about-feat > summary::before {
	content: "\u25B8"; display: inline-block; width: 1em; margin-right: 4px; color: var(--fbm-accent);
	transition: transform 0.12s ease;
}
.fbm-about-feat[open] > summary::before { transform: rotate(90deg); }
.fbm-about-feat-body { padding: 0 12px 10px; }
.fbm-about-desc { margin: 0 0 8px; font-size: 12px; line-height: 1.45; color: var(--fbm-muted); }
.fbm-about-label {
	margin: 0 0 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
	text-transform: uppercase; color: var(--fbm-accent);
}
.fbm-about-steps {
	margin: 0; padding-left: 1.2em; font-size: 12px; line-height: 1.5; color: var(--fbm-text);
}
.fbm-about-steps li { margin: 3px 0; }

.fbm-objects {
	position: fixed; z-index: 121; top: 96px; left: 50%; transform: translateX(-50%);
	width: min(900px, calc(100vw - 32px)); height: min(560px, calc(100vh - 120px));
	min-width: 640px; min-height: 420px; display: flex; flex-direction: column;
	background: var(--fbm-bg); border: 1px solid var(--fbm-border); border-radius: 8px;
	box-shadow: var(--fbm-shadow); resize: both; overflow: hidden;
}
.fbm-objects[hidden] { display: none !important; }
.fbm-obj-actionbar {
	display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
	padding: 8px 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-surface);
}
.fbm-obj-search {
	flex: 1 1 160px; min-width: 120px; max-width: 280px;
	background: var(--fbm-field); border: 1px solid rgba(255, 255, 255, 0.14); color: var(--fbm-text);
	border-radius: 4px; padding: 6px 8px;
}
.fbm-obj-action-sep { width: 1px; height: 22px; background: var(--fbm-border); margin: 0 2px; }
.fbm-obj-tool.fbm-on {
	background: var(--fbm-accent-soft); border-color: var(--fbm-accent); color: var(--fbm-accent);
}
.fbm-obj-clear {
	color: var(--fbm-danger); border-color: rgba(224, 108, 117, 0.45);
}
.fbm-obj-clear:hover:not(:disabled), .fbm-obj-clear.fbm-on {
	background: rgba(224, 108, 117, 0.16); border-color: var(--fbm-danger); color: var(--fbm-danger);
}
.fbm-obj-clear:disabled { opacity: 0.35; cursor: default; }
.fbm-obj-actionbar .fbm-icon-btn { flex-shrink: 0; }
.fbm-obj-body {
	--fbm-obj-ext-w: 260px;
	flex: 1; min-height: 0; display: grid;
	grid-template-columns: max-content minmax(180px, 1fr) 6px var(--fbm-obj-ext-w);
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	overflow: hidden;
}
.fbm-obj-splitter {
	width: 6px; cursor: col-resize; background: var(--fbm-border); position: relative; z-index: 2;
}
.fbm-obj-splitter:hover, .fbm-obj-splitter.fbm-on { background: var(--fbm-accent); }
.fbm-obj-splitter::after { content: ""; position: absolute; inset: 0 -4px; }
.fbm-obj-tree {
	min-height: 0; overflow: auto; padding: 8px 6px 12px;
	border-right: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-bg);
	width: max-content; min-width: 148px; max-width: 220px;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-obj-sec { margin-top: 8px; }
.fbm-obj-sec:first-child { margin-top: 0; }
.fbm-obj-sec-title {
	display: block; width: 100%; text-align: left; border: 0; background: transparent; cursor: pointer;
	font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
	color: var(--fbm-accent); padding: 4px 8px 6px;
}
.fbm-obj-sec-title::before { content: "\u25BE "; opacity: 0.8; }
.fbm-obj-sec.fbm-collapsed .fbm-obj-sec-title::before { content: "\u25B8 "; }
.fbm-obj-sec.fbm-collapsed .fbm-obj-cat { display: none; }
.fbm-obj-cat {
	display: flex; align-items: center; gap: 6px; padding: 6px 8px; margin: 2px 0;
	border-radius: 6px; border: 1px solid transparent; background: transparent; color: var(--fbm-text);
	cursor: grab; user-select: none; width: 100%; text-align: left; font-size: 12px;
}
.fbm-obj-cat:hover { background: var(--fbm-surface); }
.fbm-obj-cat.fbm-on {
	background: var(--fbm-accent-soft); border-color: var(--fbm-accent); color: var(--fbm-accent);
}
.fbm-obj-cat.fbm-drag-over { border-color: var(--fbm-accent); outline: 1px dashed var(--fbm-accent); }
.fbm-obj-cat-handle { color: var(--fbm-muted); font-size: 11px; letter-spacing: -1px; cursor: grab; }
.fbm-obj-cat.fbm-cat-hidden { display: none; }
.fbm-obj-grid-wrap {
	min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: rgba(42, 34, 56, 0.55);
}
.fbm-obj-grid-head {
	display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
	padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-weight: 600;
}
.fbm-obj-grid-head .fbm-hint { margin: 0; font-weight: 400; }
.fbm-obj-grid {
	flex: 1; overflow: auto; padding: 10px;
	display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; align-content: start;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-obj-card {
	border: 1px solid var(--fbm-border); border-radius: 4px; background: var(--fbm-thumb);
	padding: 8px; cursor: pointer; text-align: center; color: var(--fbm-text);
}
.fbm-obj-card:hover, .fbm-obj-card.fbm-on { border-color: var(--fbm-accent); }
.fbm-obj-card-thumb {
	width: 100%; aspect-ratio: 1; border-radius: 4px; margin-bottom: 6px;
	background: var(--fbm-thumb-deep); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
.fbm-obj-card-name { font-size: 11px; line-height: 1.3; word-break: break-word; }
.fbm-obj-card-meta { font-size: 10px; color: var(--fbm-muted); margin-top: 2px; }
.fbm-obj-ext {
	min-width: 0; min-height: 0; overflow: auto; padding: 10px 12px 14px; background: var(--fbm-bg);
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-obj-preview { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.fbm-obj-preview-text { flex: 1; min-width: 0; }
.fbm-obj-preview-swatch {
	width: 96px; height: 96px; border-radius: 6px; border: 1px solid var(--fbm-border);
	background: var(--fbm-thumb-deep); flex-shrink: 0;
}
.fbm-obj-preview-name { font-weight: 600; }
.fbm-obj-variants {
	display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; margin-bottom: 12px;
}
.fbm-obj-variant {
	display: flex; flex-direction: column; align-items: stretch; gap: 6px; padding: 8px;
	border: 1px solid var(--fbm-border); border-radius: 4px;
	background: rgba(42, 34, 56, 0.85); cursor: pointer; color: var(--fbm-text); text-align: center;
}
.fbm-obj-variant:hover, .fbm-obj-variant.fbm-on { border-color: var(--fbm-accent); }
.fbm-obj-variant-swatch {
	width: 100%; aspect-ratio: 1; border-radius: 4px; background: var(--fbm-thumb-deep);
	box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
.fbm-obj-variant-name { font-size: 11px; line-height: 1.3; word-break: break-word; }
.fbm-obj-variant-custom { outline: 1px dashed rgba(212, 160, 23, 0.5); }
.fbm-obj-recent-wrap {
	display: flex; align-items: center; gap: 8px; padding: 6px 10px;
	border-top: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-surface); min-height: 52px;
}
.fbm-obj-recent-label {
	font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
	color: var(--fbm-accent); flex-shrink: 0;
}
.fbm-obj-recent { flex: 1; min-width: 0; display: flex; gap: 6px; overflow: hidden; }
.fbm-obj-recent-item {
	width: 36px; height: 36px; flex-shrink: 0; border-radius: 4px; border: 1px solid var(--fbm-border);
	background: var(--fbm-thumb-deep); cursor: pointer; padding: 0;
}
.fbm-obj-recent-item:hover, .fbm-obj-recent-item.fbm-on {
	border-color: var(--fbm-accent); outline: 1px solid var(--fbm-accent);
}
.fbm-obj-recent-empty { font-size: 11px; color: var(--fbm-muted); align-self: center; }
.fbm-obj-status {
	padding: 6px 12px; font-size: 11px; color: var(--fbm-muted); background: var(--fbm-bg); min-height: 1.4em;
}
.fbm-objset {
	position: fixed; z-index: 130; top: 96px; left: 56px;
	max-width: calc(100vw - 32px); max-height: min(560px, calc(100vh - 96px));
	display: flex; flex-direction: row; align-items: stretch;
	background: var(--fbm-bg); border: 1px solid var(--fbm-border); border-radius: 8px;
	box-shadow: var(--fbm-shadow); overflow: hidden;
}
.fbm-objset[hidden] { display: none !important; }
.fbm-objset-main {
	width: min(320px, calc(100vw - 32px)); min-width: 260px; max-height: inherit;
	display: flex; flex-direction: column; min-width: 0;
}
.fbm-objset-body {
	flex: 1; overflow: auto; padding: 10px 12px 12px; min-height: 0;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-objset-footer {
	display: flex; gap: 8px; padding: 8px 12px;
	border-top: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-surface);
}
.fbm-objset-footer[hidden] { display: none !important; }
.fbm-objset-footer .fbm-btn { flex: 1; }
.fbm-objset-status {
	padding: 6px 12px; font-size: 11px; color: var(--fbm-muted);
	border-top: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-field); min-height: 1.4em;
}
.fbm-objset-slider {
	display: grid; grid-template-columns: 72px 1fr 36px; gap: 8px; align-items: center;
	margin: 8px 0;
}
.fbm-objset-slider input[type="range"] { width: 100%; }
.fbm-objset-layer-row {
	display: grid; grid-template-columns: 1fr 28px minmax(72px, 88px); gap: 8px; align-items: center;
	margin: 6px 0;
}
.fbm-objset-swatch {
	width: 28px; height: 28px; border-radius: 4px; border: 1px solid var(--fbm-border);
	padding: 0; cursor: pointer; background: #fff;
}
.fbm-objset .fbm-section-head {
	margin-top: 12px; margin-bottom: 4px; font-size: 10px; font-weight: 700;
	letter-spacing: 0.06em; text-transform: uppercase; color: var(--fbm-accent);
}
.fbm-objset .fbm-check-row {
	display: flex; align-items: center; gap: 8px; margin: 10px 0; cursor: pointer;
}
.fbm-colorpick {
	position: relative; z-index: 1; width: 240px; flex-shrink: 0;
	display: flex; flex-direction: column;
	background: var(--fbm-field); border: 0; border-left: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 0; box-shadow: none; overflow: hidden;
}
.fbm-colorpick[hidden] { display: none !important; }
.fbm-objset:has(#fbm-colorpick:not([hidden])) .fbm-objset-main {
	border-right: 0;
}
.fbm-colorpick-head {
	display: flex; align-items: center; justify-content: space-between; gap: 8px;
	padding: 8px 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: var(--fbm-surface);
	font-weight: 600; font-size: 12px; min-height: 40px;
}
.fbm-colorpick-body { padding: 10px 12px 12px; }
.fbm-colorpick-sv {
	position: relative; width: 100%; aspect-ratio: 1; border-radius: 6px; cursor: crosshair;
	background: #f00;
	background-image:
		linear-gradient(to top, #000, transparent),
		linear-gradient(to right, #fff, transparent);
}
.fbm-colorpick-cursor {
	position: absolute; width: 12px; height: 12px; margin: -6px 0 0 -6px;
	border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.5);
	pointer-events: none;
}
.fbm-colorpick-hue {
	width: 100%; margin: 10px 0;
	background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
	border-radius: 4px; height: 14px; appearance: none;
}
.fbm-colorpick-hue::-webkit-slider-thumb {
	appearance: none; width: 14px; height: 14px; border-radius: 50%;
	background: #fff; border: 1px solid #333; cursor: pointer;
}
.fbm-colorpick-swatch {
	width: 28px; height: 28px; border-radius: 4px; border: 1px solid var(--fbm-border); flex-shrink: 0;
}
.fbm-colorpick #fbm-colorpick-hex { width: 88px; }
body.fbm-eyedrop-cursor, body.fbm-eyedrop-cursor * { cursor: crosshair !important; }

/* \u2014\u2014 Floatable Chat \u2014\u2014 */
.fbm-float-chat {
	--fbm-fc-bg: rgba(28, 22, 38, 0.96);
	--fbm-fc-surface: rgba(42, 34, 56, 0.95);
	--fbm-fc-surface2: rgba(60, 48, 80, 0.9);
	--fbm-fc-field: rgba(20, 16, 28, 0.9);
	--fbm-fc-border: rgba(255, 255, 255, 0.12);
	--fbm-fc-text: #f0e6d4;
	--fbm-fc-muted: #a898b0;
	--fbm-fc-accent: #d4a017;
	--fbm-fc-accent-soft: rgba(212, 160, 23, 0.18);
	--fbm-fc-row-a: transparent;
	--fbm-fc-row-b: rgba(255, 255, 255, 0.03);
	--fbm-fc-sep: rgba(255, 255, 255, 0.08);
	--fbm-fc-emote-fg: #c9b48a;
	--fbm-fc-action-fg: #9aafc4;
	--fbm-fc-whisper-fg: #b8a4d4;
	--fbm-fc-whisper-mode: #9b7ed9;
	--fbm-fc-whisper-mode-soft: rgba(155, 126, 217, 0.2);
	--fbm-fc-beep-fg: #7ec8b8;
	--fbm-fc-beep-mode: #3db8a0;
	--fbm-fc-beep-mode-soft: rgba(61, 184, 160, 0.18);
	--fbm-fc-system-bg: rgba(255, 255, 255, 0.045);
	--fbm-fc-size: 13px;
	--fbm-fc-font: system-ui, -apple-system, Segoe UI, sans-serif;
	position: fixed; z-index: 119; display: flex; flex-direction: column;
	width: 380px; height: 480px; min-width: 300px; min-height: 240px;
	max-width: calc(100vw - 16px); max-height: calc(100vh - 16px);
	left: 48px; top: 64px;
	background: var(--fbm-fc-bg); color: var(--fbm-fc-text);
	border: 1px solid var(--fbm-fc-border); border-radius: 8px;
	box-shadow: var(--fbm-shadow); overflow: hidden;
	font-family: var(--fbm-fc-font); font-size: var(--fbm-fc-size); line-height: 1.4;
}
.fbm-float-chat[hidden] { display: none !important; }
.fbm-float-chat[data-fc-theme="light"] {
	/* Alpha overridden by applyFloatChatTheme from Settings \u2192 Transparency. */
	--fbm-fc-bg: rgba(244, 238, 248, 0.85); --fbm-fc-surface: rgba(235, 227, 242, 0.81);
	--fbm-fc-surface2: rgba(224, 213, 235, 0.77); --fbm-fc-field: rgba(255, 250, 252, 0.9);
	--fbm-fc-border: rgba(42, 32, 56, 0.14);
	--fbm-fc-text: #2a2038; --fbm-fc-muted: #6e5f7a; --fbm-fc-accent: #b8860b;
	--fbm-fc-accent-soft: rgba(184, 134, 11, 0.16);
	--fbm-fc-row-b: rgba(42, 32, 56, 0.04); --fbm-fc-sep: rgba(42, 32, 56, 0.1);
	--fbm-fc-emote-fg: #8a7340; --fbm-fc-action-fg: #4a6a88; --fbm-fc-whisper-fg: #6a5490;
	--fbm-fc-whisper-mode: #7a5cb8; --fbm-fc-whisper-mode-soft: rgba(122, 92, 184, 0.16);
	--fbm-fc-beep-fg: #2f8f7c; --fbm-fc-beep-mode: #2f9e88; --fbm-fc-beep-mode-soft: rgba(47, 158, 136, 0.14);
	--fbm-fc-system-bg: rgba(42, 32, 56, 0.06);
}
.fbm-fc-header {
	flex-shrink: 0; display: flex; align-items: center; gap: 8px;
	padding: 8px 10px; background: var(--fbm-fc-surface);
	border-bottom: 1px solid var(--fbm-fc-border); cursor: grab; user-select: none;
}
.fbm-fc-header:active { cursor: grabbing; }
.fbm-fc-header-title {
	flex: 1; display: flex; align-items: baseline; gap: 8px; font-weight: 600; min-width: 0;
}
.fbm-fc-room-name {
	min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fbm-fc-room-count {
	flex: 0 0 auto; font-weight: 600; font-variant-numeric: tabular-nums;
	color: var(--fbm-fc-accent); white-space: nowrap;
}
.fbm-fc-hotkey-hint { font-size: 11px; color: var(--fbm-fc-muted); white-space: nowrap; }
.fbm-fc-toolbar {
	flex-shrink: 0; display: flex; flex-wrap: nowrap; gap: 6px; padding: 6px 8px;
	background: var(--fbm-fc-surface); border-bottom: 1px solid var(--fbm-fc-border);
	align-items: stretch; overflow: visible; position: relative; z-index: 6;
}
.fbm-fc-tool {
	display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
	gap: 2px; min-width: 52px; flex: 0 0 auto; border: 1px solid var(--fbm-fc-border);
	background: var(--fbm-fc-surface2); color: var(--fbm-fc-text); border-radius: 4px;
	padding: 4px 6px 3px; font: inherit; font-size: 9px; letter-spacing: 0.02em;
	text-transform: uppercase; cursor: pointer;
}
.fbm-fc-tool[hidden] { display: none !important; }
.fbm-fc-tool img {
	display: block; height: 22px; width: auto; max-width: 48px; object-fit: contain;
	/* Club Rectangle PNGs \u2192 Seidr gold (#d4a017 / accent). */
	filter: invert(72%) sepia(62%) saturate(620%) hue-rotate(2deg) brightness(0.98) contrast(1.05);
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-tool img {
	filter: invert(52%) sepia(70%) saturate(560%) hue-rotate(8deg) brightness(0.92) contrast(1.02);
}
.fbm-fc-tool:hover img {
	filter: invert(78%) sepia(55%) saturate(680%) hue-rotate(2deg) brightness(1.08) contrast(1.05);
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-tool:hover img {
	filter: invert(46%) sepia(75%) saturate(600%) hue-rotate(8deg) brightness(0.98) contrast(1.05);
}
/* Keep Seidr logo colors (do not gold-tint). */
.fbm-fc-tool-seidr img,
.fbm-fc-tool-seidr:hover img,
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-tool-seidr img,
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-tool-seidr:hover img {
	filter: drop-shadow(0 0 0.5px rgba(0, 0, 0, 0.35));
}
.fbm-fc-tool-glyph {
	display: grid; place-items: center; height: 22px; font-size: 16px; line-height: 1;
	color: var(--fbm-fc-accent);
}
.fbm-fc-tool:hover { border-color: var(--fbm-fc-accent); }
.fbm-fc-tool:hover .fbm-fc-tool-glyph { color: var(--fbm-fc-accent); filter: brightness(1.12); }
.fbm-fc-tool.fbm-fc-on {
	background: var(--fbm-fc-accent-soft); border-color: var(--fbm-fc-accent); color: var(--fbm-fc-accent);
}
.fbm-fc-tool-seidr { border-color: rgba(212, 160, 23, 0.45); }
.fbm-fc-more-wrap { position: relative; margin-left: auto; flex: 0 0 auto; z-index: 7; }
.fbm-fc-more-wrap[hidden] { display: none !important; }
.fbm-fc-more-menu {
	position: absolute; right: 0; top: calc(100% + 4px); z-index: 80;
	width: 180px; min-width: 180px; max-width: 180px; box-sizing: border-box;
	padding: 4px;
	background: rgba(28, 22, 38, 0.98); border: 1px solid var(--fbm-fc-border);
	border-radius: 6px; box-shadow: 0 12px 28px rgba(0,0,0,0.45);
	display: flex; flex-direction: column; gap: 2px;
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-more-menu {
	background: rgba(244, 238, 248, 0.98); color: #2a2038;
	border-color: rgba(42, 32, 56, 0.14);
}
.fbm-fc-more-menu[hidden] { display: none !important; }
.fbm-fc-more-item {
	display: block; width: 100%; text-align: left; cursor: pointer;
	background: transparent; color: inherit; border: 1px solid transparent;
	border-radius: 4px; padding: 7px 10px; font: inherit; font-size: 12px;
	box-sizing: border-box; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.fbm-fc-more-item:hover { border-color: var(--fbm-fc-accent); background: var(--fbm-fc-accent-soft); }
.fbm-fc-body {
	flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
	position: relative; background: var(--fbm-fc-bg);
}
.fbm-fc-log {
	flex: 1 1 auto; min-height: 80px; overflow: auto; padding: 4px 0 6px;
	display: flex; flex-direction: column; gap: 0;
	position: relative; z-index: 1; background: var(--fbm-fc-bg);
}
.fbm-fc-members {
	flex: 0 0 30%; flex-grow: 0; flex-shrink: 0;
	min-height: 0; max-height: 70%;
	display: flex; flex-direction: column;
	overflow: hidden;
	border-bottom: 1px solid var(--fbm-fc-border);
	background: var(--fbm-fc-surface);
	position: relative; z-index: 2;
}
.fbm-fc-members[hidden] { display: none !important; }
.fbm-fc-members-resize {
	flex: 0 0 5px; flex-grow: 0; flex-shrink: 0; cursor: row-resize;
	background: var(--fbm-fc-border);
	position: relative; z-index: 2;
}
.fbm-fc-members-resize::after {
	content: ""; position: absolute; left: 50%; top: 1px; transform: translateX(-50%);
	width: 36px; height: 3px; border-radius: 2px; background: var(--fbm-fc-accent);
	opacity: 0.55;
}
.fbm-fc-members-resize[hidden] { display: none !important; }
.fbm-fc-members-head {
	flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
	padding: 6px 10px; font-weight: 600; color: var(--fbm-fc-accent);
	border-bottom: 1px solid var(--fbm-fc-border);
}
.fbm-fc-members-list {
	flex: 1; min-height: 0; overflow: auto; padding: 6px 8px 10px;
	display: flex; flex-direction: column; gap: 6px;
}
.fbm-fc-members-empty { color: var(--fbm-fc-muted); margin: 8px; font-size: 12px; }
.fbm-fc-mem-row {
	display: grid; grid-template-columns: 36px minmax(0, 1.3fr) minmax(72px, 0.7fr) minmax(0, 0.9fr) minmax(0, 0.7fr);
	gap: 6px 8px; align-items: start;
	padding: 8px; border-radius: 6px;
	background: var(--fbm-fc-surface2); border: 1px solid var(--fbm-fc-border);
}
.fbm-fc-mem-row.fbm-fc-mem-self { opacity: 0.85; }
.fbm-fc-mem-row.fbm-fc-mem-compass-hot {
	border-color: var(--fbm-fc-accent);
	box-shadow: inset 0 0 0 1px var(--fbm-fc-accent-soft);
	background: var(--fbm-fc-accent-soft);
}
.fbm-fc-mem-av {
	box-sizing: border-box;
	width: 36px; height: 36px; min-width: 36px; min-height: 36px;
	max-width: 36px; max-height: 36px;
	flex: 0 0 36px;
	border-radius: 6px; overflow: hidden;
	display: grid; place-items: center; font-size: 11px; font-weight: 700;
	background: rgba(20, 16, 28, 0.9); border: 1px solid rgba(155, 126, 217, 0.45);
	color: #c8b0e8;
	position: relative;
}
.fbm-fc-mem-av .fbm-fc-face-img,
.fbm-fc-mem-av img,
.fbm-fc-mem-av .fbm-fc-face-canvas,
.fbm-fc-mem-av canvas {
	display: block; width: 36px !important; height: 36px !important;
	max-width: 36px !important; max-height: 36px !important;
	object-fit: cover; position: relative;
}
.fbm-fc-mem-av .fbm-fc-face-initials { line-height: 1; }
.fbm-fc-mem-ident { min-width: 0; }
.fbm-fc-mem-nick { font-weight: 700; color: var(--fbm-fc-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fbm-fc-mem-name { font-size: 11px; color: var(--fbm-fc-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fbm-fc-mem-id {
	appearance: none; border: 1px solid transparent; background: transparent;
	padding: 0; margin: 0; text-align: left; cursor: pointer;
	font: inherit; font-size: 13px; font-weight: 600; line-height: 1.35;
	color: var(--fbm-fc-text); font-variant-numeric: tabular-nums;
}
.fbm-fc-mem-id:hover { color: var(--fbm-fc-accent); text-decoration: underline; }
.fbm-fc-mem-pills { display: flex; flex-wrap: wrap; gap: 4px; align-content: flex-start; }
.fbm-fc-pill {
	display: inline-flex; align-items: center; padding: 1px 7px; border-radius: 999px;
	font-size: 10px; font-weight: 700; letter-spacing: 0.02em;
	border: 1px solid currentColor; background: rgba(0,0,0,0.2);
}
.fbm-fc-pill-friend { color: #6ea8ff; }
.fbm-fc-pill-lover { color: #ff7eb6; }
.fbm-fc-pill-sub { color: #c9a0ff; }
.fbm-fc-pill-wl { color: #5fd6a0; }
.fbm-fc-pill-admin { color: #ff6b6b; }
.fbm-fc-pill-visitor { color: #a898b0; }
.fbm-fc-mem-actions {
	grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 4px;
}
.fbm-fc-mem-btn {
	border: 1px solid rgba(255,255,255,0.14); background: rgba(42, 34, 56, 0.95);
	color: #d8e6ff; border-radius: 4px; padding: 3px 7px; font: inherit; font-size: 11px; cursor: pointer;
}
.fbm-fc-mem-btn:hover { filter: brightness(1.08); }
.fbm-fc-mem-pos { color: #9ec0ff; }
.fbm-fc-mem-ok { color: #5fd6a0; }
.fbm-fc-mem-neg { color: #ff8fa3; }
.fbm-fc-mem-warn { color: #ffb86b; }
.fbm-fc-mem-danger { color: #ff6b6b; border-color: rgba(255, 107, 107, 0.45); }
.fbm-fc-font-select {
	flex: 1; min-width: 0; box-sizing: border-box;
	background: var(--fbm-field); color: var(--fbm-text);
	border: 1px solid rgba(255,255,255,0.14); border-radius: 4px; padding: 6px 8px; font: inherit;
}
.fbm-fc-msg {
	display: flex; align-items: flex-start; gap: 10px; padding: 3px 12px;
	border-bottom: 1px solid var(--fbm-fc-sep); background: var(--fbm-fc-row-a); line-height: 1.4;
	position: relative;
}
.fbm-fc-msg:nth-child(even) { background: var(--fbm-fc-row-b); }
.fbm-fc-msg-main { flex: 1; min-width: 0; word-break: break-word; position: relative; padding-right: 28px; }
.fbm-fc-msg-line { display: block; }
.fbm-fc-msg-name, .fbm-fc-msg-colon { font-weight: 600; }
.fbm-fc-msg-name-btn { cursor: pointer; text-decoration: underline; text-decoration-color: transparent; }
.fbm-fc-msg-name-btn:hover { text-decoration-color: currentColor; filter: brightness(1.08); }
.fbm-fc-msg-dir {
	font-weight: 700; font-size: 0.92em; letter-spacing: 0.02em;
	color: var(--fbm-fc-muted); text-transform: none;
}
.fbm-fc-msg-whisper .fbm-fc-msg-dir { color: var(--fbm-fc-whisper-fg); }
.fbm-fc-msg-beep .fbm-fc-msg-dir { color: var(--fbm-fc-beep-fg); }
.fbm-fc-msg-reply {
	display: block; max-width: 92%; margin: 0 0 2px;
	color: var(--fbm-fc-muted); font-size: 0.75em; line-height: 1.15;
	opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.fbm-fc-msg-reply::before { content: "\u21B1 "; }
.fbm-fc-msg-body { display: inline; white-space: pre-wrap; }
.fbm-fc-reply-btn {
	position: absolute; top: 0; right: 0;
	display: none; align-items: center; justify-content: center;
	margin: 0; padding: 0 4px; min-width: 1.5em; height: 1.4em;
	border: 1px solid var(--fbm-fc-border); border-radius: 4px;
	background: rgba(255,255,255,0.06); color: var(--fbm-fc-accent);
	cursor: pointer; font: inherit; line-height: 1;
}
.fbm-fc-msg:hover .fbm-fc-reply-btn { display: inline-flex; }
.fbm-fc-reply-btn:hover { border-color: var(--fbm-fc-accent); background: rgba(212,160,23,0.12); }
.fbm-fc-msg-body a { color: #a9ceff; word-break: break-all; }
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-msg-body a { color: #003f91; }
.fbm-fc-img-link { vertical-align: top; display: inline-block; max-width: 100%; }
.fbm-fc-img {
	max-height: 25rem; max-width: 90%; display: block;
	border: 1px solid rgba(212, 160, 23, 0.35); border-radius: 4px; padding: 0.1rem;
	margin: 4px 0;
}
.fbm-fc-trust-actions-inline { white-space: nowrap; }
.fbm-fc-trust-link {
	display: inline; margin: 0; padding: 0; border: none; background: none;
	color: var(--fbm-fc-accent); font: inherit; cursor: pointer; text-decoration: underline;
}
.fbm-fc-trust-link:hover { filter: brightness(1.1); }
.fbm-fc-hl-own, .fbm-fc-hl-other { font-weight: 700; background: transparent; padding: 0; }
.fbm-fc-own-names {
	width: 100%; min-height: 72px; resize: vertical; margin: 4px 0 8px;
	background: var(--fbm-field); color: var(--fbm-text);
	border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 4px; padding: 6px 8px;
	font: inherit; box-sizing: border-box;
}
#fbm-fc-hl-own-opts[hidden],
#fbm-fc-hl-color-row[hidden] { display: none !important; }
#fbm-fc-hl-color { width: 48px; height: 28px; padding: 0; border: 1px solid rgba(255,255,255,0.2); background: transparent; cursor: pointer; }
.fbm-fc-msg-meta {
	flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end;
	margin-top: 1px; font-size: 10px; line-height: 1.15; color: var(--fbm-fc-muted);
	opacity: 0.8; font-variant-numeric: tabular-nums; white-space: nowrap;
}
.fbm-fc-msg-whisper {
	background: rgba(155, 126, 217, 0.08);
	border-left: 3px solid var(--fbm-fc-whisper-mode);
}
.fbm-fc-msg-whisper:nth-child(even) { background: rgba(155, 126, 217, 0.11); }
.fbm-fc-msg-whisper .fbm-fc-msg-body { font-style: italic; color: var(--fbm-fc-whisper-fg); }
.fbm-fc-msg-whisper.fbm-fc-msg-dir-to { border-left-color: #c4a8ef; }
.fbm-fc-msg-whisper.fbm-fc-msg-dir-from { border-left-color: var(--fbm-fc-whisper-mode); }
.fbm-fc-msg-emote .fbm-fc-msg-main { font-style: italic; color: var(--fbm-fc-emote-fg); }
.fbm-fc-msg-action .fbm-fc-msg-main { color: var(--fbm-fc-action-fg); }
.fbm-fc-ctx {
	position: fixed; z-index: 13000; min-width: 160px; padding: 4px;
	background: rgba(28, 22, 38, 0.98); color: #f0e6d4;
	border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 6px;
	box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
	font: 13px/1.35 system-ui, -apple-system, Segoe UI, sans-serif;
}
.fbm-fc-ctx[hidden] { display: none !important; }
.fbm-fc-ctx-item {
	display: block; width: 100%; text-align: left; cursor: pointer;
	background: transparent; color: inherit; border: 1px solid transparent;
	border-radius: 4px; padding: 6px 10px; font: inherit;
}
.fbm-fc-ctx-item:hover { border-color: #d4a017; background: rgba(60, 48, 80, 0.9); }
.fbm-fc-confirm {
	position: fixed; inset: 0; z-index: 13100; display: flex;
	align-items: center; justify-content: center;
	background: rgba(10, 8, 16, 0.55);
}
.fbm-fc-confirm[hidden] { display: none !important; }
.fbm-fc-confirm-card {
	min-width: 280px; max-width: min(420px, 92vw);
	background: rgba(28, 22, 38, 0.98); color: #f0e6d4;
	border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 8px;
	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55); padding: 14px 16px;
	font: 13px/1.4 system-ui, -apple-system, Segoe UI, sans-serif;
}
.fbm-fc-confirm-title { font-weight: 700; color: #d4a017; margin-bottom: 8px; }
.fbm-fc-confirm-body { color: #f0e6d4; margin-bottom: 14px; }
.fbm-fc-confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
.fbm-fc-confirm-cancel, .fbm-fc-confirm-ok {
	border-radius: 6px; padding: 6px 12px; font: inherit; cursor: pointer;
	border: 1px solid rgba(255,255,255,0.16); background: rgba(60, 48, 80, 0.9); color: inherit;
}
.fbm-fc-confirm-ok {
	border-color: rgba(212, 160, 23, 0.55); background: rgba(212, 160, 23, 0.18); color: #d4a017;
}
.fbm-fc-msg-system { background: var(--fbm-fc-system-bg); color: var(--fbm-fc-muted); }
.fbm-fc-msg-system:nth-child(even) { background: var(--fbm-fc-system-bg); }
.fbm-fc-msg-beep {
	background: rgba(61, 184, 160, 0.08);
	border-left: 3px solid var(--fbm-fc-beep-mode);
	color: var(--fbm-fc-text);
}
.fbm-fc-msg-beep:nth-child(even) { background: rgba(61, 184, 160, 0.11); }
.fbm-fc-msg-beep .fbm-fc-msg-body { color: var(--fbm-fc-beep-fg); }
.fbm-fc-msg-beep.fbm-fc-msg-dir-to { border-left-color: #7ed9c6; }
.fbm-fc-msg-beep.fbm-fc-msg-dir-from { border-left-color: var(--fbm-fc-beep-mode); }
.fbm-fc-compose-wrap {
	flex-shrink: 0; position: relative; border-top: 1px solid var(--fbm-fc-border);
	background: var(--fbm-fc-surface); padding: 8px;
}
.fbm-fc-reply {
	display: flex; align-items: center; gap: 8px; margin: 0 0 6px;
	padding: 6px 8px; border-radius: 4px;
	background: #111; color: #fff; border: 1px solid rgba(255,255,255,0.12);
}
.fbm-fc-reply[hidden] { display: none !important; }
.fbm-fc-reply-text { flex: 1; min-width: 0; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fbm-fc-reply-close {
	flex-shrink: 0; width: 28px; height: 28px; border: none; border-radius: 4px;
	background: transparent; color: #ff3b3b; font-size: 18px; line-height: 1; cursor: pointer;
}
.fbm-fc-reply-close:hover { background: rgba(255, 59, 59, 0.15); }
.fbm-fc-wav {
	flex: 0 0 48px; flex-shrink: 0; width: 48px; height: 48px;
	max-width: 48px; max-height: 48px; border-radius: 8px; overflow: hidden;
	border: 1px solid var(--fbm-fc-whisper-mode); background: rgba(20, 16, 28, 0.9);
	align-self: center;
}
.fbm-fc-wav[hidden] { display: none !important; }
.fbm-fc-wav .fbm-fc-face-img,
.fbm-fc-wav .fbm-fc-face-canvas,
.fbm-fc-wav canvas,
.fbm-fc-wav img,
.fbm-fc-wav-img, .fbm-fc-wav-canvas {
	display: block; width: 48px !important; height: 48px !important;
	max-width: 48px !important; max-height: 48px !important;
	object-fit: cover; pointer-events: none;
}
.fbm-fc-wav .fbm-fc-face-initials {
	display: grid; place-items: center; width: 100%; height: 100%;
	font-size: 14px; font-weight: 700; color: #c8b0e8;
}
.fbm-fc-ac {
	position: absolute; left: 8px; right: 8px; bottom: 100%; margin-bottom: 4px;
	max-height: min(320px, 45vh); overflow: auto; overflow-x: hidden;
	display: none; flex-direction: column; gap: 2px; padding: 6px; z-index: 3;
	background: rgba(28, 22, 38, 0.96); color: #f0e6d4;
	border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px;
	box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
	font: 13px/1.35 system-ui, -apple-system, Segoe UI, sans-serif;
	scrollbar-width: thin;
	scrollbar-color: rgba(212, 160, 23, 0.55) rgba(20, 16, 28, 0.9);
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-ac {
	background: rgba(244, 238, 248, 0.96); color: #2a2038;
	border-color: rgba(42, 32, 56, 0.14);
	box-shadow: 0 12px 36px rgba(42, 32, 56, 0.18);
}
.fbm-fc-ac.fbm-fc-open { display: flex; }
.fbm-fc-ac[hidden] { display: none !important; }
.fbm-fc-ac-item {
	display: flex; align-items: baseline; gap: 8px; width: 100%;
	text-align: left; cursor: pointer;
	background: rgba(42, 34, 56, 0.85); color: #f0e6d4;
	border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px;
	padding: 6px 10px; font: inherit;
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-ac-item {
	background: rgba(224, 213, 235, 0.9); color: #2a2038;
	border-color: rgba(42, 32, 56, 0.12);
}
.fbm-fc-ac-item:hover, .fbm-fc-ac-item.fbm-fc-ac-on {
	border-color: #d4a017; color: inherit;
	background: rgba(60, 48, 80, 0.95);
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-ac-item:hover,
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-ac-item.fbm-fc-ac-on {
	background: rgba(212, 160, 23, 0.16); border-color: #b8860b;
}
.fbm-fc-ac-label { flex: 1; min-width: 0; }
.fbm-fc-ac-hint {
	flex: 0 0 auto; font-size: 11px; color: #a898b0;
	font-variant-numeric: tabular-nums;
}
.fbm-float-chat[data-fc-theme="light"] .fbm-fc-ac-hint { color: #6e5f7a; }
.fbm-fc-compose { display: flex; gap: 8px; align-items: center; }
.fbm-fc-compose textarea {
	flex: 1; min-height: 44px; max-height: 120px; resize: vertical;
	background: var(--fbm-fc-field); color: var(--fbm-fc-text);
	border: 1px solid var(--fbm-fc-border); border-radius: 6px; padding: 8px;
	font: inherit; font-family: var(--fbm-fc-font); font-size: var(--fbm-fc-size);
}
.fbm-fc-compose-wrap[data-fc-mode="chat"] .fbm-fc-compose textarea:focus {
	outline: 1px solid var(--fbm-fc-accent); border-color: var(--fbm-fc-accent);
}
.fbm-fc-compose-wrap[data-fc-mode="whisper"] .fbm-fc-compose textarea {
	border-color: var(--fbm-fc-whisper-mode);
	box-shadow: inset 0 0 0 1px var(--fbm-fc-whisper-mode-soft);
}
.fbm-fc-compose-wrap[data-fc-mode="whisper"] .fbm-fc-compose textarea:focus {
	outline: 1px solid var(--fbm-fc-whisper-mode); border-color: var(--fbm-fc-whisper-mode);
}
.fbm-fc-compose-wrap[data-fc-mode="beep"] .fbm-fc-compose textarea {
	border-color: var(--fbm-fc-beep-mode);
	box-shadow: inset 0 0 0 1px var(--fbm-fc-beep-mode-soft);
}
.fbm-fc-compose-wrap[data-fc-mode="beep"] .fbm-fc-compose textarea:focus {
	outline: 1px solid var(--fbm-fc-beep-mode); border-color: var(--fbm-fc-beep-mode);
}
.fbm-fc-send {
	border: 1px solid rgba(212, 160, 23, 0.45); background: var(--fbm-fc-accent-soft);
	color: var(--fbm-fc-accent); border-radius: 6px; padding: 8px 12px; font: inherit; cursor: pointer;
}
.fbm-fc-compose-wrap[data-fc-mode="whisper"] .fbm-fc-send {
	border-color: rgba(155, 126, 217, 0.55); background: var(--fbm-fc-whisper-mode-soft);
	color: var(--fbm-fc-whisper-mode);
}
.fbm-fc-compose-wrap[data-fc-mode="beep"] .fbm-fc-send {
	border-color: rgba(61, 184, 160, 0.55); background: var(--fbm-fc-beep-mode-soft);
	color: var(--fbm-fc-beep-mode);
}
.fbm-fc-send:hover { filter: brightness(1.08); }
.fbm-fc-resize {
	position: absolute; right: 0; bottom: 0; width: 16px; height: 16px; cursor: nwse-resize;
	background: linear-gradient(135deg, transparent 50%, rgba(212, 160, 23, 0.45) 50%);
}
.fbm-fc-css {
	width: 100%; min-height: 120px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	font-size: 11px; background: var(--fbm-field); color: var(--fbm-text);
	border: 1px solid var(--fbm-border); border-radius: 6px; padding: 8px; resize: vertical;
}
`;
  FBM.injectStyles = function() {
    if (document.getElementById("fbm-styles")) return;
    const el = document.createElement("style");
    el.id = "fbm-styles";
    el.textContent = FBM.STYLES;
    (document.head || document.documentElement).appendChild(el);
  };

  // src/ui/dialogs.ts
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function removeOverlay(overlay) {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
  FBM.promptText = function(title, opts) {
    if (FBM.ensureUi) FBM.ensureUi();
    const body = opts && opts.message || "";
    const initial = opts && opts.initial || "";
    const placeholder = opts && opts.placeholder || "";
    const okLabel = opts && opts.confirmLabel || "OK";
    const cancelLabel = opts && opts.cancelLabel || "Cancel";
    const maxlength = opts && opts.maxlength || 40;
    return new Promise(function(resolve) {
      const host = document.getElementById("fbm-root") || document.body;
      const overlay = document.createElement("div");
      overlay.className = "fbm-prompt-overlay";
      overlay.innerHTML = [
        '<div class="fbm-prompt-dialog" role="dialog" aria-modal="true" aria-labelledby="fbm-prompt-title">',
        '<h4 id="fbm-prompt-title">' + escapeHtml(title) + "</h4>",
        body ? '<p class="fbm-prompt-msg">' + escapeHtml(body) + "</p>" : "",
        '<div class="fbm-prompt-field">',
        '<input type="text" id="fbm-prompt-input" maxlength="' + maxlength + '"' + (placeholder ? ' placeholder="' + escapeHtml(placeholder) + '"' : "") + " />",
        "</div>",
        '<div class="fbm-prompt-actions">',
        '<button type="button" class="fbm-btn" data-act="cancel">' + escapeHtml(cancelLabel) + "</button>",
        '<button type="button" class="fbm-btn fbm-btn-accent" data-act="ok">' + escapeHtml(okLabel) + "</button>",
        "</div></div>"
      ].join("");
      host.appendChild(overlay);
      FBM._promptOpen = true;
      const input = overlay.querySelector("#fbm-prompt-input");
      input.value = initial;
      let settled = false;
      function finish(value) {
        if (settled) return;
        settled = true;
        FBM._promptOpen = false;
        document.removeEventListener("keydown", onKey, true);
        removeOverlay(overlay);
        resolve(value);
      }
      function submit() {
        const t = (input.value || "").trim();
        finish(t || null);
      }
      function onKey(ev) {
        if (ev.key === "Escape") {
          ev.preventDefault();
          ev.stopPropagation();
          finish(null);
        } else if (ev.key === "Enter") {
          ev.preventDefault();
          ev.stopPropagation();
          submit();
        }
      }
      document.addEventListener("keydown", onKey, true);
      overlay.addEventListener("click", function(ev) {
        if (ev.target === overlay) finish(null);
      });
      overlay.querySelector('[data-act="cancel"]').addEventListener("click", function() {
        finish(null);
      });
      overlay.querySelector('[data-act="ok"]').addEventListener("click", submit);
      try {
        input.focus();
        input.select();
      } catch (e) {
      }
    });
  };

  // src/ui/shell.ts
  function $(id) {
    return document.getElementById(id);
  }
  FBM.setStatus = function(msg) {
    const el = $("fbm-status");
    if (el) el.textContent = msg || "";
  };
  FBM.showToast = function(msg, ms) {
    FBM.ensureUi();
    const el = $("fbm-toast");
    if (!el) {
      FBM.setStatus(msg || "");
      return;
    }
    el.textContent = msg || "";
    el.hidden = false;
    el.classList.add("fbm-toast-show");
    if (FBM._toastTimer) clearTimeout(FBM._toastTimer);
    FBM._toastTimer = setTimeout(function() {
      el.classList.remove("fbm-toast-show");
      el.hidden = true;
    }, typeof ms === "number" && ms > 0 ? ms : 4500);
  };
  FBM.selectPanelTab = function(tab) {
    const root = $("fbm-root");
    if (!root) return;
    const id = String(tab || "general");
    root.querySelectorAll(".fbm-tab").forEach(function(t) {
      const el = t;
      t.classList.toggle("fbm-on", el.dataset.tab === id);
    });
    root.querySelectorAll(".fbm-page").forEach(function(p) {
      p.classList.toggle("fbm-on", p.id === "fbm-page-" + id);
    });
  };
  FBM.openPanel = function(opts) {
    FBM.ensureUi();
    const panel = $("fbm-panel");
    if (!panel) return;
    panel.classList.add("fbm-open");
    FBM.applyUiGeometry();
    FBM.refreshSettingsUi();
    if (opts && opts.tab) FBM.selectPanelTab(opts.tab);
  };
  FBM.closePanel = function() {
    const panel = $("fbm-panel");
    if (panel) panel.classList.remove("fbm-open");
    FBM.persistUiGeometry();
  };
  FBM.togglePanel = function() {
    const panel = $("fbm-panel");
    if (panel && panel.classList.contains("fbm-open")) FBM.closePanel();
    else FBM.openPanel();
  };
  FBM.applyUiGeometry = function() {
    const panel = $("fbm-panel");
    const ui = FBM.settings && FBM.settings.ui || {};
    if (!panel) return;
    if (ui.width) panel.style.width = ui.width + "px";
    if (ui.height) panel.style.height = ui.height + "px";
    if (ui.left != null) {
      panel.style.left = ui.left + "px";
      panel.style.right = "auto";
    }
    if (ui.top != null) panel.style.top = ui.top + "px";
  };
  FBM.persistUiGeometry = function() {
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
    header.addEventListener("pointerdown", function(e) {
      if (e.target?.closest("button")) return;
      dragging = true;
      const r = panel.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      try {
        header.setPointerCapture(e.pointerId);
      } catch (err) {
      }
    });
    header.addEventListener("pointermove", function(e) {
      if (!dragging) return;
      panel.style.left = Math.max(0, e.clientX - ox) + "px";
      panel.style.top = Math.max(0, e.clientY - oy) + "px";
      panel.style.right = "auto";
    });
    header.addEventListener("pointerup", function() {
      dragging = false;
      FBM.persistUiGeometry();
    });
  }
  function aboutFeat(title, desc, steps) {
    let lis = "";
    for (let i = 0; i < steps.length; i++) {
      lis += "<li>" + steps[i] + "</li>";
    }
    return '<details class="fbm-about-feat"><summary>' + title + '</summary><div class="fbm-about-feat-body"><p class="fbm-about-desc">' + desc + '</p><p class="fbm-about-label">How to use</p><ul class="fbm-about-steps">' + lis + "</ul></div></details>";
  }
  FBM.ensureUi = function() {
    if ($("fbm-root")) return;
    FBM.injectStyles();
    const root = document.createElement("div");
    root.id = "fbm-root";
    root.innerHTML = '<div class="fbm-build-bar" id="fbm-build-bar"><span class="fbm-bar-grip" id="fbm-bar-grip" title="Drag" aria-label="Drag build bar">\u22EE\u22EE</span><button type="button" class="fbm-btn" id="fbm-bar-grid">Grid</button><button type="button" class="fbm-btn" id="fbm-bar-objects" title="Build \u2014 catalog, brush, variants">Build</button><button type="button" class="fbm-btn" id="fbm-bar-copy">Copy</button><button type="button" class="fbm-btn" id="fbm-bar-objset" title="Include Sign/Tether/Rotation/Size/Color when saving a selection">Obj settings</button><button type="button" class="fbm-btn" id="fbm-bar-save" disabled>Save selection</button><button type="button" class="fbm-btn" id="fbm-bar-paste">Paste\u2026</button><button type="button" class="fbm-btn fbm-bar-star" id="fbm-bar-star" title="SuperPowers" hidden><img id="fbm-bar-star-img" src="Icons/SuperPowersInactive.png" alt="" width="18" height="18" /></button><button type="button" class="fbm-btn" id="fbm-bar-settings">Settings</button><span class="fbm-bar-sync" id="fbm-bar-sync" hidden></span></div><div class="fbm-templates" id="fbm-templates" hidden><div class="fbm-templates-head"><span>Templates</span><button type="button" class="fbm-icon-btn" id="fbm-tpl-close" title="Close">\xD7</button></div><p class="fbm-muted fbm-hint">Select a room, then click the map tile for the top-left paste origin.</p><div class="fbm-tpl-grid" id="fbm-tpl-grid"></div></div>' + (FBM.objectsBuildMarkup ? FBM.objectsBuildMarkup() : "") + (FBM.objectSettingsMarkup ? FBM.objectSettingsMarkup() : "") + (FBM.floatChatMarkup ? FBM.floatChatMarkup() : "") + (FBM.changelogMarkup ? FBM.changelogMarkup() : "") + '<div id="fbm-toast" class="fbm-toast" hidden role="status" aria-live="polite"></div><div class="fbm-panel" id="fbm-panel"><div class="fbm-header" id="fbm-header"><div class="fbm-header-title">Freyas Better Maps <span class="fbm-badge">settings</span></div><button type="button" class="fbm-icon-btn" id="fbm-close" title="Close">\xD7</button></div><div class="fbm-tabs" role="tablist"><button type="button" class="fbm-tab fbm-on" data-tab="general">General</button><button type="button" class="fbm-tab" data-tab="chat">Chat</button><button type="button" class="fbm-tab" data-tab="maps">Map storage</button><button type="button" class="fbm-tab" data-tab="about">About</button></div><div class="fbm-page fbm-on" id="fbm-page-general"><p class="fbm-muted fbm-hint">Local map helpers. Toggles are synced via ExtensionSettings; window positions stay on this device. If FAM Map typing is also on, bubbles may double \u2014 turn one off.</p><label class="fbm-check-row"><input type="checkbox" id="fbm-typing" /> <span>Show typing bubbles on the map</span></label><label class="fbm-check-row"><input type="checkbox" id="fbm-hide-toolbar" /> <span>Hide Club map toolbar (R132 panel + zoom) behind a small +</span></label><label class="fbm-check-row"><input type="checkbox" id="fbm-hide-arrows" /> <span>Hide Arrow Keys (and Club SuperPowers; \u2605 on the FBM build bar)</span></label><label class="fbm-check-row"><input type="checkbox" id="fbm-building" /> <span>Allow building tools (FBM button on map bar)</span></label><label class="fbm-check-row"><input type="checkbox" id="fbm-invisible-walls" /> <span>Show invisible walls (EmptySpace Impassable red X)</span></label><label class="fbm-check-row"><input type="checkbox" id="fbm-copy-objset" /> <span>Object settings on copy &amp; paste (Sign, Tether, Rotation, Size, Color)</span></label><label class="fbm-check-row"><input type="checkbox" id="fbm-blindfold" /> <span>Full blindfold (grey walls; hide your tile)</span></label><div class="fbm-row fbm-indent" id="fbm-blindfold-style-row"><label class="fbm-muted" for="fbm-blindfold-style">Others look like</label><select id="fbm-blindfold-style"><option value="greyscale">Greyscale models</option><option value="silhouette">Generic silhouette</option></select></div><label class="fbm-check-row"><input type="checkbox" id="fbm-whisper" /> <span>Whisper at hearing range (walls apply; not SuperZoom)</span></label><label class="fbm-check-row"><input type="checkbox" id="fbm-zoom" /> <span>Full map zoom-out (raise zoom max, admin only)</span></label><label class="fbm-check-row"><input type="checkbox" id="fbm-hide-room-update" /> <span>Hide duplicate \u201Cupdated the room\u201D chat spam</span></label><div class="fbm-row fbm-indent" id="fbm-room-update-cool-row"><label class="fbm-muted" for="fbm-room-update-cool">Cooldown (minutes)</label><input type="number" id="fbm-room-update-cool" min="1" max="120" step="1" value="5" /></div><div class="fbm-section"><div class="fbm-section-head">Build bar hotkey</div><p class="fbm-muted fbm-hint">Toggles the floating build bar when the map is active (admin). Default Alt+B. Also use the FBM button on the left map bar.</p><div class="fbm-row"><input type="text" id="fbm-build-hotkey" placeholder="Alt+B" maxlength="32" /><button type="button" class="fbm-btn" id="fbm-build-hotkey-capture">Capture</button></div></div><div class="fbm-status" id="fbm-status"></div></div><div class="fbm-page" id="fbm-page-chat"><p class="fbm-muted fbm-hint">Floatable Chat for when Club chat is collapsed on the map. Preferences are synced via ExtensionSettings; position and size stay on this device.</p><label class="fbm-check-row"><input type="checkbox" id="fbm-fc-enabled" /> <span>Enable Floatable Chat</span></label><label class="fbm-check-row"><input type="checkbox" id="fbm-fc-autoshow" /> <span>Autoshow when default Club chat is hidden</span></label><label class="fbm-check-row"><input type="checkbox" id="fbm-fc-autoclose" /> <span>Autoclose chat joining a room</span></label><div class="fbm-section"><div class="fbm-section-head">Hotkey</div><div class="fbm-row"><input type="text" id="fbm-fc-hotkey" placeholder="Alt+C" maxlength="32" /><button type="button" class="fbm-btn" id="fbm-fc-hotkey-capture">Capture</button></div></div><div class="fbm-section"><div class="fbm-section-head">Typography</div><div class="fbm-row"><label class="fbm-muted" for="fbm-fc-size">Text size</label><input type="range" id="fbm-fc-size" min="11" max="18" step="1" value="13" /><span class="fbm-muted" id="fbm-fc-size-val">13px</span></div><div class="fbm-row"><label class="fbm-muted" for="fbm-fc-transparency">Transparency</label><input type="range" id="fbm-fc-transparency" min="0" max="60" step="1" value="15" /><span class="fbm-muted" id="fbm-fc-transparency-val">15%</span></div><p class="fbm-muted fbm-hint">0% is solid Seidr chrome; higher values let the map show through.</p><div class="fbm-row"><label class="fbm-muted" for="fbm-fc-font">Font</label><select id="fbm-fc-font" class="fbm-fc-font-select"></select></div><div class="fbm-row" id="fbm-fc-font-custom-row" hidden><label class="fbm-muted" for="fbm-fc-font-custom">Custom font</label><input type="text" id="fbm-fc-font-custom" placeholder="e.g. Comic Code" maxlength="80" /></div><p class="fbm-muted fbm-hint">Type in the dropdown to jump. Choose Custom\u2026 to enter any installed family.</p></div><div class="fbm-section"><div class="fbm-section-head">Style</div><div class="fbm-row"><label class="fbm-muted" for="fbm-fc-style">Theme</label><select id="fbm-fc-style"><option value="dark">Dark (Seidr)</option><option value="light">Light Seidr</option><option value="custom">Custom CSS</option></select></div><div id="fbm-fc-custom-wrap" hidden><p class="fbm-muted fbm-hint">CSS applied to <code>#fbm-float-chat</code>.</p><textarea id="fbm-fc-css" class="fbm-fc-css" spellcheck="false" rows="8"></textarea><div class="fbm-row"><button type="button" class="fbm-btn fbm-btn-accent" id="fbm-fc-css-apply">Apply</button><button type="button" class="fbm-btn" id="fbm-fc-css-reset">Reset to Dark</button></div></div></div><div class="fbm-section"><div class="fbm-section-head">Highlights</div><label class="fbm-check-row"><input type="checkbox" id="fbm-fc-hl-own" /> <span>Highlight own names / words in messages</span></label><div class="fbm-indent" id="fbm-fc-hl-own-opts"><p class="fbm-muted fbm-hint">One name or word per line (or comma-separated). Defaults to your Club name. Matches in message text are highlighted.</p><textarea id="fbm-fc-own-names" class="fbm-fc-own-names" rows="4" spellcheck="false" placeholder=""></textarea><label class="fbm-check-row"><input type="checkbox" id="fbm-fc-hl-seidr" /> <span>Use Seidr highlight color</span></label><div class="fbm-row" id="fbm-fc-hl-color-row"><label class="fbm-muted" for="fbm-fc-hl-color">Color</label><input type="color" id="fbm-fc-hl-color" value="#d4a017" /></div></div><label class="fbm-check-row"><input type="checkbox" id="fbm-fc-hl-others" /> <span>Highlight other users\u2019 names in message text (Seidr color)</span></label><p class="fbm-muted fbm-hint">Does not change the sender name color \u2014 only mentions inside the message body.</p></div><div class="fbm-section"><div class="fbm-section-head">Compose extras</div><label class="fbm-check-row"><input type="checkbox" id="fbm-fc-whisper-avatar" /> <span>Whisper avatar beside input</span></label><p class="fbm-muted fbm-hint">When whispering, show a small face crop of the target next to the float compose field (FCM-style).</p><label class="fbm-check-row"><input type="checkbox" id="fbm-fc-map-compass" /> <span>Map compass (Members / chat name hover)</span></label><p class="fbm-muted fbm-hint">On map view, hover a Members name (or float-chat name): animated arrow above a visible player, or edge direction if fogged / out of range.</p><label class="fbm-check-row"><input type="checkbox" id="fbm-fc-confirm-leave" /> <span>Confirm before Leave</span></label><p class="fbm-muted fbm-hint">Shows a confirm dialog when using the float chat Leave button.</p><label class="fbm-check-row"><input type="checkbox" id="fbm-fc-ooc-protect" /> <span>OOC Protection</span></label><p class="fbm-muted fbm-hint">Refuse send when parentheses in the message body are unbalanced (broken OOC / whisper / beep).</p></div><div class="fbm-section" id="fbm-trusted-hosts"><div class="fbm-section-head">Trusted image hosts</div><p class="fbm-muted fbm-hint">Permanent hosts for Floatable Chat image embeds. Session trusts clear on relog. Some CDNs (cdn.discordapp.com, i.imgur.com, Tenor, \u2026) are built-in; others ask in chat.</p><div class="fbm-map-list" id="fbm-trusted-host-list"></div><p class="fbm-muted fbm-hint" id="fbm-trusted-host-empty" hidden>No permanent hosts yet.</p></div><div class="fbm-row"><button type="button" class="fbm-btn fbm-btn-accent" id="fbm-fc-open">Show float chat</button></div></div><div class="fbm-page" id="fbm-page-maps"><p class="fbm-muted fbm-hint">Save uses Club map export (/mapcopy). Load requires admin (/mappaste). Limit 10 maps + 1 autosave (autosave is kept on this device only).</p><div class="fbm-section"><div class="fbm-section-head">Save current map</div><div class="fbm-row"><input type="text" id="fbm-map-name" placeholder="Map name" maxlength="48" /><button type="button" class="fbm-btn fbm-btn-accent" id="fbm-map-save">Save</button></div></div><div class="fbm-section"><div class="fbm-section-head">Load</div><div class="fbm-map-list" id="fbm-map-list"></div></div><div class="fbm-section"><div class="fbm-section-head">Autosave</div><p class="fbm-muted fbm-hint">After you edit the map, autosaves at most once per 60 seconds.</p><div class="fbm-map-item"><span id="fbm-autosave-label">Autosave \u2014 empty</span><button type="button" class="fbm-btn" id="fbm-autosave-load" disabled>Load</button></div></div></div><div class="fbm-page" id="fbm-page-about"><p class="fbm-muted fbm-hint">Version <span id="fbm-about-ver"></span>. Developed by Freya (245450).</p><p class="fbm-muted fbm-hint">Open via Preference \u2192 Extensions \u2192 Freyas Better Maps, or the build bar <strong>Settings</strong> button.</p><div class="fbm-row" style="margin-bottom:10px"><button type="button" class="fbm-btn fbm-btn-accent" id="fbm-about-changelog">What\u2019s new</button><a class="fbm-btn" id="fbm-about-docs" href="#" target="_blank" rel="noopener noreferrer">Documentation</a></div><p class="fbm-muted fbm-hint">Expand a feature below for a short description and how to use it.</p><div class="fbm-about-feats">' + aboutFeat(
      "Typing bubbles",
      "Shows a readable Talk bubble above characters who are typing on the map. Scales with zoom.",
      [
        "Turn on <strong>Show typing bubbles</strong> under General (on by default).",
        "Join a map room and type \u2014 others with FBM see your bubble.",
        "If FAM Map typing is also on, bubbles may stack; turn one off."
      ]
    ) + aboutFeat(
      "Hide Club map toolbar",
      "Collapses Club\u2019s left map buttons and zoom controls behind a small <strong>+</strong> so the map stays clear.",
      [
        "Enable <strong>Hide Club map toolbar</strong> under General.",
        "Click the small <strong>+</strong> on the left to expand Club\u2019s tools again; click the <strong>\u2212</strong> beside the Club tools to collapse.",
        "While only the tool strip is showing, <strong>\u2212</strong> stays near the left buttons; when the tile/search panel opens fully, it moves to the right of the grey panel (aligned with the search field).",
        "Works with R132\u2019s HTML map panel and canvas zoom buttons."
      ]
    ) + aboutFeat(
      "Hide Arrow Keys",
      "Hides Club\u2019s on-map movement arrows and SuperPowers control. Admins get a \u2605 on the FBM build bar that toggles SuperPowers the same way.",
      [
        "Enable <strong>Hide Arrow Keys</strong> under General.",
        "WASD / keyboard movement still works; only the on-screen pad is hidden.",
        "Open the FBM build bar (admin) and click \u2605 to toggle SuperPowers."
      ]
    ) + aboutFeat(
      "Building tools &amp; build bar",
      "Optional FBM toolbar for grid, Build catalog, region copy/paste, zoom-out, and Settings \u2014 hidden until you need it.",
      [
        "Enable <strong>Allow building tools</strong> under General.",
        "On the map (as admin), click the <strong>FBM</strong> button (under <strong>+</strong> when collapsed, under <strong>\u2212</strong> when the Club panel is open), or press the build-bar hotkey (default <strong>Alt+B</strong>).",
        "The bar opens at the top-center of the map area. Drag the <strong>\u22EE\u22EE</strong> grip to move it; hiding and showing the bar resets it to the default spot.",
        "Change the hotkey under General \u2192 Build bar hotkey (Capture or type e.g. Alt+B).",
        "While typing in FBM fields, WASD will not move you on the map."
      ]
    ) + aboutFeat(
      "Grid overlay",
      "Draws a light grid every 5 tiles plus center X/Y axes to line up builds.",
      [
        "Open the build bar, then click <strong>Grid</strong> to toggle.",
        "Grid state is remembered in your settings."
      ]
    ) + aboutFeat(
      "Objects Build",
      "Alternate tile/object/effect picker with hybrid color grouping, custom variants (rotation / size / layers), brush or single place, pipet, eraser, fog, and undo.",
      [
        "Build bar \u2192 <strong>Build</strong> opens the floating catalog (admin).",
        "Pick a category, then a card \u2014 Club Brush is armed. Toggle <strong>Single</strong> for one-shot place.",
        "On customizable objects, use the gear for place settings; <strong>Save as new variant</strong> stores locally. Edit/Delete only apply to your custom variants.",
        "<strong>Pipet</strong> samples a placed object (optionally saving its settings as a variant).",
        "Category order, customs, recent, and window size persist in localStorage."
      ]
    ) + aboutFeat(
      "Copy, templates &amp; paste",
      "Select a rectangle of tiles, save it as a local template, and paste elsewhere (or later).",
      [
        "Build bar \u2192 <strong>Copy</strong>: drag or click tiles for an AABB selection (toggle tiles as needed).",
        "<strong>Obj settings</strong> (on by default) includes Sign text, Tether points, Teleporter links, Rotation, Size, and Colors when you <strong>save</strong> a selection. At <strong>paste</strong> time, turn it off to place tiles/objects only even if the template stored settings.",
        "<strong>Save selection</strong> stores a thumbnail (real map assets when loaded) in localStorage.",
        "<strong>Paste\u2026</strong> opens the template picker; choose one, then aim with the translucent ghost preview and click the top-left origin.",
        "Press <strong>Esc</strong> to cancel copy or paste mode.",
        "Paste syncs through Club\u2019s MapManager (same path as map paint / room Update)."
      ]
    ) + aboutFeat(
      "Map storage &amp; autosave",
      "Save up to 10 named maps plus one autosave slot using Club\u2019s map export format. Load requires room admin.",
      [
        "Open Settings \u2192 <strong>Map storage</strong>.",
        "Enter a name and click <strong>Save</strong> (uses /mapcopy-style export).",
        "Click <strong>Load</strong> on a saved map (admin; applies like /mappaste and syncs the room).",
        "After you edit the map, autosave runs at most once per 60 seconds; load it from the Autosave row."
      ]
    ) + aboutFeat(
      "Full blindfold",
      "At maximum blindness, the map becomes a short-range silhouette: walkable tiles black, walls darker grey, other blockers (doors, trees, glass, \u2026) lighter grey. You still see your full-color avatar on your tile; adjacent players are greyscale or generic silhouettes.",
      [
        "Enable <strong>Full blindfold</strong> under General.",
        "Choose <strong>Others look like</strong>: greyscale models or generic silhouette.",
        "Equip a full blindfold in Club and stand on the map \u2014 only yourself and the 8 adjacent tiles stay visible."
      ]
    ) + aboutFeat(
      "Hearing-range whisper",
      "Allows whispering to someone when Club considers them hearable (walls / audibility) and within hearing distance. SuperZoom\u2019s larger view does not extend whisper range.",
      [
        "Enable <strong>Whisper at hearing range</strong> under General.",
        "On the map, open a whisper to a nearby character who can hear you.",
        "If they are blocked by walls or too far for hearing, the whisper stays blocked."
      ]
    ) + aboutFeat(
      "Full map zoom-out",
      "Raises Club\u2019s map zoom maximum (SuperZoom-style) so you can see more of the map at once. Only applies while you are a <strong>room admin</strong>.",
      [
        "Enable <strong>Full map zoom-out</strong> under General (checkbox is enabled when you are admin).",
        "Use Club\u2019s map zoom controls to pull back.",
        "If another mod already changed the zoom max away from Club\u2019s defaults, FBM leaves it alone."
      ]
    ) + aboutFeat(
      "Hide room-update spam",
      "Stops identical \u201Cupdated the room\u201D chat lines from repeating while you (or others) paint. The editor still sees a short <strong>Saved &amp; synced</strong> stamp on the build bar.",
      [
        "Enable <strong>Hide duplicate \u201Cupdated the room\u201D chat spam</strong> under General.",
        "Set the cooldown in minutes (default 5) \u2014 matching updates within that window are suppressed.",
        "Useful when pasting templates or editing large regions."
      ]
    ) + aboutFeat(
      "Floatable Chat",
      "A movable Seidr-styled chat panel when Club chat is collapsed on the map. Mirrors room messages, Leave/Kneel/Wardrobe toolbar, and Club slash-tag autocomplete.",
      [
        "Open Settings \u2192 <strong>Chat</strong> (or hotkey, default <strong>Alt+C</strong>).",
        "Enable <strong>Autoshow when default Club chat is hidden</strong> to pop the panel when the map chat is collapsed.",
        "<strong>Autoclose chat joining a room</strong> collapses Club chat on join (toast warns if Autoshow is off).",
        "Type <code>/</code> for Club command tags. Send copies into Club\u2019s InputChat so emotes, whispers, and registered commands still work.",
        "Whispers/beeps show <strong>from/to</strong> labels. Hover <strong>\u21A9</strong> to reply (including your own messages). Cancel with the red \xD7.",
        "Click a name to copy the ID and prep <code>/whisper id</code>. Compose border turns purple for whisper and teal for beep.",
        "<strong>Members</strong> opens a slide panel of everyone in the room (admin Kick/Ban/Promote/Whitelist when you are room admin).",
        "Right-click a message: Copy ID; Mute; Kick/Ban; Whitelist/Blacklist; Add as Friend \u2014 confirmed.",
        "Tab stays in the compose field; <code>/</code> and <code>.</code> commands autocomplete (dot via Club InputChat proxy).",
        "Optional under Chat \u2192 Compose extras: whisper avatar, map compass (Members/chat hover \u2192 arrow or edge direction), confirm Leave. Font picker lists local fonts / accepts typed families.",
        "Image links from trusted hosts embed inline (WCE-style). Unknown hosts show <strong>Trust</strong> / <strong>Trust permanently</strong> in the message \u2014 manage permanent hosts under Settings \u2192 <strong>Chat</strong>.",
        "Optional highlights: own name/words and other users\u2019 names inside message text (sender labels keep Club colors).",
        "Seidr Room Manager appears on the toolbar when Seidr is loaded (Seidr\u2019s floating \u2302 hides while this panel is open). Tab / Fast Select autocomplete uses Seidr when both mods are loaded."
      ]
    ) + aboutFeat(
      "Install &amp; reload",
      "Runs as a Tampermonkey userscript, FUSAM loader, or bookmark that loads the gist IIFE.",
      [
        "Tampermonkey: install <code>freyas-better-maps.user.js</code>.",
        "Bookmark: run the bookmarklet; reload the page to pick up the newest gist build without logging out.",
        "Settings sync via ExtensionSettings (<code>FreyasBetterMaps</code>, maps in <code>FreyasBetterMapsMaps</code>); window geometry and autosave stay in localStorage."
      ]
    ) + "</div></div></div>";
    document.body.appendChild(root);
    bindDrag($("fbm-panel"), $("fbm-header"));
    $("fbm-close").addEventListener("click", function() {
      FBM.closePanel();
    });
    root.querySelectorAll(".fbm-tab").forEach(function(tab) {
      tab.addEventListener("click", function() {
        root.querySelectorAll(".fbm-tab").forEach(function(t) {
          t.classList.toggle("fbm-on", t === tab);
        });
        const tabEl = tab;
        root.querySelectorAll(".fbm-page").forEach(function(p) {
          p.classList.toggle("fbm-on", p.id === "fbm-page-" + tabEl.dataset.tab);
        });
      });
    });
    if (FBM.bindSettingsUi) FBM.bindSettingsUi();
    if (FBM.bindBuildBar) FBM.bindBuildBar();
    if (FBM.bindFloatChatUi) FBM.bindFloatChatUi();
    if (FBM.bindChangelogUi) FBM.bindChangelogUi();
    const aboutCl = $("fbm-about-changelog");
    if (aboutCl) {
      aboutCl.addEventListener("click", function() {
        if (FBM.openChangelogModal) FBM.openChangelogModal();
      });
    }
    const aboutDocs = $("fbm-about-docs");
    if (aboutDocs) {
      aboutDocs.href = String(FBM.DOCS_URL || "https://freya-bc.github.io/Freyas-Better-Maps/");
    }
  };
  FBM.leavePreferenceToGame = function() {
    if (typeof PreferenceExtensionsCurrent !== "undefined" && PreferenceExtensionsCurrent) {
      PreferenceExtensionsCurrent.unload?.();
      PreferenceExtensionsCurrent = null;
    }
    if (typeof ChatRoomData !== "undefined" && ChatRoomData && typeof CommonSetScreen === "function") {
      CommonSetScreen("Online", "ChatRoom");
      return;
    }
    if (typeof InformationSheetReturnScreen !== "undefined" && InformationSheetReturnScreen && typeof CommonSetScreen === "function") {
      CommonSetScreen.apply(null, InformationSheetReturnScreen);
      return;
    }
    if (typeof CommonSetScreen === "function") CommonSetScreen("Room", "MainHall");
  };
  FBM.registerPreference = function() {
    if (typeof PreferenceRegisterExtensionSetting !== "function") return;
    if (typeof PreferenceExtensionsSettings !== "undefined" && PreferenceExtensionsSettings.FreyasBetterMaps) return;
    PreferenceRegisterExtensionSetting({
      Identifier: "FreyasBetterMaps",
      ButtonText: "Freyas Better Maps",
      Image: "Icons/MapTypeAlways.png",
      load: function() {
        FBM.openPanel();
        FBM.leavePreferenceToGame();
      },
      run: function() {
      },
      click: function() {
      },
      exit: function() {
        return true;
      },
      unload: function() {
      }
    });
  };
  FBM.prepareReload = function() {
    try {
      if (FBM.flushSettings) FBM.flushSettings();
    } catch (e) {
    }
    ["fbm-root", "fbm-styles", "fbm-fc-custom-style"].forEach(function(id) {
      const el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    window.__FreyasBetterMapsPageLoaded = false;
    if (window.FreyasBetterMaps) window.FreyasBetterMaps._booted = false;
  };

  // src/ui/settings.ts
  function $2(id) {
    return document.getElementById(id);
  }
  function inputEl(id) {
    return document.getElementById(id);
  }
  function selectEl(id) {
    return document.getElementById(id);
  }
  function buttonEl(id) {
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
  FBM.refreshSettingsUi = function() {
    if (!FBM.settings) return;
    FBM.loadMapOverflow();
    const s = FBM.settings;
    const set = function(id, on) {
      const el = inputEl(id);
      if (el) el.checked = !!on;
    };
    set("fbm-typing", s.typingIndicator);
    set("fbm-hide-toolbar", s.hideBuildToolbar);
    set("fbm-hide-arrows", !!s.hideArrowKeys);
    set("fbm-building", s.buildingTools);
    set("fbm-invisible-walls", !!s.showInvisibleWalls);
    set("fbm-copy-objset", s.copyObjectSettings !== false);
    set("fbm-blindfold", s.fullBlindfold);
    set("fbm-whisper", s.hearingWhisper);
    set("fbm-zoom", s.fullZoomOut);
    const zoomEl = inputEl("fbm-zoom");
    if (zoomEl) zoomEl.disabled = !(FBM.mapIsAdmin && FBM.mapIsAdmin());
    set("fbm-hide-room-update", s.hideRoomUpdateSpam);
    const styleSel = selectEl("fbm-blindfold-style");
    if (styleSel) {
      styleSel.value = s.blindfoldOthersStyle === "silhouette" ? "silhouette" : "greyscale";
      styleSel.disabled = !s.fullBlindfold;
    }
    const cool = inputEl("fbm-room-update-cool");
    if (cool) {
      cool.value = String(s.roomUpdateHideCooldownMin != null ? s.roomUpdateHideCooldownMin : 5);
      cool.disabled = !s.hideRoomUpdateSpam;
    }
    const hk = inputEl("fbm-build-hotkey");
    if (hk) hk.value = s.buildBarHotkey || "Alt+B";
    const ver = $2("fbm-about-ver");
    if (ver) ver.textContent = FBM.VERSION || "";
    const list = $2("fbm-map-list");
    if (list) {
      list.innerHTML = "";
      (s.maps || []).forEach(function(m) {
        if (!m) return;
        const row = document.createElement("div");
        row.className = "fbm-map-item";
        const span = document.createElement("span");
        span.innerHTML = '<strong></strong><div class="fbm-map-meta"></div>';
        span.querySelector("strong").textContent = m.name || "Untitled";
        span.querySelector(".fbm-map-meta").textContent = fmtTime(m.savedAt) + (m.overflow ? " \xB7 overflow" : "");
        const load = document.createElement("button");
        load.type = "button";
        load.className = "fbm-btn";
        load.textContent = "Load";
        load.addEventListener("click", function() {
          FBM.loadNamedMap(m.id);
        });
        const del = document.createElement("button");
        del.type = "button";
        del.className = "fbm-btn fbm-btn-danger";
        del.textContent = "\xD7";
        del.title = "Delete";
        del.addEventListener("click", function() {
          if (!confirm("Delete map \u201C" + (m.name || "") + "\u201D?")) return;
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
    const asLabel = $2("fbm-autosave-label");
    const asBtn = buttonEl("fbm-autosave-load");
    if (asLabel && asBtn) {
      if (s.autosave && (s.autosave.data || s.autosave.overflow)) {
        asLabel.textContent = "Autosave \u2014 " + fmtTime(s.autosave.savedAt);
        asBtn.disabled = false;
      } else {
        asLabel.textContent = "Autosave \u2014 empty";
        asBtn.disabled = true;
      }
    }
  };
  FBM.bindSettingsUi = function() {
    function bindToggle(id, key, after) {
      const el = inputEl(id);
      if (!el || el._fbmBound) return;
      el._fbmBound = true;
      el.addEventListener("change", function() {
        FBM.settings[key] = !!el.checked;
        FBM.saveSettings();
        if (after) after(el.checked);
        FBM.setStatus((el.nextElementSibling && el.nextElementSibling.textContent) + (el.checked ? " on." : " off."));
        if (FBM.refreshBuildBar) FBM.refreshBuildBar();
      });
    }
    bindToggle("fbm-typing", "typingIndicator");
    bindToggle("fbm-hide-toolbar", "hideBuildToolbar", function() {
      FBM._toolbarExpanded = false;
      if (FBM.syncMapEditorPanel) FBM.syncMapEditorPanel();
    });
    bindToggle("fbm-hide-arrows", "hideArrowKeys", function() {
      if (FBM.syncHideArrowKeysDom) FBM.syncHideArrowKeysDom();
    });
    bindToggle("fbm-building", "buildingTools");
    bindToggle("fbm-invisible-walls", "showInvisibleWalls");
    bindToggle("fbm-copy-objset", "copyObjectSettings");
    bindToggle("fbm-blindfold", "fullBlindfold", function() {
      const styleSel2 = selectEl("fbm-blindfold-style");
      if (styleSel2) styleSel2.disabled = !FBM.settings.fullBlindfold;
    });
    bindToggle("fbm-whisper", "hearingWhisper");
    bindToggle("fbm-zoom", "fullZoomOut", function() {
      FBM.applyZoomSetting();
    });
    bindToggle("fbm-hide-room-update", "hideRoomUpdateSpam", function() {
      const cool2 = inputEl("fbm-room-update-cool");
      if (cool2) cool2.disabled = !FBM.settings.hideRoomUpdateSpam;
    });
    const styleSel = selectEl("fbm-blindfold-style");
    if (styleSel && !styleSel._fbmBound) {
      styleSel._fbmBound = true;
      styleSel.addEventListener("change", function() {
        FBM.settings.blindfoldOthersStyle = styleSel.value === "silhouette" ? "silhouette" : "greyscale";
        FBM.saveSettings();
        FBM.setStatus(
          "Blindfold others: " + (FBM.settings.blindfoldOthersStyle === "silhouette" ? "generic silhouette" : "greyscale models") + "."
        );
      });
    }
    const cool = inputEl("fbm-room-update-cool");
    if (cool && !cool._fbmBound) {
      cool._fbmBound = true;
      cool.addEventListener("change", function() {
        let n = Math.floor(Number(cool.value));
        if (!isFinite(n) || n < 1) n = 5;
        if (n > 120) n = 120;
        cool.value = String(n);
        FBM.settings.roomUpdateHideCooldownMin = n;
        FBM.saveSettings();
        FBM.setStatus("Room-update hide cooldown: " + n + " min.");
      });
    }
    const hk = inputEl("fbm-build-hotkey");
    if (hk && !hk._fbmBound) {
      hk._fbmBound = true;
      hk.addEventListener("change", function() {
        const v = (hk.value || "").trim() || "Alt+B";
        hk.value = v;
        FBM.settings.buildBarHotkey = v;
        FBM.saveSettings();
        FBM.setStatus("Build bar hotkey: " + v);
      });
    }
    const cap = buttonEl("fbm-build-hotkey-capture");
    if (cap && !cap._fbmBound) {
      cap._fbmBound = true;
      cap.addEventListener("click", function() {
        if (FBM._capturingHotkey) return;
        FBM._capturingHotkey = true;
        const prevLabel = cap.textContent;
        cap.textContent = "Listening\u2026";
        FBM.setStatus("Press a shortcut (e.g. Alt+B)\u2026 Esc cancels.");
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
        timer = setTimeout(function() {
          finish(null);
        }, 1e4);
      });
    }
    const saveBtn = $2("fbm-map-save");
    if (saveBtn && !saveBtn._fbmBound) {
      saveBtn._fbmBound = true;
      saveBtn.addEventListener("click", function() {
        const nameEl = inputEl("fbm-map-name");
        const name = (nameEl && nameEl.value ? nameEl.value : "").trim();
        FBM.saveNamedMap(name);
        if (nameEl) nameEl.value = "";
        FBM.refreshSettingsUi();
      });
    }
    const asBtnLoad = buttonEl("fbm-autosave-load");
    if (asBtnLoad && !asBtnLoad._fbmBound) {
      asBtnLoad._fbmBound = true;
      asBtnLoad.addEventListener("click", function() {
        FBM.loadAutosave();
      });
    }
  };

  // src/ui/buildBar.ts
  function $3(id) {
    return document.getElementById(id);
  }
  FBM.setBuildBarOpen = function(on) {
    FBM._buildBarOpen = !!on;
    if (!FBM._buildBarOpen) {
      FBM._buildBarPos = null;
      FBM._buildBarDragging = false;
      if (FBM.hideTemplatesUi) FBM.hideTemplatesUi();
      if (FBM.closeObjectsBuild) FBM.closeObjectsBuild();
    }
    FBM.refreshBuildBar();
    return FBM._buildBarOpen;
  };
  FBM.toggleBuildBar = function() {
    return FBM.setBuildBarOpen(!FBM._buildBarOpen);
  };
  FBM.buildBarShouldShow = function() {
    const m = FBM.mapBag();
    if (!m.buildingTools) return false;
    if (!FBM._buildBarOpen) return false;
    if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return false;
    if (!FBM.mapIsMapRoom()) return false;
    if (!FBM.mapIsAdmin()) return false;
    return true;
  };
  FBM.buildBarStillOnMap = function() {
    const m = FBM.mapBag();
    if (!m.buildingTools) return false;
    if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return false;
    if (!FBM.mapIsMapRoom()) return false;
    if (!FBM.mapIsAdmin()) return false;
    return true;
  };
  FBM.closeBuildBarIfOffMap = function() {
    if (!FBM._buildBarOpen) return false;
    if (FBM.buildBarStillOnMap()) return false;
    FBM.setBuildBarOpen(false);
    return true;
  };
  FBM.getMainCanvasEl = function() {
    if (typeof MainCanvas !== "undefined" && MainCanvas && MainCanvas.canvas) return MainCanvas.canvas;
    return document.getElementById("MainCanvas");
  };
  FBM.mapAreaGeometry = function() {
    const c = FBM.getMainCanvasEl();
    if (!c || !c.getBoundingClientRect) return null;
    const r = c.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const view = FBM.mapViewRect ? FBM.mapViewRect() : { Width: 1e3 };
    const frac = Math.max(0.05, Math.min(1, (Number(view.Width) || 1e3) / 2e3));
    const mapW = r.width * frac;
    return {
      left: r.left,
      top: r.top,
      width: mapW,
      height: r.height,
      centerX: r.left + mapW / 2,
      /* Top padding inside the map (Club Y ≈ 18) */
      barTop: r.top + 18 / 1e3 * r.height
    };
  };
  FBM.layoutBuildBar = function() {
    const bar = $3("fbm-build-bar");
    if (!bar) return;
    const geo = FBM.mapAreaGeometry();
    const tpl = $3("fbm-templates");
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
  FBM.bindBuildBarDrag = function() {
    const bar = $3("fbm-build-bar");
    const grip = $3("fbm-bar-grip");
    if (!bar || !grip || grip._fbmBound) return;
    grip._fbmBound = true;
    let dragging = false;
    let ox = 0;
    let oy = 0;
    grip.addEventListener("pointerdown", function(e) {
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
      }
      e.preventDefault();
    });
    grip.addEventListener("pointermove", function(e) {
      if (!dragging) return;
      const left = Math.max(0, Math.min(window.innerWidth - 40, e.clientX - ox));
      const top = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - oy));
      bar.style.left = left + "px";
      bar.style.top = top + "px";
      const tpl = $3("fbm-templates");
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
  FBM._ensureBuildBarLayoutWatch = function() {
    if (FBM._buildBarLayoutBound) return;
    FBM._buildBarLayoutBound = true;
    const relayout = function() {
      if (FBM.layoutBuildBar) FBM.layoutBuildBar();
    };
    window.addEventListener("resize", relayout);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", relayout);
      window.visualViewport.addEventListener("scroll", relayout);
    }
  };
  FBM.refreshBuildBar = function() {
    FBM.ensureUi();
    const bar = $3("fbm-build-bar");
    if (!bar) return;
    if (FBM._buildBarOpen && !FBM.buildBarStillOnMap()) {
      FBM._buildBarOpen = false;
      FBM._buildBarPos = null;
      FBM._buildBarDragging = false;
      if (FBM.hideTemplatesUi) FBM.hideTemplatesUi();
    }
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
    const gridBtn = $3("fbm-bar-grid");
    if (gridBtn) gridBtn.classList.toggle("fbm-on", !!(FBM.settings && FBM.settings.gridOn));
    const objectsBtn = $3("fbm-bar-objects");
    const objectsPanel = $3("fbm-objects");
    if (objectsBtn) objectsBtn.classList.toggle("fbm-on", !!(objectsPanel && !objectsPanel.hidden));
    const objsetBtn = $3("fbm-bar-objset");
    if (objsetBtn) objsetBtn.classList.toggle("fbm-on", !!(FBM.settings && FBM.settings.copyObjectSettings !== false));
    const saveBtn = $3("fbm-bar-save");
    if (saveBtn) saveBtn.disabled = !(FBM._copy && FBM._copy.mode === "edit" && Object.keys(FBM._copy.cells || {}).length);
    const copyBtn = $3("fbm-bar-copy");
    if (copyBtn) {
      const on = FBM._copy && (FBM._copy.mode === "a" || FBM._copy.mode === "b" || FBM._copy.mode === "edit");
      copyBtn.classList.toggle("fbm-on", !!on);
    }
    const pasteBtn = $3("fbm-bar-paste");
    if (pasteBtn) {
      const copyBusy = !!FBM._copy && (FBM._copy.mode === "a" || FBM._copy.mode === "b" || FBM._copy.mode === "edit");
      pasteBtn.disabled = copyBusy;
      pasteBtn.classList.toggle("fbm-on", !!(FBM._copy && FBM._copy.mode === "paste"));
    }
    const sync = $3("fbm-bar-sync");
    if (sync) {
      if (FBM._roomSyncSavedAt) {
        const t = FBM.formatSyncTime ? FBM.formatSyncTime(FBM._roomSyncSavedAt) : "";
        sync.textContent = t ? "Saved & synced \xB7 " + t : "Saved & synced";
        sync.hidden = false;
      } else {
        sync.textContent = "";
        sync.hidden = true;
      }
    }
    if (FBM.refreshBuildBarStar) FBM.refreshBuildBarStar();
    if (show) {
      FBM._ensureBuildBarLayoutWatch();
      if (FBM.bindBuildBarDrag) FBM.bindBuildBarDrag();
      if (!FBM._buildBarDragging) FBM.layoutBuildBar();
      if (!FBM._buildBarRaf) {
        const tick = function() {
          FBM._buildBarRaf = 0;
          if (!FBM.buildBarShouldShow()) {
            if (FBM.refreshBuildBar) FBM.refreshBuildBar();
            return;
          }
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
  FBM.refreshTemplatesUi = function() {
    FBM.loadTemplates();
    const grid = $3("fbm-tpl-grid");
    if (!grid) return;
    grid.innerHTML = "";
    (FBM.templates || []).forEach(function(t) {
      const card = document.createElement("div");
      card.className = "fbm-tpl-card";
      const del = document.createElement("button");
      del.type = "button";
      del.className = "fbm-tpl-del";
      del.title = "Delete";
      del.textContent = "\xD7";
      del.addEventListener("click", function(e) {
        e.stopPropagation();
        if (!confirm("Delete template \u201C" + (t.name || "") + "\u201D?")) return;
        FBM.copyDeleteTemplate(t.id);
      });
      const thumbEl = t.thumb ? document.createElement("img") : document.createElement("div");
      thumbEl.className = "fbm-tpl-thumb";
      if (t.thumb && thumbEl instanceof HTMLImageElement) {
        thumbEl.src = t.thumb;
        thumbEl.alt = "";
      }
      const name = document.createElement("div");
      name.textContent = t.name || "Room";
      const size = document.createElement("div");
      size.className = "fbm-tpl-size";
      size.textContent = (t.w || "?") + " \xD7 " + (t.h || "?") + (t.withObjectSettings ? " \xB7 obj" : "");
      card.appendChild(del);
      card.appendChild(thumbEl);
      card.appendChild(name);
      card.appendChild(size);
      card.addEventListener("click", function() {
        FBM.copyBeginPaste(t.id);
      });
      grid.appendChild(card);
    });
    if (!(FBM.templates || []).length) {
      grid.innerHTML = '<p class="fbm-muted fbm-hint">No templates yet. Use Copy \u2192 Save selection.</p>';
    }
  };
  FBM.showTemplatesUi = function() {
    FBM.ensureUi();
    const el = $3("fbm-templates");
    if (!el) return;
    el.hidden = false;
    FBM.refreshTemplatesUi();
    if (FBM.layoutBuildBar) FBM.layoutBuildBar();
  };
  FBM.hideTemplatesUi = function() {
    const el = $3("fbm-templates");
    if (el) el.hidden = true;
  };
  FBM.refreshBuildBarStar = function() {
    const star = $3("fbm-bar-star");
    if (!star) return;
    const show = !!(FBM.settings && FBM.settings.hideArrowKeys && FBM.mapIsAdmin && FBM.mapIsAdmin());
    star.hidden = !show;
    let active = false;
    try {
      active = !!ChatRoomMapViewSuperPowersActive;
    } catch (e) {
      active = false;
    }
    star.classList.toggle("fbm-on", active);
    star.title = active ? "SuperPowers on" : "SuperPowers";
    const img = $3("fbm-bar-star-img");
    if (img) {
      img.src = "Icons/" + (active ? "SuperPowersActive" : "SuperPowersInactive") + ".png";
    }
  };
  FBM.bindBuildBar = function() {
    const gridBtn = $3("fbm-bar-grid");
    if (gridBtn && !gridBtn._fbmBound) {
      gridBtn._fbmBound = true;
      gridBtn.addEventListener("click", function() {
        FBM.settings.gridOn = !FBM.settings.gridOn;
        FBM.saveSettings();
        FBM.refreshBuildBar();
      });
    }
    const starBtn = $3("fbm-bar-star");
    if (starBtn && !starBtn._fbmBound) {
      starBtn._fbmBound = true;
      starBtn.addEventListener("click", function() {
        if (FBM.toggleMapSuperPowers) FBM.toggleMapSuperPowers();
        FBM.refreshBuildBarStar();
      });
    }
    const objectsBtn = $3("fbm-bar-objects");
    if (objectsBtn && !objectsBtn._fbmBound) {
      objectsBtn._fbmBound = true;
      objectsBtn.addEventListener("click", function() {
        if (FBM.toggleObjectsBuild) FBM.toggleObjectsBuild();
        FBM.refreshBuildBar();
      });
    }
    const objsetBtn = $3("fbm-bar-objset");
    if (objsetBtn && !objsetBtn._fbmBound) {
      objsetBtn._fbmBound = true;
      objsetBtn.addEventListener("click", function() {
        FBM.settings.copyObjectSettings = !(FBM.settings.copyObjectSettings !== false);
        FBM.saveSettings();
        FBM.refreshBuildBar();
        if (FBM.refreshSettingsUi) FBM.refreshSettingsUi();
      });
    }
    const copyBtn = $3("fbm-bar-copy");
    if (copyBtn && !copyBtn._fbmBound) {
      copyBtn._fbmBound = true;
      copyBtn.addEventListener("click", function() {
        if (FBM._copy && FBM._copy.mode) FBM.copyReset();
        else FBM.copyStart();
        FBM.refreshBuildBar();
      });
    }
    const saveBtn = $3("fbm-bar-save");
    if (saveBtn && !saveBtn._fbmBound) {
      saveBtn._fbmBound = true;
      saveBtn.addEventListener("click", function() {
        if (!FBM.promptText) return;
        FBM.promptText("Template name", {
          initial: "Room",
          confirmLabel: "Save",
          maxlength: 40
        }).then(function(name) {
          if (name == null) return;
          FBM.copySaveTemplate(name);
          FBM.refreshBuildBar();
        });
      });
    }
    const pasteBtn = $3("fbm-bar-paste");
    if (pasteBtn && !pasteBtn._fbmBound) {
      pasteBtn._fbmBound = true;
      pasteBtn.addEventListener("click", function() {
        FBM.showTemplatesUi();
      });
    }
    const settingsBtn = $3("fbm-bar-settings");
    if (settingsBtn && !settingsBtn._fbmBound) {
      settingsBtn._fbmBound = true;
      settingsBtn.addEventListener("click", function() {
        if (FBM.togglePanel) FBM.togglePanel();
        else if (FBM.openPanel) FBM.openPanel();
      });
    }
    if (FBM.bindBuildBarDrag) FBM.bindBuildBarDrag();
    const closeTpl = $3("fbm-tpl-close");
    if (closeTpl && !closeTpl._fbmBound) {
      closeTpl._fbmBound = true;
      closeTpl.addEventListener("click", function() {
        FBM.hideTemplatesUi();
      });
    }
  };
  FBM.hotkeyMatches = function(e, spec) {
    const s = String(spec || "").trim();
    if (!s || !e) return false;
    const parts = s.split("+").map(function(p) {
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
  FBM.installBuildBarHotkey = function() {
    if (FBM._hotkeyBound) return;
    FBM._hotkeyBound = true;
    document.addEventListener(
      "keydown",
      function(e) {
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

  // src/ui/objectsBuild.ts
  function $4(id) {
    return document.getElementById(id);
  }
  var ICONS = {
    pipet: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4.5l5 5M3 21l7.5-7.5M12 8l4 4M14 6l2-2a1.5 1.5 0 0 1 2 2l-2 2"/></svg>',
    eraser: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 21h14M3.5 13.5l7-7 6 6-7 7H5.5l-2-2z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    fog: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h12a4 4 0 1 0-1-7.9A5 5 0 0 0 5 11H4a3 3 0 0 0 0 6h1M8 20h10M6 17h12"/></svg>',
    undo: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14 4 9l5-5M4 9h10a5 5 0 0 1 0 10h-2"/></svg>',
    single: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h6v6H4zM14 4h6v6h-6zM9 14l6 6M15 14l-6 6"/></svg>',
    clear: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    save: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
    load: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>'
  };
  FBM._objectsUi = {
    open: false,
    sectionId: "tiles",
    categoryId: "",
    baseId: null,
    variantId: null,
    search: "",
    fogOn: false,
    eraserOn: false,
    bound: false,
    collapsedSections: {}
  };
  function applyThumbStyle(el, src) {
    if (!el || !src) return;
    if (src.thumbUrl) {
      el.style.backgroundImage = 'url("' + src.thumbUrl + '")';
      el.style.backgroundSize = "contain";
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundPosition = "center";
      el.style.backgroundColor = "#2a3038";
    } else if (src.thumbCss) {
      el.style.backgroundImage = "";
      el.style.backgroundColor = src.thumbCss;
    }
  }
  function setStatus(msg) {
    const el = $4("fbm-obj-status");
    if (el) el.textContent = msg || "";
  }
  function matchesSearch(text) {
    const q = (FBM._objectsUi.search || "").trim().toLowerCase();
    if (!q) return true;
    return String(text || "").toLowerCase().includes(q);
  }
  function baseMatches(base) {
    if (matchesSearch(base.name) || matchesSearch(base.type) || matchesSearch(base.style)) return true;
    return (base.variants || []).some(function(v) {
      return matchesSearch(v.name) || matchesSearch(v.displayName) || matchesSearch(v.colorHint);
    });
  }
  function categoryMatches(cat) {
    if (matchesSearch(cat.label)) return true;
    return (cat.bases || []).some(baseMatches);
  }
  function currentCatalog() {
    return FBM.prepareObjectsCatalog ? FBM.prepareObjectsCatalog() : FBM.getCatalog();
  }
  function findVariant(base, variantId) {
    return (base.variants || []).find(function(v) {
      return v && v.id === variantId;
    });
  }
  function placeSettingsFor(base, variant) {
    if (!base.canCustomize || !variant) return null;
    return {
      rotation: variant.rotation || 0,
      size: variant.size != null ? variant.size : 100,
      colors: Array.isArray(variant.colors) ? variant.colors.slice() : []
    };
  }
  function armSelection() {
    const hit = FBM.findCatalogBase(FBM._objectsUi.baseId);
    if (!hit) return;
    const v = findVariant(hit.base, FBM._objectsUi.variantId) || hit.base.variants[0];
    if (!v) return;
    const single = !!(FBM.objectsState && FBM.objectsState.singlePlace);
    FBM._objectsUi.eraserOn = false;
    FBM.objectsArmBrush({
      kind: hit.base.kind,
      clubId: v.clubId,
      settings: placeSettingsFor(hit.base, v),
      single
    });
    FBM.pushObjectsRecent(hit.base.id, v.id);
    setStatus((single ? "Single" : "Brush") + ": " + hit.base.name + " / " + v.name + " \u2014 Esc / \u2715 clears");
    FBM.refreshObjectsBuildUi();
  }
  function hasDrawingSelection() {
    return !!(FBM._objectsPaint && (FBM._objectsPaint.armed || FBM._objectsPaint.pipet) || FBM._objectsUi.eraserOn || FBM._objectsUi.baseId);
  }
  FBM.clearObjectsSelection = function() {
    FBM.objectsClearBrush && FBM.objectsClearBrush();
    FBM.objectsSetPipet && FBM.objectsSetPipet(false);
    FBM._objectsUi.eraserOn = false;
    FBM._objectsUi.baseId = null;
    FBM._objectsUi.variantId = null;
    if (FBM.refreshObjectsBuildUi) FBM.refreshObjectsBuildUi();
    setStatus("Selection cleared.");
  };
  FBM.installObjectsSelectionEscape = function() {
    if (FBM._objectsEscBound) return;
    FBM._objectsEscBound = true;
    document.addEventListener(
      "keydown",
      function(e) {
        if (!e || e.key !== "Escape" && e.code !== "Escape") return;
        if (FBM._capturingHotkey) return;
        if (FBM._objectSettings && (FBM._objectSettings.color.open || FBM._objectSettings.panelOpen || FBM._objectSettings.pick))
          return;
        if (FBM._copy && FBM._copy.mode) return;
        const tpl = document.getElementById("fbm-templates");
        if (tpl && !tpl.hidden) return;
        if (!hasDrawingSelection()) return;
        const t = e.target;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable) && (!t.closest || !t.closest("#fbm-root")))
          return;
        e.preventDefault();
        e.stopPropagation();
        FBM.clearObjectsSelection();
      },
      true
    );
  };
  FBM.objectsBuildMarkup = function() {
    return '<div class="fbm-objects" id="fbm-objects" hidden><div class="fbm-header" id="fbm-obj-header"><div class="fbm-header-title">Objects Build <span class="fbm-badge">beta</span></div><button type="button" class="fbm-icon-btn" id="fbm-obj-close" title="Close">\xD7</button></div><div class="fbm-obj-actionbar"><input type="search" id="fbm-obj-search" class="fbm-obj-search" placeholder="Search\u2026" autocomplete="off" /><button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-pipet" title="Pipet">' + ICONS.pipet + '</button><button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-eraser" title="Eraser">' + ICONS.eraser + '</button><button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-settings-tool" title="Object settings (FBM)">' + ICONS.gear + '</button><button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-fog" title="Fog">' + ICONS.fog + '</button><button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-undo" title="Undo">' + ICONS.undo + '</button><span class="fbm-obj-action-sep"></span><button type="button" class="fbm-icon-btn fbm-obj-tool" id="fbm-obj-single" title="Single place">' + ICONS.single + '</button><button type="button" class="fbm-icon-btn fbm-obj-tool fbm-obj-clear" id="fbm-obj-clear" title="Clear drawing selection (Esc)">' + ICONS.clear + '</button><span class="fbm-obj-action-sep"></span><button type="button" class="fbm-icon-btn" id="fbm-obj-save-cat" title="Export catalog JSON">' + ICONS.save + '</button><button type="button" class="fbm-icon-btn" id="fbm-obj-load-cat" title="Import catalog JSON">' + ICONS.load + '</button><input type="file" id="fbm-obj-load-file" accept="application/json,.json" hidden /></div><div class="fbm-obj-body" id="fbm-obj-body"><aside class="fbm-obj-tree" id="fbm-obj-tree"></aside><section class="fbm-obj-grid-wrap"><div class="fbm-obj-grid-head"><span id="fbm-obj-grid-title">Select a category</span><span class="fbm-muted fbm-hint" id="fbm-obj-brush-label"></span></div><div class="fbm-obj-grid" id="fbm-obj-grid"></div></section><div class="fbm-obj-splitter" id="fbm-obj-splitter" title="Resize detail"></div><aside class="fbm-obj-ext" id="fbm-obj-ext"><p class="fbm-muted fbm-hint" id="fbm-obj-ext-empty">Select an item to see variants.</p><div id="fbm-obj-ext-body" hidden><div class="fbm-obj-preview"><div class="fbm-obj-preview-swatch" id="fbm-obj-preview-swatch"></div><div class="fbm-obj-preview-text"><div class="fbm-obj-preview-name" id="fbm-obj-preview-name"></div><div class="fbm-muted fbm-hint" id="fbm-obj-preview-meta"></div></div></div><div class="fbm-section-head">Variants</div><div class="fbm-obj-variants" id="fbm-obj-variants"></div><div class="fbm-row" id="fbm-obj-custom-actions" hidden><button type="button" class="fbm-btn" id="fbm-obj-edit-variant" title="Rename this custom variant">Rename</button><button type="button" class="fbm-btn fbm-btn-danger" id="fbm-obj-del-variant">Delete</button></div></div></aside></div><div class="fbm-obj-recent-wrap"><div class="fbm-obj-recent-label">Recent</div><div class="fbm-obj-recent" id="fbm-obj-recent"></div></div><div class="fbm-obj-status" id="fbm-obj-status"></div></div>';
  };
  function isSectionCollapsed(secId) {
    if (!FBM.objectsState) FBM.loadObjectsState();
    const stored = FBM.objectsState && FBM.objectsState.ui && FBM.objectsState.ui.collapsedSections;
    if (stored && typeof stored[secId] === "boolean") return stored[secId];
    return !!FBM._objectsUi.collapsedSections[secId];
  }
  function toggleSectionCollapsed(secId) {
    if (!FBM.objectsState) FBM.loadObjectsState();
    if (!FBM.objectsState.ui.collapsedSections) FBM.objectsState.ui.collapsedSections = {};
    const next = !isSectionCollapsed(secId);
    FBM.objectsState.ui.collapsedSections[secId] = next;
    FBM._objectsUi.collapsedSections[secId] = next;
    FBM.saveObjectsState();
    FBM.refreshObjectsBuildUi();
  }
  function renderTree() {
    const tree = $4("fbm-obj-tree");
    const cat = currentCatalog();
    if (!tree || !cat) return;
    tree.innerHTML = "";
    cat.sections.forEach(function(sec) {
      const wrap = document.createElement("div");
      wrap.className = "fbm-obj-sec" + (isSectionCollapsed(sec.id) ? " fbm-collapsed" : "");
      const title = document.createElement("button");
      title.type = "button";
      title.className = "fbm-obj-sec-title";
      title.textContent = sec.label;
      title.title = "Click to collapse / expand";
      title.addEventListener("click", function() {
        toggleSectionCollapsed(sec.id);
      });
      wrap.appendChild(title);
      (sec.categories || []).forEach(function(c, idx) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "fbm-obj-cat";
        if (sec.id === FBM._objectsUi.sectionId && c.id === FBM._objectsUi.categoryId) btn.classList.add("fbm-on");
        if (!categoryMatches(c)) btn.classList.add("fbm-cat-hidden");
        btn.draggable = true;
        btn.dataset.section = sec.id;
        btn.dataset.category = c.id;
        btn.innerHTML = '<span class="fbm-obj-cat-handle">\u22EE\u22EE</span><span></span>';
        btn.querySelector("span:last-child").textContent = c.label;
        btn.addEventListener("click", function() {
          FBM._objectsUi.sectionId = sec.id;
          FBM._objectsUi.categoryId = c.id;
          FBM._objectsUi.baseId = null;
          FBM._objectsUi.variantId = null;
          FBM.refreshObjectsBuildUi();
        });
        btn.addEventListener("dragstart", function(e) {
          e.dataTransfer.setData("text/plain", sec.id + "|" + c.id);
          e.dataTransfer.effectAllowed = "move";
        });
        btn.addEventListener("dragover", function(e) {
          e.preventDefault();
          btn.classList.add("fbm-drag-over");
        });
        btn.addEventListener("dragleave", function() {
          btn.classList.remove("fbm-drag-over");
        });
        btn.addEventListener("drop", function(e) {
          e.preventDefault();
          btn.classList.remove("fbm-drag-over");
          const parts = (e.dataTransfer.getData("text/plain") || "").split("|");
          if (parts[0] !== sec.id || !parts[1] || parts[1] === c.id) return;
          const list = sec.categories;
          const fromIdx = list.findIndex(function(x) {
            return x.id === parts[1];
          });
          const toIdx = idx;
          if (fromIdx < 0) return;
          const moved = list.splice(fromIdx, 1)[0];
          list.splice(toIdx, 0, moved);
          if (!FBM.objectsState) FBM.loadObjectsState();
          FBM.objectsState.categoryOrder[sec.id] = list.map(function(x) {
            return x.id;
          });
          FBM.saveObjectsState();
          FBM.refreshObjectsBuildUi();
        });
        wrap.appendChild(btn);
      });
      tree.appendChild(wrap);
    });
  }
  function renderGrid() {
    const grid = $4("fbm-obj-grid");
    const title = $4("fbm-obj-grid-title");
    const brush = $4("fbm-obj-brush-label");
    const cat = currentCatalog();
    if (!grid || !cat) return;
    const sec = cat.sections.find(function(s) {
      return s.id === FBM._objectsUi.sectionId;
    });
    const category = sec && (sec.categories || []).find(function(c) {
      return c.id === FBM._objectsUi.categoryId;
    });
    if (title) title.textContent = category ? sec.label + " \xB7 " + category.label : "Select a category";
    if (brush) {
      const mode = FBM.objectsState && FBM.objectsState.singlePlace ? "Single" : "Brush";
      const armed = FBM._objectsPaint && FBM._objectsPaint.armed;
      brush.textContent = armed ? "Place: " + mode + " (armed)" : "Place: " + mode;
    }
    grid.innerHTML = "";
    if (!category) return;
    const bases = (category.bases || []).filter(baseMatches);
    if (!bases.length) {
      grid.innerHTML = '<p class="fbm-muted fbm-hint">No items match.</p>';
      return;
    }
    bases.forEach(function(base) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "fbm-obj-card";
      if (base.id === FBM._objectsUi.baseId) card.classList.add("fbm-on");
      const thumb = document.createElement("div");
      thumb.className = "fbm-obj-card-thumb";
      applyThumbStyle(thumb, base);
      const name = document.createElement("div");
      name.className = "fbm-obj-card-name";
      name.textContent = base.name;
      const meta = document.createElement("div");
      meta.className = "fbm-obj-card-meta";
      meta.textContent = (base.variants || []).length + " var.";
      card.appendChild(thumb);
      card.appendChild(name);
      card.appendChild(meta);
      card.addEventListener("click", function() {
        if (base.id === FBM._objectsUi.baseId && hasDrawingSelection()) {
          FBM.clearObjectsSelection();
          return;
        }
        FBM._objectsUi.baseId = base.id;
        FBM._objectsUi.variantId = base.variants[0] ? base.variants[0].id : null;
        armSelection();
      });
      grid.appendChild(card);
    });
  }
  function renderExtended() {
    const empty = $4("fbm-obj-ext-empty");
    const body = $4("fbm-obj-ext-body");
    const hit = FBM._objectsUi.baseId ? FBM.findCatalogBase(FBM._objectsUi.baseId) : null;
    if (!body) return;
    if (!hit) {
      if (empty) empty.hidden = false;
      body.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    body.hidden = false;
    const base = hit.base;
    const variant = findVariant(base, FBM._objectsUi.variantId) || base.variants[0];
    const name = $4("fbm-obj-preview-name");
    const meta = $4("fbm-obj-preview-meta");
    const sw = $4("fbm-obj-preview-swatch");
    const customActs = $4("fbm-obj-custom-actions");
    if (name) name.textContent = base.name;
    if (meta) {
      meta.textContent = base.kind + (variant ? " \xB7 " + variant.name : "") + (variant && variant.clubId != null ? " \xB7 ID " + variant.clubId : "") + (base.canCustomize ? " \xB7 customizable" : " \xB7 baked");
    }
    if (sw) applyThumbStyle(sw, variant && (variant.thumbUrl || variant.thumbCss) ? variant : base);
    if (customActs) customActs.hidden = !(variant && variant.custom === true);
    const variantsEl = $4("fbm-obj-variants");
    if (variantsEl) {
      variantsEl.innerHTML = "";
      (base.variants || []).filter(function(v) {
        return !FBM._objectsUi.search || matchesSearch(v.name) || matchesSearch(base.name);
      }).forEach(function(v) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "fbm-obj-variant" + (v.custom ? " fbm-obj-variant-custom" : "");
        if (v.id === FBM._objectsUi.variantId) btn.classList.add("fbm-on");
        btn.innerHTML = '<span class="fbm-obj-variant-swatch"></span><span class="fbm-obj-variant-name"></span>';
        const swEl = btn.querySelector(".fbm-obj-variant-swatch");
        applyThumbStyle(swEl, v.thumbUrl || v.thumbCss ? v : base);
        btn.querySelector(".fbm-obj-variant-name").textContent = v.name + (v.custom ? " \u2605" : "");
        btn.addEventListener("click", function() {
          if (v.id === FBM._objectsUi.variantId && base.id === FBM._objectsUi.baseId && hasDrawingSelection()) {
            FBM.clearObjectsSelection();
            return;
          }
          FBM._objectsUi.variantId = v.id;
          armSelection();
        });
        variantsEl.appendChild(btn);
      });
    }
  }
  function renderRecent() {
    const row = $4("fbm-obj-recent");
    if (!row) return;
    if (!FBM.objectsState) FBM.loadObjectsState();
    row.innerHTML = "";
    const list = FBM.objectsState.recent || [];
    if (!list.length) {
      row.innerHTML = '<span class="fbm-obj-recent-empty">No recent items.</span>';
      return;
    }
    const maxFit = Math.max(1, Math.floor((row.clientWidth || 400) / 42));
    list.slice(0, maxFit).forEach(function(r) {
      const hit = FBM.findCatalogBase(r.baseId);
      if (!hit) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fbm-obj-recent-item";
      btn.title = hit.base.name;
      const recentVar = findVariant(hit.base, r.variantId);
      applyThumbStyle(btn, recentVar && (recentVar.thumbUrl || recentVar.thumbCss) ? recentVar : hit.base);
      btn.addEventListener("click", function() {
        if (r.baseId === FBM._objectsUi.baseId && r.variantId === FBM._objectsUi.variantId && hasDrawingSelection()) {
          FBM.clearObjectsSelection();
          return;
        }
        FBM._objectsUi.baseId = r.baseId;
        FBM._objectsUi.variantId = r.variantId;
        FBM._objectsUi.sectionId = hit.section.id;
        FBM._objectsUi.categoryId = hit.category.id;
        armSelection();
      });
      row.appendChild(btn);
    });
  }
  function renderTools() {
    const single = $4("fbm-obj-single");
    const pipet = $4("fbm-obj-pipet");
    const eraser = $4("fbm-obj-eraser");
    const fog = $4("fbm-obj-fog");
    const clear = $4("fbm-obj-clear");
    if (single) single.classList.toggle("fbm-on", !!(FBM.objectsState && FBM.objectsState.singlePlace));
    if (pipet) pipet.classList.toggle("fbm-on", !!(FBM._objectsPaint && FBM._objectsPaint.pipet));
    if (eraser) eraser.classList.toggle("fbm-on", !!FBM._objectsUi.eraserOn);
    if (fog) fog.classList.toggle("fbm-on", !!FBM._objectsUi.fogOn);
    if (clear) {
      clear.classList.toggle("fbm-on", hasDrawingSelection());
      clear.disabled = !hasDrawingSelection();
    }
    const bar = $4("fbm-bar-objects");
    const panel = $4("fbm-objects");
    if (bar && panel) bar.classList.toggle("fbm-on", !panel.hidden);
  }
  FBM.refreshObjectsBuildUi = function() {
    const panel = $4("fbm-objects");
    if (!panel || panel.hidden) {
      renderTools();
      return;
    }
    const cat = currentCatalog();
    if (cat && !FBM._objectsUi.categoryId) {
      const sec = cat.sections[0];
      if (sec && sec.categories[0]) {
        FBM._objectsUi.sectionId = sec.id;
        FBM._objectsUi.categoryId = sec.categories[0].id;
      }
    }
    renderTree();
    renderGrid();
    renderExtended();
    renderRecent();
    renderTools();
  };
  FBM.openObjectsBuild = function() {
    FBM.ensureUi();
    FBM.installObjectsPaintHook && FBM.installObjectsPaintHook();
    FBM.installObjectsSelectionEscape && FBM.installObjectsSelectionEscape();
    FBM.prepareObjectsCatalog && FBM.prepareObjectsCatalog();
    FBM.loadObjectsState && FBM.loadObjectsState();
    const panel = $4("fbm-objects");
    if (!panel) return;
    panel.hidden = false;
    FBM._objectsUi.open = true;
    const ui = FBM.objectsState && FBM.objectsState.ui;
    if (ui) {
      if (ui.left != null) {
        panel.style.left = ui.left + "px";
        panel.style.top = (ui.top || 96) + "px";
        panel.style.transform = "none";
      }
      if (ui.width) panel.style.width = ui.width + "px";
      if (ui.height) panel.style.height = ui.height + "px";
      const body = $4("fbm-obj-body");
      if (body && ui.extWidth) body.style.setProperty("--fbm-obj-ext-w", ui.extWidth + "px");
    }
    FBM.bindObjectsBuildUi();
    FBM.refreshObjectsBuildUi();
    setStatus("Objects Build ready.");
  };
  FBM.closeObjectsBuild = function() {
    const panel = $4("fbm-objects");
    if (panel) panel.hidden = true;
    FBM._objectsUi.open = false;
    FBM.clearObjectsSelection();
  };
  FBM.toggleObjectsBuild = function() {
    const panel = $4("fbm-objects");
    if (panel && !panel.hidden) FBM.closeObjectsBuild();
    else FBM.openObjectsBuild();
  };
  FBM.bindObjectsBuildUi = function() {
    if (FBM._objectsUi.bound) return;
    FBM._objectsUi.bound = true;
    const panel = $4("fbm-objects");
    const header = $4("fbm-obj-header");
    const close = $4("fbm-obj-close");
    if (close) {
      close.addEventListener("click", function() {
        FBM.closeObjectsBuild();
      });
    }
    if (panel && header) {
      let ox = 0;
      let oy = 0;
      let dragging = false;
      header.addEventListener("pointerdown", function(e) {
        if (e.target.closest("button")) return;
        dragging = true;
        panel.style.transform = "none";
        const r = panel.getBoundingClientRect();
        ox = e.clientX - r.left;
        oy = e.clientY - r.top;
        header.setPointerCapture(e.pointerId);
      });
      header.addEventListener("pointermove", function(e) {
        if (!dragging) return;
        panel.style.left = Math.max(0, e.clientX - ox) + "px";
        panel.style.top = Math.max(0, e.clientY - oy) + "px";
      });
      header.addEventListener("pointerup", function() {
        dragging = false;
        if (!FBM.objectsState) FBM.loadObjectsState();
        const r = panel.getBoundingClientRect();
        FBM.objectsState.ui.left = Math.round(r.left);
        FBM.objectsState.ui.top = Math.round(r.top);
        FBM.objectsState.ui.width = Math.round(r.width);
        FBM.objectsState.ui.height = Math.round(r.height);
        FBM.saveObjectsState();
      });
    }
    const split = $4("fbm-obj-splitter");
    const body = $4("fbm-obj-body");
    if (split && body) {
      let dragging = false;
      split.addEventListener("pointerdown", function(e) {
        dragging = true;
        split.classList.add("fbm-on");
        split.setPointerCapture(e.pointerId);
      });
      split.addEventListener("pointermove", function(e) {
        if (!dragging) return;
        const r = body.getBoundingClientRect();
        const w = Math.min(Math.max(200, r.right - e.clientX), r.width - 168 - 6 - 180);
        body.style.setProperty("--fbm-obj-ext-w", w + "px");
      });
      split.addEventListener("pointerup", function() {
        dragging = false;
        split.classList.remove("fbm-on");
        if (!FBM.objectsState) FBM.loadObjectsState();
        const w = parseInt(getComputedStyle(body).getPropertyValue("--fbm-obj-ext-w"), 10);
        if (isFinite(w)) {
          FBM.objectsState.ui.extWidth = w;
          FBM.saveObjectsState();
        }
        renderRecent();
      });
    }
    const search = $4("fbm-obj-search");
    if (search) {
      search.addEventListener("input", function() {
        FBM._objectsUi.search = search.value || "";
        FBM.refreshObjectsBuildUi();
      });
    }
    const single = $4("fbm-obj-single");
    if (single) {
      single.addEventListener("click", function() {
        if (!FBM.objectsState) FBM.loadObjectsState();
        FBM.objectsState.singlePlace = !FBM.objectsState.singlePlace;
        FBM.saveObjectsState();
        if (FBM._objectsPaint && FBM._objectsPaint.armed) armSelection();
        FBM.refreshObjectsBuildUi();
      });
    }
    const clearBtn = $4("fbm-obj-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function() {
        FBM.clearObjectsSelection();
      });
    }
    const pipet = $4("fbm-obj-pipet");
    if (pipet) {
      pipet.addEventListener("click", function() {
        const on = !(FBM._objectsPaint && FBM._objectsPaint.pipet);
        FBM.objectsSetPipet(on);
        FBM._objectsUi.eraserOn = false;
        setStatus(on ? "Pipet on \u2014 click a map tile." : "Pipet off.");
        renderTools();
      });
    }
    const eraser = $4("fbm-obj-eraser");
    if (eraser) {
      eraser.addEventListener("click", function() {
        FBM._objectsUi.eraserOn = !FBM._objectsUi.eraserOn;
        if (FBM._objectsUi.eraserOn) {
          FBM.objectsArmEraser();
          FBM.objectsSetPipet(false);
          setStatus("Eraser on.");
        } else {
          FBM.objectsClearBrush();
          setStatus("Eraser off.");
        }
        renderTools();
      });
    }
    const fog = $4("fbm-obj-fog");
    if (fog) {
      fog.addEventListener("click", function() {
        FBM._objectsUi.fogOn = !!FBM.objectsToggleFog();
        setStatus("Fog " + (FBM._objectsUi.fogOn ? "on" : "off") + ".");
        renderTools();
      });
    }
    const undo = $4("fbm-obj-undo");
    if (undo) {
      undo.addEventListener("click", function() {
        FBM.objectsUndo();
        setStatus("Undo.");
      });
    }
    const editVar = $4("fbm-obj-edit-variant");
    if (editVar) {
      editVar.addEventListener("click", function() {
        const hit = FBM.findCatalogBase(FBM._objectsUi.baseId);
        const v = hit && findVariant(hit.base, FBM._objectsUi.variantId);
        if (!v || !v.custom) return;
        if (!FBM.promptText) return;
        FBM.promptText("Rename variant", {
          initial: v.name || "",
          confirmLabel: "Rename",
          maxlength: 40
        }).then(function(next) {
          if (next == null) return;
          const trimmed = String(next).trim().slice(0, 40);
          if (!trimmed) return;
          v.name = trimmed;
          FBM.saveCustomVariant(hit.base.id, v);
          FBM.refreshObjectsBuildUi();
          setStatus("Renamed to \u201C" + v.name + "\u201D.");
        });
      });
    }
    const delVar = $4("fbm-obj-del-variant");
    if (delVar) {
      delVar.addEventListener("click", function() {
        const hit = FBM.findCatalogBase(FBM._objectsUi.baseId);
        const v = hit && findVariant(hit.base, FBM._objectsUi.variantId);
        if (!v || !v.custom) return;
        if (!confirm("Delete custom variant \u201C" + v.name + "\u201D?")) return;
        FBM.deleteCustomVariant(hit.base.id, v.id);
        FBM._objectsUi.variantId = hit.base.variants[0] ? hit.base.variants[0].id : null;
        armSelection();
      });
    }
    const saveCat = $4("fbm-obj-save-cat");
    if (saveCat) {
      saveCat.addEventListener("click", function() {
        const payload = {
          objectsState: FBM.objectsState,
          catalogFingerprint: FBM._catalog && FBM._catalog.fingerprint,
          exportedAt: Date.now()
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "fbm-objects-catalog.json";
        a.click();
        URL.revokeObjectURL(a.href);
        setStatus("Exported Objects Build data.");
      });
    }
    const loadCat = $4("fbm-obj-load-cat");
    const loadFile = $4("fbm-obj-load-file");
    if (loadCat && loadFile) {
      loadCat.addEventListener("click", function() {
        loadFile.click();
      });
      loadFile.addEventListener("change", function() {
        const f = loadFile.files && loadFile.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = function() {
          try {
            const data = JSON.parse(String(reader.result || ""));
            if (data.objectsState) {
              FBM.objectsState = Object.assign(FBM.loadObjectsState(), data.objectsState);
              FBM.saveObjectsState();
            }
            FBM.prepareObjectsCatalog();
            FBM.refreshObjectsBuildUi();
            setStatus("Imported \u201C" + f.name + "\u201D.");
          } catch (e) {
            setStatus("Import failed.");
          }
          loadFile.value = "";
        };
        reader.readAsText(f);
      });
    }
    const settingsTool = $4("fbm-obj-settings-tool");
    if (settingsTool) {
      settingsTool.addEventListener("click", function() {
        if (FBM.toggleObjectSettingsPick) FBM.toggleObjectSettingsPick();
        else setStatus("Object Settings unavailable.");
      });
    }
  };
  FBM.objectsHandleMapClick = function(tile) {
    if (!FBM._objectsPaint || !FBM._objectsPaint.pipet) return false;
    const found = FBM.objectsPipetSample(tile.X, tile.Y);
    if (!found) return true;
    FBM._objectsUi.baseId = found.base.id;
    FBM._objectsUi.sectionId = found.section.id;
    FBM._objectsUi.categoryId = found.category.id;
    FBM._objectsUi.variantId = found.variant ? found.variant.id : found.base.variants[0] && found.base.variants[0].id;
    armSelection();
    return true;
  };

  // src/ui/objectSettings.ts
  function $5(id) {
    return document.getElementById(id);
  }
  function mapApi4() {
    if (typeof MapManager !== "undefined" && MapManager && MapManager.Map) return MapManager.Map;
    return null;
  }
  function defaultSize() {
    return typeof MapObjectDefaultSize === "number" ? MapObjectDefaultSize : 100;
  }
  function canCustomize(object) {
    if (typeof MapCanCustomizeObject === "function") return !!MapCanCustomizeObject(object);
    return object && object.CanBeCustomized !== false;
  }
  function canTransform(object) {
    if (typeof MapCanTransformObject === "function") return !!MapCanTransformObject(object);
    return object && !object.JoinsNeighbors && !object.CanPlaceOnWalls;
  }
  function colorableLayers(object) {
    if (typeof MapGetColorableLayers === "function") return MapGetColorableLayers(object) || [];
    return (object && object.Layers ? object.Layers : []).filter(function(L) {
      return L && L.IsColorable;
    });
  }
  function isTetherPoint(pos) {
    if (typeof ChatRoomMapViewIsTetherPoint === "function") return !!ChatRoomMapViewIsTetherPoint(pos);
    const map = mapApi4();
    if (!map || typeof map.getObjectConfig !== "function") return false;
    const cfg = map.getObjectConfig(pos.X, pos.Y);
    return !!(cfg && cfg.Type === "Tether");
  }
  function objectDisplayName(object) {
    if (typeof ChatRoomMapViewGetObjectDisplayName === "function") {
      try {
        return ChatRoomMapViewGetObjectDisplayName(object);
      } catch (e) {
      }
    }
    if (object && object.Name) return object.Name;
    if (object && object.Style) {
      return String(object.Style).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
    }
    return "Object";
  }
  function layerDisplayName(layer) {
    if (layer && layer.Name) return layer.Name;
    if (typeof TextGet === "function") {
      const t = TextGet("ObjectSettingsColor");
      if (t && t !== "ObjectSettingsColor") return t;
    }
    return "Color";
  }
  function parseHex(value) {
    let color = String(value || "").trim();
    if (!color.startsWith("#")) color = "#" + color;
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toUpperCase();
    return null;
  }
  function toStoredColors(layers, colors) {
    return layers.map(function(layer, i) {
      const color = (colors[i] || "").toUpperCase();
      const def = (layer.DefaultColor || "#FFFFFF").toUpperCase();
      return !color || color === def ? "Default" : color;
    });
  }
  function layerColorsResolved(pos, object) {
    if (typeof MapGetObjectLayerColors === "function") return MapGetObjectLayerColors(pos, object);
    const layers = colorableLayers(object);
    const map = mapApi4();
    const settings = map && typeof map.getObjectSettings === "function" ? map.getObjectSettings(pos.X, pos.Y) : null;
    const colors = settings && settings.Colors || [];
    return layers.map(function(layer, i) {
      const c = colors[i];
      return c && c !== "Default" ? c : layer.DefaultColor || "#FFFFFF";
    });
  }
  function tileIndex(X, Y) {
    if (typeof MapCoordinatesToIndex === "function") return MapCoordinatesToIndex(X, Y);
    const w = typeof ChatRoomMapViewWidth === "number" ? ChatRoomMapViewWidth : 40;
    return X + Y * w;
  }
  function syncMap() {
    const map = mapApi4();
    if (map && typeof map.updateGlobalMapData === "function") map.updateGlobalMapData();
    else if (FBM.pushMapRoomSync) FBM.pushMapRoomSync({ viaMapManager: true });
    if (FBM.markMapDirty) FBM.markMapDirty();
  }
  function setStatus2(msg) {
    const el = $5("fbm-objset-status");
    if (el) el.textContent = msg || "";
  }
  FBM._objectSettings = {
    pick: false,
    panelOpen: false,
    bound: false,
    pos: null,
    objectId: null,
    sliderChanging: false,
    color: {
      open: false,
      layerIndex: -1,
      original: [],
      current: [],
      eyedrop: false
    }
  };
  function hasObjectSettingsApi() {
    const map = mapApi4();
    return !!(map && typeof map.getObjectSettings === "function" && typeof map.setObjectSettings === "function");
  }
  function clearColorPreview() {
    if (typeof ChatRoomMapViewColorPreview !== "undefined") {
      try {
        ChatRoomMapViewColorPreview = null;
      } catch (e) {
      }
    }
  }
  function setColorPreview(pos, colors) {
    if (typeof ChatRoomMapViewColorPreview !== "undefined") {
      try {
        ChatRoomMapViewColorPreview = { Index: tileIndex(pos.X, pos.Y), Colors: colors.slice() };
        return true;
      } catch (e) {
      }
    }
    return false;
  }
  function livePreviewColors(pos, object, colors) {
    if (setColorPreview(pos, colors)) return;
    const map = mapApi4();
    if (!map) return;
    const stored = toStoredColors(colorableLayers(object), colors);
    map.setObjectSettings(pos.X, pos.Y, { Colors: stored }, false);
  }
  function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(h / 60 % 2 - 1));
    const m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) {
      r = c;
      g = x;
    } else if (h < 120) {
      r = x;
      g = c;
    } else if (h < 180) {
      g = c;
      b = x;
    } else if (h < 240) {
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    const toHex = function(n) {
      return Math.round((n + m) * 255).toString(16).toUpperCase().padStart(2, "0");
    };
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }
  function rgbToHsv(hex) {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
    if (!m) return { h: 0, s: 0, v: 1 };
    const n = parseInt(m[1], 16);
    const r = (n >> 16 & 255) / 255;
    const g = (n >> 8 & 255) / 255;
    const b = (n & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = (g - b) / d % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : d / max;
    return { h, s, v: max };
  }
  FBM.objectSettingsMarkup = function() {
    return '<div class="fbm-objset" id="fbm-objset" hidden><div class="fbm-objset-main"><div class="fbm-header" id="fbm-objset-header"><div class="fbm-header-title">Object Settings <span class="fbm-badge" id="fbm-objset-title">pick</span></div><button type="button" class="fbm-icon-btn" id="fbm-objset-close" title="Close">\xD7</button></div><div class="fbm-objset-body" id="fbm-objset-body"><p class="fbm-muted fbm-hint" id="fbm-objset-hint">Click a customizable object on the map.</p><div id="fbm-objset-controls" hidden></div></div><div class="fbm-objset-footer" id="fbm-objset-footer" hidden><button type="button" class="fbm-btn fbm-btn-accent" id="fbm-objset-save-variant" title="Save current look as an Objects Build custom variant">Save Variant</button></div><div class="fbm-objset-status" id="fbm-objset-status"></div></div><div class="fbm-colorpick" id="fbm-colorpick" hidden><div class="fbm-colorpick-head"><span id="fbm-colorpick-title">Color</span><button type="button" class="fbm-icon-btn" id="fbm-colorpick-close" title="Cancel">\xD7</button></div><div class="fbm-colorpick-body"><div class="fbm-colorpick-sv" id="fbm-colorpick-sv"><div class="fbm-colorpick-cursor" id="fbm-colorpick-cursor"></div></div><input type="range" id="fbm-colorpick-hue" class="fbm-colorpick-hue" min="0" max="360" value="0" /><div class="fbm-row"><div class="fbm-colorpick-swatch" id="fbm-colorpick-swatch"></div><input type="text" id="fbm-colorpick-hex" maxlength="7" spellcheck="false" autocomplete="off" /><button type="button" class="fbm-icon-btn" id="fbm-colorpick-eyedrop" title="Sample from map"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4.5l5 5M3 21l7.5-7.5M12 8l4 4M14 6l2-2a1.5 1.5 0 0 1 2 2l-2 2"/></svg></button></div><div class="fbm-row"><button type="button" class="fbm-btn" id="fbm-colorpick-cancel">Cancel</button><button type="button" class="fbm-btn fbm-btn-accent" id="fbm-colorpick-ok">Save (Enter)</button></div><p class="fbm-muted fbm-hint">Live preview while adjusting. Enter saves, Esc cancels.</p></div></div></div>';
  };
  FBM.refreshObjectSettingsToolUi = function() {
    const gear = $5("fbm-obj-settings-tool");
    if (gear) {
      gear.classList.toggle(
        "fbm-on",
        !!(FBM._objectSettings.pick || FBM._objectSettings.panelOpen || FBM._objectSettings.color.open)
      );
    }
  };
  FBM.openObjectSettingsPick = function() {
    if (!hasObjectSettingsApi()) {
      if (FBM.localMsg) FBM.localMsg("FBM: Object Settings need a newer Club map build.");
      return;
    }
    if (!FBM.mapIsAdmin || !FBM.mapIsAdmin()) {
      if (FBM.localMsg) FBM.localMsg("FBM: admin required.");
      return;
    }
    FBM.ensureUi();
    FBM.bindObjectSettingsUi();
    FBM._objectSettings.pick = true;
    FBM.closeObjectSettingsPanel(true);
    const panel = $5("fbm-objset");
    if (panel) {
      panel.hidden = false;
      FBM._objectSettings.panelOpen = true;
    }
    const hint = $5("fbm-objset-hint");
    const controls = $5("fbm-objset-controls");
    const title = $5("fbm-objset-title");
    const footer = $5("fbm-objset-footer");
    if (hint) {
      hint.hidden = false;
      hint.textContent = "Click a customizable object on the map.";
    }
    if (controls) {
      controls.hidden = true;
      controls.innerHTML = "";
    }
    if (footer) footer.hidden = true;
    if (title) title.textContent = "pick";
    setStatus2("Pick mode \u2014 click a map object.");
    FBM.refreshObjectSettingsToolUi();
  };
  FBM.closeObjectSettingsPick = function() {
    FBM._objectSettings.pick = false;
    FBM.closeColorPicker(false);
    FBM.closeObjectSettingsPanel(false);
    FBM.refreshObjectSettingsToolUi();
  };
  FBM.toggleObjectSettingsPick = function() {
    if (FBM._objectSettings.pick || FBM._objectSettings.panelOpen) FBM.closeObjectSettingsPick();
    else FBM.openObjectSettingsPick();
  };
  FBM.closeObjectSettingsPanel = function(keepPick) {
    clearColorPreview();
    FBM.closeColorPicker(false);
    const panel = $5("fbm-objset");
    if (panel && !keepPick) panel.hidden = true;
    if (!keepPick) FBM._objectSettings.panelOpen = false;
    FBM._objectSettings.pos = null;
    FBM._objectSettings.objectId = null;
    const footer = $5("fbm-objset-footer");
    if (footer && !keepPick) footer.hidden = true;
    FBM.refreshObjectSettingsToolUi();
  };
  FBM.objectSettingsHandleMapClick = function(tile) {
    if (FBM._objectSettings.color.eyedrop) {
      FBM.sampleColorFromMapClick(tile);
      return true;
    }
    if (!FBM._objectSettings.pick && !FBM._objectSettings.panelOpen) return false;
    if (!hasObjectSettingsApi()) return true;
    const map = mapApi4();
    if (!map) return true;
    const blank = typeof ChatRoomMapViewObjectStartID === "number" ? ChatRoomMapViewObjectStartID : 100;
    const objectId = typeof map.getObjectId === "function" ? map.getObjectId(tile.X, tile.Y) : null;
    if (objectId == null || objectId <= blank) {
      setStatus2("No object on that tile.");
      return true;
    }
    const object = typeof MapDataGetObject === "function" ? MapDataGetObject(objectId) : typeof MapGetDoodad === "function" ? MapGetDoodad("Object", objectId) : null;
    if (!object || !canCustomize(object)) {
      setStatus2("That object cannot be customized.");
      return true;
    }
    FBM.openObjectSettingsFor(tile, objectId, object);
    return true;
  };
  FBM.openObjectSettingsFor = function(pos, objectId, object) {
    FBM.ensureUi();
    FBM.bindObjectSettingsUi();
    FBM._objectSettings.pick = false;
    FBM._objectSettings.pos = { X: pos.X, Y: pos.Y };
    FBM._objectSettings.objectId = objectId;
    FBM._objectSettings.panelOpen = true;
    const panel = $5("fbm-objset");
    if (panel) panel.hidden = false;
    const hint = $5("fbm-objset-hint");
    if (hint) hint.hidden = true;
    const title = $5("fbm-objset-title");
    if (title) title.textContent = objectDisplayName(object);
    const footer = $5("fbm-objset-footer");
    if (footer) footer.hidden = false;
    FBM.renderObjectSettingsControls(pos, object);
    setStatus2("Editing \u201C" + objectDisplayName(object) + "\u201D at " + pos.X + "," + pos.Y + ".");
    FBM.refreshObjectSettingsToolUi();
  };
  function findCatalogHitForObjectId(objectId) {
    if (FBM.prepareObjectsCatalog) FBM.prepareObjectsCatalog();
    const cat = FBM.getCatalog && FBM.getCatalog();
    if (!cat) return null;
    let found = null;
    cat.sections.forEach(function(sec) {
      sec.categories.forEach(function(c) {
        (c.bases || []).forEach(function(b) {
          if (found || b.kind !== "object") return;
          const v = (b.variants || []).find(function(x) {
            return x.clubId === objectId;
          });
          if (v || b.clubId === objectId) found = { base: b, section: sec, category: c, variant: v };
        });
      });
    });
    return found;
  }
  FBM.saveObjectSettingsAsVariant = function() {
    const st = FBM._objectSettings;
    if (!st.pos || st.objectId == null) {
      setStatus2("Pick an object first.");
      return;
    }
    const map = mapApi4();
    if (!map) return;
    const found = findCatalogHitForObjectId(st.objectId);
    if (!found || !found.base) {
      setStatus2("No Objects Build catalog match for this object.");
      return;
    }
    if (!found.base.canCustomize) {
      setStatus2("That catalog item is baked \u2014 variants come from Style.");
      return;
    }
    const settings = typeof map.getObjectSettings === "function" ? map.getObjectSettings(st.pos.X, st.pos.Y) : null;
    const tileId = typeof map.getTileId === "function" ? map.getTileId(st.pos.X, st.pos.Y) : null;
    if (!FBM.promptText) {
      setStatus2("Save variant unavailable.");
      return;
    }
    FBM.promptText("Save current look as variant name?", {
      initial: "Custom",
      confirmLabel: "Save",
      maxlength: 40
    }).then(function(name) {
      if (name == null || !String(name).trim()) {
        setStatus2("Save variant cancelled.");
        return;
      }
      const thumb = FBM.snapshotObjectVariantThumb && FBM.snapshotObjectVariantThumb({
        X: st.pos.X,
        Y: st.pos.Y,
        tileId,
        objectId: st.objectId,
        settings,
        size: 96
      });
      const variant = {
        id: "custom-" + Date.now().toString(36),
        name: String(name).trim().slice(0, 40),
        clubId: st.objectId,
        style: found.base.style,
        colors: settings && Array.isArray(settings.Colors) ? settings.Colors.slice() : [],
        rotation: settings && settings.Rotation || 0,
        size: settings && settings.Size || defaultSize(),
        thumbUrl: thumb || "",
        custom: true
      };
      FBM.saveCustomVariant(found.base.id, variant);
      if (FBM._objectsUi) {
        FBM._objectsUi.baseId = found.base.id;
        FBM._objectsUi.sectionId = found.section.id;
        FBM._objectsUi.categoryId = found.category.id;
        FBM._objectsUi.variantId = variant.id;
      }
      if (FBM.refreshObjectsBuildUi) FBM.refreshObjectsBuildUi();
      setStatus2("Saved variant \u201C" + variant.name + "\u201D.");
      if (FBM.localMsg) FBM.localMsg("FBM: saved variant \u201C" + variant.name + "\u201D.");
    });
  };
  FBM.renderObjectSettingsControls = function(pos, object) {
    const box = $5("fbm-objset-controls");
    if (!box) return;
    box.hidden = false;
    box.innerHTML = "";
    const map = mapApi4();
    if (!map) return;
    const settings = typeof map.getObjectSettings === "function" ? map.getObjectSettings(pos.X, pos.Y) : null;
    if (canTransform(object)) {
      const rot = settings && settings.Rotation != null ? settings.Rotation : 0;
      const size = settings && settings.Size != null ? settings.Size : defaultSize();
      box.appendChild(FBM.makeObjSetSlider(pos, "Rotation", 0, 359, rot));
      box.appendChild(FBM.makeObjSetSlider(pos, "Size", 50, 200, size));
      const resetRow = document.createElement("div");
      resetRow.className = "fbm-row";
      const resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "fbm-btn";
      resetBtn.textContent = "Reset rotation / size";
      resetBtn.addEventListener("click", function() {
        map.setObjectSettings(pos.X, pos.Y, { Rotation: 0, Size: defaultSize() });
        syncMap();
        FBM.renderObjectSettingsControls(pos, object);
      });
      resetRow.appendChild(resetBtn);
      box.appendChild(resetRow);
    }
    if (object.CanBeTetherPoint) {
      const row = document.createElement("label");
      row.className = "fbm-check-row";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isTetherPoint(pos);
      cb.addEventListener("change", function() {
        if (typeof map.setObjectConfig === "function") {
          map.setObjectConfig(pos.X, pos.Y, cb.checked ? { Type: "Tether" } : void 0);
          syncMap();
        }
      });
      const span = document.createElement("span");
      span.textContent = "Tether point";
      row.appendChild(cb);
      row.appendChild(span);
      box.appendChild(row);
    }
    const layers = colorableLayers(object);
    if (layers.length) {
      const head = document.createElement("div");
      head.className = "fbm-section-head";
      head.textContent = "Colors";
      box.appendChild(head);
      const colors = layerColorsResolved(pos, object);
      layers.forEach(function(layer, i) {
        const row = document.createElement("div");
        row.className = "fbm-objset-layer-row";
        const name = document.createElement("span");
        name.className = "fbm-muted";
        name.textContent = layerDisplayName(layer);
        const sw = document.createElement("button");
        sw.type = "button";
        sw.className = "fbm-objset-swatch";
        sw.style.backgroundColor = colors[i];
        sw.title = "Edit " + layerDisplayName(layer);
        sw.addEventListener("click", function() {
          FBM.openColorPicker(pos, object, i);
        });
        const hex = document.createElement("input");
        hex.type = "text";
        hex.maxLength = 7;
        hex.value = colors[i];
        hex.spellcheck = false;
        hex.autocomplete = "off";
        hex.addEventListener("change", function() {
          const parsed = parseHex(hex.value);
          if (!parsed) {
            hex.value = colors[i];
            return;
          }
          const next = layerColorsResolved(pos, object).slice();
          next[i] = parsed;
          map.setObjectSettings(pos.X, pos.Y, { Colors: toStoredColors(layers, next) });
          syncMap();
          FBM.renderObjectSettingsControls(pos, object);
        });
        row.appendChild(name);
        row.appendChild(sw);
        row.appendChild(hex);
        box.appendChild(row);
      });
      const colorBtns = document.createElement("div");
      colorBtns.className = "fbm-row";
      const resetColors = document.createElement("button");
      resetColors.type = "button";
      resetColors.className = "fbm-btn";
      resetColors.textContent = "Reset colors";
      resetColors.addEventListener("click", function() {
        map.setObjectSettings(pos.X, pos.Y, {
          Colors: layers.map(function() {
            return "Default";
          })
        });
        syncMap();
        FBM.renderObjectSettingsControls(pos, object);
      });
      colorBtns.appendChild(resetColors);
      box.appendChild(colorBtns);
    }
    if (object.DecalArea && typeof AssetGetDecals === "function") {
      const head = document.createElement("div");
      head.className = "fbm-section-head";
      head.textContent = "Decal";
      box.appendChild(head);
      const row = document.createElement("div");
      row.className = "fbm-row";
      const select = document.createElement("select");
      const none = document.createElement("option");
      none.value = "";
      none.textContent = "None";
      select.appendChild(none);
      AssetGetDecals().forEach(function(d) {
        const opt = document.createElement("option");
        opt.value = d.Name;
        opt.textContent = d.Description || d.Name;
        select.appendChild(opt);
      });
      select.value = settings && settings.Decal || "";
      select.addEventListener("change", function() {
        const decal = select.value || void 0;
        map.setObjectSettings(pos.X, pos.Y, { Decal: decal, DecalColor: decal ? settings && settings.DecalColor : void 0 });
        syncMap();
        FBM.renderObjectSettingsControls(pos, object);
      });
      row.appendChild(select);
      box.appendChild(row);
      if (settings && settings.Decal) {
        const dRow = document.createElement("div");
        dRow.className = "fbm-objset-layer-row";
        const dName = document.createElement("span");
        dName.className = "fbm-muted";
        dName.textContent = "Decal color";
        const dSw = document.createElement("button");
        dSw.type = "button";
        dSw.className = "fbm-objset-swatch";
        const dColor = settings.DecalColor || "#FFFFFF";
        dSw.style.backgroundColor = dColor;
        dSw.addEventListener("click", function() {
          FBM.openDecalColorPicker(pos, object, dColor);
        });
        dRow.appendChild(dName);
        dRow.appendChild(dSw);
        box.appendChild(dRow);
      }
    }
  };
  FBM.makeObjSetSlider = function(pos, key, min, max, value) {
    const wrap = document.createElement("label");
    wrap.className = "fbm-objset-slider";
    const lab = document.createElement("span");
    lab.textContent = key;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.value = String(value);
    const out = document.createElement("span");
    out.className = "fbm-muted";
    out.textContent = String(value);
    input.addEventListener("input", function() {
      const map = mapApi4();
      if (!map) return;
      const n = Number(input.value);
      out.textContent = String(n);
      const changes = {};
      changes[key] = n;
      map.setObjectSettings(pos.X, pos.Y, changes, !FBM._objectSettings.sliderChanging);
      FBM._objectSettings.sliderChanging = true;
    });
    input.addEventListener("change", function() {
      FBM._objectSettings.sliderChanging = false;
      syncMap();
    });
    wrap.appendChild(lab);
    wrap.appendChild(input);
    wrap.appendChild(out);
    return wrap;
  };
  FBM.openColorPicker = function(pos, object, layerIndex) {
    const layers = colorableLayers(object);
    const colors = layerColorsResolved(pos, object);
    FBM._objectSettings.color.open = true;
    FBM._objectSettings.color.layerIndex = layerIndex;
    FBM._objectSettings.color.original = colors.slice();
    FBM._objectSettings.color.current = colors.slice();
    FBM._objectSettings.color.eyedrop = false;
    const pick = $5("fbm-colorpick");
    if (pick) pick.hidden = false;
    const title = $5("fbm-colorpick-title");
    if (title) title.textContent = objectDisplayName(object) + " \u2014 " + layerDisplayName(layers[layerIndex]);
    FBM.setColorPickerUI(colors[layerIndex]);
    livePreviewColors(pos, object, colors);
    FBM.refreshObjectSettingsToolUi();
  };
  FBM.openDecalColorPicker = function(pos, object, color) {
    FBM._objectSettings.color.open = true;
    FBM._objectSettings.color.layerIndex = -2;
    FBM._objectSettings.color.original = [color];
    FBM._objectSettings.color.current = [color];
    FBM._objectSettings.color.eyedrop = false;
    const pick = $5("fbm-colorpick");
    if (pick) pick.hidden = false;
    const title = $5("fbm-colorpick-title");
    if (title) title.textContent = objectDisplayName(object) + " \u2014 Decal";
    FBM.setColorPickerUI(color);
    FBM.refreshObjectSettingsToolUi();
  };
  FBM.setColorPickerUI = function(hex) {
    const hsv = rgbToHsv(hex);
    const hue = $5("fbm-colorpick-hue");
    const hexEl = $5("fbm-colorpick-hex");
    const sw = $5("fbm-colorpick-swatch");
    const sv = $5("fbm-colorpick-sv");
    const cur = $5("fbm-colorpick-cursor");
    if (hue) hue.value = String(Math.round(hsv.h));
    if (hexEl) hexEl.value = hex.toUpperCase();
    if (sw) sw.style.backgroundColor = hex;
    if (sv) sv.style.backgroundColor = hsvToRgb(hsv.h, 1, 1);
    if (cur) {
      cur.style.left = hsv.s * 100 + "%";
      cur.style.top = (1 - hsv.v) * 100 + "%";
    }
  };
  FBM.applyLiveColorFromPicker = function() {
    const st = FBM._objectSettings;
    if (!st.color.open || !st.pos || st.objectId == null) return;
    const map = mapApi4();
    if (!map) return;
    const object = typeof MapDataGetObject === "function" ? MapDataGetObject(st.objectId) : typeof MapGetDoodad === "function" ? MapGetDoodad("Object", st.objectId) : null;
    if (!object) return;
    const hexEl = $5("fbm-colorpick-hex");
    const hex = parseHex(hexEl && hexEl.value || "") || st.color.current[0];
    if (st.color.layerIndex === -2) {
      st.color.current[0] = hex;
      map.setObjectSettings(st.pos.X, st.pos.Y, { DecalColor: hex }, false);
      return;
    }
    const colors = st.color.current.slice();
    colors[st.color.layerIndex] = hex;
    st.color.current = colors;
    livePreviewColors(st.pos, object, colors);
  };
  FBM.commitColorPicker = function() {
    const st = FBM._objectSettings;
    if (!st.color.open || !st.pos || st.objectId == null) return;
    const map = mapApi4();
    if (!map) return;
    const object = typeof MapDataGetObject === "function" ? MapDataGetObject(st.objectId) : typeof MapGetDoodad === "function" ? MapGetDoodad("Object", st.objectId) : null;
    if (!object) return;
    const hexEl = $5("fbm-colorpick-hex");
    const hex = parseHex(hexEl && hexEl.value || "") || st.color.current[Math.max(0, st.color.layerIndex)];
    if (st.color.layerIndex === -2) {
      map.setObjectSettings(st.pos.X, st.pos.Y, { DecalColor: hex });
      syncMap();
      FBM.closeColorPicker(true);
      FBM.renderObjectSettingsControls(st.pos, object);
      return;
    }
    const colors = st.color.current.slice();
    colors[st.color.layerIndex] = hex;
    clearColorPreview();
    map.setObjectSettings(st.pos.X, st.pos.Y, { Colors: toStoredColors(colorableLayers(object), colors) });
    syncMap();
    FBM.closeColorPicker(true);
    FBM.renderObjectSettingsControls(st.pos, object);
    setStatus2("Color saved.");
  };
  FBM.closeColorPicker = function(keep) {
    const st = FBM._objectSettings;
    if (!st.color.open) return;
    clearColorPreview();
    if (!keep && st.pos && st.objectId != null) {
      const map = mapApi4();
      const object = typeof MapDataGetObject === "function" ? MapDataGetObject(st.objectId) : typeof MapGetDoodad === "function" ? MapGetDoodad("Object", st.objectId) : null;
      const usedPreviewGlobal = typeof ChatRoomMapViewColorPreview !== "undefined";
      if (map && object && st.color.layerIndex >= 0 && !usedPreviewGlobal) {
        map.setObjectSettings(st.pos.X, st.pos.Y, {
          Colors: toStoredColors(colorableLayers(object), st.color.original)
        }, false);
      }
      if (map && object && st.color.layerIndex === -2) {
        map.setObjectSettings(
          st.pos.X,
          st.pos.Y,
          { DecalColor: st.color.original[0] === "#FFFFFF" ? void 0 : st.color.original[0] },
          false
        );
      }
    }
    st.color.open = false;
    st.color.eyedrop = false;
    st.color.layerIndex = -1;
    const pick = $5("fbm-colorpick");
    if (pick) pick.hidden = true;
    document.body.classList.remove("fbm-eyedrop-cursor");
    FBM.refreshObjectSettingsToolUi();
  };
  FBM.sampleColorFromMapClick = function(_tile) {
    const el = typeof FBM.getMainCanvasEl === "function" ? FBM.getMainCanvasEl() : document.getElementById("MainCanvas");
    if (!el || !el.getContext) {
      FBM._objectSettings.color.eyedrop = false;
      document.body.classList.remove("fbm-eyedrop-cursor");
      return;
    }
    const canvas = el;
    const clubW = 2e3;
    const clubH = 1e3;
    const mx = typeof MouseX === "number" ? MouseX : 500;
    const my = typeof MouseY === "number" ? MouseY : 500;
    const px = Math.max(0, Math.min(canvas.width - 1, Math.floor(mx / clubW * canvas.width)));
    const py = Math.max(0, Math.min(canvas.height - 1, Math.floor(my / clubH * canvas.height)));
    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const data = ctx.getImageData(px, py, 1, 1).data;
      const hex = "#" + [data[0], data[1], data[2]].map(function(n) {
        return n.toString(16).toUpperCase().padStart(2, "0");
      }).join("");
      FBM.setColorPickerUI(hex);
      const hexEl = $5("fbm-colorpick-hex");
      if (hexEl) hexEl.value = hex;
      FBM.applyLiveColorFromPicker();
      setStatus2("Sampled " + hex + ".");
    } catch (e) {
      setStatus2("Could not sample canvas pixel.");
    }
    FBM._objectSettings.color.eyedrop = false;
    document.body.classList.remove("fbm-eyedrop-cursor");
  };
  FBM.bindObjectSettingsUi = function() {
    if (FBM._objectSettings.bound) return;
    FBM._objectSettings.bound = true;
    const panel = $5("fbm-objset");
    const header = $5("fbm-objset-header");
    const close = $5("fbm-objset-close");
    if (close) {
      close.addEventListener("click", function() {
        FBM.closeObjectSettingsPick();
      });
    }
    const saveVar = $5("fbm-objset-save-variant");
    if (saveVar) {
      saveVar.addEventListener("click", function() {
        FBM.saveObjectSettingsAsVariant();
      });
    }
    if (panel && header) {
      let dragging = false;
      let ox = 0;
      let oy = 0;
      header.addEventListener("pointerdown", function(e) {
        if (e.target.closest("button")) return;
        dragging = true;
        panel.style.transform = "none";
        const r = panel.getBoundingClientRect();
        ox = e.clientX - r.left;
        oy = e.clientY - r.top;
        header.setPointerCapture(e.pointerId);
      });
      header.addEventListener("pointermove", function(e) {
        if (!dragging) return;
        panel.style.left = Math.max(0, e.clientX - ox) + "px";
        panel.style.top = Math.max(0, e.clientY - oy) + "px";
      });
      header.addEventListener("pointerup", function() {
        dragging = false;
      });
    }
    const cancel = $5("fbm-colorpick-cancel");
    const ok = $5("fbm-colorpick-ok");
    const closePick = $5("fbm-colorpick-close");
    if (cancel) cancel.addEventListener("click", function() {
      FBM.closeColorPicker(false);
    });
    if (closePick) closePick.addEventListener("click", function() {
      FBM.closeColorPicker(false);
    });
    if (ok) ok.addEventListener("click", function() {
      FBM.commitColorPicker();
    });
    const hue = $5("fbm-colorpick-hue");
    const hex = $5("fbm-colorpick-hex");
    const sv = $5("fbm-colorpick-sv");
    if (hue) {
      hue.addEventListener("input", function() {
        const curHex = parseHex(hex && hex.value || "#FFFFFF") || "#FFFFFF";
        const hsv = rgbToHsv(curHex);
        hsv.h = Number(hue.value);
        const next = hsvToRgb(hsv.h, hsv.s, hsv.v);
        FBM.setColorPickerUI(next);
        if (hex) hex.value = next;
        FBM.applyLiveColorFromPicker();
      });
    }
    if (hex) {
      hex.addEventListener("input", function() {
        const parsed = parseHex(hex.value);
        if (!parsed) return;
        FBM.setColorPickerUI(parsed);
        FBM.applyLiveColorFromPicker();
      });
    }
    if (sv) {
      const pickSv = function(e) {
        const r = sv.getBoundingClientRect();
        const s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const v = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        const h = Number(hue && hue.value || 0);
        const next = hsvToRgb(h, s, v);
        FBM.setColorPickerUI(next);
        if (hex) hex.value = next;
        FBM.applyLiveColorFromPicker();
      };
      let dragging = false;
      sv.addEventListener("pointerdown", function(e) {
        dragging = true;
        sv.setPointerCapture(e.pointerId);
        pickSv(e);
      });
      sv.addEventListener("pointermove", function(e) {
        if (dragging) pickSv(e);
      });
      sv.addEventListener("pointerup", function() {
        dragging = false;
      });
    }
    const eye = $5("fbm-colorpick-eyedrop");
    if (eye) {
      eye.addEventListener("click", function() {
        FBM._objectSettings.color.eyedrop = !FBM._objectSettings.color.eyedrop;
        document.body.classList.toggle("fbm-eyedrop-cursor", FBM._objectSettings.color.eyedrop);
        setStatus2(FBM._objectSettings.color.eyedrop ? "Click the map to sample a color." : "Eyedropper off.");
      });
    }
    document.addEventListener(
      "keydown",
      function(e) {
        if (!FBM._objectSettings.color.open && !FBM._objectSettings.panelOpen) return;
        if (e.key === "Enter" && FBM._objectSettings.color.open) {
          e.preventDefault();
          FBM.commitColorPicker();
        }
        if (e.key === "Escape") {
          if (FBM._objectSettings.color.eyedrop) {
            FBM._objectSettings.color.eyedrop = false;
            document.body.classList.remove("fbm-eyedrop-cursor");
            e.preventDefault();
            return;
          }
          if (FBM._objectSettings.color.open) {
            FBM.closeColorPicker(false);
            e.preventDefault();
            return;
          }
          if (FBM._objectSettings.panelOpen) {
            FBM.closeObjectSettingsPick();
            e.preventDefault();
          }
        }
      },
      true
    );
  };

  // src/ui/floatableChat.ts
  var LOG_CAP = 400;
  var SEIDR_HIGHLIGHT = "#d4a017";
  var mirroredClubDivs = /* @__PURE__ */ new WeakSet();
  var fcMsgSeq = 0;
  var mutedExactMessages = /* @__PURE__ */ new Set();
  var DEFAULT_CUSTOM_CSS = `#fbm-float-chat {
  --fbm-fc-bg: rgba(28, 22, 38, 0.96);
  --fbm-fc-surface: rgba(42, 34, 56, 0.95);
  --fbm-fc-text: #f0e6d4;
  --fbm-fc-muted: #a898b0;
  --fbm-fc-accent: #d4a017;
  --fbm-fc-border: rgba(255, 255, 255, 0.12);
}`;
  var BUILTIN_IMAGE_HOSTS = [
    "cdn.discordapp.com",
    "media.discordapp.com",
    "i.imgur.com",
    "tenor.com",
    "c.tenor.com",
    "media.tenor.com",
    "i.redd.it",
    "puu.sh",
    "fs.kinkop.eu",
    "bondageprojects.elementfx.com",
    "www.bondageprojects.elementfx.com",
    "bondage-europe.com",
    "www.bondage-europe.com",
    "bondage-asia.com",
    "www.bondage-asia.com",
    "bondageprojects.com",
    "www.bondageprojects.com"
  ];
  var sessionTrustedOrigins = /* @__PURE__ */ new Map();
  var TARGET_STRIP_RE = /^\/(beep|whisper|w)\s+\S+\s?/iu;
  var floatReplyState = null;
  var whisperAvatarMn = null;
  function $6(id) {
    return document.getElementById(id);
  }
  function inputEl2(id) {
    return document.getElementById(id);
  }
  function selectEl2(id) {
    return document.getElementById(id);
  }
  function buttonEl2(id) {
    return document.getElementById(id);
  }
  function fcCfg() {
    if (!FBM.settings) FBM.loadSettings();
    if (!FBM.settings.floatChat) {
      FBM.settings.floatChat = JSON.parse(
        JSON.stringify(FBM.DEFAULT_SETTINGS && FBM.DEFAULT_SETTINGS.floatChat || {})
      );
    }
    return FBM.settings.floatChat;
  }
  function parseHttpUrl(word) {
    let w = word;
    const wrapped = /^\((.+)\)$/.exec(w);
    if (wrapped) w = wrapped[1];
    try {
      const url = new URL(w);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return url;
    } catch (e) {
      return null;
    }
  }
  function isBuiltinImageHost(host) {
    return BUILTIN_IMAGE_HOSTS.indexOf(host) >= 0;
  }
  function permanentTrustedOrigins() {
    const list = fcCfg().trustedHosts;
    return Array.isArray(list) ? list : [];
  }
  function isOriginTrusted(origin, host) {
    if (isBuiltinImageHost(host)) return true;
    if (sessionTrustedOrigins.get(origin) === "allowed") return true;
    const perm = permanentTrustedOrigins();
    for (let i = 0; i < perm.length; i++) {
      if (perm[i] === origin) return true;
    }
    return false;
  }
  function embedKindForUrl(url) {
    if (!/\/[^/]+\.(png|jpe?g|webp|gif)$/i.test(url.pathname)) return "none";
    return isOriginTrusted(url.origin, url.host) ? "img" : "untrusted";
  }
  function ownHighlightColor() {
    const cfg = fcCfg();
    if (cfg.ownHighlightSeidr !== false) return SEIDR_HIGHLIGHT;
    const c = String(cfg.ownHighlightColor || "").trim();
    return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(c) ? c : SEIDR_HIGHLIGHT;
  }
  function playerDefaultOwnNames() {
    const out = [];
    try {
      if (typeof Player !== "undefined" && Player) {
        const nick = Player.Nickname && String(Player.Nickname).trim() ? String(Player.Nickname).trim() : "";
        const name = Player.Name && String(Player.Name).trim() ? String(Player.Name).trim() : "";
        if (nick) out.push(nick);
        if (name && out.indexOf(name) < 0) out.push(name);
      }
    } catch (e) {
    }
    return out;
  }
  function ownNamePatterns() {
    const cfg = fcCfg();
    if (!cfg.highlightOwn) return [];
    const list = Array.isArray(cfg.ownNames) ? cfg.ownNames : [];
    const cleaned = list.map(function(s) {
      return String(s || "").trim();
    }).filter(Boolean);
    return cleaned.length ? cleaned : playerDefaultOwnNames();
  }
  function otherRoomNamePatterns() {
    const cfg = fcCfg();
    if (!cfg.highlightOthers) return [];
    const selfMn = typeof Player !== "undefined" && Player && Player.MemberNumber != null ? Player.MemberNumber : null;
    const out = [];
    const seen = {};
    const push = function(s) {
      const t = String(s || "").trim();
      if (!t || t.length < 2) return;
      const key = t.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      out.push(t);
    };
    try {
      if (typeof ChatRoomCharacter !== "undefined" && Array.isArray(ChatRoomCharacter)) {
        for (let i = 0; i < ChatRoomCharacter.length; i++) {
          const C = ChatRoomCharacter[i];
          if (!C || selfMn != null && C.MemberNumber === selfMn) continue;
          if (C.Nickname) push(String(C.Nickname));
          if (C.Name) push(String(C.Name));
        }
      }
    } catch (e) {
    }
    return out;
  }
  function bodyHighlightEntries() {
    const own = ownNamePatterns();
    const others = otherRoomNamePatterns();
    const ownKeys = {};
    for (let i = 0; i < own.length; i++) ownKeys[own[i].toLowerCase()] = true;
    const entries = [];
    for (let i = 0; i < own.length; i++) entries.push({ name: own[i], kind: "own" });
    for (let i = 0; i < others.length; i++) {
      if (ownKeys[others[i].toLowerCase()]) continue;
      entries.push({ name: others[i], kind: "other" });
    }
    entries.sort(function(a, b) {
      return b.name.length - a.name.length;
    });
    return entries;
  }
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function appendHighlightedText(parent, text) {
    const entries = bodyHighlightEntries();
    if (!entries.length || !text) {
      parent.appendChild(document.createTextNode(text || ""));
      return;
    }
    let re;
    try {
      re = new RegExp(
        "\\b(" + entries.map(function(e) {
          return escapeRegExp(e.name);
        }).join("|") + ")\\b",
        "gi"
      );
    } catch (e) {
      parent.appendChild(document.createTextNode(text));
      return;
    }
    const ownColor = ownHighlightColor();
    const kindFor = function(matched) {
      const key = matched.toLowerCase();
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].name.toLowerCase() === key) return entries[i].kind;
      }
      return "own";
    };
    let last = 0;
    let m;
    re.lastIndex = 0;
    while (m = re.exec(text)) {
      if (m.index > last) {
        parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      }
      const kind = kindFor(m[0]);
      const mark = document.createElement("span");
      mark.className = kind === "other" ? "fbm-fc-hl-other" : "fbm-fc-hl-own";
      mark.style.color = kind === "other" ? SEIDR_HIGHLIGHT : ownColor;
      mark.textContent = m[0];
      parent.appendChild(mark);
      last = m.index + m[0].length;
      if (m[0].length === 0) {
        re.lastIndex++;
        if (re.lastIndex > text.length) break;
      }
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }
  function scrollFloatLogIfNeeded(wasAtEnd) {
    const log = $6("fbm-fc-log");
    if (log && wasAtEnd) log.scrollTop = log.scrollHeight;
  }
  FBM.trustFloatChatOrigin = function(origin, permanent) {
    if (!origin) return;
    sessionTrustedOrigins.set(origin, "allowed");
    if (permanent) {
      const cfg = fcCfg();
      const list = Array.isArray(cfg.trustedHosts) ? cfg.trustedHosts.slice() : [];
      if (list.indexOf(origin) < 0) list.push(origin);
      cfg.trustedHosts = list;
      FBM.saveSettings();
      FBM.refreshTrustedHostsUi();
      FBM.setStatus("Trusted " + origin + " permanently.");
    } else {
      FBM.setStatus("Trusted " + origin + " for this session.");
    }
    FBM.reaugmentFloatChatLog();
  };
  FBM.addTrustedHost = function(origin) {
    const cfg = fcCfg();
    const list = Array.isArray(cfg.trustedHosts) ? cfg.trustedHosts.slice() : [];
    if (list.indexOf(origin) < 0) list.push(origin);
    cfg.trustedHosts = list;
    sessionTrustedOrigins.set(origin, "allowed");
    FBM.saveSettings();
  };
  FBM.removeTrustedHost = function(origin) {
    const cfg = fcCfg();
    cfg.trustedHosts = (Array.isArray(cfg.trustedHosts) ? cfg.trustedHosts : []).filter(function(h) {
      return h !== origin;
    });
    sessionTrustedOrigins.delete(origin);
    FBM.saveSettings();
    FBM.refreshTrustedHostsUi();
    FBM.reaugmentFloatChatLog();
  };
  FBM.refreshTrustedHostsUi = function() {
    const listEl = $6("fbm-trusted-host-list");
    const empty = $6("fbm-trusted-host-empty");
    if (!listEl) return;
    listEl.innerHTML = "";
    const hosts = permanentTrustedOrigins();
    if (empty) empty.hidden = hosts.length > 0;
    for (let i = 0; i < hosts.length; i++) {
      const origin = hosts[i];
      const row = document.createElement("div");
      row.className = "fbm-map-item";
      const span = document.createElement("span");
      span.textContent = origin;
      span.title = origin;
      const del = document.createElement("button");
      del.type = "button";
      del.className = "fbm-btn fbm-btn-danger";
      del.textContent = "Delete";
      del.addEventListener("click", function() {
        FBM.removeTrustedHost(origin);
        FBM.setStatus("Removed trusted host.");
      });
      row.appendChild(span);
      row.appendChild(del);
      listEl.appendChild(row);
    }
  };
  function fillMessageBodyContent(bodyEl, text, wasAtEnd) {
    bodyEl.textContent = "";
    const words = [text || ""];
    for (let i = 0; i < words.length; i++) {
      const ws = words[i].search(/[\s\r\n]/);
      if (ws >= 1) {
        words.splice(i + 1, 0, words[i].substring(ws));
        words[i] = words[i].substring(0, ws);
      } else if (ws === 0) {
        words.splice(i + 1, 0, words[i].substring(1));
        words[i] = words[i].charAt(0);
        bodyEl.appendChild(document.createTextNode(words[i]));
        continue;
      }
      const url = parseHttpUrl(words[i]);
      if (url) {
        const link = document.createElement("a");
        link.href = url.href;
        link.title = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        const kind = embedKindForUrl(url);
        if (kind === "img") {
          const img = document.createElement("img");
          img.src = url.href;
          img.alt = url.href;
          img.className = "fbm-fc-img";
          img.loading = "lazy";
          img.onload = function() {
            scrollFloatLogIfNeeded(wasAtEnd);
          };
          link.className = "fbm-fc-img-link";
          link.appendChild(img);
          bodyEl.appendChild(link);
        } else {
          appendHighlightedText(link, url.href);
          bodyEl.appendChild(link);
          if (kind === "untrusted") {
            bodyEl.appendChild(document.createTextNode(" "));
            const wrap = document.createElement("span");
            wrap.className = "fbm-fc-trust-actions-inline";
            const trustSession = document.createElement("button");
            trustSession.type = "button";
            trustSession.className = "fbm-fc-trust-link";
            trustSession.textContent = "Trust";
            trustSession.title = "Trust " + url.origin + " for this session";
            trustSession.addEventListener("click", function(e) {
              e.preventDefault();
              e.stopPropagation();
              FBM.trustFloatChatOrigin(url.origin, false);
            });
            const trustPerm = document.createElement("button");
            trustPerm.type = "button";
            trustPerm.className = "fbm-fc-trust-link fbm-fc-trust-link-perm";
            trustPerm.textContent = "Trust permanently";
            trustPerm.title = "Trust " + url.origin + " permanently";
            trustPerm.addEventListener("click", function(e) {
              e.preventDefault();
              e.stopPropagation();
              FBM.trustFloatChatOrigin(url.origin, true);
            });
            wrap.appendChild(trustSession);
            wrap.appendChild(document.createTextNode(" \xB7 "));
            wrap.appendChild(trustPerm);
            bodyEl.appendChild(wrap);
          }
        }
      } else {
        appendHighlightedText(bodyEl, words[i]);
      }
    }
  }
  function msgPartnerId(m) {
    if ((m.type === "whisper" || m.type === "beep") && m.direction === "to" && m.targetId) {
      return m.targetId;
    }
    return m.id || m.senderId || null;
  }
  function applySpeakerNameStyle(nameEl, m) {
    const styleId = msgPartnerId(m) || m.id;
    const clubColor = m.color || labelColorForMember(styleId);
    nameEl.classList.remove("fbm-fc-hl-other");
    nameEl.style.color = clubColor || "";
  }
  FBM.reaugmentFloatChatLog = function() {
    const log = $6("fbm-fc-log");
    if (!log) return;
    const wasAtEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 48;
    const rows = log.querySelectorAll(".fbm-fc-msg");
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const bodyEl = row.querySelector(".fbm-fc-msg-body");
      const raw = row.getAttribute("data-fc-body");
      if (bodyEl && raw != null) {
        let type = "chat";
        if (row.classList.contains("fbm-fc-msg-emote")) type = "emote";
        else if (row.classList.contains("fbm-fc-msg-whisper")) type = "whisper";
        else if (row.classList.contains("fbm-fc-msg-action")) type = "action";
        else if (row.classList.contains("fbm-fc-msg-system")) type = "system";
        renderBodyInto(
          bodyEl,
          {
            type,
            name: "",
            body: raw,
            time: "",
            id: row.getAttribute("data-fc-id"),
            color: row.getAttribute("data-fc-color"),
            key: "",
            direction: null,
            msgid: row.getAttribute("data-fc-msgid"),
            replyPreview: null
          },
          wasAtEnd
        );
      }
      const nameEl = row.querySelector(".fbm-fc-msg-name");
      if (nameEl) {
        applySpeakerNameStyle(nameEl, {
          type: "chat",
          name: nameEl.textContent || "",
          body: raw || "",
          time: "",
          id: row.getAttribute("data-fc-id"),
          color: row.getAttribute("data-fc-color"),
          key: "",
          direction: null,
          msgid: row.getAttribute("data-fc-msgid"),
          replyPreview: null
        });
      }
    }
    scrollFloatLogIfNeeded(wasAtEnd);
  };
  function clubChatCollapsed() {
    const div = document.getElementById("chat-room-div");
    if (div && div.hasAttribute("hidden")) return true;
    try {
      if (typeof ChatRoomMapViewSplitPosition === "number" && ChatRoomMapViewSplitPosition >= 2e3) {
        return true;
      }
    } catch (e) {
    }
    return false;
  }
  FBM.collapseClubChat = function() {
    try {
      if (typeof ChatRoomMapViewSetSplitPosition === "function") {
        ChatRoomMapViewSetSplitPosition(2e3);
        return true;
      }
    } catch (e) {
    }
    const chatDiv = document.getElementById("chat-room-div");
    if (chatDiv) chatDiv.setAttribute("hidden", "true");
    try {
      window.ChatRoomMapViewSplitPosition = 2e3;
    } catch (e) {
    }
    try {
      if (typeof ElementSetSize === "function") ElementSetSize("chat-room-content", 2e3);
    } catch (e) {
    }
    return !!chatDiv;
  };
  var AUTO_CLOSE_WARN = "Autoclose is on but Autoshow float chat is off \u2014 no chat will open when joining a room.";
  FBM.warnAutoCloseWithoutAutoshow = function() {
    const cfg = fcCfg();
    if (!cfg.autoCloseOnJoin || cfg.autoshow !== false) return;
    if (FBM.showToast) FBM.showToast(AUTO_CLOSE_WARN, 5e3);
    else if (FBM.setStatus) FBM.setStatus(AUTO_CLOSE_WARN);
  };
  FBM.maybeAutoCloseChatOnJoin = function() {
    const cfg = fcCfg();
    if (!cfg.autoCloseOnJoin) return;
    if (!inChatRoom()) return;
    FBM.collapseClubChat();
    FBM.warnAutoCloseWithoutAutoshow();
    if (FBM.refreshFloatChatVisibility) FBM.refreshFloatChatVisibility();
  };
  function inChatRoom() {
    return typeof CurrentScreen !== "undefined" && CurrentScreen === "ChatRoom";
  }
  function iconUrl(name) {
    if (name === "Trash") return "Icons/Trash.png";
    return "Icons/Rectangle/" + name + ".png";
  }
  FBM.floatChatMarkup = function() {
    return '<div id="fbm-float-chat" class="fbm-float-chat" data-fc-theme="dark" hidden aria-label="Floatable chat"><div class="fbm-fc-header" id="fbm-fc-header"><div class="fbm-fc-header-title" id="fbm-fc-header-title" title="Floatable Chat"><span class="fbm-fc-room-name" id="fbm-fc-room-name">Chat</span><span class="fbm-fc-room-count" id="fbm-fc-room-count"></span></div><span class="fbm-fc-hotkey-hint" id="fbm-fc-hotkey-hint">Alt+C</span><button type="button" class="fbm-icon-btn" id="fbm-fc-close" title="Hide">\xD7</button></div><div class="fbm-fc-toolbar" id="fbm-fc-toolbar"><button type="button" class="fbm-fc-tool" data-fc-action="leave" title="Leave room"><img src="' + iconUrl("Exit") + '" alt="" /><span>Leave</span></button><button type="button" class="fbm-fc-tool" data-fc-action="kneel" id="fbm-fc-kneel" title="Kneel / Stand"><img src="' + iconUrl("Kneel") + '" alt="" /><span id="fbm-fc-kneel-label">Kneel</span></button><button type="button" class="fbm-fc-tool" data-fc-action="wardrobe" title="Wardrobe"><img src="' + iconUrl("Dress") + '" alt="" /><span>Wardrobe</span></button><button type="button" class="fbm-fc-tool" data-fc-action="members" id="fbm-fc-members-btn" title="Room members"><span class="fbm-fc-tool-glyph" aria-hidden="true">\u2630</span><span>Members</span></button><button type="button" class="fbm-fc-tool fbm-fc-tool-seidr" data-fc-action="roommanager" id="fbm-fc-roommanager" hidden title="Seidr Room Manager"><img src="https://freya-bc.github.io/Freyas-Seidr/assets/SEIDR-Logo-Transparent.png" alt="" /><span>Manager</span></button><div class="fbm-fc-more-wrap" id="fbm-fc-more-wrap"><button type="button" class="fbm-fc-tool" data-fc-action="more" id="fbm-fc-more" title="Menu" aria-haspopup="menu" aria-expanded="false"><span class="fbm-fc-tool-glyph" aria-hidden="true">\u2630</span><span>Menu</span></button><div class="fbm-fc-more-menu" id="fbm-fc-more-menu" hidden role="menu"></div></div></div><div class="fbm-fc-body" id="fbm-fc-body"><div class="fbm-fc-members" id="fbm-fc-members" hidden><div class="fbm-fc-members-head"><span>Members</span><button type="button" class="fbm-icon-btn" id="fbm-fc-members-close" title="Close">\xD7</button></div><div class="fbm-fc-members-list" id="fbm-fc-members-list"></div></div><div class="fbm-fc-members-resize" id="fbm-fc-members-resize" hidden title="Drag to resize Members"></div><div class="fbm-fc-log" id="fbm-fc-log" role="log" aria-live="polite"></div></div><div class="fbm-fc-compose-wrap" data-fc-mode="chat"><div class="fbm-fc-reply" id="fbm-fc-reply" hidden><span class="fbm-fc-reply-text" id="fbm-fc-reply-text"></span><button type="button" class="fbm-fc-reply-close" id="fbm-fc-reply-close" title="Cancel reply">\xD7</button></div><div class="fbm-fc-ac" id="fbm-fc-ac" role="listbox" hidden></div><div class="fbm-fc-compose"><div class="fbm-fc-wav" id="fbm-fc-wav" hidden title="Whisper target"></div><textarea id="fbm-fc-input" rows="2" placeholder="Type a message\u2026  / for commands" spellcheck="true"></textarea><button type="button" class="fbm-fc-send" id="fbm-fc-send">Send</button></div></div><div class="fbm-fc-resize" id="fbm-fc-resize" title="Resize"></div></div>';
  };
  function ensureCustomStyleEl() {
    let el = document.getElementById("fbm-fc-custom-style");
    if (!el) {
      el = document.createElement("style");
      el.id = "fbm-fc-custom-style";
      (document.head || document.documentElement).appendChild(el);
    }
    return el;
  }
  function clampFcTransparency(n) {
    const t = Number(n);
    if (!isFinite(t)) return 15;
    return Math.max(0, Math.min(60, Math.round(t)));
  }
  function fcPanelAlpha(transparency) {
    return Math.max(0.4, Math.min(1, 1 - clampFcTransparency(transparency) / 100));
  }
  function applyFloatChatPanelAlpha(root, theme, transparency) {
    const a = fcPanelAlpha(transparency);
    const a2 = Math.max(0.35, a - 0.04);
    const a3 = Math.max(0.3, a - 0.08);
    const aField = Math.max(0.45, Math.min(0.95, a - 0.02));
    if (theme === "light") {
      root.style.setProperty("--fbm-fc-bg", "rgba(244, 238, 248, " + a + ")");
      root.style.setProperty("--fbm-fc-surface", "rgba(235, 227, 242, " + a2 + ")");
      root.style.setProperty("--fbm-fc-surface2", "rgba(224, 213, 235, " + a3 + ")");
      root.style.setProperty("--fbm-fc-field", "rgba(255, 250, 252, " + aField + ")");
    } else {
      root.style.setProperty("--fbm-fc-bg", "rgba(28, 22, 38, " + a + ")");
      root.style.setProperty("--fbm-fc-surface", "rgba(42, 34, 56, " + a2 + ")");
      root.style.setProperty("--fbm-fc-surface2", "rgba(60, 48, 80, " + a3 + ")");
      root.style.setProperty("--fbm-fc-field", "rgba(20, 16, 28, " + aField + ")");
    }
  }
  FBM.applyFloatChatTheme = function() {
    const root = $6("fbm-float-chat");
    const cfg = fcCfg();
    if (!root) return;
    const style = cfg.style === "light" || cfg.style === "custom" ? cfg.style : "dark";
    const themeAttr = style === "custom" ? "dark" : style;
    root.setAttribute("data-fc-theme", themeAttr);
    root.style.setProperty("--fbm-fc-size", (cfg.fontSize || 13) + "px");
    root.style.setProperty(
      "--fbm-fc-font",
      cfg.fontFamily || "system-ui, -apple-system, Segoe UI, sans-serif"
    );
    applyFloatChatPanelAlpha(root, themeAttr, cfg.transparency);
    const customEl = ensureCustomStyleEl();
    if (style === "custom") {
      customEl.textContent = cfg.customCss || DEFAULT_CUSTOM_CSS;
    } else {
      customEl.textContent = "";
    }
    const hint = $6("fbm-fc-hotkey-hint");
    if (hint) hint.textContent = cfg.hotkey || "Alt+C";
    FBM.refreshFloatChatSeidrBtn();
  };
  FBM.applyFloatChatGeometry = function() {
    const root = $6("fbm-float-chat");
    const ui = fcCfg().ui || {};
    if (!root) return;
    if (ui.width) root.style.width = ui.width + "px";
    if (ui.height) root.style.height = ui.height + "px";
    if (ui.left != null) {
      root.style.left = ui.left + "px";
      root.style.right = "auto";
    } else {
      root.style.left = "48px";
      root.style.right = "auto";
    }
    if (ui.top != null) root.style.top = ui.top + "px";
    else root.style.top = "64px";
    if (typeof FBM.refreshFloatBurgerMenu === "function") {
      requestAnimationFrame(function() {
        FBM.refreshFloatBurgerMenu();
      });
    }
  };
  FBM.persistFloatChatGeometry = function() {
    const root = $6("fbm-float-chat");
    if (!root || !FBM.settings) return;
    const r = root.getBoundingClientRect();
    const cfg = fcCfg();
    cfg.ui = cfg.ui || {};
    cfg.ui.left = Math.round(r.left);
    cfg.ui.top = Math.round(r.top);
    cfg.ui.width = Math.round(r.width);
    cfg.ui.height = Math.round(r.height);
    FBM.saveSettings();
  };
  FBM.refreshFloatChatSeidrBtn = function() {
    const btn = $6("fbm-fc-roommanager");
    if (!btn) return;
    const has = typeof window.Seidr !== "undefined" && !!window.Seidr;
    btn.hidden = !has;
  };
  FBM.floatChatIsOpen = function() {
    const root = $6("fbm-float-chat");
    return !!(root && !root.hidden);
  };
  function nudgeSeidrRmLauncher() {
    try {
      const S = window.Seidr;
      if (S && typeof S.rmUpdateLauncherVisibility === "function") {
        S.rmUpdateLauncherVisibility();
      }
    } catch (e) {
    }
  }
  function clearSeidrCommandInput() {
    try {
      const S = window.Seidr;
      if (S && typeof S.setCommandInput === "function") S.setCommandInput(null);
    } catch (e) {
    }
  }
  FBM.refreshFloatChatRoomTitle = function() {
    const nameEl = $6("fbm-fc-room-name");
    const countEl = $6("fbm-fc-room-count");
    const titleEl = $6("fbm-fc-header-title");
    if (!nameEl && !countEl) return;
    let roomName = "Chat";
    let limit = null;
    try {
      if (typeof ChatRoomData !== "undefined" && ChatRoomData) {
        const n = String(ChatRoomData.Name || "").trim();
        if (n) roomName = n;
        const lim = typeof ChatRoomData.MemberLimit === "number" ? ChatRoomData.MemberLimit : typeof ChatRoomData.Limit === "number" ? ChatRoomData.Limit : NaN;
        if (Number.isFinite(lim) && lim > 0) limit = lim;
      }
    } catch (e) {
    }
    let count = 0;
    try {
      if (typeof ChatRoomCharacter !== "undefined" && Array.isArray(ChatRoomCharacter)) {
        count = ChatRoomCharacter.length;
      }
    } catch (e2) {
      count = 0;
    }
    const countText = limit != null ? count + "/" + limit : String(count);
    if (nameEl) nameEl.textContent = roomName;
    if (countEl) countEl.textContent = countText;
    if (titleEl) titleEl.title = roomName + " " + countText;
    const root = $6("fbm-float-chat");
    if (root) root.setAttribute("aria-label", roomName + " " + countText);
  };
  FBM.openFloatChat = function(opts) {
    const cfg = fcCfg();
    if (cfg.enabled === false) return;
    FBM.ensureUi();
    const root = $6("fbm-float-chat");
    if (!root) return;
    root.hidden = false;
    cfg.hidden = false;
    FBM.applyFloatChatTheme();
    FBM.applyFloatChatGeometry();
    if (opts && opts.auto) {
      FBM._floatChatAutoOpened = true;
    } else {
      FBM._floatChatAutoOpened = false;
      FBM._floatChatUserDismissed = false;
    }
    if (!FBM._floatChatBackfilled) {
      FBM.backfillFloatChat();
      FBM._floatChatBackfilled = true;
    }
    FBM.saveSettings();
    const log = $6("fbm-fc-log");
    if (log) log.scrollTop = log.scrollHeight;
    FBM.refreshFloatChatRoomTitle();
    FBM.refreshFloatChatSeidrBtn();
    if (typeof FBM.refreshFloatToolbarOverflow === "function") FBM.refreshFloatToolbarOverflow();
    nudgeSeidrRmLauncher();
  };
  FBM.closeFloatChat = function(opts) {
    const root = $6("fbm-float-chat");
    if (!root) return;
    FBM.persistFloatChatGeometry();
    root.hidden = true;
    const cfg = fcCfg();
    cfg.hidden = true;
    FBM._floatChatAutoOpened = false;
    if (!(opts && opts.fromAuto)) FBM._floatChatUserDismissed = true;
    FBM.saveSettings();
    FBM.renderFloatChatAc([]);
    clearSeidrCommandInput();
    nudgeSeidrRmLauncher();
  };
  FBM.toggleFloatChat = function() {
    if (FBM.floatChatIsOpen()) FBM.closeFloatChat();
    else FBM.openFloatChat();
  };
  FBM.suspendFloatChatForScreen = function() {
    const root = $6("fbm-float-chat");
    if (!root || root.hidden) return;
    FBM._floatChatSuspended = true;
    FBM.persistFloatChatGeometry();
    root.hidden = true;
    FBM.renderFloatChatAc([]);
    clearSeidrCommandInput();
    nudgeSeidrRmLauncher();
  };
  FBM.resumeFloatChatAfterScreen = function() {
    if (!FBM._floatChatSuspended) return;
    FBM._floatChatSuspended = false;
    const cfg = fcCfg();
    if (cfg.enabled === false) return;
    if (!cfg.hidden) {
      FBM.openFloatChat({ auto: !!FBM._floatChatAutoOpened });
    } else if (cfg.autoshow && clubChatCollapsed() && !FBM._floatChatUserDismissed) {
      FBM.openFloatChat({ auto: true });
    }
  };
  function clubCharacterDialogOpen() {
    try {
      return typeof CurrentCharacter !== "undefined" && CurrentCharacter != null;
    } catch (e) {
      return false;
    }
  }
  FBM.suspendOverlaysForCharacterDialog = function() {
    const root = $6("fbm-root");
    if (!root) return;
    if (root.classList.contains("fbm-dialog-suspend")) return;
    root.classList.add("fbm-dialog-suspend");
    FBM._overlaysSuspendedForDialog = true;
    try {
      FBM.renderFloatChatAc([]);
      FBM.closeFloatMoreMenu();
      clearSeidrCommandInput();
    } catch (e) {
    }
    nudgeSeidrRmLauncher();
  };
  FBM.resumeOverlaysAfterCharacterDialog = function() {
    if (!FBM._overlaysSuspendedForDialog) return;
    FBM._overlaysSuspendedForDialog = false;
    const root = $6("fbm-root");
    if (root) root.classList.remove("fbm-dialog-suspend");
    nudgeSeidrRmLauncher();
  };
  FBM.refreshFloatChatVisibility = function() {
    const cfg = fcCfg();
    if (cfg.enabled === false) {
      if (FBM.floatChatIsOpen()) FBM.closeFloatChat();
      FBM._floatChatSuspended = false;
      FBM.resumeOverlaysAfterCharacterDialog();
      return;
    }
    if (!inChatRoom()) {
      FBM.resumeOverlaysAfterCharacterDialog();
      FBM.suspendFloatChatForScreen();
      return;
    }
    if (clubCharacterDialogOpen()) {
      FBM.suspendOverlaysForCharacterDialog();
      return;
    }
    if (FBM._overlaysSuspendedForDialog) {
      FBM.resumeOverlaysAfterCharacterDialog();
    }
    if (FBM._floatChatSuspended) {
      FBM.resumeFloatChatAfterScreen();
    }
    const collapsed = clubChatCollapsed();
    if (!collapsed) FBM._floatChatUserDismissed = false;
    if (cfg.autoshow && collapsed && !FBM._floatChatUserDismissed) {
      if (!FBM.floatChatIsOpen()) FBM.openFloatChat({ auto: true });
    } else if (!collapsed && FBM._floatChatAutoOpened && FBM.floatChatIsOpen()) {
      FBM.closeFloatChat({ fromAuto: true });
    }
  };
  function pad2(n) {
    return String(n).padStart(2, "0");
  }
  function nowTime() {
    const d = /* @__PURE__ */ new Date();
    return pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
  }
  function htmlElementToMultilineText(root) {
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const el = node;
      const tag = (el.tagName || "").toUpperCase();
      if (tag === "SCRIPT" || tag === "STYLE") return "";
      if (tag === "BR") return "\n";
      if (tag === "BUTTON" && (el.classList.contains("ChatMessageName") || el.classList.contains("chat-room-sender"))) {
        return "";
      }
      if (el.classList && (el.classList.contains("chat-room-metadata") || el.classList.contains("chat-room-sender"))) {
        return "";
      }
      let out = "";
      for (let i = 0; i < el.childNodes.length; i++) {
        out += walk(el.childNodes[i]);
      }
      if (tag === "DIV" || tag === "P" || tag === "LI" || tag === "TR" || tag === "H1" || tag === "H2" || tag === "H3" || tag === "H4" || tag === "SECTION" || tag === "DETAILS" || tag === "SUMMARY") {
        if (out && !out.endsWith("\n")) out += "\n";
      }
      return out;
    }
    return walk(root).replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  function selfMemberId() {
    try {
      if (typeof Player !== "undefined" && Player && typeof Player.MemberNumber === "number") {
        return String(Player.MemberNumber);
      }
    } catch (e) {
    }
    return "";
  }
  function friendDisplayName(mn, fallback) {
    if (fallback && fallback.trim()) return fallback.trim();
    const n = Number(mn);
    if (!Number.isFinite(n) || n <= 0) return mn || "?";
    try {
      if (Player && Player.FriendNames && typeof Player.FriendNames.get === "function") {
        const named = Player.FriendNames.get(n);
        if (named) return String(named);
      }
      if (typeof ChatRoomCharacter !== "undefined" && Array.isArray(ChatRoomCharacter)) {
        const C = ChatRoomCharacter.find((c) => c && c.MemberNumber === n);
        if (C) return String(C.Nickname || C.Name || mn);
      }
    } catch (e) {
    }
    return mn;
  }
  function extractReplyPreview(div) {
    const replyEl = div.querySelector(".chat-room-message-reply");
    if (!replyEl) return null;
    const raw = (replyEl.textContent || "").replace(/^\s*↱\s*/, "").trim();
    if (!raw) return null;
    const idx = raw.indexOf(":");
    if (idx > 0) {
      return {
        name: raw.slice(0, idx).trim(),
        body: raw.slice(idx + 1).trim()
      };
    }
    return { name: "", body: raw };
  }
  function labelColorForMember(memberId) {
    if (!memberId || !/^\d+$/.test(memberId)) return null;
    const n = Number(memberId);
    try {
      if (typeof ChatRoomCharacter !== "undefined" && Array.isArray(ChatRoomCharacter)) {
        const C = ChatRoomCharacter.find((c) => c && c.MemberNumber === n);
        const lc = C && C.LabelColor != null ? String(C.LabelColor).trim() : "";
        if (lc) return lc;
      }
      if (typeof Player !== "undefined" && Player && Player.MemberNumber === n && Player.LabelColor) {
        const lc = String(Player.LabelColor).trim();
        if (lc) return lc;
      }
    } catch (e) {
    }
    return null;
  }
  function extractSpeakerLabelColor(nameBtn, senderId) {
    const readVar = function(el) {
      if (!el) return null;
      try {
        const inline = el.style && el.style.getPropertyValue("--label-color") || "";
        if (inline && inline.trim()) return inline.trim();
      } catch (e) {
      }
      try {
        const computed = getComputedStyle(el).getPropertyValue("--label-color") || "";
        if (computed && computed.trim()) return computed.trim();
      } catch (e) {
      }
      return null;
    };
    let color = readVar(nameBtn);
    if (!color && nameBtn && nameBtn.parentElement) {
      color = readVar(nameBtn.parentElement);
    }
    if (!color && nameBtn) {
      try {
        const inline = nameBtn.style.color || nameBtn.style.getPropertyValue("color") || "";
        if (inline && inline.trim()) color = inline.trim();
      } catch (e) {
      }
    }
    if (!color && nameBtn) {
      try {
        const cs = getComputedStyle(nameBtn).color || "";
        if (cs && cs.trim() && cs !== "inherit") color = cs.trim();
      } catch (e) {
      }
    }
    if (!color) color = labelColorForMember(senderId);
    return color;
  }
  function classifyClubDiv(div) {
    if (!div || !div.classList) return null;
    if (div.classList.contains("chat-room-sep")) return null;
    let type = "system";
    if (div.classList.contains("ChatMessageChat")) type = "chat";
    else if (div.classList.contains("ChatMessageWhisper")) type = "whisper";
    else if (div.classList.contains("ChatMessageEmote")) type = "emote";
    else if (div.classList.contains("ChatMessageAction") || div.classList.contains("ChatMessageActivity")) {
      type = "action";
    } else if (div.classList.contains("ChatMessageBeep")) {
      type = "beep";
    } else if (div.classList.contains("ChatMessageServerMessage") || div.classList.contains("ChatMessageLocalMessage") || div.classList.contains("ChatMessageEnterLeave")) {
      type = "system";
    } else if (!div.classList.contains("ChatMessage")) {
      return null;
    }
    const nameBtn = div.querySelector(".ChatMessageName") || div.querySelector("button.ChatMessageName");
    let name = nameBtn ? (nameBtn.textContent || "").trim() : "";
    const senderEarly = div.getAttribute("data-sender") || div.querySelector(".chat-room-sender")?.textContent?.trim() || null;
    const senderIdEarly = senderEarly && /^\d+$/.test(senderEarly) ? senderEarly : null;
    let color = extractSpeakerLabelColor(nameBtn, senderIdEarly);
    const contentEl = div.querySelector(".chat-room-message-content") || div.querySelector(".ChatMessageContent") || div.querySelector(".commands-help");
    let body = "";
    if (contentEl) body = htmlElementToMultilineText(contentEl);
    else {
      const clone = div.cloneNode(true);
      clone.querySelectorAll(
        ".ChatMessageName, .chat-room-metadata, .chat-room-sender, button.ChatMessageName, .ReplyButton, .seidr-beep-reply-menu, .seidr-beep-reply-btn, .chat-room-message-popup, .chat-room-message-reply"
      ).forEach(function(n) {
        if (n.parentNode) n.parentNode.removeChild(n);
      });
      body = htmlElementToMultilineText(clone);
    }
    if (type === "action") {
      body = body.replace(/^\(+|\)+$/g, "").trim() || body;
    }
    const time = div.getAttribute("data-time") || div.querySelector(".chat-room-time")?.textContent?.trim() || nowTime();
    const targetAttr = div.getAttribute("data-target");
    const senderId = senderIdEarly;
    const targetId = targetAttr && /^\d+$/.test(targetAttr) ? targetAttr : null;
    if (!color && senderId) color = labelColorForMember(senderId);
    const selfMn = selfMemberId();
    const id = senderId;
    let direction = null;
    if (type === "whisper" || type === "beep") {
      if (selfMn && senderId === selfMn && targetId) {
        direction = "to";
      } else if (senderId || targetId) {
        direction = "from";
      }
      if (!name) {
        const labelId = direction === "to" && targetId ? targetId : senderId || targetId;
        if (labelId) name = friendDisplayName(labelId);
      }
    }
    if (type === "beep") {
      const beepLink = div.querySelector(".beep-link");
      if (beepLink) {
        let t = (beepLink.textContent || "").trim();
        t = t.replace(/^\(+|\)+$/g, "").trim();
        const m = /^(?:Beep\s+to\s+.+?\(\d+\):\s*)(.+)$/iu.exec(t);
        if (m) body = m[1].trim();
        else {
          const colon = t.indexOf(": ");
          body = colon >= 0 ? t.slice(colon + 2).trim() : t;
        }
      }
    }
    if (!name && (type === "emote" || type === "action" || type === "system" || type === "beep")) {
      name = "";
    }
    if (!body && !name) return null;
    const msgidEl = div.querySelector("[msgid]") || (div.hasAttribute("msgid") ? div : null);
    const msgid = msgidEl && msgidEl.getAttribute("msgid") || null;
    const replyPreview = extractReplyPreview(div);
    const key = msgid ? "msgid:" + msgid : "seq:" + String(++fcMsgSeq) + "|" + time + "|" + (id || "") + "|" + type;
    return {
      type,
      name,
      body,
      time,
      id,
      color,
      key,
      direction,
      targetId,
      senderId,
      msgid,
      replyPreview
    };
  }
  function renderBodyInto(body, m, wasAtEnd) {
    body.textContent = "";
    fillMessageBodyContent(body, m.body || "", wasAtEnd);
  }
  function muteKeyFor(id, body) {
    return String(id || "") + "\n" + String(body || "");
  }
  function isExactMessageMuted(m) {
    if (!m || !m.id) return false;
    return mutedExactMessages.has(muteKeyFor(m.id, m.body || ""));
  }
  FBM.muteFloatChatExactMessage = function(memberId, body) {
    const id = String(memberId || "").trim();
    const text = String(body || "");
    if (!id || !text) return;
    mutedExactMessages.add(muteKeyFor(id, text));
    const log = $6("fbm-fc-log");
    if (!log) return;
    const rows = Array.prototype.slice.call(log.querySelectorAll(".fbm-fc-msg"));
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.getAttribute("data-fc-id") === id && row.getAttribute("data-fc-body") === text) {
        if (row.parentNode) row.parentNode.removeChild(row);
      }
    }
    FBM.setStatus("Muted that message from " + id + " until reload.");
  };
  function closeFloatChatContextMenu() {
    const menu = $6("fbm-fc-ctx");
    if (menu) menu.hidden = true;
  }
  function closeFloatChatConfirm() {
    const dlg = $6("fbm-fc-confirm");
    if (dlg) dlg.hidden = true;
  }
  function ensureFloatChatConfirm() {
    let dlg = $6("fbm-fc-confirm");
    if (dlg) return dlg;
    dlg = document.createElement("div");
    dlg.id = "fbm-fc-confirm";
    dlg.className = "fbm-fc-confirm";
    dlg.hidden = true;
    dlg.setAttribute("role", "dialog");
    dlg.innerHTML = '<div class="fbm-fc-confirm-card"><div class="fbm-fc-confirm-title" id="fbm-fc-confirm-title">Confirm</div><div class="fbm-fc-confirm-body" id="fbm-fc-confirm-body"></div><div class="fbm-fc-confirm-actions"><button type="button" class="fbm-fc-confirm-cancel" id="fbm-fc-confirm-cancel">Cancel</button><button type="button" class="fbm-fc-confirm-ok" id="fbm-fc-confirm-ok">Confirm</button></div></div>';
    (document.body || document.documentElement).appendChild(dlg);
    const cancel = dlg.querySelector("#fbm-fc-confirm-cancel");
    const ok = dlg.querySelector("#fbm-fc-confirm-ok");
    if (cancel) {
      cancel.addEventListener("click", function() {
        closeFloatChatConfirm();
        FBM._fcConfirmAction = null;
      });
    }
    if (ok) {
      ok.addEventListener("click", function() {
        const fn = FBM._fcConfirmAction;
        FBM._fcConfirmAction = null;
        closeFloatChatConfirm();
        if (typeof fn === "function") {
          try {
            fn();
          } catch (e) {
            console.warn("[FBM] confirm action", e);
          }
        }
      });
    }
    dlg.addEventListener("click", function(e) {
      if (e.target === dlg) {
        closeFloatChatConfirm();
        FBM._fcConfirmAction = null;
      }
    });
    return dlg;
  }
  function openFloatChatConfirm(title, body, onConfirm) {
    const dlg = ensureFloatChatConfirm();
    const t = $6("fbm-fc-confirm-title");
    const b = $6("fbm-fc-confirm-body");
    if (t) t.textContent = title;
    if (b) b.textContent = body;
    FBM._fcConfirmAction = onConfirm;
    dlg.hidden = false;
  }
  FBM.openFloatChatConfirm = openFloatChatConfirm;
  function listHas(list, mn) {
    return !!(list && Array.isArray(list) && list.indexOf(mn) >= 0);
  }
  function ensureFloatChatContextMenu() {
    let menu = $6("fbm-fc-ctx");
    if (menu) return menu;
    menu = document.createElement("div");
    menu.id = "fbm-fc-ctx";
    menu.className = "fbm-fc-ctx";
    menu.hidden = true;
    menu.setAttribute("role", "menu");
    (document.body || document.documentElement).appendChild(menu);
    if (!FBM._fcCtxDocBound) {
      FBM._fcCtxDocBound = true;
      document.addEventListener(
        "pointerdown",
        function(e) {
          const t = e.target;
          if (!t || !t.closest || !t.closest("#fbm-fc-ctx")) closeFloatChatContextMenu();
        },
        true
      );
      document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
          closeFloatChatContextMenu();
          closeFloatChatConfirm();
        }
      });
    }
    return menu;
  }
  function addCtxItem(menu, label, title, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fbm-fc-ctx-item";
    btn.setAttribute("role", "menuitem");
    btn.textContent = label;
    btn.title = title;
    btn.addEventListener("click", function() {
      closeFloatChatContextMenu();
      onClick();
    });
    menu.appendChild(btn);
  }
  function findRoomCharacterByMn(mn) {
    try {
      if (typeof ChatRoomCharacter === "undefined" || !Array.isArray(ChatRoomCharacter)) return null;
      return ChatRoomCharacter.find(function(c) {
        return !!(c && c.MemberNumber === mn);
      }) || null;
    } catch (e) {
      return null;
    }
  }
  function openBcProfileForMn(mn) {
    if (!Number.isFinite(mn) || mn <= 0) {
      FBM.setStatus("No profile for that member.");
      return;
    }
    const C = findRoomCharacterByMn(mn);
    if (!C) {
      FBM.setStatus("Player #" + mn + " is not in this room.");
      return;
    }
    try {
      if (typeof InformationSheetLoadCharacter === "function") {
        InformationSheetLoadCharacter(C);
        return;
      }
    } catch (e) {
      console.warn("[FBM] open profile", e);
    }
    FBM.setStatus("Could not open profile.");
  }
  function copyMemberIdToClipboard(id) {
    const text = String(id || "").trim();
    if (!text) return;
    const done = function() {
      FBM.setStatus("Copied ID " + text + ".");
    };
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        void navigator.clipboard.writeText(text).then(done).catch(done);
        return;
      }
    } catch (err) {
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e2) {
    }
    done();
  }
  FBM.openFcPersonContextMenu = function(e, opts) {
    if (!opts || !Number.isFinite(opts.mn) || opts.mn <= 0) return;
    e.preventDefault();
    e.stopPropagation();
    const menu = ensureFloatChatContextMenu();
    menu.innerHTML = "";
    const mn = opts.mn;
    const label = opts.label || String(mn) + " (" + mn + ")";
    const copyId = opts.copyId != null ? String(opts.copyId) : String(mn);
    const self = String(mn) === selfMemberId();
    menu.setAttribute("data-fc-id", String(mn));
    menu.setAttribute("data-fc-name", label);
    addCtxItem(menu, "Copy ID", "Copy member number to clipboard", function() {
      copyMemberIdToClipboard(copyId);
    });
    addCtxItem(menu, "Open Profile", "Open Bondage Club information sheet", function() {
      openBcProfileForMn(mn);
    });
    if (opts.mute && opts.mute.issuerId && opts.mute.body) {
      addCtxItem(menu, "Mute", "Hide this exact message until reload", function() {
        FBM.muteFloatChatExactMessage(opts.mute.issuerId, opts.mute.body);
      });
    }
    const wantAdmin = opts.adminActions !== false;
    const isAdmin = wantAdmin && typeof ChatRoomPlayerIsAdmin === "function" && !!ChatRoomPlayerIsAdmin();
    if (isAdmin && !self) {
      addCtxItem(menu, "Kick", "Kick this player from the room", function() {
        openFloatChatConfirm("Kick player?", "Kick " + label + " from this room?", function() {
          if (typeof ChatRoomAdminChatAction === "function") {
            ChatRoomAdminChatAction("Kick", String(mn));
            FBM.setStatus("Kicked " + label + ".");
            if (typeof FBM.refreshFloatMembersPanel === "function") FBM.refreshFloatMembersPanel();
          }
        });
      });
      addCtxItem(menu, "Ban", "Ban this player from the room", function() {
        openFloatChatConfirm("Ban player?", "Ban " + label + " from this room?", function() {
          if (typeof ChatRoomAdminChatAction === "function") {
            ChatRoomAdminChatAction("Ban", String(mn));
            FBM.setStatus("Banned " + label + ".");
            if (typeof FBM.refreshFloatMembersPanel === "function") FBM.refreshFloatMembersPanel();
          }
        });
      });
    }
    if (!self && Player) {
      if (!listHas(Player.WhiteList, mn)) {
        addCtxItem(menu, "Whitelist", "Add to your whitelist", function() {
          openFloatChatConfirm("Whitelist?", "Add " + label + " to your whitelist?", function() {
            if (typeof ChatRoomListUpdate === "function" && Player && Player.WhiteList) {
              ChatRoomListUpdate(Player.WhiteList, true, mn);
              FBM.setStatus("Whitelisted " + label + ".");
              if (typeof FBM.refreshFloatMembersPanel === "function") FBM.refreshFloatMembersPanel();
            }
          });
        });
      }
      if (!listHas(Player.BlackList, mn)) {
        addCtxItem(menu, "Blacklist", "Add to your blacklist", function() {
          openFloatChatConfirm("Blacklist?", "Add " + label + " to your blacklist?", function() {
            if (typeof ChatRoomListUpdate === "function" && Player && Player.BlackList) {
              ChatRoomListUpdate(Player.BlackList, true, mn);
              FBM.setStatus("Blacklisted " + label + ".");
              if (typeof FBM.refreshFloatMembersPanel === "function") FBM.refreshFloatMembersPanel();
            }
          });
        });
      }
      if (!listHas(Player.FriendList, mn)) {
        addCtxItem(menu, "Add as Friend", "Friend request with notification", function() {
          openFloatChatConfirm(
            "Add as Friend?",
            "Send a friend request (with notification) to " + label + "?",
            function() {
              if (typeof ChatRoomListUpdate === "function" && Player && Player.FriendList) {
                ChatRoomListUpdate(Player.FriendList, true, mn, "FriendRequest");
                FBM.setStatus("Friend request sent to " + label + ".");
                if (typeof FBM.refreshFloatMembersPanel === "function") {
                  FBM.refreshFloatMembersPanel();
                }
              }
            }
          );
        });
      }
    }
    if (!menu.childNodes.length) return;
    menu.hidden = false;
    const pad = 6;
    const vw = window.innerWidth || 800;
    const vh = window.innerHeight || 600;
    menu.style.left = "0px";
    menu.style.top = "0px";
    const r = menu.getBoundingClientRect();
    let x = e.clientX;
    let y = e.clientY;
    if (x + r.width + pad > vw) x = Math.max(pad, vw - r.width - pad);
    if (y + r.height + pad > vh) y = Math.max(pad, vh - r.height - pad);
    menu.style.left = x + "px";
    menu.style.top = y + "px";
  };
  function openFloatChatContextMenu(e, m) {
    const issuerId = m.senderId || m.id;
    const partnerId = msgPartnerId(m);
    if (!issuerId && !partnerId) return;
    const actionId = partnerId || issuerId || "";
    const mn = Number(actionId);
    if (!Number.isFinite(mn) || mn <= 0) return;
    const label = (m.direction === "to" && m.targetId ? friendDisplayName(m.targetId, m.name || actionId) : m.name || actionId) + " (" + actionId + ")";
    FBM.openFcPersonContextMenu(e, {
      mn,
      label,
      copyId: issuerId || actionId,
      mute: issuerId && (m.body || "").length ? { issuerId, body: m.body || "" } : null,
      adminActions: true
    });
  }
  function clubInputEl() {
    const el = document.getElementById("InputChat");
    return el instanceof HTMLTextAreaElement ? el : null;
  }
  function floatInputEl() {
    const el = document.getElementById("fbm-fc-input");
    return el instanceof HTMLTextAreaElement ? el : null;
  }
  function setComposeValue(value, caret) {
    const input = floatInputEl();
    if (!input) return;
    input.value = value;
    input.focus();
    const pos = caret != null ? caret : value.length;
    if (typeof input.setSelectionRange === "function") input.setSelectionRange(pos, pos);
    try {
      input.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (e) {
    }
    try {
      const S = window.Seidr;
      if (S && typeof S.setCommandInput === "function") S.setCommandInput(input);
    } catch (e) {
    }
    FBM.refreshFloatComposeMode();
  }
  function prefillTargetCommand(cmd, memberId) {
    const mn = String(memberId || "").trim();
    if (!/^\d+$/.test(mn)) return;
    const input = floatInputEl();
    const rest = String(input && input.value || "").replace(TARGET_STRIP_RE, "");
    const head = "/" + cmd + " " + mn + " ";
    setComposeValue(head + rest, head.length);
  }
  function updateFloatReplyBar() {
    const bar = $6("fbm-fc-reply");
    const text = $6("fbm-fc-reply-text");
    if (!bar || !text) return;
    if (!floatReplyState) {
      bar.hidden = true;
      text.textContent = "";
      return;
    }
    const label = "Replying to: " + (floatReplyState.partnerName || floatReplyState.partnerId || "a message");
    text.textContent = label;
    bar.hidden = false;
  }
  FBM.clearFloatReply = function(opts) {
    const strip = !opts || opts.stripPrefix !== false;
    const kind = floatReplyState && floatReplyState.kind;
    floatReplyState = null;
    updateFloatReplyBar();
    const club = clubInputEl();
    if (club) club.removeAttribute("reply-id");
    if (strip && (kind === "whisper" || kind === "beep")) {
      const input = floatInputEl();
      if (input) {
        const next = String(input.value || "").replace(TARGET_STRIP_RE, "");
        if (next !== input.value) setComposeValue(next);
        else FBM.refreshFloatComposeMode();
      }
    } else {
      FBM.refreshFloatComposeMode();
    }
  };
  FBM.startFloatReply = function(m) {
    const partnerId = msgPartnerId(m);
    if (!m || !partnerId) return;
    const kind = m.type === "whisper" ? "whisper" : m.type === "beep" ? "beep" : "chat";
    const partnerName = m.direction === "to" && m.targetId ? friendDisplayName(m.targetId, m.name || partnerId) : m.name || friendDisplayName(partnerId);
    floatReplyState = {
      kind,
      partnerId,
      partnerName,
      msgid: m.msgid || null,
      snippet: (m.body || "").slice(0, 120)
    };
    updateFloatReplyBar();
    const club = clubInputEl();
    if (kind === "chat" || kind === "whisper") {
      if (club && m.msgid) club.setAttribute("reply-id", m.msgid);
      else if (club) club.removeAttribute("reply-id");
    } else if (club) {
      club.removeAttribute("reply-id");
    }
    const toSelf = String(partnerId) === selfMemberId();
    if (kind === "whisper" && !toSelf) prefillTargetCommand("whisper", partnerId);
    else if (kind === "beep" && !toSelf) prefillTargetCommand("beep", partnerId);
    else {
      const input = floatInputEl();
      if (input) {
        input.focus();
        FBM.refreshFloatComposeMode();
      }
    }
  };
  function wireNameInteractions(nameEl, m) {
    const partnerId = msgPartnerId(m);
    if (!partnerId || !/^\d+$/.test(partnerId)) return;
    if (partnerId === selfMemberId()) return;
    nameEl.classList.add("fbm-fc-msg-name-btn");
    nameEl.setAttribute("role", "button");
    nameEl.tabIndex = 0;
    nameEl.title = "Copy ID and whisper " + partnerId;
    nameEl.addEventListener("click", function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          void navigator.clipboard.writeText(partnerId);
        }
      } catch (e) {
      }
      prefillTargetCommand("whisper", partnerId);
      FBM.setStatus("Whisper prepared for " + partnerId + " (ID copied).");
    });
    nameEl.addEventListener("mouseenter", function() {
      if (fcCfg().mapCompass && typeof FBM.setFloatChatCompassTarget === "function") {
        FBM.setFloatChatCompassTarget(Number(partnerId));
      }
    });
  }
  function renderMsgRow(m) {
    const row = document.createElement("article");
    row.className = "fbm-fc-msg fbm-fc-msg-" + m.type;
    if (m.direction) row.classList.add("fbm-fc-msg-dir-" + m.direction);
    row.dataset.key = m.key;
    row.setAttribute("data-fc-body", m.body || "");
    const issuerId = m.senderId || m.id;
    const partnerId = msgPartnerId(m);
    if (issuerId) row.setAttribute("data-fc-id", issuerId);
    if (partnerId) row.setAttribute("data-fc-partner", partnerId);
    if (m.color) row.setAttribute("data-fc-color", m.color);
    if (m.msgid) row.setAttribute("data-fc-msgid", m.msgid);
    if (issuerId || partnerId) {
      row.addEventListener("contextmenu", function(ev) {
        openFloatChatContextMenu(ev, m);
      });
    }
    const main = document.createElement("div");
    main.className = "fbm-fc-msg-main";
    if (m.replyPreview && (m.replyPreview.name || m.replyPreview.body)) {
      const quote = document.createElement("div");
      quote.className = "fbm-fc-msg-reply";
      quote.textContent = (m.replyPreview.name ? m.replyPreview.name + ": " : "") + (m.replyPreview.body || "");
      main.appendChild(quote);
    }
    const line = document.createElement("div");
    line.className = "fbm-fc-msg-line";
    if (m.type === "whisper" || m.type === "beep") {
      const dir = document.createElement("span");
      dir.className = "fbm-fc-msg-dir";
      const kindLabel = m.type === "whisper" ? "Whisper" : "Beep";
      dir.textContent = m.direction === "to" ? kindLabel + " to" : kindLabel + " from";
      line.appendChild(dir);
      line.appendChild(document.createTextNode(" "));
      const name = document.createElement("span");
      name.className = "fbm-fc-msg-name";
      name.textContent = m.direction === "to" && m.targetId ? friendDisplayName(m.targetId, m.name || "?") : m.name || friendDisplayName(issuerId || partnerId || "", "?");
      applySpeakerNameStyle(name, m);
      wireNameInteractions(name, m);
      line.appendChild(name);
      const colon = document.createElement("span");
      colon.className = "fbm-fc-msg-colon";
      colon.textContent = ":";
      line.appendChild(colon);
      line.appendChild(document.createTextNode(" "));
    } else if (m.type === "chat") {
      const name = document.createElement("span");
      name.className = "fbm-fc-msg-name";
      name.textContent = m.name || "?";
      applySpeakerNameStyle(name, m);
      wireNameInteractions(name, m);
      line.appendChild(name);
      const colon = document.createElement("span");
      colon.className = "fbm-fc-msg-colon";
      colon.textContent = ":";
      line.appendChild(colon);
      line.appendChild(document.createTextNode(" "));
    }
    const body = document.createElement("span");
    body.className = "fbm-fc-msg-body";
    renderBodyInto(body, m, true);
    line.appendChild(body);
    main.appendChild(line);
    if ((m.type === "chat" || m.type === "whisper" || m.type === "beep") && partnerId) {
      const reply = document.createElement("button");
      reply.type = "button";
      reply.className = "fbm-fc-reply-btn";
      reply.title = m.type === "beep" ? "Reply with beep" : m.type === "whisper" ? "Reply with whisper" : "Reply";
      reply.textContent = "\u21A9";
      reply.addEventListener("click", function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        FBM.startFloatReply(m);
      });
      main.appendChild(reply);
    }
    row.addEventListener("mouseenter", function() {
      const compassId = partnerId || issuerId;
      if (compassId && fcCfg().mapCompass && typeof FBM.setFloatChatCompassTarget === "function") {
        FBM.setFloatChatCompassTarget(Number(compassId));
      }
    });
    row.addEventListener("mouseleave", function() {
      if (typeof FBM.clearFloatChatCompassTarget === "function") {
        FBM.clearFloatChatCompassTarget();
      }
    });
    const meta = document.createElement("span");
    meta.className = "fbm-fc-msg-meta";
    const time = document.createElement("span");
    time.className = "fbm-fc-msg-time";
    time.textContent = m.time || nowTime();
    meta.appendChild(time);
    if (issuerId) {
      const id = document.createElement("span");
      id.className = "fbm-fc-msg-id";
      id.textContent = issuerId;
      meta.appendChild(id);
    }
    row.appendChild(main);
    row.appendChild(meta);
    return row;
  }
  FBM.appendFloatChatMsg = function(m, opts) {
    const log = $6("fbm-fc-log");
    if (!log || !m) return;
    if (isExactMessageMuted(m)) return;
    if (m.key) {
      const kids = log.children;
      for (let i = 0; i < kids.length; i++) {
        const el = kids[i];
        if (el.getAttribute("data-key") === m.key) return;
      }
    }
    const atEnd = opts && opts.forceScroll || log.scrollHeight - log.scrollTop - log.clientHeight < 48;
    try {
      log.appendChild(renderMsgRow(m));
    } catch (e) {
      console.warn("[FBM] float render", e);
      try {
        const fallback = document.createElement("article");
        fallback.className = "fbm-fc-msg fbm-fc-msg-" + (m.type || "chat");
        if (m.key) fallback.setAttribute("data-key", m.key);
        fallback.setAttribute("data-fc-body", m.body || "");
        const main = document.createElement("div");
        main.className = "fbm-fc-msg-main";
        main.textContent = (m.name ? m.name + ": " : "") + (m.body || "");
        fallback.appendChild(main);
        log.appendChild(fallback);
      } catch (e2) {
      }
    }
    while (log.children.length > LOG_CAP) {
      log.removeChild(log.firstChild);
    }
    if (atEnd) log.scrollTop = log.scrollHeight;
  };
  FBM.mirrorClubChatDiv = function(div) {
    if (!div || mirroredClubDivs.has(div)) return;
    const m = classifyClubDiv(div);
    if (!m) return;
    mirroredClubDivs.add(div);
    FBM.appendFloatChatMsg(m);
  };
  FBM.backfillFloatChat = function() {
    const club = document.getElementById("TextAreaChatLog");
    const log = $6("fbm-fc-log");
    if (!club || !log) return;
    log.innerHTML = "";
    const kids = club.children;
    for (let i = 0; i < kids.length; i++) {
      const el = kids[i];
      mirroredClubDivs.add(el);
      const m = classifyClubDiv(el);
      if (m && !isExactMessageMuted(m)) log.appendChild(renderMsgRow(m));
    }
    while (log.children.length > LOG_CAP) {
      log.removeChild(log.firstChild);
    }
    log.scrollTop = log.scrollHeight;
  };
  FBM.clearFloatChatLog = function() {
    const log = $6("fbm-fc-log");
    if (log) log.innerHTML = "";
    try {
      const chatLog = document.querySelector("#TextAreaChatLog");
      const seps = chatLog?.querySelectorAll(".chat-room-sep") ?? [];
      if (chatLog && seps.length > 0) {
        const lastSep = seps[seps.length - 1];
        while (chatLog.firstChild && chatLog.firstChild !== lastSep) {
          chatLog.removeChild(chatLog.firstChild);
        }
        while (lastSep.nextSibling) {
          chatLog.removeChild(lastSep.nextSibling);
        }
      } else if (chatLog) {
        chatLog.innerHTML = "";
      }
      if (typeof ElementScrollToEnd === "function") ElementScrollToEnd("TextAreaChatLog");
    } catch (e) {
      console.warn("[FBM] clear club chat", e);
    }
    FBM.appendFloatChatMsg(
      {
        type: "system",
        name: "System",
        body: "Chat cleared.",
        time: nowTime(),
        id: null,
        color: null,
        key: "cleared-" + Date.now()
      },
      { forceScroll: true }
    );
  };
  function clubWhisperTargetMn() {
    try {
      const n = typeof ChatRoomTargetMemberNumber === "number" ? ChatRoomTargetMemberNumber : NaN;
      return Number.isFinite(n) && n >= 0 ? n : null;
    } catch (e) {
      return null;
    }
  }
  function clearClubWhisperTarget() {
    try {
      if (typeof ChatRoomSetTarget === "function") ChatRoomSetTarget(-1);
      else if (typeof ChatRoomTargetMemberNumber === "number") {
        window.ChatRoomTargetMemberNumber = -1;
      }
    } catch (e) {
    }
  }
  function whisperTargetFailure(mn) {
    if (!Number.isFinite(mn) || mn < 0) return "gone";
    try {
      let target = null;
      if (typeof ChatRoomCharacter !== "undefined" && Array.isArray(ChatRoomCharacter)) {
        target = ChatRoomCharacter.find((c) => c && c.MemberNumber === mn) || null;
      }
      if (!target) return "gone";
      const mapOn = typeof ChatRoomMapViewIsActive === "function" && !!ChatRoomMapViewIsActive();
      const superPowers = typeof ChatRoomMapViewHasSuperPowers === "function" && !!ChatRoomMapViewHasSuperPowers();
      const inRange = typeof ChatRoomMapViewCharacterOnWhisperRange === "function" && !!ChatRoomMapViewCharacterOnWhisperRange(target);
      if (mapOn && !superPowers && !inRange) return "out-of-range";
      return null;
    } catch (e) {
      return null;
    }
  }
  function clearClubInputChat() {
    try {
      if (typeof ElementValue === "function") ElementValue("InputChat", "");
      else {
        const club = clubInputEl();
        if (club) {
          club.value = "";
          club.dispatchEvent(new InputEvent("input"));
        }
      }
    } catch (e) {
    }
  }
  function detectComposeMode(raw) {
    const v = String(raw || "").trim();
    if (/^\/beep\b/i.test(v)) return "beep";
    if (/^\/(whisper|w)\b/i.test(v)) return "whisper";
    if (floatReplyState && floatReplyState.kind === "whisper") return "whisper";
    if (floatReplyState && floatReplyState.kind === "beep") return "beep";
    if (clubWhisperTargetMn() != null && !/^\/(?:beep)\b/i.test(v)) return "whisper";
    return "chat";
  }
  function parseWhisperTargetMn(raw) {
    const m = /^\/(?:whisper|w)\s+(\d+)\b/i.exec(String(raw || "").trim());
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  FBM.refreshFloatWhisperAvatar = function() {
    const slot = $6("fbm-fc-wav");
    if (!slot) return;
    const cfg = fcCfg();
    const input = floatInputEl();
    const mode = detectComposeMode(input ? input.value : "");
    let mn = mode === "whisper" ? parseWhisperTargetMn(input ? input.value : "") : null;
    if (mn == null && mode === "whisper") mn = clubWhisperTargetMn();
    if (!cfg.whisperAvatar || mode !== "whisper" || !mn) {
      slot.hidden = true;
      slot.innerHTML = "";
      whisperAvatarMn = null;
      return;
    }
    if (whisperAvatarMn === mn && slot.childNodes.length) {
      slot.hidden = false;
      return;
    }
    whisperAvatarMn = mn;
    slot.innerHTML = "";
    let C = null;
    try {
      if (typeof ChatRoomCharacter !== "undefined" && Array.isArray(ChatRoomCharacter)) {
        C = ChatRoomCharacter.find((c) => c && c.MemberNumber === mn) || null;
      }
    } catch (e) {
      C = null;
    }
    const label = friendDisplayName(String(mn));
    if (typeof FBM.paintFacePortrait === "function") {
      FBM.paintFacePortrait(slot, C, { size: 48, fallbackName: label });
    } else {
      slot.textContent = (label || "?").trim().slice(0, 2).toUpperCase() || "?";
    }
    slot.title = label + " (" + mn + ")";
    slot.hidden = false;
  };
  FBM.refreshFloatComposeMode = function() {
    const wrap = document.querySelector("#fbm-float-chat .fbm-fc-compose-wrap");
    const input = floatInputEl();
    const mode = detectComposeMode(input ? input.value : "");
    if (wrap) wrap.setAttribute("data-fc-mode", mode);
    FBM.refreshFloatWhisperAvatar();
  };
  function splitDirectedCompose(raw) {
    const text = String(raw || "").trim();
    const m = /^(\/(?:whisper|w|beep)\s+\S+\s*)([\s\S]*)$/i.exec(text);
    if (!m) {
      if (clubWhisperTargetMn() != null) {
        return { kind: "whisper", prefix: "", body: text };
      }
      return { kind: "chat", prefix: "", body: text };
    }
    const kind = /^\s*\/beep\b/i.test(m[1]) ? "beep" : "whisper";
    return { kind, prefix: m[1], body: m[2] };
  }
  function parseMistakenOocWrappedCommand(raw) {
    const text = String(raw || "").trim();
    const m = /^\(\s*(\/(?:whisper|w|beep)\s+(\S+)\s*)([\s\S]*)\)$/i.exec(text);
    if (!m) return null;
    const prefix = m[1];
    const kind = /^\s*\/beep\b/i.test(prefix) ? "beep" : "whisper";
    let body = String(m[3] || "").trim();
    if (body.charAt(0) === "(" && body.charAt(body.length - 1) === ")" && oocParenBalanced(body)) {
    } else if (body) {
      body = "(" + body + ")";
    }
    return {
      kind,
      prefix,
      body,
      corrected: body ? prefix + body : prefix
    };
  }
  function oocParenBalanced(body) {
    let open = 0;
    let close = 0;
    const s = String(body || "");
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "(") open++;
      else if (s[i] === ")") close++;
    }
    return open === close;
  }
  function wrapComposeAsOoc(raw) {
    const mistaken = parseMistakenOocWrappedCommand(raw);
    if (mistaken) return mistaken.corrected;
    const parts = splitDirectedCompose(raw);
    const body = String(parts.body || "").trim();
    if (!body) return parts.prefix ? parts.prefix : String(raw || "").trim();
    if (body.charAt(0) === "(" && oocParenBalanced(body) && body.charAt(body.length - 1) === ")") {
      return parts.prefix ? parts.prefix + body : body;
    }
    const wrapped = "(" + body + ")";
    return parts.prefix ? parts.prefix + wrapped : wrapped;
  }
  function isWhisperTargetSelectOnly(raw) {
    return /^\/(?:whisper|w)\s+\S+\s*$/i.test(String(raw || "").trim());
  }
  function refuseOocSend(kind, detail) {
    const msg = kind === "whisper" ? "can not be sent broken whisper" : kind === "beep" ? "can not be sent broken beep" : "can not be sent broken OOC";
    clearClubWhisperTarget();
    FBM.setStatus(detail || msg);
    FBM.appendFloatChatMsg(
      {
        type: "system",
        name: "System",
        body: detail || msg,
        time: nowTime(),
        id: null,
        color: null,
        key: "ooc-block-" + Date.now()
      },
      { forceScroll: true }
    );
    FBM.refreshFloatComposeMode();
  }
  FBM.sendFloatChat = function(opts) {
    const input = $6("fbm-fc-input");
    if (!input) return;
    let raw = String(input.value || "").trim();
    if (!raw) return;
    const mistaken = parseMistakenOocWrappedCommand(raw);
    if (mistaken) {
      raw = mistaken.corrected;
      if (input.value.trim() !== raw) setComposeValue(raw, raw.length);
    }
    if (opts && opts.asOoc) raw = wrapComposeAsOoc(raw);
    raw = String(raw || "").trim();
    if (!raw) return;
    const directed = splitDirectedCompose(raw);
    const cfg = fcCfg();
    if (cfg.oocProtection !== false) {
      if (!oocParenBalanced(directed.body)) {
        refuseOocSend(directed.kind);
        return;
      }
    }
    FBM.renderFloatChatAc([]);
    const hasExplicitDir = /^\/(?:whisper|w|beep)\b/i.test(raw);
    if (directed.kind === "chat") clearClubWhisperTarget();
    const selectOnly = isWhisperTargetSelectOnly(raw);
    const selectMn = selectOnly ? parseWhisperTargetMn(raw) : null;
    const clubPayload = directed.kind === "whisper" && !hasExplicitDir ? directed.body : raw;
    try {
      const club = clubInputEl();
      if (typeof ElementValue === "function") ElementValue("InputChat", clubPayload);
      else if (club) club.value = clubPayload;
      if (club) {
        if (floatReplyState && floatReplyState.msgid && floatReplyState.kind !== "beep") {
          club.setAttribute("reply-id", floatReplyState.msgid);
        }
      }
      if (typeof ChatRoomSendChat === "function") ChatRoomSendChat();
    } catch (e) {
      console.warn("[FBM] float send", e);
    }
    let clubUncleared = false;
    try {
      const club = clubInputEl();
      clubUncleared = !!(club && String(club.value || "").trim());
    } catch (e) {
      clubUncleared = false;
    }
    let whisperFailed = clubUncleared;
    if (!whisperFailed && !selectOnly && directed.kind === "whisper") {
      const mn = parseWhisperTargetMn(raw) || clubWhisperTargetMn();
      if (mn != null && whisperTargetFailure(mn)) whisperFailed = true;
    }
    if (whisperFailed) {
      clearClubWhisperTarget();
      clearClubInputChat();
    }
    input.value = "";
    FBM.clearFloatReply({ stripPrefix: false });
    if (!whisperFailed && directed.kind === "whisper") {
      const mn = selectMn != null ? selectMn : parseWhisperTargetMn(raw) || clubWhisperTargetMn();
      if (mn != null && (selectOnly || clubWhisperTargetMn() === mn || !hasExplicitDir)) {
        const head = "/whisper " + mn + " ";
        setComposeValue(head, head.length);
        FBM.refreshFloatComposeMode();
        return;
      }
    }
    FBM.refreshFloatComposeMode();
  };
  var SEIDR_CMD_TAGS = {
    a: true,
    action: true,
    strip: true,
    stripe: true,
    poses: true,
    animation: true,
    ani: true,
    seidr: true,
    roommanager: true
  };
  function seidrInstalled() {
    return typeof window.Seidr !== "undefined" && !!window.Seidr;
  }
  function clubCommandTags() {
    const now = Date.now();
    const seidr = seidrInstalled();
    if (FBM._fcCmdCache && FBM._fcCmdCacheAt && now - FBM._fcCmdCacheAt < 5e3 && FBM._fcCmdCacheSeidr === seidr) {
      return FBM._fcCmdCache;
    }
    const out = [];
    try {
      const list = typeof GetCommands === "function" ? GetCommands() : typeof Commands !== "undefined" && Array.isArray(Commands) ? Commands : [];
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (!c || !c.Tag) continue;
        const tag = String(c.Tag);
        const low = tag.toLowerCase();
        if (!seidr && SEIDR_CMD_TAGS[low]) continue;
        out.push({ tag, desc: String(c.Description || "") });
      }
    } catch (e) {
    }
    FBM._fcCmdCache = out;
    FBM._fcCmdCacheAt = now;
    FBM._fcCmdCacheSeidr = seidr;
    return out;
  }
  FBM.highlightFloatChatAc = function() {
    const box = $6("fbm-fc-ac");
    if (!box) return;
    const idx = FBM._fcAcIndex || 0;
    Array.prototype.forEach.call(box.children, function(el, i) {
      const on = i === idx;
      el.classList.toggle("fbm-fc-ac-on", on);
      if (on && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ block: "nearest" });
      }
    });
  };
  FBM.renderFloatChatAc = function(items, index) {
    const box = $6("fbm-fc-ac");
    if (!box) return;
    FBM._fcAcItems = items || [];
    FBM._fcAcIndex = items && items.length ? index != null ? index : 0 : -1;
    if (!items || !items.length) {
      box.hidden = true;
      box.innerHTML = "";
      box.classList.remove("fbm-fc-open");
      return;
    }
    box.hidden = false;
    box.classList.add("fbm-fc-open");
    const frag = document.createDocumentFragment();
    items.forEach(function(it, i) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fbm-fc-ac-item" + (i === FBM._fcAcIndex ? " fbm-fc-ac-on" : "");
      btn.setAttribute("role", "option");
      btn.setAttribute("data-i", String(i));
      const pfx = it.prefix === "." ? "." : "/";
      btn.innerHTML = '<span class="fbm-fc-ac-label">' + pfx + escapeHtml2(it.tag) + "</span>" + (it.desc ? '<span class="fbm-fc-ac-hint">' + escapeHtml2(it.desc) + "</span>" : "");
      btn.addEventListener("mousedown", function(ev) {
        ev.preventDefault();
        FBM.acceptFloatChatAc(i);
      });
      frag.appendChild(btn);
    });
    box.innerHTML = "";
    box.appendChild(frag);
    FBM.highlightFloatChatAc();
  };
  function escapeHtml2(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  FBM.proxyDotCommandTab = function() {
    const input = floatInputEl();
    if (!input) return false;
    const raw = String(input.value || "");
    if (!raw.startsWith(".") || raw.startsWith("..")) return false;
    const club = clubInputEl();
    if (!club) return false;
    try {
      club.value = raw;
      if (typeof ElementValue === "function") ElementValue("InputChat", raw);
      if (typeof ChatRoomKeyDown === "function") {
        ChatRoomKeyDown({
          key: "Tab",
          preventDefault: function() {
          },
          stopImmediatePropagation: function() {
          }
        });
      }
      const next = String(club.value || "");
      if (next && next !== raw) {
        setComposeValue(next, next.length);
        const tag = next.replace(/^\./, "").split(/\s/)[0] || "";
        if (tag) {
          FBM.renderFloatChatAc([{ tag, desc: "dot command", prefix: "." }], 0);
        }
        return true;
      }
    } catch (e) {
      console.warn("[FBM] dot Tab proxy", e);
    }
    return false;
  };
  FBM.updateFloatChatAc = function() {
    const input = $6("fbm-fc-input");
    if (!input) return;
    const val = input.value || "";
    const dot = val.match(/^\.([^\s]*)$/);
    if (dot) {
      const prefix2 = (dot[1] || "").toLowerCase();
      if (!prefix2) {
        FBM.renderFloatChatAc([]);
        return;
      }
      const club = clubInputEl();
      if (club && typeof ChatRoomKeyDown === "function") {
        const prev = club.value;
        try {
          club.value = val;
          ChatRoomKeyDown({
            key: "Tab",
            preventDefault: function() {
            },
            stopImmediatePropagation: function() {
            }
          });
          const completed = String(club.value || "");
          club.value = prev;
          if (completed.startsWith(".") && completed !== val) {
            const tag = completed.replace(/^\./, "").trim().split(/\s/)[0] || prefix2;
            FBM.renderFloatChatAc(
              [{ tag, desc: "dot command", prefix: "." }],
              0
            );
            return;
          }
        } catch (e) {
          try {
            club.value = prev;
          } catch (err) {
          }
        }
      }
      FBM.renderFloatChatAc([]);
      return;
    }
    const m = val.match(/^\/([^\s/]*)$/);
    if (!m) {
      FBM.renderFloatChatAc([]);
      return;
    }
    const prefix = m[1].toLowerCase();
    if (!prefix) {
      FBM.renderFloatChatAc([]);
      return;
    }
    const all = clubCommandTags();
    const items = [];
    for (let i = 0; i < all.length; i++) {
      const c = all[i];
      const tag = c.tag.toLowerCase();
      if (tag.indexOf(prefix) === 0) items.push({ tag: c.tag, desc: c.desc, prefix: "/" });
    }
    items.sort(function(a, b) {
      return a.tag.toLowerCase().localeCompare(b.tag.toLowerCase());
    });
    FBM.renderFloatChatAc(items, 0);
  };
  FBM.scheduleFloatChatAc = function() {
    if (FBM._fcAcTimer) clearTimeout(FBM._fcAcTimer);
    FBM._fcAcTimer = setTimeout(function() {
      FBM._fcAcTimer = null;
      FBM.updateFloatChatAc();
    }, 40);
  };
  FBM.acceptFloatChatAc = function(index) {
    const items = FBM._fcAcItems || [];
    const i = index != null ? index : FBM._fcAcIndex || 0;
    const it = items[i];
    const input = $6("fbm-fc-input");
    if (!it || !input) return;
    const pfx = it.prefix === "." ? "." : "/";
    input.value = pfx + it.tag + " ";
    FBM.renderFloatChatAc([]);
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
    FBM.refreshFloatComposeMode();
  };
  FBM.installFloatChatMirror = function() {
    if (FBM._floatChatMirrorHooked) return;
    const ok = FBM.tryHook(
      "floatChatAppend",
      "ChatRoomAppendChat",
      2,
      function(args, next) {
        const ret = next(args);
        try {
          const div = args && args[0];
          if (div && div.nodeType === 1) {
            FBM.mirrorClubChatDiv(div);
          }
        } catch (e) {
          console.warn("[FBM] float mirror", e);
        }
        return ret;
      }
    );
    if (ok) FBM._floatChatMirrorHooked = true;
  };
  FBM.installFloatChatHotkey = function() {
    if (FBM._floatChatHotkeyBound) return;
    FBM._floatChatHotkeyBound = true;
    document.addEventListener(
      "keydown",
      function(e) {
        const cfg = fcCfg();
        if (cfg.enabled === false) return;
        if (FBM._capturingHotkey || FBM._capturingFcHotkey) return;
        if (!inChatRoom()) return;
        const t = e.target;
        const tag = t && (t.tagName || "").toUpperCase();
        const typing = !!t && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!t.isContentEditable);
        if (typing) {
          const id = t.id || "";
          const allowed = id === "fbm-fc-input" || id === "InputChat" || t.closest && t.closest("#fbm-fc-ac");
          if (!allowed) return;
        }
        const spec = cfg.hotkey || "Alt+C";
        if (!FBM.hotkeyMatches(e, spec)) return;
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        FBM.toggleFloatChat();
      },
      true
    );
  };
  FBM.installFloatChatComposeKeys = function() {
    if (FBM._floatChatComposeKeysBound) return;
    FBM._floatChatComposeKeysBound = true;
    document.addEventListener(
      "keydown",
      function(e) {
        const t = e.target;
        if (!t || t.id !== "fbm-fc-input") return;
        const key = e.key;
        const S = window.Seidr;
        const seidrAc = !!S && typeof S.cmdAcIsOpen === "function" && !!S.cmdAcIsOpen();
        if (seidrAc) return;
        const items = FBM._fcAcItems || [];
        const acOpen = items.length > 0;
        const input = t;
        const val = String(input.value || "");
        if (acOpen && (key === "ArrowDown" || key === "Down")) {
          e.preventDefault();
          e.stopPropagation();
          FBM._fcAcIndex = ((FBM._fcAcIndex || 0) + 1) % items.length;
          FBM.highlightFloatChatAc();
          return;
        }
        if (acOpen && (key === "ArrowUp" || key === "Up")) {
          e.preventDefault();
          e.stopPropagation();
          FBM._fcAcIndex = ((FBM._fcAcIndex || 0) - 1 + items.length) % items.length;
          FBM.highlightFloatChatAc();
          return;
        }
        if (key === "Tab") {
          if (val.startsWith(".") && !val.startsWith("..")) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
            FBM.proxyDotCommandTab();
            return;
          }
          if (S && typeof S.cmdAcHandleKeyDown === "function") {
            try {
              if (typeof S.setCommandInput === "function") S.setCommandInput(input);
            } catch (err) {
            }
            if (S.cmdAcHandleKeyDown(e)) {
              FBM.renderFloatChatAc([]);
              e.stopPropagation();
              if (typeof e.stopImmediatePropagation === "function") {
                e.stopImmediatePropagation();
              }
              return;
            }
          }
          if (acOpen) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
            FBM.acceptFloatChatAc();
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (acOpen && key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          FBM.renderFloatChatAc([]);
          return;
        }
        if (key === "Escape" && floatReplyState) {
          e.preventDefault();
          e.stopPropagation();
          FBM.clearFloatReply();
          return;
        }
        if ((key === "Enter" || key === "NumpadEnter") && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          FBM.renderFloatChatAc([]);
          const asOoc = !!(e.ctrlKey || e.metaKey);
          FBM.sendFloatChat({ asOoc });
        }
      },
      true
    );
  };
  FBM.installFloatChatVisibilityWatch = function() {
    if (FBM._floatChatVisBound) return;
    FBM._floatChatVisBound = true;
    setInterval(function() {
      try {
        FBM.refreshFloatChatVisibility();
        FBM.refreshFloatChatSeidrBtn();
        if (FBM.floatChatIsOpen()) FBM.refreshFloatChatRoomTitle();
      } catch (e) {
      }
    }, 800);
    if (typeof FBM.tryHook === "function") {
      FBM.tryHook(
        "fbmDialogCharSet",
        "CharacterSetCurrent",
        0,
        function(args, next) {
          const ret = next(args);
          try {
            FBM.refreshFloatChatVisibility();
          } catch (e) {
          }
          return ret;
        }
      );
      FBM.tryHook(
        "fbmDialogLeave",
        "DialogLeave",
        0,
        function(args, next) {
          const ret = next(args);
          try {
            FBM.refreshFloatChatVisibility();
          } catch (e) {
          }
          return ret;
        }
      );
    }
  };
  function bindFloatDrag() {
    const root = $6("fbm-float-chat");
    const header = $6("fbm-fc-header");
    if (!root || !header || header._fbmBound) return;
    header._fbmBound = true;
    let dragging = false;
    let ox = 0;
    let oy = 0;
    header.addEventListener("pointerdown", function(e) {
      if (e.target?.closest("button")) return;
      dragging = true;
      const r = root.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      try {
        header.setPointerCapture(e.pointerId);
      } catch (err) {
      }
    });
    header.addEventListener("pointermove", function(e) {
      if (!dragging) return;
      root.style.left = Math.max(0, e.clientX - ox) + "px";
      root.style.top = Math.max(0, e.clientY - oy) + "px";
      root.style.right = "auto";
    });
    header.addEventListener("pointerup", function() {
      if (!dragging) return;
      dragging = false;
      FBM.persistFloatChatGeometry();
    });
  }
  function bindFloatResize() {
    const root = $6("fbm-float-chat");
    const handle = $6("fbm-fc-resize");
    if (!root || !handle || handle._fbmBound) return;
    handle._fbmBound = true;
    let resizing = false;
    let sx = 0;
    let sy = 0;
    let sw = 0;
    let sh = 0;
    handle.addEventListener("pointerdown", function(e) {
      resizing = true;
      sx = e.clientX;
      sy = e.clientY;
      const r = root.getBoundingClientRect();
      sw = r.width;
      sh = r.height;
      try {
        handle.setPointerCapture(e.pointerId);
      } catch (err) {
      }
      e.preventDefault();
    });
    handle.addEventListener("pointermove", function(e) {
      if (!resizing) return;
      const nw = Math.max(300, sw + (e.clientX - sx));
      const nh = Math.max(240, sh + (e.clientY - sy));
      root.style.width = nw + "px";
      root.style.height = nh + "px";
    });
    handle.addEventListener("pointerup", function() {
      if (!resizing) return;
      resizing = false;
      FBM.persistFloatChatGeometry();
    });
  }
  var FC_BURGER_LABELS = {
    preference: "Preferences",
    chatsettings: "Chat Settings",
    profile: "Profile",
    roomadmin: "Room settings",
    clear: "Clear chat",
    export: "Export Chat"
  };
  function fcBurgerActions() {
    return ["preference", "chatsettings", "profile", "roomadmin", "clear", "export"];
  }
  FBM.closeFloatMoreMenu = function() {
    const menu = $6("fbm-fc-more-menu");
    const moreBtn = $6("fbm-fc-more");
    if (menu) menu.hidden = true;
    if (moreBtn) moreBtn.setAttribute("aria-expanded", "false");
  };
  function fcClickActionEl(target) {
    const el = target instanceof Element ? target : target && target.parentElement ? target.parentElement : null;
    if (!el) return null;
    return el.closest("[data-fc-action]");
  }
  function buildFloatBurgerMenuItems(actions) {
    const menu = $6("fbm-fc-more-menu");
    if (!menu) return;
    const key = actions.join("|");
    if (menu.getAttribute("data-fc-actions") === key && menu.childNodes.length === actions.length) {
      return;
    }
    const keepOpen = !menu.hidden;
    menu.setAttribute("data-fc-actions", key);
    menu.innerHTML = "";
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fbm-fc-more-item";
      btn.setAttribute("role", "menuitem");
      btn.setAttribute("data-fc-action", a);
      btn.textContent = FC_BURGER_LABELS[a] || a;
      btn.addEventListener("click", function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        FBM.runFloatChatToolbarAction(a, btn);
      });
      menu.appendChild(btn);
    }
    if (keepOpen) menu.hidden = false;
  }
  FBM.refreshFloatBurgerMenu = function() {
    const moreWrap = $6("fbm-fc-more-wrap");
    if (moreWrap) moreWrap.hidden = false;
    buildFloatBurgerMenuItems(fcBurgerActions());
  };
  FBM.refreshFloatToolbarOverflow = function() {
    FBM.refreshFloatBurgerMenu();
  };
  FBM.toggleFloatMoreMenu = function() {
    const menu = $6("fbm-fc-more-menu");
    const moreWrap = $6("fbm-fc-more-wrap");
    const moreBtn = $6("fbm-fc-more");
    if (!menu || !moreWrap) return;
    if (!menu.hidden) {
      FBM.closeFloatMoreMenu();
      return;
    }
    if (!menu.childNodes.length) FBM.refreshFloatBurgerMenu();
    menu.hidden = false;
    if (moreBtn) moreBtn.setAttribute("aria-expanded", "true");
  };
  FBM.exportFloatChatLog = function() {
    const log = $6("fbm-fc-log");
    if (!log) {
      FBM.setStatus("No chat to export.");
      return;
    }
    const rows = log.querySelectorAll("article.fbm-fc-msg");
    const lines = [];
    const roomEl = $6("fbm-fc-room-name");
    const roomName = roomEl ? String(roomEl.textContent || "").trim() : "";
    const stamp = /* @__PURE__ */ new Date();
    const pad = function(n) {
      return n < 10 ? "0" + n : String(n);
    };
    const fileStamp = stamp.getFullYear() + "-" + pad(stamp.getMonth() + 1) + "-" + pad(stamp.getDate()) + "_" + pad(stamp.getHours()) + pad(stamp.getMinutes());
    lines.push(
      "Freyas Better Maps \u2014 Chat export" + (roomName ? " (" + roomName + ")" : "") + " \u2014 " + stamp.toISOString()
    );
    lines.push("");
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const timeEl = row.querySelector(".fbm-fc-msg-time");
      const dirEl = row.querySelector(".fbm-fc-msg-dir");
      const nameEl = row.querySelector(".fbm-fc-msg-name");
      const time = timeEl ? String(timeEl.textContent || "").trim() : "";
      const dir = dirEl ? String(dirEl.textContent || "").trim() : "";
      const name = nameEl ? String(nameEl.textContent || "").trim() : "";
      const body = String(row.getAttribute("data-fc-body") || "").trim();
      const id = String(row.getAttribute("data-fc-id") || "").trim();
      let head = time ? "[" + time + "] " : "";
      if (dir) head += dir + " ";
      if (name) head += name + (id ? " (" + id + ")" : "") + ": ";
      else if (id) head += "(" + id + ") ";
      lines.push((head + body).trimEnd());
    }
    const text = lines.join("\n") + "\n";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fbm-chat" + (roomName ? "-" + roomName.replace(/[^\w.-]+/g, "_") : "") + "-" + fileStamp + ".txt";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
      }
    }, 0);
    FBM.setStatus("Chat exported (" + rows.length + " lines).");
  };
  FBM.runFloatChatToolbarAction = function(action, btn) {
    if (!action) return;
    try {
      if (action === "more") {
        FBM.toggleFloatMoreMenu();
        return;
      }
      FBM.closeFloatMoreMenu();
      if (action === "leave" && typeof ChatRoomAttemptLeave === "function") {
        if (fcCfg().confirmLeave) {
          openFloatChatConfirm("Leave room?", "Leave this chat room?", function() {
            ChatRoomAttemptLeave();
          });
        } else {
          ChatRoomAttemptLeave();
        }
      } else if (action === "members") {
        if (typeof FBM.toggleFloatMembersPanel === "function") FBM.toggleFloatMembersPanel();
      } else if (action === "kneel" && typeof ChatRoomToggleKneel === "function") {
        ChatRoomToggleKneel();
        const lab = $6("fbm-fc-kneel-label");
        const kneeling = typeof Player !== "undefined" && Player && typeof Player.IsKneeling === "function" && Player.IsKneeling();
        if (lab) lab.textContent = kneeling ? "Stand" : "Kneel";
        const kneelBtn = btn || $6("fbm-fc-kneel");
        if (kneelBtn) kneelBtn.classList.toggle("fbm-fc-on", !!kneeling);
      } else if (action === "wardrobe" && typeof ChatRoomOpenWardrobeScreen === "function") {
        ChatRoomOpenWardrobeScreen();
      } else if (action === "profile" && typeof ChatRoomOpenInformationScreen === "function") {
        ChatRoomOpenInformationScreen();
      } else if (action === "preference") {
        try {
          if (typeof ChatRoomStatusUpdate === "function") ChatRoomStatusUpdate("Preference");
          if (typeof PreferenceOpenSubscreen === "function") {
            void PreferenceOpenSubscreen("Main");
          } else if (typeof InformationSheetLoadCharacter === "function" && typeof Player !== "undefined") {
            InformationSheetLoadCharacter(Player);
            if (typeof CommonSetScreen === "function") CommonSetScreen("Character", "Preference");
          } else if (typeof CommonSetScreen === "function") {
            CommonSetScreen("Character", "Preference");
          }
        } catch (prefErr) {
          console.warn("[FBM] open preference", prefErr);
        }
      } else if (action === "roomadmin" && typeof ChatRoomOpenAdminScreen === "function") {
        ChatRoomOpenAdminScreen();
      } else if (action === "roommanager") {
        const S = window.Seidr;
        if (S && typeof S.rmOpenPanel === "function") S.rmOpenPanel();
        else {
          if (typeof ElementValue === "function") ElementValue("InputChat", "/roommanager");
          if (typeof ChatRoomSendChat === "function") ChatRoomSendChat();
        }
      } else if (action === "chatsettings") {
        if (typeof FBM.openPanel === "function") FBM.openPanel({ tab: "chat" });
      } else if (action === "clear") {
        FBM.clearFloatChatLog();
      } else if (action === "export") {
        FBM.exportFloatChatLog();
      }
    } catch (err) {
      console.warn("[FBM] float toolbar", action, err);
    }
  };
  FBM.bindFloatChatUi = function() {
    bindFloatDrag();
    bindFloatResize();
    const close = buttonEl2("fbm-fc-close");
    if (close && !close._fbmBound) {
      close._fbmBound = true;
      close.addEventListener("click", function() {
        FBM.closeFloatChat();
      });
    }
    const send = buttonEl2("fbm-fc-send");
    if (send && !send._fbmBound) {
      send._fbmBound = true;
      send.addEventListener("click", function() {
        FBM.sendFloatChat();
      });
    }
    const replyClose = buttonEl2("fbm-fc-reply-close");
    if (replyClose && !replyClose._fbmBound) {
      replyClose._fbmBound = true;
      replyClose.addEventListener("click", function() {
        FBM.clearFloatReply();
      });
    }
    const input = $6("fbm-fc-input");
    if (input && !input._fbmBound) {
      input._fbmBound = true;
      input.addEventListener("input", function() {
        FBM.scheduleFloatChatAc();
        FBM.refreshFloatComposeMode();
      });
      input.addEventListener("focusin", function() {
        try {
          const S = window.Seidr;
          if (S && typeof S.setCommandInput === "function") S.setCommandInput(input);
        } catch (e) {
        }
        FBM.refreshFloatComposeMode();
      });
      input.addEventListener("blur", function() {
        setTimeout(function() {
          try {
            const ae = document.activeElement;
            const ac = document.getElementById("seidr-cmd-ac");
            if (ac && ae && ac.contains(ae)) return;
            const S = window.Seidr;
            if (S && typeof S.setCommandInput === "function") S.setCommandInput(null);
          } catch (e) {
          }
        }, 50);
      });
    }
    if (FBM.installFloatChatComposeKeys) FBM.installFloatChatComposeKeys();
    if (FBM.installFloatChatCompass) FBM.installFloatChatCompass();
    if (FBM.bindFloatMembersPanel) FBM.bindFloatMembersPanel();
    FBM.refreshFloatComposeMode();
    const bar = $6("fbm-fc-toolbar");
    if (bar && !bar._fbmBound) {
      bar._fbmBound = true;
      bar.addEventListener("click", function(e) {
        const btn = fcClickActionEl(e.target);
        if (!btn || !bar.contains(btn)) return;
        if (btn.classList.contains("fbm-fc-more-item")) return;
        FBM.runFloatChatToolbarAction(btn.getAttribute("data-fc-action"), btn);
      });
      document.addEventListener("click", function(e) {
        const wrap = $6("fbm-fc-more-wrap");
        if (!wrap) return;
        const t = e.target;
        if (t && wrap.contains(t)) return;
        FBM.closeFloatMoreMenu();
      });
      FBM.refreshFloatBurgerMenu();
    }
    FBM.applyFloatChatTheme();
    const cfg = fcCfg();
    if (cfg.enabled !== false && !cfg.hidden && inChatRoom()) {
      FBM.openFloatChat();
    }
  };
  FBM.refreshFloatChatSettingsUi = function() {
    const cfg = fcCfg();
    const en = inputEl2("fbm-fc-enabled");
    if (en) en.checked = cfg.enabled !== false;
    const auto = inputEl2("fbm-fc-autoshow");
    if (auto) auto.checked = cfg.autoshow !== false;
    const autoclose = inputEl2("fbm-fc-autoclose");
    if (autoclose) autoclose.checked = !!cfg.autoCloseOnJoin;
    const hk = inputEl2("fbm-fc-hotkey");
    if (hk) hk.value = cfg.hotkey || "Alt+C";
    const size = inputEl2("fbm-fc-size");
    const sizeVal = $6("fbm-fc-size-val");
    if (size) size.value = String(cfg.fontSize || 13);
    if (sizeVal) sizeVal.textContent = (cfg.fontSize || 13) + "px";
    const tr = inputEl2("fbm-fc-transparency");
    const trVal = $6("fbm-fc-transparency-val");
    const trN = clampFcTransparency(cfg.transparency);
    if (tr) tr.value = String(trN);
    if (trVal) trVal.textContent = trN + "%";
    FBM.syncFloatFontSelectUi();
    const style = selectEl2("fbm-fc-style");
    if (style) style.value = cfg.style || "dark";
    const wrap = $6("fbm-fc-custom-wrap");
    if (wrap) wrap.hidden = (cfg.style || "dark") !== "custom";
    const css = $6("fbm-fc-css");
    if (css && !css.value) css.value = cfg.customCss || DEFAULT_CUSTOM_CSS;
    const hlOwn = inputEl2("fbm-fc-hl-own");
    if (hlOwn) hlOwn.checked = !!cfg.highlightOwn;
    const ownNames = $6("fbm-fc-own-names");
    if (ownNames) {
      const stored = Array.isArray(cfg.ownNames) ? cfg.ownNames : [];
      const defaults = playerDefaultOwnNames();
      ownNames.value = (stored.length ? stored : defaults).join("\n");
      ownNames.placeholder = defaults.join("\n") || "Your name";
    }
    const hlSeidr = inputEl2("fbm-fc-hl-seidr");
    if (hlSeidr) hlSeidr.checked = cfg.ownHighlightSeidr !== false;
    const hlColor = inputEl2("fbm-fc-hl-color");
    if (hlColor) hlColor.value = cfg.ownHighlightColor || SEIDR_HIGHLIGHT;
    const hlOthers = inputEl2("fbm-fc-hl-others");
    if (hlOthers) hlOthers.checked = !!cfg.highlightOthers;
    const wav = inputEl2("fbm-fc-whisper-avatar");
    if (wav) wav.checked = !!cfg.whisperAvatar;
    const compass = inputEl2("fbm-fc-map-compass");
    if (compass) compass.checked = !!cfg.mapCompass;
    const leaveConfirm = inputEl2("fbm-fc-confirm-leave");
    if (leaveConfirm) leaveConfirm.checked = !!cfg.confirmLeave;
    const oocProtect = inputEl2("fbm-fc-ooc-protect");
    if (oocProtect) oocProtect.checked = cfg.oocProtection !== false;
    syncOwnHighlightOptsVisibility();
    if (FBM.refreshTrustedHostsUi) FBM.refreshTrustedHostsUi();
    FBM.applyFloatChatTheme();
    FBM.refreshFloatComposeMode();
  };
  var FALLBACK_FONTS = [
    "system-ui, -apple-system, Segoe UI, sans-serif",
    "Georgia, 'Times New Roman', serif",
    "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    "'Segoe UI', Tahoma, sans-serif",
    "Verdana, Geneva, sans-serif",
    "'Trebuchet MS', sans-serif",
    "'Palatino Linotype', Palatino, serif",
    "Arial, Helvetica, sans-serif",
    "'Courier New', Courier, monospace",
    "Comic Sans MS, Comic Sans, cursive"
  ];
  function quoteFontFamily(name) {
    const n = String(name || "").trim();
    if (!n) return "";
    if (n.indexOf(",") >= 0) return n;
    if (/^[a-zA-Z0-9-]+$/.test(n)) return n;
    return "'" + n.replace(/'/g, "\\'") + "'";
  }
  FBM.collectLocalFontFamilies = async function() {
    const set = {};
    FALLBACK_FONTS.forEach(function(f) {
      set[f] = true;
    });
    try {
      if (typeof document !== "undefined" && document.fonts && typeof document.fonts.forEach === "function") {
        document.fonts.forEach(function(face) {
          const fam = String(face.family || "").replace(/^["']|["']$/g, "").trim();
          if (fam) set[quoteFontFamily(fam)] = true;
        });
      }
    } catch (e) {
    }
    try {
      const w = window;
      if (typeof w.queryLocalFonts === "function") {
        const fonts = await w.queryLocalFonts();
        for (let i = 0; i < fonts.length; i++) {
          const fam = String(fonts[i] && fonts[i].family || "").trim();
          if (fam) set[quoteFontFamily(fam)] = true;
        }
      }
    } catch (e) {
    }
    return Object.keys(set).sort(function(a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
  };
  var CUSTOM_FONT_VALUE = "__fbm_custom__";
  FBM.populateFloatFontSelect = function(fonts) {
    const sel = selectEl2("fbm-fc-font");
    if (!sel) return;
    const list = Array.isArray(fonts) && fonts.length ? fonts : FALLBACK_FONTS;
    const cfg = fcCfg();
    const current = cfg.fontFamily || FALLBACK_FONTS[0];
    sel.innerHTML = "";
    for (let i = 0; i < list.length; i++) {
      const fam = list[i];
      const opt = document.createElement("option");
      opt.value = fam;
      opt.textContent = fam.split(",")[0].replace(/^['"]|['"]$/g, "").trim() || fam;
      opt.style.fontFamily = fam;
      sel.appendChild(opt);
    }
    const customOpt = document.createElement("option");
    customOpt.value = CUSTOM_FONT_VALUE;
    customOpt.textContent = "Custom\u2026";
    sel.appendChild(customOpt);
    const match = Array.from(sel.options).some(function(o) {
      return o.value === current;
    });
    if (match) {
      sel.value = current;
    } else {
      sel.value = CUSTOM_FONT_VALUE;
      const custom = inputEl2("fbm-fc-font-custom");
      if (custom) custom.value = current.split(",")[0].replace(/^['"]|['"]$/g, "").trim() || current;
    }
    FBM.syncFloatFontCustomRow();
  };
  FBM.syncFloatFontCustomRow = function() {
    const sel = selectEl2("fbm-fc-font");
    const row = $6("fbm-fc-font-custom-row");
    if (row) row.hidden = !(sel && sel.value === CUSTOM_FONT_VALUE);
  };
  FBM.syncFloatFontSelectUi = function() {
    const sel = selectEl2("fbm-fc-font");
    const cfg = fcCfg();
    const fam = cfg.fontFamily || FALLBACK_FONTS[0];
    if (!sel) return;
    if (!sel.options.length) {
      FBM.populateFloatFontSelect(
        Array.isArray(FBM._fcFontFamilies) ? FBM._fcFontFamilies : FALLBACK_FONTS
      );
      return;
    }
    const match = Array.from(sel.options).some(function(o) {
      return o.value === fam;
    });
    if (match) sel.value = fam;
    else {
      sel.value = CUSTOM_FONT_VALUE;
      const custom = inputEl2("fbm-fc-font-custom");
      if (custom) custom.value = fam.split(",")[0].replace(/^['"]|['"]$/g, "").trim() || fam;
    }
    FBM.syncFloatFontCustomRow();
  };
  FBM.applyFloatFontChoice = function(family, display) {
    const fam = String(family || "").trim() || FALLBACK_FONTS[0];
    fcCfg().fontFamily = fam;
    FBM.saveSettings();
    FBM.applyFloatChatTheme();
    FBM.setStatus("Float chat font: " + (display || fam));
  };
  FBM.ensureFloatFontFamilies = function() {
    if (FBM._fcFontFamiliesLoading) return;
    if (Array.isArray(FBM._fcFontFamilies) && FBM._fcFontFamilies.length) {
      FBM.populateFloatFontSelect(FBM._fcFontFamilies);
      return;
    }
    FBM._fcFontFamiliesLoading = true;
    FBM.populateFloatFontSelect(FALLBACK_FONTS);
    FBM.collectLocalFontFamilies().then(function(list) {
      FBM._fcFontFamilies = list;
      FBM._fcFontFamiliesLoading = false;
      FBM.populateFloatFontSelect(list);
      FBM.syncFloatFontSelectUi();
    }).catch(function() {
      FBM._fcFontFamilies = FALLBACK_FONTS.slice();
      FBM._fcFontFamiliesLoading = false;
      FBM.populateFloatFontSelect(FALLBACK_FONTS);
    });
  };
  function syncOwnHighlightOptsVisibility() {
    const opts = $6("fbm-fc-hl-own-opts");
    const hlOwn = inputEl2("fbm-fc-hl-own");
    if (opts) opts.hidden = !(hlOwn && hlOwn.checked);
    const colorRow = $6("fbm-fc-hl-color-row");
    const hlSeidr = inputEl2("fbm-fc-hl-seidr");
    if (colorRow) colorRow.hidden = !!(hlSeidr && hlSeidr.checked);
  }
  function parseOwnNamesInput(raw) {
    const parts = String(raw || "").split(/[\n,]+/);
    const out = [];
    for (let i = 0; i < parts.length; i++) {
      const n = parts[i].trim();
      if (n && out.indexOf(n) < 0) out.push(n);
    }
    return out;
  }
  var _prevRefresh = FBM.refreshSettingsUi;
  FBM.refreshSettingsUi = function() {
    if (typeof _prevRefresh === "function") _prevRefresh();
    if (FBM.refreshFloatChatSettingsUi) FBM.refreshFloatChatSettingsUi();
  };
  var _prevBind = FBM.bindSettingsUi;
  FBM.bindSettingsUi = function() {
    if (typeof _prevBind === "function") _prevBind();
    FBM.bindFloatChatSettingsControls();
  };
  FBM.bindFloatChatSettingsControls = function() {
    function saveCfg() {
      FBM.saveSettings();
      FBM.applyFloatChatTheme();
      FBM.refreshFloatChatVisibility();
    }
    const en = inputEl2("fbm-fc-enabled");
    if (en && !en._fbmBound) {
      en._fbmBound = true;
      en.addEventListener("change", function() {
        fcCfg().enabled = !!en.checked;
        saveCfg();
        if (!en.checked) FBM.closeFloatChat();
        FBM.setStatus("Floatable Chat " + (en.checked ? "on." : "off."));
      });
    }
    const auto = inputEl2("fbm-fc-autoshow");
    if (auto && !auto._fbmBound) {
      auto._fbmBound = true;
      auto.addEventListener("change", function() {
        fcCfg().autoshow = !!auto.checked;
        saveCfg();
        FBM.setStatus("Float chat autoshow " + (auto.checked ? "on." : "off."));
        if (fcCfg().autoCloseOnJoin && !auto.checked) FBM.warnAutoCloseWithoutAutoshow();
      });
    }
    const autoclose = inputEl2("fbm-fc-autoclose");
    if (autoclose && !autoclose._fbmBound) {
      autoclose._fbmBound = true;
      autoclose.addEventListener("change", function() {
        fcCfg().autoCloseOnJoin = !!autoclose.checked;
        saveCfg();
        FBM.setStatus("Autoclose chat on join " + (autoclose.checked ? "on." : "off."));
        if (autoclose.checked && fcCfg().autoshow === false) FBM.warnAutoCloseWithoutAutoshow();
      });
    }
    const hk = inputEl2("fbm-fc-hotkey");
    if (hk && !hk._fbmBound) {
      hk._fbmBound = true;
      hk.addEventListener("change", function() {
        const v = (hk.value || "").trim() || "Alt+C";
        hk.value = v;
        fcCfg().hotkey = v;
        saveCfg();
        FBM.setStatus("Float chat hotkey: " + v);
      });
    }
    const cap = buttonEl2("fbm-fc-hotkey-capture");
    if (cap && !cap._fbmBound) {
      cap._fbmBound = true;
      cap.addEventListener("click", function() {
        if (FBM._capturingHotkey || FBM._capturingFcHotkey) return;
        FBM._capturingFcHotkey = true;
        const prev = cap.textContent;
        cap.textContent = "Listening\u2026";
        FBM.setStatus("Press a shortcut (e.g. Alt+C)\u2026 Esc cancels.");
        let timer = null;
        function finish(spec) {
          FBM._capturingFcHotkey = false;
          document.removeEventListener("keydown", onKey, true);
          if (timer) clearTimeout(timer);
          cap.textContent = prev || "Capture";
          if (spec) {
            fcCfg().hotkey = spec;
            if (hk) hk.value = spec;
            saveCfg();
            FBM.setStatus("Float chat hotkey: " + spec);
          } else FBM.setStatus("Hotkey capture cancelled.");
        }
        function onKey(e) {
          e.preventDefault();
          e.stopPropagation();
          const raw = e.key || "";
          if (raw === "Escape") {
            finish(null);
            return;
          }
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
        timer = setTimeout(function() {
          finish(null);
        }, 1e4);
      });
    }
    const size = inputEl2("fbm-fc-size");
    const sizeVal = $6("fbm-fc-size-val");
    if (size && !size._fbmBound) {
      size._fbmBound = true;
      size.addEventListener("input", function() {
        const n = Math.floor(Number(size.value) || 13);
        fcCfg().fontSize = n;
        if (sizeVal) sizeVal.textContent = n + "px";
        FBM.applyFloatChatTheme();
      });
      size.addEventListener("change", function() {
        saveCfg();
      });
    }
    const tr = inputEl2("fbm-fc-transparency");
    const trVal = $6("fbm-fc-transparency-val");
    if (tr && !tr._fbmBound) {
      tr._fbmBound = true;
      tr.addEventListener("input", function() {
        const n = clampFcTransparency(tr.value);
        fcCfg().transparency = n;
        if (trVal) trVal.textContent = n + "%";
        FBM.applyFloatChatTheme();
      });
      tr.addEventListener("change", function() {
        saveCfg();
      });
    }
    FBM.ensureFloatFontFamilies();
    const fontSel = selectEl2("fbm-fc-font");
    if (fontSel && !fontSel._fbmBound) {
      fontSel._fbmBound = true;
      fontSel.addEventListener("change", function() {
        FBM.syncFloatFontCustomRow();
        if (fontSel.value === CUSTOM_FONT_VALUE) {
          const custom = inputEl2("fbm-fc-font-custom");
          const v = custom && custom.value.trim() || "";
          if (v) FBM.applyFloatFontChoice(quoteFontFamily(v), v);
          return;
        }
        FBM.applyFloatFontChoice(fontSel.value);
      });
    }
    const fontCustom = inputEl2("fbm-fc-font-custom");
    if (fontCustom && !fontCustom._fbmBound) {
      fontCustom._fbmBound = true;
      fontCustom.addEventListener("change", function() {
        const v = (fontCustom.value || "").trim();
        if (!v) return;
        FBM.applyFloatFontChoice(quoteFontFamily(v), v);
      });
    }
    const style = selectEl2("fbm-fc-style");
    if (style && !style._fbmBound) {
      style._fbmBound = true;
      style.addEventListener("change", function() {
        const v = style.value;
        fcCfg().style = v === "light" || v === "custom" ? v : "dark";
        const wrap = $6("fbm-fc-custom-wrap");
        if (wrap) wrap.hidden = fcCfg().style !== "custom";
        saveCfg();
      });
    }
    const css = $6("fbm-fc-css");
    const apply = buttonEl2("fbm-fc-css-apply");
    if (apply && !apply._fbmBound) {
      apply._fbmBound = true;
      apply.addEventListener("click", function() {
        fcCfg().customCss = css ? css.value : "";
        fcCfg().style = "custom";
        if (style) style.value = "custom";
        saveCfg();
        FBM.setStatus("Custom float chat CSS applied.");
      });
    }
    const reset = buttonEl2("fbm-fc-css-reset");
    if (reset && !reset._fbmBound) {
      reset._fbmBound = true;
      reset.addEventListener("click", function() {
        fcCfg().style = "dark";
        fcCfg().customCss = "";
        if (style) style.value = "dark";
        if (css) css.value = DEFAULT_CUSTOM_CSS;
        const wrap = $6("fbm-fc-custom-wrap");
        if (wrap) wrap.hidden = true;
        saveCfg();
        FBM.setStatus("Float chat theme: Dark.");
      });
    }
    const openBtn = buttonEl2("fbm-fc-open");
    if (openBtn && !openBtn._fbmBound) {
      openBtn._fbmBound = true;
      openBtn.addEventListener("click", function() {
        fcCfg().enabled = true;
        if (en) en.checked = true;
        FBM.openFloatChat();
        saveCfg();
      });
    }
    function saveHighlights() {
      const cfg = fcCfg();
      const hlOwn2 = inputEl2("fbm-fc-hl-own");
      const ownNames2 = $6("fbm-fc-own-names");
      const hlSeidr2 = inputEl2("fbm-fc-hl-seidr");
      const hlColor2 = inputEl2("fbm-fc-hl-color");
      const hlOthers2 = inputEl2("fbm-fc-hl-others");
      cfg.highlightOwn = !!(hlOwn2 && hlOwn2.checked);
      let names = ownNames2 ? parseOwnNamesInput(ownNames2.value) : [];
      if (cfg.highlightOwn && !names.length) {
        names = playerDefaultOwnNames();
        if (ownNames2) ownNames2.value = names.join("\n");
      }
      cfg.ownNames = names;
      cfg.ownHighlightSeidr = !!(hlSeidr2 && hlSeidr2.checked);
      if (hlColor2 && hlColor2.value) cfg.ownHighlightColor = hlColor2.value;
      cfg.highlightOthers = !!(hlOthers2 && hlOthers2.checked);
      syncOwnHighlightOptsVisibility();
      FBM.saveSettings();
      try {
        FBM.reaugmentFloatChatLog();
      } catch (e) {
        console.warn("[FBM] reaugment highlights", e);
      }
    }
    const hlOwn = inputEl2("fbm-fc-hl-own");
    if (hlOwn && !hlOwn._fbmBound) {
      hlOwn._fbmBound = true;
      hlOwn.addEventListener("change", function() {
        if (hlOwn.checked) {
          const ownNamesEl = $6("fbm-fc-own-names");
          if (ownNamesEl && !parseOwnNamesInput(ownNamesEl.value).length) {
            ownNamesEl.value = playerDefaultOwnNames().join("\n");
          }
        }
        saveHighlights();
        FBM.setStatus("Own-name highlight " + (hlOwn.checked ? "on." : "off."));
      });
    }
    const ownNames = $6("fbm-fc-own-names");
    if (ownNames && !ownNames._fbmBound) {
      ownNames._fbmBound = true;
      ownNames.addEventListener("change", function() {
        saveHighlights();
        FBM.setStatus("Own names updated.");
      });
    }
    const hlSeidr = inputEl2("fbm-fc-hl-seidr");
    if (hlSeidr && !hlSeidr._fbmBound) {
      hlSeidr._fbmBound = true;
      hlSeidr.addEventListener("change", function() {
        saveHighlights();
      });
    }
    const hlColor = inputEl2("fbm-fc-hl-color");
    if (hlColor && !hlColor._fbmBound) {
      hlColor._fbmBound = true;
      hlColor.addEventListener("input", function() {
        saveHighlights();
      });
      hlColor.addEventListener("change", function() {
        saveHighlights();
      });
    }
    const hlOthers = inputEl2("fbm-fc-hl-others");
    if (hlOthers && !hlOthers._fbmBound) {
      hlOthers._fbmBound = true;
      hlOthers.addEventListener("change", function() {
        saveHighlights();
        FBM.setStatus(
          "Other-name body highlight " + (hlOthers.checked ? "on." : "off.")
        );
      });
    }
    const wav = inputEl2("fbm-fc-whisper-avatar");
    if (wav && !wav._fbmBound) {
      wav._fbmBound = true;
      wav.addEventListener("change", function() {
        fcCfg().whisperAvatar = !!wav.checked;
        saveCfg();
        FBM.refreshFloatComposeMode();
        FBM.setStatus("Whisper avatar " + (wav.checked ? "on." : "off."));
      });
    }
    const compass = inputEl2("fbm-fc-map-compass");
    if (compass && !compass._fbmBound) {
      compass._fbmBound = true;
      compass.addEventListener("change", function() {
        fcCfg().mapCompass = !!compass.checked;
        saveCfg();
        if (!compass.checked && typeof FBM.clearFloatChatCompassTarget === "function") {
          FBM.clearFloatChatCompassTarget();
        }
        FBM.setStatus(
          compass.checked ? "Map compass on \u2014 hover a Members name (or float-chat name) while on the map." : "Map compass off."
        );
      });
    }
    const leaveConfirm = inputEl2("fbm-fc-confirm-leave");
    if (leaveConfirm && !leaveConfirm._fbmBound) {
      leaveConfirm._fbmBound = true;
      leaveConfirm.addEventListener("change", function() {
        fcCfg().confirmLeave = !!leaveConfirm.checked;
        saveCfg();
        FBM.setStatus("Leave confirm " + (leaveConfirm.checked ? "on." : "off."));
      });
    }
    const oocProtect = inputEl2("fbm-fc-ooc-protect");
    if (oocProtect && !oocProtect._fbmBound) {
      oocProtect._fbmBound = true;
      oocProtect.addEventListener("change", function() {
        fcCfg().oocProtection = !!oocProtect.checked;
        saveCfg();
        FBM.setStatus("OOC Protection " + (oocProtect.checked ? "on." : "off."));
      });
    }
  };

  // src/ui/facePortrait.ts
  function initialsFrom(C, fallback) {
    const nick = String(C && C.Nickname || "").trim();
    const name = String(C && C.Name || "").trim();
    const s = (fallback || nick || name || "?").trim();
    if (s.length >= 2) return s.slice(0, 2).toUpperCase();
    return (s[0] || "?").toUpperCase();
  }
  function drawFaceToCanvas(character, size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#1e2329";
    ctx.fillRect(0, 0, size, size);
    let drew = false;
    try {
      if (typeof DrawCharacterSegment === "function") {
        const seg = DrawCharacterSegment(character, 80, 0, 340, 450);
        if (seg) {
          ctx.drawImage(seg, 0, 0, size, size);
          drew = true;
        }
      }
    } catch (e) {
    }
    if (!drew) {
      try {
        const src = character.Canvas || character.CanvasBlink;
        if (src && src.width > 0 && src.height > 0) {
          const overflow = typeof CanvasUpperOverflow === "number" ? CanvasUpperOverflow : 700;
          const sw = Math.min(340, src.width);
          const sh = Math.min(450, Math.max(1, src.height - overflow));
          const sx = Math.min(80, Math.max(0, src.width - sw));
          const sy = Math.min(overflow, Math.max(0, src.height - sh));
          ctx.drawImage(src, sx, sy, sw, sh, 0, 0, size, size);
          drew = true;
        }
      } catch (e2) {
        return null;
      }
    }
    return drew ? canvas : null;
  }
  FBM.paintFacePortrait = function(host, character, opts) {
    if (!host) return false;
    host.innerHTML = "";
    const size = Math.max(24, Math.min(96, Math.floor(opts && opts.size || 48)));
    const fallback = initialsFrom(character, opts && opts.fallbackName);
    if (character) {
      try {
        const url = FBM.facePortraitDataUrl(character, size);
        if (url) {
          const img = document.createElement("img");
          img.className = "fbm-fc-face-img";
          img.alt = "";
          img.draggable = false;
          img.width = size;
          img.height = size;
          img.style.cssText = "display:block;width:" + size + "px;height:" + size + "px;max-width:" + size + "px;max-height:" + size + "px;object-fit:cover;";
          img.src = url;
          host.appendChild(img);
          return true;
        }
      } catch (e) {
      }
    }
    const span = document.createElement("span");
    span.className = "fbm-fc-face-initials";
    span.textContent = fallback;
    host.appendChild(span);
    return false;
  };
  FBM.facePortraitDataUrl = function(character, size) {
    const sz = Math.max(24, Math.min(96, Math.floor(size || 48)));
    if (!character) return null;
    try {
      const canvas = drawFaceToCanvas(character, sz);
      if (!canvas) return null;
      return canvas.toDataURL("image/png");
    } catch (e) {
      return null;
    }
  };

  // src/ui/chatCompass.ts
  var hoveredMember = null;
  function getMainCanvasCtx() {
    try {
      if (typeof MainCanvas !== "undefined" && MainCanvas) {
        const mc = MainCanvas;
        if (typeof mc.save === "function" && typeof mc.beginPath === "function") {
          return mc;
        }
        if (typeof mc.getContext === "function") {
          const ctx = mc.getContext("2d");
          if (ctx) return ctx;
        }
      }
      const el = typeof FBM.getMainCanvasEl === "function" ? FBM.getMainCanvasEl() : document.getElementById("MainCanvas");
      if (el && typeof el.getContext === "function") return el.getContext("2d");
    } catch (e) {
    }
    return null;
  }
  function syncMembersCompassHighlight(mn) {
    try {
      const list = document.getElementById("fbm-fc-members-list");
      if (!list) return;
      const rows = list.querySelectorAll(".fbm-fc-mem-row");
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowMn = Number(row.getAttribute("data-mn"));
        if (mn != null && rowMn === mn) row.classList.add("fbm-fc-mem-compass-hot");
        else row.classList.remove("fbm-fc-mem-compass-hot");
      }
    } catch (e) {
    }
  }
  FBM.setFloatChatCompassTarget = function(memberNumber) {
    const n = memberNumber != null ? Number(memberNumber) : NaN;
    hoveredMember = Number.isFinite(n) && n > 0 ? n : null;
    syncMembersCompassHighlight(hoveredMember);
    if (FBM._compassDebugLog) {
      console.info("[FBM compass] target \u2192", hoveredMember);
    }
  };
  FBM.clearFloatChatCompassTarget = function() {
    hoveredMember = null;
    syncMembersCompassHighlight(null);
    if (FBM._compassDebugLog) {
      console.info("[FBM compass] target cleared");
    }
  };
  FBM.getFloatChatCompassTarget = function() {
    return hoveredMember;
  };
  function colorBrightness(color) {
    try {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return 128;
      ctx.fillStyle = color;
      const hex = String(ctx.fillStyle || "");
      if (hex.startsWith("#") && hex.length === 7) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return (r * 299 + g * 587 + b * 114) / 1e3;
      }
      const rgb = /rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(hex);
      if (rgb) {
        const r = Number(rgb[1]);
        const g = Number(rgb[2]);
        const b = Number(rgb[3]);
        return (r * 299 + g * 587 + b * 114) / 1e3;
      }
    } catch (e) {
    }
    return 128;
  }
  function drawIndicator(ctx, x, y, angle, scale, color, isDark) {
    const now = Date.now();
    ctx.save();
    try {
      ctx.translate(x, y);
      ctx.rotate(angle);
      const rollFactor = Math.sin(now / 500);
      const absRoll = Math.abs(rollFactor);
      const sign = Math.sign(rollFactor) || 1;
      const renderScaleY = Math.max(absRoll, 0.1) * sign;
      ctx.scale(scale, scale * renderScaleY);
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(2, -13);
      ctx.lineTo(-4, -6);
      ctx.lineTo(-18, -10);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-18, 10);
      ctx.lineTo(-4, 6);
      ctx.lineTo(2, 13);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      if (rollFactor > 0) {
        ctx.save();
        ctx.clip();
        const sweepX = Math.cos(now / 500) * 30;
        ctx.translate(sweepX, 0);
        const shineGrad = ctx.createLinearGradient(-10, 0, 10, 0);
        shineGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        shineGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
        shineGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = shineGrad;
        ctx.fillRect(-40, -20, 80, 40);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, " + absRoll * 0.4 + ")";
        ctx.fill();
      }
      ctx.strokeStyle = isDark ? "#fff" : "#111";
      ctx.lineWidth = 1.5 / scale + (1 - absRoll) * 2.5;
      ctx.stroke();
    } finally {
      ctx.restore();
    }
  }
  function poseHeadScale(target) {
    const activePoses = target.ActivePose || target.Pose || [];
    const poseStr = Array.isArray(activePoses) ? activePoses.join(" ") : String(activePoses);
    if (poseStr.includes("Lay") || poseStr.includes("Sleep") || poseStr.includes("Hogtied")) {
      return 0.35;
    }
    if (poseStr.includes("AllFours")) return 0.5;
    if (poseStr.includes("Kneel")) return 0.75;
    return 1;
  }
  function perceptionRange() {
    if (typeof ChatRoomMapViewPerceptionRange === "number" && isFinite(ChatRoomMapViewPerceptionRange)) {
      return ChatRoomMapViewPerceptionRange;
    }
    if (typeof FBM.mapPerceptionRange === "function") return FBM.mapPerceptionRange();
    return 7;
  }
  function targetIsOnScreenVisible(target, deltaX, deltaY, range) {
    if (typeof ChatRoomMapViewCharacterIsVisible === "function") {
      try {
        return !!ChatRoomMapViewCharacterIsVisible(target);
      } catch (e) {
      }
    }
    try {
      const pos = target.MapData && target.MapData.Pos;
      const isTile = MapManager && MapManager.Map && typeof MapManager.Map.isTileVisible === "function" ? MapManager.Map.isTileVisible : null;
      if (pos && isTile) {
        return !!isTile(pos.X, pos.Y) || !!isTile(pos);
      }
    } catch (e2) {
    }
    const mask = typeof ChatRoomMapViewVisibilityMask !== "undefined" ? ChatRoomMapViewVisibilityMask : null;
    if (mask && mask.length > 0) {
      const mapWidth = typeof ChatRoomMapViewWidth === "number" && isFinite(ChatRoomMapViewWidth) ? ChatRoomMapViewWidth : 0;
      if (!(mapWidth > 0) || !target.MapData || !target.MapData.Pos) return false;
      const tileIndex2 = target.MapData.Pos.X + target.MapData.Pos.Y * mapWidth;
      return Math.abs(deltaX) <= range && Math.abs(deltaY) <= range && !!mask[tileIndex2];
    }
    return Math.abs(deltaX) <= range && Math.abs(deltaY) <= range;
  }
  function drawCompass() {
    try {
      const cfg = FBM.settings && FBM.settings.floatChat;
      if (!cfg || !cfg.mapCompass) return;
      if (!hoveredMember) return;
      if (typeof ChatRoomMapViewIsActive !== "function" || !ChatRoomMapViewIsActive()) return;
      if (typeof Player === "undefined" || !Player || !Player.MapData || !Player.MapData.Pos) return;
      if (typeof ChatRoomCharacter === "undefined" || !Array.isArray(ChatRoomCharacter)) return;
      const target = ChatRoomCharacter.find((c) => c && c.MemberNumber === hoveredMember);
      if (!target || !target.MapData || !target.MapData.Pos) return;
      const ctx = getMainCanvasCtx();
      if (!ctx) return;
      const rect = typeof FBM.mapViewRect === "function" ? FBM.mapViewRect() : { Left: 0, Top: 0, Width: 1e3, Height: 1e3 };
      const mapLeft = rect.Left;
      const mapTop = rect.Top;
      const mapW = rect.Width;
      const mapH = rect.Height;
      const deltaX = target.MapData.Pos.X - Player.MapData.Pos.X;
      const deltaY = target.MapData.Pos.Y - Player.MapData.Pos.Y;
      const range = perceptionRange();
      const onScreen = targetIsOnScreenVisible(target, deltaX, deltaY, range);
      const scale = 0.66;
      let arrowX;
      let arrowY;
      let angle;
      if (onScreen) {
        const screen = typeof FBM.mapScreenFromTile === "function" ? FBM.mapScreenFromTile(
          target.MapData.Pos.X,
          target.MapData.Pos.Y,
          mapLeft,
          mapTop,
          mapW,
          mapH
        ) : null;
        if (!screen) return;
        const tileW = screen.TileWidth || screen.TileSize || 50;
        const tileH = screen.TileHeight || screen.TileSize || tileW;
        const poseScale = poseHeadScale(target);
        const tileCx = screen.Left + tileW / 2;
        const tileBottom = screen.Top + tileH;
        const headY = tileBottom - tileH * 1.67 * poseScale;
        angle = Math.PI / 2;
        arrowX = tileCx;
        arrowY = headY - 20 * scale - 5;
      } else {
        angle = Math.atan2(deltaY, deltaX);
        const cx = mapLeft + mapW / 2;
        const cy = mapTop + mapH / 2;
        const radius = Math.min(mapW, mapH) * 0.45;
        arrowX = cx + Math.cos(angle) * radius;
        arrowY = cy + Math.sin(angle) * radius;
      }
      const playerColor = target.LabelColor || "cyan";
      const isDark = colorBrightness(playerColor) < 128;
      drawIndicator(ctx, arrowX, arrowY, angle, scale, playerColor, isDark);
      if (FBM._compassDebugLog) {
        FBM._compassLastDraw = {
          at: Date.now(),
          mn: hoveredMember,
          mode: onScreen ? "head" : "edge",
          x: arrowX,
          y: arrowY
        };
      }
    } catch (e) {
      if (FBM._compassDebugLog) console.warn("[FBM compass] draw error", e);
    }
  }
  FBM.drawFloatChatCompass = function() {
    drawCompass();
  };
  FBM.compassDebug = function() {
    const cfg = FBM.settings && FBM.settings.floatChat;
    const mapActive = typeof ChatRoomMapViewIsActive === "function" ? !!ChatRoomMapViewIsActive() : false;
    const hooks = FBM._hookState || {};
    let targetInfo = null;
    let mode = "idle";
    if (!cfg || !cfg.mapCompass) mode = "skipped:mapCompass off";
    else if (!hoveredMember) mode = "skipped:no hover target";
    else if (!mapActive) mode = "skipped:not on map view";
    else if (typeof ChatRoomCharacter === "undefined" || !Array.isArray(ChatRoomCharacter)) {
      mode = "skipped:no ChatRoomCharacter";
    } else {
      const target = ChatRoomCharacter.find((c) => c && c.MemberNumber === hoveredMember);
      if (!target) mode = "skipped:target not in room";
      else if (!target.MapData || !target.MapData.Pos) mode = "skipped:target has no MapData.Pos";
      else if (!Player || !Player.MapData || !Player.MapData.Pos) mode = "skipped:Player has no MapData.Pos";
      else {
        const deltaX = target.MapData.Pos.X - Player.MapData.Pos.X;
        const deltaY = target.MapData.Pos.Y - Player.MapData.Pos.Y;
        const range = perceptionRange();
        const onScreen = targetIsOnScreenVisible(target, deltaX, deltaY, range);
        mode = onScreen ? "would draw:head" : "would draw:edge";
        targetInfo = {
          mn: target.MemberNumber,
          pos: { ...target.MapData.Pos },
          delta: { x: deltaX, y: deltaY },
          range,
          onScreen,
          labelColor: target.LabelColor || null
        };
      }
    }
    const ctx = getMainCanvasCtx();
    const mainKind = typeof MainCanvas === "undefined" || !MainCanvas ? "missing" : typeof MainCanvas.save === "function" ? "context2d" : typeof MainCanvas.getContext === "function" ? "element" : typeof MainCanvas;
    const out = {
      enabled: !!(cfg && cfg.mapCompass),
      hovered: hoveredMember,
      mapActive,
      hookChatRoomRun: !!hooks.floatChatCompassRun,
      hookMapDrawUi: !!hooks.floatChatCompassMapUi,
      mainCanvasKind: mainKind,
      ctxOk: !!ctx,
      playerPos: Player && Player.MapData && Player.MapData.Pos ? { ...Player.MapData.Pos } : null,
      target: targetInfo,
      mode,
      lastDraw: FBM._compassLastDraw || null,
      tip: "Hover a Members row with mapCompass on, then call FBM.compassDebug() again. Enable logs: FBM._compassDebugLog = true"
    };
    console.info("[FBM compassDebug]", out);
    return out;
  };
  FBM.installFloatChatCompass = function() {
    const runOk = FBM.tryHook(
      "floatChatCompassRun",
      "ChatRoomRun",
      20,
      function(args, next) {
        const ret = next(args);
        try {
          drawCompass();
        } catch (e) {
        }
        return ret;
      }
    );
    const uiOk = FBM.tryHook(
      "floatChatCompassMapUi",
      "ChatRoomViews.Map.DrawUi",
      30,
      function(args, next) {
        const ret = next(args);
        try {
          drawCompass();
        } catch (e) {
        }
        return ret;
      }
    );
    if (FBM._compassDebugLog) {
      console.info("[FBM compass] install hooks", { runOk: !!runOk, uiOk: !!uiOk });
    }
    return !!(runOk || uiOk);
  };

  // src/ui/membersPanel.ts
  function $7(id) {
    return document.getElementById(id);
  }
  function isAdminMember(mn) {
    try {
      return !!(ChatRoomData && Array.isArray(ChatRoomData.Admin) && ChatRoomData.Admin.indexOf(mn) >= 0);
    } catch (e) {
      return false;
    }
  }
  function isRoomWhitelisted(mn) {
    try {
      return !!(ChatRoomData && Array.isArray(ChatRoomData.Whitelist) && ChatRoomData.Whitelist.indexOf(mn) >= 0);
    } catch (e) {
      return false;
    }
  }
  function initials(nick, name) {
    const s = (nick || name || "?").trim();
    if (s.length >= 2) return s.slice(0, 2).toUpperCase();
    return (s[0] || "?").toUpperCase();
  }
  function pill(label, kind) {
    const el = document.createElement("span");
    el.className = "fbm-fc-pill fbm-fc-pill-" + kind;
    el.textContent = label;
    return el;
  }
  function adminBtn(label, title, cls, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "fbm-fc-mem-btn " + cls;
    b.textContent = label;
    b.title = title;
    b.addEventListener("click", function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      onClick();
    });
    return b;
  }
  function confirmAdmin(title, body, action, mn, status) {
    const run = function() {
      if (typeof ChatRoomAdminChatAction === "function") {
        ChatRoomAdminChatAction(action, String(mn));
        FBM.setStatus(status);
        FBM.refreshFloatMembersPanel();
      }
    };
    if (typeof FBM.openFloatChatConfirm === "function") {
      FBM.openFloatChatConfirm(title, body, run);
    } else {
      run();
    }
  }
  var membersPointerX = -1;
  var membersPointerY = -1;
  var membersHoverMn = null;
  function membersHeightPct() {
    const cfg = FBM.settings && FBM.settings.floatChat;
    const n = Number(cfg && cfg.membersHeightPct != null ? cfg.membersHeightPct : 30);
    if (!isFinite(n)) return 30;
    return Math.max(15, Math.min(70, Math.round(n)));
  }
  FBM.applyFloatMembersHeight = function() {
    const panel = $7("fbm-fc-members");
    if (!panel || panel.hidden) return;
    const pct = membersHeightPct();
    panel.style.flexGrow = "0";
    panel.style.flexShrink = "0";
    panel.style.flexBasis = pct + "%";
    panel.style.height = pct + "%";
    panel.style.maxHeight = pct + "%";
    panel.style.minHeight = "0";
    panel.style.overflow = "hidden";
  };
  FBM.floatMembersIsOpen = function() {
    const panel = $7("fbm-fc-members");
    return !!(panel && !panel.hidden);
  };
  FBM.closeFloatMembersPanel = function() {
    const panel = $7("fbm-fc-members");
    const btn = $7("fbm-fc-members-btn");
    const handle = $7("fbm-fc-members-resize");
    if (panel) {
      panel.hidden = true;
      panel.style.flex = "";
      panel.style.height = "";
      panel.style.maxHeight = "";
    }
    if (handle) handle.hidden = true;
    if (btn) btn.classList.remove("fbm-fc-on");
    membersHoverMn = null;
    membersPointerX = -1;
    membersPointerY = -1;
    if (typeof FBM.clearFloatChatCompassTarget === "function") FBM.clearFloatChatCompassTarget();
    if (FBM._fcMembersTimer) {
      clearInterval(FBM._fcMembersTimer);
      FBM._fcMembersTimer = null;
    }
  };
  FBM.toggleFloatMembersPanel = function() {
    if (FBM.floatMembersIsOpen()) FBM.closeFloatMembersPanel();
    else FBM.openFloatMembersPanel();
  };
  FBM.openFloatMembersPanel = function() {
    const panel = $7("fbm-fc-members");
    const btn = $7("fbm-fc-members-btn");
    const handle = $7("fbm-fc-members-resize");
    if (!panel) return;
    panel.hidden = false;
    if (handle) handle.hidden = false;
    if (btn) btn.classList.add("fbm-fc-on");
    FBM.applyFloatMembersHeight();
    FBM.refreshFloatMembersPanel();
    if (!FBM._fcMembersTimer) {
      FBM._fcMembersTimer = setInterval(function() {
        if (!FBM.floatMembersIsOpen()) {
          FBM.closeFloatMembersPanel();
          return;
        }
        FBM.refreshFloatMembersPanel();
      }, 2500);
    }
  };
  function reapplyMembersCompassFromPointer(list) {
    const cfg = FBM.settings && FBM.settings.floatChat;
    if (!cfg || !cfg.mapCompass || typeof FBM.setFloatChatCompassTarget !== "function") return;
    let over = false;
    try {
      over = list.matches(":hover");
    } catch (e) {
      over = false;
    }
    if (!over) return;
    let row = null;
    if (membersPointerX >= 0 && membersPointerY >= 0 && document.elementFromPoint) {
      try {
        const el = document.elementFromPoint(membersPointerX, membersPointerY);
        row = el && el.closest ? el.closest(".fbm-fc-mem-row") : null;
        if (row && !list.contains(row)) row = null;
      } catch (e2) {
        row = null;
      }
    }
    if (!row && membersHoverMn != null) {
      row = list.querySelector('.fbm-fc-mem-row[data-mn="' + membersHoverMn + '"]');
    }
    if (!row) return;
    const mn = Number(row.getAttribute("data-mn"));
    if (Number.isFinite(mn) && mn > 0) {
      membersHoverMn = mn;
      FBM.setFloatChatCompassTarget(mn);
    }
  }
  function bindMembersCompassHover() {
    const list = $7("fbm-fc-members-list");
    if (!list || list._fbmBound) return;
    list._fbmBound = true;
    list.addEventListener("mousemove", function(ev) {
      membersPointerX = ev.clientX;
      membersPointerY = ev.clientY;
    });
    list.addEventListener("mouseover", function(ev) {
      const cfg = FBM.settings && FBM.settings.floatChat;
      if (!cfg || !cfg.mapCompass || typeof FBM.setFloatChatCompassTarget !== "function") return;
      const t = ev.target;
      const row = t && t.closest ? t.closest(".fbm-fc-mem-row") : null;
      if (!row || !list.contains(row)) return;
      const mn = Number(row.getAttribute("data-mn"));
      if (Number.isFinite(mn) && mn > 0) {
        membersHoverMn = mn;
        membersPointerX = ev.clientX;
        membersPointerY = ev.clientY;
        FBM.setFloatChatCompassTarget(mn);
      }
    });
    list.addEventListener("mouseleave", function() {
      membersHoverMn = null;
      membersPointerX = -1;
      membersPointerY = -1;
      if (typeof FBM.clearFloatChatCompassTarget === "function") {
        FBM.clearFloatChatCompassTarget();
      }
    });
  }
  FBM.refreshFloatMembersPanel = function() {
    const list = $7("fbm-fc-members-list");
    if (!list) return;
    let wasHovering = false;
    try {
      wasHovering = list.matches(":hover");
    } catch (e) {
      wasHovering = false;
    }
    list.innerHTML = "";
    if (typeof ChatRoomCharacter === "undefined" || !Array.isArray(ChatRoomCharacter)) {
      const empty = document.createElement("p");
      empty.className = "fbm-fc-members-empty";
      empty.textContent = "No room members.";
      list.appendChild(empty);
      return;
    }
    const amAdmin = typeof ChatRoomPlayerIsAdmin === "function" && !!ChatRoomPlayerIsAdmin();
    const selfMn = typeof Player !== "undefined" && Player && typeof Player.MemberNumber === "number" ? Player.MemberNumber : -1;
    const chars = ChatRoomCharacter.slice().sort(function(a, b) {
      const an = String(a.Nickname || a.Name || "");
      const bn = String(b.Nickname || b.Name || "");
      return an.localeCompare(bn);
    });
    for (let i = 0; i < chars.length; i++) {
      const C = chars[i];
      if (!C || typeof C.MemberNumber !== "number") continue;
      const mn = C.MemberNumber;
      const name = String(C.Name || "");
      const nick = String(C.Nickname || "").trim() || name;
      const isSelf = mn === selfMn || typeof C.IsPlayer === "function" && C.IsPlayer();
      const row = document.createElement("div");
      row.className = "fbm-fc-mem-row" + (isSelf ? " fbm-fc-mem-self" : "");
      row.setAttribute("data-mn", String(mn));
      row.addEventListener("contextmenu", function(ev) {
        if (typeof FBM.openFcPersonContextMenu !== "function") return;
        FBM.openFcPersonContextMenu(ev, {
          mn,
          label: nick + " (" + mn + ")",
          copyId: String(mn),
          adminActions: true
        });
      });
      const av = document.createElement("div");
      av.className = "fbm-fc-mem-av";
      if (typeof FBM.paintFacePortrait === "function") {
        FBM.paintFacePortrait(av, C, { size: 36, fallbackName: initials(nick, name) });
      } else {
        av.textContent = initials(nick, name);
      }
      row.appendChild(av);
      const ident = document.createElement("div");
      ident.className = "fbm-fc-mem-ident";
      const nickEl = document.createElement("div");
      nickEl.className = "fbm-fc-mem-nick";
      nickEl.textContent = nick + (isSelf ? " (You)" : "");
      ident.appendChild(nickEl);
      if (name && name !== nick) {
        const nameEl = document.createElement("div");
        nameEl.className = "fbm-fc-mem-name";
        nameEl.textContent = name;
        ident.appendChild(nameEl);
      }
      row.appendChild(ident);
      const idEl = document.createElement("button");
      idEl.type = "button";
      idEl.className = "fbm-fc-mem-id";
      idEl.textContent = String(mn);
      idEl.title = "Copy member number";
      idEl.addEventListener("click", function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        const text = String(mn);
        const done = function() {
          FBM.setStatus("Copied ID " + text);
        };
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            navigator.clipboard.writeText(text).then(done).catch(function() {
              done();
            });
            return;
          }
        } catch (e) {
        }
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        } catch (e2) {
        }
        done();
      });
      row.appendChild(idEl);
      const rel = document.createElement("div");
      rel.className = "fbm-fc-mem-pills";
      try {
        if (typeof C.IsFriend === "function" && C.IsFriend()) rel.appendChild(pill("Friend", "friend"));
        if (typeof C.IsLoverOfPlayer === "function" && C.IsLoverOfPlayer()) {
          rel.appendChild(pill("Lover", "lover"));
        }
        if (typeof C.IsOwnedByPlayer === "function" && C.IsOwnedByPlayer()) {
          rel.appendChild(pill("Sub", "sub"));
        }
        if (typeof C.IsWhitelisted === "function" && C.IsWhitelisted() || Player && Array.isArray(Player.WhiteList) && Player.WhiteList.indexOf(mn) >= 0) {
          rel.appendChild(pill("WL", "wl"));
        }
      } catch (e) {
      }
      row.appendChild(rel);
      const perm = document.createElement("div");
      perm.className = "fbm-fc-mem-pills";
      if (isAdminMember(mn)) perm.appendChild(pill("Admin", "admin"));
      else if (isRoomWhitelisted(mn)) perm.appendChild(pill("WL", "wl"));
      else perm.appendChild(pill("Visitor", "visitor"));
      row.appendChild(perm);
      if (amAdmin && !isSelf) {
        const actions = document.createElement("div");
        actions.className = "fbm-fc-mem-actions";
        const adminOn = isAdminMember(mn);
        actions.appendChild(
          adminBtn(
            adminOn ? "-Admin" : "+Admin",
            adminOn ? "Demote admin" : "Promote to admin",
            adminOn ? "fbm-fc-mem-neg" : "fbm-fc-mem-pos",
            function() {
              confirmAdmin(
                adminOn ? "Demote admin?" : "Promote admin?",
                (adminOn ? "Remove admin from " : "Promote ") + nick + " (" + mn + ")?",
                adminOn ? "Demote" : "Promote",
                mn,
                adminOn ? "Demoted " + nick + "." : "Promoted " + nick + "."
              );
            }
          )
        );
        const wlOn = isRoomWhitelisted(mn);
        actions.appendChild(
          adminBtn(
            wlOn ? "-White" : "+White",
            wlOn ? "Remove room whitelist" : "Add room whitelist",
            wlOn ? "fbm-fc-mem-neg" : "fbm-fc-mem-ok",
            function() {
              confirmAdmin(
                wlOn ? "Unwhitelist?" : "Room whitelist?",
                (wlOn ? "Remove room whitelist for " : "Whitelist ") + nick + " (" + mn + ")?",
                wlOn ? "Unwhitelist" : "Whitelist",
                mn,
                wlOn ? "Unwhitelisted " + nick + "." : "Room-whitelisted " + nick + "."
              );
            }
          )
        );
        actions.appendChild(
          adminBtn("Kick", "Kick from room", "fbm-fc-mem-warn", function() {
            confirmAdmin(
              "Kick player?",
              "Kick " + nick + " (" + mn + ") from this room?",
              "Kick",
              mn,
              "Kicked " + nick + "."
            );
          })
        );
        actions.appendChild(
          adminBtn("+BAN", "Ban from room", "fbm-fc-mem-danger", function() {
            confirmAdmin(
              "Ban player?",
              "Ban " + nick + " (" + mn + ") from this room?",
              "Ban",
              mn,
              "Banned " + nick + "."
            );
          })
        );
        row.appendChild(actions);
      }
      list.appendChild(row);
    }
    if (wasHovering) {
      requestAnimationFrame(function() {
        reapplyMembersCompassFromPointer(list);
      });
    } else if (typeof FBM.getFloatChatCompassTarget === "function") {
      const keep = FBM.getFloatChatCompassTarget();
      if (keep != null) {
        const row = list.querySelector('.fbm-fc-mem-row[data-mn="' + keep + '"]');
        if (row) row.classList.add("fbm-fc-mem-compass-hot");
      }
    }
  };
  function bindMembersResize() {
    const handle = $7("fbm-fc-members-resize");
    const panel = $7("fbm-fc-members");
    const root = $7("fbm-float-chat");
    if (!handle || !panel || !root || handle._fbmBound) return;
    handle._fbmBound = true;
    let dragging = false;
    handle.addEventListener("pointerdown", function(ev) {
      if (panel.hidden) return;
      ev.preventDefault();
      dragging = true;
      handle.setPointerCapture(ev.pointerId);
    });
    handle.addEventListener("pointermove", function(ev) {
      if (!dragging) return;
      const body = root.querySelector(".fbm-fc-body");
      const area = body || root;
      const rect = area.getBoundingClientRect();
      const membersTop = panel.getBoundingClientRect().top;
      const totalH = rect.bottom - membersTop;
      if (!(totalH > 40)) return;
      const pct = (ev.clientY - membersTop) / totalH * 100;
      const clamped = Math.max(15, Math.min(70, Math.round(pct)));
      if (!FBM.settings.floatChat) return;
      FBM.settings.floatChat.membersHeightPct = clamped;
      FBM.applyFloatMembersHeight();
    });
    function endDrag(ev) {
      if (!dragging) return;
      dragging = false;
      try {
        handle.releasePointerCapture(ev.pointerId);
      } catch (e) {
      }
      FBM.saveSettings();
    }
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
  }
  FBM.bindFloatMembersPanel = function() {
    const close = $7("fbm-fc-members-close");
    if (close && !close._fbmBound) {
      close._fbmBound = true;
      close.addEventListener("click", function() {
        FBM.closeFloatMembersPanel();
      });
    }
    bindMembersCompassHover();
    bindMembersResize();
  };

  // src/ui/changelog.ts
  function $8(id) {
    return document.getElementById(id);
  }
  function docsUrl() {
    return String(FBM.DOCS_URL || "https://freya-bc.github.io/Freyas-Better-Maps/");
  }
  function changelogId() {
    return String(FBM.CHANGELOG_ID || "r134-major");
  }
  function isDismissed() {
    if (!FBM.settings) FBM.loadSettings();
    return !!(FBM.settings && FBM.settings.dismissedChangelogId === changelogId());
  }
  function featureListHtml() {
    const items = [
      {
        title: "Objects Build",
        body: "Floating catalog for tiles, objects, and effects \u2014 search, brush/pipet/eraser, fog, undo, and custom variants without relying on Club\u2019s map toolbar."
      },
      {
        title: "Object Settings",
        body: "Rotate, resize, recolor layers, tether, and decals from an FBM modal (works while Club chrome is hidden). Save looks as reusable variants."
      },
      {
        title: "Floatable Chat",
        body: "Seidr-styled chat panel when Club chat is collapsed on the map. Send, tag autocomplete, image embeds, and optional name highlights."
      },
      {
        title: "Copy / Paste & ghosts",
        body: "Improved AABB copy with object-settings capture, template thumbs, and a translucent paste ghost that follows your cursor."
      },
      {
        title: "Chat-split alignment",
        body: "Markers, grid, and paste previews stay locked to Club tiles when you drag the map/chat splitter (R134 square-tile layout)."
      },
      {
        title: "Hide more UI",
        body: "Collapse Club\u2019s map toolbar behind a small +, optionally hide arrow keys / SuperPowers, and keep a \u2605 on the FBM bar for SuperPowers."
      },
      {
        title: "Map helpers",
        body: "Typing bubbles, invisible-wall marks, hearing-range whisper, SuperZoom (admin), full blindfold silhouettes, and map library + autosave."
      }
    ];
    let html = '<ul class="fbm-cl-features">';
    for (let i = 0; i < items.length; i++) {
      html += "<li><strong>" + items[i].title + "</strong> \u2014 " + items[i].body + "</li>";
    }
    html += "</ul>";
    return html;
  }
  FBM.changelogMarkup = function() {
    const docs = docsUrl();
    return '<button type="button" class="fbm-cl-banner" id="fbm-cl-banner" hidden><span class="fbm-cl-banner-badge">update</span><span class="fbm-cl-banner-text">Freya\u2019s Better Maps Update</span></button><div class="fbm-cl-modal" id="fbm-cl-modal" hidden role="dialog" aria-modal="true" aria-labelledby="fbm-cl-title"><div class="fbm-cl-backdrop" id="fbm-cl-backdrop" aria-hidden="true"></div><div class="fbm-cl-card"><div class="fbm-cl-head"><div class="fbm-cl-title" id="fbm-cl-title">Freya\u2019s Better Maps Update</div><button type="button" class="fbm-icon-btn" id="fbm-cl-x" title="Close">\xD7</button></div><div class="fbm-cl-body"><p>Thank you for using Freya\u2019s Better Maps.</p><p>I\u2019m happy to announce that we released a very big update. Most of the features use the new methods from <strong>R134</strong>.</p><p class="fbm-cl-label">What\u2019s new</p>' + featureListHtml() + '<p class="fbm-cl-docs">Full player guide: <a id="fbm-cl-docs" href="' + docs + '" target="_blank" rel="noopener noreferrer">' + docs.replace(/^https?:\/\//, "") + '</a></p></div><div class="fbm-cl-actions"><button type="button" class="fbm-btn" id="fbm-cl-close">Close</button><button type="button" class="fbm-btn fbm-btn-accent" id="fbm-cl-dismiss">Close and Don\u2019t show again</button></div></div></div>';
  };
  FBM.bindChangelogUi = function() {
    if (FBM._changelogBound) return;
    FBM._changelogBound = true;
    const banner = $8("fbm-cl-banner");
    const modal = $8("fbm-cl-modal");
    if (!banner || !modal) return;
    const openModal = function() {
      modal.hidden = false;
      banner.hidden = true;
    };
    const hideModal = function() {
      modal.hidden = true;
    };
    const showBanner = function() {
      if (FBM._changelogSessionClosed || isDismissed()) {
        banner.hidden = true;
        return;
      }
      banner.hidden = false;
    };
    banner.addEventListener("click", function() {
      openModal();
    });
    const closeOnly = function() {
      hideModal();
      FBM._changelogSessionClosed = true;
      banner.hidden = true;
    };
    const dismissForever = function() {
      if (!FBM.settings) FBM.loadSettings();
      FBM.settings.dismissedChangelogId = changelogId();
      FBM.saveSettings();
      FBM._changelogSessionClosed = true;
      hideModal();
      banner.hidden = true;
      if (FBM.setStatus) FBM.setStatus("Update notice dismissed.");
    };
    const x = $8("fbm-cl-x");
    const backdrop = $8("fbm-cl-backdrop");
    const closeBtn = $8("fbm-cl-close");
    const dismissBtn = $8("fbm-cl-dismiss");
    if (x) x.addEventListener("click", closeOnly);
    if (backdrop) backdrop.addEventListener("click", closeOnly);
    if (closeBtn) closeBtn.addEventListener("click", closeOnly);
    if (dismissBtn) dismissBtn.addEventListener("click", dismissForever);
    document.addEventListener(
      "keydown",
      function(e) {
        if (!e || e.key !== "Escape" && e.code !== "Escape") return;
        if (modal.hidden) return;
        e.preventDefault();
        closeOnly();
      },
      true
    );
    FBM._changelogShowBanner = showBanner;
    FBM._changelogOpenModal = openModal;
  };
  FBM.refreshChangelogBanner = function() {
    FBM.ensureUi();
    if (FBM.bindChangelogUi) FBM.bindChangelogUi();
    if (FBM._changelogShowBanner) FBM._changelogShowBanner();
  };
  FBM.openChangelogModal = function() {
    FBM.ensureUi();
    if (FBM.bindChangelogUi) FBM.bindChangelogUi();
    if (FBM._changelogOpenModal) FBM._changelogOpenModal();
  };

  // src/ui/commands.ts
  FBM.registerChatCommands = function() {
    if (FBM._commandsRegistered) return;
    if (typeof CommandCombine !== "function") return;
    FBM._commandsRegistered = true;
    try {
      CommandCombine([
        {
          Tag: "fbm",
          Description: "[FBM] Open the Freyas Better Maps build bar (room admin)",
          Action: function() {
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
          }
        },
        {
          Tag: "build",
          Description: "[FBM] Open Objects Build catalog (room admin)",
          Action: function() {
            if (!FBM.mapIsAdmin || !FBM.mapIsAdmin()) {
              if (FBM.localMsg) FBM.localMsg("FBM: room admin required.");
              return;
            }
            FBM.ensureUi();
            if (FBM.openObjectsBuild) FBM.openObjectsBuild();
          }
        },
        {
          Tag: "chat",
          Description: "[FBM] Toggle Floatable Chat panel",
          Action: function() {
            FBM.ensureUi();
            const cfg = FBM.settings && FBM.settings.floatChat;
            if (cfg && cfg.enabled === false) {
              cfg.enabled = true;
              FBM.saveSettings();
            }
            if (FBM.toggleFloatChat) FBM.toggleFloatChat();
          }
        }
      ]);
    } catch (e) {
      FBM._commandsRegistered = false;
      console.warn("[FBM] CommandCombine failed", e);
    }
  };

  // src/main.ts
  function hasAccount() {
    return typeof Player !== "undefined" && !!Player && Player.MemberNumber != null;
  }
  function ready() {
    return hasAccount() && typeof document !== "undefined" && !!document.body && typeof PreferenceRegisterExtensionSetting === "function";
  }
  FBM.boot = function() {
    if (FBM._booted) return;
    if (!ready()) return;
    FBM._booted = true;
    FBM.registerBcModSdk();
    FBM.loadSettings();
    FBM.loadMapOverflow();
    FBM.installStorageFlush();
    FBM.loadTemplates();
    FBM._buildBarOpen = false;
    FBM.ensureUi();
    FBM.registerPreference();
    FBM.installMap();
    FBM.installDrawButtonFilter();
    FBM.patchMapViewMethods();
    FBM.applyZoomSetting();
    if (FBM.syncHideArrowKeysDom) FBM.syncHideArrowKeysDom();
    FBM.installBuildBarHotkey();
    if (FBM.installFloatChatMirror) FBM.installFloatChatMirror();
    if (FBM.installFloatChatComposeKeys) FBM.installFloatChatComposeKeys();
    if (FBM.installFloatChatCompass) FBM.installFloatChatCompass();
    if (FBM.installFloatChatHotkey) FBM.installFloatChatHotkey();
    if (FBM.installFloatChatVisibilityWatch) FBM.installFloatChatVisibilityWatch();
    if (FBM.registerChatCommands) FBM.registerChatCommands();
    if (FBM.refreshChangelogBanner) {
      setTimeout(function() {
        FBM.refreshChangelogBanner();
      }, 400);
    }
    FBM.tryHook("chatRoomLoad", "ChatRoomLoad", 0, function(args, next) {
      const ret = next(args);
      FBM.installMap();
      FBM.installDrawButtonFilter();
      FBM.patchMapViewMethods();
      if (FBM.registerChatCommands) FBM.registerChatCommands();
      if (FBM.applyZoomSetting) FBM.applyZoomSetting();
      if (FBM.syncHideArrowKeysDom) FBM.syncHideArrowKeysDom();
      if (FBM.closeBuildBarIfOffMap) FBM.closeBuildBarIfOffMap();
      else FBM.refreshBuildBar();
      if (FBM.installFloatChatMirror) FBM.installFloatChatMirror();
      if (FBM.installFloatChatCompass) FBM.installFloatChatCompass();
      FBM._floatChatBackfilled = false;
      if (FBM.refreshFloatChatVisibility) FBM.refreshFloatChatVisibility();
      if (FBM.maybeAutoCloseChatOnJoin) {
        setTimeout(function() {
          FBM.maybeAutoCloseChatOnJoin();
        }, 0);
        setTimeout(function() {
          FBM.maybeAutoCloseChatOnJoin();
        }, 120);
      }
      return ret;
    });
    FBM.tryHook("commonSetScreen", "CommonSetScreen", 0, function(args, next) {
      const ret = next(args);
      if (FBM.applyZoomSetting) FBM.applyZoomSetting();
      if (FBM.closeBuildBarIfOffMap) FBM.closeBuildBarIfOffMap();
      else if (FBM.refreshBuildBar) FBM.refreshBuildBar();
      if (FBM.refreshFloatChatVisibility) FBM.refreshFloatChatVisibility();
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
})();
})();

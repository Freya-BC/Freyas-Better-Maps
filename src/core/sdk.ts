/** Freyas Better Maps — core/sdk.js */
import { FBM } from "../fbm";

/** Resolve `Foo.Bar.Baz` on globalThis (ModSDK dotted paths). */
FBM.resolveGlobalPath = function (name) {
	if (!name || typeof name !== "string") return undefined;
	const parts = name.split(".");
	let cur: unknown = globalThis;
	for (let i = 0; i < parts.length; i++) {
		if (cur == null || (typeof cur !== "object" && typeof cur !== "function")) return undefined;
		cur = (cur as Record<string, unknown>)[parts[i]];
	}
	return cur;
};

FBM.registerBcModSdk = function () {
	if (FBM.bcMod) return FBM.bcMod;
	if (typeof bcModSdk !== "undefined" && bcModSdk && typeof bcModSdk.registerMod === "function") {
		const info = {
			name: "FreyasBetterMaps",
			fullName: FBM.FULL_NAME || "Freyas Better Maps",
			version: FBM.VERSION,
			...(FBM.REPO_URL ? { repository: FBM.REPO_URL } : {}),
		};
		FBM.bcMod = bcModSdk.registerMod(info);
	}
	return FBM.bcMod || null;
};

FBM.hookFunction = function (name, priority, hook) {
	const sdk = FBM.registerBcModSdk();
	if (sdk && typeof sdk.hookFunction === "function") {
		sdk.hookFunction(name, priority, hook);
		return true;
	}
	/* No ModSDK: dotted paths need object property wrap; bare names use window. */
	const parts = String(name || "").split(".");
	if (parts.length === 1) {
		const win = window as unknown as Record<string, unknown>;
		const original = win[name];
		if (typeof original !== "function") {
			console.warn("[FBM] Cannot hook missing function " + name);
			return false;
		}
		win[name] = function (...args: unknown[]) {
			return hook(args, function (nextArgs) {
				return (original as (...a: unknown[]) => unknown).apply(window, nextArgs || args);
			});
		};
		return true;
	}
	let parent: unknown = globalThis;
	for (let i = 0; i < parts.length - 1; i++) {
		if (parent == null || (typeof parent !== "object" && typeof parent !== "function")) {
			console.warn("[FBM] Cannot hook missing path " + name);
			return false;
		}
		parent = (parent as Record<string, unknown>)[parts[i]];
	}
	const key = parts[parts.length - 1];
	if (parent == null || (typeof parent !== "object" && typeof parent !== "function")) {
		console.warn("[FBM] Cannot hook missing path " + name);
		return false;
	}
	const obj = parent as Record<string, unknown>;
	const original = obj[key];
	if (typeof original !== "function") {
		console.warn("[FBM] Cannot hook missing function " + name);
		return false;
	}
	console.warn("[FBM] ModSDK missing — raw wrap of " + name + " (may trip BCX if ModSDK loads later)");
	obj[key] = function (this: unknown, ...args: unknown[]) {
		return hook(args, function (nextArgs) {
			return (original as (...a: unknown[]) => unknown).apply(this, nextArgs || args);
		});
	};
	return true;
};

FBM.tryHook = function (stateKey, name, priority, hook) {
	FBM._hookState = FBM._hookState || {};
	if (FBM._hookState[stateKey || name]) return true;
	const target = FBM.resolveGlobalPath(name);
	if (typeof target !== "function") return false;
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

/** Club canvas arrow pad + SuperPowers (R133 DrawUi) — 790..990 × 860..1000. */
FBM.shouldSuppressMapArrowButtons = function (x, y) {
	if (!FBM.settings || !FBM.settings.hideArrowKeys) return false;
	if (typeof ChatRoomMapViewIsActive === "function" && !ChatRoomMapViewIsActive()) return false;
	x = Number(x);
	y = Number(y);
	if (!isFinite(x) || !isFinite(y)) return false;
	return x >= 790 && x <= 990 && y >= 860 && y <= 1000;
};

/**
 * R134+: movement pad + SuperPowers are HTML `#chat-room-map-controls` (not canvas).
 * Toggle body + element class every sync so a stuck hide never survives “option off”.
 */
FBM.syncHideArrowKeysDom = function () {
	const on = !!(FBM.settings && FBM.settings.hideArrowKeys);
	if (typeof document !== "undefined" && document.body) {
		document.body.classList.toggle("fbm-hide-arrow-keys", on);
	}
	const controls =
		typeof ElementWrap === "function"
			? ElementWrap("chat-room-map-controls")
			: typeof document !== "undefined"
				? document.getElementById("chat-room-map-controls")
				: null;
	if (controls && controls.classList) {
		controls.classList.toggle("fbm-arrow-keys-hidden", on);
		if (!on) {
			/* Clear accidental inline hides from older experiments / stuck styles. */
			if (controls.style) {
				if (controls.style.display === "none") controls.style.removeProperty("display");
				if (controls.style.visibility === "hidden") controls.style.removeProperty("visibility");
				if (controls.style.pointerEvents === "none") controls.style.removeProperty("pointer-events");
			}
			controls.removeAttribute("aria-hidden");
			controls.removeAttribute("inert");
		}
	}
};

/**
 * Persistent DrawButton filter — hides Club left map chrome while collapsed,
 * and the arrow / SuperPowers pad when Hide Arrow Keys is on.
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
		if (FBM.shouldSuppressMapArrowButtons && FBM.shouldSuppressMapArrowButtons(Left, Top)) {
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
 * Hook ChatRoomViews.Map.DrawUi / Click / KeyDown via ModSDK (dotted paths).
 * ChatRoomActiveView is the same object as ChatRoomViews.Map, so property hooks apply.
 * Raw assignment here trips BCX when another mod already tracks the path.
 */
FBM.patchMapViewMethods = function () {
	if (typeof ChatRoomViews === "undefined" || !ChatRoomViews || !ChatRoomViews.Map) return false;

	const drawOk = FBM.tryHook("mapViewDrawUi", "ChatRoomViews.Map.DrawUi", 10, function (args, next) {
		FBM.installDrawButtonFilter();
		const ret = next(args);
		FBM.withLeftDrawButtons(function () {
			if (FBM.drawMapChromeButtons) FBM.drawMapChromeButtons();
		});
		if (FBM.refreshBuildBar) FBM.refreshBuildBar();
		return ret;
	});

	const clickOk = FBM.tryHook("mapViewClick", "ChatRoomViews.Map.Click", 10, function (args, next) {
		if (FBM.handleMapChromeClick && FBM.handleMapChromeClick()) return;
		const view = FBM.mapViewRect ? FBM.mapViewRect() : { Left: 0, Top: 0, Width: 1000, Height: 1000 };
		const mapClick = function () {
			try {
				return (
					FBM.mapTileFromMouse &&
					FBM.mapTileFromMouse(MouseX, MouseY, view.Left, view.Top, view.Width, view.Height)
				);
			} catch (e) {
				console.error("[FBM] mapTileFromMouse", e);
				return null;
			}
		};
		const onMap =
			typeof MouseX === "number" &&
			typeof MouseY === "number" &&
			MouseX >= view.Left &&
			MouseX < view.Left + view.Width &&
			MouseY >= view.Top &&
			MouseY < view.Top + view.Height;
		if (
			onMap &&
			FBM._objectSettings &&
			(FBM._objectSettings.pick || FBM._objectSettings.color?.eyedrop || FBM._objectSettings.panelOpen)
		) {
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
	});

	FBM.tryHook("mapViewKeyDown", "ChatRoomViews.Map.KeyDown", 20, function (args, next) {
		if (FBM.mapTypingTargetActive && FBM.mapTypingTargetActive()) {
			if (FBM.clearMapMoveKeys) FBM.clearMapMoveKeys();
			return false;
		}
		return next(args);
	});

	return !!(drawOk && clickOk);
};

/** @deprecated use patchMapViewMethods */
FBM.rebindMapViewMethods = function () {
	return FBM.patchMapViewMethods();
};

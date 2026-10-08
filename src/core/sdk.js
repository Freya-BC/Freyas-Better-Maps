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

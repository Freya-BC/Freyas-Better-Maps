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

/** Freyas Better Maps — boot after login */
import { FBM } from "./fbm";

import "./defaults";
import "./core/lz";
import "./core/storage";
import "./core/sdk";
import "./map/model";
import "./map/sync";
import "./map/library";
import "./map/copy";
import "./map/hooks";
import "./ui/styles";
import "./ui/shell";
import "./ui/settings";
import "./ui/buildBar";

function hasAccount(): boolean {
	return typeof Player !== "undefined" && !!Player && Player.MemberNumber != null;
}

function ready(): boolean {
	return (
		hasAccount() &&
		typeof document !== "undefined" &&
		!!document.body &&
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

	FBM.tryHook("chatRoomLoad", "ChatRoomLoad", 0, function (args: unknown[], next: (a: unknown[]) => unknown) {
		const ret = next(args);
		FBM.installMap();
		FBM.installDrawButtonFilter();
		FBM.patchMapViewMethods();
		FBM.refreshBuildBar();
		return ret;
	});

	console.info("[FBM] Freyas Better Maps v" + FBM.VERSION + " ready");
};

function waitBoot(): void {
	if (ready()) {
		FBM.boot();
		return;
	}
	setTimeout(waitBoot, 250);
}

waitBoot();

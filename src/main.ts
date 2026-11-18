/** Freyas Better Maps — boot after login */
import { FBM } from "./fbm";

import "./defaults";
import "./core/lz";
import "./core/storage";
import "./core/sdk";
import "./map/model";
import "./map/sync";
import "./map/library";
import "./map/ghost";
import "./map/copy";
import "./map/catalog";
import "./map/objectsStore";
import "./map/objectsPaint";
import "./map/hooks";
import "./ui/styles";
import "./ui/dialogs";
import "./ui/shell";
import "./ui/settings";
import "./ui/buildBar";
import "./ui/objectsBuild";
import "./ui/objectSettings";
import "./ui/floatableChat";
import "./ui/facePortrait";
import "./ui/chatCompass";
import "./ui/membersPanel";
import "./ui/changelog";
import "./ui/commands";

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
		setTimeout(function () {
			FBM.refreshChangelogBanner();
		}, 400);
	}

	FBM.tryHook("chatRoomLoad", "ChatRoomLoad", 0, function (args: unknown[], next: (a: unknown[]) => unknown) {
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
		/* Club finishes chat DOM / map split after Load — collapse on next ticks. */
		if (FBM.maybeAutoCloseChatOnJoin) {
			setTimeout(function () {
				FBM.maybeAutoCloseChatOnJoin();
			}, 0);
			setTimeout(function () {
				FBM.maybeAutoCloseChatOnJoin();
			}, 120);
		}
		return ret;
	});

	/* Leave chat / change screen — close build bar if we are no longer on the map. */
	FBM.tryHook("commonSetScreen", "CommonSetScreen", 0, function (args: unknown[], next: (a: unknown[]) => unknown) {
		const ret = next(args);
		if (FBM.applyZoomSetting) FBM.applyZoomSetting();
		if (FBM.closeBuildBarIfOffMap) FBM.closeBuildBarIfOffMap();
		else if (FBM.refreshBuildBar) FBM.refreshBuildBar();
		if (FBM.refreshFloatChatVisibility) FBM.refreshFloatChatVisibility();
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

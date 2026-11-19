/**
 * Shared Freyas Better Maps namespace (window.FreyasBetterMaps / window.FBM).
 * Methods are attached by side-effect modules; Club APIs come from bc-stubs.
 */

export interface FBMSettings {
	version: string;
	typingIndicator: boolean;
	hideBuildToolbar: boolean;
	buildingTools: boolean;
	fullBlindfold: boolean;
	blindfoldOthersStyle: string;
	hearingWhisper: boolean;
	fullZoomOut: boolean;
	hideRoomUpdateSpam: boolean;
	roomUpdateHideCooldownMin: number;
	/** Hide Club map arrow pad + SuperPowers; side-bar star toggles SuperPowers. */
	hideArrowKeys: boolean;
	gridOn: boolean;
	showInvisibleWalls: boolean;
	copyObjectSettings: boolean;
	/** Objects Build placement hover ghost (valid cells only). Default on. */
	placementGhost: boolean;
	buildBarHotkey: string;
	ui: {
		left: number | null;
		top: number | null;
		width: number;
		height: number;
	};
	floatChat: {
		enabled: boolean;
		autoshow: boolean;
		/** Collapse Club chat when joining a MAP (Always) room — not Hybrid/Never. */
		autoCloseOnJoin: boolean;
		hotkey: string;
		hidden: boolean;
		style: "dark" | "light" | "custom";
		fontSize: number;
		/** Panel see-through 0–60 (0 ≈ solid, 60 ≈ glass). Alpha = 1 − value/100. */
		transparency: number;
		fontFamily: string;
		customCss: string;
		/** Permanent image-host origins (e.g. https://i.imgur.com). */
		trustedHosts: string[];
		highlightOwn: boolean;
		/** Names/words to highlight in message bodies. */
		ownNames: string[];
		/** Use Seidr gold accent instead of ownHighlightColor. */
		ownHighlightSeidr: boolean;
		ownHighlightColor: string;
		/** Highlight other room members' names inside message bodies (Seidr color; not sender labels). */
		highlightOthers: boolean;
		/** Show target face crop beside float input while whispering. */
		whisperAvatar: boolean;
		/** Draw map compass arrow when hovering a name in float chat. */
		mapCompass: boolean;
		/** Confirm before Leave toolbar action. */
		confirmLeave: boolean;
		/** Refuse send when message body has unbalanced (). Default on. */
		oocProtection: boolean;
		/** Members pane height as % of log+members area (15–70). */
		membersHeightPct: number;
		ui: {
			left: number | null;
			top: number | null;
			width: number;
			height: number;
		};
	};
	maps: unknown[];
	autosave: unknown;
	/** Changelog id dismissed via “Don’t show again” (matches FBM.CHANGELOG_ID, not VERSION). */
	dismissedChangelogId: string;
	[key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FBMNamespace = Record<string, any>;

/** DOM nodes that store one-time FBM event bindings. */
export interface FBMMarkedElement extends HTMLElement {
	_fbmBound?: boolean;
	_fbmPendingObs?: boolean;
}

export const FBM: FBMNamespace = {};

declare global {
	interface Window {
		FreyasBetterMaps: FBMNamespace;
		FBM: FBMNamespace;
		__FreyasBetterMapsPageLoaded?: boolean;
		__FreyasBetterMapsLoader?: boolean;
	}
}

window.FreyasBetterMaps = FBM;
window.FBM = FBM;

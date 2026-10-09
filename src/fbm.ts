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
	gridOn: boolean;
	buildBarHotkey: string;
	ui: {
		left: number | null;
		top: number | null;
		width: number;
		height: number;
	};
	maps: unknown[];
	autosave: unknown;
	[key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FBMNamespace = Record<string, any>;

/** DOM nodes that store one-time FBM event bindings. */
export interface FBMMarkedElement extends HTMLElement {
	_fbmBound?: boolean;
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

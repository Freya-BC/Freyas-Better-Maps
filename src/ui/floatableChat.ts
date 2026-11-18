/** Freyas Better Maps — Floatable Chat */
import { FBM, type FBMMarkedElement } from "../fbm";

declare const ChatRoomMapViewSplitPosition: number | undefined;
declare function ChatRoomMapViewSetSplitPosition(width: number): void;
declare function ElementSetSize(id: string, width: number, height?: number): void;
declare const GetCommands: (() => Array<{ Tag?: string; Description?: string }>) | undefined;
declare const ElementValue: ((id: string, value?: string) => string | void) | undefined;
declare const ChatRoomSendChat: (() => void) | undefined;
declare const ChatRoomTargetMemberNumber: number | undefined;
declare const ChatRoomSetTarget: ((memberNumber: number) => void) | undefined;
declare const ChatRoomMapViewIsActive: (() => boolean) | undefined;
declare const ChatRoomMapViewHasSuperPowers: (() => boolean) | undefined;
declare const ChatRoomMapViewCharacterOnWhisperRange:
	| ((C: { MemberNumber?: number }) => boolean)
	| undefined;
declare const ChatRoomKeyDown: ((event: { key: string; preventDefault?: () => void; stopImmediatePropagation?: () => void }) => unknown) | undefined;
declare const ChatRoomAttemptLeave: (() => void) | undefined;
declare const ChatRoomToggleKneel: (() => void) | undefined;
declare const ChatRoomOpenWardrobeScreen: (() => void) | undefined;
declare const ChatRoomOpenInformationScreen: (() => void) | undefined;
declare const ChatRoomOpenAdminScreen: (() => void) | undefined;
declare const ChatRoomStatusUpdate: ((status: string) => void) | undefined;
declare const InformationSheetLoadCharacter: ((C: unknown) => void) | undefined;
declare const CommonSetScreen: ((module: string, screen: string) => void) | undefined;
declare const PreferenceOpenSubscreen: ((subscreen: string, page?: number) => void | Promise<void>) | undefined;
declare const ElementScrollToEnd: ((id: string) => void) | undefined;
declare const Commands: Array<{ Tag?: string; Description?: string }> | undefined;
declare const CurrentScreen: string | undefined;
declare const CurrentCharacter: { MemberNumber?: number } | null | undefined;
declare const ChatRoomPlayerIsAdmin: (() => boolean) | undefined;
declare const ChatRoomAdminChatAction: ((action: string, argument: string) => void) | undefined;
declare const ChatRoomListUpdate:
	| ((list: number[], adding: boolean, memberNumber: number, notification?: string) => void)
	| undefined;
declare const ChatRoomCharacter: Array<{
	MemberNumber?: number;
	Name?: string;
	Nickname?: string;
	LabelColor?: string;
	Canvas?: HTMLCanvasElement;
}> | undefined;
declare const ChatRoomData:
	| {
			Name?: string;
			Limit?: number;
			MemberLimit?: number;
	  }
	| undefined;
declare const Player: {
	MemberNumber?: number;
	Name?: string;
	Nickname?: string;
	LabelColor?: string;
	FriendList?: number[];
	WhiteList?: number[];
	BlackList?: number[];
	FriendNames?: { get?: (n: number) => string | undefined };
	IsKneeling?: () => boolean;
} | undefined;

// ===== SECTION: Types, constants, module state =====

type SeidrGlobal = {
	rmOpenPanel?: () => void;
	setCommandInput?: (el: HTMLTextAreaElement | HTMLInputElement | null) => void;
	getCommandInput?: () => HTMLTextAreaElement | HTMLInputElement | null;
	cmdAcIsOpen?: () => boolean;
	cmdAcHandleKeyDown?: (ev: KeyboardEvent) => boolean;
	rmUpdateLauncherVisibility?: () => void;
};

declare global {
	interface Window {
		Seidr?: SeidrGlobal;
	}
}

const LOG_CAP = 400;
const SEIDR_HIGHLIGHT = "#d4a017";
/** Club chat DIVs already mirrored — content-based keys collide on same-second repeats. */
const mirroredClubDivs = new WeakSet<Element>();
let fcMsgSeq = 0;
/** Session mute: exact message body from a member (`memberNumber\\nbody`). Cleared on reload. */
const mutedExactMessages = new Set<string>();
const DEFAULT_CUSTOM_CSS = `#fbm-float-chat {
  --fbm-fc-bg: rgba(28, 22, 38, 0.96);
  --fbm-fc-surface: rgba(42, 34, 56, 0.95);
  --fbm-fc-text: #f0e6d4;
  --fbm-fc-muted: #a898b0;
  --fbm-fc-accent: #d4a017;
  --fbm-fc-border: rgba(255, 255, 255, 0.12);
}`;

/** Built-in CDNs (WCE parity). Not listed under permanent hosts. */
const BUILTIN_IMAGE_HOSTS = [
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
	"www.bondageprojects.com",
];

/** Session-only trusted origins; cleared on full page reload / relog. */
const sessionTrustedOrigins = new Map<string, "allowed" | "denied">();

type FcType = "chat" | "whisper" | "emote" | "action" | "system" | "beep";
type FcDirection = "from" | "to" | null;
type FcComposeMode = "chat" | "whisper" | "beep";
type FcReplyKind = "chat" | "whisper" | "beep";

type FcReplyPreview = { name: string; body: string };

type FcMsg = {
	type: FcType;
	name: string;
	body: string;
	time: string;
	/** Conversation partner (context / reply / name click). */
	id: string | null;
	color: string | null;
	key: string;
	direction?: FcDirection;
	targetId?: string | null;
	senderId?: string | null;
	msgid?: string | null;
	replyPreview?: FcReplyPreview | null;
	/** WCE `bce-pending` local echo (lag indicator). */
	pending?: boolean;
	nonce?: string | null;
};

/** Only paint WCE pending in float chat if the server ack is slower than this. */
const PENDING_LAG_MS = 180;

type PendingTrack = {
	nonce: string;
	timer: ReturnType<typeof setTimeout> | null;
	msg: FcMsg;
	shown: boolean;
};

const pendingByNonce = new Map<string, PendingTrack>();

type FcReplyState = {
	kind: FcReplyKind;
	partnerId: string;
	partnerName: string;
	msgid: string | null;
	snippet: string;
};

const TARGET_STRIP_RE = /^\/(beep|whisper|w)\s+\S+\s?/iu;
let floatReplyState: FcReplyState | null = null;
let whisperAvatarMn: number | null = null;

type EmbedKind = "img" | "none" | "untrusted";

// ===== SECTION: DOM helpers, URL trust, name highlighting =====

function $(id: string): FBMMarkedElement | null {
	return document.getElementById(id) as FBMMarkedElement | null;
}

function inputEl(id: string): (HTMLInputElement & FBMMarkedElement) | null {
	return document.getElementById(id) as (HTMLInputElement & FBMMarkedElement) | null;
}

function selectEl(id: string): (HTMLSelectElement & FBMMarkedElement) | null {
	return document.getElementById(id) as (HTMLSelectElement & FBMMarkedElement) | null;
}

function buttonEl(id: string): (HTMLButtonElement & FBMMarkedElement) | null {
	return document.getElementById(id) as (HTMLButtonElement & FBMMarkedElement) | null;
}

function fcCfg() {
	if (!FBM.settings) FBM.loadSettings();
	if (!FBM.settings.floatChat) {
		FBM.settings.floatChat = JSON.parse(
			JSON.stringify((FBM.DEFAULT_SETTINGS && FBM.DEFAULT_SETTINGS.floatChat) || {})
		);
	}
	return FBM.settings.floatChat;
}

function parseHttpUrl(word: string): URL | null {
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

function isBuiltinImageHost(host: string): boolean {
	return BUILTIN_IMAGE_HOSTS.indexOf(host) >= 0;
}

function permanentTrustedOrigins(): string[] {
	const list = fcCfg().trustedHosts;
	return Array.isArray(list) ? (list as string[]) : [];
}

function isOriginTrusted(origin: string, host: string): boolean {
	if (isBuiltinImageHost(host)) return true;
	if (sessionTrustedOrigins.get(origin) === "allowed") return true;
	const perm = permanentTrustedOrigins();
	for (let i = 0; i < perm.length; i++) {
		if (perm[i] === origin) return true;
	}
	return false;
}

function embedKindForUrl(url: URL): EmbedKind {
	/* Pathname only — Discord keeps .ext before ?. */
	if (!/\/[^/]+\.(png|jpe?g|webp|gif)$/i.test(url.pathname)) return "none";
	return isOriginTrusted(url.origin, url.host) ? "img" : "untrusted";
}

function ownHighlightColor(): string {
	const cfg = fcCfg();
	if (cfg.ownHighlightSeidr !== false) return SEIDR_HIGHLIGHT;
	const c = String(cfg.ownHighlightColor || "").trim();
	return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(c) ? c : SEIDR_HIGHLIGHT;
}

function playerDefaultOwnNames(): string[] {
	const out: string[] = [];
	try {
		if (typeof Player !== "undefined" && Player) {
			const nick =
				Player.Nickname && String(Player.Nickname).trim()
					? String(Player.Nickname).trim()
					: "";
			const name = Player.Name && String(Player.Name).trim() ? String(Player.Name).trim() : "";
			if (nick) out.push(nick);
			if (name && out.indexOf(name) < 0) out.push(name);
		}
	} catch (e) {
		/* ignore */
	}
	return out;
}

function ownNamePatterns(): string[] {
	const cfg = fcCfg();
	if (!cfg.highlightOwn) return [];
	const list = Array.isArray(cfg.ownNames) ? cfg.ownNames : [];
	const cleaned = list
		.map(function (s) {
			return String(s || "").trim();
		})
		.filter(Boolean);
	return cleaned.length ? cleaned : playerDefaultOwnNames();
}

/** Other room members’ Nickname/Name for in-body highlights (not the sender label). */
function otherRoomNamePatterns(): string[] {
	const cfg = fcCfg();
	if (!cfg.highlightOthers) return [];
	const selfMn =
		typeof Player !== "undefined" && Player && Player.MemberNumber != null
			? Player.MemberNumber
			: null;
	const out: string[] = [];
	const seen: Record<string, boolean> = {};
	const push = function (s: string) {
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
				if (!C || (selfMn != null && C.MemberNumber === selfMn)) continue;
				if (C.Nickname) push(String(C.Nickname));
				if (C.Name) push(String(C.Name));
			}
		}
	} catch (e) {
		/* ignore */
	}
	return out;
}

type HlKind = "own" | "other";

function bodyHighlightEntries(): { name: string; kind: HlKind }[] {
	const own = ownNamePatterns();
	const others = otherRoomNamePatterns();
	const ownKeys: Record<string, boolean> = {};
	for (let i = 0; i < own.length; i++) ownKeys[own[i].toLowerCase()] = true;
	const entries: { name: string; kind: HlKind }[] = [];
	for (let i = 0; i < own.length; i++) entries.push({ name: own[i], kind: "own" });
	for (let i = 0; i < others.length; i++) {
		if (ownKeys[others[i].toLowerCase()]) continue;
		entries.push({ name: others[i], kind: "other" });
	}
	/* Longer names first so “Test1” wins over “Test”. */
	entries.sort(function (a, b) {
		return b.name.length - a.name.length;
	});
	return entries;
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function appendHighlightedText(parent: Node, text: string) {
	const entries = bodyHighlightEntries();
	if (!entries.length || !text) {
		parent.appendChild(document.createTextNode(text || ""));
		return;
	}
	let re: RegExp;
	try {
		re = new RegExp(
			"\\b(" + entries.map(function (e) {
				return escapeRegExp(e.name);
			}).join("|") + ")\\b",
			"gi"
		);
	} catch (e) {
		parent.appendChild(document.createTextNode(text));
		return;
	}
	const ownColor = ownHighlightColor();
	const kindFor = function (matched: string): HlKind {
		const key = matched.toLowerCase();
		for (let i = 0; i < entries.length; i++) {
			if (entries[i].name.toLowerCase() === key) return entries[i].kind;
		}
		return "own";
	};
	let last = 0;
	let m: RegExpExecArray | null;
	re.lastIndex = 0;
	while ((m = re.exec(text))) {
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

function scrollFloatLogIfNeeded(wasAtEnd: boolean) {
	const log = $("fbm-fc-log");
	if (log && wasAtEnd) log.scrollTop = log.scrollHeight;
}

// ===== SECTION: Trusted image hosts and message body rendering =====

FBM.trustFloatChatOrigin = function (origin: string, permanent: boolean) {
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

FBM.addTrustedHost = function (origin: string) {
	const cfg = fcCfg();
	const list = Array.isArray(cfg.trustedHosts) ? cfg.trustedHosts.slice() : [];
	if (list.indexOf(origin) < 0) list.push(origin);
	cfg.trustedHosts = list;
	sessionTrustedOrigins.set(origin, "allowed");
	FBM.saveSettings();
};

FBM.removeTrustedHost = function (origin: string) {
	const cfg = fcCfg();
	cfg.trustedHosts = (Array.isArray(cfg.trustedHosts) ? cfg.trustedHosts : []).filter(function (h) {
		return h !== origin;
	});
	sessionTrustedOrigins.delete(origin);
	FBM.saveSettings();
	FBM.refreshTrustedHostsUi();
	FBM.reaugmentFloatChatLog();
};

FBM.refreshTrustedHostsUi = function () {
	const listEl = $("fbm-trusted-host-list");
	const empty = $("fbm-trusted-host-empty");
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
		del.addEventListener("click", function () {
			FBM.removeTrustedHost(origin);
			FBM.setStatus("Removed trusted host.");
		});
		row.appendChild(span);
		row.appendChild(del);
		listEl.appendChild(row);
	}
};

function fillMessageBodyContent(bodyEl: HTMLElement, text: string, wasAtEnd: boolean) {
	bodyEl.textContent = "";
	const words: string[] = [text || ""];
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
				img.onload = function () {
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
					trustSession.addEventListener("click", function (e) {
						e.preventDefault();
						e.stopPropagation();
						FBM.trustFloatChatOrigin(url.origin, false);
					});
					const trustPerm = document.createElement("button");
					trustPerm.type = "button";
					trustPerm.className = "fbm-fc-trust-link fbm-fc-trust-link-perm";
					trustPerm.textContent = "Trust permanently";
					trustPerm.title = "Trust " + url.origin + " permanently";
					trustPerm.addEventListener("click", function (e) {
						e.preventDefault();
						e.stopPropagation();
						FBM.trustFloatChatOrigin(url.origin, true);
					});
					wrap.appendChild(trustSession);
					wrap.appendChild(document.createTextNode(" · "));
					wrap.appendChild(trustPerm);
					bodyEl.appendChild(wrap);
				}
			}
		} else {
			appendHighlightedText(bodyEl, words[i]);
		}
	}
}

/** Conversation partner for reply / name-click (target on outgoing whisper/beep). */
function msgPartnerId(m: FcMsg): string | null {
	if ((m.type === "whisper" || m.type === "beep") && m.direction === "to" && m.targetId) {
		return m.targetId;
	}
	return m.id || m.senderId || null;
}

function applySpeakerNameStyle(nameEl: HTMLElement, m: FcMsg) {
	/* Sender label always uses Club LabelColor — highlightOthers only tints body text. */
	const styleId = msgPartnerId(m) || m.id;
	const clubColor = m.color || labelColorForMember(styleId);
	nameEl.classList.remove("fbm-fc-hl-other");
	nameEl.style.color = clubColor || "";
}

FBM.reaugmentFloatChatLog = function () {
	const log = $("fbm-fc-log");
	if (!log) return;
	const wasAtEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 48;
	const rows = log.querySelectorAll(".fbm-fc-msg");
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i] as HTMLElement;
		const bodyEl = row.querySelector(".fbm-fc-msg-body") as HTMLElement | null;
		const raw = row.getAttribute("data-fc-body");
		if (bodyEl && raw != null) {
			let type: FcType = "chat";
			if (row.classList.contains("fbm-fc-msg-emote")) type = "emote";
			else if (row.classList.contains("fbm-fc-msg-whisper")) type = "whisper";
			else if (row.classList.contains("fbm-fc-msg-action")) type = "action";
			else if (row.classList.contains("fbm-fc-msg-system")) type = "system";
			renderBodyInto(
				bodyEl,
				{
					type: type,
					name: "",
					body: raw,
					time: "",
					id: row.getAttribute("data-fc-id"),
					color: row.getAttribute("data-fc-color"),
					key: "",
					direction: null,
					msgid: row.getAttribute("data-fc-msgid"),
					replyPreview: null,
				},
				wasAtEnd
			);
		}
		const nameEl = row.querySelector(".fbm-fc-msg-name") as HTMLElement | null;
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
				replyPreview: null,
			});
		}
	}
	scrollFloatLogIfNeeded(wasAtEnd);
};

// ===== SECTION: Club chat collapse and auto-close on join =====

function clubChatCollapsed(): boolean {
	const div = document.getElementById("chat-room-div");
	if (div && div.hasAttribute("hidden")) return true;
	try {
		if (typeof ChatRoomMapViewSplitPosition === "number" && ChatRoomMapViewSplitPosition >= 2000) {
			return true;
		}
	} catch (e) {
		/* ignore */
	}
	return false;
}

/** Collapse Club chat the same way as dragging the map split past full width. */
FBM.collapseClubChat = function () {
	try {
		if (typeof ChatRoomMapViewSetSplitPosition === "function") {
			ChatRoomMapViewSetSplitPosition(2000);
			return true;
		}
	} catch (e) {
		/* fall through */
	}
	const chatDiv = document.getElementById("chat-room-div");
	if (chatDiv) chatDiv.setAttribute("hidden", "true");
	try {
		(window as unknown as { ChatRoomMapViewSplitPosition?: number }).ChatRoomMapViewSplitPosition = 2000;
	} catch (e) {
		/* ignore */
	}
	try {
		if (typeof ElementSetSize === "function") ElementSetSize("chat-room-content", 2000);
	} catch (e) {
		/* ignore */
	}
	return !!chatDiv;
};

const AUTO_CLOSE_WARN =
	"Autoclose is on but Autoshow float chat is off — no chat will open when joining a room.";

FBM.warnAutoCloseWithoutAutoshow = function () {
	const cfg = fcCfg();
	if (!cfg.autoCloseOnJoin || cfg.autoshow !== false) return;
	if (FBM.showToast) FBM.showToast(AUTO_CLOSE_WARN, 5000);
	else if (FBM.setStatus) FBM.setStatus(AUTO_CLOSE_WARN);
};

/** After joining a room: optionally collapse Club chat (+ toast if float won't autoshow). */
FBM.maybeAutoCloseChatOnJoin = function () {
	const cfg = fcCfg();
	if (!cfg.autoCloseOnJoin) return;
	if (!inChatRoom()) return;
	FBM.collapseClubChat();
	FBM.warnAutoCloseWithoutAutoshow();
	if (FBM.refreshFloatChatVisibility) FBM.refreshFloatChatVisibility();
};

// ===== SECTION: Markup, theme, geometry, open/close/visibility =====

function inChatRoom(): boolean {
	return typeof CurrentScreen !== "undefined" && CurrentScreen === "ChatRoom";
}

/** Club menu chrome lives under Icons/Rectangle; Trash is root-only. */
function iconUrl(name: string): string {
	if (name === "Trash") return "Icons/Trash.png";
	return "Icons/Rectangle/" + name + ".png";
}

FBM.floatChatMarkup = function () {
	return (
		'<div id="fbm-float-chat" class="fbm-float-chat" data-fc-theme="dark" hidden aria-label="Floatable chat">' +
		'<div class="fbm-fc-header" id="fbm-fc-header">' +
		'<div class="fbm-fc-header-title" id="fbm-fc-header-title" title="Floatable Chat">' +
		'<span class="fbm-fc-room-name" id="fbm-fc-room-name">Chat</span>' +
		'<span class="fbm-fc-room-count" id="fbm-fc-room-count"></span></div>' +
		'<span class="fbm-fc-hotkey-hint" id="fbm-fc-hotkey-hint">Alt+C</span>' +
		'<button type="button" class="fbm-icon-btn" id="fbm-fc-close" title="Hide">×</button></div>' +
		'<div class="fbm-fc-toolbar" id="fbm-fc-toolbar">' +
		'<button type="button" class="fbm-fc-tool" data-fc-action="leave" title="Leave room">' +
		'<img src="' +
		iconUrl("Exit") +
		'" alt="" /><span>Leave</span></button>' +
		'<button type="button" class="fbm-fc-tool" data-fc-action="kneel" id="fbm-fc-kneel" title="Kneel / Stand">' +
		'<img src="' +
		iconUrl("Kneel") +
		'" alt="" /><span id="fbm-fc-kneel-label">Kneel</span></button>' +
		'<button type="button" class="fbm-fc-tool" data-fc-action="wardrobe" title="Wardrobe">' +
		'<img src="' +
		iconUrl("Dress") +
		'" alt="" /><span>Wardrobe</span></button>' +
		'<button type="button" class="fbm-fc-tool" data-fc-action="members" id="fbm-fc-members-btn" title="Room members">' +
		'<span class="fbm-fc-tool-glyph" aria-hidden="true">☰</span><span>Members</span></button>' +
		'<button type="button" class="fbm-fc-tool fbm-fc-tool-seidr" data-fc-action="roommanager" id="fbm-fc-roommanager" hidden title="Seidr Room Manager">' +
		'<img src="https://freya-bc.github.io/Freyas-Seidr/assets/SEIDR-Logo-Transparent.png" alt="" /><span>Manager</span></button>' +
		'<div class="fbm-fc-more-wrap" id="fbm-fc-more-wrap">' +
		'<button type="button" class="fbm-fc-tool" data-fc-action="more" id="fbm-fc-more" title="Menu" aria-haspopup="menu" aria-expanded="false">' +
		'<span class="fbm-fc-tool-glyph" aria-hidden="true">☰</span><span>Menu</span></button>' +
		'<div class="fbm-fc-more-menu" id="fbm-fc-more-menu" hidden role="menu"></div></div></div>' +
		'<div class="fbm-fc-body" id="fbm-fc-body">' +
		'<div class="fbm-fc-members" id="fbm-fc-members" hidden>' +
		'<div class="fbm-fc-members-head">' +
		'<span>Members</span>' +
		'<button type="button" class="fbm-icon-btn" id="fbm-fc-members-close" title="Close">×</button></div>' +
		'<div class="fbm-fc-members-list" id="fbm-fc-members-list"></div></div>' +
		'<div class="fbm-fc-members-resize" id="fbm-fc-members-resize" hidden title="Drag to resize Members"></div>' +
		'<div class="fbm-fc-log" id="fbm-fc-log" role="log" aria-live="polite"></div></div>' +
		'<div class="fbm-fc-compose-wrap" data-fc-mode="chat">' +
		'<div class="fbm-fc-reply" id="fbm-fc-reply" hidden>' +
		'<span class="fbm-fc-reply-text" id="fbm-fc-reply-text"></span>' +
		'<button type="button" class="fbm-fc-reply-close" id="fbm-fc-reply-close" title="Cancel reply">×</button>' +
		"</div>" +
		'<div class="fbm-fc-ac" id="fbm-fc-ac" role="listbox" hidden></div>' +
		'<div class="fbm-fc-compose">' +
		'<div class="fbm-fc-wav" id="fbm-fc-wav" hidden title="Whisper target"></div>' +
		'<textarea id="fbm-fc-input" rows="2" placeholder="Type a message…  / for commands" spellcheck="true"></textarea>' +
		'<button type="button" class="fbm-fc-send" id="fbm-fc-send">Send</button></div></div>' +
		'<div class="fbm-fc-resize" id="fbm-fc-resize" title="Resize"></div></div>'
	);
};

function ensureCustomStyleEl(): HTMLStyleElement {
	let el = document.getElementById("fbm-fc-custom-style") as HTMLStyleElement | null;
	if (!el) {
		el = document.createElement("style");
		el.id = "fbm-fc-custom-style";
		(document.head || document.documentElement).appendChild(el);
	}
	return el;
}

function clampFcTransparency(n: unknown): number {
	const t = Number(n);
	if (!isFinite(t)) return 15;
	return Math.max(0, Math.min(60, Math.round(t)));
}

/** Map transparency % → panel alpha (0% → 1.0, 60% → 0.40). */
function fcPanelAlpha(transparency: unknown): number {
	return Math.max(0.4, Math.min(1, 1 - clampFcTransparency(transparency) / 100));
}

function applyFloatChatPanelAlpha(root: HTMLElement, theme: string, transparency: unknown) {
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

FBM.applyFloatChatTheme = function () {
	const root = $("fbm-float-chat");
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
	const hint = $("fbm-fc-hotkey-hint");
	if (hint) hint.textContent = cfg.hotkey || "Alt+C";
	FBM.refreshFloatChatSeidrBtn();
};

FBM.applyFloatChatGeometry = function () {
	const root = $("fbm-float-chat");
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
		requestAnimationFrame(function () {
			FBM.refreshFloatBurgerMenu();
		});
	}
};

FBM.persistFloatChatGeometry = function () {
	const root = $("fbm-float-chat");
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

FBM.refreshFloatChatSeidrBtn = function () {
	const btn = $("fbm-fc-roommanager");
	if (!btn) return;
	const has = typeof window.Seidr !== "undefined" && !!window.Seidr;
	btn.hidden = !has;
};

FBM.floatChatIsOpen = function () {
	const root = $("fbm-float-chat");
	return !!(root && !root.hidden);
};

function nudgeSeidrRmLauncher() {
	try {
		const S = window.Seidr;
		if (S && typeof S.rmUpdateLauncherVisibility === "function") {
			S.rmUpdateLauncherVisibility();
		}
	} catch (e) {
		/* ignore */
	}
}

function clearSeidrCommandInput() {
	try {
		const S = window.Seidr;
		if (S && typeof S.setCommandInput === "function") S.setCommandInput(null);
	} catch (e) {
		/* ignore */
	}
}

FBM.refreshFloatChatRoomTitle = function () {
	const nameEl = $("fbm-fc-room-name");
	const countEl = $("fbm-fc-room-count");
	const titleEl = $("fbm-fc-header-title");
	if (!nameEl && !countEl) return;

	let roomName = "Chat";
	let limit: number | null = null;
	try {
		if (typeof ChatRoomData !== "undefined" && ChatRoomData) {
			const n = String(ChatRoomData.Name || "").trim();
			if (n) roomName = n;
			const lim =
				typeof ChatRoomData.MemberLimit === "number"
					? ChatRoomData.MemberLimit
					: typeof ChatRoomData.Limit === "number"
						? ChatRoomData.Limit
						: NaN;
			if (Number.isFinite(lim) && lim > 0) limit = lim;
		}
	} catch (e) {
		/* ignore */
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
	const root = $("fbm-float-chat");
	if (root) root.setAttribute("aria-label", roomName + " " + countText);
};

FBM.openFloatChat = function (opts?: { auto?: boolean }) {
	const cfg = fcCfg();
	if (cfg.enabled === false) return;
	FBM.ensureUi();
	const root = $("fbm-float-chat");
	if (!root) return;
	root.hidden = false;
	cfg.hidden = false;
	FBM.applyFloatChatTheme();
	FBM.applyFloatChatGeometry();
	if (opts && opts.auto) {
		FBM._floatChatAutoOpened = true;
	} else {
		FBM._floatChatAutoOpened = false;
		/* Manual open clears dismiss so hotkey/toggle always wins. */
		FBM._floatChatUserDismissed = false;
	}
	if (!FBM._floatChatBackfilled) {
		FBM.backfillFloatChat();
		FBM._floatChatBackfilled = true;
	}
	FBM.saveSettings();
	const log = $("fbm-fc-log");
	if (log) log.scrollTop = log.scrollHeight;
	FBM.refreshFloatChatRoomTitle();
	FBM.refreshFloatChatSeidrBtn();
	if (typeof FBM.refreshFloatToolbarOverflow === "function") FBM.refreshFloatToolbarOverflow();
	nudgeSeidrRmLauncher();
};

FBM.closeFloatChat = function (opts?: { fromAuto?: boolean }) {
	const root = $("fbm-float-chat");
	if (!root) return;
	FBM.persistFloatChatGeometry();
	root.hidden = true;
	const cfg = fcCfg();
	cfg.hidden = true;
	FBM._floatChatAutoOpened = false;
	/* User closed while Club chat may still be collapsed — don't autoshow-loop. */
	if (!(opts && opts.fromAuto)) FBM._floatChatUserDismissed = true;
	FBM.saveSettings();
	FBM.renderFloatChatAc([]);
	clearSeidrCommandInput();
	nudgeSeidrRmLauncher();
};

FBM.toggleFloatChat = function () {
	if (FBM.floatChatIsOpen()) FBM.closeFloatChat();
	else FBM.openFloatChat();
};

/** Hide panel without persisting “user closed” — used when leaving ChatRoom (wardrobe, etc.). */
FBM.suspendFloatChatForScreen = function () {
	const root = $("fbm-float-chat");
	if (!root || root.hidden) return;
	FBM._floatChatSuspended = true;
	FBM.persistFloatChatGeometry();
	root.hidden = true;
	FBM.renderFloatChatAc([]);
	clearSeidrCommandInput();
	nudgeSeidrRmLauncher();
};

FBM.resumeFloatChatAfterScreen = function () {
	if (!FBM._floatChatSuspended) return;
	FBM._floatChatSuspended = false;
	const cfg = fcCfg();
	if (cfg.enabled === false) return;
	/* Restore if user had it open, or autoshow when Club chat is collapsed. */
	if (!cfg.hidden) {
		FBM.openFloatChat({ auto: !!FBM._floatChatAutoOpened });
	} else if (cfg.autoshow && clubChatCollapsed() && !FBM._floatChatUserDismissed) {
		FBM.openFloatChat({ auto: true });
	}
};

/** Club character dialog (restraints / activities) — CurrentCharacter set, still ChatRoom. */
function clubCharacterDialogOpen(): boolean {
	try {
		return typeof CurrentCharacter !== "undefined" && CurrentCharacter != null;
	} catch (e) {
		return false;
	}
}

/**
 * Hide FBM float UI while Club character menu is open (CSS — keeps open state).
 * Covers chat, settings panel, Objects Build, build bar, templates, object settings.
 */
FBM.suspendOverlaysForCharacterDialog = function () {
	const root = $("fbm-root");
	if (!root) return;
	if (root.classList.contains("fbm-dialog-suspend")) return;
	root.classList.add("fbm-dialog-suspend");
	FBM._overlaysSuspendedForDialog = true;
	try {
		FBM.renderFloatChatAc([]);
		FBM.closeFloatMoreMenu();
		clearSeidrCommandInput();
	} catch (e) {
		/* ignore */
	}
	nudgeSeidrRmLauncher();
};

FBM.resumeOverlaysAfterCharacterDialog = function () {
	if (!FBM._overlaysSuspendedForDialog) return;
	FBM._overlaysSuspendedForDialog = false;
	const root = $("fbm-root");
	if (root) root.classList.remove("fbm-dialog-suspend");
	nudgeSeidrRmLauncher();
};

FBM.refreshFloatChatVisibility = function () {
	const cfg = fcCfg();
	if (cfg.enabled === false) {
		if (FBM.floatChatIsOpen()) FBM.closeFloatChat();
		FBM._floatChatSuspended = false;
		FBM.resumeOverlaysAfterCharacterDialog();
		return;
	}
	if (!inChatRoom()) {
		/* Always hide on wardrobe / Preference / other screens — not only autoshow. */
		FBM.resumeOverlaysAfterCharacterDialog();
		FBM.suspendFloatChatForScreen();
		return;
	}
	/* Character restraint / activity menu — hide FBM overlays until DialogLeave. */
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
	/* Club chat visible again → allow autoshow on the next collapse. */
	if (!collapsed) FBM._floatChatUserDismissed = false;
	if (cfg.autoshow && collapsed && !FBM._floatChatUserDismissed) {
		if (!FBM.floatChatIsOpen()) FBM.openFloatChat({ auto: true });
	} else if (!collapsed && FBM._floatChatAutoOpened && FBM.floatChatIsOpen()) {
		FBM.closeFloatChat({ fromAuto: true });
	}
};

// ===== SECTION: Club chat div classification (mirror parsing) =====

function pad2(n: number): string {
	return String(n).padStart(2, "0");
}

function nowTime(): string {
	const d = new Date();
	return pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
}

/** Preserve Club <br> / block structure as newlines (e.g. /help). */
function htmlElementToMultilineText(root: Node): string {
	function walk(node: Node): string {
		if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
		if (node.nodeType !== Node.ELEMENT_NODE) return "";
		const el = node as HTMLElement;
		const tag = (el.tagName || "").toUpperCase();
		if (tag === "SCRIPT" || tag === "STYLE") return "";
		if (tag === "BR") return "\n";
		if (
			tag === "BUTTON" &&
			(el.classList.contains("ChatMessageName") || el.classList.contains("chat-room-sender"))
		) {
			return "";
		}
		if (
			el.classList &&
			(el.classList.contains("chat-room-metadata") || el.classList.contains("chat-room-sender"))
		) {
			return "";
		}
		let out = "";
		for (let i = 0; i < el.childNodes.length; i++) {
			out += walk(el.childNodes[i]);
		}
		if (
			tag === "DIV" ||
			tag === "P" ||
			tag === "LI" ||
			tag === "TR" ||
			tag === "H1" ||
			tag === "H2" ||
			tag === "H3" ||
			tag === "H4" ||
			tag === "SECTION" ||
			tag === "DETAILS" ||
			tag === "SUMMARY"
		) {
			if (out && !out.endsWith("\n")) out += "\n";
		}
		return out;
	}
	return walk(root)
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function selfMemberId(): string {
	try {
		if (typeof Player !== "undefined" && Player && typeof Player.MemberNumber === "number") {
			return String(Player.MemberNumber);
		}
	} catch (e) {
		/* ignore */
	}
	return "";
}

function friendDisplayName(mn: string, fallback?: string): string {
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
		/* ignore */
	}
	return mn;
}

function extractReplyPreview(div: HTMLElement): FcReplyPreview | null {
	const replyEl = div.querySelector(".chat-room-message-reply") as HTMLElement | null;
	if (!replyEl) return null;
	const raw = (replyEl.textContent || "").replace(/^\s*↱\s*/, "").trim();
	if (!raw) return null;
	const idx = raw.indexOf(":");
	if (idx > 0) {
		return {
			name: raw.slice(0, idx).trim(),
			body: raw.slice(idx + 1).trim(),
		};
	}
	return { name: "", body: raw };
}

/** Club R133+ stores name tint as --label-color on .ChatMessageName (or the message row). */
function labelColorForMember(memberId: string | null | undefined): string | null {
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
		/* ignore */
	}
	return null;
}

function extractSpeakerLabelColor(
	nameBtn: HTMLElement | null,
	senderId: string | null
): string | null {
	const readVar = function (el: HTMLElement | null): string | null {
		if (!el) return null;
		try {
			const inline = (el.style && el.style.getPropertyValue("--label-color")) || "";
			if (inline && inline.trim()) return inline.trim();
		} catch (e) {
			/* ignore */
		}
		try {
			const computed = getComputedStyle(el).getPropertyValue("--label-color") || "";
			if (computed && computed.trim()) return computed.trim();
		} catch (e) {
			/* ignore */
		}
		return null;
	};

	let color = readVar(nameBtn);
	if (!color && nameBtn && nameBtn.parentElement) {
		color = readVar(nameBtn.parentElement as HTMLElement);
	}
	if (!color && nameBtn) {
		try {
			const inline = nameBtn.style.color || nameBtn.style.getPropertyValue("color") || "";
			if (inline && inline.trim()) color = inline.trim();
		} catch (e) {
			/* ignore */
		}
	}
	if (!color && nameBtn) {
		try {
			/* Only trust computed color when Club color-names are on (not inherited theme text). */
			const cs = getComputedStyle(nameBtn).color || "";
			if (cs && cs.trim() && cs !== "inherit") color = cs.trim();
		} catch (e) {
			/* ignore */
		}
	}
	if (!color) color = labelColorForMember(senderId);
	return color;
}

function classifyClubDiv(div: HTMLElement): FcMsg | null {
	if (!div || !div.classList) return null;
	if (div.classList.contains("chat-room-sep")) return null;
	const isPending = div.classList.contains("bce-pending");

	let type: FcType = "system";
	if (div.classList.contains("ChatMessageChat")) type = "chat";
	else if (div.classList.contains("ChatMessageWhisper")) type = "whisper";
	else if (div.classList.contains("ChatMessageEmote")) type = "emote";
	else if (
		div.classList.contains("ChatMessageAction") ||
		div.classList.contains("ChatMessageActivity")
	) {
		type = "action";
	} else if (div.classList.contains("ChatMessageBeep")) {
		type = "beep";
	} else if (
		div.classList.contains("ChatMessageServerMessage") ||
		div.classList.contains("ChatMessageLocalMessage") ||
		div.classList.contains("ChatMessageEnterLeave")
	) {
		type = "system";
	} else if (!div.classList.contains("ChatMessage")) {
		return null;
	}
	/* WCE pending only covers Chat / Emote / Action — ignore other pending shapes. */
	if (isPending && type !== "chat" && type !== "emote" && type !== "action") return null;

	const nameBtn =
		(div.querySelector(".ChatMessageName") as HTMLElement | null) ||
		(div.querySelector("button.ChatMessageName") as HTMLElement | null);
	let name = nameBtn ? (nameBtn.textContent || "").trim() : "";
	const senderEarly =
		div.getAttribute("data-sender") ||
		(div.querySelector(".chat-room-sender") as HTMLElement | null)?.textContent?.trim() ||
		null;
	const senderIdEarly = senderEarly && /^\d+$/.test(senderEarly) ? senderEarly : null;
	/* R133+: Club sets --label-color, not style.color. */
	let color = extractSpeakerLabelColor(nameBtn, senderIdEarly);

	const contentEl =
		(div.querySelector(".chat-room-message-content") as HTMLElement | null) ||
		(div.querySelector(".ChatMessageContent") as HTMLElement | null) ||
		(div.querySelector(".commands-help") as HTMLElement | null);
	let body = "";
	if (contentEl) body = htmlElementToMultilineText(contentEl);
	else {
		const clone = div.cloneNode(true) as HTMLElement;
		clone
			.querySelectorAll(
				".ChatMessageName, .chat-room-metadata, .chat-room-sender, button.ChatMessageName, .ReplyButton, .seidr-beep-reply-menu, .seidr-beep-reply-btn, .chat-room-message-popup, .chat-room-message-reply, .lds-ellipsis"
			)
			.forEach(function (n) {
				if (n.parentNode) n.parentNode.removeChild(n);
			});
		body = htmlElementToMultilineText(clone);
	}
	/* Club/WCE leave a literal ": " text node outside .chat-room-message-content. */
	if ((type === "chat" || type === "whisper") && nameBtn) {
		body = body.replace(/^:\s*/, "");
	}
	/* Action OOC wrappers only — emotes already include * from Club; do not strip/re-add. */
	if (type === "action") {
		body = body.replace(/^\(+|\)+$/g, "").trim() || body;
	}

	const time =
		div.getAttribute("data-time") ||
		(div.querySelector(".chat-room-time") as HTMLElement | null)?.textContent?.trim() ||
		nowTime();
	const targetAttr = div.getAttribute("data-target");
	const senderId = senderIdEarly;
	const targetId = targetAttr && /^\d+$/.test(targetAttr) ? targetAttr : null;
	if (!color && senderId) color = labelColorForMember(senderId);
	const selfMn = selfMemberId();
	/* ID is always the issuer/sender — never the whisper/beep target. */
	const id = senderId;
	let direction: FcDirection = null;

	if (type === "whisper" || type === "beep") {
		if (selfMn && senderId === selfMn && targetId) {
			direction = "to";
		} else if (senderId || targetId) {
			direction = "from";
		}
		if (!name) {
			const labelId =
				direction === "to" && targetId ? targetId : senderId || targetId;
			if (labelId) name = friendDisplayName(labelId);
		}
	}

	if (type === "beep") {
		const beepLink = div.querySelector(".beep-link") as HTMLElement | null;
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

	const msgidEl =
		(div.querySelector("[msgid]") as HTMLElement | null) ||
		(div.hasAttribute("msgid") ? div : null);
	const msgid = (msgidEl && msgidEl.getAttribute("msgid")) || null;
	const replyPreview = isPending ? null : extractReplyPreview(div);
	const nonce = isPending ? div.getAttribute("data-nonce") : null;
	/* Prefer Club msgid; pending uses WCE nonce; else monotonic seq for same-second repeats. */
	const key = isPending && nonce
		? "pending:" + nonce
		: msgid
			? "msgid:" + msgid
			: "seq:" + String(++fcMsgSeq) + "|" + time + "|" + (id || "") + "|" + type;

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
		msgid: isPending ? null : msgid,
		replyPreview,
		pending: isPending || undefined,
		nonce: nonce || null,
	};
}

function removeFloatChatRowByKey(key: string) {
	if (!key) return;
	const log = $("fbm-fc-log");
	if (!log) return;
	const kids = log.children;
	for (let i = kids.length - 1; i >= 0; i--) {
		const el = kids[i] as HTMLElement;
		if (el.getAttribute("data-key") === key) {
			log.removeChild(el);
		}
	}
}

function clearPendingNonce(nonce: string | null | undefined) {
	if (!nonce) return;
	const track = pendingByNonce.get(nonce);
	if (!track) return;
	if (track.timer != null) {
		clearTimeout(track.timer);
		track.timer = null;
	}
	if (track.shown) removeFloatChatRowByKey(track.msg.key);
	pendingByNonce.delete(nonce);
}

function clearPendingMatching(m: FcMsg) {
	if (!m || m.pending) return;
	const selfMn = selfMemberId();
	if (!selfMn || (m.senderId || m.id) !== selfMn) return;
	const body = String(m.body || "");
	const type = m.type;
	/* Clear only the oldest match so identical rapid sends keep their own pending. */
	let matchNonce: string | null = null;
	pendingByNonce.forEach(function (track, nonce) {
		if (matchNonce) return;
		if (track.msg.type === type && String(track.msg.body || "") === body) {
			matchNonce = nonce;
		}
	});
	if (matchNonce) clearPendingNonce(matchNonce);
}

function scheduleWcePending(m: FcMsg) {
	const nonce = m.nonce;
	if (!nonce) return;
	clearPendingNonce(nonce);
	const track: PendingTrack = { nonce, timer: null, msg: m, shown: false };
	pendingByNonce.set(nonce, track);
	track.timer = setTimeout(function () {
		track.timer = null;
		if (!pendingByNonce.has(nonce)) return;
		/* Club may already have removed the pending line (fast ack after schedule). */
		let still = false;
		if (typeof document !== "undefined") {
			const club = document.getElementById("TextAreaChatLog");
			const kids = club ? club.querySelectorAll(".bce-pending") : [];
			for (let i = 0; i < kids.length; i++) {
				if ((kids[i] as HTMLElement).getAttribute("data-nonce") === nonce) {
					still = true;
					break;
				}
			}
		}
		if (!still) {
			pendingByNonce.delete(nonce);
			return;
		}
		track.shown = true;
		FBM.appendFloatChatMsg(m);
	}, PENDING_LAG_MS);
}

function clearAllPendingTracks() {
	pendingByNonce.forEach(function (_track, nonce) {
		clearPendingNonce(nonce);
	});
	pendingByNonce.clear();
}

function renderBodyInto(body: HTMLElement, m: FcMsg, wasAtEnd: boolean) {
	body.textContent = "";
	fillMessageBodyContent(body, m.body || "", wasAtEnd);
}

function muteKeyFor(id: string | null | undefined, body: string): string {
	return String(id || "") + "\n" + String(body || "");
}

function isExactMessageMuted(m: FcMsg): boolean {
	if (!m || !m.id) return false;
	return mutedExactMessages.has(muteKeyFor(m.id, m.body || ""));
}

FBM.muteFloatChatExactMessage = function (memberId: string, body: string) {
	const id = String(memberId || "").trim();
	const text = String(body || "");
	if (!id || !text) return;
	mutedExactMessages.add(muteKeyFor(id, text));
	const log = $("fbm-fc-log");
	if (!log) return;
	const rows = Array.prototype.slice.call(log.querySelectorAll(".fbm-fc-msg")) as HTMLElement[];
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		if (row.getAttribute("data-fc-id") === id && row.getAttribute("data-fc-body") === text) {
			if (row.parentNode) row.parentNode.removeChild(row);
		}
	}
	FBM.setStatus("Muted that message from " + id + " until reload.");
};

// ===== SECTION: Context menus and confirm dialogs =====

function closeFloatChatContextMenu() {
	const menu = $("fbm-fc-ctx");
	if (menu) menu.hidden = true;
}

function closeFloatChatConfirm() {
	const dlg = $("fbm-fc-confirm");
	if (dlg) dlg.hidden = true;
}

function ensureFloatChatConfirm(): HTMLElement {
	let dlg = $("fbm-fc-confirm");
	if (dlg) return dlg;
	dlg = document.createElement("div");
	dlg.id = "fbm-fc-confirm";
	dlg.className = "fbm-fc-confirm";
	dlg.hidden = true;
	dlg.setAttribute("role", "dialog");
	dlg.innerHTML =
		'<div class="fbm-fc-confirm-card">' +
		'<div class="fbm-fc-confirm-title" id="fbm-fc-confirm-title">Confirm</div>' +
		'<div class="fbm-fc-confirm-body" id="fbm-fc-confirm-body"></div>' +
		'<div class="fbm-fc-confirm-actions">' +
		'<button type="button" class="fbm-fc-confirm-cancel" id="fbm-fc-confirm-cancel">Cancel</button>' +
		'<button type="button" class="fbm-fc-confirm-ok" id="fbm-fc-confirm-ok">Confirm</button>' +
		"</div></div>";
	(document.body || document.documentElement).appendChild(dlg);
	const cancel = dlg.querySelector("#fbm-fc-confirm-cancel") as HTMLButtonElement | null;
	const ok = dlg.querySelector("#fbm-fc-confirm-ok") as HTMLButtonElement | null;
	if (cancel) {
		cancel.addEventListener("click", function () {
			closeFloatChatConfirm();
			FBM._fcConfirmAction = null;
		});
	}
	if (ok) {
		ok.addEventListener("click", function () {
			const fn = FBM._fcConfirmAction as (() => void) | null;
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
	dlg.addEventListener("click", function (e) {
		if (e.target === dlg) {
			closeFloatChatConfirm();
			FBM._fcConfirmAction = null;
		}
	});
	return dlg;
}

function openFloatChatConfirm(title: string, body: string, onConfirm: () => void) {
	const dlg = ensureFloatChatConfirm();
	const t = $("fbm-fc-confirm-title");
	const b = $("fbm-fc-confirm-body");
	if (t) t.textContent = title;
	if (b) b.textContent = body;
	FBM._fcConfirmAction = onConfirm;
	dlg.hidden = false;
}
FBM.openFloatChatConfirm = openFloatChatConfirm;

function listHas(list: number[] | undefined, mn: number): boolean {
	return !!(list && Array.isArray(list) && list.indexOf(mn) >= 0);
}

function ensureFloatChatContextMenu(): HTMLElement {
	let menu = $("fbm-fc-ctx");
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
			function (e) {
				const t = e.target as HTMLElement | null;
				if (!t || !t.closest || !t.closest("#fbm-fc-ctx")) closeFloatChatContextMenu();
			},
			true
		);
		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape") {
				closeFloatChatContextMenu();
				closeFloatChatConfirm();
			}
		});
	}
	return menu;
}

function addCtxItem(menu: HTMLElement, label: string, title: string, onClick: () => void) {
	const btn = document.createElement("button");
	btn.type = "button";
	btn.className = "fbm-fc-ctx-item";
	btn.setAttribute("role", "menuitem");
	btn.textContent = label;
	btn.title = title;
	btn.addEventListener("click", function () {
		closeFloatChatContextMenu();
		onClick();
	});
	menu.appendChild(btn);
}

function findRoomCharacterByMn(mn: number): { MemberNumber?: number; Name?: string } | null {
	try {
		if (typeof ChatRoomCharacter === "undefined" || !Array.isArray(ChatRoomCharacter)) return null;
		return ChatRoomCharacter.find(function (c) {
			return !!(c && c.MemberNumber === mn);
		}) || null;
	} catch (e) {
		return null;
	}
}

function openBcProfileForMn(mn: number) {
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

function copyMemberIdToClipboard(id: string) {
	const text = String(id || "").trim();
	if (!text) return;
	const done = function () {
		FBM.setStatus("Copied ID " + text + ".");
	};
	try {
		if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
			void navigator.clipboard.writeText(text).then(done).catch(done);
			return;
		}
	} catch (err) {
		/* fall through */
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
		/* ignore */
	}
	done();
}

type FcPersonCtxOpts = {
	mn: number;
	label: string;
	/** Copy this id (defaults to mn). Chat uses issuer id. */
	copyId?: string;
	mute?: { issuerId: string; body: string } | null;
	/** Include Kick/Ban when room admin. Default true. */
	adminActions?: boolean;
};

/** Shared person context menu (chat lines + Members rows). */
FBM.openFcPersonContextMenu = function (e: MouseEvent, opts: FcPersonCtxOpts) {
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

	addCtxItem(menu, "Copy ID", "Copy member number to clipboard", function () {
		copyMemberIdToClipboard(copyId);
	});

	addCtxItem(menu, "Open Profile", "Open Bondage Club information sheet", function () {
		openBcProfileForMn(mn);
	});

	if (opts.mute && opts.mute.issuerId && opts.mute.body) {
		addCtxItem(menu, "Mute", "Hide this exact message until reload", function () {
			FBM.muteFloatChatExactMessage(opts.mute!.issuerId, opts.mute!.body);
		});
	}

	const wantAdmin = opts.adminActions !== false;
	const isAdmin =
		wantAdmin && typeof ChatRoomPlayerIsAdmin === "function" && !!ChatRoomPlayerIsAdmin();
	if (isAdmin && !self) {
		addCtxItem(menu, "Kick", "Kick this player from the room", function () {
			openFloatChatConfirm("Kick player?", "Kick " + label + " from this room?", function () {
				if (typeof ChatRoomAdminChatAction === "function") {
					ChatRoomAdminChatAction("Kick", String(mn));
					FBM.setStatus("Kicked " + label + ".");
					if (typeof FBM.refreshFloatMembersPanel === "function") FBM.refreshFloatMembersPanel();
				}
			});
		});
		addCtxItem(menu, "Ban", "Ban this player from the room", function () {
			openFloatChatConfirm("Ban player?", "Ban " + label + " from this room?", function () {
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
			addCtxItem(menu, "Whitelist", "Add to your whitelist", function () {
				openFloatChatConfirm("Whitelist?", "Add " + label + " to your whitelist?", function () {
					if (typeof ChatRoomListUpdate === "function" && Player && Player.WhiteList) {
						ChatRoomListUpdate(Player.WhiteList, true, mn);
						FBM.setStatus("Whitelisted " + label + ".");
						if (typeof FBM.refreshFloatMembersPanel === "function") FBM.refreshFloatMembersPanel();
					}
				});
			});
		}
		if (!listHas(Player.BlackList, mn)) {
			addCtxItem(menu, "Blacklist", "Add to your blacklist", function () {
				openFloatChatConfirm("Blacklist?", "Add " + label + " to your blacklist?", function () {
					if (typeof ChatRoomListUpdate === "function" && Player && Player.BlackList) {
						ChatRoomListUpdate(Player.BlackList, true, mn);
						FBM.setStatus("Blacklisted " + label + ".");
						if (typeof FBM.refreshFloatMembersPanel === "function") FBM.refreshFloatMembersPanel();
					}
				});
			});
		}
		if (!listHas(Player.FriendList, mn)) {
			addCtxItem(menu, "Add as Friend", "Friend request with notification", function () {
				openFloatChatConfirm(
					"Add as Friend?",
					"Send a friend request (with notification) to " + label + "?",
					function () {
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

function openFloatChatContextMenu(e: MouseEvent, m: FcMsg) {
	const issuerId = m.senderId || m.id;
	const partnerId = msgPartnerId(m);
	if (!issuerId && !partnerId) return;
	/* Admin / list / profile target the conversation partner on outgoing whispers. */
	const actionId = partnerId || issuerId || "";
	const mn = Number(actionId);
	if (!Number.isFinite(mn) || mn <= 0) return;
	const label =
		(m.direction === "to" && m.targetId
			? friendDisplayName(m.targetId, m.name || actionId)
			: m.name || actionId) +
		" (" +
		actionId +
		")";
	FBM.openFcPersonContextMenu(e, {
		mn: mn,
		label: label,
		copyId: issuerId || actionId,
		mute:
			issuerId && (m.body || "").length
				? { issuerId: issuerId, body: m.body || "" }
				: null,
		adminActions: true,
	});
}

// ===== SECTION: Compose input, reply bar, message rows, log =====

function clubInputEl(): HTMLTextAreaElement | null {
	const el = document.getElementById("InputChat");
	return el instanceof HTMLTextAreaElement ? el : null;
}

function floatInputEl(): HTMLTextAreaElement | null {
	const el = document.getElementById("fbm-fc-input");
	return el instanceof HTMLTextAreaElement ? el : null;
}

function setComposeValue(value: string, caret?: number) {
	const input = floatInputEl();
	if (!input) return;
	input.value = value;
	input.focus();
	const pos = caret != null ? caret : value.length;
	if (typeof input.setSelectionRange === "function") input.setSelectionRange(pos, pos);
	try {
		input.dispatchEvent(new Event("input", { bubbles: true }));
	} catch (e) {
		/* ignore */
	}
	try {
		const S = window.Seidr;
		if (S && typeof S.setCommandInput === "function") S.setCommandInput(input);
	} catch (e) {
		/* ignore */
	}
	FBM.refreshFloatComposeMode();
}

function prefillTargetCommand(cmd: "whisper" | "beep", memberId: string) {
	const mn = String(memberId || "").trim();
	if (!/^\d+$/.test(mn)) return;
	const input = floatInputEl();
	const rest = String((input && input.value) || "").replace(TARGET_STRIP_RE, "");
	const head = "/" + cmd + " " + mn + " ";
	setComposeValue(head + rest, head.length);
}

function updateFloatReplyBar() {
	const bar = $("fbm-fc-reply");
	const text = $("fbm-fc-reply-text");
	if (!bar || !text) return;
	if (!floatReplyState) {
		bar.hidden = true;
		text.textContent = "";
		return;
	}
	const label =
		"Replying to: " +
		(floatReplyState.partnerName || floatReplyState.partnerId || "a message");
	text.textContent = label;
	bar.hidden = false;
}

FBM.clearFloatReply = function (opts?: { stripPrefix?: boolean }) {
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

FBM.startFloatReply = function (m: FcMsg) {
	const partnerId = msgPartnerId(m);
	if (!m || !partnerId) return;
	const kind: FcReplyKind =
		m.type === "whisper" ? "whisper" : m.type === "beep" ? "beep" : "chat";
	const partnerName =
		m.direction === "to" && m.targetId
			? friendDisplayName(m.targetId, m.name || partnerId)
			: m.name || friendDisplayName(partnerId);
	floatReplyState = {
		kind: kind,
		partnerId: partnerId,
		partnerName: partnerName,
		msgid: m.msgid || null,
		snippet: (m.body || "").slice(0, 120),
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

function wireNameInteractions(nameEl: HTMLElement, m: FcMsg) {
	const partnerId = msgPartnerId(m);
	if (!partnerId || !/^\d+$/.test(partnerId)) return;
	if (partnerId === selfMemberId()) return;
	nameEl.classList.add("fbm-fc-msg-name-btn");
	nameEl.setAttribute("role", "button");
	nameEl.tabIndex = 0;
	nameEl.title = "Copy ID and whisper " + partnerId;
	nameEl.addEventListener("click", function (ev) {
		ev.preventDefault();
		ev.stopPropagation();
		try {
			if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
				void navigator.clipboard.writeText(partnerId);
			}
		} catch (e) {
			/* ignore */
		}
		prefillTargetCommand("whisper", partnerId);
		FBM.setStatus("Whisper prepared for " + partnerId + " (ID copied).");
	});
	nameEl.addEventListener("mouseenter", function () {
		if (fcCfg().mapCompass && typeof FBM.setFloatChatCompassTarget === "function") {
			FBM.setFloatChatCompassTarget(Number(partnerId));
		}
	});
	/* Do not clear on name leave — row mouseleave owns clear so body/reply hover keeps the arrow. */
}

function renderMsgRow(m: FcMsg): HTMLElement {
	const row = document.createElement("article");
	row.className = "fbm-fc-msg fbm-fc-msg-" + m.type;
	if (m.direction) row.classList.add("fbm-fc-msg-dir-" + m.direction);
	if (m.pending) row.classList.add("fbm-fc-msg-pending");
	row.dataset.key = m.key;
	row.setAttribute("data-fc-body", m.body || "");
	const issuerId = m.senderId || m.id;
	const partnerId = msgPartnerId(m);
	if (issuerId) row.setAttribute("data-fc-id", issuerId);
	if (partnerId) row.setAttribute("data-fc-partner", partnerId);
	if (m.color) row.setAttribute("data-fc-color", m.color);
	if (m.msgid) row.setAttribute("data-fc-msgid", m.msgid);
	if (m.nonce) row.setAttribute("data-fc-nonce", m.nonce);
	if (!m.pending && (issuerId || partnerId)) {
		row.addEventListener("contextmenu", function (ev) {
			openFloatChatContextMenu(ev, m);
		});
	}

	const main = document.createElement("div");
	main.className = "fbm-fc-msg-main";

	if (m.replyPreview && (m.replyPreview.name || m.replyPreview.body)) {
		const quote = document.createElement("div");
		quote.className = "fbm-fc-msg-reply";
		quote.textContent =
			(m.replyPreview.name ? m.replyPreview.name + ": " : "") + (m.replyPreview.body || "");
		main.appendChild(quote);
	}

	const line = document.createElement("div");
	line.className = "fbm-fc-msg-line";

	if (m.type === "whisper" || m.type === "beep") {
		const dir = document.createElement("span");
		dir.className = "fbm-fc-msg-dir";
		const kindLabel = m.type === "whisper" ? "Whisper" : "Beep";
		dir.textContent =
			m.direction === "to" ? kindLabel + " to" : kindLabel + " from";
		line.appendChild(dir);
		line.appendChild(document.createTextNode(" "));
		const name = document.createElement("span");
		name.className = "fbm-fc-msg-name";
		name.textContent =
			m.direction === "to" && m.targetId
				? friendDisplayName(m.targetId, m.name || "?")
				: m.name || friendDisplayName(issuerId || partnerId || "", "?");
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

	if (
		!m.pending &&
		(m.type === "chat" || m.type === "whisper" || m.type === "beep") &&
		partnerId
	) {
		const reply = document.createElement("button");
		reply.type = "button";
		reply.className = "fbm-fc-reply-btn";
		reply.title =
			m.type === "beep"
				? "Reply with beep"
				: m.type === "whisper"
					? "Reply with whisper"
					: "Reply";
		reply.textContent = "↩";
		reply.addEventListener("click", function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			FBM.startFloatReply(m);
		});
		main.appendChild(reply);
	}

	row.addEventListener("mouseenter", function () {
		const compassId = partnerId || issuerId;
		if (compassId && fcCfg().mapCompass && typeof FBM.setFloatChatCompassTarget === "function") {
			FBM.setFloatChatCompassTarget(Number(compassId));
		}
	});
	row.addEventListener("mouseleave", function () {
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

FBM.appendFloatChatMsg = function (m: FcMsg, opts?: { forceScroll?: boolean }) {
	const log = $("fbm-fc-log");
	if (!log || !m) return;
	if (isExactMessageMuted(m)) return;
	if (m.key) {
		const kids = log.children;
		for (let i = 0; i < kids.length; i++) {
			const el = kids[i] as HTMLElement;
			if (el.getAttribute("data-key") === m.key) return;
		}
	}
	const atEnd =
		(opts && opts.forceScroll) ||
		log.scrollHeight - log.scrollTop - log.clientHeight < 48;
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
			main.textContent =
				(m.name ? m.name + ": " : "") + (m.body || "");
			fallback.appendChild(main);
			log.appendChild(fallback);
		} catch (e2) {
			/* ignore */
		}
	}
	while (log.children.length > LOG_CAP) {
		log.removeChild(log.firstChild as Node);
	}
	if (atEnd) log.scrollTop = log.scrollHeight;
};

FBM.mirrorClubChatDiv = function (div: HTMLElement) {
	if (!div || mirroredClubDivs.has(div)) return;
	const m = classifyClubDiv(div);
	if (!m) return;
	mirroredClubDivs.add(div);
	/* WCE pending: delay paint so fast acks never flash; muted row is a lag cue. */
	if (m.pending) {
		scheduleWcePending(m);
		return;
	}
	clearPendingMatching(m);
	FBM.appendFloatChatMsg(m);
};

FBM.backfillFloatChat = function () {
	const club = document.getElementById("TextAreaChatLog");
	const log = $("fbm-fc-log");
	if (!club || !log) return;
	clearAllPendingTracks();
	log.innerHTML = "";
	const kids = club.children;
	for (let i = 0; i < kids.length; i++) {
		const el = kids[i] as HTMLElement;
		mirroredClubDivs.add(el);
		const m = classifyClubDiv(el);
		if (!m || isExactMessageMuted(m)) continue;
		/* Already-visible Club pending means lag is already in progress — show now. */
		if (m.pending && m.nonce) {
			pendingByNonce.set(m.nonce, { nonce: m.nonce, timer: null, msg: m, shown: true });
		}
		log.appendChild(renderMsgRow(m));
	}
	while (log.children.length > LOG_CAP) {
		log.removeChild(log.firstChild as Node);
	}
	log.scrollTop = log.scrollHeight;
};

FBM.clearFloatChatLog = function () {
	const log = $("fbm-fc-log");
	if (log) log.innerHTML = "";
	/* Mirror Club /clear on TextAreaChatLog */
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
			key: "cleared-" + Date.now(),
		},
		{ forceScroll: true }
	);
};

// ===== SECTION: Whisper target, OOC protection, send =====

function clubWhisperTargetMn(): number | null {
	try {
		const n =
			typeof ChatRoomTargetMemberNumber === "number" ? ChatRoomTargetMemberNumber : NaN;
		return Number.isFinite(n) && n >= 0 ? n : null;
	} catch (e) {
		return null;
	}
}

/** Drop Club sticky whisper so float public sends can't silently whisper. */
function clearClubWhisperTarget() {
	try {
		if (typeof ChatRoomSetTarget === "function") ChatRoomSetTarget(-1);
		else if (typeof ChatRoomTargetMemberNumber === "number") {
			(window as unknown as { ChatRoomTargetMemberNumber: number }).ChatRoomTargetMemberNumber = -1;
		}
	} catch (e) {
		/* ignore */
	}
}

/** Match Club ChatRoomSendWhisper failure cases (gone / map out-of-range). */
function whisperTargetFailure(mn: number): "gone" | "out-of-range" | null {
	if (!Number.isFinite(mn) || mn < 0) return "gone";
	try {
		let target: { MemberNumber?: number } | null = null;
		if (typeof ChatRoomCharacter !== "undefined" && Array.isArray(ChatRoomCharacter)) {
			target = ChatRoomCharacter.find((c) => c && c.MemberNumber === mn) || null;
		}
		if (!target) return "gone";
		const mapOn =
			typeof ChatRoomMapViewIsActive === "function" && !!ChatRoomMapViewIsActive();
		const superPowers =
			typeof ChatRoomMapViewHasSuperPowers === "function" &&
			!!ChatRoomMapViewHasSuperPowers();
		const inRange =
			typeof ChatRoomMapViewCharacterOnWhisperRange === "function" &&
			!!ChatRoomMapViewCharacterOnWhisperRange(target);
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
		/* ignore */
	}
}

function detectComposeMode(raw: string): FcComposeMode {
	const v = String(raw || "").trim();
	if (/^\/beep\b/i.test(v)) return "beep";
	if (/^\/(whisper|w)\b/i.test(v)) return "whisper";
	if (floatReplyState && floatReplyState.kind === "whisper") return "whisper";
	if (floatReplyState && floatReplyState.kind === "beep") return "beep";
	/* Club sticky target (set by /whisper Name with no message) — still whispering. */
	if (clubWhisperTargetMn() != null && !/^\/(?:beep)\b/i.test(v)) return "whisper";
	return "chat";
}

function parseWhisperTargetMn(raw: string): number | null {
	const m = /^\/(?:whisper|w)\s+(\d+)\b/i.exec(String(raw || "").trim());
	if (!m) return null;
	const n = Number(m[1]);
	return Number.isFinite(n) && n > 0 ? n : null;
}

FBM.refreshFloatWhisperAvatar = function () {
	const slot = $("fbm-fc-wav");
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
	let C: { MemberNumber?: number; Canvas?: HTMLCanvasElement; CanvasBlink?: HTMLCanvasElement; Name?: string; Nickname?: string } | null =
		null;
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

FBM.refreshFloatComposeMode = function () {
	const wrap = document.querySelector("#fbm-float-chat .fbm-fc-compose-wrap") as HTMLElement | null;
	const input = floatInputEl();
	const mode = detectComposeMode(input ? input.value : "");
	if (wrap) wrap.setAttribute("data-fc-mode", mode);
	FBM.refreshFloatWhisperAvatar();
};

/** Split optional /whisper|/w|/beep <target> from body. Always trim first. */
function splitDirectedCompose(raw: string): {
	kind: "whisper" | "beep" | "chat";
	prefix: string;
	body: string;
} {
	const text = String(raw || "").trim();
	const m = /^(\/(?:whisper|w|beep)\s+\S+\s*)([\s\S]*)$/i.exec(text);
	if (!m) {
		/* Sticky Club whisper target: bare text is still a whisper body. */
		if (clubWhisperTargetMn() != null) {
			return { kind: "whisper", prefix: "", body: text };
		}
		return { kind: "chat", prefix: "", body: text };
	}
	const kind = /^\s*\/beep\b/i.test(m[1]) ? "beep" : "whisper";
	return { kind: kind, prefix: m[1], body: m[2] };
}

/**
 * Mistaken form: (/whisper 3 asd) — whole command wrapped in OOC instead of
 * /whisper 3 (asd). Looks balanced so paren-count alone would allow a public send.
 */
function parseMistakenOocWrappedCommand(raw: string): {
	kind: "whisper" | "beep";
	prefix: string;
	body: string;
	corrected: string;
} | null {
	const text = String(raw || "").trim();
	const m = /^\(\s*(\/(?:whisper|w|beep)\s+(\S+)\s*)([\s\S]*)\)$/i.exec(text);
	if (!m) return null;
	const prefix = m[1];
	const kind = /^\s*\/beep\b/i.test(prefix) ? "beep" : "whisper";
	let body = String(m[3] || "").trim();
	/* Strip one extra outer OOC layer on the message if present: (/whisper 3 (asd)) */
	if (body.charAt(0) === "(" && body.charAt(body.length - 1) === ")" && oocParenBalanced(body)) {
		/* keep body as-is — already OOC */
	} else if (body) {
		body = "(" + body + ")";
	}
	return {
		kind: kind,
		prefix: prefix,
		body: body,
		corrected: body ? prefix + body : prefix,
	};
}

function oocParenBalanced(body: string): boolean {
	let open = 0;
	let close = 0;
	const s = String(body || "");
	for (let i = 0; i < s.length; i++) {
		if (s[i] === "(") open++;
		else if (s[i] === ")") close++;
	}
	return open === close;
}

/**
 * Wrap message body in () for Ctrl+Enter OOC send.
 * Never wraps the /whisper|/w|/beep prefix — only the body after the target.
 */
function wrapComposeAsOoc(raw: string): string {
	const mistaken = parseMistakenOocWrappedCommand(raw);
	if (mistaken) return mistaken.corrected;
	const parts = splitDirectedCompose(raw);
	const body = String(parts.body || "").trim();
	if (!body) return parts.prefix ? parts.prefix : String(raw || "").trim();
	/* Already a single outer OOC group — leave as-is. */
	if (body.charAt(0) === "(" && oocParenBalanced(body) && body.charAt(body.length - 1) === ")") {
		return parts.prefix ? parts.prefix + body : body;
	}
	const wrapped = "(" + body + ")";
	return parts.prefix ? parts.prefix + wrapped : wrapped;
}

/**
 * True when this send only selects a Club whisper target (/whisper Name, no message).
 * That leaves ChatRoomTargetMemberNumber sticky — float must re-show the prefix.
 */
function isWhisperTargetSelectOnly(raw: string): boolean {
	return /^\/(?:whisper|w)\s+\S+\s*$/i.test(String(raw || "").trim());
}

function refuseOocSend(kind: "whisper" | "beep" | "chat", detail?: string) {
	const msg =
		kind === "whisper"
			? "can not be sent broken whisper"
			: kind === "beep"
				? "can not be sent broken beep"
				: "can not be sent broken OOC";
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
			key: "ooc-block-" + Date.now(),
		},
		{ forceScroll: true }
	);
	FBM.refreshFloatComposeMode();
}

FBM.sendFloatChat = function (opts?: { asOoc?: boolean }) {
	const input = $("fbm-fc-input") as HTMLTextAreaElement | null;
	if (!input) return;
	let raw = String(input.value || "").trim();
	if (!raw) return;

	/*
	 * Manual mistake: (/whisper 3 asd) — rewrite to /whisper 3 (asd) before send
	 * (or Ctrl+Enter path). Never send the wrapped-command form as public chat.
	 */
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
	/*
	 * Public float lines clear Club sticky whisper. Directed whisper/beep keep it
	 * (explicit prefix or sticky target + body-only).
	 */
	const hasExplicitDir = /^\/(?:whisper|w|beep)\b/i.test(raw);
	if (directed.kind === "chat") clearClubWhisperTarget();

	const selectOnly = isWhisperTargetSelectOnly(raw);
	const selectMn = selectOnly ? parseWhisperTargetMn(raw) : null;

	/* Sticky whisper + body only: send body (Club uses ChatRoomTargetMemberNumber). */
	const clubPayload =
		directed.kind === "whisper" && !hasExplicitDir ? directed.body : raw;

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

	/*
	 * Failed whisper: sticky body-only leaves InputChat uncleared; explicit
	 * /whisper N msg clears InputChat via CommandExecute but leaves sticky
	 * target — both must drop whisper mode so the next line is public.
	 */
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

	/* Keep /whisper N visible while Club sticky target remains (select-only or ongoing whisper). */
	if (!whisperFailed && directed.kind === "whisper") {
		const mn =
			selectMn != null
				? selectMn
				: parseWhisperTargetMn(raw) || clubWhisperTargetMn();
		if (mn != null && (selectOnly || clubWhisperTargetMn() === mn || !hasExplicitDir)) {
			const head = "/whisper " + mn + " ";
			setComposeValue(head, head.length);
			FBM.refreshFloatComposeMode();
			return;
		}
	}

	FBM.refreshFloatComposeMode();
};

// ===== SECTION: Autocomplete, Tab proxy, mirror install =====

/** Seidr CommandCombine tags — only list when Seidr is loaded. */
const SEIDR_CMD_TAGS: Record<string, true> = {
	a: true,
	action: true,
	strip: true,
	stripe: true,
	poses: true,
	animation: true,
	ani: true,
	seidr: true,
	roommanager: true,
};

function seidrInstalled(): boolean {
	return typeof window.Seidr !== "undefined" && !!window.Seidr;
}

function clubCommandTags(): Array<{ tag: string; desc: string }> {
	const now = Date.now();
	const seidr = seidrInstalled();
	if (
		FBM._fcCmdCache &&
		FBM._fcCmdCacheAt &&
		now - FBM._fcCmdCacheAt < 5000 &&
		FBM._fcCmdCacheSeidr === seidr
	) {
		return FBM._fcCmdCache;
	}
	const out: Array<{ tag: string; desc: string }> = [];
	try {
		const list =
			typeof GetCommands === "function"
				? GetCommands()
				: typeof Commands !== "undefined" && Array.isArray(Commands)
					? Commands
					: [];
		for (let i = 0; i < list.length; i++) {
			const c = list[i];
			if (!c || !c.Tag) continue;
			const tag = String(c.Tag);
			const low = tag.toLowerCase();
			if (!seidr && SEIDR_CMD_TAGS[low]) continue;
			out.push({ tag: tag, desc: String(c.Description || "") });
		}
	} catch (e) {
		/* ignore */
	}
	FBM._fcCmdCache = out;
	FBM._fcCmdCacheAt = now;
	FBM._fcCmdCacheSeidr = seidr;
	return out;
}

FBM.highlightFloatChatAc = function () {
	const box = $("fbm-fc-ac");
	if (!box) return;
	const idx = FBM._fcAcIndex || 0;
	Array.prototype.forEach.call(box.children, function (el: Element, i: number) {
		const on = i === idx;
		el.classList.toggle("fbm-fc-ac-on", on);
		if (on && typeof (el as HTMLElement).scrollIntoView === "function") {
			(el as HTMLElement).scrollIntoView({ block: "nearest" });
		}
	});
};

FBM.renderFloatChatAc = function (
	items: Array<{ tag: string; desc: string; prefix?: string }>,
	index?: number
) {
	const box = $("fbm-fc-ac");
	if (!box) return;
	FBM._fcAcItems = items || [];
	FBM._fcAcIndex = items && items.length ? (index != null ? index : 0) : -1;
	if (!items || !items.length) {
		box.hidden = true;
		box.innerHTML = "";
		box.classList.remove("fbm-fc-open");
		return;
	}
	box.hidden = false;
	box.classList.add("fbm-fc-open");
	const frag = document.createDocumentFragment();
	items.forEach(function (it, i) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "fbm-fc-ac-item" + (i === FBM._fcAcIndex ? " fbm-fc-ac-on" : "");
		btn.setAttribute("role", "option");
		btn.setAttribute("data-i", String(i));
		const pfx = it.prefix === "." ? "." : "/";
		btn.innerHTML =
			'<span class="fbm-fc-ac-label">' +
			pfx +
			escapeHtml(it.tag) +
			"</span>" +
			(it.desc
				? '<span class="fbm-fc-ac-hint">' + escapeHtml(it.desc) + "</span>"
				: "");
		btn.addEventListener("mousedown", function (ev) {
			ev.preventDefault();
			FBM.acceptFloatChatAc(i);
		});
		frag.appendChild(btn);
	});
	box.innerHTML = "";
	box.appendChild(frag);
	FBM.highlightFloatChatAc();
};

function escapeHtml(s: string): string {
	return String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/** Proxy Tab through Club InputChat so mods (e.g. BCX) can complete `.` commands. */
FBM.proxyDotCommandTab = function (): boolean {
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
				preventDefault: function () {},
				stopImmediatePropagation: function () {},
			});
		}
		const next = String(club.value || "");
		if (next && next !== raw) {
			setComposeValue(next, next.length);
			const tag = next.replace(/^\./, "").split(/\s/)[0] || "";
			if (tag) {
				FBM.renderFloatChatAc([{ tag: tag, desc: "dot command", prefix: "." }], 0);
			}
			return true;
		}
	} catch (e) {
		console.warn("[FBM] dot Tab proxy", e);
	}
	return false;
};

FBM.updateFloatChatAc = function () {
	const input = $("fbm-fc-input") as HTMLTextAreaElement | null;
	if (!input) return;
	const val = input.value || "";
	const dot = val.match(/^\.([^\s]*)$/);
	if (dot) {
		const prefix = (dot[1] || "").toLowerCase();
		if (!prefix) {
			FBM.renderFloatChatAc([]);
			return;
		}
		/* Soft preview: one proxied completion without committing caret churn. */
		const club = clubInputEl();
		if (club && typeof ChatRoomKeyDown === "function") {
			const prev = club.value;
			try {
				club.value = val;
				ChatRoomKeyDown({
					key: "Tab",
					preventDefault: function () {},
					stopImmediatePropagation: function () {},
				});
				const completed = String(club.value || "");
				club.value = prev;
				if (completed.startsWith(".") && completed !== val) {
					const tag = completed.replace(/^\./, "").trim().split(/\s/)[0] || prefix;
					FBM.renderFloatChatAc(
						[{ tag: tag, desc: "dot command", prefix: "." }],
						0
					);
					return;
				}
			} catch (e) {
				try {
					club.value = prev;
				} catch (err) {
					/* ignore */
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
	/* Bare "/" — wait for a letter so we don't paint the full command dump. */
	if (!prefix) {
		FBM.renderFloatChatAc([]);
		return;
	}
	const all = clubCommandTags();
	const items: Array<{ tag: string; desc: string; prefix?: string }> = [];
	for (let i = 0; i < all.length; i++) {
		const c = all[i];
		const tag = c.tag.toLowerCase();
		if (tag.indexOf(prefix) === 0) items.push({ tag: c.tag, desc: c.desc, prefix: "/" });
	}
	items.sort(function (a, b) {
		return a.tag.toLowerCase().localeCompare(b.tag.toLowerCase());
	});
	FBM.renderFloatChatAc(items, 0);
};

FBM.scheduleFloatChatAc = function () {
	if (FBM._fcAcTimer) clearTimeout(FBM._fcAcTimer);
	FBM._fcAcTimer = setTimeout(function () {
		FBM._fcAcTimer = null;
		FBM.updateFloatChatAc();
	}, 40);
};

FBM.acceptFloatChatAc = function (index?: number) {
	const items = FBM._fcAcItems || [];
	const i = index != null ? index : FBM._fcAcIndex || 0;
	const it = items[i] as { tag: string; desc: string; prefix?: string } | undefined;
	const input = $("fbm-fc-input") as HTMLTextAreaElement | null;
	if (!it || !input) return;
	const pfx = it.prefix === "." ? "." : "/";
	input.value = pfx + it.tag + " ";
	FBM.renderFloatChatAc([]);
	input.focus();
	const len = input.value.length;
	input.setSelectionRange(len, len);
	FBM.refreshFloatComposeMode();
};

FBM.installFloatChatMirror = function () {
	if (!FBM._floatChatMirrorHooked) {
		const ok = FBM.tryHook(
			"floatChatAppend",
			"ChatRoomAppendChat",
			2,
			function (args: unknown[], next: (a?: unknown[]) => unknown) {
				const ret = next(args);
				try {
					const div = args && args[0];
					if (div && (div as HTMLElement).nodeType === 1) {
						FBM.mirrorClubChatDiv(div as HTMLElement);
					}
				} catch (e) {
					console.warn("[FBM] float mirror", e);
				}
				return ret;
			}
		);
		if (ok) FBM._floatChatMirrorHooked = true;
	}
	/* Club rebuilds #TextAreaChatLog on join — rebind observer when the node is new. */
	installFloatChatPendingWatch();
};

/** Drop float pending rows when WCE removes `.bce-pending` from Club chat. */
function installFloatChatPendingWatch() {
	if (typeof MutationObserver === "undefined" || typeof document === "undefined") return;
	const bind = function () {
		const club = document.getElementById("TextAreaChatLog") as FBMMarkedElement | null;
		if (!club || club._fbmPendingObs) return;
		const obs = new MutationObserver(function (records) {
			for (let r = 0; r < records.length; r++) {
				const removed = records[r].removedNodes;
				for (let i = 0; i < removed.length; i++) {
					const node = removed[i];
					if (!node || node.nodeType !== 1) continue;
					const el = node as HTMLElement;
					if (el.classList && el.classList.contains("bce-pending")) {
						clearPendingNonce(el.getAttribute("data-nonce"));
					}
				}
			}
		});
		obs.observe(club, { childList: true });
		club._fbmPendingObs = true;
	};
	bind();
	setTimeout(bind, 0);
	setTimeout(bind, 120);
}

// ===== SECTION: Hotkeys, compose keys, visibility watch, drag/resize =====

FBM.installFloatChatHotkey = function () {
	if (FBM._floatChatHotkeyBound) return;
	FBM._floatChatHotkeyBound = true;
	document.addEventListener(
		"keydown",
		function (e) {
			const cfg = fcCfg();
			if (cfg.enabled === false) return;
			if (FBM._capturingHotkey || FBM._capturingFcHotkey) return;
			/* Any ChatRoom — including while Club chat is still visible (testing). */
			if (!inChatRoom()) return;
			const t = e.target as HTMLElement | null;
			const tag = t && (t.tagName || "").toUpperCase();
			const typing =
				!!t && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!t.isContentEditable);
			if (typing) {
				const id = t.id || "";
				/* Allow from Club InputChat + float compose; skip other FBM settings fields. */
				const allowed =
					id === "fbm-fc-input" ||
					id === "InputChat" ||
					(t.closest && t.closest("#fbm-fc-ac"));
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

/** Document-capture compose keys — runs even if other listeners interfere. */
FBM.installFloatChatComposeKeys = function () {
	if (FBM._floatChatComposeKeysBound) return;
	FBM._floatChatComposeKeysBound = true;
	document.addEventListener(
		"keydown",
		function (e) {
			const t = e.target as HTMLElement | null;
			if (!t || t.id !== "fbm-fc-input") return;
			const key = e.key;
			const S = window.Seidr;
			const seidrAc =
				!!S && typeof S.cmdAcIsOpen === "function" && !!S.cmdAcIsOpen();
			/* Let Seidr Tab/W/S/E/Enter/Esc run when its list is open. */
			if (seidrAc) return;

			const items = FBM._fcAcItems || [];
			const acOpen = items.length > 0;
			const input = t as HTMLTextAreaElement;
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
				/*
				 * Seidr first (empty Tab, /whisper|/beep|/a …) — before FBM bare-/ tag AC,
				 * which would otherwise steal Tab on `/whisper` or `/a`.
				 * Always keep Tab inside float compose when nothing consumes it.
				 */
				if (S && typeof S.cmdAcHandleKeyDown === "function") {
					try {
						if (typeof S.setCommandInput === "function") S.setCommandInput(input);
					} catch (err) {
						/* ignore */
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
				FBM.sendFloatChat({ asOoc: asOoc });
			}
		},
		true
	);
};

FBM.installFloatChatVisibilityWatch = function () {
	if (FBM._floatChatVisBound) return;
	FBM._floatChatVisBound = true;
	setInterval(function () {
		try {
			FBM.refreshFloatChatVisibility();
			FBM.refreshFloatChatSeidrBtn();
			if (FBM.floatChatIsOpen()) FBM.refreshFloatChatRoomTitle();
		} catch (e) {
			/* ignore */
		}
	}, 800);
	/* Instant hide/show when opening/closing Club character dialog. */
	if (typeof FBM.tryHook === "function") {
		FBM.tryHook(
			"fbmDialogCharSet",
			"CharacterSetCurrent",
			0,
			function (args: unknown[], next: (a?: unknown[]) => unknown) {
				const ret = next(args);
				try {
					FBM.refreshFloatChatVisibility();
				} catch (e) {
					/* ignore */
				}
				return ret;
			}
		);
		FBM.tryHook(
			"fbmDialogLeave",
			"DialogLeave",
			0,
			function (args: unknown[], next: (a?: unknown[]) => unknown) {
				const ret = next(args);
				try {
					FBM.refreshFloatChatVisibility();
				} catch (e) {
					/* ignore */
				}
				return ret;
			}
		);
	}
};

function bindFloatDrag() {
	const root = $("fbm-float-chat");
	const header = $("fbm-fc-header");
	if (!root || !header || header._fbmBound) return;
	header._fbmBound = true;
	let dragging = false;
	let ox = 0;
	let oy = 0;
	header.addEventListener("pointerdown", function (e) {
		if ((e.target as HTMLElement | null)?.closest("button")) return;
		dragging = true;
		const r = root.getBoundingClientRect();
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
		root.style.left = Math.max(0, e.clientX - ox) + "px";
		root.style.top = Math.max(0, e.clientY - oy) + "px";
		root.style.right = "auto";
	});
	header.addEventListener("pointerup", function () {
		if (!dragging) return;
		dragging = false;
		FBM.persistFloatChatGeometry();
	});
}

function bindFloatResize() {
	const root = $("fbm-float-chat");
	const handle = $("fbm-fc-resize");
	if (!root || !handle || handle._fbmBound) return;
	handle._fbmBound = true;
	let resizing = false;
	let sx = 0;
	let sy = 0;
	let sw = 0;
	let sh = 0;
	handle.addEventListener("pointerdown", function (e) {
		resizing = true;
		sx = e.clientX;
		sy = e.clientY;
		const r = root.getBoundingClientRect();
		sw = r.width;
		sh = r.height;
		try {
			handle.setPointerCapture(e.pointerId);
		} catch (err) {
			/* ignore */
		}
		e.preventDefault();
	});
	handle.addEventListener("pointermove", function (e) {
		if (!resizing) return;
		const nw = Math.max(300, sw + (e.clientX - sx));
		const nh = Math.max(240, sh + (e.clientY - sy));
		root.style.width = nw + "px";
		root.style.height = nh + "px";
	});
	handle.addEventListener("pointerup", function () {
		if (!resizing) return;
		resizing = false;
		FBM.persistFloatChatGeometry();
	});
}

// ===== SECTION: Burger menu, export, toolbar actions, UI bind =====

/** Fixed burger entries (always listed). */
const FC_BURGER_LABELS: Record<string, string> = {
	preference: "Preferences",
	chatsettings: "Chat Settings",
	profile: "Profile",
	roomadmin: "Room settings",
	clear: "Clear chat",
	export: "Export Chat",
};

function fcBurgerActions(): string[] {
	return ["preference", "chatsettings", "profile", "roomadmin", "clear", "export"];
}

FBM.closeFloatMoreMenu = function () {
	const menu = $("fbm-fc-more-menu");
	const moreBtn = $("fbm-fc-more");
	if (menu) menu.hidden = true;
	if (moreBtn) moreBtn.setAttribute("aria-expanded", "false");
};

function fcClickActionEl(target: EventTarget | null): HTMLElement | null {
	const el =
		target instanceof Element
			? target
			: target && (target as Node).parentElement
				? (target as Node).parentElement
				: null;
	if (!el) return null;
	return el.closest("[data-fc-action]") as HTMLElement | null;
}

function buildFloatBurgerMenuItems(actions: string[]) {
	const menu = $("fbm-fc-more-menu");
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
		btn.addEventListener("click", function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			FBM.runFloatChatToolbarAction(a, btn);
		});
		menu.appendChild(btn);
	}
	if (keepOpen) menu.hidden = false;
}

FBM.refreshFloatBurgerMenu = function () {
	const moreWrap = $("fbm-fc-more-wrap");
	if (moreWrap) moreWrap.hidden = false;
	buildFloatBurgerMenuItems(fcBurgerActions());
};

/** @deprecated overflow removed — alias for burger refresh */
FBM.refreshFloatToolbarOverflow = function () {
	FBM.refreshFloatBurgerMenu();
};

FBM.toggleFloatMoreMenu = function () {
	const menu = $("fbm-fc-more-menu");
	const moreWrap = $("fbm-fc-more-wrap");
	const moreBtn = $("fbm-fc-more");
	if (!menu || !moreWrap) return;
	if (!menu.hidden) {
		FBM.closeFloatMoreMenu();
		return;
	}
	if (!menu.childNodes.length) FBM.refreshFloatBurgerMenu();
	menu.hidden = false;
	if (moreBtn) moreBtn.setAttribute("aria-expanded", "true");
};

FBM.exportFloatChatLog = function () {
	const log = $("fbm-fc-log");
	if (!log) {
		FBM.setStatus("No chat to export.");
		return;
	}
	const rows = log.querySelectorAll("article.fbm-fc-msg");
	const lines: string[] = [];
	const roomEl = $("fbm-fc-room-name");
	const roomName = roomEl ? String(roomEl.textContent || "").trim() : "";
	const stamp = new Date();
	const pad = function (n: number) {
		return n < 10 ? "0" + n : String(n);
	};
	const fileStamp =
		stamp.getFullYear() +
		"-" +
		pad(stamp.getMonth() + 1) +
		"-" +
		pad(stamp.getDate()) +
		"_" +
		pad(stamp.getHours()) +
		pad(stamp.getMinutes());
	lines.push(
		"Freyas Better Maps — Chat export" +
			(roomName ? " (" + roomName + ")" : "") +
			" — " +
			stamp.toISOString()
	);
	lines.push("");
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i] as HTMLElement;
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
	a.download =
		"fbm-chat" + (roomName ? "-" + roomName.replace(/[^\w.-]+/g, "_") : "") + "-" + fileStamp + ".txt";
	a.rel = "noopener";
	document.body.appendChild(a);
	a.click();
	setTimeout(function () {
		try {
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (e) {
			/* ignore */
		}
	}, 0);
	FBM.setStatus("Chat exported (" + rows.length + " lines).");
};

FBM.runFloatChatToolbarAction = function (action: string | null, btn?: HTMLElement | null) {
	if (!action) return;
	try {
		if (action === "more") {
			FBM.toggleFloatMoreMenu();
			return;
		}
		FBM.closeFloatMoreMenu();
		if (action === "leave" && typeof ChatRoomAttemptLeave === "function") {
			if (fcCfg().confirmLeave) {
				openFloatChatConfirm("Leave room?", "Leave this chat room?", function () {
					ChatRoomAttemptLeave();
				});
			} else {
				ChatRoomAttemptLeave();
			}
		} else if (action === "members") {
			if (typeof FBM.toggleFloatMembersPanel === "function") FBM.toggleFloatMembersPanel();
		} else if (action === "kneel" && typeof ChatRoomToggleKneel === "function") {
			ChatRoomToggleKneel();
			const lab = $("fbm-fc-kneel-label");
			const kneeling =
				typeof Player !== "undefined" &&
				Player &&
				typeof Player.IsKneeling === "function" &&
				Player.IsKneeling();
			if (lab) lab.textContent = kneeling ? "Stand" : "Kneel";
			const kneelBtn = btn || $("fbm-fc-kneel");
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
			const S = window.Seidr as { rmOpenPanel?: () => void } | undefined;
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

FBM.bindFloatChatUi = function () {
	bindFloatDrag();
	bindFloatResize();

	const close = buttonEl("fbm-fc-close");
	if (close && !close._fbmBound) {
		close._fbmBound = true;
		close.addEventListener("click", function () {
			FBM.closeFloatChat();
		});
	}

	const send = buttonEl("fbm-fc-send");
	if (send && !send._fbmBound) {
		send._fbmBound = true;
		send.addEventListener("click", function () {
			FBM.sendFloatChat();
		});
	}

	const replyClose = buttonEl("fbm-fc-reply-close");
	if (replyClose && !replyClose._fbmBound) {
		replyClose._fbmBound = true;
		replyClose.addEventListener("click", function () {
			FBM.clearFloatReply();
		});
	}

	const input = $("fbm-fc-input") as (HTMLTextAreaElement & FBMMarkedElement) | null;
	if (input && !input._fbmBound) {
		input._fbmBound = true;
		input.addEventListener("input", function () {
			FBM.scheduleFloatChatAc();
			FBM.refreshFloatComposeMode();
		});
		input.addEventListener("focusin", function () {
			try {
				const S = window.Seidr;
				if (S && typeof S.setCommandInput === "function") S.setCommandInput(input);
			} catch (e) {
				/* ignore */
			}
			FBM.refreshFloatComposeMode();
		});
		input.addEventListener("blur", function () {
			setTimeout(function () {
				try {
					const ae = document.activeElement as HTMLElement | null;
					const ac = document.getElementById("seidr-cmd-ac");
					if (ac && ae && ac.contains(ae)) return;
					const S = window.Seidr;
					if (S && typeof S.setCommandInput === "function") S.setCommandInput(null);
				} catch (e) {
					/* ignore */
				}
			}, 50);
		});
	}
	if (FBM.installFloatChatComposeKeys) FBM.installFloatChatComposeKeys();
	if (FBM.installFloatChatCompass) FBM.installFloatChatCompass();
	if (FBM.bindFloatMembersPanel) FBM.bindFloatMembersPanel();
	FBM.refreshFloatComposeMode();

	const bar = $("fbm-fc-toolbar");
	if (bar && !bar._fbmBound) {
		bar._fbmBound = true;
		bar.addEventListener("click", function (e) {
			const btn = fcClickActionEl(e.target);
			if (!btn || !bar.contains(btn)) return;
			/* Menu items bind their own click (stopPropagation); toolbar buttons use this. */
			if (btn.classList.contains("fbm-fc-more-item")) return;
			FBM.runFloatChatToolbarAction(btn.getAttribute("data-fc-action"), btn);
		});
		document.addEventListener("click", function (e) {
			const wrap = $("fbm-fc-more-wrap");
			if (!wrap) return;
			const t = e.target as Node | null;
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

// ===== SECTION: Chat settings UI and fonts =====

FBM.refreshFloatChatSettingsUi = function () {
	const cfg = fcCfg();
	const en = inputEl("fbm-fc-enabled");
	if (en) en.checked = cfg.enabled !== false;
	const auto = inputEl("fbm-fc-autoshow");
	if (auto) auto.checked = cfg.autoshow !== false;
	const autoclose = inputEl("fbm-fc-autoclose");
	if (autoclose) autoclose.checked = !!cfg.autoCloseOnJoin;
	const hk = inputEl("fbm-fc-hotkey");
	if (hk) hk.value = cfg.hotkey || "Alt+C";
	const size = inputEl("fbm-fc-size");
	const sizeVal = $("fbm-fc-size-val");
	if (size) size.value = String(cfg.fontSize || 13);
	if (sizeVal) sizeVal.textContent = (cfg.fontSize || 13) + "px";
	const tr = inputEl("fbm-fc-transparency");
	const trVal = $("fbm-fc-transparency-val");
	const trN = clampFcTransparency(cfg.transparency);
	if (tr) tr.value = String(trN);
	if (trVal) trVal.textContent = trN + "%";
	FBM.syncFloatFontSelectUi();
	const style = selectEl("fbm-fc-style");
	if (style) style.value = cfg.style || "dark";
	const wrap = $("fbm-fc-custom-wrap");
	if (wrap) wrap.hidden = (cfg.style || "dark") !== "custom";
	const css = $("fbm-fc-css") as HTMLTextAreaElement | null;
	if (css && !css.value) css.value = cfg.customCss || DEFAULT_CUSTOM_CSS;

	const hlOwn = inputEl("fbm-fc-hl-own");
	if (hlOwn) hlOwn.checked = !!cfg.highlightOwn;
	const ownNames = $("fbm-fc-own-names") as HTMLTextAreaElement | null;
	if (ownNames) {
		const stored = Array.isArray(cfg.ownNames) ? cfg.ownNames : [];
		const defaults = playerDefaultOwnNames();
		ownNames.value = (stored.length ? stored : defaults).join("\n");
		ownNames.placeholder = defaults.join("\n") || "Your name";
	}
	const hlSeidr = inputEl("fbm-fc-hl-seidr");
	if (hlSeidr) hlSeidr.checked = cfg.ownHighlightSeidr !== false;
	const hlColor = inputEl("fbm-fc-hl-color");
	if (hlColor) hlColor.value = cfg.ownHighlightColor || SEIDR_HIGHLIGHT;
	const hlOthers = inputEl("fbm-fc-hl-others");
	if (hlOthers) hlOthers.checked = !!cfg.highlightOthers;
	const wav = inputEl("fbm-fc-whisper-avatar");
	if (wav) wav.checked = !!cfg.whisperAvatar;
	const compass = inputEl("fbm-fc-map-compass");
	if (compass) compass.checked = !!cfg.mapCompass;
	const leaveConfirm = inputEl("fbm-fc-confirm-leave");
	if (leaveConfirm) leaveConfirm.checked = !!cfg.confirmLeave;
	const oocProtect = inputEl("fbm-fc-ooc-protect");
	if (oocProtect) oocProtect.checked = cfg.oocProtection !== false;
	syncOwnHighlightOptsVisibility();
	if (FBM.refreshTrustedHostsUi) FBM.refreshTrustedHostsUi();
	FBM.applyFloatChatTheme();
	FBM.refreshFloatComposeMode();
};

const FALLBACK_FONTS = [
	"system-ui, -apple-system, Segoe UI, sans-serif",
	"Georgia, 'Times New Roman', serif",
	"ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
	"'Segoe UI', Tahoma, sans-serif",
	"Verdana, Geneva, sans-serif",
	"'Trebuchet MS', sans-serif",
	"'Palatino Linotype', Palatino, serif",
	"Arial, Helvetica, sans-serif",
	"'Courier New', Courier, monospace",
	"Comic Sans MS, Comic Sans, cursive",
];

function quoteFontFamily(name: string): string {
	const n = String(name || "").trim();
	if (!n) return "";
	if (n.indexOf(",") >= 0) return n;
	if (/^[a-zA-Z0-9-]+$/.test(n)) return n;
	return "'" + n.replace(/'/g, "\\'") + "'";
}

FBM.collectLocalFontFamilies = async function (): Promise<string[]> {
	const set: Record<string, true> = {};
	FALLBACK_FONTS.forEach(function (f) {
		set[f] = true;
	});
	try {
		if (typeof document !== "undefined" && document.fonts && typeof document.fonts.forEach === "function") {
			document.fonts.forEach(function (face: FontFace) {
				const fam = String(face.family || "").replace(/^["']|["']$/g, "").trim();
				if (fam) set[quoteFontFamily(fam)] = true;
			});
		}
	} catch (e) {
		/* ignore */
	}
	try {
		const w = window as Window & {
			queryLocalFonts?: () => Promise<Array<{ family?: string }>>;
		};
		if (typeof w.queryLocalFonts === "function") {
			const fonts = await w.queryLocalFonts();
			for (let i = 0; i < fonts.length; i++) {
				const fam = String((fonts[i] && fonts[i].family) || "").trim();
				if (fam) set[quoteFontFamily(fam)] = true;
			}
		}
	} catch (e) {
		/* permission denied / unsupported */
	}
	return Object.keys(set).sort(function (a, b) {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});
};

const CUSTOM_FONT_VALUE = "__fbm_custom__";

FBM.populateFloatFontSelect = function (fonts?: string[]) {
	const sel = selectEl("fbm-fc-font");
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
	customOpt.textContent = "Custom…";
	sel.appendChild(customOpt);

	const match = Array.from(sel.options).some(function (o) {
		return o.value === current;
	});
	if (match) {
		sel.value = current;
	} else {
		sel.value = CUSTOM_FONT_VALUE;
		const custom = inputEl("fbm-fc-font-custom");
		if (custom) custom.value = current.split(",")[0].replace(/^['"]|['"]$/g, "").trim() || current;
	}
	FBM.syncFloatFontCustomRow();
};

FBM.syncFloatFontCustomRow = function () {
	const sel = selectEl("fbm-fc-font");
	const row = $("fbm-fc-font-custom-row");
	if (row) row.hidden = !(sel && sel.value === CUSTOM_FONT_VALUE);
};

FBM.syncFloatFontSelectUi = function () {
	const sel = selectEl("fbm-fc-font");
	const cfg = fcCfg();
	const fam = cfg.fontFamily || FALLBACK_FONTS[0];
	if (!sel) return;
	if (!sel.options.length) {
		FBM.populateFloatFontSelect(
			Array.isArray(FBM._fcFontFamilies) ? (FBM._fcFontFamilies as string[]) : FALLBACK_FONTS
		);
		return;
	}
	const match = Array.from(sel.options).some(function (o) {
		return o.value === fam;
	});
	if (match) sel.value = fam;
	else {
		sel.value = CUSTOM_FONT_VALUE;
		const custom = inputEl("fbm-fc-font-custom");
		if (custom) custom.value = fam.split(",")[0].replace(/^['"]|['"]$/g, "").trim() || fam;
	}
	FBM.syncFloatFontCustomRow();
};

FBM.applyFloatFontChoice = function (family: string, display?: string) {
	const fam = String(family || "").trim() || FALLBACK_FONTS[0];
	fcCfg().fontFamily = fam;
	FBM.saveSettings();
	FBM.applyFloatChatTheme();
	FBM.setStatus("Float chat font: " + (display || fam));
};

FBM.ensureFloatFontFamilies = function () {
	if (FBM._fcFontFamiliesLoading) return;
	if (Array.isArray(FBM._fcFontFamilies) && FBM._fcFontFamilies.length) {
		FBM.populateFloatFontSelect(FBM._fcFontFamilies as string[]);
		return;
	}
	FBM._fcFontFamiliesLoading = true;
	FBM.populateFloatFontSelect(FALLBACK_FONTS);
	FBM.collectLocalFontFamilies()
		.then(function (list) {
			FBM._fcFontFamilies = list;
			FBM._fcFontFamiliesLoading = false;
			FBM.populateFloatFontSelect(list);
			FBM.syncFloatFontSelectUi();
		})
		.catch(function () {
			FBM._fcFontFamilies = FALLBACK_FONTS.slice();
			FBM._fcFontFamiliesLoading = false;
			FBM.populateFloatFontSelect(FALLBACK_FONTS);
		});
};

function syncOwnHighlightOptsVisibility() {
	const opts = $("fbm-fc-hl-own-opts");
	const hlOwn = inputEl("fbm-fc-hl-own");
	if (opts) opts.hidden = !(hlOwn && hlOwn.checked);
	const colorRow = $("fbm-fc-hl-color-row");
	const hlSeidr = inputEl("fbm-fc-hl-seidr");
	if (colorRow) colorRow.hidden = !!(hlSeidr && hlSeidr.checked);
}

function parseOwnNamesInput(raw: string): string[] {
	const parts = String(raw || "").split(/[\n,]+/);
	const out: string[] = [];
	for (let i = 0; i < parts.length; i++) {
		const n = parts[i].trim();
		if (n && out.indexOf(n) < 0) out.push(n);
	}
	return out;
}

/* Extend settings bind/refresh from settings.ts via hooks on existing functions */
const _prevRefresh = FBM.refreshSettingsUi;
FBM.refreshSettingsUi = function () {
	if (typeof _prevRefresh === "function") _prevRefresh();
	if (FBM.refreshFloatChatSettingsUi) FBM.refreshFloatChatSettingsUi();
};

const _prevBind = FBM.bindSettingsUi;
FBM.bindSettingsUi = function () {
	if (typeof _prevBind === "function") _prevBind();
	FBM.bindFloatChatSettingsControls();
};

FBM.bindFloatChatSettingsControls = function () {
	function saveCfg() {
		FBM.saveSettings();
		FBM.applyFloatChatTheme();
		FBM.refreshFloatChatVisibility();
	}

	const en = inputEl("fbm-fc-enabled");
	if (en && !en._fbmBound) {
		en._fbmBound = true;
		en.addEventListener("change", function () {
			fcCfg().enabled = !!en.checked;
			saveCfg();
			if (!en.checked) FBM.closeFloatChat();
			FBM.setStatus("Floatable Chat " + (en.checked ? "on." : "off."));
		});
	}
	const auto = inputEl("fbm-fc-autoshow");
	if (auto && !auto._fbmBound) {
		auto._fbmBound = true;
		auto.addEventListener("change", function () {
			fcCfg().autoshow = !!auto.checked;
			saveCfg();
			FBM.setStatus("Float chat autoshow " + (auto.checked ? "on." : "off."));
			if (fcCfg().autoCloseOnJoin && !auto.checked) FBM.warnAutoCloseWithoutAutoshow();
		});
	}
	const autoclose = inputEl("fbm-fc-autoclose");
	if (autoclose && !autoclose._fbmBound) {
		autoclose._fbmBound = true;
		autoclose.addEventListener("change", function () {
			fcCfg().autoCloseOnJoin = !!autoclose.checked;
			saveCfg();
			FBM.setStatus("Autoclose chat on join " + (autoclose.checked ? "on." : "off."));
			if (autoclose.checked && fcCfg().autoshow === false) FBM.warnAutoCloseWithoutAutoshow();
		});
	}
	const hk = inputEl("fbm-fc-hotkey");
	if (hk && !hk._fbmBound) {
		hk._fbmBound = true;
		hk.addEventListener("change", function () {
			const v = (hk.value || "").trim() || "Alt+C";
			hk.value = v;
			fcCfg().hotkey = v;
			saveCfg();
			FBM.setStatus("Float chat hotkey: " + v);
		});
	}
	const cap = buttonEl("fbm-fc-hotkey-capture");
	if (cap && !cap._fbmBound) {
		cap._fbmBound = true;
		cap.addEventListener("click", function () {
			if (FBM._capturingHotkey || FBM._capturingFcHotkey) return;
			FBM._capturingFcHotkey = true;
			const prev = cap.textContent;
			cap.textContent = "Listening…";
			FBM.setStatus("Press a shortcut (e.g. Alt+C)… Esc cancels.");
			let timer: ReturnType<typeof setTimeout> | null = null;
			function finish(spec: string | null) {
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
			function onKey(e: KeyboardEvent) {
				e.preventDefault();
				e.stopPropagation();
				const raw = e.key || "";
				if (raw === "Escape") {
					finish(null);
					return;
				}
				if (!raw || raw === "Control" || raw === "Alt" || raw === "Shift" || raw === "Meta") return;
				const parts: string[] = [];
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
	const size = inputEl("fbm-fc-size");
	const sizeVal = $("fbm-fc-size-val");
	if (size && !size._fbmBound) {
		size._fbmBound = true;
		size.addEventListener("input", function () {
			const n = Math.floor(Number(size.value) || 13);
			fcCfg().fontSize = n;
			if (sizeVal) sizeVal.textContent = n + "px";
			FBM.applyFloatChatTheme();
		});
		size.addEventListener("change", function () {
			saveCfg();
		});
	}
	const tr = inputEl("fbm-fc-transparency");
	const trVal = $("fbm-fc-transparency-val");
	if (tr && !tr._fbmBound) {
		tr._fbmBound = true;
		tr.addEventListener("input", function () {
			const n = clampFcTransparency(tr.value);
			fcCfg().transparency = n;
			if (trVal) trVal.textContent = n + "%";
			FBM.applyFloatChatTheme();
		});
		tr.addEventListener("change", function () {
			saveCfg();
		});
	}
	FBM.ensureFloatFontFamilies();
	const fontSel = selectEl("fbm-fc-font") as (HTMLSelectElement & FBMMarkedElement) | null;
	if (fontSel && !fontSel._fbmBound) {
		fontSel._fbmBound = true;
		fontSel.addEventListener("change", function () {
			FBM.syncFloatFontCustomRow();
			if (fontSel.value === CUSTOM_FONT_VALUE) {
				const custom = inputEl("fbm-fc-font-custom");
				const v = (custom && custom.value.trim()) || "";
				if (v) FBM.applyFloatFontChoice(quoteFontFamily(v), v);
				return;
			}
			FBM.applyFloatFontChoice(fontSel.value);
		});
	}
	const fontCustom = inputEl("fbm-fc-font-custom") as (HTMLInputElement & FBMMarkedElement) | null;
	if (fontCustom && !fontCustom._fbmBound) {
		fontCustom._fbmBound = true;
		fontCustom.addEventListener("change", function () {
			const v = (fontCustom.value || "").trim();
			if (!v) return;
			FBM.applyFloatFontChoice(quoteFontFamily(v), v);
		});
	}
	const style = selectEl("fbm-fc-style");
	if (style && !style._fbmBound) {
		style._fbmBound = true;
		style.addEventListener("change", function () {
			const v = style.value;
			fcCfg().style = v === "light" || v === "custom" ? v : "dark";
			const wrap = $("fbm-fc-custom-wrap");
			if (wrap) wrap.hidden = fcCfg().style !== "custom";
			saveCfg();
		});
	}
	const css = $("fbm-fc-css") as (HTMLTextAreaElement & FBMMarkedElement) | null;
	const apply = buttonEl("fbm-fc-css-apply");
	if (apply && !apply._fbmBound) {
		apply._fbmBound = true;
		apply.addEventListener("click", function () {
			fcCfg().customCss = css ? css.value : "";
			fcCfg().style = "custom";
			if (style) style.value = "custom";
			saveCfg();
			FBM.setStatus("Custom float chat CSS applied.");
		});
	}
	const reset = buttonEl("fbm-fc-css-reset");
	if (reset && !reset._fbmBound) {
		reset._fbmBound = true;
		reset.addEventListener("click", function () {
			fcCfg().style = "dark";
			fcCfg().customCss = "";
			if (style) style.value = "dark";
			if (css) css.value = DEFAULT_CUSTOM_CSS;
			const wrap = $("fbm-fc-custom-wrap");
			if (wrap) wrap.hidden = true;
			saveCfg();
			FBM.setStatus("Float chat theme: Dark.");
		});
	}
	const openBtn = buttonEl("fbm-fc-open");
	if (openBtn && !openBtn._fbmBound) {
		openBtn._fbmBound = true;
		openBtn.addEventListener("click", function () {
			fcCfg().enabled = true;
			if (en) en.checked = true;
			FBM.openFloatChat();
			saveCfg();
		});
	}

	function saveHighlights() {
		const cfg = fcCfg();
		const hlOwn = inputEl("fbm-fc-hl-own");
		const ownNames = $("fbm-fc-own-names") as HTMLTextAreaElement | null;
		const hlSeidr = inputEl("fbm-fc-hl-seidr");
		const hlColor = inputEl("fbm-fc-hl-color");
		const hlOthers = inputEl("fbm-fc-hl-others");
		cfg.highlightOwn = !!(hlOwn && hlOwn.checked);
		let names = ownNames ? parseOwnNamesInput(ownNames.value) : [];
		if (cfg.highlightOwn && !names.length) {
			names = playerDefaultOwnNames();
			if (ownNames) ownNames.value = names.join("\n");
		}
		cfg.ownNames = names;
		cfg.ownHighlightSeidr = !!(hlSeidr && hlSeidr.checked);
		if (hlColor && hlColor.value) cfg.ownHighlightColor = hlColor.value;
		cfg.highlightOthers = !!(hlOthers && hlOthers.checked);
		syncOwnHighlightOptsVisibility();
		FBM.saveSettings();
		try {
			FBM.reaugmentFloatChatLog();
		} catch (e) {
			console.warn("[FBM] reaugment highlights", e);
		}
	}

	const hlOwn = inputEl("fbm-fc-hl-own");
	if (hlOwn && !hlOwn._fbmBound) {
		hlOwn._fbmBound = true;
		hlOwn.addEventListener("change", function () {
			if (hlOwn.checked) {
				const ownNamesEl = $("fbm-fc-own-names") as HTMLTextAreaElement | null;
				if (ownNamesEl && !parseOwnNamesInput(ownNamesEl.value).length) {
					ownNamesEl.value = playerDefaultOwnNames().join("\n");
				}
			}
			saveHighlights();
			FBM.setStatus("Own-name highlight " + (hlOwn.checked ? "on." : "off."));
		});
	}
	const ownNames = $("fbm-fc-own-names") as (HTMLTextAreaElement & FBMMarkedElement) | null;
	if (ownNames && !ownNames._fbmBound) {
		ownNames._fbmBound = true;
		ownNames.addEventListener("change", function () {
			saveHighlights();
			FBM.setStatus("Own names updated.");
		});
	}
	const hlSeidr = inputEl("fbm-fc-hl-seidr");
	if (hlSeidr && !hlSeidr._fbmBound) {
		hlSeidr._fbmBound = true;
		hlSeidr.addEventListener("change", function () {
			saveHighlights();
		});
	}
	const hlColor = inputEl("fbm-fc-hl-color");
	if (hlColor && !hlColor._fbmBound) {
		hlColor._fbmBound = true;
		hlColor.addEventListener("input", function () {
			saveHighlights();
		});
		hlColor.addEventListener("change", function () {
			saveHighlights();
		});
	}
	const hlOthers = inputEl("fbm-fc-hl-others");
	if (hlOthers && !hlOthers._fbmBound) {
		hlOthers._fbmBound = true;
		hlOthers.addEventListener("change", function () {
			saveHighlights();
			FBM.setStatus(
				"Other-name body highlight " + (hlOthers.checked ? "on." : "off.")
			);
		});
	}

	const wav = inputEl("fbm-fc-whisper-avatar");
	if (wav && !wav._fbmBound) {
		wav._fbmBound = true;
		wav.addEventListener("change", function () {
			fcCfg().whisperAvatar = !!wav.checked;
			saveCfg();
			FBM.refreshFloatComposeMode();
			FBM.setStatus("Whisper avatar " + (wav.checked ? "on." : "off."));
		});
	}
	const compass = inputEl("fbm-fc-map-compass");
	if (compass && !compass._fbmBound) {
		compass._fbmBound = true;
		compass.addEventListener("change", function () {
			fcCfg().mapCompass = !!compass.checked;
			saveCfg();
			if (!compass.checked && typeof FBM.clearFloatChatCompassTarget === "function") {
				FBM.clearFloatChatCompassTarget();
			}
			FBM.setStatus(
				compass.checked
					? "Map compass on — hover a Members name (or float-chat name) while on the map."
					: "Map compass off."
			);
		});
	}
	const leaveConfirm = inputEl("fbm-fc-confirm-leave");
	if (leaveConfirm && !leaveConfirm._fbmBound) {
		leaveConfirm._fbmBound = true;
		leaveConfirm.addEventListener("change", function () {
			fcCfg().confirmLeave = !!leaveConfirm.checked;
			saveCfg();
			FBM.setStatus("Leave confirm " + (leaveConfirm.checked ? "on." : "off."));
		});
	}
	const oocProtect = inputEl("fbm-fc-ooc-protect");
	if (oocProtect && !oocProtect._fbmBound) {
		oocProtect._fbmBound = true;
		oocProtect.addEventListener("change", function () {
			fcCfg().oocProtection = !!oocProtect.checked;
			saveCfg();
			FBM.setStatus("OOC Protection " + (oocProtect.checked ? "on." : "off."));
		});
	}
};

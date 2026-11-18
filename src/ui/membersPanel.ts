/** Freyas Better Maps — Floatable Chat Members panel (docked above log) */
import { FBM, type FBMMarkedElement } from "../fbm";

declare const ChatRoomCharacter: Array<{
	MemberNumber?: number;
	Name?: string;
	Nickname?: string;
	Canvas?: HTMLCanvasElement;
	CanvasBlink?: HTMLCanvasElement;
	IsPlayer?: () => boolean;
	IsFriend?: () => boolean;
	IsLoverOfPlayer?: () => boolean;
	IsOwnedByPlayer?: () => boolean;
	IsWhitelisted?: () => boolean;
}> | undefined;
declare const ChatRoomData:
	| {
			Admin?: number[];
			Whitelist?: number[];
	  }
	| undefined;
declare const ChatRoomPlayerIsAdmin: (() => boolean) | undefined;
declare const ChatRoomAdminChatAction: ((action: string, argument: string) => void) | undefined;
declare const Player: { MemberNumber?: number; WhiteList?: number[] } | undefined;

function $(id: string): FBMMarkedElement | null {
	return document.getElementById(id) as FBMMarkedElement | null;
}

function isAdminMember(mn: number): boolean {
	try {
		return !!(
			ChatRoomData &&
			Array.isArray(ChatRoomData.Admin) &&
			ChatRoomData.Admin.indexOf(mn) >= 0
		);
	} catch (e) {
		return false;
	}
}

function isRoomWhitelisted(mn: number): boolean {
	try {
		return !!(
			ChatRoomData &&
			Array.isArray(ChatRoomData.Whitelist) &&
			ChatRoomData.Whitelist.indexOf(mn) >= 0
		);
	} catch (e) {
		return false;
	}
}

function initials(nick: string, name: string): string {
	const s = (nick || name || "?").trim();
	if (s.length >= 2) return s.slice(0, 2).toUpperCase();
	return (s[0] || "?").toUpperCase();
}

function pill(label: string, kind: string): HTMLElement {
	const el = document.createElement("span");
	el.className = "fbm-fc-pill fbm-fc-pill-" + kind;
	el.textContent = label;
	return el;
}

function adminBtn(
	label: string,
	title: string,
	cls: string,
	onClick: () => void
): HTMLButtonElement {
	const b = document.createElement("button");
	b.type = "button";
	b.className = "fbm-fc-mem-btn " + cls;
	b.textContent = label;
	b.title = title;
	b.addEventListener("click", function (ev) {
		ev.preventDefault();
		ev.stopPropagation();
		onClick();
	});
	return b;
}

function confirmAdmin(title: string, body: string, action: string, mn: number, status: string) {
	const run = function () {
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

let membersPointerX = -1;
let membersPointerY = -1;
let membersHoverMn: number | null = null;

function membersHeightPct(): number {
	const cfg = FBM.settings && FBM.settings.floatChat;
	const n = Number(cfg && cfg.membersHeightPct != null ? cfg.membersHeightPct : 30);
	if (!isFinite(n)) return 30;
	return Math.max(15, Math.min(70, Math.round(n)));
}

FBM.applyFloatMembersHeight = function () {
	const panel = $("fbm-fc-members");
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

FBM.floatMembersIsOpen = function () {
	const panel = $("fbm-fc-members");
	return !!(panel && !panel.hidden);
};

FBM.closeFloatMembersPanel = function () {
	const panel = $("fbm-fc-members");
	const btn = $("fbm-fc-members-btn");
	const handle = $("fbm-fc-members-resize");
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

FBM.toggleFloatMembersPanel = function () {
	if (FBM.floatMembersIsOpen()) FBM.closeFloatMembersPanel();
	else FBM.openFloatMembersPanel();
};

FBM.openFloatMembersPanel = function () {
	const panel = $("fbm-fc-members");
	const btn = $("fbm-fc-members-btn");
	const handle = $("fbm-fc-members-resize");
	if (!panel) return;
	panel.hidden = false;
	if (handle) handle.hidden = false;
	if (btn) btn.classList.add("fbm-fc-on");
	FBM.applyFloatMembersHeight();
	FBM.refreshFloatMembersPanel();
	if (!FBM._fcMembersTimer) {
		FBM._fcMembersTimer = setInterval(function () {
			if (!FBM.floatMembersIsOpen()) {
				FBM.closeFloatMembersPanel();
				return;
			}
			FBM.refreshFloatMembersPanel();
		}, 2500);
	}
};

function reapplyMembersCompassFromPointer(list: HTMLElement) {
	const cfg = FBM.settings && FBM.settings.floatChat;
	if (!cfg || !cfg.mapCompass || typeof FBM.setFloatChatCompassTarget !== "function") return;
	let over = false;
	try {
		over = list.matches(":hover");
	} catch (e) {
		over = false;
	}
	if (!over) return;
	let row: Element | null = null;
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
	const list = $("fbm-fc-members-list") as (HTMLElement & FBMMarkedElement) | null;
	if (!list || list._fbmBound) return;
	list._fbmBound = true;
	list.addEventListener("mousemove", function (ev) {
		membersPointerX = ev.clientX;
		membersPointerY = ev.clientY;
	});
	list.addEventListener("mouseover", function (ev) {
		const cfg = FBM.settings && FBM.settings.floatChat;
		if (!cfg || !cfg.mapCompass || typeof FBM.setFloatChatCompassTarget !== "function") return;
		const t = ev.target as Element | null;
		const row = t && t.closest ? t.closest(".fbm-fc-mem-row") : null;
		if (!row || !list.contains(row)) return;
		const mn = Number(row.getAttribute("data-mn"));
		if (Number.isFinite(mn) && mn > 0) {
			membersHoverMn = mn;
			membersPointerX = (ev as MouseEvent).clientX;
			membersPointerY = (ev as MouseEvent).clientY;
			FBM.setFloatChatCompassTarget(mn);
		}
	});
	list.addEventListener("mouseleave", function () {
		membersHoverMn = null;
		membersPointerX = -1;
		membersPointerY = -1;
		if (typeof FBM.clearFloatChatCompassTarget === "function") {
			FBM.clearFloatChatCompassTarget();
		}
	});
}

FBM.refreshFloatMembersPanel = function () {
	const list = $("fbm-fc-members-list");
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
	const amAdmin =
		typeof ChatRoomPlayerIsAdmin === "function" && !!ChatRoomPlayerIsAdmin();
	const selfMn =
		typeof Player !== "undefined" && Player && typeof Player.MemberNumber === "number"
			? Player.MemberNumber
			: -1;

	const chars = ChatRoomCharacter.slice().sort(function (a, b) {
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
		const isSelf = mn === selfMn || (typeof C.IsPlayer === "function" && C.IsPlayer());

		const row = document.createElement("div");
		row.className = "fbm-fc-mem-row" + (isSelf ? " fbm-fc-mem-self" : "");
		row.setAttribute("data-mn", String(mn));

		row.addEventListener("contextmenu", function (ev) {
			if (typeof FBM.openFcPersonContextMenu !== "function") return;
			FBM.openFcPersonContextMenu(ev, {
				mn: mn,
				label: nick + " (" + mn + ")",
				copyId: String(mn),
				adminActions: true,
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
		idEl.addEventListener("click", function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			const text = String(mn);
			const done = function () {
				FBM.setStatus("Copied ID " + text);
			};
			try {
				if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
					navigator.clipboard.writeText(text).then(done).catch(function () {
						done();
					});
					return;
				}
			} catch (e) {
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
			if (
				(typeof C.IsWhitelisted === "function" && C.IsWhitelisted()) ||
				(Player && Array.isArray(Player.WhiteList) && Player.WhiteList.indexOf(mn) >= 0)
			) {
				rel.appendChild(pill("WL", "wl"));
			}
		} catch (e) {
			/* ignore */
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
					function () {
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
					function () {
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
				adminBtn("Kick", "Kick from room", "fbm-fc-mem-warn", function () {
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
				adminBtn("+BAN", "Ban from room", "fbm-fc-mem-danger", function () {
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
		requestAnimationFrame(function () {
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
	const handle = $("fbm-fc-members-resize") as (HTMLElement & FBMMarkedElement) | null;
	const panel = $("fbm-fc-members");
	const root = $("fbm-float-chat");
	if (!handle || !panel || !root || handle._fbmBound) return;
	handle._fbmBound = true;
	let dragging = false;
	handle.addEventListener("pointerdown", function (ev) {
		if (panel.hidden) return;
		ev.preventDefault();
		dragging = true;
		handle.setPointerCapture(ev.pointerId);
	});
	handle.addEventListener("pointermove", function (ev) {
		if (!dragging) return;
		const body = root.querySelector(".fbm-fc-body") as HTMLElement | null;
		const area = body || root;
		const rect = area.getBoundingClientRect();
		const membersTop = panel.getBoundingClientRect().top;
		const totalH = rect.bottom - membersTop;
		if (!(totalH > 40)) return;
		const pct = ((ev.clientY - membersTop) / totalH) * 100;
		const clamped = Math.max(15, Math.min(70, Math.round(pct)));
		if (!FBM.settings.floatChat) return;
		FBM.settings.floatChat.membersHeightPct = clamped;
		FBM.applyFloatMembersHeight();
	});
	function endDrag(ev: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		try {
			handle.releasePointerCapture(ev.pointerId);
		} catch (e) {
			/* ignore */
		}
		FBM.saveSettings();
	}
	handle.addEventListener("pointerup", endDrag);
	handle.addEventListener("pointercancel", endDrag);
}

FBM.bindFloatMembersPanel = function () {
	const close = $("fbm-fc-members-close") as (HTMLButtonElement & FBMMarkedElement) | null;
	if (close && !close._fbmBound) {
		close._fbmBound = true;
		close.addEventListener("click", function () {
			FBM.closeFloatMembersPanel();
		});
	}
	bindMembersCompassHover();
	bindMembersResize();
};

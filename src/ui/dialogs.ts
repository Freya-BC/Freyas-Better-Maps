/** Freyas Better Maps — in-plugin prompt (Electron has no window.prompt). */
import { FBM } from "../fbm";

export type FBMPromptOpts = {
	message?: string;
	initial?: string;
	placeholder?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	maxlength?: number;
};

function escapeHtml(s: string): string {
	return String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function removeOverlay(overlay: HTMLElement) {
	if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
}

/**
 * Text prompt modal. Resolves trimmed string, or null on Cancel / backdrop / Escape.
 * Prefer this over window.prompt — Electron WebContents returns null without a dialog.
 */
FBM.promptText = function (title: string, opts?: FBMPromptOpts): Promise<string | null> {
	if (FBM.ensureUi) FBM.ensureUi();
	const body = (opts && opts.message) || "";
	const initial = (opts && opts.initial) || "";
	const placeholder = (opts && opts.placeholder) || "";
	const okLabel = (opts && opts.confirmLabel) || "OK";
	const cancelLabel = (opts && opts.cancelLabel) || "Cancel";
	const maxlength = (opts && opts.maxlength) || 40;

	return new Promise(function (resolve) {
		const host = document.getElementById("fbm-root") || document.body;
		const overlay = document.createElement("div");
		overlay.className = "fbm-prompt-overlay";
		overlay.innerHTML = [
			'<div class="fbm-prompt-dialog" role="dialog" aria-modal="true" aria-labelledby="fbm-prompt-title">',
			'<h4 id="fbm-prompt-title">' + escapeHtml(title) + "</h4>",
			body ? '<p class="fbm-prompt-msg">' + escapeHtml(body) + "</p>" : "",
			'<div class="fbm-prompt-field">',
			'<input type="text" id="fbm-prompt-input" maxlength="' +
				maxlength +
				'"' +
				(placeholder ? ' placeholder="' + escapeHtml(placeholder) + '"' : "") +
				" />",
			"</div>",
			'<div class="fbm-prompt-actions">',
			'<button type="button" class="fbm-btn" data-act="cancel">' + escapeHtml(cancelLabel) + "</button>",
			'<button type="button" class="fbm-btn fbm-btn-accent" data-act="ok">' + escapeHtml(okLabel) + "</button>",
			"</div></div>",
		].join("");
		host.appendChild(overlay);
		FBM._promptOpen = true;

		const input = overlay.querySelector("#fbm-prompt-input") as HTMLInputElement;
		input.value = initial;

		let settled = false;
		function finish(value: string | null) {
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
		function onKey(ev: KeyboardEvent) {
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
		overlay.addEventListener("click", function (ev) {
			if (ev.target === overlay) finish(null);
		});
		overlay.querySelector('[data-act="cancel"]')!.addEventListener("click", function () {
			finish(null);
		});
		overlay.querySelector('[data-act="ok"]')!.addEventListener("click", submit);
		try {
			input.focus();
			input.select();
		} catch (e) {
			/* ignore */
		}
	});
};

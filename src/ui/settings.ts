/** Freyas Better Maps — ui/settings.js */
import { FBM, type FBMMarkedElement } from "../fbm";

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

function fmtTime(ts) {
	if (!ts) return "";
	try {
		return new Date(ts).toLocaleString();
	} catch (e) {
		return String(ts);
	}
}

FBM.refreshSettingsUi = function () {
	if (!FBM.settings) return;
	FBM.loadMapOverflow();
	const s = FBM.settings;
	const set = function (id: string, on: boolean) {
		const el = inputEl(id);
		if (el) el.checked = !!on;
	};
	set("fbm-typing", s.typingIndicator);
	set("fbm-hide-toolbar", s.hideBuildToolbar);
	set("fbm-building", s.buildingTools);
	set("fbm-blindfold", s.fullBlindfold);
	set("fbm-whisper", s.hearingWhisper);
	set("fbm-zoom", s.fullZoomOut);
	set("fbm-hide-room-update", s.hideRoomUpdateSpam);
	const styleSel = selectEl("fbm-blindfold-style");
	if (styleSel) {
		styleSel.value = s.blindfoldOthersStyle === "silhouette" ? "silhouette" : "greyscale";
		styleSel.disabled = !s.fullBlindfold;
	}
	const cool = inputEl("fbm-room-update-cool");
	if (cool) {
		cool.value = String(s.roomUpdateHideCooldownMin != null ? s.roomUpdateHideCooldownMin : 5);
		cool.disabled = !s.hideRoomUpdateSpam;
	}
	const hk = inputEl("fbm-build-hotkey");
	if (hk) hk.value = s.buildBarHotkey || "Alt+B";
	const ver = $("fbm-about-ver");
	if (ver) ver.textContent = FBM.VERSION || "";

	const list = $("fbm-map-list");
	if (list) {
		list.innerHTML = "";
		(s.maps || []).forEach(function (m) {
			if (!m) return;
			const row = document.createElement("div");
			row.className = "fbm-map-item";
			const span = document.createElement("span");
			span.innerHTML =
				"<strong></strong><div class=\"fbm-map-meta\"></div>";
			span.querySelector("strong").textContent = m.name || "Untitled";
			span.querySelector(".fbm-map-meta").textContent = fmtTime(m.savedAt) + (m.overflow ? " · overflow" : "");
			const load = document.createElement("button");
			load.type = "button";
			load.className = "fbm-btn";
			load.textContent = "Load";
			load.addEventListener("click", function () {
				FBM.loadNamedMap(m.id);
			});
			const del = document.createElement("button");
			del.type = "button";
			del.className = "fbm-btn fbm-btn-danger";
			del.textContent = "×";
			del.title = "Delete";
			del.addEventListener("click", function () {
				if (!confirm("Delete map “" + (m.name || "") + "”?")) return;
				FBM.deleteNamedMap(m.id);
				FBM.refreshSettingsUi();
				FBM.setStatus("Deleted map.");
			});
			row.appendChild(span);
			row.appendChild(load);
			row.appendChild(del);
			list.appendChild(row);
		});
		if (!(s.maps || []).length) {
			list.innerHTML = '<p class="fbm-muted fbm-hint">No saved maps yet.</p>';
		}
	}

	const asLabel = $("fbm-autosave-label");
	const asBtn = buttonEl("fbm-autosave-load");
	if (asLabel && asBtn) {
		if (s.autosave && (s.autosave.data || s.autosave.overflow)) {
			asLabel.textContent = "Autosave — " + fmtTime(s.autosave.savedAt);
			asBtn.disabled = false;
		} else {
			asLabel.textContent = "Autosave — empty";
			asBtn.disabled = true;
		}
	}
};

FBM.bindSettingsUi = function () {
	function bindToggle(id: string, key: string, after?: (on: boolean) => void) {
		const el = inputEl(id);
		if (!el || el._fbmBound) return;
		el._fbmBound = true;
		el.addEventListener("change", function () {
			FBM.settings[key] = !!el.checked;
			FBM.saveSettings();
			if (after) after(el.checked);
			FBM.setStatus((el.nextElementSibling && el.nextElementSibling.textContent) + (el.checked ? " on." : " off."));
			if (FBM.refreshBuildBar) FBM.refreshBuildBar();
		});
	}
	bindToggle("fbm-typing", "typingIndicator");
	bindToggle("fbm-hide-toolbar", "hideBuildToolbar", function () {
		FBM._toolbarExpanded = false;
		if (FBM.syncMapEditorPanel) FBM.syncMapEditorPanel();
	});
	bindToggle("fbm-building", "buildingTools");
	bindToggle("fbm-blindfold", "fullBlindfold", function () {
		const styleSel = selectEl("fbm-blindfold-style");
		if (styleSel) styleSel.disabled = !FBM.settings.fullBlindfold;
	});
	bindToggle("fbm-whisper", "hearingWhisper");
	bindToggle("fbm-zoom", "fullZoomOut", function () {
		FBM.applyZoomSetting();
	});
	bindToggle("fbm-hide-room-update", "hideRoomUpdateSpam", function () {
		const cool = inputEl("fbm-room-update-cool");
		if (cool) cool.disabled = !FBM.settings.hideRoomUpdateSpam;
	});

	const styleSel = selectEl("fbm-blindfold-style");
	if (styleSel && !styleSel._fbmBound) {
		styleSel._fbmBound = true;
		styleSel.addEventListener("change", function () {
			FBM.settings.blindfoldOthersStyle =
				styleSel.value === "silhouette" ? "silhouette" : "greyscale";
			FBM.saveSettings();
			FBM.setStatus(
				"Blindfold others: " +
					(FBM.settings.blindfoldOthersStyle === "silhouette"
						? "generic silhouette"
						: "greyscale models") +
					"."
			);
		});
	}

	const cool = inputEl("fbm-room-update-cool");
	if (cool && !cool._fbmBound) {
		cool._fbmBound = true;
		cool.addEventListener("change", function () {
			let n = Math.floor(Number(cool.value));
			if (!isFinite(n) || n < 1) n = 5;
			if (n > 120) n = 120;
			cool.value = String(n);
			FBM.settings.roomUpdateHideCooldownMin = n;
			FBM.saveSettings();
			FBM.setStatus("Room-update hide cooldown: " + n + " min.");
		});
	}

	const hk = inputEl("fbm-build-hotkey");
	if (hk && !hk._fbmBound) {
		hk._fbmBound = true;
		hk.addEventListener("change", function () {
			const v = (hk.value || "").trim() || "Alt+B";
			hk.value = v;
			FBM.settings.buildBarHotkey = v;
			FBM.saveSettings();
			FBM.setStatus("Build bar hotkey: " + v);
		});
	}
	const cap = buttonEl("fbm-build-hotkey-capture");
	if (cap && !cap._fbmBound) {
		cap._fbmBound = true;
		cap.addEventListener("click", function () {
			if (FBM._capturingHotkey) return;
			FBM._capturingHotkey = true;
			const prevLabel = cap.textContent;
			cap.textContent = "Listening…";
			FBM.setStatus("Press a shortcut (e.g. Alt+B)… Esc cancels.");
			let timer = null;
			function finish(spec) {
				FBM._capturingHotkey = false;
				document.removeEventListener("keydown", onKey, true);
				if (timer) clearTimeout(timer);
				cap.textContent = prevLabel || "Capture";
				if (spec) {
					FBM.settings.buildBarHotkey = spec;
					if (hk) hk.value = spec;
					FBM.saveSettings();
					FBM.setStatus("Build bar hotkey: " + spec);
				} else {
					FBM.setStatus("Hotkey capture cancelled.");
				}
			}
			function onKey(e) {
				e.preventDefault();
				e.stopPropagation();
				const raw = e.key || "";
				if (raw === "Escape") {
					finish(null);
					return;
				}
				/* Modifier-only: keep listening (Alt then B arrives as two events). */
				if (!raw || raw === "Control" || raw === "Alt" || raw === "Shift" || raw === "Meta") return;
				const parts = [];
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

	const saveBtn = $("fbm-map-save");
	if (saveBtn && !saveBtn._fbmBound) {
		saveBtn._fbmBound = true;
		saveBtn.addEventListener("click", function () {
			const nameEl = inputEl("fbm-map-name");
			const name = (nameEl && nameEl.value ? nameEl.value : "").trim();
			FBM.saveNamedMap(name);
			if (nameEl) nameEl.value = "";
			FBM.refreshSettingsUi();
		});
	}
	const asBtnLoad = buttonEl("fbm-autosave-load");
	if (asBtnLoad && !asBtnLoad._fbmBound) {
		asBtnLoad._fbmBound = true;
		asBtnLoad.addEventListener("click", function () {
			FBM.loadAutosave();
		});
	}
};

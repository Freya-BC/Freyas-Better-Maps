/** Freyas Better Maps — face crop for float whisper avatar + Members */
import { FBM } from "../fbm";

declare const DrawCharacterSegment:
	| ((C: unknown, X: number, Y: number, W: number, H: number) => HTMLCanvasElement | HTMLImageElement | null)
	| undefined;
declare const CanvasUpperOverflow: number | undefined;

type PortraitChar = {
	Canvas?: HTMLCanvasElement;
	CanvasBlink?: HTMLCanvasElement;
	Name?: string;
	Nickname?: string;
	MemberNumber?: number;
};

function initialsFrom(C: PortraitChar | null | undefined, fallback?: string): string {
	const nick = String((C && C.Nickname) || "").trim();
	const name = String((C && C.Name) || "").trim();
	const s = (fallback || nick || name || "?").trim();
	if (s.length >= 2) return s.slice(0, 2).toUpperCase();
	return (s[0] || "?").toUpperCase();
}

/** Draw a face crop onto an offscreen canvas. Never insert Club canvases into the DOM. */
function drawFaceToCanvas(
	character: PortraitChar,
	size: number
): HTMLCanvasElement | null {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;
	ctx.fillStyle = "#1e2329";
	ctx.fillRect(0, 0, size, size);
	let drew = false;
	try {
		if (typeof DrawCharacterSegment === "function") {
			const seg = DrawCharacterSegment(character, 80, 0, 340, 450);
			/* Copy pixels only — never append `seg` (it may be a large live canvas). */
			if (seg) {
				ctx.drawImage(seg, 0, 0, size, size);
				drew = true;
			}
		}
	} catch (e) {
		/* try overflow crop */
	}
	if (!drew) {
		try {
			const src = character.Canvas || character.CanvasBlink;
			if (src && src.width > 0 && src.height > 0) {
				const overflow =
					typeof CanvasUpperOverflow === "number" ? CanvasUpperOverflow : 700;
				const sw = Math.min(340, src.width);
				const sh = Math.min(450, Math.max(1, src.height - overflow));
				const sx = Math.min(80, Math.max(0, src.width - sw));
				const sy = Math.min(overflow, Math.max(0, src.height - sh));
				ctx.drawImage(src, sx, sy, sw, sh, 0, 0, size, size);
				drew = true;
			}
		} catch (e2) {
			return null;
		}
	}
	return drew ? canvas : null;
}

/**
 * Paint a face portrait into `host` as a fixed-size <img> (never a live Club canvas).
 * Falls back to initials. Returns true when an image was appended.
 */
FBM.paintFacePortrait = function (
	host: HTMLElement | null,
	character: PortraitChar | null | undefined,
	opts?: { size?: number; fallbackName?: string }
): boolean {
	if (!host) return false;
	host.innerHTML = "";
	const size = Math.max(24, Math.min(96, Math.floor((opts && opts.size) || 48)));
	const fallback = initialsFrom(character, opts && opts.fallbackName);

	if (character) {
		try {
			const url = FBM.facePortraitDataUrl(character, size);
			if (url) {
				const img = document.createElement("img");
				img.className = "fbm-fc-face-img";
				img.alt = "";
				img.draggable = false;
				img.width = size;
				img.height = size;
				img.style.cssText =
					"display:block;width:" +
					size +
					"px;height:" +
					size +
					"px;max-width:" +
					size +
					"px;max-height:" +
					size +
					"px;object-fit:cover;";
				img.src = url;
				host.appendChild(img);
				return true;
			}
		} catch (e) {
			/* initials */
		}
	}

	const span = document.createElement("span");
	span.className = "fbm-fc-face-initials";
	span.textContent = fallback;
	host.appendChild(span);
	return false;
};

/** Data URL for whisper / members face crop. */
FBM.facePortraitDataUrl = function (
	character: PortraitChar | null | undefined,
	size?: number
): string | null {
	const sz = Math.max(24, Math.min(96, Math.floor(size || 48)));
	if (!character) return null;
	try {
		const canvas = drawFaceToCanvas(character, sz);
		if (!canvas) return null;
		return canvas.toDataURL("image/png");
	} catch (e) {
		return null;
	}
};

/** Freyas Better Maps — core/lz.js */
import { FBM } from "../fbm";

function lz() {
	try {
		if (typeof LZString !== "undefined" && LZString) return LZString;
	} catch (e) {
		/* ignore */
	}
	try {
		if (typeof window !== "undefined" && window.LZString) return window.LZString;
	} catch (e) {
		/* ignore */
	}
	return null;
}

FBM.lzAvailable = function () {
	const L = lz();
	return !!(L && typeof L.compressToUTF16 === "function" && typeof L.decompressFromUTF16 === "function");
};

function parseJson(text) {
	if (text == null || text === "") return null;
	try {
		return JSON.parse(text);
	} catch (e) {
		return null;
	}
}

interface LzEnvelope {
	format?: string;
	data?: string;
	algo?: string;
}

function unpackEnvelope(env: LzEnvelope | null) {
	if (!env || env.format !== (FBM.LZ_FORMAT || "FBMLz") || !env.data) return null;
	const L = lz();
	if (!L) return null;
	let plain = null;
	try {
		if (env.algo === "lz-utf16" && L.decompressFromUTF16) plain = L.decompressFromUTF16(env.data);
		else if (L.decompressFromBase64) plain = L.decompressFromBase64(env.data);
	} catch (e) {
		return null;
	}
	return plain ? parseJson(plain) : null;
}

FBM.lzUnpack = function (raw) {
	if (raw == null || raw === "") return null;
	if (typeof raw === "object") {
		const env = raw as LzEnvelope;
		if (env.format === (FBM.LZ_FORMAT || "FBMLz") && env.data) return unpackEnvelope(env);
		return raw;
	}
	if (typeof raw !== "string") return null;
	const prefixB64 = FBM.LZ_PREFIX_B64 || "FBMLz2:";
	if (raw.indexOf(prefixB64) === 0) {
		const Lb = lz();
		if (!Lb || !Lb.decompressFromBase64) return null;
		let plainB64 = null;
		try {
			plainB64 = Lb.decompressFromBase64(raw.slice(prefixB64.length));
		} catch (e) {
			return null;
		}
		return plainB64 ? parseJson(plainB64) : null;
	}
	const prefix = FBM.LZ_PREFIX || "FBMLz1:";
	if (raw.indexOf(prefix) === 0) {
		const L = lz();
		if (!L || !L.decompressFromUTF16) return null;
		let plain = null;
		try {
			plain = L.decompressFromUTF16(raw.slice(prefix.length));
		} catch (e) {
			return null;
		}
		return plain ? parseJson(plain) : null;
	}
	const first = raw.charAt(0);
	if (first === "{" || first === "[") {
		const parsed = parseJson(raw) as LzEnvelope | null;
		if (parsed && parsed.format === (FBM.LZ_FORMAT || "FBMLz") && parsed.data) {
			return unpackEnvelope(parsed) || parsed;
		}
		return parsed;
	}
	return null;
};

FBM.lzPackLocal = function (obj) {
	const json = JSON.stringify(obj);
	const min = FBM.LZ_MIN || 800;
	const L = lz();
	if (!L || json.length < min) return json;
	try {
		const packed = L.compressToUTF16(json);
		if (!packed || packed.length >= json.length) return json;
		return (FBM.LZ_PREFIX || "FBMLz1:") + packed;
	} catch (e) {
		return json;
	}
};

FBM.lzReadLocal = function (raw) {
	const parsed = FBM.lzUnpack(raw);
	return parsed && typeof parsed === "object" ? parsed : null;
};

/**
 * Pack for ExtensionSettings (wire): plain JSON when small or when LZ does not help,
 * else "FBMLz2:" + compressToBase64 (~1 byte/char on the wire; UTF16 costs ~3 bytes/char).
 */
FBM.lzPackSync = function (obj) {
	const json = JSON.stringify(obj);
	const min = FBM.LZ_MIN || 800;
	const L = lz();
	if (!L || typeof L.compressToBase64 !== "function" || json.length < min) return json;
	try {
		const packed = L.compressToBase64(json);
		if (!packed || packed.length + 7 >= json.length) return json;
		return (FBM.LZ_PREFIX_B64 || "FBMLz2:") + packed;
	} catch (e) {
		return json;
	}
};

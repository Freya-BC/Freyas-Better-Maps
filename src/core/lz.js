/**
 * Freyas Better Maps — LZString envelopes (Club LZString)
 */
(function (FBM) {
	"use strict";

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

	function unpackEnvelope(env) {
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
			if (raw.format === (FBM.LZ_FORMAT || "FBMLz") && raw.data) return unpackEnvelope(raw);
			return raw;
		}
		if (typeof raw !== "string") return null;
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
			const parsed = parseJson(raw);
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
})(window.FreyasBetterMaps = window.FreyasBetterMaps || {});

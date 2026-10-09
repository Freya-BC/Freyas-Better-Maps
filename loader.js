/* Freyas Better Maps v0.1.36 — post-login stub. FUSAM type: script. Loads the full bundle after Player.MemberNumber. */
(function () {
	"use strict";
	if (window.__FreyasBetterMapsLoader) return;
	window.__FreyasBetterMapsLoader = true;
	var selfSrc = "";
	try { selfSrc = (document.currentScript && document.currentScript.src) || ""; } catch (e) {}
	function loggedIn() {
		return typeof Player !== "undefined" && Player && Player.MemberNumber != null;
	}
	function wait(done) {
		if (loggedIn()) { done(); return; }
		var timer = setInterval(function () {
			if (loggedIn()) { clearInterval(timer); done(); }
		}, 250);
	}
	wait(function () {
		if (window.__FreyasBetterMapsPageLoaded) return;
		var src = selfSrc;
		if (src && /loader\.js(\?|$)/.test(src)) {
			src = src.replace(/loader\.js(\?.*)?$/, "freyas-better-maps.js$1");
		}
		if (!src) return;
		if (src.indexOf("v=") < 0) src += (src.indexOf("?") >= 0 ? "&" : "?") + "v=" + "0.1.36";
		var s = document.createElement("script");
		s.src = src;
		s.crossOrigin = "anonymous";
		(document.head || document.documentElement).appendChild(s);
	});
})();

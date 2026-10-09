// ==UserScript==
// @name         Freyas Better Maps (loader)
// @namespace    https://www.bondageprojects.com/
// @version      0.1.35
// @description  Thin loader for Freyas Better Maps — waits for login, then fetches the hosted JS bundle
// @author       FreyaCoding
// @match        https://bondageprojects.elementfx.com/*
// @match        https://www.bondageprojects.elementfx.com/*
// @match        https://bondage-europe.com/*
// @match        https://www.bondage-europe.com/*
// @match        https://bondageeurope.com/*
// @match        https://www.bondageeurope.com/*
// @match        https://bondage-asia.com/*
// @match        https://www.bondage-asia.com/*
// @match        https://bondageprojects.com/*
// @match        https://www.bondageprojects.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
	"use strict";
	const s = document.createElement("script");
	s.textContent = "(function(){if(window.__FreyasBetterMapsLoader)return;window.__FreyasBetterMapsLoader=true;function loggedIn(){return typeof Player!==\"undefined\"&&Player&&Player.MemberNumber!=null;}function inject(){if(window.__FreyasBetterMapsPageLoaded)return;var src=\"https://freya-bc.github.io/Freyas-Better-Maps/freyas-better-maps.js?v=0.1.35\";if(!src)return;var s=document.createElement(\"script\");s.src=src;s.crossOrigin=\"anonymous\";(document.head||document.documentElement).appendChild(s);}function wait(){if(loggedIn()){inject();return;}var t=setInterval(function(){if(loggedIn()){clearInterval(t);inject();}},250);}wait();})();";
	(document.head || document.documentElement).appendChild(s);
	s.remove();
})();

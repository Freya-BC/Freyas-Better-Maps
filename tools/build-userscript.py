#!/usr/bin/env python3
"""
Build Freyas Better Maps install artifacts from the TypeScript esbuild bundle:

  freyas-better-maps.user.js — Tampermonkey (full plugin inlined)
  freyas-better-maps.js      — page-context IIFE (bookmark gist / FUSAM sibling)
  loader.js / loader.user.js — FUSAM post-login stub
  bookmark.js                — javascript: bookmarklet (GitHub gist → eval)

@version follows FBM.VERSION in src/defaults.ts (patch bumped each build).
Runs `node tools/esbuild.mjs` after the version bump.
Dev builds PATCH the bookmark gist when FBM.BOOKMARK_GIST_ID is set.
Skip gist: FBM_SKIP_GIST=1 python3 tools/build-userscript.py
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULTS = ROOT / "src" / "defaults.ts"
BUNDLE = ROOT / "build" / "bundle.iife.js"
ESBUILD = ROOT / "tools" / "esbuild.mjs"

VERSION_RE = re.compile(r'FBM\.VERSION\s*=\s*"(\d+\.\d+\.\d+)"')
GIST_ID_RE = re.compile(r'FBM\.BOOKMARK_GIST_ID\s*=\s*"([^"]*)"')
RAW_SCRIPT_RE = re.compile(r'FBM\.RAW_SCRIPT_URL\s*=\s*"([^"]*)"')

MATCHES = """// @match        https://bondageprojects.elementfx.com/*
// @match        https://www.bondageprojects.elementfx.com/*
// @match        https://bondage-europe.com/*
// @match        https://www.bondage-europe.com/*
// @match        https://bondageeurope.com/*
// @match        https://www.bondageeurope.com/*
// @match        https://bondage-asia.com/*
// @match        https://www.bondage-asia.com/*
// @match        https://bondageprojects.com/*
// @match        https://www.bondageprojects.com/*
"""


def read_version(text: str) -> tuple[int, int, int]:
	m = VERSION_RE.search(text)
	if not m:
		raise SystemExit(f"Could not find FBM.VERSION in {DEFAULTS}")
	a, b, c = m.group(1).split(".")
	return int(a), int(b), int(c)


def bump_patch(text: str, major: int, minor: int, patch: int) -> tuple[str, str]:
	new_v = f"{major}.{minor}.{patch + 1}"
	updated = VERSION_RE.sub(f'FBM.VERSION = "{new_v}"', text, count=1)
	DEFAULTS.write_text(updated)
	return new_v, updated


def read_gist_id(text: str) -> str:
	m = GIST_ID_RE.search(text)
	return m.group(1) if m else ""


def run_esbuild() -> None:
	cmd = ["node", str(ESBUILD)]
	print("Running:", " ".join(cmd))
	subprocess.check_call(cmd, cwd=str(ROOT))


def page_iife(version: str, bundle: str) -> str:
	# Strip leading "use strict"; from esbuild output — we set it on the outer IIFE.
	body = bundle
	if body.startswith('"use strict";'):
		body = body[len('"use strict";') :].lstrip("\n")
	return (
		f"/* Freyas Better Maps v{version} — page-context IIFE. Bookmark gist / FUSAM sibling. */\n"
		"(function () {\n"
		'\t"use strict";\n'
		"\tif (window.__FreyasBetterMapsPageLoaded) return;\n"
		"\twindow.__FreyasBetterMapsPageLoaded = true;\n"
		f"{body}"
		"})();\n"
	)


def build_userscript(version: str, page: str) -> str:
	# Inject page IIFE via textContent so Tampermonkey runs in page context.
	return f'''// ==UserScript==
// @name         Freyas Better Maps
// @namespace    https://www.bondageprojects.com/
// @version      {version}
// @description  Bondage Club map helpers — typing, blindfold, build tools, map library
// @author       FreyaCoding
{MATCHES}// @run-at       document-end
// @grant        none
// ==/UserScript==

/*
 * Freyas Better Maps — single-file Tampermonkey install
 * Bookmark: bookmark.js loads the gist IIFE (docs/GIST.md).
 * Settings: Preference → Extensions → Freyas Better Maps
 */
(function () {{
	"use strict";
	const script = document.createElement("script");
	script.textContent = {json.dumps(page)};
	(document.head || document.documentElement).appendChild(script);
	script.remove();
}})();
'''


def build_plain_loader(version: str) -> str:
	return f'''/* Freyas Better Maps v{version} — post-login stub. FUSAM type: script. Loads the full bundle after Player.MemberNumber. */
(function () {{
	"use strict";
	if (window.__FreyasBetterMapsLoader) return;
	window.__FreyasBetterMapsLoader = true;
	var selfSrc = "";
	try {{ selfSrc = (document.currentScript && document.currentScript.src) || ""; }} catch (e) {{}}
	function loggedIn() {{
		return typeof Player !== "undefined" && Player && Player.MemberNumber != null;
	}}
	function wait(done) {{
		if (loggedIn()) {{ done(); return; }}
		var timer = setInterval(function () {{
			if (loggedIn()) {{ clearInterval(timer); done(); }}
		}}, 250);
	}}
	wait(function () {{
		if (window.__FreyasBetterMapsPageLoaded) return;
		var src = selfSrc;
		if (src && /loader\\.js(\\?|$)/.test(src)) {{
			src = src.replace(/loader\\.js(\\?.*)?$/, "freyas-better-maps.js$1");
		}}
		if (!src) return;
		if (src.indexOf("v=") < 0) src += (src.indexOf("?") >= 0 ? "&" : "?") + "v=" + {json.dumps(version)};
		var s = document.createElement("script");
		s.src = src;
		s.crossOrigin = "anonymous";
		(document.head || document.documentElement).appendChild(s);
	}});
}})();
'''


def build_loader_userjs(version: str, raw_js_url: str) -> str:
	src_expr = json.dumps((raw_js_url + "?v=" + version) if raw_js_url else "")
	page = (
		"(function(){"
		"if(window.__FreyasBetterMapsLoader)return;"
		"window.__FreyasBetterMapsLoader=true;"
		'function loggedIn(){return typeof Player!=="undefined"&&Player&&Player.MemberNumber!=null;}'
		"function inject(){"
		"if(window.__FreyasBetterMapsPageLoaded)return;"
		f"var src={src_expr};"
		"if(!src)return;"
		'var s=document.createElement("script");s.src=src;s.crossOrigin="anonymous";'
		"(document.head||document.documentElement).appendChild(s);"
		"}"
		"function wait(){if(loggedIn()){inject();return;}"
		"var t=setInterval(function(){if(loggedIn()){clearInterval(t);inject();}},250);}"
		"wait();"
		"})();"
	)
	return f'''// ==UserScript==
// @name         Freyas Better Maps (loader)
// @namespace    https://www.bondageprojects.com/
// @version      {version}
// @description  Thin loader for Freyas Better Maps — waits for login, then fetches the hosted JS bundle
// @author       FreyaCoding
{MATCHES}// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {{
	"use strict";
	const s = document.createElement("script");
	s.textContent = {json.dumps(page)};
	(document.head || document.documentElement).appendChild(s);
	s.remove();
}})();
'''


def build_bookmark(gist_id: str) -> str:
	if not gist_id:
		return "javascript:alert('FBM.BOOKMARK_GIST_ID is not set in defaults.ts');\n"
	gid = json.dumps(gist_id)
	body = (
		"(function(){"
		f"var id={gid};"
		"function unload(){"
		"if(window.FBM&&FBM.prepareReload)FBM.prepareReload();"
		"else if(window.FreyasBetterMaps&&FreyasBetterMaps.prepareReload)FreyasBetterMaps.prepareReload();"
		"else{"
		"window.__FreyasBetterMapsPageLoaded=false;"
		'["fbm-root","fbm-styles"].forEach(function(i){var e=document.getElementById(i);if(e&&e.parentNode)e.parentNode.removeChild(e);});'
		"if(window.FreyasBetterMaps)FreyasBetterMaps._booted=false;"
		"}"
		"}"
		"function pick(files){"
		"var list=Object.keys(files||{}).map(function(n){return files[n];});"
		"var js=list.filter(function(f){return f&&/\\.js$/i.test(f.filename||\"\");});"
		"if(js.length)list=js;"
		"list.sort(function(a,b){return (b.size||0)-(a.size||0);});"
		"return list[0];"
		"}"
		'fetch("https://api.github.com/gists/"+id+"?t="+Date.now())'
		".then(function(r){if(!r.ok)throw new Error(\"gist \"+r.status);return r.json();})"
		".then(function(g){"
		"var f=pick(g.files);"
		"if(!f)throw new Error(\"empty gist\");"
		'if(f.truncated)return fetch(f.raw_url+(f.raw_url.indexOf(\"?\")>=0?\"&\":\"?\")+\"t=\"+Date.now()).then(function(r){return r.text();});'
		"return f.content;"
		"})"
		".then(function(code){unload();eval(code);})"
		'.catch(function(e){console.error(\"[FBM] bookmark\",e);alert(\"Freyas Better Maps bookmark failed: \"+e);});'
		"})();"
	)
	return "javascript:" + body + "\n"


def want_gist_push(gist_id: str) -> bool:
	if not gist_id:
		return False
	if os.environ.get("FBM_SKIP_GIST") == "1":
		return False
	return True


def push_gist(version: str, gist_id: str, iife: Path) -> None:
	path = Path(__file__).resolve().parent / "push-gist.py"
	spec = importlib.util.spec_from_file_location("fbm_push_gist", path)
	if spec is None or spec.loader is None:
		raise SystemExit(f"Could not load {path}")
	mod = importlib.util.module_from_spec(spec)
	spec.loader.exec_module(mod)
	mod.push(version=version, gist_id=gist_id, iife_path=iife)


def sync_package_version(version: str) -> None:
	pkg = ROOT / "package.json"
	if not pkg.is_file():
		return
	data = json.loads(pkg.read_text())
	if data.get("version") != version:
		data["version"] = version
		pkg.write_text(json.dumps(data, indent="\t") + "\n")


def main() -> None:
	original = DEFAULTS.read_text()
	major, minor, patch = read_version(original)
	old_s = f"{major}.{minor}.{patch}"
	version, defaults = bump_patch(original, major, minor, patch)
	sync_package_version(version)
	gist_id = read_gist_id(defaults)
	raw_m = RAW_SCRIPT_RE.search(defaults)
	raw_js_url = raw_m.group(1) if raw_m else ""

	print(f"Version: {old_s} → {version}")

	run_esbuild()
	if not BUNDLE.is_file():
		raise SystemExit(f"Missing bundle: {BUNDLE}")
	bundle = BUNDLE.read_text()
	page = page_iife(version, bundle)

	plain_path = ROOT / "freyas-better-maps.js"
	plain_path.write_text(page)
	print(f"Wrote {plain_path.name} ({plain_path.stat().st_size} bytes) v{version}")

	user_path = ROOT / "freyas-better-maps.user.js"
	user_path.write_text(build_userscript(version, page))
	print(f"Wrote {user_path.name} ({user_path.stat().st_size} bytes) @version {version}")

	loader_path = ROOT / "loader.js"
	loader_path.write_text(build_plain_loader(version))
	print(f"Wrote {loader_path.name}")

	loader_user = ROOT / "loader.user.js"
	loader_user.write_text(build_loader_userjs(version, raw_js_url))
	print(f"Wrote {loader_user.name}")

	bookmark_path = ROOT / "bookmark.js"
	bookmark_path.write_text(build_bookmark(gist_id))
	print(f"Wrote {bookmark_path.name}")
	if gist_id:
		print(f"  Bookmark gist: https://gist.github.com/{gist_id}")

	if want_gist_push(gist_id):
		push_gist(version, gist_id, plain_path)
	elif os.environ.get("FBM_SKIP_GIST") == "1":
		print("Skipped gist push (FBM_SKIP_GIST=1)")
	elif not gist_id:
		print("Skipped gist push (FBM.BOOKMARK_GIST_ID empty)")


if __name__ == "__main__":
	main()

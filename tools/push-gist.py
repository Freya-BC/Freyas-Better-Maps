#!/usr/bin/env python3
"""
Upload the built Freyas Better Maps page-context IIFE to the bookmark gist.

  python3 tools/push-gist.py

Auth (one GitHub credential):

  1. FBM_GIST_TOKEN, GH_TOKEN, or GITHUB_TOKEN in the environment
  2. The same keys in .env.local (gitignored)
  3. `gh auth token` if the GitHub CLI is logged in

The PAT must belong to Freya-BC (gist owner) and include the gist scope.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULTS = ROOT / "src" / "defaults.js"
IIFE = ROOT / "freyas-better-maps.js"
ENV_LOCAL = ROOT / ".env.local"
GIST_FILE = "freyas-better-maps.js"
TOKEN_KEYS = ("FBM_GIST_TOKEN", "GH_TOKEN", "GITHUB_TOKEN")
GIST_ID_RE = re.compile(r'FBM\.BOOKMARK_GIST_ID\s*=\s*"([^"]*)"')
VERSION_RE = re.compile(r'FBM\.VERSION\s*=\s*"(\d+\.\d+\.\d+)"')
API = "https://api.github.com"


def _fail(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(code)


def parse_env_file(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        if "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip()
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        if key:
            out[key] = val
    return out


def token_from_mapping(data: dict[str, str]) -> str:
    for key in TOKEN_KEYS:
        val = (data.get(key) or "").strip()
        if val:
            return val
    return ""


def token_from_gh() -> str:
    try:
        proc = subprocess.run(
            ["gh", "auth", "token"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return ""
    if proc.returncode != 0:
        return ""
    return (proc.stdout or "").strip()


def resolve_token() -> str:
    token = token_from_mapping({k: os.environ.get(k, "") for k in TOKEN_KEYS})
    if token:
        return token
    token = token_from_mapping(parse_env_file(ENV_LOCAL))
    if token:
        return token
    token = token_from_gh()
    if token:
        return token
    _fail(
        "No GitHub token for gist push.\n"
        "  One-time setup (pick one):\n"
        "    • gh auth login  (grant gist scope)\n"
        "    • classic PAT with gist scope → Freyas-Better-Maps/.env.local as FBM_GIST_TOKEN=\n"
        "  Offline: FBM_SKIP_GIST=1 python3 tools/build-userscript.py"
    )
    return ""


def read_gist_id(text: str | None = None) -> str:
    src = text if text is not None else DEFAULTS.read_text()
    m = GIST_ID_RE.search(src)
    if not m or not m.group(1):
        _fail(f"Could not find FBM.BOOKMARK_GIST_ID in {DEFAULTS}")
    return m.group(1)


def read_version(text: str | None = None) -> str:
    src = text if text is not None else DEFAULTS.read_text()
    m = VERSION_RE.search(src)
    if not m:
        _fail(f"Could not find FBM.VERSION in {DEFAULTS}")
    return m.group(1)


def github_patch(gist_id: str, token: str, body: dict) -> dict:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{API}/gists/{gist_id}",
        data=data,
        method="PATCH",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "FBM-push-gist",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            raw = e.read().decode("utf-8", errors="replace")
            parsed = json.loads(raw)
            detail = parsed.get("message") or raw[:200]
        except Exception:
            detail = str(e.reason or e)
        _fail(f"GitHub gist PATCH failed: HTTP {e.code} {detail}.")
    except urllib.error.URLError as e:
        _fail(f"GitHub gist PATCH failed: {e.reason or e}")
    return {}


def push(
    version: str | None = None,
    gist_id: str | None = None,
    iife_path: Path | None = None,
) -> str:
    path = iife_path or IIFE
    if not path.is_file():
        _fail(f"Missing {path.name} — run python3 tools/build-userscript.py first")
    content = path.read_text()
    if not content.strip():
        _fail(f"{path.name} is empty")
    gid = gist_id or read_gist_id()
    ver = version or read_version()
    token = resolve_token()
    desc = f"Freyas Better Maps v{ver} (bookmark IIFE)"
    print(f"Pushing {path.name} ({path.stat().st_size} bytes) → gist {gid} as v{ver}")
    result = github_patch(
        gid,
        token,
        {
            "description": desc,
            "files": {GIST_FILE: {"content": content}},
        },
    )
    html = result.get("html_url") or f"https://gist.github.com/{gid}"
    print(f"Pushed gist {html}")
    return html


if __name__ == "__main__":
    push()

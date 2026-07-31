from __future__ import annotations

import json
import re
import sys
import tomllib
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

PYPROJECT = Path(__file__).resolve().parents[1] / "pyproject.toml"
NAME_PATTERN = re.compile(r"^([A-Za-z0-9._-]+)(\[[^\]]*\])?")


def latest_version(package: str) -> str | None:
    url = f"https://pypi.org/pypi/{package}/json"
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            return str(json.load(response)["info"]["version"])
    except Exception:
        return None


def requirements(data: dict[str, object]) -> list[str]:
    project = data.get("project", {})
    if not isinstance(project, dict):
        return []
    found = list(project.get("dependencies", []))
    for group in (project.get("optional-dependencies") or {}).values():
        found.extend(group)
    return [str(item) for item in found]


def main() -> int:
    raw = PYPROJECT.read_text("utf-8")
    data = tomllib.loads(raw)
    specs = requirements(data)

    names: dict[str, str] = {}
    for spec in specs:
        match = NAME_PATTERN.match(spec)
        if match:
            names[spec] = match.group(1)

    with ThreadPoolExecutor(max_workers=12) as pool:
        resolved = dict(zip(names.values(), pool.map(latest_version, names.values()), strict=True))

    changed = 0
    for spec, package in names.items():
        version = resolved.get(package)
        if not version or ">=" not in spec:
            continue
        updated = re.sub(r">=[^,\"']+", f">={version}", spec)
        if updated != spec:
            raw = raw.replace(f'"{spec}"', f'"{updated}"')
            print(f"  {spec}  ->  {updated}")
            changed += 1

    if changed:
        PYPROJECT.write_text(raw, "utf-8")
        print(f"Raised {changed} dependency floors.")
    else:
        print("All dependency floors already at the latest published versions.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

from __future__ import annotations

from fosslove.scriptgen import (
    AppPlan,
    PackageCandidate,
    generate_linux_script,
    generate_windows_script,
)


def _plan() -> AppPlan:
    return AppPlan(
        "VS Code",
        (
            PackageCandidate("winget", "Microsoft.VisualStudioCode", ""),
            PackageCandidate("direct", "https://example.com/x.exe?a=1", ""),
        ),
    )


def test_windows_script_structure() -> None:
    script = generate_windows_script([_plan()])
    assert script.startswith("#requires -Version")
    assert "[pscustomobject]" in script
    assert "Microsoft.VisualStudioCode" in script
    assert "Install-App" in script


def test_linux_script_quotes_single_quotes() -> None:
    plan = AppPlan("O'Brien", (PackageCandidate("flatpak", "org.x.App", ""),))
    script = generate_linux_script([plan])
    assert script.startswith("#!/usr/bin/env bash")
    assert "install_app 'O'\\''Brien'" in script
    assert "flatpak:org.x.App" in script
    assert "TOTAL=1" in script

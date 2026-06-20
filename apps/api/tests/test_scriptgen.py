from __future__ import annotations

from fosslove.db.models.catalog import App, PackageReference
from fosslove.db.models.enums import PackageManager as M
from fosslove.db.models.enums import Platform
from fosslove.scriptgen import (
    AppPlan,
    PackageCandidate,
    build_app_plans,
    generate_linux_script,
    generate_windows_script,
)


def _plan() -> AppPlan:
    return AppPlan(
        "VS Code",
        (
            PackageCandidate(M.WINGET, "Microsoft.VisualStudioCode", None),
            PackageCandidate(M.DIRECT, "https://example.com/x.exe?a=1", None),
        ),
    )


def test_windows_script_structure() -> None:
    script = generate_windows_script([_plan()])
    assert script.startswith("#requires -Version")
    assert "[pscustomobject]" in script
    assert "Microsoft.VisualStudioCode" in script
    assert "Install-App" in script


def test_linux_script_structure_and_quoting() -> None:
    plan = AppPlan("O'Brien", (PackageCandidate(M.FLATPAK, "org.x.App", None),))
    script = generate_linux_script([plan])
    assert script.startswith("#!/usr/bin/env bash")
    assert "install_app 'O'\\''Brien'" in script
    assert "flatpak:org.x.App" in script
    assert "TOTAL=1" in script


def test_build_app_plans_orders_and_dedupes() -> None:
    app = App(name="GIMP", platform=Platform.LINUX)
    app.package_refs = [
        PackageReference(manager=M.SNAP, identifier="gimp", priority=10, install_args=None),
        PackageReference(
            manager=M.FLATPAK, identifier="org.gimp.GIMP", priority=5, install_args=None
        ),
        PackageReference(manager=M.FLATPAK, identifier="dup", priority=20, install_args=None),
        PackageReference(manager=M.WINGET, identifier="ignored", priority=1, install_args=None),
    ]
    plans = build_app_plans([app], Platform.LINUX)
    assert len(plans) == 1
    managers = [candidate.manager for candidate in plans[0].candidates]
    assert managers == [M.FLATPAK, M.SNAP]
    assert plans[0].candidates[0].identifier == "org.gimp.GIMP"


def test_build_app_plans_skips_apps_without_candidates() -> None:
    app = App(name="WinOnly", platform=Platform.LINUX)
    app.package_refs = [
        PackageReference(manager=M.WINGET, identifier="x", priority=1, install_args=None),
    ]
    assert build_app_plans([app], Platform.LINUX) == []

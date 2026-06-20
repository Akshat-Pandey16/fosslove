from __future__ import annotations

from fosslove.scriptgen.common import AppPlan, sh_quote

_PRELUDE = r"""#!/usr/bin/env bash
set -u

c_reset='\033[0m'; c_red='\033[31m'; c_green='\033[32m'
c_yellow='\033[33m'; c_cyan='\033[36m'; c_magenta='\033[35m'

log() { printf '%b%s%b\n' "$2" "$1" "$c_reset"; }
have() { command -v "$1" >/dev/null 2>&1; }

cat <<'BANNER'
  ___  ___  ___ ___   _    _____   _____
 | __|/ _ \/ __/ __| | |  / _ \ \ / / __|
 | _|| (_) \__ \__ \ | |_| (_) \ V /| _|
 |_|  \___/|___/___/ |____\___/ \_/ |___|
BANNER
log "Welcome to FOSSLove - installing your selected apps." "$c_cyan"

SUDO=''
if [ "$(id -u)" -ne 0 ] && have sudo; then SUDO='sudo'; fi

PKG=''
if have apt-get; then PKG='apt'
elif have dnf; then PKG='dnf'
elif have pacman; then PKG='pacman'
fi
log "Detected native package manager: ${PKG:-none}" "$c_cyan"

native_install() {
    case "$PKG" in
        apt) $SUDO apt-get install -y "$1" ;;
        dnf) $SUDO dnf install -y "$1" ;;
        pacman) $SUDO pacman -S --noconfirm "$1" ;;
        *) return 1 ;;
    esac
}

flatpak_install() {
    have flatpak || return 1
    flatpak install -y --noninteractive flathub "$1" 2>/dev/null || \
        flatpak install -y --noninteractive "$1"
}

snap_install() {
    have snap || return 1
    $SUDO snap install "$1"
}

direct_install() {
    url="$1"
    dest="$HOME/Downloads"
    mkdir -p "$dest"
    file="$dest/$(basename "$url" | sed 's/?.*//')"
    if have curl; then curl -fsSL "$url" -o "$file"
    elif have wget; then wget -q "$url" -O "$file"
    else return 1
    fi
    log "  Downloaded $(basename "$file") to $dest (manual install may be required)." "$c_yellow"
    return 0
}

installed=0
failed=0
idx=0
failed_names=''
script_start=$(date +%s)

try_candidate() {
    manager="${1%%:*}"
    identifier="${1#*:}"
    case "$manager" in
        flatpak) flatpak_install "$identifier" ;;
        apt|dnf|pacman) [ "$PKG" = "$manager" ] && native_install "$identifier" ;;
        snap) snap_install "$identifier" ;;
        direct) direct_install "$identifier" ;;
        *) return 1 ;;
    esac
}

install_app() {
    name="$1"; shift
    idx=$((idx + 1))
    log "[$idx/$TOTAL] Installing $name..." "$c_cyan"
    start=$(date +%s)
    for cand in "$@"; do
        if try_candidate "$cand"; then
            installed=$((installed + 1))
            log "  OK  $name ($(( $(date +%s) - start ))s)" "$c_green"
            return 0
        fi
    done
    failed=$((failed + 1))
    failed_names="$failed_names $name"
    log "  FAIL $name" "$c_red"
    return 0
}
"""

_SUMMARY = r"""
echo ''
log "Done in $(( $(date +%s) - script_start ))s. Installed: $installed, Failed: $failed" "$c_magenta"
if [ "$failed" -gt 0 ]; then
    log "Failed apps:$failed_names" "$c_yellow"
fi
"""


def _emit_calls(plans: list[AppPlan]) -> str:
    lines = [f"TOTAL={len(plans)}"]
    for plan in plans:
        parts = [sh_quote(plan.name)]
        parts.extend(
            sh_quote(candidate.manager.value + ":" + candidate.identifier)
            for candidate in plan.candidates
        )
        lines.append("install_app " + " ".join(parts))
    return "\n".join(lines)


def generate_linux_script(plans: list[AppPlan]) -> str:
    return "\n".join([_PRELUDE, _emit_calls(plans), _SUMMARY]) + "\n"

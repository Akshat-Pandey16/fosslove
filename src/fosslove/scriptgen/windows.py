from __future__ import annotations

from fosslove.scriptgen.common import AppPlan, ps_quote

_PRELUDE = r"""#requires -Version 5.1
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

$Banner = @'
  ___  ___  ___ ___   _    _____   _____
 | __|/ _ \/ __/ __| | |  / _ \ \ / / __|
 | _|| (_) \__ \__ \ | |_| (_) \ V /| _|
 |_|  \___/|___/___/ |____\___/ \_/ |___|
'@

function Write-Log {
    param([string]$Message, [string]$Color = 'White')
    Write-Host $Message -ForegroundColor $Color
}

Write-Host $Banner -ForegroundColor Magenta
Write-Log 'Welcome to FOSSLove - installing your selected apps.' 'Cyan'

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Initialize-Winget {
    if (Test-Command 'winget') { return $true }
    Write-Log 'winget not found; attempting to install the App Installer...' 'Yellow'
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $tmp = Join-Path $env:TEMP 'AppInstaller.msixbundle'
        Invoke-WebRequest -Uri 'https://aka.ms/getwinget' -OutFile $tmp -UseBasicParsing
        Add-AppxPackage -Path $tmp -ErrorAction Stop
        return (Test-Command 'winget')
    } catch {
        Write-Log "Could not install winget automatically: $_" 'Red'
        return $false
    }
}

function Invoke-Winget {
    param([string]$Id, [string]$Source, [string]$ExtraArgs)
    $cmd = @('install', '--id', $Id, '--exact', '--silent',
             '--accept-source-agreements', '--accept-package-agreements',
             '--disable-interactivity')
    if ($Source) { $cmd += @('--source', $Source) }
    if ($ExtraArgs) {
        $cmd += $ExtraArgs.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
    }
    & winget @cmd | Out-Null
    return ($LASTEXITCODE -eq 0)
}

function Invoke-Direct {
    param([string]$Url, [string]$ExtraArgs)
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $leaf = [System.IO.Path]::GetFileName(($Url -split '\?')[0])
        if (-not $leaf) { $leaf = 'fosslove_installer.exe' }
        $file = Join-Path $env:TEMP $leaf
        Invoke-WebRequest -Uri $Url -OutFile $file -UseBasicParsing
        $silent = if ($ExtraArgs) { $ExtraArgs } else { '/S' }
        Start-Process -FilePath $file -ArgumentList $silent -Wait -PassThru | Out-Null
        return $true
    } catch {
        Write-Log "Direct install failed: $_" 'Red'
        return $false
    }
}
"""

_MAIN = r"""$wingetReady = Initialize-Winget
$installed = 0
$failed = 0
$failedNames = @()

foreach ($app in $Apps) {
    Write-Log ("Installing {0}..." -f $app.Name) 'Cyan'
    $ok = $false
    foreach ($c in $app.Candidates) {
        switch ($c.Manager) {
            'winget'  { if ($wingetReady) { $ok = Invoke-Winget -Id $c.Id -Source '' -ExtraArgs $c.Args } }
            'msstore' { if ($wingetReady) { $ok = Invoke-Winget -Id $c.Id -Source 'msstore' -ExtraArgs $c.Args } }
            'direct'  { $ok = Invoke-Direct -Url $c.Id -ExtraArgs $c.Args }
        }
        if ($ok) { break }
    }
    if ($ok) {
        $installed++
        Write-Log ("  Installed {0}" -f $app.Name) 'Green'
    } else {
        $failed++
        $failedNames += $app.Name
        Write-Log ("  Failed {0}" -f $app.Name) 'Red'
    }
}

Write-Host ''
Write-Log ("Done. Installed: {0}, Failed: {1}" -f $installed, $failed) 'Magenta'
if ($failed -gt 0) {
    Write-Log ("Failed apps: {0}" -f ($failedNames -join ', ')) 'Yellow'
}
"""


def _emit_data(plans: list[AppPlan]) -> str:
    blocks: list[str] = []
    for plan in plans:
        candidate_lines = [
            "      [pscustomobject]@{ Manager="
            + ps_quote(candidate.manager.value)
            + "; Id="
            + ps_quote(candidate.identifier)
            + "; Args="
            + ps_quote(candidate.install_args or "")
            + " }"
            for candidate in plan.candidates
        ]
        candidates = ",\n".join(candidate_lines)
        blocks.append(
            "  [pscustomobject]@{\n"
            "    Name=" + ps_quote(plan.name) + "\n"
            "    Candidates=@(\n" + candidates + "\n    )\n"
            "  }"
        )
    return "$Apps = @(\n" + ",\n".join(blocks) + "\n)"


def generate_windows_script(plans: list[AppPlan]) -> str:
    return "\n".join([_PRELUDE, _emit_data(plans), "", _MAIN]) + "\n"

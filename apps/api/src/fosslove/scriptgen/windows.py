from __future__ import annotations

from fosslove.scriptgen.common import AppPlan, ps_quote

_PRELUDE = r"""#requires -Version 5.1
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$swTotal = [System.Diagnostics.Stopwatch]::StartNew()

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

try {
    $logPath = Join-Path $env:TEMP ("fosslove_install_{0}.log" -f (Get-Date -Format 'yyyyMMdd_HHmmss'))
    Start-Transcript -Path $logPath -Append | Out-Null
} catch { $logPath = $null }

Write-Host $Banner -ForegroundColor Magenta
Write-Log 'Welcome to FOSSLove - installing your selected apps.' 'Cyan'

$IsAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $IsAdmin) {
    Write-Log 'Note: not elevated; some installers may prompt for or require Administrator.' 'Yellow'
}

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function ConvertTo-Args {
    param([string]$Text)
    if (-not $Text) { return @() }
    $result = @()
    foreach ($m in [regex]::Matches($Text, '"([^"]*)"|''([^'']*)''|(\S+)')) {
        if ($m.Groups[1].Success) { $result += $m.Groups[1].Value }
        elseif ($m.Groups[2].Success) { $result += $m.Groups[2].Value }
        else { $result += $m.Groups[3].Value }
    }
    return ,$result
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
    if ($ExtraArgs) { $cmd += ConvertTo-Args $ExtraArgs }
    & winget @cmd | Out-Null
    return ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq -1978335189)
}

function Invoke-Direct {
    param([string]$Url, [string]$ExtraArgs)
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $leaf = [System.IO.Path]::GetFileName(($Url -split '\?')[0])
        if (-not $leaf) { $leaf = 'fosslove_installer.exe' }
        $file = Join-Path $env:TEMP $leaf
        Invoke-WebRequest -Uri $Url -OutFile $file -UseBasicParsing
        $silent = if ($ExtraArgs) { ConvertTo-Args $ExtraArgs } else { @('/S') }
        Start-Process -FilePath $file -ArgumentList $silent -Wait -PassThru | Out-Null
        return $true
    } catch {
        Write-Log "Direct install failed: $_" 'Red'
        return $false
    }
}

function Install-App {
    param([pscustomobject]$App, [bool]$WingetReady)
    foreach ($c in $App.Candidates) {
        $ok = $false
        switch ($c.Manager) {
            'winget'  { if ($WingetReady) { $ok = Invoke-Winget -Id $c.Id -Source '' -ExtraArgs $c.Args } }
            'msstore' { if ($WingetReady) { $ok = Invoke-Winget -Id $c.Id -Source 'msstore' -ExtraArgs $c.Args } }
            'direct'  { $ok = Invoke-Direct -Url $c.Id -ExtraArgs $c.Args }
        }
        if ($ok) { return $true }
    }
    return $false
}
"""

_MAIN = r"""$wingetReady = Initialize-Winget
$installed = 0
$failed = 0
$failedNames = @()
$total = @($Apps).Count
$index = 0

foreach ($app in $Apps) {
    $index++
    Write-Progress -Activity 'FOSSLove installer' -Status $app.Name `
        -PercentComplete (($index / [Math]::Max($total, 1)) * 100)
    Write-Log ("[{0}/{1}] Installing {2}..." -f $index, $total, $app.Name) 'Cyan'

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $ok = Install-App -App $app -WingetReady $wingetReady
    $sw.Stop()

    if ($ok) {
        $installed++
        Write-Log ("  OK  {0} ({1:n1}s)" -f $app.Name, $sw.Elapsed.TotalSeconds) 'Green'
    } else {
        $failed++
        $failedNames += $app.Name
        Write-Log ("  FAIL {0}" -f $app.Name) 'Red'
    }
}

Write-Progress -Activity 'FOSSLove installer' -Completed
$swTotal.Stop()
Write-Host ''
Write-Log ("Done in {0:n1}s. Installed: {1}, Failed: {2}" -f `
    $swTotal.Elapsed.TotalSeconds, $installed, $failed) 'Magenta'
if ($failed -gt 0) {
    Write-Log ("Failed apps: {0}" -f ($failedNames -join ', ')) 'Yellow'
}
if ($logPath) { Write-Log ("Log: {0}" -f $logPath) 'DarkGray' }
try { Stop-Transcript | Out-Null } catch { }
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

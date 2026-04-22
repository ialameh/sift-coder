# sift-compress — statusline badge (Windows PowerShell parity).
# Reads the state cache and renders a colored badge. Hardened against
# symlink redirection + content injection via whitelist.

$ErrorActionPreference = 'SilentlyContinue'

$StateDir = if ($env:CLAUDE_CONFIG_DIR) {
  Join-Path $env:CLAUDE_CONFIG_DIR '.sift-compress'
} else {
  Join-Path $env:USERPROFILE '.claude\.sift-compress'
}
$State = Join-Path $StateDir 'state.json'

# Refuse symlinks.
$item = Get-Item -LiteralPath $State
if ($null -eq $item) { exit 0 }
if ($item.LinkType -ne $null) { exit 0 }
if ($item.Length -gt 1024) { exit 0 }

$raw = Get-Content -LiteralPath $State -Raw -TotalCount 1024
if ($raw -match '"mode"\s*:\s*"([a-z0-9-]{1,32})"') {
  $mode = $Matches[1].ToLower()
} else {
  exit 0
}

$valid = @('lite','full','ultra','commit','review')
if ($mode -notin $valid) { exit 0 }

$upper = $mode.ToUpper()
# ANSI 256-color 110 (soft blue) to match the bash version.
$esc = [char]27
Write-Host -NoNewline "$esc[38;5;110m[SIFT:$upper]$esc[0m"

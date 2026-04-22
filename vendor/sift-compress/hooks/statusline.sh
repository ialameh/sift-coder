#!/bin/bash
# sift-compress — statusline badge.
# Reads the state cache (state.json) and renders a colored badge.
# Hardened against symlink redirection + ANSI-escape injection via flag bytes.
set -u

STATE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/.sift-compress"
STATE="$STATE_DIR/state.json"

# Refuse symlinks at directory or target — a local attacker could redirect
# these to ~/.ssh/id_rsa; the statusline would render its bytes every keystroke.
[ -L "$STATE_DIR" ] && exit 0
[ -L "$STATE" ] && exit 0
[ ! -f "$STATE" ] && exit 0

# Hard-cap the read.
RAW=$(head -c 1024 "$STATE" 2>/dev/null)

# Tightly-bound extraction. Anything weird → empty → render nothing.
MODE=$(printf '%s' "$RAW" \
  | grep -oE '"mode"[[:space:]]*:[[:space:]]*"[a-z0-9-]{1,32}"' \
  | head -n 1 \
  | sed -E 's/.*"([a-z0-9-]+)"$/\1/')

# Whitelist. Anything outside this set renders nothing.
case "$MODE" in
  lite|full|ultra|commit|review) ;;
  *) exit 0 ;;
esac

UPPER=$(printf '%s' "$MODE" | tr '[:lower:]' '[:upper:]')
printf '\033[38;5;110m[SIFT:%s]\033[0m' "$UPPER"

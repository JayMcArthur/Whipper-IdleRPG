#!/usr/bin/env bash
set -euo pipefail
whipper_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
whipper_shell=default
if [[ "${1-}" == --browser ]]; then whipper_shell=browser; shift; fi
if [[ "${1-}" == -- ]]; then shift; fi
if (( $# )); then
  exec nix develop --no-update-lock-file "$whipper_root#$whipper_shell" --command "$@"
fi
exec nix develop --no-update-lock-file "$whipper_root#$whipper_shell"

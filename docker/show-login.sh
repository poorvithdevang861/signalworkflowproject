#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"$ROOT/docker/ensure-secrets.sh" >/dev/null
cat "$ROOT/docker/login-credentials.txt"

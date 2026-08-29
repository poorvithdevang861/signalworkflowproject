#!/usr/bin/env bash
# Create docker/.env.generated once and always refresh docker/login-credentials.txt.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docker/.env.generated"
CREDS="$ROOT/docker/login-credentials.txt"

write_credentials_file() {
  # shellcheck disable=SC1090
  set -a
  source "$OUT"
  set +a

  cat > "$CREDS" <<EOF
SignalWorkflow local login
==========================

Super Admin : inv.mdm@innovant.ai
Admin       : poorvith.devang@flame.edu.in
Password    : ${ADMIN_SEED_PASSWORD}

OTP inbox   : http://localhost:8025
EOF
  chmod 600 "$CREDS"
}

if [ -f "$OUT" ]; then
  write_credentials_file
  echo "  [OK] Login credentials: docker/login-credentials.txt"
  exit 0
fi

if command -v openssl >/dev/null 2>&1; then
  JWT_SECRET="$(openssl rand -hex 32)"
  TOKEN_ENCRYPTION_KEY="$(openssl rand -hex 32)"
  ADMIN_SEED_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=' | head -c 16)"
else
  JWT_SECRET="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
  TOKEN_ENCRYPTION_KEY="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
  ADMIN_SEED_PASSWORD="$(python3 -c 'import secrets; print(secrets.token_urlsafe(12))')"
fi

cat > "$OUT" <<EOF
# Generated locally — do not commit
JWT_SECRET=${JWT_SECRET}
TOKEN_ENCRYPTION_KEY=${TOKEN_ENCRYPTION_KEY}
ADMIN_SEED_PASSWORD=${ADMIN_SEED_PASSWORD}
EOF

chmod 600 "$OUT"
write_credentials_file
echo "  [OK] Wrote docker/.env.generated"
echo "  [OK] Login credentials: docker/login-credentials.txt"

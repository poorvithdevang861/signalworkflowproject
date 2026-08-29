#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# SignalWorkflow — Database Initialization (auth + RBAC only)
# ─────────────────────────────────────────────────────────────
set -e

PGHOST="${PGHOST:-db}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:?PGPASSWORD is required}"
PGDATABASE="${PGDATABASE:-SignalMDM}"

export PGPASSWORD

SCRIPTS_DIR="/scripts"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║      SignalWorkflow — Database Initialization       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "[1/3] Waiting for PostgreSQL at $PGHOST:$PGPORT ..."

until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" > /dev/null 2>&1; do
    echo "  ... PostgreSQL not ready, retrying in 2s"
    sleep 2
done
echo "  [OK] PostgreSQL is ready."

echo ""
echo "[2/3] Waiting for backend to create platform tables ..."

MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    TABLE_EXISTS=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
        -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_admin');" 2>/dev/null || echo "f")

    if [ "$TABLE_EXISTS" = "t" ]; then
        echo "  [OK] Platform tables detected."
        break
    fi

    echo "  ... Base tables not ready yet, retrying in 3s ($WAITED/${MAX_WAIT}s)"
    sleep 3
    WAITED=$((WAITED + 3))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "  [WARN] Timed out waiting for base tables. Proceeding anyway..."
fi

sleep 3

echo ""
echo "[3/3] Seeding default admin users ..."

if [ -f "$SCRIPTS_DIR/seed_users.py" ]; then
    python3 "$SCRIPTS_DIR/seed_users.py"
else
    echo "  [SKIP] seed_users.py not found."
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║      Database initialization complete!              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Login emails:"
echo "    Super Admin : inv.mdm@innovant.ai"
echo "    Admin       : poorvith.devang@flame.edu.in"
echo "  Password: ADMIN_SEED_PASSWORD in docker/.env.generated"
echo ""

#!/usr/bin/env python3
"""
Seed platform roles and the default Super Admin / Admin accounts.

Password comes from ADMIN_SEED_PASSWORD (docker/.env.generated).
Idempotent: re-running updates the seed users' password hashes.
"""

import os
import sys

try:
    import psycopg2
except ImportError:
    print("  [WARN] psycopg2 not available — skipping Python user seed.")
    sys.exit(0)

try:
    import bcrypt
except ImportError:
    print("  [WARN] bcrypt not available — skipping Python user seed.")
    sys.exit(0)


def main():
    password = os.getenv("ADMIN_SEED_PASSWORD", "").strip()
    if len(password) < 8:
        print("  [ERROR] ADMIN_SEED_PASSWORD is missing or too short.")
        print("         Run docker/ensure-secrets.sh before starting the stack.")
        sys.exit(1)

    db_host = os.getenv("PGHOST", "db")
    db_port = os.getenv("PGPORT", "5432")
    db_user = os.getenv("PGUSER", "postgres")
    db_pass = os.getenv("PGPASSWORD")
    if not db_pass:
        print("  [ERROR] PGPASSWORD is not set.")
        sys.exit(1)
    db_name = os.getenv("PGDATABASE", "SignalMDM")

    dsn = f"host={db_host} port={db_port} user={db_user} password={db_pass} dbname={db_name}"

    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
    except Exception as e:
        print(f"  [ERROR] Could not connect to database: {e}")
        sys.exit(1)

    roles = [
        ("22222222-2222-2222-2222-222222222222", "super_admin", "Super Admin"),
        ("22222222-2222-2222-2222-333333333333", "admin", "Admin"),
        ("22222222-2222-2222-2222-444444444444", "data_architect", "Data Architect"),
        ("22222222-2222-2222-2222-555555555555", "data_manager", "Data Manager"),
        ("22222222-2222-2222-2222-666666666666", "executive", "Executive"),
    ]

    for role_id, role_key, role_label in roles:
        cur.execute(
            """
            INSERT INTO platform_role (role_id, role_key, role_label, is_system)
            VALUES (%s, %s, %s, TRUE)
            ON CONFLICT DO NOTHING
            """,
            (role_id, role_key, role_label),
        )

    print("  [OK] Platform roles seeded.")

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    cur.execute(
        """
        INSERT INTO platform_admin (
            admin_id, email, username, full_name, password_hash, role_id,
            is_active, two_fa_enabled, two_fa_setup_complete, is_blocked, must_change_password
        )
        VALUES (
            'a2d0e6ba-65fa-4d6e-a113-82db1d3ad935',
            'inv.mdm@innovant.ai',
            'innovant',
            'Innovant Admin',
            %s,
            '22222222-2222-2222-2222-222222222222',
            TRUE, FALSE, FALSE, FALSE, FALSE
        )
        ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            username = EXCLUDED.username,
            role_id = EXCLUDED.role_id,
            is_active = TRUE,
            is_blocked = FALSE
        """,
        (hashed,),
    )
    print("  [OK] Super Admin user 'innovant' seeded.")

    cur.execute(
        """
        INSERT INTO platform_admin (
            admin_id, email, username, full_name, password_hash, role_id,
            is_active, two_fa_enabled, two_fa_setup_complete, is_blocked, must_change_password
        )
        VALUES (
            'c4f2a8dc-87bc-4f80-c335-04fd3f5cf157',
            'poorvith.devang@flame.edu.in',
            'poorvith',
            'Poorvith Devang',
            %s,
            '22222222-2222-2222-2222-333333333333',
            TRUE, FALSE, FALSE, FALSE, FALSE
        )
        ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            username = EXCLUDED.username,
            role_id = EXCLUDED.role_id,
            is_active = TRUE,
            is_blocked = FALSE
        """,
        (hashed,),
    )
    print("  [OK] Admin user 'poorvith' seeded.")

    cur.execute(
        """
        INSERT INTO platform_role_permission (role_id, permission_id)
        SELECT '22222222-2222-2222-2222-222222222222', p.permission_id
        FROM platform_permission p
        WHERE p.screen_key = 'platform'
        ON CONFLICT DO NOTHING
        """
    )
    print("  [OK] Super Admin permissions granted.")

    cur.execute(
        """
        INSERT INTO platform_role_permission (role_id, permission_id)
        SELECT '22222222-2222-2222-2222-333333333333', p.permission_id
        FROM platform_permission p
        WHERE p.screen_key = 'platform'
        ON CONFLICT DO NOTHING
        """
    )
    print("  [OK] Admin role permissions granted.")

    cur.close()
    conn.close()
    print("  [OK] User seeding complete.")


if __name__ == "__main__":
    main()

# SignalWorkflow

Authentication and platform RBAC for SignalWorkflow — login, OTP verification, and admin access control.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS / Windows) or Docker Engine + Compose (Linux)
- Ports available: **3030** (app), **8000** (API), **5433** (Postgres), **8025** (Mailpit)

---

## Quick start

### Option A — One-click installer (macOS / Linux)

```bash
chmod +x install.sh docker/ensure-secrets.sh docker/show-login.sh
./install.sh
```

The installer checks Docker, generates secrets, builds containers, seeds the database, and opens **http://localhost:3030**.

### Option B — Manual

```bash
chmod +x docker/ensure-secrets.sh docker/show-login.sh
./docker/ensure-secrets.sh
docker compose up --build -d
```

Wait until the backend is healthy:

```bash
curl http://localhost:8000/health
# {"status":"ok","redis":"connected"}
```

Open **http://localhost:3030** in your browser.

---

## Login credentials

Secrets and passwords are **generated locally** — nothing is hardcoded in the repo.

| Step | Command / file |
|------|----------------|
| Generate secrets | `./docker/ensure-secrets.sh` |
| View credentials | `./docker/show-login.sh` |
| Credential file | `docker/login-credentials.txt` |

Example `docker/login-credentials.txt`:

```
SignalWorkflow local login
==========================

Super Admin : inv.mdm@innovant.ai
Admin       : poorvith.devang@flame.edu.in
Password    : <generated>

OTP inbox   : http://localhost:8025
```

**Default accounts**

| Role | Email |
|------|-------|
| Super Admin | `inv.mdm@innovant.ai` |
| Admin | `poorvith.devang@flame.edu.in` |

1. Sign in at **http://localhost:3030/login**
2. Enter email + password from `docker/login-credentials.txt`
3. Open **http://localhost:8025** (Mailpit) and copy the 6-digit OTP from the verification email
4. After OTP, you land on the dashboard

If login fails, re-sync credentials:

```bash
./docker/ensure-secrets.sh
docker compose restart backend db-init
```

---

## Google sign-in (optional, with RBAC)

You can enable **Sign in with Google** for platform admins. RBAC still applies:

- Only emails that already exist in `platform_admin` can sign in
- The admin's `platform_role` (super_admin, admin, etc.) controls permissions
- Unknown Google accounts are rejected — no auto-registration
- OTP is skipped for Google (Google verifies email); 2FA still applies if enabled

### Setup

1. Create an OAuth 2.0 **Web client** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add **Authorized JavaScript origins**: `http://localhost:3030` (and your production URL)
3. Set the client ID in `docker/.env.docker`:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
FRONTEND_URL=http://localhost:3030
```

4. Rebuild and restart:

```bash
docker compose up --build -d
```

5. Sign in with a Google account whose **email matches** a seeded admin (e.g. `inv.mdm@innovant.ai`)

The Google button appears on the login page only when `GOOGLE_CLIENT_ID` is configured.

### Fix: `no registered origin` / `Error 401: invalid_client`

Google blocks sign-in when the **browser URL origin** is not listed on your OAuth client.

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click your **OAuth 2.0 Client ID** (type must be **Web application**)
3. Under **Authorized JavaScript origins**, add **every** URL you use to open the app:

```
http://localhost:3030
http://127.0.0.1:3030
```

4. Click **Save** and wait 1–2 minutes for Google to propagate changes
5. Hard refresh the login page (Cmd+Shift+R) and try again

**Important**

- Use `http://` not `https://` for local dev
- No trailing slash (`http://localhost:3030` not `http://localhost:3030/`)
- If you open the app via `127.0.0.1`, you must add that origin separately from `localhost`
- The login page shows your current origin under the Google button — copy that exact value

**OAuth consent screen**

- Set **User type** to External (or Internal for Workspace)
- Add `poorvith.devang@flame.edu.in` as a **Test user** while the app is in Testing mode

---

## Services

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3030 | Login + dashboard |
| Backend API | http://localhost:8000 | FastAPI |
| API docs | http://localhost:8000/docs | Swagger UI |
| Mailpit | http://localhost:8025 | OTP emails (dev) |
| Postgres | `localhost:5433` | Database (`SignalMDM`) |
| Redis | `localhost:6379` | Sessions / rate limits |

---

## Project layout

```
SignalWorkflow/
├── MDM_Backend/          # FastAPI — auth + platform RBAC
├── MDM_Frontend/         # React — login, dashboard, RBAC UI
├── docker/
│   ├── ensure-secrets.sh       # Creates .env.generated + login-credentials.txt
│   ├── show-login.sh           # Prints login-credentials.txt
│   ├── login-credentials.txt   # Local passwords (gitignored)
│   ├── .env.generated          # JWT / encryption keys (gitignored)
│   ├── seed_users.py           # Seeds roles + admin users
│   └── db-init.sh              # Waits for DB, runs seed
├── docker-compose.yml
├── install.sh
└── install.bat
```

---

## Useful commands

```bash
# View logs
docker compose logs -f

# Stop stack
docker compose down

# Reset everything (deletes DB volume)
docker compose down -v

# Rebuild after code changes
docker compose up --build -d
```

---

## Local development (without Docker)

**Backend**

```bash
cd MDM_Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Set JWT_SECRET, TOKEN_ENCRYPTION_KEY, DATABASE_URL, REDIS_URL in .env
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd MDM_Frontend
npm ci
VITE_API_URL=http://localhost:8000/api/v1 npm run dev
```

You still need Postgres, Redis, and Mailpit (or use the Docker stack for infra only).

---

## Security notes

- `docker/.env.generated` and `docker/login-credentials.txt` are gitignored — never commit them.
- Regenerate secrets with `rm docker/.env.generated && ./docker/ensure-secrets.sh` if they are exposed.
- OTP is required for every login in development (check Mailpit).

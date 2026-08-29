# SignalWorkflow

SignalWorkflow is a platform foundation for secure admin access — email/password login, OTP verification, optional Google sign-in, two-factor authentication, and role-based access control (RBAC).

Built with **FastAPI**, **React**, **PostgreSQL**, and **Redis**, packaged for local development with Docker.

---

## Features

- Email + password authentication with OTP verification (Mailpit in dev)
- Optional Google sign-in for existing platform admins
- Two-factor authentication (TOTP) setup and verification
- Platform RBAC with seeded roles: `super_admin`, `admin`, `data_architect`, `data_manager`, `executive`
- Encrypted tokens, Redis-backed sessions, and rate limiting
- Dashboard and platform RBAC management UI

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS / Windows) or Docker Engine + Compose (Linux)
- Free ports: **3030** (app), **8000** (API), **5433** (Postgres), **6379** (Redis), **8025** (Mailpit)

---

## Quick start

### macOS / Linux (recommended)

```bash
chmod +x install.sh docker/ensure-secrets.sh docker/show-login.sh
./install.sh
```

The installer checks Docker, generates local secrets, builds containers, seeds the database, and opens **http://localhost:3030**.

### Manual start

```bash
chmod +x docker/ensure-secrets.sh docker/show-login.sh
./docker/ensure-secrets.sh
docker compose up --build -d
```

Wait for the API to become healthy:

```bash
curl http://localhost:8000/health
# {"status":"ok","redis":"connected"}
```

Open **http://localhost:3030**.

### Windows

```bat
install.bat
```

---

## Login

Secrets and passwords are generated on your machine — nothing sensitive is committed to git.

| Action | Command |
|--------|---------|
| Generate secrets | `./docker/ensure-secrets.sh` |
| View credentials | `./docker/show-login.sh` |
| Credential file | `docker/login-credentials.txt` |

**Seeded accounts**

| Role | Email |
|------|-------|
| Super Admin | `inv.mdm@innovant.ai` |
| Admin | `poorvith.devang@flame.edu.in` |

**Sign-in flow**

1. Open **http://localhost:3030/login**
2. Enter email and password from `docker/login-credentials.txt`
3. Open **http://localhost:8025** (Mailpit) and copy the 6-digit OTP
4. Complete OTP (and 2FA if enabled) to reach the dashboard

If login fails after a reset:

```bash
./docker/ensure-secrets.sh
docker compose restart backend db-init
```

---

## Google sign-in (optional)

Google sign-in works only for emails that already exist in `platform_admin`. RBAC still applies — unknown Google accounts are rejected.

1. Create an OAuth 2.0 **Web application** client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add authorized JavaScript origins:
   ```
   http://localhost:3030
   http://127.0.0.1:3030
   ```
3. Set the client ID in `docker/.env.docker`:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   FRONTEND_URL=http://localhost:3030
   ```
4. Rebuild:
   ```bash
   docker compose up --build -d
   ```

The Google button appears only when `GOOGLE_CLIENT_ID` is set. Use the exact browser origin shown on the login page if you see `no registered origin` errors.

While the OAuth app is in **Testing** mode, add your Google account under **Test users** on the consent screen.

---

## Services

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3030 | Login, dashboard, RBAC UI |
| Backend API | http://localhost:8000 | FastAPI |
| API docs | http://localhost:8000/docs | Swagger UI |
| Mailpit | http://localhost:8025 | OTP emails (development) |
| PostgreSQL | `localhost:5433` | Database (`SignalMDM`) |
| Redis | `localhost:6379` | Sessions and rate limits |

---

## Project layout

```
SignalWorkflow/
├── Backend/                 # FastAPI — auth, sessions, platform RBAC
├── Frontend/                # React + Vite — login flow and admin UI
├── docker/
│   ├── ensure-secrets.sh    # Generates .env.generated + login-credentials.txt
│   ├── show-login.sh        # Prints local login credentials
│   ├── seed_users.py        # Seeds roles and admin users
│   └── db-init.sh           # Waits for Postgres, runs seed
├── docker-compose.yml
├── install.sh               # One-click installer (macOS / Linux)
└── install.bat              # One-click installer (Windows)
```

---

## Useful commands

```bash
# Follow logs
docker compose logs -f

# Stop stack
docker compose down

# Full reset (deletes database volume)
docker compose down -v

# Rebuild after code changes
docker compose up --build -d
```

---

## Local development (without Docker)

You still need PostgreSQL, Redis, and Mailpit running (or use Docker for infrastructure only).

**Backend**

```bash
cd Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Configure JWT_SECRET, TOKEN_ENCRYPTION_KEY, DATABASE_URL, REDIS_URL in .env
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd Frontend
npm ci
VITE_API_URL=http://localhost:8000/api/v1 npm run dev
```

---

## Security notes

- `docker/.env.generated` and `docker/login-credentials.txt` are gitignored — never commit them.
- Regenerate secrets if exposed: `rm docker/.env.generated && ./docker/ensure-secrets.sh`
- OTP is required for password logins in development — check Mailpit at http://localhost:8025.

---

## License

Private project. All rights reserved.

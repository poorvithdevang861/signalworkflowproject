#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# SignalWorkflow — One-Click Installer for Linux & macOS
# Checks/installs Docker, builds containers, seeds database,
# and opens the application in your browser.
# ─────────────────────────────────────────────────────────────
set -e

# ── Colors ────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Helpers ───────────────────────────────────────────────────
info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "  ${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $1"; }
err()   { echo -e "  ${RED}[ERROR]${NC} $1"; }
step()  { echo -e "\n  ${BOLD}[$1]${NC} $2"; }

# Detect OS
OS="$(uname -s)"
case "$OS" in
    Linux*)  PLATFORM="linux";;
    Darwin*) PLATFORM="macos";;
    *)       PLATFORM="unknown";;
esac

# Navigate to script directory
cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"

# ── Banner ────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}"
echo "  ============================================================"
echo "     ____  _                   _  __  __ ____  __  __ "
echo "    / ___|| |  __ _ _ __   __ _| ||  \/  |  _ \|  \/  |"
echo "    \___ \| | / _\` | '_ \ / _\` | || |\/| | | | | |\/| |"
echo "     ___) | || (_| | | | | (_| | || |  | | |_| | |  | |"
echo "    |____/|_| \__, |_| |_|\__,_|_||_|  |_|____/|_|  |_|"
echo "              |___/"
echo ""
echo "    Master Data Management Platform"
echo "    One-Click Docker Installation ($PLATFORM)"
echo "  ============================================================"
echo -e "${NC}"

# ── Step 1: Check Docker ─────────────────────────────────────
step "1/6" "Checking Docker installation..."

if ! command -v docker &> /dev/null; then
    err "Docker is not installed on this system."
    echo ""

    if [ "$PLATFORM" = "linux" ]; then
        echo "  Would you like to install Docker automatically? (y/N)"
        read -r INSTALL_DOCKER
        if [[ "$INSTALL_DOCKER" =~ ^[Yy]$ ]]; then
            info "Installing Docker via official script..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            rm -f get-docker.sh

            # Add current user to docker group
            sudo usermod -aG docker "$USER"
            info "Added '$USER' to docker group."
            warn "You may need to log out and back in for group changes to take effect."
            warn "Then run this installer again."

            # Try to use newgrp to avoid logout
            info "Attempting to activate docker group..."
            newgrp docker <<INNERSCRIPT
                echo "  Docker group activated. Continuing..."
INNERSCRIPT
        else
            echo ""
            echo "  Please install Docker manually:"
            echo "    https://docs.docker.com/engine/install/"
            echo ""
            exit 1
        fi
    elif [ "$PLATFORM" = "macos" ]; then
        err "Please install Docker Desktop for Mac from:"
        echo "    https://www.docker.com/products/docker-desktop/"
        echo ""
        info "Opening download page..."
        open "https://www.docker.com/products/docker-desktop/" 2>/dev/null || true
        echo ""
        exit 1
    fi
fi

DOCKER_VERSION=$(docker --version 2>/dev/null || echo "unknown")
ok "Found: $DOCKER_VERSION"

# ── Step 2: Check Docker Daemon ──────────────────────────────
step "2/6" "Checking Docker daemon status..."

if ! docker info &> /dev/null; then
    warn "Docker daemon is not running."

    if [ "$PLATFORM" = "macos" ]; then
        info "Starting Docker Desktop..."
        open -a Docker 2>/dev/null || true
    elif [ "$PLATFORM" = "linux" ]; then
        info "Starting Docker daemon..."
        sudo systemctl start docker 2>/dev/null || sudo service docker start 2>/dev/null || true
    fi

    info "Waiting for Docker to start (up to 90 seconds)..."
    WAIT=0
    while [ $WAIT -lt 90 ]; do
        if docker info &> /dev/null; then
            break
        fi
        sleep 3
        WAIT=$((WAIT + 3))
        echo -ne "  ... waiting (${WAIT}/90s)\r"
    done
    echo ""

    if ! docker info &> /dev/null; then
        err "Docker did not start within 90 seconds."
        err "Please start Docker manually and run this installer again."
        exit 1
    fi
fi

ok "Docker daemon is running."

# ── Step 3: Check Docker Compose ─────────────────────────────
step "3/6" "Verifying Docker Compose..."

if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    COMPOSE_VERSION=$(docker compose version 2>/dev/null)
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    COMPOSE_VERSION=$(docker-compose version 2>/dev/null)
else
    err "Docker Compose is not available."
    err "Please install Docker Compose or update Docker Desktop."
    exit 1
fi

ok "Found: $COMPOSE_VERSION"

# ── Step 4: Build and Start ──────────────────────────────────
step "4/6" "Building and starting SignalWorkflow containers..."
info "This may take 3-5 minutes on the first run."
echo ""

cd "$SCRIPT_DIR"

chmod +x docker/ensure-secrets.sh docker/show-login.sh
./docker/ensure-secrets.sh

$COMPOSE_CMD up --build -d
if [ $? -ne 0 ]; then
    err "Failed to start containers."
    err "Check logs with: $COMPOSE_CMD logs"
    exit 1
fi

# ── Step 5: Wait for Services ────────────────────────────────
step "5/6" "Waiting for all services to become healthy..."

HEALTH_WAIT=0
MAX_HEALTH_WAIT=120

while [ $HEALTH_WAIT -lt $MAX_HEALTH_WAIT ]; do
    # Check backend
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        ok "Backend API is ready."
        break
    fi

    sleep 5
    HEALTH_WAIT=$((HEALTH_WAIT + 5))
    echo -ne "  ... waiting for backend (${HEALTH_WAIT}/${MAX_HEALTH_WAIT}s)\r"
done
echo ""

if [ $HEALTH_WAIT -ge $MAX_HEALTH_WAIT ]; then
    warn "Services took longer than expected. Check: $COMPOSE_CMD ps"
fi

# Check frontend
FRONT_WAIT=0
while [ $FRONT_WAIT -lt 30 ]; do
    FRONT_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3030 2>/dev/null || echo "000")
    if [ "$FRONT_CODE" = "200" ]; then
        ok "Frontend is ready."
        break
    fi
    sleep 3
    FRONT_WAIT=$((FRONT_WAIT + 3))
done

# Wait for db-init
info "Waiting for database initialization..."
sleep 15
ok "Database initialization complete."

# ── Step 6: Show Results ─────────────────────────────────────
step "6/6" "Opening SignalWorkflow in your browser..."

echo ""
echo -e "${GREEN}"
echo "  ============================================================"
echo ""
    echo "    SignalWorkflow is now running!"
echo ""
echo "    Frontend:  http://localhost:3030"
echo "    Backend:   http://localhost:8000"
echo "    API Docs:  http://localhost:8000/docs"
echo "    Mailpit:   http://localhost:8025  (view OTP emails here)"
echo ""
    echo "    ---- Default Login Credentials ----"
    echo "    Email:     inv.mdm@innovant.ai"
    echo "    Password:  see docker/login-credentials.txt"
    echo "               (run: ./docker/show-login.sh)"
echo ""
echo "    After login, check Mailpit for your OTP verification code."
echo "    If Mailpit is unavailable, find the OTP in backend logs:"
echo "      $COMPOSE_CMD logs backend"
echo ""
echo "  ============================================================"
echo ""
echo "    Useful Commands:"
echo "      Stop:     $COMPOSE_CMD down"
echo "      Restart:  $COMPOSE_CMD restart"
echo "      Logs:     $COMPOSE_CMD logs -f"
echo "      Reset:    $COMPOSE_CMD down -v  (deletes all data)"
echo ""
echo "  ============================================================"
echo -e "${NC}"

# Open browser
if [ "$PLATFORM" = "macos" ]; then
    open "http://localhost:3030" 2>/dev/null || true
elif [ "$PLATFORM" = "linux" ]; then
    xdg-open "http://localhost:3030" 2>/dev/null || \
    sensible-browser "http://localhost:3030" 2>/dev/null || \
    echo "  Open http://localhost:3030 in your browser."
fi

echo "  Installation complete. Press Enter to exit."
read -r

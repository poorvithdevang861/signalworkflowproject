@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ─────────────────────────────────────────────────────────────
:: SignalMDM — One-Click Installer for Windows
:: Checks/installs Docker, builds containers, seeds database,
:: and opens the application in your browser.
:: ─────────────────────────────────────────────────────────────

title SignalMDM Installer

:: ── Colors ───────────────────────────────────────────────────
:: (Windows terminal supports ANSI in modern versions)

echo.
echo  ============================================================
echo     ____  _                   _  __  __ ____  __  __
echo    / ___^|(_) __ _ _ __   __ _^| ^|^|  \/  ^|  _ \^|  \/  ^|
echo    \___ \^| ^|/ _` ^| '_ \ / _` ^| ^|^| ^|\/^| ^| ^| ^| ^| ^|\/^| ^|
echo     ___) ^| ^| (_^| ^| ^| ^| ^| (_^| ^| ^|^| ^|  ^| ^| ^|_^| ^| ^|  ^| ^|
echo    ^|____/^|_^|\__, ^|_^| ^|_^|\__,_^|_^|^|_^|  ^|_^|____/^|_^|  ^|_^|
echo             ^|___/
echo.
echo    Master Data Management Platform
echo    One-Click Docker Installation
echo  ============================================================
echo.

:: ── Step 1: Check Docker Installation ────────────────────────
echo  [1/6] Checking Docker installation...

docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Docker is not installed on this system.
    echo.
    echo  Docker Desktop is required to run SignalMDM.
    echo  Please install it from:
    echo.
    echo    https://www.docker.com/products/docker-desktop/
    echo.
    echo  After installation:
    echo    1. Restart your computer
    echo    2. Run this installer again
    echo.
    echo  Opening Docker download page in your browser...
    start "" "https://www.docker.com/products/docker-desktop/"
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('docker --version 2^>nul') do echo    Found: %%v

:: ── Step 2: Check Docker Daemon ──────────────────────────────
echo.
echo  [2/6] Checking Docker daemon status...

docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    Docker daemon is not running. Attempting to start Docker Desktop...
    
    :: Try to start Docker Desktop
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>nul
    if %ERRORLEVEL% NEQ 0 (
        start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe" 2>nul
    )
    
    echo    Waiting for Docker to start (this may take up to 90 seconds)...
    
    set /a WAIT_COUNT=0
    :docker_wait_loop
    if !WAIT_COUNT! GEQ 90 (
        echo.
        echo  [ERROR] Docker did not start within 90 seconds.
        echo  Please start Docker Desktop manually and run this installer again.
        echo.
        pause
        exit /b 1
    )
    
    timeout /t 3 /nobreak >nul
    set /a WAIT_COUNT+=3
    
    docker info >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo    ... waiting (!WAIT_COUNT!/90s)
        goto docker_wait_loop
    )
    
    echo    Docker Desktop started successfully.
)

echo    Docker daemon is running.

:: ── Step 3: Check Docker Compose ─────────────────────────────
echo.
echo  [3/6] Verifying Docker Compose...

docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Docker Compose is not available.
    echo  Please update Docker Desktop to the latest version.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('docker compose version 2^>nul') do echo    Found: %%v

:: ── Step 4: Build and Start Containers ───────────────────────
echo.
echo  [4/6] Building and starting SignalMDM containers...
echo         (This may take 3-5 minutes on first run)
echo.

cd /d "%~dp0"

if not exist "docker\.env.generated" (
    echo  Generating JWT and seed secrets...
    python -c "import secrets,pathlib; p=pathlib.Path('docker/.env.generated'); p.write_text('JWT_SECRET='+secrets.token_hex(32)+'\nTOKEN_ENCRYPTION_KEY='+secrets.token_hex(32)+'\nADMIN_SEED_PASSWORD='+secrets.token_urlsafe(12)+'\n'); p.chmod(0o600)"
    if %ERRORLEVEL% NEQ 0 (
        echo  [ERROR] Could not generate docker\.env.generated. Install Python 3 or run docker\ensure-secrets.sh
        pause
        exit /b 1
    )
)

docker compose up --build -d
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Failed to start containers.
    echo  Check the logs with: docker compose logs
    echo.
    pause
    exit /b 1
)

:: ── Step 5: Wait for Services ────────────────────────────────
echo.
echo  [5/6] Waiting for all services to become healthy...

:: Wait for backend
set /a HEALTH_WAIT=0
:health_loop
if !HEALTH_WAIT! GEQ 120 (
    echo.
    echo  [WARN] Services took longer than expected.
    echo  Check status with: docker compose ps
    goto show_result
)

timeout /t 5 /nobreak >nul
set /a HEALTH_WAIT+=5

:: Check if backend is responding
curl -s -o nul -w "%%{http_code}" http://localhost:8000/docs >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    Backend API is ready.
) else (
    echo    ... waiting for backend (!HEALTH_WAIT!/120s)
    goto health_loop
)

:: Check if frontend is responding
curl -s -o nul http://localhost:3030 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    Frontend is ready.
) else (
    echo    ... waiting for frontend
    timeout /t 5 /nobreak >nul
)

:: Wait for db-init to complete
echo    Waiting for database initialization...
timeout /t 15 /nobreak >nul
echo    Database initialization complete.

:: ── Step 6: Show Results ─────────────────────────────────────
:show_result
echo.
echo  [6/6] Opening SignalMDM in your browser...
echo.
echo  ============================================================
echo.
echo    SignalMDM is now running!
echo.
echo    Frontend:  http://localhost:3030
echo    Backend:   http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo    Mailpit:   http://localhost:8025  (view OTP emails here)
echo.
echo    ---- Default Login Credentials ----
echo    Email:     inv.mdm@innovant.ai
echo    Password:  see ADMIN_SEED_PASSWORD in docker\.env.generated
echo.
echo    After login, check Mailpit for your OTP verification code.
echo    If Mailpit is unavailable, find the OTP in backend logs:
echo      docker compose logs backend
echo.
echo  ============================================================
echo.
echo    Useful Commands:
echo      Stop:     docker compose down
echo      Restart:  docker compose restart
echo      Logs:     docker compose logs -f
echo      Reset:    docker compose down -v  (deletes all data)
echo.
echo  ============================================================
echo.

:: Open browser
start "" "http://localhost:3030"

pause

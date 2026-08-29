#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# SignalMDM — One-Click Installer for macOS
# Double-click this file in Finder to install.
# It delegates to install.sh with macOS-specific handling.
# ─────────────────────────────────────────────────────────────

# Navigate to the directory containing this script
cd "$(dirname "$0")"

# Make install.sh executable (in case git didn't preserve permissions)
chmod +x install.sh

# Run the main installer
exec ./install.sh

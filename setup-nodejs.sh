#!/bin/bash
# Quick Start Guide - Node.js Installation für Linux

echo "🚀 GHOST-FREE ENTERPRISE SYSTEM - NODE.JS SETUP"
echo "================================================"
echo ""

# Prüfe aktuelle Installation
echo "📊 Status Check..."
if command -v node &> /dev/null; then
    echo "✅ Node.js ist bereits installiert: $(node --version)"
else
    echo "❌ Node.js ist NICHT installiert"
    echo ""
    echo "📦 INSTALLATIONS-OPTIONEN:"
    echo ""
    echo "OPTION A - NVM (Node Version Manager) - EMPFOHLEN:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    echo "  source ~/.bashrc"
    echo "  nvm install 18"
    echo "  nvm use 18"
    echo ""
    echo "OPTION B - System Package Manager (Fedora/RHEL):"
    echo "  sudo dnf install nodejs npm"
    echo ""
    echo "OPTION C - System Package Manager (Ubuntu/Debian):"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    echo ""
fi

if command -v npm &> /dev/null; then
    echo "✅ npm ist installiert: $(npm --version)"
else
    echo "❌ npm ist NICHT installiert"
fi

echo ""
echo "🎯 NACH DER INSTALLATION:"
echo ""
echo "1. Terminal neu starten (oder: source ~/.bashrc)"
echo "2. cd zu diesem Projekt"
echo "3. npm install"
echo "4. npm run dev"
echo ""
echo "📖 Vollständige Dokumentation: README.md"

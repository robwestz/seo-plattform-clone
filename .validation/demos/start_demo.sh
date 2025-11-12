#!/bin/bash

# SEO Intelligence Platform - Demo Launcher (Unix/Linux/Mac)

echo "🚀 Startar SEO Intelligence Platform Demo..."
echo ""

# Kontrollera om Python finns
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 hittades inte. Installera Python 3 först."
    exit 1
fi

# Kör Python-servern
python3 start_demo.py

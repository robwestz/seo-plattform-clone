#!/usr/bin/env python3
"""
SEO Intelligence Platform - Demo Server
Startar en lokal HTTP-server för att visa demo-miljön
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Configuration
PORT = 8000
HOST = "localhost"
DEMO_FILE = "index.html"


class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler med bättre felhantering och logging"""

    def log_message(self, format, *args):
        """Custom log format"""
        sys.stdout.write(f"[{self.log_date_time_string()}] {format % args}\n")

    def end_headers(self):
        """Lägg till CORS headers för lokal utveckling"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()


def find_available_port(start_port=8000, max_attempts=10):
    """Hitta en ledig port om den önskade är upptagen"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socketserver.TCPServer(("", port), None) as s:
                return port
        except OSError:
            continue
    return None


def start_server():
    """Starta demo-servern"""

    # Byt till demo-mappen
    demo_dir = Path(__file__).parent
    os.chdir(demo_dir)

    print("=" * 70)
    print("🚀  SEO Intelligence Platform - Demo Server")
    print("=" * 70)
    print()

    # Hitta ledig port
    port = find_available_port(PORT)
    if not port:
        print(f"❌ Kunde inte hitta en ledig port (prövade {PORT}-{PORT+10})")
        sys.exit(1)

    if port != PORT:
        print(f"⚠️  Port {PORT} upptagen, använder port {port} istället")
        print()

    url = f"http://{HOST}:{port}/{DEMO_FILE}"

    try:
        # Skapa server
        with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
            print(f"✅  Server startad på port {port}")
            print()
            print("📂  Demo-fil:")
            print(f"    {demo_dir / DEMO_FILE}")
            print()
            print("🌐  Öppna i webbläsaren:")
            print(f"    {url}")
            print()
            print("📊  Tillgängliga vyer:")
            print("    • Ranking Dashboard - Keyword position tracking")
            print("    • Keyword Research - Keyword suggestions och analys")
            print("    • Competitor Analysis - Konkurrentanalys och gap analysis")
            print("    • Analytics - Grafer och statistik")
            print()
            print("=" * 70)
            print("💡  Tips:")
            print("    • Demon fungerar helt fristående (ingen backend behövs)")
            print("    • All data är mockad för demo-syfte")
            print("    • Perfekt för att visa för chefer och intressenter")
            print("=" * 70)
            print()
            print("🛑  Tryck Ctrl+C för att stoppa servern")
            print()

            # Öppna webbläsaren automatiskt
            try:
                print("🌐  Öppnar webbläsare...")
                webbrowser.open(url)
            except Exception as e:
                print(f"⚠️  Kunde inte öppna webbläsare automatiskt: {e}")
                print(f"    Öppna manuellt: {url}")

            print()
            print("📊  Server körs... Väntar på requests...")
            print("-" * 70)
            print()

            # Starta servern
            httpd.serve_forever()

    except KeyboardInterrupt:
        print()
        print()
        print("=" * 70)
        print("🛑  Server stoppad")
        print("=" * 70)
        print()
        print("Tack för att du använde SEO Intelligence Platform Demo! 👋")
        print()
        sys.exit(0)

    except Exception as e:
        print()
        print(f"❌  Ett fel uppstod: {e}")
        sys.exit(1)


if __name__ == "__main__":
    start_server()

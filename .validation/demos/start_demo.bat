@echo off
REM SEO Intelligence Platform - Demo Launcher (Windows)

echo.
echo ========================================
echo   SEO Intelligence Platform - Demo
echo ========================================
echo.
echo Startar demo-server...
echo.

REM Kontrollera om Python finns
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [FEL] Python hittades inte.
    echo Installera Python fran https://www.python.org
    echo.
    pause
    exit /b 1
)

REM Kör Python-servern
python start_demo.py

pause

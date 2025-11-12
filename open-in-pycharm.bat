@echo off
REM Open SEO Platform Clone in PyCharm
REM
REM If you have PyCharm installed, this will try to open the project
REM Otherwise, manually open PyCharm and use File > Open > select this folder

echo Opening SEO Platform Clone in PyCharm...
echo.

REM Try common PyCharm installation paths
if exist "C:\Program Files\JetBrains\PyCharm Community Edition 2024.3\bin\pycharm64.exe" (
    "C:\Program Files\JetBrains\PyCharm Community Edition 2024.3\bin\pycharm64.exe" "%~dp0"
    exit /b 0
)

if exist "C:\Program Files\JetBrains\PyCharm Community Edition 2024.2\bin\pycharm64.exe" (
    "C:\Program Files\JetBrains\PyCharm Community Edition 2024.2\bin\pycharm64.exe" "%~dp0"
    exit /b 0
)

if exist "C:\Program Files\JetBrains\PyCharm Professional 2024.3\bin\pycharm64.exe" (
    "C:\Program Files\JetBrains\PyCharm Professional 2024.3\bin\pycharm64.exe" "%~dp0"
    exit /b 0
)

if exist "C:\Program Files\JetBrains\PyCharm Professional 2024.2\bin\pycharm64.exe" (
    "C:\Program Files\JetBrains\PyCharm Professional 2024.2\bin\pycharm64.exe" "%~dp0"
    exit /b 0
)

REM Try via PATH
where pycharm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    pycharm "%~dp0"
    exit /b 0
)

echo.
echo [INFO] PyCharm not found in common locations.
echo.
echo Please open PyCharm manually:
echo 1. Launch PyCharm
echo 2. File ^> Open
echo 3. Select: %~dp0
echo.
pause


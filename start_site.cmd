@echo off
setlocal
cd /d "%~dp0"

set PORT=8000
echo Serving portfolio at http://127.0.0.1:%PORT%/
echo Press Ctrl+C to stop the server.
echo.

where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server %PORT%
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server %PORT%
  goto :eof
)

echo Python was not found on PATH.
exit /b 1

@echo off
echo ===================================================
echo [JARVIS STOCK ASSISTANT] Memulai Server Lokal...
echo ===================================================

start "Jarvis-Backend (Port 3050)" cmd /k "cd /d %~dp0be && npm run dev"
start "Jarvis-Frontend (Port 3051)" cmd /k "cd /d %~dp0fe && npm run dev"

echo Backend  : http://localhost:3050
echo Frontend : http://localhost:3051
echo ===================================================

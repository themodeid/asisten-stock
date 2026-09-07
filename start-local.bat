@echo off
echo ===================================================
echo [ASISTEN+STOCK] Memulai Server Lokal...
echo ===================================================

start "Asisten-Stock-Backend (Port 3050)" cmd /k "cd /d %~dp0be && npm run dev"
start "Asisten-Stock-Frontend (Port 3051)" cmd /k "cd /d %~dp0fe && npm run dev"

echo Backend  : http://localhost:3050
echo Frontend : http://localhost:3051
echo ===================================================

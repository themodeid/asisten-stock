@echo off
echo =======================================================
echo    MEMULAI VERIFIKASI LOKAL CI (asisten+stock)
echo =======================================================
echo.
echo [1/2] Menjalankan 41 Unit Tests Backend...
cd be
call npm.cmd test
if %errorlevel% neq 0 (
    echo.
    echo ❌ [ERROR] Unit test backend gagal!
    cd ..
    exit /b %errorlevel%
)

echo.
echo [2/2] Menguji Kompilasi TypeScript Backend...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ [ERROR] Kompilasi backend gagal!
    cd ..
    exit /b %errorlevel%
)

cd ..
echo.
echo =======================================================
echo ✅ [SUKSES BESAR] Seluruh pemeriksaan lokal berhasil!
echo    Sistem aman dan siap untuk dideploy!
echo =======================================================

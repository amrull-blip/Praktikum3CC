@echo off
echo ===================================================
echo     Menjalankan ChromaCraft (PHP Native Server)
echo ===================================================
echo.
echo Server aktif di: http://localhost:8000
echo Tekan Ctrl+C untuk menghentikan server.
echo.
start http://localhost:8000
php -S localhost:8000
pause

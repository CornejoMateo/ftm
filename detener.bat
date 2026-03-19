@echo off
title Detener Futbol Manager

cd /d %~dp0

echo Deteniendo contenedores...

call backup_db.bat
docker compose down

echo.
echo Aplicacion detenida.
pause

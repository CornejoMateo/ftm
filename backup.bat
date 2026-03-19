@echo off
title Backup Futbol Manager

cd /d %~dp0

echo ======================================
echo 💾 Iniciando backup de la base
echo ======================================

if not exist backups (
    mkdir backups
)

for /f "tokens=1-4 delims=/ " %%a in ("%date%") do (
    set fecha=%%d-%%b-%%c
)

for /f "tokens=1-2 delims=: " %%a in ("%time%") do (
    set hora=%%a-%%b
)

set filename=backup_%fecha%_%hora%.sql

echo Generando backup...

docker exec dlay_postgres pg_dump -U postgres -d ftm > backups\%filename%

if errorlevel 1 (
    echo ❌ Error generando el backup
    pause
    exit /b 1
)

echo.
echo ✅ Backup creado:
echo backups\%filename%
echo.

pause

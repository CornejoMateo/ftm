@echo off
title Restore Futbol Manager

cd /d %~dp0

echo ======================================
echo 🔄 Restaurar base de datos
echo ======================================

set /p archivo=Ingrese nombre del backup (ej: backup_2026-03-13_21-30.sql):

if not exist backups\%archivo% (
    echo ❌ El archivo no existe
    pause
    exit /b 1
)

echo.
echo ⚠️ Esto sobrescribirá la base actual.
pause

docker exec -i dlay_postgres psql -U postgres -d ftm < backups\%archivo%

if errorlevel 1 (
    echo ❌ Error restaurando la base
    pause
    exit /b 1
)

echo.
echo ✅ Base restaurada correctamente
pause

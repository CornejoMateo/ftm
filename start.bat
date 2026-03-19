@echo off
title Futbol Manager

cd /d %~dp0

echo ====================================================
echo 🔍 Verificando Docker Desktop...
echo ====================================================

docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Desktop no está instalado.
    echo.
    echo Descargalo desde:
    echo https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo ✅ Docker encontrado

echo ====================================================
echo ⏳ Esperando que Docker arranque...
echo ====================================================

set /a counter=0

:checkDocker
set /a counter+=1
docker info >nul 2>&1

if not errorlevel 1 goto dockerReady

if %counter% geq 20 (
    echo ❌ Docker no arrancó.
    echo Abrí Docker Desktop manualmente.
    pause
    exit /b 1
)

timeout /t 3 >nul
goto checkDocker

:dockerReady
echo ✅ Docker está listo

echo ====================================================
echo 🔍 Verificando docker-compose.yml...
echo ====================================================

if not exist "docker-compose.yml" (
    echo ❌ No se encontró docker-compose.yml
    pause
    exit /b 1
)

echo ✅ docker-compose.yml encontrado

echo ====================================================
echo 🚀 Levantando aplicación...
echo ====================================================

docker compose up -d --build

if errorlevel 1 (
    echo ❌ Error al iniciar los contenedores
    pause
    exit /b 1
)

echo.
echo ====================================================
echo 🎉 Aplicación iniciada correctamente
echo ====================================================
echo.
echo Abriendo navegador...
start http://localhost:3000

echo.
echo Para detener la app ejecutar: detener_app.bat
echo.

pause

@echo off

echo Actualizando aplicacion...

docker compose down
docker compose up -d --build

echo Actualizacion completa
pause

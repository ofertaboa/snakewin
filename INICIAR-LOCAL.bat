@echo off
chcp 65001 >nul
title SnakeWin - servidor local
cd /d "%~dp0"
echo.
echo  ==========================================
echo    SnakeWin - servidor local (estatico)
echo  ==========================================
echo.
echo  Abra no navegador:  http://localhost:8080/snakewin/
echo  (a barra do base path /snakewin e a mesma do GitHub Pages)
echo  (para trocar a porta: set PORT=3000 antes de rodar)
echo.
node tools\server.js
pause

@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher\start-game.ps1"
if errorlevel 1 (
  echo.
  echo Failed to start the game. Keep this window open and report the message above.
  pause
)

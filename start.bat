@echo off
TITLE Fashion AI MVP Launcher

echo Starting Fashion AI MVP...
start "Backend Server (FastAPI)" cmd /k "cd /d "%~dp0" && python backend/main.py"
start "Frontend Server (Vite)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

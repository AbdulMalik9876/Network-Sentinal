@echo off
rem Starts the API server and the website from this folder (settings come from .env)
cd /d "%~dp0"
echo Starting Network Sentinel...

start "Backend" cmd /k pnpm --filter @workspace/api-server run dev

start "Frontend" cmd /k pnpm --filter @workspace/netwatch run dev

echo Both servers started in separate windows. Open http://localhost:5173

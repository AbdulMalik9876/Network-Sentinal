@echo off
echo Starting Network Sentinel...

start "Backend" cmd /k "cd /d D:\Setup\Network-Sentinel && set PORT=5000 && set NODE_ENV=development && pnpm --filter @workspace/api-server run dev"

start "Frontend" cmd /k "cd /d D:\Setup\Network-Sentinel && set PORT=5173 && set BASE_PATH=/ && pnpm --filter @workspace/netwatch run dev"

echo Both servers started in separate windows.
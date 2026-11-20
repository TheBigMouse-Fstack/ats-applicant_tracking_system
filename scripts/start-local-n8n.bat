@echo off
echo ========================================================
echo   RECOVERX ATS - KHOI DONG N8N LOCAL + CLOUDFLARE TUNNEL
echo ========================================================
echo.
echo Dang khoi dong n8n local tren cong 5678...
start "n8n Server (Local 5678)" cmd /c "npx n8n start"
timeout /t 4 >nul
echo Dang ket noi duong ham Cloudflare Tunnel ra Internet...
start "Cloudflare Tunnel" cmd /c "\"C:\Program Files (x86)\cloudflared\cloudflared.exe\" tunnel --url http://localhost:5678"
echo.
echo ========================================================
echo   HOAN TAT!
echo   - Giao dien n8n Local: http://localhost:5678
echo   - Du lieu duoc luu an toan tai may ban, khong lo het han.
echo ========================================================
pause

@echo off
echo ========================================================
echo AlteraVie - Windows Firewall Mobile Testing Setup
echo ========================================================
echo.

:: Check for administrative privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Administrator privileges detected. Configuring firewall...
) else (
    echo ERROR: You must right-click this file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo.
echo Adding firewall rule for Frontend (Port 5173)...
netsh advfirewall firewall add rule name="AlteraVie Frontend (Vite)" dir=in action=allow protocol=TCP localport=5173

echo.
echo Adding firewall rule for Backend API (Port 8000)...
netsh advfirewall firewall add rule name="AlteraVie Backend (FastAPI)" dir=in action=allow protocol=TCP localport=8000

echo.
echo ========================================================
echo SUCCESS! Your firewall is now configured for testing.
echo.
echo To open the app on your phone, make sure your phone is connected
echo to the EXACT SAME Wi-Fi network as this PC, then open your phone browser and go to:
echo.
echo http://192.168.68.100:5173
echo.
echo ========================================================
pause
exit /b 0

@echo off
setlocal EnableExtensions

REM Build an Android APK while preserving the existing React application.
REM Usage: BUILD_ANDROID.bat https://your-public-backend.example.com

if "%~1"=="" (
  echo ERROR: Supply the public HTTPS URL of the deployed FastAPI backend.
  echo Example: BUILD_ANDROID.bat https://api.example.com
  exit /b 2
)
set "VITE_API_BASE=%~1"
if /I not "%VITE_API_BASE:~0,8%"=="https://" (
  echo ERROR: The backend URL must start with https:// for production.
  exit /b 2
)

where node >nul 2>nul || (echo ERROR: Install Node.js 20 or newer first. & exit /b 2)
where npm >nul 2>nul || (echo ERROR: npm is required. & exit /b 2)

cd /d "%~dp0frontend" || exit /b 2

echo [1/5] Installing frontend and Capacitor Android dependencies...
call npm install
if errorlevel 1 exit /b 1
call npm install @capacitor/android@^7.4.3
if errorlevel 1 exit /b 1

echo [2/5] Building the existing web application...
call npm run build
if errorlevel 1 exit /b 1

echo [3/5] Generating the Android project if needed...
if not exist android\gradlew.bat (
  call npx cap add android
  if errorlevel 1 exit /b 1
)

echo [4/5] Syncing the web build to Android...
call npx cap sync android
if errorlevel 1 exit /b 1

echo [5/5] Building debug APK...
cd /d "%~dp0frontend\android" || exit /b 2
call gradlew.bat assembleDebug
if errorlevel 1 exit /b 1

echo.
echo APK built at: %~dp0frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo This is a debug-signed APK for device testing. For public release, create a release signing key and build a signed release APK/AAB.
endlocal

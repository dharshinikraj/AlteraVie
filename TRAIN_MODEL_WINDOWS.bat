@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Run SETUP_AND_RUN_WINDOWS.bat first to create the environment.
  pause
  exit /b 1
)
call .venv\Scripts\activate.bat
pushd backend
python -m module2_prediction.train_model
set ERR=%ERRORLEVEL%
popd
if not "%ERR%"=="0" (
  echo.
  echo Initial training/download failed. Trying Windows CDC downloader...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DOWNLOAD_NHANES_WINDOWS.ps1"
  if errorlevel 1 (
    echo CDC download failed. Check internet access and retry.
    pause
    exit /b 1
  )
  pushd backend
  python -m module2_prediction.train_model
  if errorlevel 1 (
    popd
    echo Training still failed after official files were downloaded.
    pause
    exit /b 1
  )
  popd
)
echo.
echo Model training completed successfully.
pause

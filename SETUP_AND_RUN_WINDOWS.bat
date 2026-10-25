@echo off
setlocal
cd /d "%~dp0"

echo [1/5] Preparing Python environment...
if not exist ".venv\Scripts\python.exe" (
  py -3.12 -m venv .venv 2>nul || python -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
if errorlevel 1 goto :fail

echo [2/5] Running offline integration tests...
pushd backend
python self_test.py
if errorlevel 1 (popd & goto :fail)
popd

echo [3/5] Preparing the real NHANES prediction model...
if not exist "backend\module2_prediction\model\deficiency_model.joblib" (
  pushd backend
  python -m module2_prediction.train_model
  if errorlevel 1 (
    popd
    echo.
    echo Python download/training did not complete. Trying the Windows CDC downloader...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DOWNLOAD_NHANES_WINDOWS.ps1"
    if errorlevel 1 (
      echo.
      echo MODEL DATA DOWNLOAD FAILED.
      echo AlteraVie does not substitute synthetic data. Check your internet connection and retry.
      echo The exact official CDC files belong in backend\module2_prediction\data
      goto :fail
    )
    pushd backend
    python -m module2_prediction.train_model
    if errorlevel 1 (popd & goto :fail)
    popd
  ) else (
    popd
  )
) else (
  echo Existing NHANES model found - skipping retraining.
)

echo [4/5] Preparing frontend...
pushd frontend
call npm install
if errorlevel 1 (popd & goto :fail)
call npm run build
if errorlevel 1 (popd & goto :fail)
popd

echo [5/5] Starting AlteraVie...
start "AlteraVie API" cmd /k "cd /d "%~dp0backend" && call "%~dp0.venv\Scripts\activate.bat" && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
start "AlteraVie Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Frontend: http://localhost:5173
echo Backend docs: http://localhost:8000/docs
echo Keep both terminal windows open.
exit /b 0

:fail
echo.
echo Setup stopped at the first failing check so the app is not left half-configured.
pause
exit /b 1

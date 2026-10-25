# AlteraVie

AlteraVie is a React + FastAPI nutrition/health MVP with source-backed food data, a retrieval-based nutrition assistant, blood-report biomarker extraction, NHANES-trained deficiency screening, Food Vision, authenticated history, and a live OpenStreetMap healthcare finder.

## What is real vs local reference logic

AlteraVie intentionally does **not** substitute fabricated records when an external source is unavailable.

- **Deficiency model training:** official CDC/NCHS NHANES XPT respondent files only.
  - 2017-2018: demographics/body measures, ferritin, vitamin D, biochemistry.
  - 2013-2014: demographics/body measures and serum vitamin B12 (`VITB12_H`, adjusted value `LBDB12`).
- **Food search/recommendations:** USDA FoodData Central at request time.
- **RAG retrieval:** PubMed/NCBI + USDA FoodData Central at request time. Answers show retrieved sources.
- **Specialist finder:** live OpenStreetMap data using Overpass with a Nominatim fallback; city/locality/pincode search works without GPS.
- **Food Vision:** bundled trained MobileNetV3-Small weights classify the dish. Nutrient values are then retrieved from USDA rather than from a hardcoded recipe table.
- **Blood report extraction:** local PDF/image/text parsing and OCR; no cloud OCR service is required.
- **Local reference logic:** nutrient targets, cooking-retention estimates and nutrient-interaction rules are calculation rules, not claimed to be live records. They are educational estimates and are not clinical prescriptions.

- **Pantry Chef (`/pantry`, Module 11):** you list the ingredients you have at home (Indian names like dal, atta, curd, brinjal are understood). Ingredient nutrients come live from USDA FoodData Central; recipes come live from TheMealDB. Dishes are ranked by how much of the recipe your pantry already covers and how well it supports your deficiency nutrients, with the missing items listed. Diet, allergy and dislike filters are applied to ingredients and recipes. If either provider is offline the app says so rather than inventing results. Offline tests: `cd backend && python -m pytest module11_pantry/tests`.

No synthetic NHANES fallback, static clinic directory, fake meal catalog, fake supplement sale catalog, or mock image classifier is used at runtime.

## ⚠️ Python version — 3.12 is REQUIRED, not just recommended

The original docs list Python 3.12 as "recommended." In practice, **Python 3.13 will break the backend install.**

`rapidocr-onnxruntime` (used for OCR on scanned PDF blood reports) has not published a Python 3.13 build as of this writing. If you `pip install -r requirements.txt` on Python 3.13, the whole install fails partway through — `pip` cannot resolve `rapidocr-onnxruntime>=1.3.24`, and because one package fails to resolve, **nothing in requirements.txt gets installed at all**, including `fastapi`. This shows up later as `ModuleNotFoundError: No module named 'fastapi'` even though the install command appeared to run.

**Fix:** install Python 3.12 alongside whatever version you already have (no need to remove 3.13):

1. Download the 3.12.x "Windows installer (64-bit)" `.exe` (not MSIX, not MSI) from https://www.python.org/downloads/windows/
2. During install, check **"Add python.exe to PATH"**
3. Open a **new** terminal window afterward so PATH changes take effect
4. Confirm both versions are visible:
   ```powershell
   py -0
   ```
   You should see both `3.13` and `3.12` listed.

Always create the project's venv explicitly with `py -3.12`, shown below — don't rely on plain `python -m venv`, since that uses whatever your system default is.

## Fastest Windows setup (automated)

Requirements:

- Windows 10/11
- **Python 3.12** (see note above — 3.13 will fail)
- Node.js 20+ and npm
- Internet connection for first-time dependencies, NHANES training, USDA/PubMed/OSM live features

From the extracted project folder, double-click:

```text
SETUP_AND_RUN_WINDOWS.bat
```

The script deliberately stops at the first failed prerequisite. It:

1. creates `.venv`
2. installs backend dependencies
3. runs the offline integration self-test
4. trains the deficiency models from official NHANES data if the model bundle is missing
5. installs frontend dependencies
6. performs a production frontend build
7. launches FastAPI and Vite only after the checks pass

Then open:

- Frontend: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`

Keep both terminal windows open.

## Manual startup (verified working steps)

Backend — run in its own terminal, from the project root:

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python --version                      # confirm it prints 3.12.x
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python self_test.py
python -m module2_prediction.train_model   # only needed once — see status note below
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Server is up once you see `Application startup complete.` Confirm at `http://localhost:8000/docs` — you should see the Swagger UI listing all modules (User Profiling, Deficiency Prediction, Chemical Nutrition Engine, Recommendation Engine, etc.).

Frontend, in a **separate, new** terminal (don't reuse the one running uvicorn):

```powershell
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

> **Note on venv location:** this project's docs elsewhere may show the venv created one level up (`..\.venv`, i.e. in the project root). Creating it directly inside `backend\.venv` (as above) works exactly the same — just be consistent about which one you activate.

## ✅ Deficiency model — training status

As of the last run in this environment, the NHANES deficiency model **has already been trained successfully.** Output confirmed:

```
[train_model] iron: n=6362, positive=0.188, accuracy=0.755, balanced_accuracy=0.753
[train_model] vitamin_d: n=7182, positive=0.285, accuracy=0.625, balanced_accuracy=0.630
[train_model] calcium: n=5809, positive=0.009, accuracy=0.983, balanced_accuracy=0.496
[train_model] vitamin_b12: n=5380, positive=0.020, accuracy=0.956, balanced_accuracy=0.510
[train_model] protein: n=5813, positive=0.037, accuracy=0.850, balanced_accuracy=0.609
[train_model] Model bundle saved to backend\module2_prediction\model\deficiency_model.joblib
```

The saved bundle lives at:

```text
backend/module2_prediction/model/deficiency_model.joblib
```

**You do not need to re-run `python -m module2_prediction.train_model` again** unless you delete that file, want to retrain on refreshed NHANES data, or the file is missing after a fresh clone/zip extraction. `calcium` and `vitamin_b12` have low `balanced_accuracy` because those deficiencies are rare in the NHANES sample (under 4% positive) — this is expected, not a bug; see the "Important scope note" at the bottom.

## NHANES training

Normally the setup script performs this automatically. To retrain manually:

```powershell
cd backend
python -m module2_prediction.train_model
```

Or run `TRAIN_MODEL_WINDOWS.bat` from the project root.

The trainer validates that downloaded files are actual SAS XPT files rather than CDC error/HTML pages. On Windows, setup also retries failed Python downloads through `DOWNLOAD_NHANES_WINDOWS.ps1` using the current official CDC public-file URLs. If both automated methods are unavailable, the error names the exact official XPT file to place in:

```text
backend/module2_prediction/data/
```

The app does not generate replacement synthetic rows.

## Blood reports

Supported uploads:

- PDF, including scanned PDFs
- PNG/JPG/JPEG/WEBP
- TXT/CSV
- maximum 12 MB

Currently extracted biomarkers:

- ferritin / serum iron field
- serum calcium
- 25-OH vitamin D
- vitamin B12

Extraction can run before login via `/blood-report/extract`. Saving a report to history requires authentication via `/blood-report/upload`.

If a report does not contain one of the supported biomarkers, the API returns a clear 422 response rather than inventing a value.

## Doctor / specialist finder

Two user flows are available:

- **Search city/locality/pincode**: does not require browser GPS.
- **Use GPS**: requires browser geolocation permission. Phone browsers generally require HTTPS for geolocation unless running on localhost; use manual place search during plain-HTTP LAN testing.

The backend tries multiple Overpass endpoints and then Nominatim. If the external OSM services are unavailable, the UI shows the provider error rather than a static doctor list.

## USDA FoodData Central

Copy:

```text
backend/.env.example
```

to:

```text
backend/.env
```

For better request limits, set your own FoodData Central key:

```text
USDA_FDC_API_KEY=your_key_here
```

`DEMO_KEY` can be used for development, subject to USDA limits.

## Frontend API configuration

For local development, `frontend/.env` intentionally leaves `VITE_API_BASE` blank. The frontend automatically calls port 8000 on the same hostname. This also lets a phone on the same LAN use your computer hostname/IP instead of incorrectly calling `127.0.0.1` on the phone itself.

For a deployed frontend, set:

```text
VITE_API_BASE=https://your-backend.example.com
```

and configure the backend `ALLOWED_ORIGINS` accordingly.

## Verification

Offline/local integration checks are in:

```text
backend/self_test.py
```

They verify:

- FastAPI boot and required routes
- unauthenticated blood extraction
- registration/login
- persisted blood-report history
- full profile save/history round trip
- nutrition response contract
- trained Food Vision weights loading
- recommendation response wiring with live-source boundaries mocked
- Food Vision response wiring with USDA boundary mocked
- specialist finder route contract
- USDA route contract
- RAG route/citation contract
- prediction-model readiness status

External USDA, PubMed and OpenStreetMap availability is **not** mocked at runtime. Those features genuinely require network access.

## Packaging / re-zipping this project

If you zip this folder up to move or share it, **exclude these before zipping** — they're large and get regenerated automatically:

- `.venv` (or `backend/.venv`) — the Python virtual environment
- `frontend/node_modules` — npm packages
- any `__pycache__` folders

Keep everything else, including `backend/module2_prediction/model/deficiency_model.joblib` (the trained model) and `backend/food_vision/model_weights.pth` (pretrained Food Vision weights) — those are normal files, not reinstallable artifacts, and skipping them means retraining from scratch.

## Important scope note

AlteraVie is an educational/prototype health application. Model risk estimates are population-level screening outputs, food-image nutrition is an estimate based on the closest USDA text match, and blood-report extraction is a convenience parser. None of these should be treated as diagnosis, emergency triage, medication instruction, or a replacement for a clinician/dietitian.


## Zero-cost Android deployment

See `ANDROID_BUILD_NOTES.md` for the Android APK workflow and free-hosting caveats. The app requires a publicly reachable HTTPS backend for account, assessment, upload, nutrition, food vision, and other API-backed features. The included configuration is a starter only; neither hosting nor APK compilation is considered complete until the GitHub workflow and live API are verified.

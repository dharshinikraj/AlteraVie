# AlteraVie Android packaging

The existing React/Vite source and FastAPI backend feature code are intentionally unchanged. The Android wrapper uses Capacitor and packages the same production frontend into an Android WebView.

## Important deployment requirement

The mobile app cannot call a backend running at `localhost:8000` on the developer's computer: on a phone, `localhost` means the phone itself. Before building, deploy the existing FastAPI backend to a public HTTPS URL with persistent storage and configure its `ALLOWED_ORIGINS` to permit the Capacitor app origin (`https://localhost`) as well as any web frontend origins you use. Keep secrets on the backend; do not put API keys in `VITE_*` frontend variables.

The provided `BUILD_ANDROID.bat` accepts that backend URL and passes it to Vite at build time, so no source API code has to be changed:

```bat
BUILD_ANDROID.bat https://your-public-backend.example.com
```

The script installs the Capacitor packages, builds the frontend, generates/syncs the Android project, and runs `gradlew assembleDebug`. Requirements on the build computer: Node.js 20+, Android Studio with Android SDK/platform tools installed, and a working internet connection for first-time dependency downloads. The resulting debug APK path is printed by the script.

## Before public deployment

- Configure a free external PostgreSQL database with persistent storage; the local SQLite file in the ZIP is not suitable for a free host with ephemeral local storage. The database schema is created on startup, but existing local records are not automatically migrated into the hosted database.
- Configure backend CORS for `https://localhost` (Capacitor's Android origin) and the deployed web frontend origin(s).
- Configure all required server-side API keys as hosting environment variables.
- Test login/registration, history, file upload, camera/file selection, location permissions, live data, and every feature on a physical Android device.
- A debug APK is for testing. Google Play distribution normally uses a signed release Android App Bundle (`.aab`) and requires the developer's Play Console account.

No claim is made that the APK has been built or device-tested by this packaging source alone.


## Backend deployment starter files

- `backend/Dockerfile` builds the existing FastAPI backend into a container.
- `render.yaml` is configured for Render's free web-service plan and deliberately has no paid disk. Free instances have ephemeral local storage, so configure `DATABASE_URL` to an external free PostgreSQL database (for example, a Supabase Free project). The backend now accepts standard `postgres://` / `postgresql://` URLs through psycopg v3. This is a deployment starter, not a deployment that has already been executed or verified.
- Free services can sleep after inactivity, and third-party free-plan quotas/policies can change. The backend has ML/OCR dependencies; the selected host's memory/build limits must be verified during deployment. Do not upgrade or enable billing if maintaining zero cost is required.
- After deployment, copy the backend's public HTTPS URL and run `BUILD_ANDROID.bat https://YOUR-BACKEND-URL`. Do not use `localhost` as the API URL in the APK.
- Add any required API keys as private environment variables in the hosting dashboard. Do not commit `backend/.env` or put server-side secrets in `frontend/.env`.
- The current SQLite database is local application data; deploying the backend with a new persistent volume does not automatically migrate the existing database file. If you need existing records, migrate/restore them separately and securely.


## Automated cloud APK build

The repository includes `.github/workflows/android-apk.yml`. After the project is in a GitHub repository and the backend is deployed, open **Actions → Build AlteraVie Android APK → Run workflow**, enter the backend's public HTTPS URL, and download the `AlteraVie-Android-debug-apk` artifact from the completed run. This workflow builds a debug APK for testing; Play Store release signing is a separate step. The workflow has not been run from this archive, and it does not deploy the backend automatically.


## Zero-cost hosting notes

- A direct-install APK does not require Google Play publishing fees. The APK build workflow uses GitHub Actions; the source must be in a GitHub repository and the workflow must be run from that account.
- The Render blueprint uses `plan: free`, no persistent disk, and prompts for `DATABASE_URL` and `USDA_FDC_API_KEY`. Use a free PostgreSQL project and its connection URI for `DATABASE_URL`. Keep secrets out of the repository.
- Free services may sleep, have quota/availability limits, or change terms. The backend contains PyTorch, ONNX Runtime and OCR dependencies, so a successful free deployment is not guaranteed until the provider finishes building and starts the service. No payment or upgrade should be accepted.
- A free hosted database starts empty. Existing local SQLite records, if needed, require a separate secure migration.

"""Inference from models trained only on real CDC NHANES respondent records."""
import os
import joblib
import pandas as pd

from module2_prediction.nhanes_dataset import FEATURE_COLUMNS, TARGET_COLUMNS
from module2_prediction.train_model import MODEL_PATH, MODEL_VERSION
from module2_prediction.schemas import PredictionRequest, DeficiencyProbability, PredictionResponse

RISK_THRESHOLD_PERCENT = 50.0
GENDER_MAP = {"male": 0, "female": 1, "other": 0}
NUTRIENT_DISPLAY_NAMES = {
    "iron": "Iron",
    "vitamin_d": "Vitamin D",
    "calcium": "Calcium",
    "vitamin_b12": "Vitamin B12",
    "protein": "Protein",
}


class DeficiencyPredictor:
    def __init__(self):
        self._bundle = None

    def _valid_bundle(self, obj) -> bool:
        return (
            isinstance(obj, dict)
            and obj.get("version") == MODEL_VERSION
            and obj.get("feature_columns") == FEATURE_COLUMNS
            and set(obj.get("models", {}).keys()) == set(TARGET_COLUMNS)
        )

    def _ensure_model_loaded(self):
        if self._bundle is not None:
            return
        if os.path.exists(MODEL_PATH):
            try:
                obj = joblib.load(MODEL_PATH, mmap_mode="r")
                if self._valid_bundle(obj):
                    self._bundle = obj
                    return
            except Exception:
                pass

        raise RuntimeError(
            "A valid NHANES model bundle is not installed. Run "
            "`python -m module2_prediction.train_model` from the backend folder while online, "
            "or run SETUP_AND_RUN_WINDOWS.bat from the project root."
        )

    def _build_feature_row(self, req: PredictionRequest):
        bmi = req.weight_kg / ((req.height_cm / 100) ** 2)
        return pd.DataFrame(
            [{"age": req.age, "gender": GENDER_MAP.get(req.gender.lower(), 0), "bmi": bmi}],
            columns=FEATURE_COLUMNS,
        )

    def predict(self, req: PredictionRequest):
        self._ensure_model_loaded()
        X = self._build_feature_row(req)
        results = []

        for target in TARGET_COLUMNS:
            model = self._bundle["models"][target]
            classes = list(model.classes_)
            proba = model.predict_proba(X)[0]
            p = float(proba[classes.index(1)]) if 1 in classes else 0.0
            results.append(
                DeficiencyProbability(
                    nutrient=NUTRIENT_DISPLAY_NAMES[target],
                    probability_percent=round(p * 100, 1),
                )
            )

        results.sort(key=lambda x: x.probability_percent, reverse=True)
        return PredictionResponse(
            predictions=results,
            top_deficiencies=[x.nutrient for x in results if x.probability_percent >= RISK_THRESHOLD_PERCENT],
        )


predictor = DeficiencyPredictor()

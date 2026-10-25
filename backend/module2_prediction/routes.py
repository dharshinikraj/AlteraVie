from fastapi import APIRouter, HTTPException
import os
from module2_prediction.schemas import PredictionRequest, PredictionResponse
from module2_prediction.predictor import predictor
from module2_prediction.train_model import MODEL_PATH
router=APIRouter(prefix="/predict",tags=["Module 2 - Deficiency Prediction"])
@router.get("/status")
def prediction_status(): return {"model_ready": os.path.exists(MODEL_PATH), "model_path": MODEL_PATH}
@router.post("",response_model=PredictionResponse)
def predict_deficiencies(payload:PredictionRequest):
    try:return predictor.predict(payload)
    except RuntimeError as exc:raise HTTPException(status_code=503,detail=f"Prediction model unavailable: {exc}")
    except Exception as exc:raise HTTPException(status_code=500,detail=f"Prediction failed: {exc}")

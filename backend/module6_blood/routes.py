from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from datetime import datetime

from database.db import get_db
from module5_auth.routes import get_current_user
from module5_auth.models import User
from module6_blood.models import BloodReport
from module6_blood.schemas import BloodReportResponse, BloodReportManualInput
from module6_blood.parser import parse_report_bytes

router = APIRouter(prefix="/blood-report", tags=["Module 6 - Blood Reports Portal"])


def _validate_upload(file: UploadFile, data: bytes):
    import os
    if not data: raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(data) > 12 * 1024 * 1024: raise HTTPException(status_code=413, detail="Blood report is too large. Maximum size is 12 MB.")
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext and ext not in {".pdf",".png",".jpg",".jpeg",".webp",".txt",".csv"}:
        raise HTTPException(status_code=400, detail="Unsupported report type. Use PDF, PNG, JPG, WEBP, TXT, or CSV.")

def _extract_or_422(data: bytes, filename: str | None):
    biomarkers = parse_report_bytes(data, filename)
    if all(v is None for v in biomarkers.values()):
        raise HTTPException(status_code=422, detail="No supported biomarkers were found. Upload a legible report containing ferritin/iron, calcium, 25-OH vitamin D, or vitamin B12, or enter the values manually.")
    return biomarkers

@router.post("/extract")
async def extract_blood_report(file: UploadFile = File(...)):
    """Extract supported biomarkers without login and without persisting the file."""
    data = await file.read(); _validate_upload(file, data)
    biomarkers = _extract_or_422(data, file.filename)
    return {"filename": file.filename, **biomarkers}


@router.post("/upload", response_model=BloodReportResponse, status_code=status.HTTP_201_CREATED)
async def upload_blood_report(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file report, extract values, and save to user profile."""
    try:
        file_bytes = await file.read()
        _validate_upload(file, file_bytes)
        biomarkers = _extract_or_422(file_bytes, file.filename)

        db_report = BloodReport(
            user_id=current_user.id,
            filename=file.filename,
            iron_level=biomarkers.get("iron_level"),
            calcium_level=biomarkers.get("calcium_level"),
            vitamin_d_level=biomarkers.get("vitamin_d_level"),
            vitamin_b12_level=biomarkers.get("vitamin_b12_level")
        )
        
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and upload blood report: {exc}"
        )


@router.post("/manual", response_model=BloodReportResponse, status_code=status.HTTP_201_CREATED)
def record_manual_report(
    payload: BloodReportManualInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allow manual insertion of blood test levels."""
    db_report = BloodReport(
        user_id=current_user.id,
        filename="Manual Entry",
        iron_level=payload.iron_level,
        calcium_level=payload.calcium_level,
        vitamin_d_level=payload.vitamin_d_level,
        vitamin_b12_level=payload.vitamin_b12_level
    )
    try:
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save manual blood report: {exc}"
        )


@router.get("/history", response_model=list[BloodReportResponse])
def get_report_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve history of uploaded blood reports for the active user."""
    reports = db.query(BloodReport).filter(BloodReport.user_id == current_user.id).order_by(BloodReport.created_at.desc()).all()
    return reports

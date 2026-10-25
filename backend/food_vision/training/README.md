# Food Vision — Training Pipeline

This directory contains the two-script pipeline for preparing the dataset and fine-tuning the dish classifier.

---

## Prerequisites

Install all backend dependencies from the project root:
```bash
pip install -r backend/requirements.txt
pip install -r backend/requirements-foodvision-training.txt
```

All training commands must be run from the **`backend/`** directory:
```bash
cd nutrition-mvp/backend
```

---

## Step 1 — Prepare Data (`prepare_data.py`)

Downloads and cleans both Hugging Face datasets, resizes images to 256×256, removes duplicates via MD5 hashing, drops corrupt files, and writes a unified `food_vision/data/manifest.json`.

### Quick mode (default — CPU-safe, ~5–10 minutes)
Processes **50 train + 15 test images per class** (~1,625 images total):
```bash
python food_vision/training/prepare_data.py --quick
```

### Full mode (all available images, GPU recommended)
Downloads the full Indian Foods dataset (~4,770 images) and the filtered Food-101 subset (~10,000 images). Expect **20–60 minutes** depending on network speed:
```bash
python food_vision/training/prepare_data.py --full
```

**Output:**
- `food_vision/data/cleaned_images/train/<ClassName>/*.jpg`
- `food_vision/data/cleaned_images/test/<ClassName>/*.jpg`
- `food_vision/data/manifest.json`

---

## Step 2 — Train Classifier (`train_classifier.py`)

Fine-tunes a pretrained **MobileNetV3-Small** (ImageNet weights) backbone in two phases:

| Phase | What trains | LR | Epochs |
|-------|-------------|-----|--------|
| 1 | Classification head only (backbone frozen) | 1e-3 | 5 (2 in quick) |
| 2 | Full network fine-tuning | 1e-4 | up to 15 (3 in quick), early-stopped |

Early stopping fires when validation loss does not improve for **5 consecutive epochs**.

### Quick mode (default — smoke-test, CPU, ~5–20 minutes on quick data)
```bash
python food_vision/training/train_classifier.py --quick
```

### Full mode (GPU strongly recommended; expected runtime ~2–6 hours on CPU, ~20–40 min on GPU)
```bash
python food_vision/training/train_classifier.py --full
```

**Output:**
- `food_vision/model_weights.pth` — best checkpoint (lowest val loss)
- `food_vision/training/training_metrics.json` — per-class precision/recall/F1 + macro averages

---

## Per-class Metrics

After training completes, the console prints a full table and a JSON file is saved at `training/training_metrics.json`.

Example output structure:
```
Class                     Precision   Recall       F1   Support
-----------------------------------------------------------------
Biryani                      0.8700   0.8400   0.8547       15
Caesar Salad                 0.9000   0.9333   0.9163       15
Chole Bhature                0.8000   0.8000   0.8000       15
...
⚠️  Notably weak classes (F1 < 0.50):
   Jalebi                   F1=0.4200
   Pakora                   F1=0.4500

Macro averages — Precision: 0.7812  Recall: 0.7654  F1: 0.7731
```

> **Note on weak classes:** The Indian Foods dataset is scraped from Google Images and contains some near-duplicate or mislabelled images — particularly `Jalebi`, `Pakora`, and `Vada Pav` which share similar colour profiles. This is expected in quick mode with 50 images/class. Full training on the entire dataset typically raises F1 by 5–15 points for these classes. Any class with F1 < 0.50 is **explicitly flagged** in both the console output and `training_metrics.json["weak_classes"]`.

---

## Step 3 — Start the API

Once `model_weights.pth` is present, the API loads the trained classifier:
```bash
cd backend
uvicorn main:app --reload
```

The API will print:
```
Loading trained classifier weights from .../food_vision/model_weights.pth...
Successfully loaded trained classifier.
```

---

## Step 4 — Hit the Endpoints

### List supported dishes
```bash
curl http://localhost:8000/food-vision/dishes
```

### Upload a photo and get nutrients
```bash
curl -X POST "http://localhost:8000/food-vision/predict?portion_multiplier=1.0" \
  -H "accept: application/json" \
  -F "file=@/path/to/your/food_photo.jpg"
```

Or use the interactive Swagger UI at `http://localhost:8000/docs`.

**Response includes:**
- `predicted_dish` — e.g. `"Biryani"`
- `confidence` — e.g. `0.87`
- `total_nutrients` — `{calories, protein, fat, carbs, iron, calcium, vitamin_d, vitamin_b12, vitamin_c, fiber}`
- `ingredients_breakdown` — transparent per-ingredient calculation
- `disclaimer` — reminder that values are reference estimates, not measurements

---

## Approximate Runtimes (CPU / no GPU)

| Step | Quick mode | Full mode |
|------|-----------|-----------|
| `prepare_data.py` | ~5–10 min | ~30–90 min |
| `train_classifier.py` | ~5–20 min | ~2–6 hours |

A GPU (CUDA) reduces training time by **10–20×**. The code auto-detects CUDA and falls back to CPU.

---

## Class List (25 classes)

**Indian dishes (15):** Biryani, Chole Bhature, Dabeli, Dal, Dhokla, Dosa, Jalebi, Kathi Roll, Kofta, Naan, Pakora, Paneer (curry), Pani Puri, Pav Bhaji, Vada Pav

**Non-Indian dishes (10):** Caesar Salad, French Fries, Fried Rice, Hamburger, Ice Cream, Omelette, Pancakes, Pizza, Steak, Sushi

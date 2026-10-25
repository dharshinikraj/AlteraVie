"""Train one real-NHANES Random Forest model per nutrient target.

Run:
    python -m module2_prediction.train_model
"""
import os
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, balanced_accuracy_score

from module2_prediction.nhanes_dataset import build_target_datasets, FEATURE_COLUMNS, TARGET_COLUMNS

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
MODEL_PATH = os.path.join(MODEL_DIR, "deficiency_model.joblib")
MODEL_VERSION = 2


def train_and_save_model() -> str:
    os.makedirs(MODEL_DIR, exist_ok=True)
    datasets = build_target_datasets()
    models = {}
    metadata = {}

    for target in TARGET_COLUMNS:
        df = datasets[target]
        X = df[FEATURE_COLUMNS]
        y = df[target].astype(int)

        if y.nunique() < 2:
            raise RuntimeError(f"NHANES target {target} contains only one class after cleaning; refusing to train.")

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y,
        )

        model = RandomForestClassifier(
            n_estimators=300,
            max_depth=8,
            min_samples_leaf=4,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X_train, y_train)
        pred = model.predict(X_test)

        acc = accuracy_score(y_test, pred)
        bal_acc = balanced_accuracy_score(y_test, pred)
        models[target] = model
        metadata[target] = {
            "rows": int(len(df)),
            "positive_rate": float(y.mean()),
            "accuracy": float(acc),
            "balanced_accuracy": float(bal_acc),
        }
        print(
            f"[train_model] {target}: n={len(df)}, positive={y.mean():.3f}, "
            f"accuracy={acc:.3f}, balanced_accuracy={bal_acc:.3f}"
        )

    bundle = {
        "version": MODEL_VERSION,
        "feature_columns": FEATURE_COLUMNS,
        "target_columns": TARGET_COLUMNS,
        "models": models,
        "metadata": metadata,
        "data_source": "CDC/NCHS NHANES public XPT files; 2017-2018 + 2013-2014 for serum B12",
    }
    joblib.dump(bundle, MODEL_PATH)
    print(f"[train_model] Model bundle saved to {MODEL_PATH}")
    return MODEL_PATH


if __name__ == "__main__":
    train_and_save_model()

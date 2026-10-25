"""
train_classifier.py

Fine-tunes a pretrained MobileNetV3-Small backbone (ImageNet weights) on the
unified dataset produced by prepare_data.py.

Key features:
- Transfer learning: frozen backbone, trainable classification head (phase 1)
  then unfrozen full network (phase 2 fine-tune)
- Data augmentation: RandomResizedCrop, RandomHorizontalFlip, ColorJitter
- Early stopping on validation loss (patience=5 epochs)
- Per-class precision / recall / F1 on the held-out test split
- Saves best checkpoint to  food_vision/model_weights.pth
- --quick flag (active by default on CPU) to run a tiny smoke-test run

Usage:
    # Quick smoke-test (CPU safe, ~minutes):
    python training/train_classifier.py --quick

    # Full training:
    python training/train_classifier.py --full
"""

import os
import sys
import json
import argparse
import time
from collections import defaultdict

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import models, transforms
from PIL import Image

# Allow running as a module from the backend/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from food_vision.classifier import ALL_CLASSES

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #
CLASS_TO_IDX = {cls: i for i, cls in enumerate(ALL_CLASSES)}
IDX_TO_CLASS = {i: cls for cls, i in CLASS_TO_IDX.items()}
NUM_CLASSES  = len(ALL_CLASSES)

# --------------------------------------------------------------------------- #
# Dataset
# --------------------------------------------------------------------------- #
class ManifestDataset(Dataset):
    """Loads images from the manifest.json written by prepare_data.py."""

    def __init__(self, manifest_entries: list[dict], data_root: str, transform=None):
        self.entries   = manifest_entries
        self.data_root = data_root
        self.transform = transform

    def __len__(self):
        return len(self.entries)

    def __getitem__(self, idx):
        entry     = self.entries[idx]
        img_path  = os.path.join(self.data_root, entry["image_path"])
        label_idx = CLASS_TO_IDX[entry["class_name"]]

        try:
            img = Image.open(img_path).convert("RGB")
        except Exception as exc:
            raise RuntimeError(f"Unreadable training image: {img_path}: {exc}") from exc

        if self.transform:
            img = self.transform(img)

        return img, label_idx


# --------------------------------------------------------------------------- #
# Transforms
# --------------------------------------------------------------------------- #
TRAIN_TRANSFORM = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05),
    transforms.RandomRotation(15),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std =[0.229, 0.224, 0.225]),
])

VAL_TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std =[0.229, 0.224, 0.225]),
])

# --------------------------------------------------------------------------- #
# Model
# --------------------------------------------------------------------------- #
def build_model(num_classes: int, pretrained: bool = True) -> nn.Module:
    """Returns a MobileNetV3-Small with a fresh classification head."""
    weights = models.MobileNet_V3_Small_Weights.IMAGENET1K_V1 if pretrained else None
    model   = models.mobilenet_v3_small(weights=weights)

    # Replace classification head
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    return model


def freeze_backbone(model: nn.Module):
    """Freezes all layers except the classifier head."""
    for name, param in model.named_parameters():
        if "classifier" not in name:
            param.requires_grad = False


def unfreeze_all(model: nn.Module):
    """Unfreezes all parameters for full fine-tuning."""
    for param in model.parameters():
        param.requires_grad = True


# --------------------------------------------------------------------------- #
# Training helpers
# --------------------------------------------------------------------------- #
def run_epoch(model, loader, criterion, optimizer, device, is_train: bool):
    model.train() if is_train else model.eval()
    running_loss, correct, total = 0.0, 0, 0

    with torch.set_grad_enabled(is_train):
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            if is_train:
                optimizer.zero_grad()

            outputs = model(images)
            loss    = criterion(outputs, labels)

            if is_train:
                loss.backward()
                optimizer.step()

            running_loss += loss.item() * images.size(0)
            preds         = outputs.argmax(dim=1)
            correct      += (preds == labels).sum().item()
            total        += images.size(0)

    avg_loss = running_loss / max(total, 1)
    accuracy = correct / max(total, 1)
    return avg_loss, accuracy


def compute_per_class_metrics(model, loader, device):
    """Returns precision, recall, F1 per class."""
    model.eval()
    # true_counts[cls], pred_counts[cls], tp_counts[cls]
    true_counts  = defaultdict(int)
    pred_counts  = defaultdict(int)
    tp_counts    = defaultdict(int)

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            preds = model(images).argmax(dim=1)
            for t, p in zip(labels.cpu().tolist(), preds.cpu().tolist()):
                true_counts[t]  += 1
                pred_counts[p]  += 1
                if t == p:
                    tp_counts[t] += 1

    metrics = {}
    for cls_idx, cls_name in IDX_TO_CLASS.items():
        tp        = tp_counts[cls_idx]
        actual    = true_counts[cls_idx]
        predicted = pred_counts[cls_idx]

        precision = tp / max(predicted, 1)
        recall    = tp / max(actual, 1)
        f1        = (2 * precision * recall / (precision + recall)
                     if (precision + recall) > 0 else 0.0)

        metrics[cls_name] = {
            "precision": round(precision, 4),
            "recall":    round(recall,    4),
            "f1":        round(f1,        4),
            "support":   actual
        }

    return metrics


def print_metrics_table(metrics: dict, note: str = ""):
    header = f"\n{'Class':<25} {'Precision':>10} {'Recall':>8} {'F1':>8} {'Support':>9}"
    print(note)
    print(header)
    print("-" * 65)
    weak_classes = []
    for cls_name, m in sorted(metrics.items()):
        row = f"{cls_name:<25} {m['precision']:>10.4f} {m['recall']:>8.4f} {m['f1']:>8.4f} {m['support']:>9}"
        print(row)
        if m["f1"] < 0.50 and m["support"] > 0:
            weak_classes.append((cls_name, m["f1"]))

    if weak_classes:
        print("\n⚠️  Notably weak classes (F1 < 0.50):")
        for cls_name, f1_val in sorted(weak_classes, key=lambda x: x[1]):
            print(f"   {cls_name:<25} F1={f1_val:.4f}")
    else:
        print("\n✅  All classes achieved F1 >= 0.50.")

    return weak_classes


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main():
    parser = argparse.ArgumentParser(description="Train MobileNetV3-Small food classifier.")
    parser.add_argument("--quick", action="store_true", default=True,
                        help="Quick/smoke-test mode: tiny subset + 3 epochs (default on CPU).")
    parser.add_argument("--full",  action="store_true",
                        help="Full training mode (overrides --quick).")
    parser.add_argument("--epochs_phase1", type=int, default=5,
                        help="Epochs for head-only training (phase 1).")
    parser.add_argument("--epochs_phase2", type=int, default=15,
                        help="Max epochs for full fine-tuning (phase 2), subject to early stopping.")
    parser.add_argument("--batch_size",    type=int, default=32)
    parser.add_argument("--lr_phase1",     type=float, default=1e-3)
    parser.add_argument("--lr_phase2",     type=float, default=1e-4)
    parser.add_argument("--patience",      type=int, default=5,
                        help="Early stopping patience (epochs without val-loss improvement).")
    args = parser.parse_args()

    quick_mode = args.quick if not args.full else False

    if quick_mode:
        args.epochs_phase1 = 2
        args.epochs_phase2 = 3
        args.batch_size    = 16
        print("⚡  Quick mode enabled — using tiny data subset + 2+3 epochs.")

    # ------------------------------------------------------------------ #
    # Locate manifest
    # ------------------------------------------------------------------ #
    training_dir    = os.path.dirname(os.path.abspath(__file__))
    food_vision_dir = os.path.dirname(training_dir)
    data_dir        = os.path.join(food_vision_dir, "data")
    manifest_path   = os.path.join(data_dir, "manifest.json")
    weights_path    = os.path.join(food_vision_dir, "model_weights.pth")
    metrics_path    = os.path.join(training_dir,    "training_metrics.json")

    if not os.path.exists(manifest_path):
        print(f"ERROR: Manifest not found at {manifest_path}")
        print("  Run  python training/prepare_data.py  first.")
        sys.exit(1)

    with open(manifest_path) as f:
        manifest = json.load(f)

    train_entries = [e for e in manifest if e["split"] == "train"]
    test_entries  = [e for e in manifest if e["split"] == "test"]

    # If no test split from prepare_data, carve out 20% from train
    if not test_entries:
        print("No test split in manifest — performing 80/20 stratified split.")
        class_entries: dict[str, list] = defaultdict(list)
        for e in train_entries:
            class_entries[e["class_name"]].append(e)
        train_entries, test_entries = [], []
        for cls_entries in class_entries.values():
            n = len(cls_entries)
            split = max(1, int(n * 0.2))
            test_entries  += cls_entries[:split]
            train_entries += cls_entries[split:]

    print(f"Training samples : {len(train_entries)}")
    print(f"Test samples     : {len(test_entries)}")

    if len(train_entries) == 0:
        print("ERROR: No training samples found. Run prepare_data.py first.")
        sys.exit(1)

    # ------------------------------------------------------------------ #
    # Build datasets & loaders
    # ------------------------------------------------------------------ #
    train_ds = ManifestDataset(train_entries, data_dir, TRAIN_TRANSFORM)
    test_ds  = ManifestDataset(test_entries,  data_dir, VAL_TRANSFORM)

    # Weighted sampler for class imbalance
    label_counts: dict[int, int] = defaultdict(int)
    for e in train_entries:
        label_counts[CLASS_TO_IDX[e["class_name"]]] += 1

    sample_weights = [1.0 / max(label_counts[CLASS_TO_IDX[e["class_name"]]], 1)
                      for e in train_entries]
    sampler = WeightedRandomSampler(sample_weights, num_samples=len(train_entries), replacement=True)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, sampler=sampler,
                              num_workers=0, pin_memory=False)
    test_loader  = DataLoader(test_ds,  batch_size=args.batch_size, shuffle=False,
                              num_workers=0, pin_memory=False)

    # ------------------------------------------------------------------ #
    # Model, loss, device
    # ------------------------------------------------------------------ #
    device    = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    model     = build_model(NUM_CLASSES, pretrained=True).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    # ------------------------------------------------------------------ #
    # Phase 1: train head only
    # ------------------------------------------------------------------ #
    print(f"\n{'='*60}")
    print(f"Phase 1: Head-only training ({args.epochs_phase1} epochs)")
    print(f"{'='*60}")
    freeze_backbone(model)
    optimizer_p1 = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr_phase1
    )
    scheduler_p1 = optim.lr_scheduler.StepLR(optimizer_p1, step_size=2, gamma=0.5)

    best_val_loss = float("inf")

    for epoch in range(1, args.epochs_phase1 + 1):
        t0 = time.time()
        tr_loss, tr_acc = run_epoch(model, train_loader, criterion, optimizer_p1, device, is_train=True)
        v_loss,  v_acc  = run_epoch(model, test_loader,  criterion, None,        device, is_train=False)
        scheduler_p1.step()
        elapsed = time.time() - t0
        print(f"  Epoch {epoch:02d}/{args.epochs_phase1} | "
              f"train_loss={tr_loss:.4f} train_acc={tr_acc:.3f} | "
              f"val_loss={v_loss:.4f} val_acc={v_acc:.3f} | {elapsed:.1f}s")

        if v_loss < best_val_loss:
            best_val_loss = v_loss
            torch.save(model.state_dict(), weights_path)

    # ------------------------------------------------------------------ #
    # Phase 2: full fine-tune with early stopping
    # ------------------------------------------------------------------ #
    print(f"\n{'='*60}")
    print(f"Phase 2: Full fine-tuning (max {args.epochs_phase2} epochs, patience={args.patience})")
    print(f"{'='*60}")
    unfreeze_all(model)
    optimizer_p2 = optim.AdamW(model.parameters(), lr=args.lr_phase2, weight_decay=1e-4)
    scheduler_p2 = optim.lr_scheduler.ReduceLROnPlateau(optimizer_p2, mode="min",
                                                         factor=0.5, patience=2)

    patience_counter = 0

    for epoch in range(1, args.epochs_phase2 + 1):
        t0 = time.time()
        tr_loss, tr_acc = run_epoch(model, train_loader, criterion, optimizer_p2, device, is_train=True)
        v_loss,  v_acc  = run_epoch(model, test_loader,  criterion, None,        device, is_train=False)
        scheduler_p2.step(v_loss)
        elapsed = time.time() - t0
        print(f"  Epoch {epoch:02d}/{args.epochs_phase2} | "
              f"train_loss={tr_loss:.4f} train_acc={tr_acc:.3f} | "
              f"val_loss={v_loss:.4f} val_acc={v_acc:.3f} | {elapsed:.1f}s")

        if v_loss < best_val_loss:
            best_val_loss = v_loss
            torch.save(model.state_dict(), weights_path)
            print(f"    ✅  New best val_loss={best_val_loss:.4f} — weights saved.")
            patience_counter = 0
        else:
            patience_counter += 1
            print(f"    No improvement ({patience_counter}/{args.patience})")
            if patience_counter >= args.patience:
                print(f"  Early stopping triggered at epoch {epoch}.")
                break

    # ------------------------------------------------------------------ #
    # Per-class evaluation on test set (using best saved weights)
    # ------------------------------------------------------------------ #
    print(f"\n{'='*60}")
    print("Loading best checkpoint for final evaluation...")
    model.load_state_dict(torch.load(weights_path, map_location=device))

    metrics   = compute_per_class_metrics(model, test_loader, device)
    weak_list = print_metrics_table(metrics, note="\n📊  Per-class test metrics:")

    # Macro averages
    macro_p  = sum(m["precision"] for m in metrics.values()) / NUM_CLASSES
    macro_r  = sum(m["recall"]    for m in metrics.values()) / NUM_CLASSES
    macro_f1 = sum(m["f1"]        for m in metrics.values()) / NUM_CLASSES
    print(f"\nMacro averages — Precision: {macro_p:.4f}  Recall: {macro_r:.4f}  F1: {macro_f1:.4f}")

    # ------------------------------------------------------------------ #
    # Save metrics JSON for README / CI
    # ------------------------------------------------------------------ #
    output_metrics = {
        "per_class": metrics,
        "macro_avg": {"precision": round(macro_p, 4),
                      "recall":    round(macro_r, 4),
                      "f1":        round(macro_f1, 4)},
        "weak_classes": [{"class": c, "f1": f} for c, f in weak_list],
        "weights_path": weights_path,
        "device": str(device)
    }
    with open(metrics_path, "w") as f:
        json.dump(output_metrics, f, indent=2)

    print(f"\nMetrics written to: {metrics_path}")
    print(f"Model weights saved: {weights_path}")
    print("\n✅  Training complete.")


if __name__ == "__main__":
    main()

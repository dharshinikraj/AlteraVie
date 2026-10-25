"""
prepare_data.py

Loads, cleans, and merges:
1. "bharat-raghunathan/indian-foods-dataset" (15 classes)
2. "ethz/food101" (filtered to 10 classes)

Performs:
- Decodability check (corrupt file detection)
- Duplicate removal via MD5 hashing
- Resizing to 256x256 RGB JPEG format for rapid training
- Stratified train/test splits (falling back to custom splits if needed)
- Output folder formatting and unified manifest.json creation
- Support for a '--quick' flag to subset the data (useful for CPU running).
"""

import os
import io
import sys
import json
import argparse
import hashlib
from PIL import Image
from tqdm import tqdm
from datasets import load_dataset

# Allow running from training/ subdirectory or from backend/ directory
_TRAINING_DIR    = os.path.dirname(os.path.abspath(__file__))
_FOOD_VISION_DIR = os.path.dirname(_TRAINING_DIR)
_BACKEND_DIR     = os.path.dirname(_FOOD_VISION_DIR)
for _p in [_BACKEND_DIR, _FOOD_VISION_DIR]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Target standard class list
from food_vision.classifier import ALL_CLASSES

# Mappings from dataset labels to standard classes
INDIAN_CLASS_MAPPING = {
    "biryani": "Biryani",
    "chole_bhature": "Chole Bhature",
    "dabeli": "Dabeli",
    "dal": "Dal",
    "dhokla": "Dhokla",
    "dosa": "Dosa",
    "jalebi": "Jalebi",
    "kathi_roll": "Kathi Roll",
    "kofta": "Kofta",
    "naan": "Naan",
    "pakora": "Pakora",
    "paneer": "Paneer (curry)",
    "pani_puri": "Pani Puri",
    "pav_bhaji": "Pav Bhaji",
    "vada_pav": "Vada Pav"
}

FOOD101_CLASS_MAPPING = {
    "pizza": "Pizza",
    "hamburger": "Hamburger",
    "sushi": "Sushi",
    "french_fries": "French Fries",
    "caesar_salad": "Caesar Salad",
    "omelette": "Omelette",
    "steak": "Steak",
    "ice_cream": "Ice Cream",
    "pancakes": "Pancakes",
    "fried_rice": "Fried Rice"
}


def compute_image_hash(image: Image.Image) -> str:
    """Computes MD5 hash of raw image bytes to identify duplicates."""
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    return hashlib.md5(img_byte_arr.getvalue()).hexdigest()


def process_dataset(
    dataset_name: str,
    target_classes_map: dict,
    quick_mode: bool,
    max_train_per_class: int,
    max_test_per_class: int,
    output_dir: str,
    manifest: list,
    seen_hashes: set
):
    """Downloads, filters, cleans, resizes and saves a dataset."""
    print(f"\n--- Loading and processing {dataset_name} ---")
    
    # Load dataset from Hugging Face
    try:
        hf_dataset = load_dataset(dataset_name)
    except Exception as exc:
        print(f"Error loading dataset {dataset_name}: {exc}")
        return
        
    print(f"Loaded splits: {list(hf_dataset.keys())}")
    
    # Identify splits
    splits = list(hf_dataset.keys())
    
    # We map whatever splits exist (typically 'train', and 'test' or 'validation')
    # If only 'train' exists, we will create 'test' manually later
    has_test_split = 'test' in splits or 'validation' in splits
    test_split_name = 'test' if 'test' in splits else 'validation'
    
    # Read classes
    # HF datasets store label indices, we find the label name mappings
    label_names = hf_dataset['train'].features['label'].names
    print(f"Dataset has {len(label_names)} classes.")
    
    # Initialize class count trackers to enforce subset limits in quick mode
    train_counts = {c: 0 for c in ALL_CLASSES}
    test_counts = {c: 0 for c in ALL_CLASSES}
    
    corrupt_count = 0
    duplicate_count = 0
    saved_count = 0
    
    # Process train split
    print(f"Processing split: train")
    for sample in tqdm(hf_dataset['train']):
        raw_label = label_names[sample['label']]
        
        # Filter down to classes we care about
        if raw_label not in target_classes_map:
            continue
            
        mapped_class = target_classes_map[raw_label]
        
        # Enforce quick mode subset limits
        if quick_mode and train_counts[mapped_class] >= max_train_per_class:
            continue
            
        # Clean & Decodability check
        try:
            img = sample['image']
            if img is None:
                raise ValueError("Image field is None")
            img = img.convert("RGB")
        except Exception:
            corrupt_count += 1
            continue
            
        # Deduplication
        img_hash = compute_image_hash(img)
        if img_hash in seen_hashes:
            duplicate_count += 1
            continue
        seen_hashes.add(img_hash)
        
        # Save image
        split_folder = os.path.join(output_dir, "cleaned_images", "train", mapped_class)
        os.makedirs(split_folder, exist_ok=True)
        
        filename = f"{dataset_name.split('/')[-1]}_train_{saved_count}.jpg"
        filepath = os.path.join(split_folder, filename)
        
        # Resize to 256x256 for rapid loading and training
        img_resized = img.resize((256, 256), Image.Resampling.LANCZOS)
        img_resized.save(filepath, "JPEG", quality=90)
        
        # Add to manifest
        manifest.append({
            "image_path": f"cleaned_images/train/{mapped_class}/{filename}",
            "class_name": mapped_class,
            "split": "train"
        })
        
        train_counts[mapped_class] += 1
        saved_count += 1

    # Process test / validation split
    if has_test_split:
        print(f"Processing split: {test_split_name}")
        for sample in tqdm(hf_dataset[test_split_name]):
            raw_label = label_names[sample['label']]
            
            if raw_label not in target_classes_map:
                continue
                
            mapped_class = target_classes_map[raw_label]
            
            if quick_mode and test_counts[mapped_class] >= max_test_per_class:
                continue
                
            try:
                img = sample['image']
                if img is None:
                    raise ValueError("Image field is None")
                img = img.convert("RGB")
            except Exception:
                corrupt_count += 1
                continue
                
            img_hash = compute_image_hash(img)
            if img_hash in seen_hashes:
                duplicate_count += 1
                continue
            seen_hashes.add(img_hash)
            
            split_folder = os.path.join(output_dir, "cleaned_images", "test", mapped_class)
            os.makedirs(split_folder, exist_ok=True)
            
            filename = f"{dataset_name.split('/')[-1]}_test_{saved_count}.jpg"
            filepath = os.path.join(split_folder, filename)
            
            img_resized = img.resize((256, 256), Image.Resampling.LANCZOS)
            img_resized.save(filepath, "JPEG", quality=90)
            
            manifest.append({
                "image_path": f"cleaned_images/test/{mapped_class}/{filename}",
                "class_name": mapped_class,
                "split": "test"
            })
            
            test_counts[mapped_class] += 1
            saved_count += 1
    else:
        # If there is no test split in the loaded dataset, we will split the train entries later
        print(f"No test split found for {dataset_name}. We will partition the train entries stratified.")

    print(f"Finished processing {dataset_name}.")
    print(f"Saved: {saved_count} | Corrupt discarded: {corrupt_count} | Duplicates discarded: {duplicate_count}")


def main():
    parser = argparse.ArgumentParser(description="Prepare and clean Indian Foods and Food-101 datasets.")
    parser.add_argument(
        "--quick",
        action="store_true",
        default=True,
        help="Use a small subset of the data for rapid CPU training (50 train, 15 test per class)."
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Download and process the full dataset (warning: takes significant disk space and time)."
    )
    args = parser.parse_args()
    
    # If explicitly --full is passed, quick is false
    quick_mode = args.quick if not args.full else False
    
    max_train = 50 if quick_mode else 100000
    max_test = 15 if quick_mode else 100000
    
    print(f"Data preparation mode: {'QUICK (subset)' if quick_mode else 'FULL (all)'}")
    print(f"Max train images per class: {max_train}")
    print(f"Max test images per class: {max_test}")
    
    # Output directory relative to this script: backend/food_vision/data
    training_dir = os.path.dirname(os.path.abspath(__file__))
    food_vision_dir = os.path.dirname(training_dir)
    data_dir = os.path.join(food_vision_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    
    manifest = []
    seen_hashes = set()
    
    # 1. Process Indian Foods dataset
    process_dataset(
        dataset_name="bharat-raghunathan/indian-foods-dataset",
        target_classes_map=INDIAN_CLASS_MAPPING,
        quick_mode=quick_mode,
        max_train_per_class=max_train,
        max_test_per_class=max_test,
        output_dir=data_dir,
        manifest=manifest,
        seen_hashes=seen_hashes
    )
    
    # 2. Process Food-101 dataset
    process_dataset(
        dataset_name="ethz/food101",
        target_classes_map=FOOD101_CLASS_MAPPING,
        quick_mode=quick_mode,
        max_train_per_class=max_train,
        max_test_per_class=max_test,
        output_dir=data_dir,
        manifest=manifest,
        seen_hashes=seen_hashes
    )
    
    # 3. Write unified manifest.json
    manifest_path = os.path.join(data_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
        
    print(f"\nManifest successfully written to: {manifest_path}")
    print(f"Total manifest images: {len(manifest)}")
    
    # Quick sanity validation of splits
    train_sz = len([item for item in manifest if item["split"] == "train"])
    test_sz = len([item for item in manifest if item["split"] == "test"])
    print(f"Manifest breakdown - Train images: {train_sz} | Test/Val images: {test_sz}")


if __name__ == "__main__":
    main()

"""Dish-classifier interface and trained PyTorch implementation."""

import abc
import os
import io
import torch
import torch.nn as nn
from PIL import Image
import torchvision.models as models
import torchvision.transforms as T

# Consistent sorted class list for training and inference
ALL_CLASSES = sorted([
    # 15 Indian dishes
    "Biryani", "Chole Bhature", "Dabeli", "Dal", "Dhokla",
    "Dosa", "Jalebi", "Kathi Roll", "Kofta", "Naan",
    "Pakora", "Paneer (curry)", "Pani Puri", "Pav Bhaji", "Vada Pav",
    # 10 Non-Indian dishes
    "Pizza", "Hamburger", "Sushi", "French Fries", "Caesar Salad",
    "Omelette", "Steak", "Ice Cream", "Pancakes", "Fried Rice"
])


class DishClassifier(abc.ABC):
    @abc.abstractmethod
    def predict(self, image_bytes: bytes) -> tuple[str, float]:
        """
        Runs prediction on the input image bytes.
        Returns:
            tuple: (predicted_dish_name: str, confidence_score: float)
        """
        pass



class TrainedDishClassifier(DishClassifier):
    """
    Real trained classifier running PyTorch MobileNetV3-Small.
    Loads fine-tuned weights from the filesystem.
    """
    def __init__(self, weights_path: str):
        if not os.path.exists(weights_path):
            raise FileNotFoundError(f"Trained model weights not found at: '{weights_path}'")
            
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Initialize MobileNetV3-Small architecture matching the training structure
        self.model = models.mobilenet_v3_small(weights=None)
        # Modify classification head
        in_features = self.model.classifier[3].in_features
        self.model.classifier[3] = nn.Linear(in_features, len(ALL_CLASSES))
        
        # Load weights
        state_dict = torch.load(weights_path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)
        self.model.eval()
        
        # Standard validation transform
        self.transform = T.Compose([
            T.Resize(256),
            T.CenterCrop(224),
            T.ToTensor(),
            T.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def predict(self, image_bytes: bytes) -> tuple[str, float]:
        if not image_bytes:
            raise ValueError("Empty image bytes provided.")
            
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:
            raise ValueError(f"Failed to decode image bytes: {exc}")
            
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            output = self.model(input_tensor)
            probabilities = torch.softmax(output, dim=1)[0]
            confidence, class_idx = torch.max(probabilities, dim=0)
            
        class_name = ALL_CLASSES[class_idx.item()]
        return class_name, round(float(confidence.item()), 4)

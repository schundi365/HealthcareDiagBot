import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification, TrainingArguments, Trainer
from datasets import load_dataset
import logging

# Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Xray-Finetune")

DATASET_ID = "BahaaEldin0/NIH-Chest-Xray-14"
MODEL_ID = "google/vit-base-patch16-224-in21k" # Base Vision Transformer to fine-tune
OUTPUT_DIR = "./checkpoints/xray-finetuned"

def train():
    logger.info(f"Loading Dataset: {DATASET_ID}")
    # Note: verify dataset structure first (features usually 'image' and 'label')
    dataset = load_dataset(DATASET_ID, split="train[:100]") # Demo subset
    
    # Preprocessing
    image_processor = AutoImageProcessor.from_pretrained(MODEL_ID)
    
    def transforms(examples):
        examples["pixel_values"] = [
            image_processor(img.convert("RGB"), return_tensors="pt").pixel_values[0] 
            for img in examples["image"]
        ]
        return examples

    logger.info("Preprocessing images...")
    processed_dataset = dataset.with_transform(transforms)

    # Model
    model = AutoModelForImageClassification.from_pretrained(
        MODEL_ID,
        num_labels=14, # 14 classes in NIH Chest X-ray
        problem_type="multi_label_classification"
    )

    # Args
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        remove_unused_columns=False,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        learning_rate=5e-5,
        per_device_train_batch_size=8,
        num_train_epochs=3,
        fp16=True,
    )
    
    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=processed_dataset,
        tokenizer=image_processor,
    )

    logger.info("Starting Fine-tuning...")
    # trainer.train()
    logger.info("Fine-tuning finished.")

if __name__ == "__main__":
    train()

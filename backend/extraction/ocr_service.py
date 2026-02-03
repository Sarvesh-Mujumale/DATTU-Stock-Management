"""
OCR Service Module
==================
Wrapper around PaddleOCR to handle text extraction from images.
Converts PDF pages to images, preprocesses them, and extracts structured data.
"""

import os
# CRITICAL: Fix for PaddlePaddle on Windows (must be set BEFORE import paddle)
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_onednn"] = "0"
# Also disable GPU just in case to force pure CPU/Python mode
os.environ["CUDA_VISIBLE_DEVICES"] = "-1" 

import io
import base64
import fitz  # PyMuPDF
import numpy as np
import cv2  # OpenCV
# from paddleocr import PaddleOCR  # DISABLED: Causes crash on Render free tier (missing libgl1)
from typing import List, Dict, Optional

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from preprocessing.image_processor import ImagePreprocessor
from groq import Groq

class OCRService:
    _instance = None
    _groq_client = None

    def __new__(cls):
        """Singleton pattern to avoid reloading model"""
        if cls._instance is None:
            cls._instance = super(OCRService, cls).__new__(cls)
            
            # Initialize Groq for Vision
            try:
                api_key = os.getenv("GROQ_API_KEY")
                if api_key:
                    cls._groq_client = Groq(api_key=api_key)
                    print("[OCR] Groq Vision Client initialized.")
                else:
                    print("[OCR] GROQ_API_KEY not found. Vision AI disabled.")
            except Exception as e:
                print(f"[OCR] Failed to init Groq: {e}")

            print("[OCR] PaddleOCR Disabled (Using pure Vision AI for stability).")
                
        return cls._instance

    def pdf_to_images(self, pdf_bytes: bytes) -> List[np.ndarray]:
        """Convert PDF bytes to list of OpenCV images"""
        images = []
        try:
            with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                for page in doc:
                    pix = page.get_pixmap(dpi=300)  # High DPI for better OCR
                    img_data = pix.tobytes("png")
                    nparr = np.frombuffer(img_data, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    images.append(img)
        except Exception as e:
            print(f"[OCR] PDF conversion failed: {e}")
        return images

    def extract_text(self, file_bytes: bytes, file_type: str = "pdf") -> str:
        """
        Main entry point. Automatically converts PDF to images if needed.
        Uses Groq Vision AI to extract text (God Tier Accuracy).
        """
        images = []
        
        if file_type == "pdf":
            images = self.pdf_to_images(file_bytes)
        else:
            # Assume image bytes (jpg/png)
            try:
                img = ImagePreprocessor.load_image_from_bytes(file_bytes)
                if img is not None:
                    images = [img]
            except Exception as e:
                print(f"[OCR] Failed to load image: {e}")

        full_text = []

        for i, img in enumerate(images):
            # 1. Preprocess (Optional for Vision AI, but good for standardization)
            try:
                processed_img = ImagePreprocessor.preprocess_pipeline(cv2.imencode('.jpg', img)[1].tobytes())
                if processed_img is None or processed_img.size == 0:
                     processed_img = img
            except:
                processed_img = img
            
            # 2. Use Vision AI (Groq) - The "God Mode"
            print(f"[OCR] Processing page {i+1} with Groq Vision AI...")
            page_text = self._extract_text_with_ai(img) # Send ORIGINAL image (color is better for Vision AI)
            
            full_text.append(page_text)

        return "\n\n".join(full_text)

    def _extract_text_with_ai(self, image: np.ndarray) -> str:
        """
        Uses Groq Vision (Llama 3.2 Vision) to transcribe text from image.
        """
        if not self._groq_client:
            print("[OCR] CRITICAL: Groq client not initialized. Check GROQ_API_KEY.")
            return ""
            
        try:
            # Resize image if too large (to avoid timeouts/limits)
            # Max dimension 2000px is enough for strict reading
            h, w = image.shape[:2]
            max_dim = 2000
            if h > max_dim or w > max_dim:
                scale = max_dim / max(h, w)
                new_w, new_h = int(w * scale), int(h * scale)
                image = cv2.resize(image, (new_w, new_h))
                print(f"[OCR] Resized image to {new_w}x{new_h} for Vision AI")

            # Convert numpy image to base64
            _, buffer = cv2.imencode('.jpg', image, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
            base64_image = base64.b64encode(buffer).decode('utf-8')
            
            # Helper to estimate tokens (rough)
            # Llama Vision uses tokens based on resolution/patches.
            
            chat_completion = self._groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Read the text in this invoice image. Output ONLY the raw text content verbatim. Preserve the layout structure (tables, columns) as much as possible using spacing. Do not add markdown blocks or commentary."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            },
                        ],
                    }
                ],
                model="llama-3.2-11b-vision-preview",
                temperature=0.1,
                max_tokens=6000 # Allow long response for full page
            )
            text = chat_completion.choices[0].message.content
            print(f"[OCR] Vision AI Success! Extracted {len(text)} chars.")
            return text
            
        except Exception as e:
            print(f"[OCR] Vision AI failed: {e}")
            return ""

    def extract_structured(self, image: np.ndarray) -> List[Dict]:
        """
        Legacy method kept for compatibility.
        """
        return []

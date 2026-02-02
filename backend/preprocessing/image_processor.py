"""
Image Preprocessing Module
===========================
Provides tools to clean, deskew, and enhance images before OCR interaction.
Uses OpenCV for computer vision tasks.
"""

import cv2
import numpy as np
import io
from PIL import Image

class ImagePreprocessor:
    @staticmethod
    def load_image_from_bytes(image_bytes: bytes) -> np.ndarray:
        """Convert bytes to OpenCV format"""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img

    @staticmethod
    def deskew(image: np.ndarray) -> np.ndarray:
        """
        Corrects image skew (rotation) using text orientation.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.bitwise_not(gray)
        coords = np.column_stack(np.where(gray > 0))
        angle = cv2.minAreaRect(coords)[-1]

        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        
        return rotated

    @staticmethod
    def auto_crop(image: np.ndarray) -> np.ndarray:
        """
        Detects document edges and crops the background.
        If no document found, returns original image.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(blurred, 75, 200)

        # Find contours
        contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return image

        # Sort contours by area, keeping largest
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:1]
        c = contours[0]
        
        # Get Bounding Box
        x, y, w, h = cv2.boundingRect(c)
        
        # Heuristic: If detecting small noise, ignore
        if w < image.shape[1] * 0.5 or h < image.shape[0] * 0.5:
            return image
            
        cropped = image[y:y+h, x:x+w]
        return cropped

    @staticmethod
    def enhance_contrast(image: np.ndarray) -> np.ndarray:
        """
        Applies CLAHE (Adaptive Histogram Equalization) to handle uneven lighting/shadows.
        Also binarizes at the end for crisp text.
        """
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        # Apply CLAHE to L-channel
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)

        # Merge back
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        
        # Grayscale and Binarize
        gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
        # Otsu's thresholding
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Convert back to BGR for compatibility with OCR engines
        binary_bgr = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
        
        return binary_bgr

    @staticmethod
    def preprocess_pipeline(image_bytes: bytes) -> np.ndarray:
        """Runs the full cleanup pipeline"""
        img = ImagePreprocessor.load_image_from_bytes(image_bytes)
        
        try:
            # 1. Deskew
            img = ImagePreprocessor.deskew(img)
            
            # 2. Auto-Crop (Optional, can be risky if edges are undefined)
            # img = ImagePreprocessor.auto_crop(img)
            
            # 3. Enhance Contrast & Binarize
            processed = ImagePreprocessor.enhance_contrast(img)
            
            return processed
        except Exception as e:
            print(f"[PREPROCESS_ERROR] Failed to process image: {e}")
            return img  # Return original if fail

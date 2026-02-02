"""
OCR Correction & Validation
===========================
Helper service to repair common OCR mistakes and validate financial logic.
"""

import re

class OCRCorrector:
    @staticmethod
    def fix_common_ocr_errors(text: str) -> str:
        """
        Fixes common character confusions in financial texts.
        """
        if not text:
            return ""
            
        # 1. Fix numeric confusions (O -> 0, l -> 1, S -> 5)
        # We only apply this if the surrounding context looks numeric
        # Regex to find numbers that might have letters in them
        
        # Replace 'O' or 'o' with '0' if surrounded by digits
        text = re.sub(r'(?<=\d)[Oo](?=\d)|(?<=\d)[Oo]|(?<![a-zA-Z])[Oo](?=\d)', '0', text)
        
        # Replace 'l' or 'I' with '1' if looks like price (e.g. 100.00)
        text = re.sub(r'(?<=\d)[lI](?=\d)|(?<=\d)[lI]|(?<![a-zA-Z])[lI](?=\d)', '1', text)
        
        # Replace 'S' with '5' in numeric context
        text = re.sub(r'(?<=\d)[S](?=\d)|(?<=\d)[S]|(?<![a-zA-Z])[S](?=\d)', '5', text)
        
        # 2. Fix decimal point glitches
        # "100 00" -> "100.00"
        text = re.sub(r'(\d+)\s+(\d{2})$', r'\1.\2', text)
        
        return text

    @staticmethod
    def validate_line_item(item: dict) -> dict:
        """
        checks Qty * Rate == Amount.
        If discrepancy found, trusts the Amount field (usually most reliable).
        """
        qty = float(item.get("quantity", 0))
        rate = float(item.get("rate", 0))
        amount = float(item.get("amount", 0))
        
        if qty == 0 or rate == 0:
            return item
            
        calc_amount = qty * rate
        
        # Allow 1.0 difference for rounding errors
        if abs(calc_amount - amount) > 1.0:
            item["validation_warning"] = f"Math mismatch: {qty}x{rate}={calc_amount}, PDF said {amount}"
            # We assume AI extracted the printed Amount correctly, so we keep 'amount'
            # But we flag it.
            
        return item

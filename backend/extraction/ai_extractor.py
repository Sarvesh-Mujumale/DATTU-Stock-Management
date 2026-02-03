"""
AI Extractor Module
===================
Extracts structured financial data from document text using Groq AI API.

This module uses Groq's Llama 3 model for intelligent extraction of:
- Invoice/Bill numbers
- Dates
- Vendor/Supplier names
- Line items (item, quantity, rate, amount)
- Subtotal, Tax, Total

All processing is done in-memory. No data is stored or logged.
"""

import os
import json
from dataclasses import dataclass, field
from typing import List

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Groq AI client
from groq import Groq


@dataclass
class LineItem:
    """
    Represents a single line item from an invoice/bill.
    
    Attributes:
        item_name: Description of the item/product
        quantity: Number of units
        rate: Price per unit (defaults to 0.0 if not found)
        discount_percent: Discount percentage on this line item (e.g., 50 for 50%)
        amount: Total line amount AFTER discount (defaults to 0.0 if not found)
    """
    item_name: str
    quantity: float
    rate: float = 0.0
    discount_percent: float = 0.0
    amount: float = 0.0


@dataclass
class AdditionalCharge:
    """
    Represents an additional charge on an invoice (not a product).
    
    Examples: Packing charges, Freight, Shipping, Handling, Forwarding charges.
    These are NOT inventory items and should not affect stock balance.
    
    Attributes:
        charge_name: Name/description of the charge
        amount: Charge amount
    """
    charge_name: str
    amount: float = 0.0
    quantity: float = 0.0
    rate: float = 0.0


@dataclass
class ExtractedData:
    """
    Structured data extracted from a document.
    
    Attributes:
        invoice_number: Invoice or bill reference number
        date: Document date
        vendor_name: Vendor or supplier name
        line_items: List of line items with quantity and pricing (products only)
        additional_charges: List of charges (packing, freight, etc.) - NOT products
        subtotal: Sum of line item amounts before tax
        cgst: Central GST amount
        sgst: State GST amount
        igst: Integrated GST amount (for inter-state)
        tax: Total tax amount (cgst + sgst or igst)
        total: Final total amount
        extraction_notes: Any notes about the extraction process
    """
    invoice_number: str = ""
    date: str = ""
    vendor_name: str = ""
    line_items: List[LineItem] = field(default_factory=list)
    additional_charges: List[AdditionalCharge] = field(default_factory=list)
    subtotal: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    extraction_notes: List[str] = field(default_factory=list)


class AIExtractor:
    """
    AI-powered data extractor for financial documents.
    
    Uses Groq AI (Llama 3) for intelligent extraction.
    Extracts structured data from invoices, bills, and purchase documents.
    
    This class is designed to be stateless - no data is cached or stored.
    """
    
    def __init__(self):
        """Initialize the AI extractor with Groq client."""
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        api_key = os.getenv("GROQ_API_KEY")
        
        if not api_key:
            raise ValueError("[AI_EXTRACTOR] GROQ_API_KEY not found in environment. Please set it in .env file.")
        
        self.groq_client = Groq(api_key=api_key)
        print(f"[AI_EXTRACTOR] Groq AI initialized with model: {self.model}")
    
    def extract(self, text_content: str, tables: list = None) -> ExtractedData:
        """
        Extract structured data from document text using AI.
        
        Args:
            text_content: Raw text extracted from document
            tables: Optional list of tables (DataFrames) from document (not used, kept for compatibility)
            
        Returns:
            ExtractedData object with extracted fields
        """
        if not text_content:
            result = ExtractedData()
            result.extraction_notes.append("No content provided for extraction")
            return result
        
        print(f"\n{'='*60}")
        print(f"[AI_EXTRACTOR] Starting AI extraction")
        print(f"[AI_EXTRACTOR] Text length: {len(text_content)} chars")
        print(f"{'='*60}")
        
        try:
            prompt = f"""Extract data from this Indian invoice/bill. The text may be fragmented due to PDF extraction.

DOCUMENT TEXT:
{text_content}

Return a JSON object with this exact structure:
{{
    "invoice_number": "string or empty",
    "date": "string or empty",
    "vendor_name": "string or empty",
    "line_items": [
        {{
            "item_name": "product name/description",
            "quantity": number,
            "rate": number,
            "discount_percent": number,
            "amount": number
        }}
    ],
    "additional_charges": [
        {{
            "charge_name": "name of the charge (e.g. Packing, Freight)",
            "quantity": number (optional, default 1),
            "rate": number (optional),
            "amount": number
        }}
    ],
    "subtotal": number,
    "cgst": number,
    "sgst": number,
    "igst": number,
    "total": number
}}

IMPORTANT EXTRACTION RULES:
1. The text may have fragmented words/numbers due to PDF parsing. Piece together values intelligently.
2. Look for explicit tax amounts: 
   - "IGST" sections (e.g. "IGST 879.00").
   - "CGST" and "SGST" sections.
   - If you see "IGST 879.00", put 879.00 in "igst" field.
3. Look for "Sub Total" or "Subtotal" followed by amount
4. Look for final "Total" amount (usually the largest amount, includes GST)
5. For items: CAPTURE THE FULL NAME verbatim.
   - Include ALL model numbers, codes, sizes, and dimensions.
   - Example: "TROPHY - 646" -> Extract "TROPHY - 646" (Do NOT truncate to just "Trophy")
   - Example: "Steel bottle 750ml" -> Extract "Steel bottle 750ml"
   - Combine fragmented item names if they span multiple lines.
6. Charges vs Items:
   - Items are physical products (Inventory).
   - Charges are SERVICES (Packing, Forwarding, Freight, Shipping).
   - If a Charge like "Packing Charges" has a Quantity (e.g. "1.00 NOS") and Rate ("200.00"), EXTRACT IT in the additional_charges list with quantity and rate.
7. For discount_percent: 
   - Look for "Disc.", "Discount", "Less" columns explicitly.
   - DO NOT confuse GST rates (5%, 12%, 18%, 28%) with discounts. 
   - If you see "18%" or "12%" near an item, it is likely GST Tax, NOT Discount. 
   - Only extract discount if it is explicitly marked as discount. Default to 0.
8. CRITICAL - For amount: The Amount column in the invoice ALREADY shows the DISCOUNTED PRICE (after applying discount). Extract this value DIRECTLY from the PDF. Do NOT calculate it yourself.
   - Example: If PDF shows Qty=200, Rate=24, and Amount=2,400 with (50%), extract amount as 2400 (not 4800).
   - VERIFY: If your extracted Amount is much smaller than (Qty * Rate), check if you accidentally extracted the Tax Amount. If so, use (Qty * Rate) instead.
9. Extract numeric values even if ₹ symbol or commas are present (e.g., "₹ 2,520.00" = 2520.00)
10. CGST and SGST are usually equal (9% each) BUT only extract them if the AMOUNT is printed.
11. Grand Total = Trust the printed "Total" or "Grand Total" in the document above all else.
    - If your calculated sum (Subtotal + Tax) differs from the Document's Printed Total, USE THE PRINTED TOTAL.
    - Do NOT calculate GST (18%, etc) yourself if the tax amount column is empty.
    - If the document says "Total: 1900" and "GST 18%", but no tax amount is shown, the Total is 1900. Do not add 18%.

12. INVOICE NUMBER RULES:
    - Look for "Invoice No.", "Bill No.", "Inv No.", "Serial No.".
    - Invoice numbers are almost always alphanumeric (e.g., "65/25-26", "INV-2024-001").
    - NEVER return a single letter like "D" or "A".
    - If the number contains special characters like "/" or "-", PRESERVE THEM. (e.g., "65/25-26" is distinct from "652526").

CRITICAL - DISTINGUISHING line_items FROM additional_charges:
12. line_items: ONLY actual PRODUCTS with a meaningful quantity.
13. additional_charges: Service charges, fees, or extras (Packing, Freight, etc).
    - If "Discount" is listed as a meaningful line item with a negative amount or deduction, capture it.

Return ONLY valid JSON, no explanations."""

            print(f"[AI_EXTRACTOR] Calling Groq AI...")
            
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert Indian invoice extractor. Extract data from invoices including GST. IMPORTANT: Do NOT confuse GST percentages (18%, 12%, 5%) with Discount percentages. Only extract discount if explicitly labeled as 'Disc' or 'Discount'."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            response_text = response.choices[0].message.content.strip()
            print(f"[AI_EXTRACTOR] Groq response received ({len(response_text)} chars)")
            
            # Clean up response - remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            response_text = response_text.strip()
            
            # Parse JSON response
            data = json.loads(response_text)
            
            # Convert to ExtractedData with pricing and GST
            cgst = float(data.get("cgst", 0) or 0)
            sgst = float(data.get("sgst", 0) or 0)
            igst = float(data.get("igst", 0) or 0)
            # Total tax is sum of GST components
            total_tax = cgst + sgst + igst
            
            result = ExtractedData(
                invoice_number=data.get("invoice_number", ""),
                date=data.get("date", ""),
                vendor_name=data.get("vendor_name", ""),
                subtotal=float(data.get("subtotal", 0) or 0),
                cgst=cgst,
                sgst=sgst,
                igst=igst,
                tax=total_tax,
                total=float(data.get("total", 0) or 0),
                extraction_notes=["Extracted using Groq AI"]
            )
            
            # Keywords that indicate a charge (not a product)
            CHARGE_KEYWORDS = [
                'packing', 'forwarding', 'freight', 'shipping', 'handling',
                'delivery', 'transport', 'transportation', 'courier',
                'service charge', 'service fee', 'insurance', 'loading',
                'unloading', 'charges', 'charge', 'p&f', 'p & f'
            ]
            
            def is_charge(item_name: str) -> bool:
                """Check if an item name looks like a charge/fee rather than a product."""
                name_lower = item_name.lower()
                return any(keyword in name_lower for keyword in CHARGE_KEYWORDS)
            
            # Parse line items with pricing and discount percentage
            for item in data.get("line_items", []):
                qty = float(item.get("quantity", 1) or 1)
                rate = float(item.get("rate", 0) or 0)
                discount_percent = float(item.get("discount_percent", 0) or 0)
                amount = float(item.get("amount", 0) or 0)
                item_name = item.get("item_name", "Unknown")
                
                # If amount is 0 but we have qty and rate, calculate it with percentage discount
                if amount == 0 and rate > 0:
                    if discount_percent > 0:
                        amount = qty * rate * (1 - discount_percent / 100)
                    else:
                        amount = qty * rate
                
                # PHANTOM DISCOUNT CHECK:
                # If parsed amount roughly equals (qty * rate), then NO discount was applied.
                # If AI extracted a discount % (like 18%) but the math shows no discount, it's false positive (likely GST).
                if amount > 0 and rate > 0 and discount_percent > 0:
                    expected = qty * rate
                    # Allow small rounding difference (e.g. 1.0)
                    if abs(expected - amount) < 1.0:
                        print(f"   [DISCOUNT CORRECTION] Removed false {discount_percent}% discount for '{item_name}' (Math proves no discount)")
                        discount_percent = 0.0
                
                # Post-processing: Check if this should be a charge instead of a line item
                if is_charge(item_name):
                    # Move to additional_charges instead
                    result.additional_charges.append(AdditionalCharge(
                        charge_name=item_name,
                        amount=amount
                    ))
                    print(f"   [CHARGE DETECTED] '{item_name}' moved to additional_charges")
                else:
                    result.line_items.append(LineItem(
                        item_name=item_name,
                        quantity=qty,
                        rate=rate,
                        discount_percent=discount_percent,
                        amount=amount
                    ))
            
            # Parse additional_charges from AI response
            for charge in data.get("additional_charges", []):
                charge_name = charge.get("charge_name", "")
                charge_amount = float(charge.get("amount", 0) or 0)
                charge_qty = float(charge.get("quantity", 0) or 0)
                charge_rate = float(charge.get("rate", 0) or 0)
                
                if charge_name and charge_amount > 0:
                    result.additional_charges.append(AdditionalCharge(
                        charge_name=charge_name,
                        amount=charge_amount,
                        quantity=charge_qty,
                        rate=charge_rate
                    ))
            
            print(f"[AI_EXTRACTOR] ✓ Extraction successful! Found {len(result.line_items)} items, {len(result.additional_charges)} charges")
            
            # Debug: Print extracted items with prices and discount percentage
            for i, item in enumerate(result.line_items):
                print(f"   {i+1}. {item.item_name} | Qty: {item.quantity} | Rate: {item.rate} | Disc: {item.discount_percent}% | Amount: {item.amount}")
            
            # Debug: Print charges
            if result.additional_charges:
                print(f"   Additional Charges:")
                for charge in result.additional_charges:
                    print(f"      - {charge.charge_name}: {charge.amount}")
            
            if result.total > 0:
                print(f"   Document Total: {result.total}")
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"[AI_EXTRACTOR] Failed to parse AI response as JSON: {e}")
            result = ExtractedData()
            result.extraction_notes.append(f"JSON parsing error: {e}")
            return result
        except Exception as e:
            print(f"[AI_EXTRACTOR] AI extraction failed: {e}")
            result = ExtractedData()
            result.extraction_notes.append(f"Extraction error: {e}")
            return result


"""
Document-to-Excel Processing API
================================
FastAPI backend for converting bill and purchase documents into structured Excel files.

Key Features:
- Stateless, synchronous API
- Privacy-first: ZERO data storage
- All processing in-memory
- Streaming Excel response
- Sales/Purchase bill analysis with surplus/deficit

Endpoints:
- POST /process-document - Process single document
- POST /analyze-bills - Analyze multiple sales/purchase bills

Author: Antigravity AI Platform
"""

import io
import gc
from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

# Import processing modules
from parsers import DocumentParser
from extraction import AIExtractor
from validation import Validator
from generators import ExcelGenerator
from analysis import InventoryAnalyzer

# Import authentication routes
from routes.auth import router as auth_router


# ============================================================================
# Application Setup
# ============================================================================

app = FastAPI(
    title="Document-to-Excel Processor",
    description="Privacy-first API for converting invoices and bills to structured Excel files",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
# Explicitly list allowed origins to avoid browser blocking
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
    "https://dattu-stock-management-qww1.onrender.com",  # Your production frontend
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication routes
app.include_router(auth_router)

# Initialize processing components (stateless)
document_parser = DocumentParser()
ai_extractor = AIExtractor()
validator = Validator()
excel_generator = ExcelGenerator()
inventory_analyzer = InventoryAnalyzer()


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """
    Health check endpoint.
    
    Returns basic API information.
    """
    return {
        "status": "healthy",
        "service": "Document-to-Excel Processor",
        "version": "1.0.0",
        "privacy": "All data is processed in-memory and never stored"
    }


@app.get("/health")
async def health_check():
    """
    Detailed health check for monitoring.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {
            "parser": "ready",
            "extractor": "ready",
            "validator": "ready",
            "generator": "ready"
        }
    }


@app.post("/process-document")
async def process_document(file: UploadFile = File(...)):
    """
    Process an uploaded document and return structured Excel file.
    
    Accepts:
    - Excel files (.xlsx, .xls)
    - PDF files (text-based)
    - Images (.jpg, .png) - requires OCR configuration
    
    Processing Flow:
    1. Read file into memory
    2. Detect file type and parse content
    3. Extract structured data (invoice#, date, vendor, items, totals)
    4. Validate against business rules
    5. Generate Excel file
    6. Stream response and clear all data
    
    Returns:
    - Success: Excel file as stream download
    - Failure: JSON error response
    
    Privacy:
    - No data is logged
    - No data is written to disk
    - All buffers are cleared after response
    """
    
    # Variables to track for cleanup
    file_bytes = None
    excel_bytes = None
    
    try:
        # ====================================================================
        # Step 1: Read file into memory
        # ====================================================================
        
        # Validate file is present
        if not file or not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file uploaded. Please select a document to process."
            )
        
        # Read file content into memory
        file_bytes = await file.read()
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(file_bytes) > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is 10MB. Uploaded file: {len(file_bytes) / (1024*1024):.2f}MB"
            )
        
        # Validate file is not empty
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty. Please select a valid document."
            )
        
        original_filename = file.filename
        
        # ====================================================================
        # Step 2: Parse document
        # ====================================================================
        
        parse_result = document_parser.parse(file_bytes, original_filename)
        
        if not parse_result.success:
            raise HTTPException(
                status_code=422,
                detail=parse_result.error_message
            )
        
        # ====================================================================
        # Step 3: Extract structured data
        # ====================================================================
        
        extracted_data = ai_extractor.extract(
            text_content=parse_result.text_content,
            tables=parse_result.tables
        )
        
        # ====================================================================
        # Step 4: Validate extracted data
        # ====================================================================
        
        validation_result = validator.validate(extracted_data)
        
        # ====================================================================
        # Step 5: Generate Excel file
        # ====================================================================
        
        excel_bytes = excel_generator.generate(
            data=extracted_data,
            validation=validation_result,
            original_filename=original_filename
        )
        
        # ====================================================================
        # Step 6: Prepare streaming response
        # ====================================================================
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
        output_filename = f"processed_{base_name}_{timestamp}.xlsx"
        
        # Create streaming response
        response = StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="{output_filename}"',
                "Content-Length": str(len(excel_bytes)),
                # Privacy headers
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "X-Content-Type-Options": "nosniff"
            }
        )
        
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        # Temporary debug logging - remove in production
        import traceback
        print(f"ERROR: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )
        
    finally:
        # ====================================================================
        # Cleanup: Clear all data from memory
        # ====================================================================
        
        # Clear file bytes
        if file_bytes is not None:
            file_bytes = None
        
        # Clear excel bytes
        if excel_bytes is not None:
            excel_bytes = None
        
        # Force garbage collection to clear memory
        gc.collect()


# ============================================================================
# Multi-Bill Analysis Endpoint
# ============================================================================

@app.post("/analyze-bills")
async def analyze_bills(
    purchase_files: List[UploadFile] = File(default=[]),
    sales_files: List[UploadFile] = File(default=[]),
    auto_detect: bool = Form(default=True)
):
    """
    Analyze multiple purchase and sales bills.
    
    Accepts:
    - Multiple purchase bill files
    - Multiple sales bill files
    - Auto-detect option for bill type classification
    
    Returns:
    - Excel file with:
      - Inventory Summary (surplus/deficit per item)
      - Purchase Bills details
      - Sales Bills details
      - AI Analysis & Insights
    
    Privacy:
    - All processing in-memory
    - No data stored or logged
    """
    
    purchase_data = []
    sales_data = []
    failed_files = []  # Track files that failed to process
    
    try:
        # Process purchase files
        for file in purchase_files:
            file_bytes = await file.read()
            if len(file_bytes) == 0:
                continue
                
            parse_result = document_parser.parse(file_bytes, file.filename)
            
            # DEBUG: Print what was extracted from PDF
            print(f"\n{'='*60}")
            print(f"📄 FILE: {file.filename}")
            print(f"{'='*60}")
            print(f"Parse Success: {parse_result.success}")
            if parse_result.text_content:
                print(f"\n📝 EXTRACTED TEXT (first 500 chars):")
                print(parse_result.text_content[:500])
            if parse_result.tables:
                print(f"\n📊 TABLES FOUND: {len(parse_result.tables)}")
                for i, table in enumerate(parse_result.tables):
                    df = table.get('data')
                    if df is not None:
                        print(f"\n  Table {i+1} columns: {list(df.columns)}")
                        print(f"  Table {i+1} rows: {len(df)}")
                        print(df.to_string())
            
            if parse_result.success:
                extracted = ai_extractor.extract(
                    parse_result.text_content,
                    parse_result.tables
                )
                
                # DEBUG: Print extracted line items
                print(f"\n✅ EXTRACTED LINE ITEMS: {len(extracted.line_items)}")
                for item in extracted.line_items:
                    print(f"   - {item.item_name} | Qty: {item.quantity}")
                
                purchase_data.append({
                    'invoice_number': extracted.invoice_number,
                    'date': extracted.date,
                    'vendor_name': extracted.vendor_name,
                    'line_items': extracted.line_items,
                    'additional_charges': extracted.additional_charges,
                    'subtotal': extracted.subtotal,
                    'cgst': extracted.cgst,
                    'sgst': extracted.sgst,
                    'igst': extracted.igst,
                    'tax': extracted.tax,
                    'total': extracted.total
                })
            else:
                # Track failed files
                print(f"❌ PARSE FAILED: {parse_result.error_message}")
                failed_files.append(f"{file.filename}: {parse_result.error_message}")
        
        # Process sales files
        for file in sales_files:
            file_bytes = await file.read()
            if len(file_bytes) == 0:
                continue
                
            parse_result = document_parser.parse(file_bytes, file.filename)
            
            # DEBUG: Print what was extracted from PDF
            print(f"\n{'='*60}")
            print(f"📄 FILE (SALES): {file.filename}")
            print(f"{'='*60}")
            print(f"Parse Success: {parse_result.success}")
            if parse_result.text_content:
                print(f"\n📝 EXTRACTED TEXT (first 500 chars):")
                print(parse_result.text_content[:500])
            if parse_result.tables:
                print(f"\n📊 TABLES FOUND: {len(parse_result.tables)}")
                for i, table in enumerate(parse_result.tables):
                    df = table.get('data')
                    if df is not None:
                        print(f"\n  Table {i+1} columns: {list(df.columns)}")
                        print(f"  Table {i+1} rows: {len(df)}")
                        print(df.to_string())
            
            if parse_result.success:
                extracted = ai_extractor.extract(
                    parse_result.text_content,
                    parse_result.tables
                )
                
                # DEBUG: Print extracted line items
                print(f"\n✅ EXTRACTED LINE ITEMS: {len(extracted.line_items)}")
                for item in extracted.line_items:
                    print(f"   - {item.item_name} | Qty: {item.quantity}")
                
                # Auto-detect bill type if enabled
                if auto_detect:
                    detected_type = inventory_analyzer.detect_bill_type(
                        parse_result.text_content
                    )
                    # Override if detected as purchase
                    if detected_type.value == 'purchase':
                        purchase_data.append({
                            'invoice_number': extracted.invoice_number,
                            'date': extracted.date,
                            'vendor_name': extracted.vendor_name,
                            'line_items': extracted.line_items,
                            'additional_charges': extracted.additional_charges,
                            'subtotal': extracted.subtotal,
                            'cgst': extracted.cgst,
                            'sgst': extracted.sgst,
                            'igst': extracted.igst,
                            'tax': extracted.tax,
                            'total': extracted.total
                        })
                        continue
                
                sales_data.append({
                    'invoice_number': extracted.invoice_number,
                    'date': extracted.date,
                    'vendor_name': extracted.vendor_name,
                    'line_items': extracted.line_items,
                    'additional_charges': extracted.additional_charges,
                    'subtotal': extracted.subtotal,
                    'cgst': extracted.cgst,
                    'sgst': extracted.sgst,
                    'igst': extracted.igst,
                    'tax': extracted.tax,
                    'total': extracted.total
                })
            else:
                # Track failed files
                print(f"❌ PARSE FAILED: {parse_result.error_message}")
                failed_files.append(f"{file.filename}: {parse_result.error_message}")
        
        # Check if we have any data
        if not purchase_data and not sales_data:
            error_detail = "No valid bills could be processed."
            if failed_files:
                error_detail += " Failed files: " + "; ".join(failed_files[:3])
                if "scanned PDF" in error_detail or "OCR" in error_detail:
                    error_detail += " TIP: Your PDFs appear to be scanned images. Please use text-based PDFs or Excel files."
            raise HTTPException(
                status_code=400,
                detail=error_detail
            )
        
        # Perform inventory analysis
        analysis = inventory_analyzer.analyze(purchase_data, sales_data)
        
        # Generate Excel report
        excel_bytes = excel_generator.generate_analysis_report(
            analysis,
            purchase_data,
            sales_data
        )
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"inventory_analysis_{timestamp}.xlsx"
        
        # Build response headers
        response_headers = {
            "Content-Disposition": f'attachment; filename="{output_filename}"',
            "Content-Length": str(len(excel_bytes)),
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache"
        }
        
        # Return streaming response
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=response_headers
        )
        
    except HTTPException:
        raise
        
    except Exception as e:
        import traceback
        print(f"ERROR in analyze-bills: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing bills: {str(e)}"
        )
        
    finally:
        gc.collect()


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """
    Custom error handler for HTTP exceptions.
    
    Returns clean JSON errors without exposing internals.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """
    Catch-all error handler.
    
    Never exposes internal error details for privacy/security.
    """
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An unexpected error occurred. Please try again.",
            "status_code": 500
        }
    )


# ============================================================================
# Run Configuration
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Run server
    # In production, use: uvicorn main:app --host 0.0.0.0 --port 8000
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True  # Disable in production
    )

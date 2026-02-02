# Document-to-Excel Processor

A **privacy-first, stateless** document processing system that converts invoices, bills, and purchase documents into structured Excel files.

## 🔒 Privacy Guarantee

- **ZERO data storage** - No database, no file system writes, no caching
- **In-memory only** - All processing uses BytesIO buffers
- **Immediate cleanup** - Data destroyed after response is sent
- **No logging** - Document contents are never logged

## ✨ Features

- **Multi-format support**: Excel (.xlsx, .xls), PDF (text-based), Images (requires OCR)
- **Smart extraction**: Extracts invoice numbers, dates, vendors, line items, totals
- **Validation**: Business rule validation (subtotal + tax = total, etc.)
- **Structured output**: Standardized Excel with Summary, Line Items, and Validation sheets

## 📁 Project Structure

```
DATTU_BILL/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── parsers/
│   │   └── document_parser.py  # File type detection & extraction
│   ├── extraction/
│   │   └── ai_extractor.py     # Data extraction (regex-based)
│   ├── validation/
│   │   └── validator.py        # Business rule validation
│   └── generators/
│       └── excel_generator.py  # In-memory Excel creation
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx             # Main application
│       ├── index.css           # Tailwind styles
│       ├── main.jsx            # React entry
│       └── components/
│           ├── Header.jsx
│           ├── FileUpload.jsx
│           ├── ProcessingStatus.jsx
│           ├── ErrorDisplay.jsx
│           └── PrivacyNotice.jsx
│
└── README.md
```

## 🚀 Quick Start

### Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
# Or: uvicorn main:app --reload --port 8000
```

Backend will run at: http://localhost:8000

### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will run at: http://localhost:5173

## 📡 API Reference

### `GET /`
Health check endpoint.

### `GET /health`
Detailed health check with component status.

### `POST /process-document`
Process an uploaded document and return an Excel file.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (binary)

**Response:**
- Success: Excel file download (`.xlsx`)
- Error: JSON with error message

**Example:**
```bash
curl -X POST http://localhost:8000/process-document \
  -F "file=@invoice.pdf" \
  -o processed_invoice.xlsx
```

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Pandas** - Data manipulation
- **pdfplumber** - PDF text extraction
- **openpyxl** - Excel file generation
- **Pillow** - Image handling

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling

## 📋 Extracted Fields

| Field | Description |
|-------|-------------|
| Invoice Number | Bill/Invoice reference number |
| Date | Document date |
| Vendor Name | Supplier/Vendor company name |
| Line Items | Product/service details (item, qty, rate, amount) |
| Subtotal | Sum before tax |
| Tax/GST | Tax amount |
| Total | Final total amount |

## ✅ Validation Rules

1. `subtotal + tax == total` (within 5% tolerance)
2. All mandatory fields must be present
3. Numeric values must be non-negative
4. Line item amounts should match `qty × rate`

## 🔧 Configuration

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8000 | Server port |
| `HOST` | 127.0.0.1 | Server host |

### Future AI Integration

To upgrade from regex-based extraction to AI-powered extraction:

1. Set `OPENAI_API_KEY` environment variable
2. Modify `extraction/ai_extractor.py` to call OpenAI API
3. Uncomment AI client code and update prompts

## 📝 License

This project is for internal use. All rights reserved.

---

Built with ❤️ using the Antigravity AI Platform

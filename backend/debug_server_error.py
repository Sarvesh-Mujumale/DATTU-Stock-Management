
import asyncio
import os
import sys
import traceback

# Ensure we can import from current directory
sys.path.append(os.getcwd())

from parsers.document_parser import DocumentParser

async def debug_server_error():
    print("Starting debug...")
    try:
        # Path to the uploaded file
        file_path = "C:/Users/Sarvesh k mujumale/.gemini/antigravity/brain/683c1549-366e-42ef-95cb-185ed35ab321/uploaded_media_1770033734795.png"
        
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return

        print(f"Reading file: {file_path}")
        with open(file_path, "rb") as f:
            file_bytes = f.read()
            
        parser = DocumentParser()
        print("Parser initialized. Parsing...")
        result = parser.parse(file_bytes, "test_image.png")
        
        print(f"Success: {result.success}")
        if result.success:
            print(f"Text len: {len(result.text_content)}")
            print("Preview:", result.text_content[:100])
        else:
            print(f"Error: {result.error_message}")
            
    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_server_error())

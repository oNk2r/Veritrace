# pyrefly: ignore [missing-import]
import fitz
from app.utils.text_cleaner import clean_text

def extract_pdf_data(file_path: str) -> dict:
    """
    Opens a PDF file, counts pages/characters, and extracts text.
    Handles corrupted, empty, and image-only PDFs.
    
    Returns:
        dict: A dictionary containing either:
            - {"error": "..."} on failure/error cases
            - {"success": True, "pages": int, "characters": int, "text": str} on success
    """
    try:
        doc = fitz.open(file_path)
    except Exception:
        return {"error": "Unable to read PDF."}
    
    num_pages = len(doc)
    if num_pages == 0:
        return {"error": "Unable to read PDF."}

    full_text = ""
    has_images = False
    
    for page in doc:
        text = page.get_text()
        full_text += text
        
        # Check if the page has any images
        if not has_images and len(page.get_images()) > 0:
            has_images = True

    # Clean the raw text
    cleaned_text = clean_text(full_text)
    
    if not cleaned_text:
        # If there is no text and the document contains images, it is an image-only PDF
        if has_images:
            return {"error": "This PDF contains scanned images. OCR support will be added later."}
        else:
            return {"error": "No text found."}

    return {
        "success": True,
        "pages": num_pages,
        "characters": len(cleaned_text),
        "text": cleaned_text
    }

import aiofiles
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, status
from fastapi.responses import JSONResponse
from app.services.pdf_service import extract_pdf_data

router = APIRouter()

# Resolve paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    # Validate extension
    if not file.filename.lower().endswith(".pdf"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Only PDF files are allowed."}
        )

    # Ensure uploads directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = UPLOAD_DIR / file.filename

    try:
        # Save file to uploads/
        async with aiofiles.open(file_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):
                await out_file.write(chunk)
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Could not save file: {str(e)}"}
        )

    # Extract text from the saved PDF
    result = extract_pdf_data(str(file_path))

    # Handle service extraction errors
    if "error" in result:
        # Delete invalid file to clean up uploads/
        if file_path.exists():
            file_path.unlink()
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": result["error"]}
        )

    return {
        "success": True,
        "filename": file.filename,
        "pages": result["pages"],
        "characters": result["characters"],
        "text": result["text"][:1000]  # Return only the first 1000 characters
    }

@router.post("/extract")
async def extract_pdf(file: UploadFile = File(...)):
    # Validate extension
    if not file.filename.lower().endswith(".pdf"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Only PDF files are allowed."}
        )

    # Ensure uploads directory exists for temporary write
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = UPLOAD_DIR / f"temp_{file.filename}"

    try:
        # Save file temporarily
        async with aiofiles.open(file_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):
                await out_file.write(chunk)
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Could not save file: {str(e)}"}
        )

    # Extract text
    result = extract_pdf_data(str(file_path))

    # Always clean up the temp file
    if file_path.exists():
        file_path.unlink()

    if "error" in result:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": result["error"]}
        )

    return {
        "success": True,
        "pages": result["pages"],
        "characters": result["characters"],
        "text": result["text"][:1000]  # Return only the first 1000 characters
    }
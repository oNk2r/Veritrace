import aiofiles
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException, status

router = APIRouter()

# Resolve the path to the backend root directory and uploads folder
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    # Validate extension
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed."
        )

    # Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    file_path = UPLOAD_DIR / file.filename

    try:
        # Save file in uploads/
        async with aiofiles.open(file_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):  # Read in 1MB chunks
                await out_file.write(chunk)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )

    return {
        "success": True,
        "filename": file.filename,
        "message": "Uploaded successfully"
    }
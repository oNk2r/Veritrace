import aiofiles
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, status
from fastapi.responses import JSONResponse
from app.services.pdf_service import extract_pdf_data
from app.services.llm_service import LLMService
from app.services.climatetrace_service import ClimateTraceService
from app.services.comparison_service import ComparisonEngine
from app.schemas.climatetrace import ClimateTraceCompanyEmissions

router = APIRouter()
llm_service = LLMService()
climatetrace_service = ClimateTraceService()

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

    # Perform Gemini structured extraction (Phase 1)
    esg_analysis = llm_service.extract_esg_data(result["text"])
    if isinstance(esg_analysis, dict) and "error" in esg_analysis:
        # Delete invalid file to clean up uploads/
        if file_path.exists():
            file_path.unlink()
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": esg_analysis["error"]}
        )

    # Retrieve Climate TRACE data (Phase 2)
    company_name = esg_analysis.company_name
    reporting_year = esg_analysis.reporting_year
    
    ct_analysis = await climatetrace_service.get_company_data(company_name, reporting_year)
    if ct_analysis is None:
        # Graceful fallback: comparison engine handles empty CT data
        ct_analysis = ClimateTraceCompanyEmissions(
            company_id="UNKNOWN",
            company_name=company_name,
            year=reporting_year,
            total_emissions=0.0
        )

    # Run Comparison calculations (Phase 3)
    comparison = ComparisonEngine.compare_data(esg_analysis, ct_analysis)

    # Generate AI Report (Phase 4)
    ai_report = llm_service.generate_verification_report(esg_analysis, ct_analysis, comparison)
    if isinstance(ai_report, dict) and "error" in ai_report:
        # Delete invalid file to clean up uploads/
        if file_path.exists():
            file_path.unlink()
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": ai_report["error"]}
        )

    # Serialize Pydantic schemas to JSON
    esg_data = esg_analysis.model_dump()
    ct_data = ct_analysis.model_dump()
    comp_data = comparison.model_dump()
    report_data = ai_report.model_dump() if hasattr(ai_report, "model_dump") else ai_report

    return {
        "success": True,
        "filename": file.filename,
        "pages": result["pages"],
        "characters": result["characters"],
        "esg_data": esg_data,
        "climatetrace_data": ct_data,
        "comparison": comp_data,
        "report": report_data
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

    # Perform Gemini structured extraction (Phase 1)
    esg_analysis = llm_service.extract_esg_data(result["text"])
    if isinstance(esg_analysis, dict) and "error" in esg_analysis:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": esg_analysis["error"]}
        )

    # Retrieve Climate TRACE data (Phase 2)
    company_name = esg_analysis.company_name
    reporting_year = esg_analysis.reporting_year

    ct_analysis = await climatetrace_service.get_company_data(company_name, reporting_year)
    if ct_analysis is None:
        ct_analysis = ClimateTraceCompanyEmissions(
            company_id="UNKNOWN",
            company_name=company_name,
            year=reporting_year,
            total_emissions=0.0
        )

    # Run Comparison calculations (Phase 3)
    comparison = ComparisonEngine.compare_data(esg_analysis, ct_analysis)

    # Generate AI Report (Phase 4)
    ai_report = llm_service.generate_verification_report(esg_analysis, ct_analysis, comparison)
    if isinstance(ai_report, dict) and "error" in ai_report:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": ai_report["error"]}
        )

    # Serialize Pydantic schemas to JSON
    esg_data = esg_analysis.model_dump()
    ct_data = ct_analysis.model_dump()
    comp_data = comparison.model_dump()
    report_data = ai_report.model_dump() if hasattr(ai_report, "model_dump") else ai_report

    return {
        "success": True,
        "pages": result["pages"],
        "characters": result["characters"],
        "esg_data": esg_data,
        "climatetrace_data": ct_data,
        "comparison": comp_data,
        "report": report_data
    }
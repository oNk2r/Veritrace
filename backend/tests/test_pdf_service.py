from app.services.pdf_service import extract_pdf_data

def test_extract_pdf_data_file_not_found():
    res = extract_pdf_data("non_existent_file.pdf")
    assert "error" in res
    assert "unable to read pdf" in res["error"].lower()

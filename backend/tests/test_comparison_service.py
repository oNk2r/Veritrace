from app.schemas.extraction import ESGExtractionResult
from app.schemas.climatetrace import ClimateTraceCompanyEmissions
from app.services.comparison_service import ComparisonEngine

def test_comparison_exact_match():
    esg = ESGExtractionResult(
        company_name="Test Company",
        reporting_year=2023,
        scope1=100.0,
        units="metric tons CO2e",
        reporting_standard="GHG Protocol"
    )
    ct = ClimateTraceCompanyEmissions(
        company_id="123",
        company_name="Test Company",
        year=2023,
        total_emissions=100.0
    )
    result = ComparisonEngine.compare_data(esg, ct)
    assert result.reporting_year_mismatch is False
    assert result.scope1_difference == 0.0
    assert result.scope1_difference_percentage == 0.0
    assert result.confidence_score == 1.0  # No deductions

def test_comparison_year_mismatch_and_discrepancy():
    esg = ESGExtractionResult(
        company_name="Test Company",
        reporting_year=2023,
        scope1=100.0,
        units="metric tons CO2e",
        reporting_standard="None"
    )
    ct = ClimateTraceCompanyEmissions(
        company_id="123",
        company_name="Test Company LLC",
        year=2022,
        total_emissions=160.0
    )
    result = ComparisonEngine.compare_data(esg, ct)
    assert result.reporting_year_mismatch is True
    # ESG (100) - CT (160) = -60
    assert result.scope1_difference == -60.0
    assert result.scope1_difference_percentage == -60.0
    # Deductions:
    # Year mismatch: -0.20
    # Reporting standard "None": -0.10
    # Discrepancy > 50%: -0.20
    # Confidence should be 1.0 - 0.50 = 0.50
    assert result.confidence_score == 0.50

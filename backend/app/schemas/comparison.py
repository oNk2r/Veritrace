from pydantic import BaseModel, Field
from typing import List, Optional

class ComparisonResult(BaseModel):
    reporting_year_mismatch: bool = Field(description="Flag indicating if the reports are for different calendar/fiscal years")
    esg_year: int = Field(description="Year extracted from the corporate ESG report")
    climatetrace_year: int = Field(description="Year queried from Climate TRACE database")
    esg_company_name: str = Field(description="Company name extracted from corporate ESG report")
    climatetrace_company_name: str = Field(description="Matched owner name from Climate TRACE")
    
    esg_scope1: Optional[float] = Field(description="Scope 1 direct greenhouse gas emissions in metric tons CO2e from ESG report", default=None)
    climatetrace_scope1_estimate: float = Field(description="Independent direct emissions estimate in metric tons CO2e from Climate TRACE")
    scope1_difference: Optional[float] = Field(description="Scope 1 direct difference (ESG Scope 1 - Climate TRACE estimate)", default=None)
    scope1_difference_percentage: Optional[float] = Field(description="Percentage difference relative to ESG Scope 1 emissions", default=None)
    
    missing_information: List[str] = Field(description="Summary of fields, metrics, or details missing in either report")
    confidence_score: float = Field(description="Heuristic overall comparison confidence score between 0.0 (low) and 1.0 (high)")

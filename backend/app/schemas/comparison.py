from pydantic import BaseModel, Field
from typing import List, Optional

class FacilityComparison(BaseModel):
    esg_name: str = Field(description="Name of the facility as reported in the ESG PDF")
    climatetrace_name: str = Field(description="Name of the matched facility in Climate TRACE")
    esg_emissions: Optional[float] = Field(description="Facility emissions in metric tons CO2e from ESG report", default=None)
    climatetrace_emissions: float = Field(description="Facility emissions in metric tons CO2e from Climate TRACE estimate")
    difference: Optional[float] = Field(description="Direct numerical difference in emissions (ESG - Climate TRACE)", default=None)
    difference_percentage: Optional[float] = Field(description="Percentage difference relative to ESG emissions", default=None)
    match_score: float = Field(description="Name matching similarity score between 0.0 and 1.0")

class UnmatchedFacility(BaseModel):
    name: str = Field(description="Name of the unmatched facility")
    emissions: float = Field(description="Emissions of the unmatched facility in metric tons CO2e")
    source: str = Field(description="Source where this facility was found: 'ESG' or 'ClimateTRACE'")
    latitude: Optional[float] = Field(description="Geographic latitude coordinate", default=None)
    longitude: Optional[float] = Field(description="Geographic longitude coordinate", default=None)

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
    
    matched_facilities: List[FacilityComparison] = Field(description="Facilities successfully paired across both datasets", default=[])
    unmatched_facilities: List[UnmatchedFacility] = Field(description="Facilities found in only one of the datasets", default=[])
    
    coverage_percentage: float = Field(description="Percentage of Climate TRACE facilities accounted for/matched in the ESG report")
    missing_information: List[str] = Field(description="Summary of fields, metrics, or details missing in either report")
    confidence_score: float = Field(description="Heuristic overall comparison confidence score between 0.0 (low) and 1.0 (high)")

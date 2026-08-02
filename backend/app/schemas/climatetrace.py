from pydantic import BaseModel, Field

class ClimateTraceCompanyEmissions(BaseModel):
    company_id: str = Field(description="The official Climate TRACE owner ID")
    company_name: str = Field(description="The official Climate TRACE owner name")
    year: int = Field(description="The reporting calendar year")
    total_emissions: float = Field(description="Aggregated portfolio emissions in metric tons CO2e")

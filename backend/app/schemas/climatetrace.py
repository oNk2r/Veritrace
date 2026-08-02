from pydantic import BaseModel, Field
from typing import List, Optional

class ClimateTraceFacility(BaseModel):
    id: int = Field(description="The internal Climate TRACE identifier for this facility")
    name: str = Field(description="Name of the facility or asset")
    sector: str = Field(description="The high-level sector (e.g. power, waste, mineral-extraction)")
    subsector: str = Field(description="The specific subsector (e.g. electricity-generation, cement)")
    country: str = Field(description="ISO 3-letter country code")
    emissions: float = Field(description="Direct emissions quantity in metric tons CO2e")
    year: int = Field(description="The reporting calendar year")
    latitude: Optional[float] = Field(description="Geographic latitude coordinate", default=None)
    longitude: Optional[float] = Field(description="Geographic longitude coordinate", default=None)

class ClimateTraceCompanyEmissions(BaseModel):
    company_id: str = Field(description="The official Climate TRACE owner ID")
    company_name: str = Field(description="The official Climate TRACE owner name")
    year: int = Field(description="The reporting calendar year")
    total_emissions: float = Field(description="Aggregated portfolio emissions in metric tons CO2e")
    facilities: List[ClimateTraceFacility] = Field(description="Granular list of point-source facilities owned by this company", default=[])

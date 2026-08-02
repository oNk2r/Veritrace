from pydantic import BaseModel, Field
from typing import List, Optional

class FacilityEmission(BaseModel):
    name: str = Field(description="Name or description of the facility or location")
    location: Optional[str] = Field(description="Geographic location, region, or address of the facility", default=None)
    emissions: Optional[float] = Field(description="Direct or indirect emissions of the facility in metric tons CO2e", default=None)

class Scope2Emissions(BaseModel):
    location_based: Optional[float] = Field(description="Location-based Scope 2 emissions in metric tons CO2e", default=None)
    market_based: Optional[float] = Field(description="Market-based Scope 2 emissions in metric tons CO2e", default=None)

class Scope3Category(BaseModel):
    category_number: int = Field(description="The Scope 3 category number (typically 1 to 15)")
    category_name: str = Field(description="The formal category name (e.g. Purchased goods and services, Business travel)")
    emissions: float = Field(description="Greenhouse gas emissions for this category in metric tons CO2e")

class ESGExtractionResult(BaseModel):
    company_name: str = Field(description="Official name of the company reporting the emissions")
    reporting_year: int = Field(description="The calendar or fiscal year for which emissions are reported")
    reporting_standard: Optional[str] = Field(description="Reporting standards/frameworks used (e.g., GHG Protocol, GRI, SASB, None)", default=None)
    scope1: Optional[float] = Field(description="Scope 1 direct greenhouse gas emissions in metric tons CO2e", default=None)
    scope2: Optional[Scope2Emissions] = Field(description="Scope 2 indirect greenhouse gas emissions split by location-based and market-based if available", default=None)
    scope3: Optional[List[Scope3Category]] = Field(description="Scope 3 category-wise breakdown of greenhouse gas emissions", default=None)
    scope3_total: Optional[float] = Field(description="Total Scope 3 greenhouse gas emissions in metric tons CO2e", default=None)
    units: str = Field(description="The standard unit of emissions, which should always be 'metric tons CO2e'", default="metric tons CO2e")
    facilities: Optional[List[FacilityEmission]] = Field(description="Key facilities or sites mentioned with their emissions", default=None)

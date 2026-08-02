from pydantic import BaseModel, Field
from typing import Optional

class ESGExtractionResult(BaseModel):
    company_name: str = Field(description="Official name of the company reporting the emissions")
    reporting_year: int = Field(description="The calendar or fiscal year for which emissions are reported")
    reporting_standard: Optional[str] = Field(description="Reporting standards/frameworks used (e.g., GHG Protocol, GRI, SASB, None)", default=None)
    scope1: Optional[float] = Field(description="Scope 1 direct greenhouse gas emissions in metric tons CO2e", default=None)
    units: str = Field(description="The standard unit of emissions, which should always be 'metric tons CO2e'", default="metric tons CO2e")

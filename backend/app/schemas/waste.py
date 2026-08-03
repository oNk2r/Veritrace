from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class WasteAnalysisRequest(BaseModel):
    business_name: str = Field(..., description="Name of the business generating waste")
    industry: str = Field(..., description="Industry sector of the business")
    waste_type: str = Field(..., description="Free-text description of the waste (e.g., 'used coffee powder')")
    description: str = Field(..., description="Additional details about the waste composition, moisture, storage")
    quantity: float = Field(..., description="Amount of waste generated")
    frequency: str = Field(..., description="Generation frequency (weekly, monthly, annually, one-time)")
    location: str = Field(..., description="City or specific site area (e.g., 'Pune')")
    current_disposal_method: str = Field(..., description="Current disposal route (landfill, incineration, composting, unknown)")
    image_url: Optional[str] = Field(None, description="Optional link to a uploaded image of the waste")

class ReuseOpportunity(BaseModel):
    opportunity_name: str = Field(..., description="Name of the second life route")
    process_description: str = Field(..., description="Description of the repurposing process")
    estimated_value_per_unit_inr: float = Field(..., description="Value per kg of waste material in INR")
    carbon_offset_factor: float = Field(..., description="Net carbon offset factor in kg CO2e saved per kg reused")
    suitability_score: float = Field(..., description="Suitability match rating out of 100")

class BusinessMatch(BaseModel):
    business_name: str = Field(..., description="Name of the receiving business")
    industry: str = Field(..., description="Industry of the buyer")
    location: str = Field(..., description="Simplified geographic area of the buyer")
    distance_km: float = Field(..., description="Calculated logistics distance in km")
    potential_monthly_revenue: float = Field(..., description="Estimated revenue generated per month in INR")
    carbon_saved_kg_monthly: float = Field(..., description="Net carbon emissions saved per month in kg CO2e")
    landfill_diverted_kg_monthly: float = Field(..., description="Amount of landfill avoided per month in kg")
    transportation_carbon_estimate_kg: float = Field(..., description="Carbon footprint of transport per month in kg CO2e")
    circular_economy_score: float = Field(..., description="Calculated circular economy match score out of 100")
    contact_person: str = Field(..., description="Buyer contact name")
    phone: str = Field(..., description="Buyer phone number")
    address: str = Field(..., description="Physical delivery address")

class WasteAnalysisResponse(BaseModel):
    success: bool = Field(default=True, description="Indicates successful analysis generation")
    id: Optional[int] = Field(None, description="Log ID from SQLite database")
    business_name: str
    industry: str
    waste_type: str
    waste_type_standard: str
    quantity: float
    frequency: str
    location: str
    current_disposal_method: str
    match_confidence: float
    top_opportunity: ReuseOpportunity
    other_opportunities: List[ReuseOpportunity] = []
    nearby_businesses: List[BusinessMatch]
    ai_explanation: str = Field(..., description="Detailed AI reasoning regarding compatibility and mapping")
    environmental_benefits: str = Field(..., description="AI evaluation of carbon offsets and landfill diversion benefits")
    financial_benefits: str = Field(..., description="AI evaluation of revenue potential vs disposal costs savings")
    suggested_next_steps: List[str] = Field(..., description="List of concrete operational guidelines")
    generated_outreach_email: str = Field(..., description="Outreach email template targeting the best matching buyer")

class WasteLogItem(BaseModel):
    id: int
    business_name: str
    industry: str
    waste_type: str
    waste_type_standard: str
    quantity: float
    frequency: str
    location: str
    current_disposal_method: str
    match_confidence: float
    top_opportunity_name: str
    buyer_name: str
    distance_km: float
    monthly_revenue: float
    carbon_saved_monthly: float
    landfill_diverted_monthly: float
    circular_economy_score: float
    created_at: str

class DashboardResponse(BaseModel):
    total_co2_saved: float
    total_landfill_diverted: float
    total_revenue_generated: float
    active_partnerships_count: int
    recent_logs: List[WasteLogItem]

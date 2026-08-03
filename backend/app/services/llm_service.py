import os
import logging
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError
from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.schemas.waste import WasteAnalysisRequest

logger = logging.getLogger(__name__)

class GeminiAdviceResponse(BaseModel):
    ai_explanation: str = Field(..., description="Concise explanation of circular matching science, NO title headers, maximum 2 paragraphs or bullet groups.")
    environmental_benefits: str = Field(..., description="Brief breakdown of carbon offsets and landfill diversion, NO title headers, maximum 3 bullet points.")
    financial_benefits: str = Field(..., description="Brief breakdown of revenue potential and tipping fees savings, NO title headers, maximum 3 bullet points.")
    suggested_next_steps: List[str] = Field(..., description="3-5 concrete operational next steps")
    generated_outreach_email: str = Field(..., description="Customized professional outreach email targeting the buyer contact person")

class LLMService:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set in environment variables.")
        
        # Initialize GenAI client. It automatically picks up GEMINI_API_KEY.
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = "gemini-2.5-flash"

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(APIError)
    )
    def _call_gemini_with_retry(self, prompt: str, system_instruction: str) -> types.GenerateContentResponse:
        """Invokes Gemini API with structured GeminiAdviceResponse output."""
        return self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=GeminiAdviceResponse,
                temperature=0.3,
            ),
        )

    def get_waste_advice(
        self,
        request: WasteAnalysisRequest,
        standard_material: str,
        top_match: Dict[str, Any]
    ) -> GeminiAdviceResponse:
        """Queries Gemini to generate detailed circular recommendations and custom outreach email templates."""
        if not self.api_key:
            logger.warning("Gemini API key is missing. Using local fallback generator.")
            return self._generate_fallback_advice(request, standard_material, top_match)

        system_instruction = (
            "You are ReSource AI, a world-class Circular Economy Decision Engine and Hackathon Mentor.\n"
            "Your task is to analyze a business's waste and the best local buyer matching calculations, "
            "then generate an extremely concise, high-impact executive summary and a custom outreach email.\n\n"
            "CRITICAL REASONING INSTRUCTIONS:\n"
            "1. DO NOT include any title headers (like #, ##, ###) in the ai_explanation, environmental_benefits, or financial_benefits fields. Start directly with the descriptions.\n"
            "2. Keep explanations very brief: 2-3 short sentences maximum. Use bullet lists instead of long prose.\n"
            "3. Briefly explain the material compatibility (e.g., 'Coffee grounds supply nitrogen to mushroom cultures').\n"
            "4. Personalize the outreach email template concisely using actual buyer contacts, logistics distance, and circular metrics."
        )

        user_prompt = (
            f"--- WASTE INTAKE DETAILS ---\n"
            f"Business Name: {request.business_name}\n"
            f"Industry: {request.industry}\n"
            f"Input Waste: '{request.waste_type}' (Mapped standard: {standard_material})\n"
            f"Description: {request.description}\n"
            f"Quantity Generated: {request.quantity} kg per {request.frequency}\n"
            f"Location: {request.location}\n"
            f"Current Disposal Route: {request.current_disposal_method}\n\n"
            f"--- HIGHEST VALUE CIRCULAR PARTNER MATCH ---\n"
            f"Buyer Business: {top_match['buyer_name']}\n"
            f"Buyer Industry: {top_match['industry']}\n"
            f"Logistics Distance: {top_match['distance_km']} km\n"
            f"Estimated Monthly Revenue: ₹{top_match['potential_monthly_revenue']:,}\n"
            f"Carbon Saved: {top_match['carbon_saved_kg_monthly']} kg CO2e/month\n"
            f"Landfill Diverted: {top_match['landfill_diverted_kg_monthly']} kg/month\n"
            f"Shipping Emissions: {top_match['transportation_carbon_estimate_kg']} kg CO2e/month\n"
            f"Circular Economy Index: {top_match['circular_economy_score']}/100\n"
            f"Buyer Contact Point: {top_match['contact_person']}\n"
            f"Contact Number: {top_match['phone']}\n"
            f"Delivery Location: {top_match['address']}\n"
            f"Opportunity: {top_match['opportunity']['opportunity_name']} - {top_match['opportunity']['process_description']}\n\n"
            f"Please apply circular logic to generate the response matching the schema."
        )

        try:
            response = self._call_gemini_with_retry(user_prompt, system_instruction)
            if response.text:
                return GeminiAdviceResponse.model_validate_json(response.text)
            else:
                raise ValueError("Received empty response from Gemini.")
        except Exception as e:
            logger.error(f"Error calling Gemini in LLMService: {str(e)}")
            return self._generate_fallback_advice(request, standard_material, top_match)

    def _generate_fallback_advice(
        self,
        request: WasteAnalysisRequest,
        standard_material: str,
        top_match: Dict[str, Any]
    ) -> GeminiAdviceResponse:
        """Fallback advice generator for offline or missing API key scenarios."""
        opp_name = top_match['opportunity']['opportunity_name']
        buyer_name = top_match['buyer_name']
        contact = top_match['contact_person']
        dist = top_match['distance_km']
        rev = top_match['potential_monthly_revenue']
        co2 = top_match['carbon_saved_kg_monthly']
        qty = top_match['landfill_diverted_kg_monthly']
        
        explanation = (
            f"The waste stream **{request.waste_type}** ({standard_material}) directly matches the requirements of **{buyer_name}** for **{opp_name}**.\n\n"
            f"* **Chemistry Match**: Clean, high-purity byproduct replaces virgin feedstocks.\n"
            f"* **Logistics**: Located **{dist} km** away, minimizing Scope 3 transportation footprint."
        )

        env_benefits = (
            f"* **Landfill Diverted**: **{qty:,} kg/month** kept out of municipal dumpsites.\n"
            f"* **Net Carbon Savings**: **{co2:,} kg CO2e/month** (transport emissions factored in)."
        )

        fin_benefits = (
            f"* **Direct Sales Revenue**: Estimated **₹{rev:,.2f}/month**.\n"
            f"* **Operational Savings**: Zero tipping fees or hauling costs."
        )

        steps = [
            f"Ensure {standard_material} is sorted cleanly at generation points.",
            f"Contact {contact} ({top_match['phone']}) to verify byproduct sample quality.",
            f"Setup collection schedule matching their {top_match['opportunity']['process_description']} process."
        ]

        email = (
            f"Subject: Circular supply partnership: {standard_material} matching | ReSource AI\n\n"
            f"Dear {contact},\n\n"
            f"I am writing from {request.business_name}. We generate {request.quantity} kg/{request.frequency} of {request.waste_type} ({standard_material}).\n\n"
            f"Our circular analysis shows that matching this with your {opp_name} operations at {buyer_name} would divert {qty:,} kg/month and offset {co2:,} kg of CO2e.\n\n"
            f"We would love to send you a sample of our byproduct. Let us know if you have time for a brief call next week to discuss logistics.\n\n"
            f"Best regards,\n\n"
            f"Operations Lead\n"
            f"{request.business_name}"
        )

        return GeminiAdviceResponse(
            ai_explanation=explanation,
            environmental_benefits=env_benefits,
            financial_benefits=fin_benefits,
            suggested_next_steps=steps,
            generated_outreach_email=email
        )

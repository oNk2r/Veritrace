import os
import logging
from typing import Optional
from google import genai
from google.genai import types
from google.genai.errors import APIError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.schemas.extraction import ESGExtractionResult

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        # Retrieve the API key from environment
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set in environment variables.")
        
        # Initialize the GenAI client. It automatically picks up GEMINI_API_KEY if present,
        # but passing it explicitly makes it robust.
        self.client = genai.Client(api_key=self.api_key)
        # Use the fast, accurate model for structured data extraction
        self.model_name = "gemini-2.5-flash"

    # Retry up to 3 times with exponential backoff for transient API errors (e.g. Rate Limits / 429)
    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(APIError)
    )
    def _call_gemini_with_retry(self, prompt: str, system_instruction: str) -> types.GenerateContentResponse:
        """Helper to invoke Gemini API with tenacity retry logic."""
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ESGExtractionResult,
                temperature=0.1,  # Low temperature for precise, deterministic extraction
            ),
        )
        return response

    def extract_esg_data(self, cleaned_text: str) -> Optional[ESGExtractionResult]:
        """
        Analyzes raw cleaned PDF text to extract structured ESG data conforming to
        ESGExtractionResult schema.
        """
        if not self.api_key:
            return {"error": "Gemini API key is missing. Please set GEMINI_API_KEY in backend/.env."}

        if not cleaned_text:
            return {"error": "No text provided for analysis."}

        system_instruction = (
            "You are an expert ESG and greenhouse gas emissions auditor. "
            "Your task is to analyze raw text extracted from a sustainability or ESG report, "
            "locate emissions disclosures, and output structured data.\n\n"
            "CRITICAL RULES FOR UNIT CONVERSION:\n"
            "You MUST normalize all emissions values to standard 'metric tons CO2e' (tCO2e / mtCO2e).\n"
            "If the report lists emissions in other units, convert them as follows:\n"
            "- If emissions are listed in 'Million metric tons', 'million tonnes', or 'Mt', multiply the value by 1,000,000.\n"
            "  Example: '2.4 Mt CO2e' or '2.4 million metric tons' must be output as 2400000.0\n"
            "- If emissions are listed in 'thousand metric tons', 'kilotons', or 'kt', multiply the value by 1,000.\n"
            "  Example: '144.96 kt' must be output as 144960.0\n"
            "- If emissions are listed in metric tons (tCO2e or mtCO2e), keep the original number.\n"
            "- Do not guess or extrapolate. If a metric or field is not mentioned in the text, leave it as null.\n\n"
            "SPECIFIC EMISSIONS EXTRACTION DETAILS:\n"
            "- scope1: Extract direct Scope 1 emissions.\n"
            "- scope2: Extract indirect Scope 2 emissions. Look for location-based and market-based numbers. If only a single Scope 2 number is given without specifying location/market, put it in both or location-based.\n"
            "- scope3: Extract Scope 3 category-wise breakdown if reported (categories 1 to 15, e.g. Category 1: Purchased goods and services, Category 6: Business travel). Convert category emissions to metric tons.\n"
            "- scope3_total: Extract the total Scope 3 emissions if explicitly reported, or sum the categories if the total is not explicit.\n"
            "- facilities: If the text details specific operational sites, data centers, offices, or plants along with their individual emissions, extract them.\n"
            "- reporting_standard: Note if they report under GHG Protocol, GRI, SASB, or other frameworks."
        )

        user_prompt = (
            f"Analyze the following extracted ESG report text and extract the required fields:\n\n"
            f"--- START OF TEXT ---\n"
            f"{cleaned_text}\n"
            f"--- END OF TEXT ---\n"
        )

        try:
            response = self._call_gemini_with_retry(user_prompt, system_instruction)
            
            # Since we set response_schema, response.text is guaranteed to be valid JSON matching ESGExtractionResult
            # We parse the Pydantic model directly from the JSON string
            if response.text:
                result = ESGExtractionResult.model_validate_json(response.text)
                return result
            else:
                logger.error("Gemini returned an empty response.")
                return {"error": "Received empty response from Gemini."}
                
        except APIError as e:
            logger.error(f"Gemini API Error: {str(e)}")
            return {"error": f"Gemini API Error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error during extraction: {str(e)}")
            return {"error": f"Failed to extract ESG data: {str(e)}"}

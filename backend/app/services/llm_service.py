import os
import logging
from typing import Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.schemas.extraction import ESGExtractionResult
from app.schemas.climatetrace import ClimateTraceCompanyEmissions
from app.schemas.comparison import ComparisonResult
from app.schemas.report import AIReportResult

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        # Load environment variables from the backend .env
        load_dotenv()
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

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(APIError)
    )
    def _call_gemini_report_with_retry(self, prompt: str, system_instruction: str) -> types.GenerateContentResponse:
        """Helper to call Gemini API for report generation."""
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=AIReportResult,
                temperature=0.2,  # Low temperature for strict factuality and neutral tone
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
            "locate direct emissions disclosures, and output structured data.\n\n"
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
            "- scope1: Extract direct Scope 1 emissions. Skip any indirect Scope 2 or value-chain Scope 3 disclosures.\n"
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

    def generate_verification_report(
        self,
        esg_data: ESGExtractionResult,
        ct_data: ClimateTraceCompanyEmissions,
        comp_result: ComparisonResult
    ) -> Optional[AIReportResult]:
        """
        Generates an objective explainable AI report analyzing ESG disclosures
        and Climate TRACE estimates.
        """
        if not self.api_key:
            return {"error": "Gemini API key is missing."}

        system_instruction = (
            "You are an expert, independent ESG auditor and climate scientist. "
            "Your task is to analyze the side-by-side comparison of a company's self-reported ESG disclosures "
            "and independent greenhouse gas estimates from Climate TRACE (satellite and physical asset models).\n\n"
            "CRITICAL FORMATTING & STRUCTURE RULES:\n"
            "- Do NOT generate long paragraphs. Use concise sections, bullet points, short phrases, and summaries.\n"
            "- You must return output that maps directly to the AIReportResult schema:\n"
            "  1. audit_verdict: A brief 1-2 sentence statement of overall discrepancy status.\n"
            "  2. evidence_summary: A bulleted list of the exact compared values, citing ESG and Climate TRACE figures.\n"
            "  3. key_findings: A bulleted list of the statistical facts, standards, and parity checks.\n"
            "  4. possible_causes: A bulleted list of technical and organizational causes for discrepancy (boundaries, timing, point-source methods).\n"
            "  5. confidence_explanation: A bulleted list outlining the confidence rating factors.\n"
            "  6. recommended_next_steps: A bulleted list of constructive, actionable next steps.\n"
            "  7. limitations: A bulleted list of contextual satellite and corporate limitations.\n"
            "  8. disclaimer: A short, standard legal disclaimer noting this is an estimate-based report.\n\n"
            "CRITICAL TONE RULES:\n"
            "1. You MUST maintain a strictly neutral, professional, and corporate tone. Never sound like a generic ChatGPT response.\n"
            "2. NEVER accuse the company of dishonesty, greenwashing, fraud, or misreporting. Use objective language. "
            "For example: 'The discrepancy potentially indicates differing organizational boundaries, such as regional subsidiary scope aggregation.'\n"
            "3. Base all explanations directly on the input evidence. Never fabricate causes. Explicitly state uncertainty when data is insufficient."
        )

        user_prompt = (
            f"Please generate the explainable AI report using the following inputs:\n\n"
            f"--- CORPORATE ESG DATA ---\n"
            f"{esg_data.model_dump_json(indent=2)}\n\n"
            f"--- CLIMATE TRACE DATA ---\n"
            f"{ct_data.model_dump_json(indent=2)}\n\n"
            f"--- MATHEMATICAL COMPARISON RESULTS ---\n"
            f"{comp_result.model_dump_json(indent=2)}\n\n"
        )

        try:
            response = self._call_gemini_report_with_retry(user_prompt, system_instruction)
            if response.text:
                result = AIReportResult.model_validate_json(response.text)
                return result
            else:
                logger.error("Gemini returned empty text for the report.")
                return {"error": "Received empty response for the AI report."}
        except APIError as e:
            logger.error(f"Gemini API Error during report generation: {str(e)}")
            return {"error": f"Gemini API Error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error during report generation: {str(e)}")
            return {"error": f"Failed to generate AI report: {str(e)}"}

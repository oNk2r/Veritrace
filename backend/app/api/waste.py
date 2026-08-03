import logging
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List
from app.schemas.waste import WasteAnalysisRequest, WasteAnalysisResponse, DashboardResponse, WasteLogItem
from app.services.calculator import CalculatorService
from app.services.llm_service import LLMService
from app.database import get_db_connection

router = APIRouter(prefix="/waste")
logger = logging.getLogger(__name__)

# Initialize services
calculator_service = CalculatorService()
llm_service = LLMService()

@router.post("/analyze", response_model=WasteAnalysisResponse)
async def analyze_waste(request: WasteAnalysisRequest):
    """
    Analyzes the user's business waste stream.
    Normalizes synonyms, looks up local business buyers, calculates metrics,
    queries Gemini for AI reasoning and outreach strategy, and stores the results in SQLite.
    """
    try:
        logger.info(f"Received waste analysis request for business: '{request.business_name}', waste: '{request.waste_type}'")
        
        # 1. Map to standard material ID
        standard_id = calculator_service.map_synonym(request.waste_type)
        if not standard_id:
            # Fallback local substring matching rules for robustness
            raw_lower = request.waste_type.lower()
            if "coffee" in raw_lower:
                standard_id = "coffee_grounds"
            elif "wood" in raw_lower or "saw" in raw_lower:
                standard_id = "sawdust"
            elif "textile" in raw_lower or "fabric" in raw_lower or "cotton" in raw_lower:
                standard_id = "textile_scraps"
            elif "plastic" in raw_lower or "bottle" in raw_lower:
                standard_id = "plastic_scrap"
            elif "glass" in raw_lower:
                standard_id = "glass_waste"
            elif "metal" in raw_lower or "iron" in raw_lower or "steel" in raw_lower:
                standard_id = "metal_scrap"
            elif "food" in raw_lower or "organic" in raw_lower or "kitchen" in raw_lower:
                standard_id = "food_waste"
            elif "concrete" in raw_lower or "debris" in raw_lower or "brick" in raw_lower:
                standard_id = "construction_debris"
            elif "husk" in raw_lower or "bagasse" in raw_lower or "agricultural" in raw_lower or "straw" in raw_lower:
                standard_id = "agricultural_waste"
            else:
                standard_id = "food_waste" # safe fallback

        # 2. Run calculations (logistical distance, carbon, revenue, circular score)
        calc_result = calculator_service.calculate_impacts(
            material_id=standard_id,
            quantity=request.quantity,
            frequency=request.frequency,
            location=request.location,
            current_disposal=request.current_disposal_method
        )
        
        waste_type_standard = calc_result["waste_type_standard"]
        matches = calc_result["matches"]
        all_opportunities = calc_result["all_opportunities"]

        # Ensure we have at least one match
        if not matches:
            raise ValueError("No matches generated from calculations.")

        top_match = matches[0]

        # 3. Query Gemini for AI reasoning, benefits analysis, and outreach email
        gemini_data = llm_service.get_waste_advice(request, waste_type_standard, top_match)

        # 4. Save analysis results to the SQLite database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO waste_logs (
                business_name, industry, waste_type, waste_type_standard, description,
                quantity, frequency, location, current_disposal_method, match_confidence,
                top_opportunity_name, buyer_name, distance_km, monthly_revenue,
                carbon_saved_monthly, landfill_diverted_monthly, circular_economy_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request.business_name,
            request.industry,
            request.waste_type,
            waste_type_standard,
            request.description,
            request.quantity,
            request.frequency,
            request.location,
            request.current_disposal_method,
            round(top_match["circular_economy_score"] / 100.0, 2),
            top_match["opportunity"]["opportunity_name"],
            top_match["buyer_name"],
            top_match["distance_km"],
            top_match["potential_monthly_revenue"],
            top_match["carbon_saved_kg_monthly"],
            top_match["landfill_diverted_kg_monthly"],
            top_match["circular_economy_score"]
        ))
        conn.commit()
        log_id = cursor.lastrowid
        conn.close()

        # 5. Build other opportunities list
        other_opps = []
        seen_opp_ids = {top_match["opportunity"]["opportunity_id"]}
        for opp in all_opportunities:
            if opp["opportunity_id"] not in seen_opp_ids:
                other_opps.append({
                    "opportunity_name": opp["opportunity_name"],
                    "process_description": opp["process_description"],
                    "estimated_value_per_unit_inr": opp["value_per_unit_inr"],
                    "carbon_offset_factor": 0.50, # default average
                    "suitability_score": opp["suitability_score"]
                })
                seen_opp_ids.add(opp["opportunity_id"])

        # Construct final API response
        return WasteAnalysisResponse(
            success=True,
            id=log_id,
            business_name=request.business_name,
            industry=request.industry,
            waste_type=request.waste_type,
            waste_type_standard=waste_type_standard,
            quantity=request.quantity,
            frequency=request.frequency,
            location=request.location,
            current_disposal_method=request.current_disposal_method,
            match_confidence=round(top_match["circular_economy_score"] / 100.0, 2),
            top_opportunity={
                "opportunity_name": top_match["opportunity"]["opportunity_name"],
                "process_description": top_match["opportunity"]["process_description"],
                "estimated_value_per_unit_inr": top_match["opportunity"]["value_per_unit_inr"],
                "carbon_offset_factor": 0.85 if standard_id == "coffee_grounds" else 0.60, # display estimate
                "suitability_score": top_match["opportunity"]["suitability_score"]
            },
            other_opportunities=other_opps,
            nearby_businesses=[
                {
                    "business_name": m["buyer_name"],
                    "industry": m["industry"],
                    "location": m["location"],
                    "distance_km": m["distance_km"],
                    "potential_monthly_revenue": m["potential_monthly_revenue"],
                    "carbon_saved_kg_monthly": m["carbon_saved_kg_monthly"],
                    "landfill_diverted_kg_monthly": m["landfill_diverted_kg_monthly"],
                    "transportation_carbon_estimate_kg": m["transportation_carbon_estimate_kg"],
                    "circular_economy_score": m["circular_economy_score"],
                    "contact_person": m["contact_person"],
                    "phone": m["phone"],
                    "address": m["address"]
                } for m in matches
            ],
            ai_explanation=gemini_data.ai_explanation,
            environmental_benefits=gemini_data.environmental_benefits,
            financial_benefits=gemini_data.financial_benefits,
            suggested_next_steps=gemini_data.suggested_next_steps,
            generated_outreach_email=gemini_data.generated_outreach_email
        )

    except ValueError as val_err:
        logger.error(f"Validation error in analyze_waste: {str(val_err)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        logger.error(f"Unexpected error in analyze_waste: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate analysis: {str(e)}"
        )

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard_metrics():
    """
    Fetches aggregate statistics and all logs from SQLite
    to build the history list and charts in the dashboard.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM waste_logs ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()

        recent_logs = []
        total_co2 = 0.0
        total_landfill = 0.0
        total_rev = 0.0
        buyers = set()

        for row in rows:
            recent_logs.append(WasteLogItem(
                id=row["id"],
                business_name=row["business_name"],
                industry=row["industry"],
                waste_type=row["waste_type"],
                waste_type_standard=row["waste_type_standard"],
                quantity=row["quantity"],
                frequency=row["frequency"],
                location=row["location"],
                current_disposal_method=row["current_disposal_method"],
                match_confidence=row["match_confidence"],
                top_opportunity_name=row["top_opportunity_name"],
                buyer_name=row["buyer_name"],
                distance_km=row["distance_km"],
                monthly_revenue=row["monthly_revenue"],
                carbon_saved_monthly=row["carbon_saved_monthly"],
                landfill_diverted_monthly=row["landfill_diverted_monthly"],
                circular_economy_score=row["circular_economy_score"],
                created_at=str(row["created_at"])
            ))
            total_co2 += row["carbon_saved_monthly"]
            total_landfill += row["landfill_diverted_monthly"]
            total_rev += row["monthly_revenue"]
            if row["buyer_name"]:
                buyers.add(row["buyer_name"])

        return DashboardResponse(
            total_co2_saved=round(total_co2, 1),
            total_landfill_diverted=round(total_landfill, 1),
            total_revenue_generated=round(total_rev, 2),
            active_partnerships_count=len(buyers),
            recent_logs=recent_logs
        )
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch metrics: {str(e)}"
        )

@router.delete("/logs/{log_id}", status_code=status.HTTP_200_OK)
async def delete_log(log_id: int):
    """Deletes a log entry by ID from the database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM waste_logs WHERE id = ?", (log_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Log entry not found")
        
        cursor.execute("DELETE FROM waste_logs WHERE id = ?", (log_id,))
        conn.commit()
        conn.close()
        return {"success": True, "detail": f"Log {log_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting log {log_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete log: {str(e)}"
        )

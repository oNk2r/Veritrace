from app.services.calculator import CalculatorService

def test_synonym_mapping():
    calc = CalculatorService()
    # Test mapped synonym
    assert calc.map_synonym("used coffee powder") == "coffee_grounds"
    assert calc.map_synonym("wood dust") == "sawdust"
    assert calc.map_synonym("garment waste") == "textile_scraps"
    # Test direct standard ID
    assert calc.map_synonym("coffee_grounds") == "coffee_grounds"

def test_distance_calculation():
    calc = CalculatorService()
    # Kothrud coordinates (18.5074, 73.8077) and Hadapsar coordinates (18.5089, 73.9260)
    dist = calc.calculate_distance(18.5074, 73.8077, 18.5089, 73.9260)
    assert 10.0 <= dist <= 16.0  # Hadapsar is roughly 13-14km from Kothrud

def test_impacts_calculation():
    calc = CalculatorService()
    # Analyze coffee grounds from Kothrud
    res = calc.calculate_impacts(
        material_id="coffee_grounds",
        quantity=300.0,
        frequency="weekly",
        location="Pune, Kothrud",
        current_disposal="landfill"
    )
    
    assert res["waste_type_standard"] == "Coffee Grounds"
    assert len(res["matches"]) > 0
    
    # Assert top match calculations
    top = res["matches"][0]
    assert top["buyer_name"] == "Green Mushroom Farm"
    assert top["distance_km"] > 0
    assert top["potential_monthly_revenue"] > 0
    assert top["carbon_saved_kg_monthly"] > 0
    assert top["landfill_diverted_kg_monthly"] > 0
    assert top["circular_economy_score"] > 80.0

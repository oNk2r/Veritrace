import csv
import logging
import math
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

class CalculatorService:
    def __init__(self):
        # Resolve data path relative to this service file
        self.data_dir = Path(__file__).resolve().parent.parent / "data"
        
        # Load datasets into in-memory structures
        self.materials = self._load_materials(self.data_dir / "materials.csv")
        self.synonyms = self._load_synonyms(self.data_dir / "waste_types.csv")
        self.reuse_opportunities = self._load_reuse_opportunities(self.data_dir / "reuse_opportunities.csv")
        self.industries = self._load_industries(self.data_dir / "industries.csv")
        self.business_directory = self._load_business_directory(self.data_dir / "business_directory.csv")
        self.carbon_factors = self._load_carbon_factors(self.data_dir / "carbon_factors.csv")
        self.transport_estimates = self._load_transport_estimates(self.data_dir / "transport_estimates.csv")

        logger.info(f"CalculatorService initialized. Loaded {len(self.materials)} materials, {len(self.business_directory)} business directory entries.")

    def _load_materials(self, path: Path) -> Dict[str, Dict[str, str]]:
        data = {}
        if not path.exists():
            logger.warning(f"File not found: {path}")
            return data
        with open(path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                data[row["material_id"].lower().strip()] = {
                    "name": row["material_name"].strip(),
                    "category": row["category"].strip(),
                    "description": row["description"].strip()
                }
        return data

    def _load_synonyms(self, path: Path) -> Dict[str, str]:
        data = {}
        if not path.exists():
            logger.warning(f"File not found: {path}")
            return data
        with open(path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                data[row["synonym"].lower().strip()] = row["standard_material_id"].lower().strip()
        return data

    def _load_reuse_opportunities(self, path: Path) -> Dict[str, List[Dict[str, Any]]]:
        data = {}
        if not path.exists():
            logger.warning(f"File not found: {path}")
            return data
        with open(path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                mat_id = row["material_id"].lower().strip()
                if mat_id not in data:
                    data[mat_id] = []
                data[mat_id].append({
                    "opportunity_id": row["opportunity_id"].strip(),
                    "opportunity_name": row["opportunity_name"].strip(),
                    "process_description": row["process_description"].strip(),
                    "value_per_unit_inr": float(row["value_per_unit_inr"]),
                    "suitability_score": float(row["suitability_score"])
                })
        return data

    def _load_industries(self, path: Path) -> Dict[str, List[str]]:
        data = {}
        if not path.exists():
            logger.warning(f"File not found: {path}")
            return data
        with open(path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                ind_id = row["industry_id"].lower().strip()
                wastes = [w.strip().lower() for w in row["typical_waste_produced"].split(",")]
                data[ind_id] = wastes
        return data

    def _load_business_directory(self, path: Path) -> List[Dict[str, Any]]:
        data = []
        if not path.exists():
            logger.warning(f"File not found: {path}")
            return data
        with open(path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append({
                    "business_id": row["business_id"].strip(),
                    "business_name": row["business_name"].strip(),
                    "industry": row["industry"].strip(),
                    "location": row["location"].strip(),
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "materials_accepted": [m.strip().lower() for m in row["materials_accepted"].split(",")],
                    "capacity_kg_week": float(row["capacity_kg_week"]),
                    "contact_person": row["contact_person"].strip(),
                    "phone": row["phone"].strip(),
                    "address": row["address"].strip()
                })
        return data

    def _load_carbon_factors(self, path: Path) -> Dict[Tuple[str, str], float]:
        data = {}
        if not path.exists():
            logger.warning(f"File not found: {path}")
            return data
        with open(path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                mat_id = row["material_id"].lower().strip()
                disp = row["disposal_method"].lower().strip()
                data[(mat_id, disp)] = float(row["carbon_factor_kg_co2_per_kg"])
        return data

    def _load_transport_estimates(self, path: Path) -> Dict[str, float]:
        data = {}
        if not path.exists():
            logger.warning(f"File not found: {path}")
            return data
        with open(path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                data[row["vehicle_type"].lower().strip()] = float(row["emissions_factor_kg_co2_per_km_tonne"])
        return data

    def map_synonym(self, query: str) -> Optional[str]:
        """Maps free text synonym to standard material ID."""
        normalized = query.lower().strip()
        # Direct synonym check
        if normalized in self.synonyms:
            return self.synonyms[normalized]
        # Direct material name check
        for mat_id, mat_info in self.materials.items():
            if normalized == mat_id or normalized == mat_info["name"].lower():
                return mat_id
        return None

    def get_coordinates_for_location(self, location: str) -> Tuple[float, float]:
        """Geocodes simple regional locations to lat/lon coordinates."""
        loc_lower = location.lower()
        if "kothrud" in loc_lower:
            return 18.5074, 73.8077
        elif "hadapsar" in loc_lower:
            return 18.5089, 73.9260
        elif "chakan" in loc_lower:
            return 18.7500, 73.8500
        elif "talegaon" in loc_lower:
            return 18.7300, 73.6800
        elif "hinjawadi" in loc_lower:
            return 18.5913, 73.7389
        elif "pimpri" in loc_lower:
            return 18.6298, 73.7997
        # Default FC Road, Pune
        return 18.5204, 73.8400

    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Haversine formula to compute distance in kilometers."""
        R = 6371.0 # Earth radius
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 1)

    def calculate_impacts(
        self,
        material_id: str,
        quantity: float,
        frequency: str,
        location: str,
        current_disposal: str
    ) -> Dict[str, Any]:
        """Calculates environmental and financial metrics for all matches."""
        # Normalize inputs
        mat_id = material_id.lower().strip()
        disp_lower = current_disposal.lower().strip()
        freq_lower = frequency.lower().strip()

        # Quantity monthly calculation
        if "week" in freq_lower:
            qty_monthly = quantity * 4.3333
        elif "month" in freq_lower:
            qty_monthly = quantity
        elif "year" in freq_lower:
            qty_monthly = quantity / 12.0
        else: # One-time
            qty_monthly = quantity

        # Get coordinates of origin
        lat_origin, lon_origin = self.get_coordinates_for_location(location)

        # Baseline disposal carbon factor
        cf_disposal = self.carbon_factors.get((mat_id, disp_lower), 0.50)
        # If not explicitly matched in factors, fallback based on method
        if (mat_id, disp_lower) not in self.carbon_factors:
            if "landfill" in disp_lower:
                cf_disposal = 0.70
            elif "incineration" in disp_lower:
                cf_disposal = 0.40
            else:
                cf_disposal = 0.15

        # Get opportunities for standard material
        opps = self.reuse_opportunities.get(mat_id, [])
        if not opps:
            # Create a default fallback opportunity if none exists
            opps = [{
                "opportunity_id": "generic_recycling",
                "opportunity_name": "General Recycling",
                "process_description": "Reprocessed into basic recycled feedstock",
                "value_per_unit_inr": 2.0,
                "suitability_score": 60.0
            }]

        # Get buyer directories that accept this material
        buyers = [b for b in self.business_directory if mat_id in b["materials_accepted"]]
        if not buyers:
            # Create a mock default buyer if directory is empty
            buyers = [{
                "business_id": "generic_buyer",
                "business_name": "Regional Recycler Ltd",
                "industry": "Recycling",
                "location": "Pune Outer",
                "latitude": 18.5204,
                "longitude": 73.8400,
                "contact_person": "Facility Manager",
                "phone": "+91 99999 99999",
                "address": "MIDC Industrial Area, Pune"
            }]

        transport_factor = self.transport_estimates.get("average_van", 0.20)

        # Match opportunities and buyers
        matches = []
        for buyer in buyers:
            # Calculate distance
            dist = self.calculate_distance(lat_origin, lon_origin, buyer["latitude"], buyer["longitude"])
            if dist <= 0:
                dist = 1.0 # Avoid divide by zero, represent local neighborhood
            
            # Transport Emissions = Tonnes * Distance * transport_factor
            transport_emissions_kg = (qty_monthly / 1000.0) * dist * transport_factor
            
            # For each opportunity, calculate financial & carbon savings
            for opp in opps:
                # Find carbon reuse factor
                # Some opportunities have specific carbon factors, otherwise look up composting/recycling
                cf_key = (mat_id, opp["opportunity_id"])
                # Fallback to a general composting/recycling factor
                cf_reuse = self.carbon_factors.get(cf_key, -0.50)
                if cf_key not in self.carbon_factors:
                    # Look up by mapping opportunity IDs to names in factors
                    for (m, d), val in self.carbon_factors.items():
                        if m == mat_id and (d in opp["opportunity_id"] or opp["opportunity_id"] in d):
                            cf_reuse = val
                            break

                # Net Carbon Saved = Qty * (Disposal_Factor - Reuse_Factor) - Transport
                # Note: Reuse factors are negative in csv to show absorption/offset, e.g., -0.85.
                # So (CF_disposal - CF_reuse) is (0.75 - (-0.85)) = 1.60.
                net_savings_per_kg = cf_disposal - cf_reuse
                carbon_saved_kg = (qty_monthly * net_savings_per_kg) - transport_emissions_kg

                # Potential Revenue = Qty * Value
                revenue_monthly = qty_monthly * opp["value_per_unit_inr"]

                # Landfill avoided
                landfill_diverted = qty_monthly if "landfill" in disp_lower else 0.0

                # Calculate Circular Economy Score
                # 40% Suitability, 30% Distance, 30% Carbon Efficiency
                distance_score = max(0.0, 100.0 - (dist * 2.0))
                
                # Carbon saved per kg of waste, maxed at 2.0 kg/kg -> 100 score
                carbon_efficiency = (carbon_saved_kg / qty_monthly) if qty_monthly > 0 else 0.0
                carbon_score = max(0.0, min(100.0, carbon_efficiency * 50.0))

                circular_score = (0.4 * opp["suitability_score"]) + (0.3 * distance_score) + (0.3 * carbon_score)
                circular_score = round(max(0.0, min(100.0, circular_score)), 1)

                matches.append({
                    "buyer_name": buyer["business_name"],
                    "industry": buyer["industry"],
                    "location": buyer["location"],
                    "distance_km": dist,
                    "potential_monthly_revenue": round(revenue_monthly, 2),
                    "carbon_saved_kg_monthly": round(carbon_saved_kg, 1),
                    "landfill_diverted_kg_monthly": round(landfill_diverted, 1),
                    "transportation_carbon_estimate_kg": round(transport_emissions_kg, 2),
                    "circular_economy_score": circular_score,
                    "contact_person": buyer["contact_person"],
                    "phone": buyer["phone"],
                    "address": buyer["address"],
                    "opportunity": opp
                })

        # Sort matches by circular economy score descending
        matches.sort(key=lambda x: x["circular_economy_score"], reverse=True)

        # Standard material display name
        mat_info = self.materials.get(mat_id, {"name": material_id.capitalize(), "category": "General", "description": ""})

        return {
            "waste_type_standard": mat_info["name"],
            "category": mat_info["category"],
            "matches": matches,
            "all_opportunities": opps
        }

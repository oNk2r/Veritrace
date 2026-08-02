import httpx
import asyncio
import logging
from typing import List, Optional, Dict, Tuple
from app.schemas.climatetrace import ClimateTraceFacility, ClimateTraceCompanyEmissions

logger = logging.getLogger(__name__)

class ClimateTraceService:
    def __init__(self):
        self.base_url = "https://api.climatetrace.org"
        # In-memory asynchronous cache with key structure: (company_name_lower, year) -> ClimateTraceCompanyEmissions
        self._cache: Dict[Tuple[str, int], Optional[ClimateTraceCompanyEmissions]] = {}
        # Shared client instance (timeout configured to 10 seconds)
        self.timeout = httpx.Timeout(10.0, connect=5.0)

    def _clean_company_name(self, name: str) -> str:
        """Removes corporate suffixes to improve query matching rates on external APIs."""
        suffixes = {
            "corporation", "corp", "incorporated", "inc", 
            "limited", "ltd", "public limited company", "plc",
            "company", "co", "gmbh", "s.a.", "sa", "group", "holdings"
        }
        words = name.lower().strip().split()
        if not words:
            return name
            
        # Strip trailing punctuation like commas or periods from words
        cleaned_words = [w.rstrip(".,") for w in words]
        # Remove matching corporate words
        filtered_words = [w for w in cleaned_words if w not in suffixes]
        
        if not filtered_words:
            return name
        return " ".join(filtered_words).strip("., ")

    async def search_company(self, client: httpx.AsyncClient, company_name: str) -> Optional[Dict]:
        """
        Queries the Climate TRACE v7 /owners endpoint to find matching owners.
        Has a fallback that tries cleaned (suffix-free) names if the initial query fails.
        """
        search_names = [company_name, self._clean_company_name(company_name)]
        # De-duplicate names if cleaning didn't change anything
        search_names = list(dict.fromkeys(search_names))
        
        for name in search_names:
            url = f"{self.base_url}/v7/owners"
            params = {"name": name, "limit": 10}
            try:
                logger.info(f"Searching Climate TRACE owners with name: '{name}'")
                response = await client.get(url, params=params, timeout=self.timeout)
                response.raise_for_status()
                data = response.json()
                
                if data and len(data) > 0:
                    # Look for exact case-insensitive matches first
                    for candidate in data:
                        if candidate.get("name", "").lower() == name.lower():
                            logger.info(f"Found exact Climate TRACE owner match: {candidate}")
                            return candidate
                            
                    # Fallback to the first matching candidate if no exact match
                    logger.info(f"Using first Climate TRACE owner candidate: {data[0]}")
                    return data[0]
            except Exception as e:
                logger.error(f"Error querying Climate TRACE owners search for '{name}': {str(e)}")
                
        return None

    async def get_company_data(self, company_name: str, year: int) -> Optional[ClimateTraceCompanyEmissions]:
        """
        Coordinates the lookup for a company and compiles its emissions and facility data.
        Leverages an in-memory cache to skip duplicate API calls.
        """
        cache_key = (company_name.lower().strip(), year)
        if cache_key in self._cache:
            logger.info(f"Cache hit for Climate TRACE data: {cache_key}")
            return self._cache[cache_key]

        async with httpx.AsyncClient() as client:
            # Step 1: Find company / owner ID
            owner_info = await self.search_company(client, company_name)
            if not owner_info:
                logger.warning(f"Company '{company_name}' could not be resolved in Climate TRACE.")
                self._cache[cache_key] = None
                return None

            owner_id = owner_info["id"]
            owner_name = owner_info["name"]
            logger.info(f"Resolved '{company_name}' to ID: {owner_id} ({owner_name})")

            # Step 2: Fetch aggregate emissions and facility list concurrently
            emissions_url = f"{self.base_url}/v7/sources/emissions"
            sources_url = f"{self.base_url}/v7/sources"
            params = {"ownerIds": owner_id, "year": year}

            try:
                emissions_task = client.get(emissions_url, params=params, timeout=self.timeout)
                sources_task = client.get(sources_url, params=params, timeout=self.timeout)

                emissions_res, sources_res = await asyncio.gather(emissions_task, sources_task)
                
                emissions_res.raise_for_status()
                sources_res.raise_for_status()

                emissions_data = emissions_res.json()
                sources_data = sources_res.json()

            except Exception as e:
                logger.error(f"Failed to fetch data for owner {owner_id} from Climate TRACE: {str(e)}")
                return None

            # Step 3: Parse aggregate total emissions (in metric tons)
            total_emissions = 0.0
            if emissions_data and "totals" in emissions_data:
                summaries = emissions_data["totals"].get("summaries", [])
                for summary in summaries:
                    if summary.get("gas") == "co2e_100yr":
                        total_emissions = float(summary.get("emissionsQuantity", 0.0))
                        break

            # Step 4: Parse granular facility list
            facilities: List[ClimateTraceFacility] = []
            if sources_data and isinstance(sources_data, list):
                for source in sources_data:
                    # Extract coordinates if centroid exists
                    centroid = source.get("centroid", {})
                    lat = float(centroid["latitude"]) if centroid and "latitude" in centroid else None
                    lon = float(centroid["longitude"]) if centroid and "longitude" in centroid else None
                    
                    facility = ClimateTraceFacility(
                        id=int(source["id"]),
                        name=str(source["name"]),
                        sector=str(source["sector"]),
                        subsector=str(source["subsector"]),
                        country=str(source["country"]),
                        emissions=float(source.get("emissionsQuantity", 0.0)),
                        year=int(source["year"]),
                        latitude=lat,
                        longitude=lon
                    )
                    facilities.append(facility)

            # Fallback: if aggregate emissions came back as 0.0 but we have facility-level emissions, sum them up
            if total_emissions == 0.0 and facilities:
                total_emissions = sum(f.emissions for f in facilities)
                logger.info(f"Aggregated total emissions from facilities: {total_emissions} tons")

            result = ClimateTraceCompanyEmissions(
                company_id=owner_id,
                company_name=owner_name,
                year=year,
                total_emissions=total_emissions,
                facilities=facilities
            )

            # Store in cache
            self._cache[cache_key] = result
            return result

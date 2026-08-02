import difflib
import logging
from typing import List, Optional, Set
from app.schemas.extraction import ESGExtractionResult
from app.schemas.climatetrace import ClimateTraceCompanyEmissions
from app.schemas.comparison import ComparisonResult, FacilityComparison, UnmatchedFacility

logger = logging.getLogger(__name__)

class ComparisonEngine:
    @staticmethod
    def _calculate_similarity(str1: str, str2: str) -> float:
        """Calculates name similarity ratio using difflib SequenceMatcher."""
        if not str1 or not str2:
            return 0.0
        return difflib.SequenceMatcher(None, str1.lower().strip(), str2.lower().strip()).ratio()

    @staticmethod
    def compare_data(esg_data: ESGExtractionResult, ct_data: ClimateTraceCompanyEmissions) -> ComparisonResult:
        """
        Executes strict mathematical comparisons and alignment between corporate ESG data
        and Climate TRACE estimated emissions.
        """
        esg_year = esg_data.reporting_year
        ct_year = ct_data.year
        reporting_year_mismatch = esg_year != ct_year

        esg_company = esg_data.company_name
        ct_company = ct_data.company_name

        # Scope 1 Comparison calculations (Climate TRACE estimates direct point source emissions)
        esg_scope1 = esg_data.scope1
        ct_scope1 = ct_data.total_emissions

        scope1_diff = None
        scope1_diff_pct = None

        if esg_scope1 is not None:
            scope1_diff = float(esg_scope1 - ct_scope1)
            if esg_scope1 > 0:
                scope1_diff_pct = float((scope1_diff / esg_scope1) * 100)
            else:
                scope1_diff_pct = 0.0

        # Facility matching & alignment
        matched_facilities: List[FacilityComparison] = []
        unmatched_facilities: List[UnmatchedFacility] = []
        missing_information: List[str] = []

        esg_facs = esg_data.facilities or []
        ct_facs = ct_data.facilities or []

        # Maintain a set of unmatched Climate TRACE facility IDs
        unmatched_ct_ids = {f.id for f in ct_facs}
        ct_facs_by_id = {f.id: f for f in ct_facs}

        # Threshold for pairing facility names (0.45 chosen to handle loose matching e.g. 'Dublin Data Center' vs 'Dublin Power Station')
        SIM_THRESHOLD = 0.45

        for esg_fac in esg_facs:
            best_match_id = None
            best_match_score = -1.0

            for ct_id in unmatched_ct_ids:
                ct_fac = ct_facs_by_id[ct_id]
                score = ComparisonEngine._calculate_similarity(esg_fac.name, ct_fac.name)
                
                # Check for direct substring match for fallback
                if esg_fac.name.lower() in ct_fac.name.lower() or ct_fac.name.lower() in esg_fac.name.lower():
                    # Boost score if substring match is present
                    score = max(score, 0.6)

                if score > best_match_score and score >= SIM_THRESHOLD:
                    best_match_score = score
                    best_match_id = ct_id

            if best_match_id is not None:
                # Successfully matched
                ct_fac = ct_facs_by_id[best_match_id]
                unmatched_ct_ids.remove(best_match_id)

                fac_diff = None
                fac_diff_pct = None
                esg_em = esg_fac.emissions

                if esg_em is not None:
                    fac_diff = float(esg_em - ct_fac.emissions)
                    if esg_em > 0:
                        fac_diff_pct = float((fac_diff / esg_em) * 100)
                    else:
                        fac_diff_pct = 0.0

                matched_facilities.append(FacilityComparison(
                    esg_name=esg_fac.name,
                    climatetrace_name=ct_fac.name,
                    esg_emissions=esg_em,
                    climatetrace_emissions=ct_fac.emissions,
                    difference=fac_diff,
                    difference_percentage=fac_diff_pct,
                    match_score=best_match_score
                ))
                
                if esg_em is None:
                    missing_information.append(
                        f"ESG facility '{esg_fac.name}' does not list explicit emissions values."
                    )
            else:
                # No match in Climate TRACE
                unmatched_facilities.append(UnmatchedFacility(
                    name=esg_fac.name,
                    emissions=esg_fac.emissions or 0.0,
                    source="ESG"
                ))
                missing_information.append(
                    f"ESG facility '{esg_fac.name}' could not be matched with any facility in Climate TRACE."
                )

        # Remaining unmatched Climate TRACE sources
        for ct_id in unmatched_ct_ids:
            ct_fac = ct_facs_by_id[ct_id]
            unmatched_facilities.append(UnmatchedFacility(
                name=ct_fac.name,
                emissions=ct_fac.emissions,
                source="ClimateTRACE",
                latitude=ct_fac.latitude,
                longitude=ct_fac.longitude
            ))
            missing_information.append(
                f"Climate TRACE facility '{ct_fac.name}' ({ct_fac.emissions} tons) is not listed in the ESG report."
            )

        # Coverage metric calculation
        total_ct_count = len(ct_facs)
        matched_count = len(matched_facilities)
        coverage_pct = 100.0
        if total_ct_count > 0:
            coverage_pct = float((matched_count / total_ct_count) * 100)

        # Log high-level missing details
        if esg_scope1 is None:
            missing_information.append("Scope 1 emissions are not reported in the ESG report.")
        if esg_data.scope2 is None or (esg_data.scope2.location_based is None and esg_data.scope2.market_based is None):
            missing_information.append("Scope 2 emissions are not fully reported in the ESG report.")
        if not esg_data.scope3:
            missing_information.append("Scope 3 emissions breakdown is missing in the ESG report.")
        if reporting_year_mismatch:
            missing_information.append(
                f"Reporting year mismatch: Comparing ESG report ({esg_year}) with Climate TRACE estimate ({ct_year})."
            )

        # Confidence score calculation
        confidence = 1.0

        if reporting_year_mismatch:
            confidence -= 0.20  # Significant penalty for year mismatch
            
        if not esg_data.reporting_standard or esg_data.reporting_standard.lower() == "none":
            confidence -= 0.10  # Mild penalty for lack of reporting frameworks
            
        if esg_scope1 is None:
            confidence -= 0.20  # Big penalty if comparison is impossible
        elif scope1_diff_pct is not None:
            abs_diff = abs(scope1_diff_pct)
            if abs_diff > 50:
                confidence -= 0.15  # Large discrepancy penalty
            elif abs_diff > 20:
                confidence -= 0.08  # Moderate discrepancy penalty

        # Facility alignment deductions
        if total_ct_count > 0:
            if not esg_facs:
                confidence -= 0.20  # Complete reporting gap on facilities
            elif coverage_pct < 50.0:
                confidence -= 0.10  # Low coverage penalty

        # Clamp confidence score to range [0.0, 1.0] and round to 2 decimals
        confidence_score = float(max(0.0, min(1.0, confidence)))
        confidence_score = round(confidence_score, 2)

        return ComparisonResult(
            reporting_year_mismatch=reporting_year_mismatch,
            esg_year=esg_year,
            climatetrace_year=ct_year,
            esg_company_name=esg_company,
            climatetrace_company_name=ct_company,
            esg_scope1=esg_scope1,
            climatetrace_scope1_estimate=ct_scope1,
            scope1_difference=scope1_diff,
            scope1_difference_percentage=scope1_diff_pct,
            matched_facilities=matched_facilities,
            unmatched_facilities=unmatched_facilities,
            coverage_percentage=coverage_pct,
            missing_information=missing_information,
            confidence_score=confidence_score
        )

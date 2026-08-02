import logging
from typing import List, Optional
from app.schemas.extraction import ESGExtractionResult
from app.schemas.climatetrace import ClimateTraceCompanyEmissions
from app.schemas.comparison import ComparisonResult

logger = logging.getLogger(__name__)

class ComparisonEngine:
    @staticmethod
    def compare_data(esg_data: ESGExtractionResult, ct_data: ClimateTraceCompanyEmissions) -> ComparisonResult:
        """
        Executes strict mathematical comparisons and alignment between corporate ESG Scope 1 disclosures
        and Climate TRACE estimated Scope 1 emissions.
        """
        esg_year = esg_data.reporting_year
        ct_year = ct_data.year
        reporting_year_mismatch = esg_year != ct_year

        esg_company = esg_data.company_name
        ct_company = ct_data.company_name

        # Scope 1 Comparison calculations
        esg_scope1 = esg_data.scope1
        ct_scope1 = ct_data.total_emissions

        scope1_diff = None
        scope1_diff_pct = None
        missing_information: List[str] = []

        if esg_scope1 is not None:
            scope1_diff = float(esg_scope1 - ct_scope1)
            if esg_scope1 > 0:
                scope1_diff_pct = float((scope1_diff / esg_scope1) * 100)
            else:
                scope1_diff_pct = 0.0
        else:
            missing_information.append("Scope 1 direct emissions are not reported in the ESG report.")

        # Log high-level anomalies
        if ct_scope1 == 0.0:
            missing_information.append("Climate TRACE has no record of emissions for this company or year.")
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
                confidence -= 0.20  # Large discrepancy penalty
            elif abs_diff > 20:
                confidence -= 0.10  # Moderate discrepancy penalty

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
            missing_information=missing_information,
            confidence_score=confidence_score
        )

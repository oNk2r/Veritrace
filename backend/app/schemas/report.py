from pydantic import BaseModel, Field

class AIReportResult(BaseModel):
    audit_verdict: str = Field(description="A structured verdict summarizing the discrepancy severity (e.g. Aligned, Moderate Variance, High Variance) and verification outcome.")
    evidence_summary: str = Field(description="Bullet points summarizing the exact ESG disclosed figures vs. Climate TRACE figures compared.")
    key_findings: str = Field(description="Bullet points outlining the core facts (reporting standard match, year parity match, etc.).")
    possible_causes: str = Field(description="Bullet points outlining possible objective reasons for discrepancies (organizational boundaries, aggregation differences, or timing).")
    confidence_explanation: str = Field(description="Bullet points explaining the confidence score rating factors.")
    recommended_next_steps: str = Field(description="Bullet points of constructive, actionable auditing next steps.")
    limitations: str = Field(description="Bullet points detailing the constraints of satellite sensors vs corporate reporting scopes.")
    disclaimer: str = Field(description="A standard auditing disclaimer noting that this is an estimate-based report.")

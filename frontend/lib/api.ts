import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- ESG Extraction Types ---
export interface ESGExtractionResult {
  company_name: string;
  reporting_year: number;
  reporting_standard?: string;
  scope1?: number;
  units: string;
}

// --- Climate TRACE Types ---
export interface ClimateTraceCompanyEmissions {
  company_id: string;
  company_name: string;
  year: number;
  total_emissions: number;
}

// --- Comparison Types ---
export interface ComparisonResult {
  reporting_year_mismatch: boolean;
  esg_year: number;
  climatetrace_year: number;
  esg_company_name: string;
  climatetrace_company_name: string;
  esg_scope1?: number;
  climatetrace_scope1_estimate: number;
  scope1_difference?: number;
  scope1_difference_percentage?: number;
  missing_information: string[];
  confidence_score: number;
}

// --- AI Report Types ---
export interface AIReportResult {
  audit_verdict: string;
  evidence_summary: string;
  key_findings: string;
  possible_causes: string;
  confidence_explanation: string;
  recommended_next_steps: string;
  limitations: string;
  disclaimer: string;
}

// --- API Response Type ---
export interface UploadResponse {
  success: boolean;
  filename?: string;
  pages?: number;
  characters?: number;
  esg_data?: ESGExtractionResult;
  climatetrace_data?: ClimateTraceCompanyEmissions;
  comparison?: ComparisonResult;
  report?: AIReportResult;
  message?: string;
}

export async function uploadPDF(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post<UploadResponse>(`${API_URL}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

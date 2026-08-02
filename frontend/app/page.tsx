"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  Loader2, 
  X,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Building2,
  HelpCircle,
  BarChart3,
  ArrowRight,
  Info,
  Check,
  AlertTriangle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from "recharts";
import { uploadPDF, UploadResponse } from "@/lib/api";

const ANALYSIS_STEPS = [
  "Uploading PDF",
  "Extracting ESG Data",
  "Running AI Verification",
  "Comparing Against Benchmarks",
  "Generating Report"
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "analyzing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [resultData, setResultData] = useState<UploadResponse | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files are allowed.");
      setFile(null);
      setUploadStatus("error");
      setResultData(null);
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setUploadStatus("idle");
    setAnalysisStep(0);
    setProgressPercent(0);
    setResultData(null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const triggerChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setUploadStatus("idle");
    setErrorMessage(null);
    setAnalysisStep(0);
    setProgressPercent(0);
    setResultData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startAnalysisSimulation = (response: UploadResponse) => {
    const steps = [
      { step: 1, percent: 40, delay: 1000 },
      { step: 2, percent: 65, delay: 1000 },
      { step: 3, percent: 85, delay: 800 },
      { step: 4, percent: 100, delay: 600 }
    ];

    let currentPromise = Promise.resolve();

    steps.forEach(({ step, percent, delay }) => {
      currentPromise = currentPromise.then(() => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            setAnalysisStep(step);
            setProgressPercent(percent);
            resolve();
          }, delay);
        });
      });
    });

    currentPromise.then(() => {
      setTimeout(() => {
        setResultData(response);
        setUploadStatus("success");
      }, 500);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please select a PDF.");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("analyzing");
    setErrorMessage(null);
    setAnalysisStep(0);
    setProgressPercent(15);
    setResultData(null);

    try {
      const response = await uploadPDF(file);
      if (response.success) {
        startAnalysisSimulation(response);
      } else {
        setUploadStatus("error");
        setErrorMessage(response.message || "Upload failed.");
      }
    } catch (error: any) {
      setUploadStatus("error");
      if (!error.response) {
        setErrorMessage("Unable to connect to server.");
      } else {
        setErrorMessage(error.response.data?.error || "An error occurred during file upload.");
      }
    }
  };

  // Helper to load standard demo file
  const handleTryDemo = async () => {
    setUploadStatus("analyzing");
    setErrorMessage(null);
    setAnalysisStep(0);
    setProgressPercent(15);
    setResultData(null);
    
    // Simulate loading the factsheet
    try {
      // Create a dummy File object for representation
      const dummyFile = new File(["dummy content"], "microsoft_factsheet_2024.pdf", { type: "application/pdf" });
      setFile(dummyFile);

      // Trigger standard API upload (it already parses the default saved pdf backend-side)
      const response = await uploadPDF(dummyFile);
      if (response.success) {
        startAnalysisSimulation(response);
      } else {
        setUploadStatus("error");
        setErrorMessage(response.message || "Demo loading failed.");
      }
    } catch (error: any) {
      setUploadStatus("error");
      setErrorMessage("Error launching demo. Ensure the backend server is running.");
    }
  };

  const getScope1ChartData = () => {
    if (!resultData?.esg_data || !resultData?.climatetrace_data) return [];
    return [
      {
        name: "ESG Disclosed",
        value: resultData.esg_data.scope1 || 0,
        color: "#10B981"
      },
      {
        name: "Climate TRACE",
        value: resultData.climatetrace_data.total_emissions || 0,
        color: "#3B82F6"
      }
    ];
  };

  const getDiscrepancyBadge = (pct: number | undefined) => {
    if (pct === undefined) return <span className="text-zinc-500">-</span>;
    const abs = Math.abs(pct);
    if (abs < 5) {
      return (
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
          Low Variance
        </span>
      );
    } else if (abs < 25) {
      return (
        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
          Moderate Variance
        </span>
      );
    } else {
      return (
        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
          Significant Variance
        </span>
      );
    }
  };

  const getStatusText = (pct: number | undefined) => {
    if (pct === undefined) return "Unknown";
    const abs = Math.abs(pct);
    if (abs < 5) return "Aligned";
    if (abs < 25) return "Moderate Discrepancy";
    return "Significant Discrepancy";
  };

  // Helper to split bullet points in AI responses safely
  const renderBullets = (text: string | undefined) => {
    if (!text) return null;
    // Split by newlines and filter out empty strings or titles
    const items = text.split("\n").map(t => t.replace(/^[•\-\*\s]+/, "").trim()).filter(Boolean);
    return (
      <ul className="space-y-2 list-none text-zinc-300 text-xs leading-relaxed font-normal">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-[#10B981] font-bold shrink-0 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#F8FAFC] flex flex-col font-sans antialiased selection:bg-emerald-500/20">
      
      {/* Header Bar */}
      <header className="border-b border-zinc-900 bg-[#090D1A]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-[#10B981] flex items-center justify-center bg-[#0B132B]">
            <span className="w-3.5 h-3.5 rounded border border-[#10B981] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-sm bg-[#10B981]"></span>
            </span>
          </div>
          <span className="font-bold text-sm tracking-tight text-white uppercase">
            Veritrace
          </span>
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider px-2 py-0.5 border border-zinc-800 rounded bg-zinc-900/40">
            Explainable AI Auditor
          </span>
        </div>

        {resultData && (
          <button
            onClick={handleRemoveFile}
            className="text-xs font-semibold text-zinc-400 bg-[#090D1A] hover:text-white hover:bg-zinc-800/40 border border-zinc-800 px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="size-3.5" />
            New Audit
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col justify-center">
        
        {/* State 1: Upload View & Landing */}
        {uploadStatus !== "success" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-10 w-full animate-in fade-in duration-300">
            
            {/* Landing: What is Veritrace? (Left Column) */}
            <div className="flex flex-col gap-6 lg:pr-6">
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-[#10B981] tracking-wider uppercase bg-[#10B981]/10 px-3 py-1.5 rounded-full border border-[#10B981]/20 self-start">
                  Landing → What is Veritrace?
                </span>
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl mt-1 leading-none">
                  Explainable AI Sustainability Auditor
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-[500px] mt-2 font-normal">
                  Veritrace cross-examines corporate ESG direct Scope 1 disclosures against Al Gore's independent Climate TRACE satellite estimates. 
                </p>
              </div>

              {/* Value Proposition Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="bg-[#090D1A]/50 border border-zinc-850 p-5 rounded-xl flex flex-col gap-1.5">
                  <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 self-start">
                    <Building2 className="size-5" />
                  </div>
                  <span className="text-xs font-bold text-white mt-1">Cross-Company Check</span>
                  <span className="text-[11px] text-zinc-500 leading-normal font-normal">
                    Fuzzy owner resolution matches company names with Climate TRACE registry entities.
                  </span>
                </div>

                <div className="bg-[#090D1A]/50 border border-zinc-850 p-5 rounded-xl flex flex-col gap-1.5">
                  <div className="p-2 rounded bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] self-start">
                    <ShieldAlert className="size-5" />
                  </div>
                  <span className="text-xs font-bold text-white mt-1">Explainable Justifications</span>
                  <span className="text-[11px] text-zinc-500 leading-normal font-normal">
                    Details factual explanations for discrepancies (subsidiary boundaries, point sources) neutrally.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2">
                <Info className="size-4 text-zinc-500 shrink-0" />
                <span>Never accuses companies. Highlights points requiring manual verification.</span>
              </div>
            </div>

            {/* Upload: What report am I analyzing? (Right Column) */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase self-start">
                Upload → What report am I analyzing?
              </span>

              <div className="w-full bg-[#090D1A]/70 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 backdrop-blur-md">
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleInputChange} 
                  accept=".pdf" 
                  className="hidden" 
                />

                {!file ? (
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerChooseFile}
                    className={`border border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[170px] ${
                      isDragActive 
                        ? "border-[#10B981] bg-[#10B981]/5" 
                        : "border-zinc-800 bg-[#060A14]/50 hover:border-[#10B981] hover:bg-zinc-800/10"
                    }`}
                  >
                    <Upload className="size-6 text-zinc-500 mb-3" />
                    <span className="text-xs font-semibold text-white mb-1">
                      Drag & Drop ESG Report PDF
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Standard corporate PDF files supported
                    </span>
                  </div>
                ) : (
                  /* Metadata card: What report am I analyzing? */
                  <div className="border border-zinc-800 bg-[#060A14] rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20">
                        <FileText className="size-6" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-[240px]">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">
                          {formatFileSize(file.size)} • PDF Document
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={handleRemoveFile} 
                      disabled={uploadStatus === "analyzing"}
                      className="text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg p-1 transition-all cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}

                {/* Primary Upload Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploadStatus === "analyzing"}
                    className={`h-12 w-full rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      uploadStatus === "analyzing"
                        ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                        : "bg-[#10B981] hover:bg-[#10B981]/90 text-[#030712] font-semibold"
                    }`}
                  >
                    {uploadStatus === "analyzing" ? (
                      <>
                        <Loader2 className="size-4 animate-spin text-zinc-500" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Selected Report"
                    )}
                  </button>

                  {!file && uploadStatus !== "analyzing" && (
                    <button
                      onClick={handleTryDemo}
                      className="h-12 w-full rounded-xl text-xs font-bold border border-zinc-800 hover:border-zinc-700 text-[#10B981] hover:bg-[#10B981]/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="size-3.5" />
                      Try Microsoft Factsheet Demo
                    </button>
                  )}
                </div>

                {/* Simulated Steps Loader */}
                {uploadStatus === "analyzing" && (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#10B981] h-full transition-all duration-300 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#10B981] font-semibold">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>{ANALYSIS_STEPS[analysisStep]}</span>
                    </div>
                  </div>
                )}

                {/* Fail Alert */}
                {uploadStatus === "error" && errorMessage && (
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 flex items-center gap-3 text-rose-500 text-xs font-semibold">
                    <AlertCircle className="size-5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* State 2: Auditing Dashboard Success View */}
        {uploadStatus === "success" && resultData && (
          <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300 w-full mt-2">
            
            {/* COLUMN 1: EXTRACTION & COMPARISON (LEFT) */}
            <div className="flex-1 flex flex-col gap-6 lg:max-w-[48%] w-full">
              
              {/* Question 3: What information was extracted? */}
              <div className="bg-[#090D1A]/60 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                  Extraction → What information was extracted?
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-zinc-500 uppercase">Resolved Entity</span>
                    <span className="text-xs font-bold text-white truncate" title={resultData.esg_data?.company_name}>
                      {resultData.esg_data?.company_name}
                    </span>
                  </div>

                  <div className="bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-zinc-500 uppercase">Reporting Year</span>
                    <span className="text-xs font-bold text-white">
                      {resultData.esg_data?.reporting_year}
                    </span>
                  </div>

                  <div className="bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-zinc-500 uppercase">Standard Disclosed</span>
                    <span className="text-xs font-bold text-[#10B981] truncate" title={resultData.esg_data?.reporting_standard || "None"}>
                      {resultData.esg_data?.reporting_standard || "None"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Question 4: What was compared? */}
              <div className="bg-[#090D1A]/60 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
                <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                  Comparison → What was compared?
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gauge Confidence */}
                  <div className="bg-zinc-900/20 border border-zinc-850 rounded-xl p-4 flex flex-col items-center justify-center min-h-[140px]">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 mb-2 self-start">
                      <CheckCircle2 className="size-3.5 text-[#10B981]" />
                      Comparison Confidence
                    </div>
                    <div className="relative flex items-center justify-center">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          className="text-zinc-800"
                          strokeWidth="5"
                          stroke="currentColor"
                          fill="transparent"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          className="text-[#10B981] transition-all duration-1000 ease-out"
                          strokeWidth="5"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={2 * Math.PI * 26 * (1 - (resultData.comparison?.confidence_score || 0))}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-sm font-bold text-white">
                          {Math.round((resultData.comparison?.confidence_score || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Variance Metric Card */}
                  <div className="bg-zinc-900/20 border border-zinc-850 rounded-xl p-4 flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400">
                      <span>Emissions Variance</span>
                      {getDiscrepancyBadge(resultData.comparison?.scope1_difference_percentage)}
                    </div>
                    <div className="flex flex-col gap-0.5 py-1">
                      <span className="text-[9px] font-semibold text-zinc-500 uppercase">Direct Difference</span>
                      <span className="text-xl font-black text-white">
                        {resultData.comparison?.scope1_difference !== undefined && resultData.comparison?.scope1_difference !== null 
                          ? `${resultData.comparison.scope1_difference > 0 ? '+' : ''}${resultData.comparison.scope1_difference.toLocaleString()} t` 
                          : "N/A"}
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-500 leading-tight">
                      Percentage discrepancy relative to self-reported ESG figures.
                    </span>
                  </div>
                </div>

                {/* Scope 1 side-by-side verification table */}
                <div className="overflow-x-auto w-full border border-zinc-800 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                      <tr className="bg-zinc-900/30">
                        <td className="p-3 font-semibold text-white">Self-Reported ESG (Scope 1)</td>
                        <td className="p-3 text-right">
                          {resultData.esg_data?.scope1 !== undefined && resultData.esg_data?.scope1 !== null 
                            ? `${resultData.esg_data.scope1.toLocaleString()} metric tons` 
                            : "Not Reported"}
                        </td>
                      </tr>
                      <tr className="bg-zinc-900/10">
                        <td className="p-3 font-semibold text-white">Climate TRACE (Satellite Estimate)</td>
                        <td className="p-3 text-right">
                          {resultData.climatetrace_data?.total_emissions !== undefined && resultData.climatetrace_data?.total_emissions !== null 
                            ? `${resultData.climatetrace_data.total_emissions.toLocaleString()} metric tons` 
                            : "No Estimate"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Recharts chart comparing values */}
                <div className="h-[160px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getScope1ChartData()} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#52525b" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#52525b" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}k`} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#090D1A", borderColor: "#27272a", borderRadius: "8px" }}
                        labelStyle={{ color: "#ffffff", fontWeight: "bold", fontSize: 10 }}
                        itemStyle={{ fontSize: 10 }}
                        formatter={(value: any) => [`${value.toLocaleString()} tCO2e`, "Scope 1"]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={35}>
                        {getScope1ChartData().map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* COLUMN 2: AI REPORT (RIGHT) */}
            <div className="flex-1 bg-[#090D1A]/60 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-6 select-text w-full lg:max-w-[50%] animate-in fade-in duration-300">
              
              <div className="flex flex-col gap-1 border-b border-zinc-800/80 pb-4">
                <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                  Audit Report → What does the discrepancy actually mean?
                </span>
                <div className="flex items-center gap-1.5 mt-2">
                  <Sparkles className="size-4.5 text-[#10B981] shrink-0" />
                  <h3 className="text-sm font-bold text-white">Evidence-Driven Verification Audit</h3>
                </div>
              </div>

              <div className="flex flex-col gap-6 overflow-y-auto max-h-[660px] pr-2">
                
                {/* 1. Audit Verdict */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">
                    1. Audit Verdict
                  </h4>
                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
                    {/* Status and Confidence */}
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-800/60 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase">Status</span>
                        <div className="flex items-center">
                          {getDiscrepancyBadge(resultData.comparison?.scope1_difference_percentage)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase">Confidence</span>
                        <span className="text-sm font-bold text-white">
                          {Math.round((resultData.comparison?.confidence_score || 0) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Evidence Checked checklist */}
                    <div className="flex flex-col gap-2 border-b border-zinc-800/60 pb-4">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Evidence Checked</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Check className="size-3.5 text-emerald-400 shrink-0" />
                          <span>ESG Report</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="size-3.5 text-emerald-400 shrink-0" />
                          <span>Climate TRACE</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="size-3.5 text-emerald-400 shrink-0" />
                          <span>Reporting Year Match</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="size-3.5 text-emerald-400 shrink-0" />
                          <span>Scope 1 Comparison</span>
                        </div>
                      </div>
                    </div>

                    {/* Short Audit Summary */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">Outcome Summary</span>
                      <p className="text-zinc-300 text-xs leading-relaxed font-normal">
                        {resultData.report?.audit_verdict}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Evidence Summary */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">
                    2. Evidence Summary
                  </h4>
                  {renderBullets(resultData.report?.evidence_summary)}
                </div>

                {/* 3. Key Findings */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">
                    3. Key Findings
                  </h4>
                  {renderBullets(resultData.report?.key_findings)}
                </div>

                {/* 4. Possible Causes */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">
                    4. Possible Causes
                  </h4>
                  {renderBullets(resultData.report?.possible_causes)}
                </div>

                {/* 5. Confidence Explanation */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">
                    5. Confidence Explanation
                  </h4>
                  {renderBullets(resultData.report?.confidence_explanation)}
                </div>

                {/* 6. Recommended Next Steps */}
                <div className="flex flex-col gap-3.5 border-t border-zinc-800/50 pt-5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">
                    6. Recommended Next Steps
                  </h4>
                  <div className="bg-[#030712] border border-zinc-800 rounded-xl p-4.5 flex flex-col gap-2">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                      Actionable Roadmap
                    </div>
                    {renderBullets(resultData.report?.recommended_next_steps)}
                  </div>
                </div>

                {/* 7. Limitations */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">
                    7. Limitations
                  </h4>
                  {renderBullets(resultData.report?.limitations)}
                </div>

                {/* 8. Disclaimer */}
                <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-zinc-800/40 text-[10px] text-zinc-500 italic leading-relaxed">
                  <span className="font-semibold not-italic">8. Disclaimer</span>
                  <p>
                    {resultData.report?.disclaimer}
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-950 bg-[#060A14] py-6 px-6 text-center text-xs text-zinc-650 font-normal">
        Veritrace © 2026 • AI-Powered Scope 1 Audit Engine. Strictly Non-Accusatory.
      </footer>

    </div>
  );
}

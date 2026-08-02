"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X
} from "lucide-react";
import { uploadPDF } from "@/lib/api";

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  // Handle file selection and validation
  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Validate wrong file type
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files are allowed.");
      setFile(null);
      setUploadStatus("error");
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setUploadStatus("idle");
    setAnalysisStep(0);
    setProgressPercent(0);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Run simulated analysis sequence
  const startAnalysisSimulation = () => {
    const steps = [
      { step: 1, percent: 40, delay: 1200 }, // Extracting ESG Data
      { step: 2, percent: 60, delay: 1200 }, // Running AI Verification
      { step: 3, percent: 80, delay: 1200 }, // Comparing Against Benchmarks
      { step: 4, percent: 100, delay: 1000 } // Generating Report
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
        setUploadStatus("success");
      }, 800);
    });
  };

  // Upload and analyze handler
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

    try {
      // 1. Perform actual upload to backend
      const response = await uploadPDF(file);
      
      if (response.success) {
        // 2. Start mock analysis simulation
        startAnalysisSimulation();
      } else {
        setUploadStatus("error");
        setErrorMessage(response.message || "Upload failed.");
      }
    } catch (error: any) {
      setUploadStatus("error");
      if (!error.response) {
        setErrorMessage("Unable to connect to server.");
      } else if (error.response.status === 400) {
        setErrorMessage(error.response.data?.detail || "Only PDF files are allowed.");
      } else {
        setErrorMessage("An unexpected error occurred during upload.");
      }
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-16 px-6 bg-[#050816] text-[#F8FAFC]">
      {/* Centered layout container */}
      <div className="max-w-[640px] w-full flex flex-col items-center">
        
        {/* 1. Logo Section */}
        <div className="w-10 h-10 rounded-xl border border-[#10B981] flex items-center justify-center bg-[#0F172A] mb-6">
          <span className="w-4 h-4 rounded-md border border-[#10B981] flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-sm bg-[#10B981]"></span>
          </span>
        </div>

        {/* 2. Heading Section */}
        <div className="flex flex-col items-center text-center mb-10 gap-3">
          <span className="text-xs font-semibold text-[#10B981] tracking-wider uppercase">
            AI-powered Sustainability Verification Platform
          </span>
          <h1 className="text-[48px] font-bold text-[#F8FAFC] tracking-tight leading-none">
            Veritrace
          </h1>
          <p className="text-[#94A3B8] text-base leading-relaxed max-w-[540px] font-normal mt-2">
            Upload ESG reports and automatically verify emissions data, identify inconsistencies, and generate explainable sustainability insights.
          </p>
        </div>

        {/* 3. Upload Card */}
        <div className="w-full bg-[#0F172A] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-8 shadow-sm flex flex-col gap-6 transition-all duration-200 hover:border-[rgba(255,255,255,0.1)]">
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleInputChange} 
            accept=".pdf" 
            className="hidden" 
          />

          {/* Conditional upload area / uploaded file representation */}
          {!file ? (
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerChooseFile}
              className={`border border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 min-h-[180px] bg-transparent ${
                isDragActive 
                  ? "border-[#10B981] bg-[#10B981]/5" 
                  : "border-[rgba(255,255,255,0.08)] hover:border-[#10B981]"
              }`}
            >
              <Upload className="size-6 text-[#94A3B8] mb-3 transition-colors" />
              <span className="text-sm font-medium text-[#F8FAFC] mb-1">
                Drag & Drop ESG Report
              </span>
              <span className="text-xs text-[#94A3B8]">
                PDF • DOCX • XLSX
              </span>
            </div>
          ) : (
            /* 4. After Upload state */
            <div className="border border-[rgba(255,255,255,0.06)] bg-[#0A0F1D] rounded-xl p-6 flex items-center justify-between transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                  <FileText className="size-8" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-[#F8FAFC] truncate max-w-[240px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-[#94A3B8] mt-0.5">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-1 rounded-full">
                  Ready
                </span>
                <button 
                  onClick={handleRemoveFile} 
                  disabled={uploadStatus === "analyzing"}
                  className="text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 rounded-lg p-1.5 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* 5. Primary Button */}
          <button
            onClick={handleUpload}
            disabled={uploadStatus === "analyzing"}
            className={`h-14 w-full rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
              uploadStatus === "success"
                ? "bg-[#10B981] text-[#050816] shadow-md shadow-[#10B981]/10 cursor-default pointer-events-none"
                : "bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-[#050816] shadow-md"
            }`}
          >
            {uploadStatus === "analyzing" ? (
              <>
                <Loader2 className="size-4 animate-spin text-[#050816]" />
                Analyzing Report
              </>
            ) : uploadStatus === "success" ? (
              <>
                ✓ Uploaded Successfully
              </>
            ) : (
              "Analyze Report"
            )}
          </button>

          {/* 6. Progress bar during analysis */}
          {uploadStatus === "analyzing" && (
            <div className="flex flex-col gap-2 mt-2 animate-in fade-in duration-200">
              <div className="w-full bg-[rgba(255,255,255,0.04)] h-1.5 rounded-full overflow-hidden border border-[rgba(255,255,255,0.02)]">
                <div 
                  className="bg-gradient-to-r from-[#10B981] to-[#14B8A6] h-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-medium tracking-wide">
                <Loader2 className="size-3 animate-spin text-[#10B981]" />
                <span>{ANALYSIS_STEPS[analysisStep]}</span>
              </div>
            </div>
          )}

          {/* 7. Results Preview card (Success message) */}
          {uploadStatus === "success" && (
            <div className="bg-[#10B981]/5 border border-[#10B981]/10 rounded-xl p-4 flex items-center gap-3 text-[#10B981] text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              <CheckCircle2 className="size-5 shrink-0 text-[#10B981]" />
              <span>✓ Report uploaded successfully</span>
            </div>
          )}

          {/* Error display */}
          {uploadStatus === "error" && errorMessage && (
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/10 rounded-xl p-4 flex items-center gap-3 text-[#EF4444] text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="size-5 shrink-0 text-[#EF4444]" />
              <span>{errorMessage}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

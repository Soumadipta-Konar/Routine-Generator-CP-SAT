import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Loader2, 
  X,
  Download
} from 'lucide-react';
import { api } from '../services/api';

export default function ExcelUploader({ onUploadSuccess = () => {} }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (selected) => {
    if (selected && selected.name.match(/\.(xlsx|xls)$/i)) {
      setFile(selected);
      setError(null);
      setResult(null);
    } else if (selected) {
      setError('Please select a valid Excel (.xlsx / .xls) workbook.');
      setFile(null);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    processFile(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer?.files?.[0];
    processFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an Excel workbook before uploading.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.uploadMasterWorkbook(file);
      setResult(res);
      onUploadSuccess();
    } catch (err) {
      const data = err.response?.data;
      const errMsg = (data?.details && data.details.length > 0)
        ? data.details
        : data?.message || data?.errors || data?.error || err.message;
      setError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-xl p-6 transition-colors">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
            Curriculum & Master Infrastructure Ingestion
          </h3>
          <p className="text-sm text-[#4B5563] dark:text-[#A1A6B3] mt-0.5">
            Upload the departmental spreadsheet containing cohorts, faculty, rooms, and weekly workloads.
          </p>
        </div>

        <a
          href="/api/v1/imports/download-sample/"
          download
          className="inline-flex items-center space-x-2 h-9 px-3 rounded-lg text-xs font-medium bg-[#F1F2F5] dark:bg-[#1B1E26] hover:bg-[#E5E7EB] dark:hover:bg-[#2A2D37] text-[#111827] dark:text-[#F3F4F6] border border-[#E5E7EB] dark:border-[#2A2D37] transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[#4F46E5] dark:text-[#6366F1]" strokeWidth={1.75} />
          <span>Download Template (.xlsx)</span>
        </a>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-[#4F46E5] bg-[#EEF2FF] dark:bg-[#1E1F3A]'
            : file
            ? 'border-[#059669] bg-[#ECFDF5] dark:bg-[#052E22]'
            : 'border-[#E5E7EB] dark:border-[#2A2D37] hover:border-[#D1D5DB] dark:hover:border-[#374151] bg-[#F7F8FA] dark:bg-[#0B0D12]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] flex items-center justify-center text-[#059669]">
              <FileSpreadsheet className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">
              {file.name}
              <span className="ml-2 text-xs font-mono font-normal text-[#9CA3AF]">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              onClick={handleClearFile}
              className="text-xs text-[#DC2626] hover:underline font-medium inline-flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#F1F2F5] dark:bg-[#1B1E26] flex items-center justify-center text-[#4B5563] dark:text-[#A1A6B3]">
              <UploadCloud className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-medium text-[#111827] dark:text-[#F3F4F6]">
              Click to select or drag and drop your spreadsheet
            </p>
            <p className="text-xs text-[#9CA3AF] dark:text-[#6B7280]">
              Must contain sheets: Cohorts, Faculty, Rooms, Subjects, Curriculum_Workload
            </p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="h-10 px-4 rounded-lg text-sm font-medium bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-all shadow-sm disabled:opacity-50 inline-flex items-center space-x-2 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                <span>Parsing & Validating…</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" strokeWidth={1.75} />
                <span>Parse & Synchronize</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Success Notification */}
      {result && (
        <div className="mt-4 p-3.5 rounded-lg bg-[#ECFDF5] dark:bg-[#052E22] border border-[#A7F3D0] dark:border-[#065F46] text-xs text-[#059669] dark:text-[#10B981] flex items-start space-x-2">
          <Check className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <span className="font-semibold">Success: </span>
            <span>{result.message}</span>
          </div>
        </div>
      )}

      {/* Error Details */}
      {error && (
        <div className="mt-4 p-3.5 rounded-lg bg-[#FEF2F2] dark:bg-[#450A0A] border border-[#FCA5A5] dark:border-[#991B1B] text-xs text-[#DC2626] dark:text-[#F87171] space-y-2">
          <div className="flex items-center space-x-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Ingestion Errors</span>
          </div>
          {Array.isArray(error) ? (
            <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[0.6875rem]">
              {error.map((err, i) => (
                <div key={i} className="p-1 bg-white/60 dark:bg-black/30 rounded">
                  [{err.sheet || 'Validation'}] Row {err.row || '-'}: {err.description || JSON.stringify(err)}
                </div>
              ))}
            </div>
          ) : (
            <p>{error}</p>
          )}
        </div>
      )}

    </div>
  );
}

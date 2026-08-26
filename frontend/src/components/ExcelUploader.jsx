import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function ExcelUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.match(/\.(xlsx|xls)$/)) {
      setFile(selected);
      setError(null);
      setResult(null);
    } else {
      setError('Please select a valid Excel (.xlsx) workbook.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.uploadMasterWorkbook(file);
      setResult(data);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      const errDetail = err.response?.data?.details || err.response?.data?.error || err.message;
      setError(typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cream-200 flex items-center justify-center text-ink-800">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-900 tracking-tight">Master Dataset Ingestion</h3>
            <p className="text-[11px] text-ink-500 font-medium">Upload institutional 5-sheet workbook (.xlsx)</p>
          </div>
        </div>

        {/* Download Blank Template Button */}
        <a
          href="http://localhost:8000/api/v1/imports/download-template/"
          download="master_schedule_template.xlsx"
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cream-200 hover:bg-cream-300 text-ink-800 border border-stone-300/70 transition-all shadow-2xs self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-ink-600" />
          <span>Download Blank Excel Template (.xlsx)</span>
        </a>
      </div>


      {/* Drop area */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-stone-300/80 hover:border-stone-500 rounded-xl p-5 text-center cursor-pointer bg-cream-50/50 hover:bg-cream-100/50 transition-all"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".xlsx,.xls" 
          className="hidden" 
        />
        <UploadCloud className="w-6 h-6 mx-auto text-ink-400 mb-1.5" />
        <p className="text-xs font-semibold text-ink-800">
          {file ? file.name : 'Click to select or drag & drop master_schedule_inputs.xlsx'}
        </p>
        <p className="text-[10px] text-ink-400 mt-0.5 font-mono">
          {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Contains Cohorts, Faculty, Rooms, Subjects, Curriculum_Workload'}
        </p>
      </div>

      {/* Action button */}
      {file && (
        <div className="mt-3 flex items-center justify-end space-x-2">
          <button
            onClick={() => setFile(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-500 hover:text-ink-800 hover:bg-cream-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-xs disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Validating & Seeding DB...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Upload & Validate</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Success / Error alerts */}
      {result && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs font-medium flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{result.message}</span>
        </div>
      )}
      {error && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-900 text-xs font-medium flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Validation Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

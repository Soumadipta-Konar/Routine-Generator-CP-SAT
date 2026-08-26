import React from 'react';
import { Play, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function PageHeaderCard({
  onUploadClick = () => {},
  onSolveClick = () => {},
  isSolving = false,
  showUploader = false,
}) {
  return (
    <div className="bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-xl p-6 transition-colors">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Text Block (Left) */}
        <div className="max-w-[60ch]">
          
          {/* Eyebrow Row */}
          <div className="flex items-center space-x-2">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] dark:text-[#6B7280]">
              ADMINISTRATIVE CONTROL
            </span>
            <span className="text-[#9CA3AF] dark:text-[#6B7280]">•</span>
            <span className="text-[0.6875rem] font-semibold text-[#4F46E5] dark:text-[#6366F1]">
              Phase 4 REST API
            </span>
          </div>

          {/* H1 Heading */}
          <h1 className="text-2xl font-semibold text-[#111827] dark:text-[#F3F4F6] mt-2 leading-[1.3]">
            Master Routine & Solver Operations
          </h1>

          {/* Description Paragraph */}
          <p className="text-sm font-normal text-[#4B5563] dark:text-[#A1A6B3] mt-2 leading-[1.5]">
            Configure institutional schedules, ingest curriculum spreadsheets, and solve multi-variable timetable constraints with Google OR-Tools.
          </p>

        </div>

        {/* Actions (Right) */}
        <div className="flex items-center space-x-3 shrink-0">
          
          {/* Upload Excel (Secondary Button) */}
          <button
            onClick={onUploadClick}
            className={`h-10 px-4 rounded-lg text-sm font-medium border border-[#E5E7EB] dark:border-[#2A2D37] inline-flex items-center space-x-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 ${
              showUploader 
                ? 'bg-[#F1F2F5] dark:bg-[#1B1E26] text-[#111827] dark:text-[#F3F4F6] font-semibold'
                : 'bg-white dark:bg-[#14161C] text-[#111827] dark:text-[#F3F4F6] hover:bg-[#F1F2F5] dark:hover:bg-[#1B1E26]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#059669]" strokeWidth={1.75} />
            <span>{showUploader ? 'Close Uploader' : 'Upload Excel'}</span>
          </button>

          {/* Run CP-SAT Solver (Primary Button) */}
          <button
            onClick={onSolveClick}
            disabled={isSolving}
            className="h-10 px-4 rounded-lg text-sm font-medium bg-[#4F46E5] hover:bg-[#4338CA] dark:bg-[#6366F1] dark:hover:bg-[#4F46E5] text-white inline-flex items-center space-x-2 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
          >
            {isSolving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" strokeWidth={1.75} />
                <span>Solving…</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" strokeWidth={1.75} />
                <span>Run CP-SAT Solver</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}

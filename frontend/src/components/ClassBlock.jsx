import React from 'react';

export default function ClassBlock({ entry, onClick = () => {} }) {
  if (!entry) return null;

  const isLab = entry.subject_name?.toLowerCase().includes('lab') || entry.subject_code?.toLowerCase().includes('lab');
  const isElective = Boolean(entry.elective_subject_id);

  // Slot-Type Color Coding from Section 4.3
  let dotColor = '#059669'; // Core Lecture green
  let borderLeftColor = 'border-l-[#059669]';
  let bgTintClass = 'bg-[#ECFDF5] dark:bg-[#052E22] hover:bg-[#D1FAE5] dark:hover:bg-[#064E3B]';

  if (isElective) {
    dotColor = '#D97706'; // NEP Amber
    borderLeftColor = 'border-l-[#D97706]';
    bgTintClass = 'bg-[#FFFBEB] dark:bg-[#2E2205] hover:bg-[#FEF3C7] dark:hover:bg-[#453408]';
  } else if (isLab) {
    dotColor = '#7C3AED'; // Lab Violet
    borderLeftColor = 'border-l-[#7C3AED]';
    bgTintClass = 'bg-[#F5F3FF] dark:bg-[#1E1533] hover:bg-[#EDE9FE] dark:hover:bg-[#2E1065]';
  }

  return (
    <div
      onClick={onClick}
      className={`h-full m-1.5 p-2.5 rounded-md border-l-[3px] ${borderLeftColor} ${bgTintClass} flex flex-col justify-between cursor-pointer transition-all duration-120 hover:shadow-sm`}
    >
      <div className="space-y-1">
        {/* Top Row: Course Code + 6px Dot + Room Badge */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: dotColor }}
            />
            <span className="font-mono text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] truncate">
              {entry.subject_code}
            </span>
          </div>

          <span className="shrink-0 font-mono text-[0.6875rem] px-1.5 py-0.5 rounded bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] text-[#6B7280] dark:text-[#9CA3AF]">
            {entry.room_name}
          </span>
        </div>

        {/* Course Name (Max 2 lines) */}
        <div className="text-sm font-medium text-[#111827] dark:text-[#F3F4F6] leading-[1.35] line-clamp-2">
          {entry.subject_name}
        </div>
      </div>

      {/* Faculty Name (1 line truncate) */}
      <div className="mt-2 text-xs font-normal text-[#4B5563] dark:text-[#A1A6B3] truncate">
        {entry.faculty_name}
      </div>
    </div>
  );
}

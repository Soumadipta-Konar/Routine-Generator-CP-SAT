import React from 'react';
import { Lightbulb } from 'lucide-react';

export default function TimetableLegend() {
  const items = [
    { label: 'Core Lecture', color: '#059669' },
    { label: 'Lab Practical (Consecutive)', color: '#7C3AED' },
    { label: 'NEP Open Elective', color: '#D97706' },
    { label: 'Recess Break', color: '#6B7280' },
  ];

  return (
    <div className="bg-[#F1F2F5] dark:bg-[#1B1E26] px-6 py-3 border-b border-[#E5E7EB] dark:border-[#2A2D37] flex flex-wrap items-center justify-between gap-4 transition-colors">
      
      {/* Legend Items */}
      <div className="flex flex-wrap items-center gap-6">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-[#6B7280]">
          SLOT TYPES:
        </span>

        {items.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm font-normal text-[#4B5563] dark:text-[#A1A6B3]">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Far Right Interaction Tip */}
      <div className="flex items-center space-x-1.5 text-xs text-[#9CA3AF] dark:text-[#6B7280]">
        <Lightbulb className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
        <span>Click any scheduled class block to reassign period</span>
      </div>

    </div>
  );
}

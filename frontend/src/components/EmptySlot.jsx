import React from 'react';
import { Plus } from 'lucide-react';

export default function EmptySlot({ onClick = () => {}, isInteractive = true }) {
  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={`h-full m-1.5 rounded-md border border-dashed border-[#E5E7EB] dark:border-[#2A2D37] bg-transparent flex items-center justify-center transition-colors duration-150 ${
        isInteractive
          ? 'cursor-pointer hover:border-solid hover:border-[#4F46E5] dark:hover:border-[#6366F1] hover:bg-[#EEF2FF] dark:hover:bg-[#1E1F3A] group'
          : ''
      }`}
    >
      <div className="flex items-center space-x-1.5 text-[#9CA3AF] dark:text-[#6B7280] group-hover:text-[#4F46E5] dark:group-hover:text-[#6366F1] transition-colors">
        <Plus className="w-4 h-4" strokeWidth={1.75} />
        <span className="text-xs font-medium">Free Slot</span>
      </div>
    </div>
  );
}

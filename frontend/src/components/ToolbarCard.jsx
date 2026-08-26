import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, Users, Building, ChevronDown, Check, RefreshCw } from 'lucide-react';

export default function ToolbarCard({
  filterType = 'cohort',
  onFilterChange = () => {},
  selectedId = null,
  onSelectEntity = () => {},
  meta = { cohorts: [], faculty: [], rooms: [] },
  onRefresh = () => {},
  isLoading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getOptions = () => {
    if (filterType === 'cohort') {
      return (meta.cohorts || []).map((c) => ({
        id: c.id,
        primary: c.name,
        secondary: `Semester ${c.semester} • Size: ${c.size}`,
      }));
    }
    if (filterType === 'faculty') {
      return (meta.faculty || []).map((f) => ({
        id: f.id,
        primary: f.name,
        secondary: `${f.max_weekly_hours}h/wk max`,
      }));
    }
    if (filterType === 'room') {
      return (meta.rooms || []).map((r) => ({
        id: r.id,
        primary: r.name,
        secondary: `${r.room_type} (Cap: ${r.capacity})`,
      }));
    }
    return [];
  };

  const options = getOptions();
  const selectedOption = options.find((opt) => opt.id === selectedId);

  const getLabel = () => {
    if (filterType === 'cohort') return 'Select Cohort:';
    if (filterType === 'faculty') return 'Select Faculty:';
    return 'Select Room:';
  };

  return (
    <div className="bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-xl p-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: View Toggle Segmented Control */}
        <div className="bg-[#F1F2F5] dark:bg-[#1B1E26] p-1 rounded-lg inline-flex items-center self-start">
          {[
            { id: 'cohort', label: 'By Cohort Section', icon: GraduationCap },
            { id: 'faculty', label: 'By Faculty', icon: Users },
            { id: 'room', label: 'By Room Space', icon: Building },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#14161C] text-[#111827] dark:text-[#F3F4F6] shadow-sm font-semibold'
                    : 'text-[#4B5563] dark:text-[#A1A6B3] hover:text-[#111827] dark:hover:text-[#F3F4F6]'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Entity Selector Dropdown + Refresh Button */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-normal text-[#4B5563] dark:text-[#A1A6B3] whitespace-nowrap">
            {getLabel()}
          </span>

          {/* Custom Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="h-10 px-3 min-w-[200px] max-w-[320px] bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-lg text-sm text-[#111827] dark:text-[#F3F4F6] flex items-center justify-between gap-2 hover:border-[#D1D5DB] dark:hover:border-[#374151] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
              title={selectedOption ? `${selectedOption.primary} (${selectedOption.secondary})` : 'Select option'}
            >
              <span className="truncate text-left font-medium">
                {selectedOption ? selectedOption.primary : 'Select...'}
              </span>
              <ChevronDown className="w-4 h-4 text-[#9CA3AF] shrink-0" strokeWidth={1.75} />
            </button>

            {/* Custom Popover Panel */}
            {isOpen && (
              <div className="absolute right-0 top-11 z-50 min-w-[320px] max-w-[400px] bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-lg shadow-sm py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                {options.length > 0 ? (
                  options.map((opt) => {
                    const isSelected = opt.id === selectedId;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onSelectEntity(opt.id);
                          setIsOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#EEF2FF] dark:bg-[#1E1F3A] text-[#4F46E5] dark:text-[#6366F1] font-semibold'
                            : 'text-[#111827] dark:text-[#F3F4F6] hover:bg-[#F1F2F5] dark:hover:bg-[#1B1E26]'
                        }`}
                      >
                        <div className="truncate">
                          <div className="truncate font-medium">{opt.primary}</div>
                          <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate font-normal">
                            {opt.secondary}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#4F46E5] dark:text-[#6366F1] shrink-0" strokeWidth={1.75} />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-[#9CA3AF] text-center">
                    No options available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center border border-[#E5E7EB] dark:border-[#2A2D37] rounded-lg text-[#4B5563] dark:text-[#A1A6B3] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F1F2F5] dark:hover:bg-[#1B1E26] transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
            title="Refresh routine grid"
            aria-label="Refresh timetable"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
          </button>

        </div>

      </div>
    </div>
  );
}

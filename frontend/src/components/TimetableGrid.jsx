import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Printer, 
  Coffee, 
  CalendarX,
  Play
} from 'lucide-react';
import TimetableLegend from './TimetableLegend';
import ClassBlock from './ClassBlock';
import EmptySlot from './EmptySlot';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Monday', short: 'Mon', sub: 'Day 1' },
  { id: 2, label: 'Tuesday', short: 'Tue', sub: 'Day 2' },
  { id: 3, label: 'Wednesday', short: 'Wed', sub: 'Day 3' },
  { id: 4, label: 'Thursday', short: 'Thu', sub: 'Day 4' },
  { id: 5, label: 'Friday', short: 'Fri', sub: 'Day 5' },
];

const PERIOD_COLUMNS = [
  { id: 1, label: '1st', time: '09:00 – 09:55', isBreak: false },
  { id: 2, label: '2nd', time: '09:55 – 10:50', isBreak: false },
  { id: 3, label: '3rd', time: '10:50 – 11:45', isBreak: false },
  { id: 4, label: '4th', time: '11:45 – 12:40', isBreak: false },
  { id: 5, label: 'RECESS', time: '12:40 – 13:50', isBreak: true },
  { id: 6, label: '5th', time: '13:50 – 14:45', isBreak: false },
  { id: 7, label: '6th', time: '14:45 – 15:40', isBreak: false },
  { id: 8, label: '7th', time: '15:40 – 16:35', isBreak: false },
  { id: 9, label: '8th', time: '16:35 – 17:30', isBreak: false },
];

export default function TimetableGrid({
  gridData = {},
  title = "Weekly Routine Matrix — CSE, Semester 3, Section A",
  subtitle = "Generated via Google OR-Tools CP-SAT with verified zero clashes",
  conflictCount = 0,
  isLoading = false,
  isInteractive = true,
  onSlotClick = () => {},
  onRunSolverPrompt = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMobileDay, setSelectedMobileDay] = useState(1);

  // Count scheduled classes
  let totalClasses = 0;
  Object.values(gridData || {}).forEach((daySlots) => {
    Object.values(daySlots || {}).forEach((entry) => {
      if (entry) totalClasses += 1;
    });
  });

  const hasNoClasses = !isLoading && totalClasses === 0;

  return (
    <div className="bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-xl overflow-hidden transition-colors">
      
      {/* 6.4 Timetable Section Header */}
      <div className="p-6 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          {/* Eyebrow + Status Pill */}
          <div className="flex items-center space-x-2">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] dark:text-[#6B7280]">
              WEEKLY TIMETABLE MATRIX
            </span>
            <span className="text-[#9CA3AF] dark:text-[#6B7280]">•</span>
            {conflictCount > 0 ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold bg-[#FEF2F2] dark:bg-[#450A0A] text-[#DC2626] dark:text-[#F87171]">
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{conflictCount} Conflicts Detected</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold bg-[#ECFDF5] dark:bg-[#052E22] text-[#059669] dark:text-[#10B981]">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{totalClasses} Classes Scheduled</span>
              </span>
            )}
          </div>

          {/* H2 Title */}
          <h2 className="text-[1.125rem] font-semibold text-[#111827] dark:text-[#F3F4F6] mt-1 leading-[1.4]">
            {title}
          </h2>

          {/* Subtext */}
          <p className="text-sm font-normal text-[#4B5563] dark:text-[#A1A6B3] mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Right Side: Search Input + Print Button */}
        <div className="flex items-center space-x-3 shrink-0 no-print">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search subject or teacher…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-60 h-9 pl-9 pr-3 rounded-lg text-sm bg-[#F1F2F5] dark:bg-[#1B1E26] text-[#111827] dark:text-[#F3F4F6] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] border border-transparent focus:border-[#4F46E5] dark:focus:border-[#6366F1] focus:ring-2 focus:ring-[#4F46E5]/20 focus:outline-none transition-all"
            />
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="h-9 px-3 rounded-lg text-sm font-medium bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] text-[#111827] dark:text-[#F3F4F6] hover:bg-[#F1F2F5] dark:hover:bg-[#1B1E26] inline-flex items-center space-x-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
            title="Print timetable"
          >
            <Printer className="w-4 h-4 text-[#4B5563] dark:text-[#A1A6B3]" strokeWidth={1.75} />
            <span>Print</span>
          </button>

        </div>
      </div>

      {/* 6.5 Legend Strip */}
      <TimetableLegend />

      {/* 7. Empty State (if 0 classes) */}
      {hasNoClasses && (
        <div className="py-16 text-center space-y-3">
          <CalendarX className="w-8 h-8 text-[#9CA3AF] dark:text-[#6B7280] mx-auto" strokeWidth={1.5} />
          <div>
            <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">No classes scheduled yet</h3>
            <p className="text-xs text-[#4B5563] dark:text-[#A1A6B3] mt-1">Run the CP-SAT optimization engine to populate the timetable.</p>
          </div>
          <button
            onClick={onRunSolverPrompt}
            className="mt-2 h-9 px-4 rounded-lg text-xs font-medium bg-[#4F46E5] hover:bg-[#4338CA] text-white inline-flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Run CP-SAT Solver</span>
          </button>
        </div>
      )}

      {/* 7. Loading Skeleton State */}
      {isLoading && (
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-6 gap-3">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="h-24 rounded-md bg-[#F1F2F5] dark:bg-[#1B1E26] animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* 6.6 Desktop & Tablet Grid View (Freeze Pane) */}
      {!hasNoClasses && !isLoading && (
        <>
          {/* Desktop Table Matrix (≥768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse min-w-[980px]">
              
              {/* Header Row (Sticky) */}
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-[#2A2D37] bg-[#F1F2F5] dark:bg-[#1B1E26] text-[0.6875rem] uppercase tracking-wide text-[#9CA3AF] dark:text-[#6B7280] h-14">
                  <th className="w-[120px] px-3 font-semibold text-center sticky left-0 z-20 bg-[#F1F2F5] dark:bg-[#1B1E26] border-r border-[#E5E7EB] dark:border-[#2A2D37]">
                    DAY / SLOT
                  </th>
                  {PERIOD_COLUMNS.map((period) => (
                    <th
                      key={period.id}
                      className={`px-2 py-2 text-center border-r border-[#E5E7EB] dark:border-[#2A2D37] last:border-r-0 ${
                        period.isBreak ? 'bg-[#F1F2F5] dark:bg-[#1B1E26] w-24' : 'min-w-[140px]'
                      }`}
                    >
                      <div className={`text-sm font-semibold ${period.isBreak ? 'text-[#9CA3AF] dark:text-[#6B7280]' : 'text-[#111827] dark:text-[#F3F4F6]'}`}>
                        {period.label}
                      </div>
                      <div className="text-[0.6875rem] font-mono text-[#9CA3AF] dark:text-[#6B7280] font-medium mt-0.5">
                        {period.time}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Day Rows (Days 1 to 5) */}
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2A2D37]">
                {DAYS_OF_WEEK.map((day) => (
                  <tr key={day.id} className="min-h-[88px]">
                    
                    {/* Leftmost Sticky Day Column */}
                    <td className="w-[120px] p-3 text-center sticky left-0 z-10 bg-[#F1F2F5] dark:bg-[#1B1E26] border-r border-[#E5E7EB] dark:border-[#2A2D37] align-middle">
                      <div className="font-semibold text-sm text-[#111827] dark:text-[#F3F4F6] uppercase tracking-wide">
                        {day.label}
                      </div>
                      <div className="text-xs text-[#9CA3AF] dark:text-[#6B7280] font-normal mt-0.5">
                        {day.sub}
                      </div>
                    </td>

                    {/* Period Slots */}
                    {PERIOD_COLUMNS.map((period) => {
                      const entry = gridData?.[day.id]?.[period.id];

                      // Search Matching Check (Section 7: 30% opacity for non-matching)
                      const matchesSearch = !searchQuery.trim() || (entry && (
                        entry.subject_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        entry.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        entry.faculty_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        entry.room_name?.toLowerCase().includes(searchQuery.toLowerCase())
                      ));

                      // Recess Break Column
                      if (period.isBreak) {
                        return (
                          <td
                            key={period.id}
                            className="p-2 border-r border-[#E5E7EB] dark:border-[#2A2D37] bg-[#F1F2F5] dark:bg-[#1B1E26] text-center align-middle"
                          >
                            <div className="flex flex-col items-center justify-center space-y-1 text-[#9CA3AF] dark:text-[#6B7280] py-3">
                              <Coffee className="w-5 h-5" strokeWidth={1.75} />
                              <span className="text-[0.6875rem] font-semibold tracking-wider uppercase">
                                RECESS
                              </span>
                            </div>
                          </td>
                        );
                      }

                      // Populated Class Cell
                      if (entry) {
                        return (
                          <td
                            key={period.id}
                            className={`p-0 border-r border-[#E5E7EB] dark:border-[#2A2D37] align-stretch h-full ${
                              matchesSearch ? 'opacity-100' : 'opacity-30'
                            }`}
                          >
                            <ClassBlock
                              entry={entry}
                              onClick={() => isInteractive && onSlotClick(day.id, period.id, entry)}
                            />
                          </td>
                        );
                      }

                      // Empty Slot Cell
                      return (
                        <td
                          key={period.id}
                          className="p-0 border-r border-[#E5E7EB] dark:border-[#2A2D37] align-stretch h-full"
                        >
                          <EmptySlot
                            isInteractive={isInteractive}
                            onClick={() => onSlotClick(day.id, period.id, null)}
                          />
                        </td>
                      );
                    })}

                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* 8. Mobile Day-Selector View (<768px) */}
          <div className="block md:hidden p-4 space-y-4">
            
            {/* Day Selector Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedMobileDay(day.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedMobileDay === day.id
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-[#F1F2F5] dark:bg-[#1B1E26] text-[#4B5563] dark:text-[#A1A6B3]'
                  }`}
                >
                  {day.short} ({day.sub})
                </button>
              ))}
            </div>

            {/* Vertical Stack of Class Blocks for the selected day */}
            <div className="space-y-2.5">
              {PERIOD_COLUMNS.map((period) => {
                const entry = gridData?.[selectedMobileDay]?.[period.id];

                if (period.isBreak) {
                  return (
                    <div
                      key={period.id}
                      className="p-3 bg-[#F1F2F5] dark:bg-[#1B1E26] rounded-md flex items-center justify-between text-xs text-[#9CA3AF]"
                    >
                      <div className="flex items-center space-x-2">
                        <Coffee className="w-4 h-4" />
                        <span className="font-semibold uppercase tracking-wider">RECESS BREAK</span>
                      </div>
                      <span className="font-mono">{period.time}</span>
                    </div>
                  );
                }

                return (
                  <div key={period.id} className="border border-[#E5E7EB] dark:border-[#2A2D37] rounded-md p-2">
                    <div className="flex items-center justify-between text-xs font-mono text-[#9CA3AF] mb-1.5">
                      <span className="font-semibold text-[#111827] dark:text-[#F3F4F6]">{period.label} Period</span>
                      <span>{period.time}</span>
                    </div>
                    {entry ? (
                      <ClassBlock
                        entry={entry}
                        onClick={() => isInteractive && onSlotClick(selectedMobileDay, period.id, entry)}
                      />
                    ) : (
                      <div className="h-16">
                        <EmptySlot
                          isInteractive={isInteractive}
                          onClick={() => onSlotClick(selectedMobileDay, period.id, null)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </>
      )}

    </div>
  );
}

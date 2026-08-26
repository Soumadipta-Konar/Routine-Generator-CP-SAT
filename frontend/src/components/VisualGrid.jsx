import React, { useState } from 'react';
import { 
  Coffee, 
  Sparkles, 
  MapPin, 
  User, 
  Layers, 
  Search, 
  Printer, 
  Filter,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

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

export default function VisualGrid({
  gridData = {},
  title = "Timetable Routine",
  subtitle = "Generated via Google OR-Tools CP-SAT",
  interactive = false,
  onSlotClick = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to determine card styling and type badges
  const getSubjectTypeDetails = (entry) => {
    if (!entry) return null;
    const isLab = entry.subject_name?.toLowerCase().includes('lab') || entry.subject_code?.toLowerCase().includes('lab');
    const isElective = Boolean(entry.elective_subject_id);

    if (isElective) {
      return {
        type: 'NEP Elective',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        cardBg: 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400',
        dotColor: 'bg-amber-500',
      };
    }
    if (isLab) {
      return {
        type: 'Lab Practical',
        badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        cardBg: 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-900/40 hover:border-indigo-400',
        dotColor: 'bg-indigo-500',
      };
    }
    return {
      type: 'Core Lecture',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      cardBg: 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600',
      dotColor: 'bg-emerald-500',
    };
  };

  // Count populated entries
  let totalClasses = 0;
  Object.values(gridData || {}).forEach((daySlots) => {
    Object.values(daySlots || {}).forEach((entry) => {
      if (entry) totalClasses += 1;
    });
  });

  return (
    <div className="space-y-4">
      
      {/* Grid Header Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Weekly Timetable Matrix
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{totalClasses} Classes Scheduled</span>
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Filter and Print Actions */}
        <div className="flex items-center space-x-2.5 no-print">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subject or teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 w-44 sm:w-56 transition-all"
            />
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Print routine matrix"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Routine Legend Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium bg-white dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
            Slot Types:
          </span>
          <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Core Lecture</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>Lab Practical (Consecutive)</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>NEP Open Elective</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span>Recess Break</span>
          </div>
        </div>

        {interactive && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            💡 Click any scheduled class block to reassign period
          </div>
        )}
      </div>

      {/* 2D Timetable Table Structure */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[960px]">
            
            {/* Header Columns */}
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-bold uppercase tracking-wider w-28 text-center border-r border-slate-200 dark:border-slate-800">
                  Day / Slot
                </th>
                {PERIOD_COLUMNS.map((period) => (
                  <th
                    key={period.id}
                    className={`py-3 px-3 font-semibold text-center border-r border-slate-200/80 dark:border-slate-800/80 last:border-r-0 ${
                      period.isBreak ? 'bg-slate-100/70 dark:bg-slate-800/40 w-24' : 'min-w-[130px]'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-slate-100">{period.label}</div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                      {period.time}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Timetable Rows (Days 1 to 5) */}
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 text-xs">
              {DAYS_OF_WEEK.map((day) => (
                <tr key={day.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  
                  {/* Day Indicator Cell */}
                  <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 align-middle">
                    <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                      {day.label}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                      {day.sub}
                    </div>
                  </td>

                  {/* Period Slot Cells */}
                  {PERIOD_COLUMNS.map((period) => {
                    const entry = gridData?.[day.id]?.[period.id];
                    const subjectType = getSubjectTypeDetails(entry);

                    // Search Query Highlight Filter
                    const matchesSearch = searchQuery.trim() === '' || (entry && (
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
                          className="py-3 px-2 text-center border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-850/30 align-middle"
                        >
                          <div className="flex flex-col items-center justify-center space-y-1 text-slate-400 dark:text-slate-600 py-4">
                            <Coffee className="w-4 h-4" />
                            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">
                              RECESS
                            </span>
                          </div>
                        </td>
                      );
                    }

                    // Scheduled Class Cell
                    if (entry) {
                      return (
                        <td
                          key={period.id}
                          className={`p-2 border-r border-slate-200/80 dark:border-slate-800/80 align-top transition-opacity ${
                            matchesSearch ? 'opacity-100' : 'opacity-20'
                          }`}
                        >
                          <div
                            onClick={() => interactive && onSlotClick(day.id, period.id, entry)}
                            className={`h-full min-h-[92px] p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                              subjectType?.cardBg
                            } ${
                              interactive ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
                            }`}
                          >
                            {/* Card Top: Code & Room Badge */}
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <div className="flex items-center space-x-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${subjectType?.dotColor}`}></span>
                                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                    {entry.subject_code}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {entry.room_name}
                                </span>
                              </div>

                              {/* Subject Name */}
                              <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2 text-[11px] leading-snug">
                                {entry.subject_name}
                              </div>
                            </div>

                            {/* Card Bottom: Faculty & Badge */}
                            <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[90px]" title={entry.faculty_name}>
                                {entry.faculty_name}
                              </span>
                              {entry.elective_subject_id && (
                                <span className="font-mono font-bold text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                  NEP
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Empty / Free Slot Cell
                    return (
                      <td
                        key={period.id}
                        className="p-2 border-r border-slate-200/80 dark:border-slate-800/80 align-middle"
                      >
                        <div
                          onClick={() => interactive && onSlotClick(day.id, period.id, null)}
                          className={`h-full min-h-[92px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] font-medium text-slate-400 dark:text-slate-600 transition-colors ${
                            interactive ? 'hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-850/40 cursor-pointer' : ''
                          }`}
                        >
                          <span className="opacity-60">+ Free Slot</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}

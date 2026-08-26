import React from 'react';
import { MapPin, User, BookOpen, Coffee } from 'lucide-react';

const DAYS = [
  { id: 1, name: 'MONDAY', short: 'MON' },
  { id: 2, name: 'TUESDAY', short: 'TUE' },
  { id: 3, name: 'WEDNESDAY', short: 'WED' },
  { id: 4, name: 'THURSDAY', short: 'THU' },
  { id: 5, name: 'FRIDAY', short: 'FRI' },
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
  title = '',
  subtitle = '',
  interactive = false,
  onSlotClick = null,
  selectedSlot = null,
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden transition-all">
      {/* Header Info */}
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-stone-200 bg-cream-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-ink-900 tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-ink-500 font-medium">{subtitle}</p>}
          </div>
          {interactive && (
            <div className="flex items-center space-x-2 text-[11px] text-ink-500 font-medium bg-cream-200/80 px-3 py-1 rounded-lg border border-stone-300/60 no-print">
              <span className="w-2 h-2 rounded-full bg-stone-900"></span>
              <span>Click any class to move slot</span>
            </div>
          )}
        </div>
      )}

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[1000px]">
          <thead>
            {/* Top Spanning Header: PERIODS */}
            <tr className="bg-cream-200/80 border-b border-stone-300/80">
              <th className="p-2.5 w-32 border-r border-stone-300/80 text-center font-bold text-[11px] text-ink-600 uppercase tracking-wider">
                DAYS
              </th>
              <th
                colSpan={PERIOD_COLUMNS.length}
                className="p-2.5 text-center font-bold text-xs uppercase tracking-widest text-ink-900 font-mono"
              >
                PERIODS
              </th>
            </tr>

            {/* Sub-Header: 1st, 2nd, 3rd... with exact Time Ranges */}
            <tr className="bg-cream-100/90 border-b border-stone-200 text-ink-700 text-xs">
              <th className="p-2.5 border-r border-stone-200 text-center font-mono text-[10px] text-ink-400">
                WEEKDAY
              </th>
              {PERIOD_COLUMNS.map((col) => {
                if (col.isBreak) {
                  return (
                    <th
                      key={col.id}
                      className="p-2 text-center w-24 bg-cream-200/60 border-r border-stone-200 font-mono text-[10px] font-bold text-ink-600 uppercase tracking-tight"
                    >
                      <div>BREAK</div>
                      <div className="text-[9px] text-ink-400 font-normal">{col.time}</div>
                    </th>
                  );
                }

                return (
                  <th
                    key={col.id}
                    className="p-2 text-center border-r last:border-r-0 border-stone-200 font-mono"
                  >
                    <div className="font-bold text-xs text-ink-900">{col.label}</div>
                    <div className="text-[10px] text-ink-500 font-medium whitespace-nowrap mt-0.5">
                      {col.time}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-200/80">
            {DAYS.map((day) => (
              <tr key={day.id} className="hover:bg-cream-50/30 transition-colors">
                
                {/* Day Row Label */}
                <td className="p-3.5 text-center border-r border-stone-200 bg-cream-50/70 align-middle">
                  <div className="font-bold text-xs text-ink-900 tracking-wider font-mono">
                    {day.name}
                  </div>
                  <div className="text-[10px] text-ink-400 font-medium">Day {day.id}</div>
                </td>

                {/* Period Cells */}
                {PERIOD_COLUMNS.map((period) => {
                  // Recess Break Column Cell
                  if (period.isBreak) {
                    return (
                      <td
                        key={period.id}
                        className="p-2 text-center bg-cream-200/40 border-r border-stone-200 align-middle"
                      >
                        <div className="flex flex-col items-center justify-center space-y-1 text-ink-400">
                          <Coffee className="w-3.5 h-3.5 opacity-60" />
                          <span className="text-[9px] font-mono font-semibold tracking-wider uppercase writing-mode-vertical">
                            RECESS
                          </span>
                        </div>
                      </td>
                    );
                  }

                  // Academic Class Cell
                  const entry = gridData?.[day.id]?.[period.id];
                  const isSelected = selectedSlot?.day === day.id && selectedSlot?.slot === period.id;

                  return (
                    <td
                      key={period.id}
                      onClick={() => interactive && onSlotClick && onSlotClick(day.id, period.id, entry)}
                      className={`p-2 border-r last:border-r-0 border-stone-200 align-top transition-all ${
                        interactive ? 'cursor-pointer' : ''
                      } ${isSelected ? 'ring-2 ring-stone-900 bg-stone-50' : ''}`}
                    >
                      {entry ? (
                        <div
                          className={`p-2.5 rounded-xl border transition-all h-full min-h-[90px] flex flex-col justify-between ${
                            entry.room_name?.includes('LAB')
                              ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950 shadow-2xs'
                              : entry.elective_subject_id
                              ? 'bg-amber-50/70 border-amber-200/80 text-amber-950 shadow-2xs'
                              : 'bg-white border-stone-200/90 text-ink-900 shadow-2xs hover:border-stone-400'
                          }`}
                        >
                          <div>
                            {/* Subject Code & Tag */}
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-mono font-bold text-xs tracking-tight text-ink-900">
                                {entry.subject_code}
                              </span>
                              {entry.room_name?.includes('LAB') ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                                  LAB
                                </span>
                              ) : entry.elective_subject_id ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                                  NEP
                                </span>
                              ) : null}
                            </div>

                            {/* Subject Name */}
                            <p className="text-[11px] font-semibold text-ink-800 line-clamp-2 leading-tight">
                              {entry.subject_name}
                            </p>
                          </div>

                          {/* Room & Teacher Meta */}
                          <div className="mt-2 pt-1.5 border-t border-stone-200/60 space-y-0.5 text-[10px] text-ink-500 font-medium">
                            {entry.room_name && (
                              <div className="flex items-center space-x-1 font-mono">
                                <MapPin className="w-3 h-3 text-ink-400 flex-shrink-0" />
                                <span className="font-bold text-ink-800">{entry.room_name}</span>
                              </div>
                            )}
                            {entry.faculty_name && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3 text-ink-400 flex-shrink-0" />
                                <span className="truncate">{entry.faculty_name}</span>
                              </div>
                            )}
                            {entry.cohort_name && (
                              <div className="flex items-center space-x-1">
                                <BookOpen className="w-3 h-3 text-ink-400 flex-shrink-0" />
                                <span className="truncate">{entry.cohort_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`h-full min-h-[90px] rounded-xl border border-dashed flex items-center justify-center transition-all ${
                            interactive
                              ? 'border-stone-300/80 hover:border-stone-500 hover:bg-cream-100/60'
                              : 'border-stone-200/50 bg-cream-50/20'
                          }`}
                        >
                          <span className="text-[10px] text-ink-300 font-mono font-medium">
                            {interactive ? '+ Free Slot' : '—'}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

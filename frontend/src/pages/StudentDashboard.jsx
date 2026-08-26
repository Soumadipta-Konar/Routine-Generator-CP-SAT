import React, { useState, useEffect } from 'react';
import { GraduationCap, Printer, RotateCw, BookOpen, Sparkles, CheckCircle } from 'lucide-react';
import VisualGrid from '../components/VisualGrid';
import { api } from '../services/api';

export default function StudentDashboard() {
  const [selectedCohort, setSelectedCohort] = useState(1);
  const [gridData, setGridData] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchStudentRoutine = async () => {
    setLoading(true);
    try {
      const res = await api.getCohortRoutine(selectedCohort);
      setGridData(res?.weekly_grid || {});
    } catch (err) {
      console.error('Failed to load student routine', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentRoutine();
  }, [selectedCohort]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      
      {/* Student Welcome & Section Selector */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-500">Student Academic Portal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
            <span className="text-xs text-ink-500 font-medium">NEP 2020 Compliant</span>
          </div>
          <h1 className="text-lg font-bold text-ink-900 tracking-tight mt-0.5">My Class Routine & Electives</h1>
        </div>

        {/* Section Selector & Print */}
        <div className="flex items-center space-x-3 no-print">
          <label className="text-xs font-bold text-ink-700 whitespace-nowrap">
            Select Section:
          </label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(parseInt(e.target.value, 10))}
            className="bg-cream-50 border border-stone-300 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            {Array.from({ length: 30 }, (_, i) => i + 1).map((id) => (
              <option key={id} value={id}>
                Section {id} (Semester {((id % 8) + 1)})
              </option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cream-200 text-ink-800 hover:bg-cream-300 transition-all border border-stone-300/70"
          >
            <Printer className="w-3.5 h-3.5 text-ink-600" />
            <span>Print Routine</span>
          </button>
        </div>
      </div>

      {/* Routine Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-ink-600 bg-cream-50 p-3 rounded-xl border border-stone-200/70 no-print">
        <span className="font-bold text-ink-900 uppercase tracking-wider text-[10px]">Legend:</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-white border border-stone-300"></span>
          <span>Core Lecture</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
          <span>Practical Lab Session</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>
          <span>NEP Elective Course</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-cream-300 border border-stone-300"></span>
          <span>Recess Break</span>
        </div>
      </div>

      {/* 2D Timetable Visual Matrix */}
      <VisualGrid
        gridData={gridData}
        title={`Academic Routine: Section ${selectedCohort}`}
        subtitle="Weekly clash-free timetable showing core subjects and individually registered electives"
        interactive={false}
      />

    </div>
  );
}

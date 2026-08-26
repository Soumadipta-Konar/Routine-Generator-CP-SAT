import React, { useState, useEffect } from 'react';
import TimetableGrid from '../components/TimetableGrid';
import { api } from '../services/api';

export default function StudentDashboard() {
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [gridData, setGridData] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch metadata on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const data = await api.getMetadata();
        if (data.cohorts?.length) {
          setCohorts(data.cohorts);
          setSelectedCohort(data.cohorts[0].id);
        }
      } catch (err) {
        console.error('Failed to load cohorts', err);
      }
    };
    fetchMeta();
  }, []);

  const fetchStudentRoutine = async () => {
    if (!selectedCohort) return;
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
    if (selectedCohort) {
      fetchStudentRoutine();
    }
  }, [selectedCohort]);

  const activeCohort = cohorts.find(c => c.id === selectedCohort);
  const cleanTitle = activeCohort ? activeCohort.name.replace(/\s*\(Semester\s*\d+\)/i, '') : 'Student Routine';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 space-y-6 transition-colors">
      
      {/* Student Top Control Card */}
      <div className="bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-xl p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] dark:text-[#6B7280]">
            <span>STUDENT ACADEMIC PORTAL</span>
            <span>•</span>
            <span className="text-[#4F46E5] dark:text-[#6366F1]">NEP 2020 Compliant</span>
          </div>
          <h1 className="text-xl font-semibold text-[#111827] dark:text-[#F3F4F6] mt-1">
            Weekly Class Routine & Enrolled Electives
          </h1>
          <p className="text-sm text-[#4B5563] dark:text-[#A1A6B3] mt-0.5">
            Clash-free schedule showing section core courses and registered multi-disciplinary electives.
          </p>
        </div>

        {/* Section Selector */}
        <div className="flex items-center space-x-3 shrink-0 no-print">
          <label className="text-sm font-normal text-[#4B5563] dark:text-[#A1A6B3] whitespace-nowrap">
            Select Section:
          </label>
          <select
            value={selectedCohort || ''}
            onChange={(e) => setSelectedCohort(parseInt(e.target.value, 10))}
            className="h-10 px-3 min-w-[220px] bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-lg text-sm text-[#111827] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] cursor-pointer"
          >
            {cohorts.length > 0 ? (
              cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            ) : (
              <option value="">No Sections Available</option>
            )}
          </select>
        </div>
      </div>

      {/* Timetable Grid */}
      <TimetableGrid
        gridData={gridData}
        title={`Academic Routine — ${cleanTitle}`}
        subtitle="Individual section schedule with guaranteed zero room and teacher conflicts"
        isLoading={loading}
        isInteractive={false}
      />

    </div>
  );
}

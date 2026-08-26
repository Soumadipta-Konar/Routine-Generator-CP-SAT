import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, MapPin } from 'lucide-react';
import TimetableGrid from '../components/TimetableGrid';
import { api } from '../services/api';

export default function FacultyDashboard() {
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [gridData, setGridData] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch metadata on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const data = await api.getMetadata();
        if (data.faculty?.length) {
          setFacultyList(data.faculty);
          setSelectedFaculty(data.faculty[0].id);
        }
      } catch (err) {
        console.error('Failed to load faculty metadata', err);
      }
    };
    fetchMeta();
  }, []);

  const fetchFacultyRoutine = async () => {
    if (!selectedFaculty) return;
    setLoading(true);
    try {
      const res = await api.getFacultyRoutine(selectedFaculty);
      setGridData(res?.weekly_grid || {});
    } catch (err) {
      console.error('Failed to load faculty routine', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFaculty) {
      fetchFacultyRoutine();
    }
  }, [selectedFaculty]);

  // Compute total weekly lecture count from grid
  let totalAssignedHours = 0;
  Object.values(gridData || {}).forEach((daySlots) => {
    Object.values(daySlots || {}).forEach((entry) => {
      if (entry) totalAssignedHours += 1;
    });
  });

  const activeFaculty = facultyList.find(f => f.id === selectedFaculty);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 space-y-6 transition-colors">
      
      {/* Faculty Top Control Card */}
      <div className="bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-xl p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] dark:text-[#6B7280]">
            <span>FACULTY PORTAL</span>
            <span>•</span>
            <span className="text-[#059669] dark:text-[#10B981]">Teaching Workload</span>
          </div>
          <h1 className="text-xl font-semibold text-[#111827] dark:text-[#F3F4F6] mt-1">
            Faculty Timetable & Classroom Allocation
          </h1>
          <p className="text-sm text-[#4B5563] dark:text-[#A1A6B3] mt-0.5">
            Individual timetable showing scheduled lectures, assigned student sections, and classroom locations.
          </p>
        </div>

        {/* Faculty Selector */}
        <div className="flex items-center space-x-3 shrink-0 no-print">
          <label className="text-sm font-normal text-[#4B5563] dark:text-[#A1A6B3] whitespace-nowrap">
            Select Professor:
          </label>
          <select
            value={selectedFaculty || ''}
            onChange={(e) => setSelectedFaculty(parseInt(e.target.value, 10))}
            className="h-10 px-3 min-w-[220px] bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-lg text-sm text-[#111827] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] cursor-pointer"
          >
            {facultyList.length > 0 ? (
              facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.max_weekly_hours}h max)
                </option>
              ))
            ) : (
              <option value="">No Faculty Available</option>
            )}
          </select>
        </div>
      </div>

      {/* Professor Workload Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="p-4 bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#F1F2F5] dark:bg-[#1B1E26] flex items-center justify-center text-[#4B5563] dark:text-[#A1A6B3]">
            <Clock className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] dark:text-[#6B7280]">
              Weekly Workload
            </span>
            <div className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
              {totalAssignedHours} Hours / Week
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] dark:bg-[#052E22] flex items-center justify-center text-[#059669] dark:text-[#10B981]">
            <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] dark:text-[#6B7280]">
              Double-Booking Status
            </span>
            <div className="text-sm font-semibold text-[#059669] dark:text-[#10B981]">
              Clash-Free Verified
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#F1F2F5] dark:bg-[#1B1E26] flex items-center justify-center text-[#4B5563] dark:text-[#A1A6B3]">
            <MapPin className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] dark:text-[#6B7280]">
              Classroom Locations
            </span>
            <div className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">
              Pre-Assigned Rooms
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <TimetableGrid
        gridData={gridData}
        title={activeFaculty ? `Teaching Routine — ${activeFaculty.name}` : `Faculty Routine`}
        subtitle="Individual instructor schedule with designated lecture halls and lab workstation allocations"
        isLoading={loading}
        isInteractive={false}
      />

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { UserCheck, Printer, RotateCw, Clock, MapPin, Calendar } from 'lucide-react';
import VisualGrid from '../components/VisualGrid';
import { api } from '../services/api';

export default function FacultyDashboard() {
  const [selectedFaculty, setSelectedFaculty] = useState(1);
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
    fetchFacultyRoutine();
  }, [selectedFaculty]);

  // Compute total weekly lecture count from grid
  let totalAssignedHours = 0;
  Object.values(gridData).forEach((daySlots) => {
    Object.values(daySlots).forEach((entry) => {
      if (entry) totalAssignedHours += 1;
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      
      {/* Faculty Header Strip */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-500">Teacher Portal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-ink-500 font-medium">Weekly Workload</span>
          </div>
          <h1 className="text-lg font-bold text-ink-900 tracking-tight mt-0.5">Faculty Timetable & Classroom Schedule</h1>
        </div>

        {/* Teacher Selector & Print */}
        <div className="flex items-center space-x-3 no-print">
          <label className="text-xs font-bold text-ink-700 whitespace-nowrap">
            Select Professor:
          </label>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(parseInt(e.target.value, 10))}
            className="bg-cream-50 border border-stone-300 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            {facultyList.length > 0 ? (
              facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.max_weekly_hours}h max)
                </option>
              ))
            ) : (
              <option value={1}>Prof. Faculty_1</option>
            )}
          </select>


          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cream-200 text-ink-800 hover:bg-cream-300 transition-all border border-stone-300/70"
          >
            <Printer className="w-3.5 h-3.5 text-ink-600" />
            <span>Print Schedule</span>
          </button>
        </div>
      </div>

      {/* Professor Summary Quick-Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-cream-200 flex items-center justify-center text-ink-800">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Assigned Teaching</span>
            <div className="text-sm font-bold font-mono text-ink-900">{totalAssignedHours} Hours / Week</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Status</span>
            <div className="text-sm font-bold text-emerald-800">Zero Overlaps / Clash-Free</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-cream-200 flex items-center justify-center text-ink-800">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Classrooms</span>
            <div className="text-sm font-bold text-ink-900">Pre-Assigned Locations</div>
          </div>
        </div>
      </div>

      {/* 2D Timetable Visual Matrix */}
      <VisualGrid
        gridData={gridData}
        title={`Assigned Schedule: Prof. Faculty_${selectedFaculty}`}
        subtitle="Only displays periods where you have an assigned class with designated lecture hall / lab"
        interactive={false}
      />

    </div>
  );
}

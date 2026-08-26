import React, { useState, useEffect } from 'react';
import { Play, RotateCw, Layers, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import VisualGrid from '../components/VisualGrid';
import ExcelUploader from '../components/ExcelUploader';
import ClashBanner from '../components/ClashBanner';
import ManualOverrideModal from '../components/ManualOverrideModal';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [filterType, setFilterType] = useState('cohort'); // 'cohort' | 'faculty' | 'room'
  const [selectedId, setSelectedId] = useState(1);
  const [gridData, setGridData] = useState({});
  const [meta, setMeta] = useState({ cohorts: [], faculty: [], rooms: [] });
  const [loading, setLoading] = useState(false);
  const [solving, setSolving] = useState(false);
  const [solverResult, setSolverResult] = useState(null);
  const [banner, setBanner] = useState({ error: null, success: false, message: '' });
  const [overrideEntry, setOverrideEntry] = useState(null);
  const [showUploader, setShowUploader] = useState(false);

  // Fetch dynamic metadata (Cohorts, Faculty, Rooms)
  const fetchMeta = async () => {
    try {
      const data = await api.getMetadata();
      setMeta(data);
      if (data.cohorts?.length && !selectedId) {
        setSelectedId(data.cohorts[0].id);
      }
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  // Fetch routine based on current filter selection
  const fetchRoutine = async () => {
    setLoading(true);
    try {
      let res;
      if (filterType === 'cohort') {
        res = await api.getCohortRoutine(selectedId);
      } else if (filterType === 'faculty') {
        res = await api.getFacultyRoutine(selectedId);
      } else if (filterType === 'room') {
        res = await api.getRoomRoutine(selectedId);
      }
      setGridData(res?.weekly_grid || {});
    } catch (err) {
      console.error('Failed to load routine', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutine();
  }, [filterType, selectedId]);


  // Run Solver
  const handleRunSolver = async () => {
    setSolving(true);
    setBanner({ error: null, success: false, message: '' });
    try {
      const res = await api.triggerSolver();
      setSolverResult(res);
      setBanner({
        error: null,
        success: true,
        message: `Solver completed in ${res.solve_duration_seconds}s! Status: ${res.status}. ${res.total_entries_created} class entries persisted to database.`
      });
      fetchRoutine();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setBanner({
        error: 'SOLVER_ERROR',
        success: false,
        message: `Solver failed: ${errMsg}`
      });
    } finally {
      setSolving(false);
    }
  };

  // Handle slot click in grid
  const handleSlotClick = (day, slot, entry) => {
    if (entry) {
      setOverrideEntry(entry);
    }
  };

  const handleOverrideSuccess = (msg) => {
    setBanner({ error: null, success: true, message: msg });
    fetchRoutine();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      
      {/* Executive Command Strip */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-500">Administrative Operations</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
            <span className="text-xs text-ink-500 font-medium">Phase 4 REST API</span>
          </div>
          <h1 className="text-lg font-bold text-ink-900 tracking-tight mt-0.5">Master Timetable Management</h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cream-200 text-ink-800 hover:bg-cream-300 transition-all border border-stone-300/70"
          >
            <FileSpreadsheet className="w-4 h-4 text-ink-600" />
            <span>{showUploader ? 'Close Uploader' : 'Upload Excel'}</span>
          </button>

          <button
            onClick={handleRunSolver}
            disabled={solving}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-sm disabled:opacity-50"
          >
            {solving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-300" />
                <span>Running CP-SAT Engine...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run CP-SAT Solver</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Excel Uploader Collapse Box */}
      {showUploader && (
        <ExcelUploader onUploadSuccess={() => { setShowUploader(false); fetchRoutine(); }} />
      )}

      {/* Solver Metric Badge */}
      {solverResult && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Engine Status</span>
            <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">{solverResult.status}</div>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Execution Time</span>
            <div className="text-sm font-bold font-mono text-ink-900 mt-0.5">{solverResult.solve_duration_seconds}s</div>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Weekly Classes</span>
            <div className="text-sm font-bold font-mono text-ink-900 mt-0.5">{solverResult.total_entries_created}</div>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Objective Score</span>
            <div className="text-sm font-bold font-mono text-ink-900 mt-0.5">{solverResult.objective_value}</div>
          </div>
        </div>
      )}

      {/* Clash Notification Banner */}
      <ClashBanner
        error={banner.error}
        success={banner.success}
        message={banner.message}
        onClose={() => setBanner({ error: null, success: false, message: '' })}
      />

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Filter Type Radio Tabs */}
        <div className="flex items-center space-x-1.5 bg-cream-100 p-1 rounded-xl border border-stone-200">
          {[
            { id: 'cohort', label: 'By Cohort Section' },
            { id: 'faculty', label: 'By Faculty' },
            { id: 'room', label: 'By Room Space' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setFilterType(tab.id); setSelectedId(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === tab.id
                  ? 'bg-white text-ink-900 shadow-xs border border-stone-200 font-bold'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Entity Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-ink-700 whitespace-nowrap">
            Select {filterType === 'cohort' ? 'Cohort' : filterType === 'faculty' ? 'Teacher' : 'Room'}:
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(parseInt(e.target.value, 10))}
            className="bg-cream-50 border border-stone-300 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            {filterType === 'cohort' && (
              meta.cohorts?.length > 0 ? (
                meta.cohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} (Semester {c.semester} • Size: {c.size})</option>
                ))
              ) : (
                <option value={1}>Cohort #1</option>
              )
            )}
            {filterType === 'faculty' && (
              meta.faculty?.length > 0 ? (
                meta.faculty.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.max_weekly_hours}h/wk max)</option>
                ))
              ) : (
                <option value={1}>Faculty #1</option>
              )
            )}
            {filterType === 'room' && (
              meta.rooms?.length > 0 ? (
                meta.rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} — {r.room_type} (Cap: {r.capacity})</option>
                ))
              ) : (
                <option value={1}>Room #1</option>
              )
            )}
          </select>


          <button
            onClick={fetchRoutine}
            disabled={loading}
            className="p-2 rounded-xl border border-stone-200 text-ink-500 hover:text-ink-900 hover:bg-cream-100 transition-colors"
            title="Refresh Grid"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* Main 2D Timetable Visual Matrix */}
      <VisualGrid
        gridData={gridData}
        title={`Weekly Routine Matrix: ${filterType.toUpperCase()} #${selectedId}`}
        subtitle="Click any scheduled block to reassign period or resolve conflict"
        interactive={true}
        onSlotClick={handleSlotClick}
      />

      {/* Manual Override Modal */}
      {overrideEntry && (
        <ManualOverrideModal
          entry={overrideEntry}
          onClose={() => setOverrideEntry(null)}
          onSuccess={handleOverrideSuccess}
        />
      )}

    </div>
  );
}

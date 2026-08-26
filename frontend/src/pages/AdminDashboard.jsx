import React, { useState, useEffect } from 'react';
import PageHeaderCard from '../components/PageHeaderCard';
import ToolbarCard from '../components/ToolbarCard';
import TimetableGrid from '../components/TimetableGrid';
import ExcelUploader from '../components/ExcelUploader';
import ManualOverrideModal from '../components/ManualOverrideModal';
import Toast from '../components/Toast';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [filterType, setFilterType] = useState('cohort'); // 'cohort' | 'faculty' | 'room'
  const [selectedId, setSelectedId] = useState(null);
  const [gridData, setGridData] = useState({});
  const [meta, setMeta] = useState({ cohorts: [], faculty: [], rooms: [] });
  const [loading, setLoading] = useState(false);
  const [solving, setSolving] = useState(false);
  const [overrideEntry, setOverrideEntry] = useState(null);
  const [overrideSlot, setOverrideSlot] = useState({ dayId: 1, periodId: 1 });
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [conflictCount, setConflictCount] = useState(0);

  // Fetch dynamic metadata (Cohorts, Faculty, Rooms)
  const fetchMeta = async () => {
    try {
      const data = await api.getMetadata();
      setMeta(data || { cohorts: [], faculty: [], rooms: [] });
      
      // Auto-select first available entity if none selected
      if (filterType === 'cohort' && data.cohorts?.length > 0) {
        setSelectedId((prev) => (data.cohorts.some(c => c.id === prev) ? prev : data.cohorts[0].id));
      } else if (filterType === 'faculty' && data.faculty?.length > 0) {
        setSelectedId((prev) => (data.faculty.some(f => f.id === prev) ? prev : data.faculty[0].id));
      } else if (filterType === 'room' && data.rooms?.length > 0) {
        setSelectedId((prev) => (data.rooms.some(r => r.id === prev) ? prev : data.rooms[0].id));
      }
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  // Handle switching between Cohort / Faculty / Room tabs
  const handleFilterTabChange = (newType) => {
    setFilterType(newType);
    if (newType === 'cohort' && meta.cohorts?.length > 0) {
      setSelectedId(meta.cohorts[0].id);
    } else if (newType === 'faculty' && meta.faculty?.length > 0) {
      setSelectedId(meta.faculty[0].id);
    } else if (newType === 'room' && meta.rooms?.length > 0) {
      setSelectedId(meta.rooms[0].id);
    } else {
      setSelectedId(null);
    }
  };

  // Fetch routine based on current filter selection
  const fetchRoutine = async () => {
    if (!selectedId) {
      setGridData({});
      return;
    }
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
    if (selectedId) {
      fetchRoutine();
    }
  }, [filterType, selectedId]);

  // Run Solver
  const handleRunSolver = async () => {
    setSolving(true);
    try {
      const res = await api.triggerSolver();
      setToast({
        type: 'success',
        message: `Solver finished in ${res.solve_duration_seconds}s with status '${res.status}'. ${res.total_entries_created} classes generated.`
      });
      await fetchMeta();
      await fetchRoutine();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setToast({
        type: 'danger',
        message: `Solver failed: ${errMsg}`
      });
    } finally {
      setSolving(false);
    }
  };

  // Handle slot click (Populated Block or Free Slot)
  const handleSlotClick = (dayId, periodId, entry) => {
    setOverrideEntry(entry);
    setOverrideSlot({ dayId, periodId });
    setShowOverrideModal(true);
  };

  const handleOverrideSuccess = (msg) => {
    setToast({ type: 'success', message: msg || 'Schedule slot updated successfully.' });
    fetchRoutine();
  };

  // Title Formatter without redundant "Semester" text
  const getMatrixTitle = () => {
    if (!selectedId) return 'Weekly Routine Matrix';
    if (filterType === 'cohort') {
      const c = meta.cohorts.find(x => x.id === selectedId);
      if (!c) return `Weekly Routine Matrix — Cohort #${selectedId}`;
      const cleanName = c.name.replace(/\s*\(Semester\s*\d+\)/i, '');
      return `Weekly Routine Matrix — ${cleanName}`;
    }
    if (filterType === 'faculty') {
      const f = meta.faculty.find(x => x.id === selectedId);
      return f ? `Weekly Routine Matrix — ${f.name}` : `Weekly Routine Matrix — Faculty #${selectedId}`;
    }
    if (filterType === 'room') {
      const r = meta.rooms.find(x => x.id === selectedId);
      return r ? `Weekly Routine Matrix — Room ${r.name} (${r.room_type})` : `Weekly Routine Matrix — Room #${selectedId}`;
    }
    return 'Weekly Routine Matrix';
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 space-y-6 transition-colors">
      
      {/* 5. Section 2: Page Header Card */}
      <PageHeaderCard
        onUploadClick={() => setShowUploader(!showUploader)}
        onSolveClick={handleRunSolver}
        isSolving={solving}
        showUploader={showUploader}
      />

      {/* Excel Ingestion Drawer */}
      {showUploader && (
        <ExcelUploader
          onUploadSuccess={async () => {
            setShowUploader(false);
            setToast({ type: 'success', message: 'Master workbook parsed and database synchronized.' });
            await fetchMeta();
            await fetchRoutine();
          }}
        />
      )}

      {/* 5. Section 3: Toolbar Card */}
      <ToolbarCard
        filterType={filterType}
        onFilterChange={handleFilterTabChange}
        selectedId={selectedId}
        onSelectEntity={setSelectedId}
        meta={meta}
        onRefresh={fetchRoutine}
        isLoading={loading}
      />

      {/* 5. Section 4: Timetable Card (Header + Legend + Grid) */}
      <TimetableGrid
        gridData={gridData}
        title={getMatrixTitle()}
        subtitle="Generated via Google OR-Tools CP-SAT with verified zero clashes"
        conflictCount={conflictCount}
        isLoading={loading}
        isInteractive={true}
        onSlotClick={handleSlotClick}
        onRunSolverPrompt={handleRunSolver}
      />

      {/* Reassign / Resolve Modal (Section 6.9) */}
      {showOverrideModal && (
        <ManualOverrideModal
          entry={overrideEntry}
          dayId={overrideSlot.dayId}
          periodId={overrideSlot.periodId}
          onClose={() => setShowOverrideModal(false)}
          onSuccess={handleOverrideSuccess}
        />
      )}

      {/* Toast Notification (Section 7) */}
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: 'success', message: '' })}
      />

    </div>
  );
}

import React, { useState } from 'react';
import { X, ArrowRight, AlertTriangle, Check, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';

const DAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
];

const PERIODS = [
  { id: 1, name: 'Period 1 (09:00 - 10:00)' },
  { id: 2, name: 'Period 2 (10:00 - 11:00)' },
  { id: 3, name: 'Period 3 (11:00 - 12:00)' },
  { id: 4, name: 'Period 4 (12:00 - 01:00)' },
  { id: 6, name: 'Period 5 (02:00 - 03:00)' },
  { id: 7, name: 'Period 6 (03:00 - 04:00)' },
  { id: 8, name: 'Period 7 (04:00 - 05:00)' },
  { id: 9, name: 'Period 8 (05:00 - 06:00)' },
];

export default function ManualOverrideModal({ entry, onClose, onSuccess }) {
  const [targetDay, setTargetDay] = useState(entry?.day_of_week || 1);
  const [targetSlot, setTargetSlot] = useState(entry?.period_slot_id || 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!entry) return null;

  const handleApply = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        schedule_entry_id: entry.id,
        target_day: parseInt(targetDay, 10),
        target_period_slot_id: parseInt(targetSlot, 10),
      };
      const res = await api.overrideScheduleSlot(payload);
      if (onSuccess) onSuccess(res.message);
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-cream-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink-900">Manual Schedule Slot Override</h3>
            <p className="text-[11px] text-ink-500 font-medium">Reassign time slot with live 3-layer clash detection</p>
          </div>
          <button onClick={onClose} className="p-1 text-ink-400 hover:text-ink-700 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Current Class Overview Card */}
          <div className="p-3.5 bg-cream-100 rounded-xl border border-stone-200/90 text-xs">
            <div className="flex items-center justify-between font-mono font-bold text-ink-900 mb-1">
              <span>{entry.subject_code}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cream-300/80 text-ink-800">
                {entry.room_name}
              </span>
            </div>
            <div className="font-semibold text-ink-800 line-clamp-1">{entry.subject_name}</div>
            <div className="text-[11px] text-ink-500 mt-1 flex items-center space-x-2">
              <span>Faculty: {entry.faculty_name}</span>
              <span>•</span>
              <span>Current: Day {entry.day_of_week}, Period {entry.period_slot_id}</span>
            </div>
          </div>

          {/* Target Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-ink-700 uppercase tracking-wider mb-1">
                Target Day
              </label>
              <select
                value={targetDay}
                onChange={(e) => setTargetDay(e.target.value)}
                className="w-full bg-cream-50 border border-stone-300 rounded-lg px-3 py-2 text-xs font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-700 uppercase tracking-wider mb-1">
                Target Period
              </label>
              <select
                value={targetSlot}
                onChange={(e) => setTargetSlot(e.target.value)}
                className="w-full bg-cream-50 border border-stone-300 rounded-lg px-3 py-2 text-xs font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                {PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clash Error Alert */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Clash Conflict: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-cream-50 border-t border-stone-200 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-ink-600 hover:bg-cream-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={saving}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Validating Clash...</span>
              </>
            ) : (
              <>
                <span>Apply Move</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X, AlertTriangle, ArrowRight, Loader2, Check } from 'lucide-react';
import { api } from '../services/api';

const DAYS = [
  { id: 1, name: 'Monday (Day 1)' },
  { id: 2, name: 'Tuesday (Day 2)' },
  { id: 3, name: 'Wednesday (Day 3)' },
  { id: 4, name: 'Thursday (Day 4)' },
  { id: 5, name: 'Friday (Day 5)' },
];

const PERIODS = [
  { id: 1, name: '1st Period (09:00 – 09:55)' },
  { id: 2, name: '2nd Period (09:55 – 10:50)' },
  { id: 3, name: '3rd Period (10:50 – 11:45)' },
  { id: 4, name: '4th Period (11:45 – 12:40)' },
  { id: 6, name: '5th Period (13:50 – 14:45)' },
  { id: 7, name: '6th Period (14:45 – 15:40)' },
  { id: 8, name: '7th Period (15:40 – 16:35)' },
  { id: 9, name: '8th Period (16:35 – 17:30)' },
];

export default function ManualOverrideModal({
  entry = null,
  dayId = 1,
  periodId = 1,
  onClose = () => {},
  onSuccess = () => {},
}) {
  const [targetDay, setTargetDay] = useState(entry?.day_of_week || dayId);
  const [targetSlot, setTargetSlot] = useState(entry?.period_slot_id || periodId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isReassign = Boolean(entry);
  const modalTitle = isReassign ? "Reassign Class Period" : "Schedule Class into Slot";

  const handleApply = async () => {
    if (!entry) {
      onClose();
      return;
    }

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
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-xl shadow-lg max-w-[480px] w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#2A2D37] flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
            {modalTitle}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] rounded-lg hover:bg-[#F1F2F5] dark:hover:bg-[#1B1E26] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Read-only Class Summary Card */}
          {entry && (
            <div className="p-3.5 bg-[#F1F2F5] dark:bg-[#1B1E26] rounded-lg border-l-[3px] border-[#4F46E5] dark:border-[#6366F1] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#111827] dark:text-[#F3F4F6]">
                  {entry.subject_code}
                </span>
                <span className="font-mono text-[0.6875rem] px-1.5 py-0.5 rounded bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] text-[#6B7280] dark:text-[#9CA3AF]">
                  {entry.room_name}
                </span>
              </div>
              <div className="text-sm font-medium text-[#111827] dark:text-[#F3F4F6]">
                {entry.subject_name}
              </div>
              <div className="text-xs text-[#4B5563] dark:text-[#A1A6B3]">
                Instructor: {entry.faculty_name}
              </div>
            </div>
          )}

          {/* Target Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4B5563] dark:text-[#A1A6B3] mb-1.5">
                Target Day
              </label>
              <select
                value={targetDay}
                onChange={(e) => setTargetDay(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-lg text-sm text-[#111827] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] cursor-pointer"
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] dark:text-[#A1A6B3] mb-1.5">
                Target Period
              </label>
              <select
                value={targetSlot}
                onChange={(e) => setTargetSlot(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-lg text-sm text-[#111827] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] cursor-pointer"
              >
                {PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conflict Inline Alert */}
          {error && (
            <div className="p-3 bg-[#FEF2F2] dark:bg-[#450A0A] border border-[#FCA5A5] dark:border-[#991B1B] rounded-lg text-xs text-[#DC2626] dark:text-[#F87171] flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <span className="font-semibold">Schedule Conflict: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-[#2A2D37] bg-[#F1F2F5] dark:bg-[#1B1E26] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-sm font-medium bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] text-[#111827] dark:text-[#F3F4F6] hover:bg-[#F1F2F5] dark:hover:bg-[#1B1E26] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={saving}
            className="h-9 px-4 rounded-lg text-sm font-medium bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-all shadow-sm disabled:opacity-50 inline-flex items-center space-x-1.5 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                <span>Checking Clashes…</span>
              </>
            ) : (
              <>
                <span>Save Changes</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

import React from 'react';
import { AlertTriangle, CheckCircle2, X, Info } from 'lucide-react';

export default function ClashBanner({ error, success, message, onClose }) {
  if (!error && !success && !message) return null;

  const isError = Boolean(error);

  return (
    <div className={`p-4 rounded-2xl border mb-6 flex items-start justify-between shadow-xs transition-all animate-in fade-in duration-200 ${
      isError 
        ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200 dark:bg-rose-950/40' 
        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 dark:bg-emerald-950/40'
    }`}>
      <div className="flex items-start space-x-3">
        {isError ? (
          <div className="w-7 h-7 rounded-xl bg-rose-500/20 dark:bg-rose-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider">
            {isError 
              ? (error === 'ROOM_CLASH' ? 'Room Clash Detected' : error === 'FACULTY_CLASH' ? 'Faculty Double-Booking Clash' : error === 'SOLVER_ERROR' ? 'Solver Notice' : 'Schedule Conflict') 
              : 'Operation Successful'}
          </h4>
          <p className="text-xs font-medium mt-0.5 leading-relaxed opacity-90">
            {message}
          </p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

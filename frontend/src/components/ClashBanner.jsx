import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function ClashBanner({ error, success, message, onClose }) {
  if (!error && !success && !message) return null;

  const isError = Boolean(error);

  return (
    <div className={`p-4 rounded-xl border mb-6 flex items-start justify-between shadow-xs transition-all ${
      isError 
        ? 'bg-rose-50/90 border-rose-200 text-rose-900' 
        : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
    }`}>
      <div className="flex items-start space-x-3">
        {isError ? (
          <div className="w-6 h-6 rounded-md bg-rose-200/80 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-md bg-emerald-200/80 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
        )}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider">
            {isError ? (error === 'ROOM_CLASH' ? 'Room Clash Detected' : error === 'FACULTY_CLASH' ? 'Faculty Double-Booking Clash' : 'Schedule Conflict') : 'Operation Successful'}
          </h4>
          <p className="text-xs font-medium mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-ink-400 hover:text-ink-700 p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

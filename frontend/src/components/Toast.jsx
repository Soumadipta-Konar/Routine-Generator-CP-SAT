import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function Toast({ 
  type = 'success', 
  message = '', 
  onClose = () => {},
  duration = 4000 
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] shadow-sm rounded-lg px-4 py-3 flex items-center space-x-3 min-w-[280px] max-w-md">
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" strokeWidth={1.75} />
        ) : (
          <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" strokeWidth={1.75} />
        )}
        <div className="text-sm font-medium text-[#111827] dark:text-[#F3F4F6] flex-1">
          {message}
        </div>
        <button
          onClick={onClose}
          className="text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] transition-colors p-1"
        >
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

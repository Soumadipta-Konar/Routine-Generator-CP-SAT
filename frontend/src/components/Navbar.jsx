import React from 'react';
import { ShieldCheck, GraduationCap, UserCheck, Calendar } from 'lucide-react';

export default function Navbar({ activePortal, setActivePortal }) {
  const portals = [
    { id: 'admin', label: 'Admin Portal', icon: ShieldCheck, role: 'Registrar & Academic Admin' },
    { id: 'student', label: 'Student Portal', icon: GraduationCap, role: 'Section & Elective Schedules' },
    { id: 'faculty', label: 'Faculty Portal', icon: UserCheck, role: 'Teacher Timetables & Hours' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-cream-100/95 backdrop-blur-md border-b border-stone-200/80 px-6 py-3.5 transition-all no-print">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Header */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-stone-900 text-cream-100 flex items-center justify-center shadow-sm">
            <Calendar className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-semibold tracking-tight text-ink-900">OptiRoutine</span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-stone-200 text-ink-700">CP-SAT</span>
            </div>
            <p className="text-[11px] text-ink-500 font-medium">Automatic University Timetable Engine</p>
          </div>
        </div>

        {/* Minimalist Portal Switcher Tabs */}
        <div className="flex items-center bg-cream-200/90 p-1 rounded-xl border border-stone-300/60 shadow-inner">
          {portals.map((p) => {
            const Icon = p.icon;
            const isActive = activePortal === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePortal(p.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-ink-900 shadow-sm border border-stone-200/80 font-bold'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-cream-100/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-stone-900' : 'text-ink-400'}`} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Indicator */}
        <div className="hidden lg:flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[11px] font-mono font-medium text-ink-500">PostgreSQL Ready</span>
        </div>

      </div>
    </header>
  );
}

import React from 'react';
import { ShieldCheck, GraduationCap, UserCheck, ArrowRight, Calendar, Sparkles } from 'lucide-react';

export default function PortalGateway({ onSelectPortal }) {
  const portals = [
    {
      id: 'admin',
      title: 'Administrator & Registrar Console',
      subdomain: 'admin.university.edu',
      badge: 'Registrar & Head of Dept',
      icon: ShieldCheck,
      description: 'Run the Google OR-Tools CP-SAT solver, ingest master Excel workbooks, and perform manual slot swaps with real-time clash detection.',
      features: ['CP-SAT Solver Engine', 'Master Excel Ingestion', '3-Layer Clash Detection', 'Room & Cohort Control'],
      btnText: 'Enter Admin Console',
      color: 'border-stone-300 hover:border-stone-900',
    },
    {
      id: 'student',
      title: 'Student Academic Timetable',
      subdomain: 'student.university.edu',
      badge: 'Undergraduate & PG Students',
      icon: GraduationCap,
      description: 'Access clash-free weekly class schedules, view individually enrolled NEP electives, and export printable routines.',
      features: ['Section Timetables', 'NEP Electives Badging', 'Zero-Conflict Guarantee', 'Print-Friendly Matrix'],
      btnText: 'Open Student Portal',
      color: 'border-amber-200/90 hover:border-amber-500',
    },
    {
      id: 'faculty',
      title: 'Faculty Teaching Schedule',
      subdomain: 'faculty.university.edu',
      badge: 'Professors & Instructors',
      icon: UserCheck,
      description: 'Ultra-simplified, high-contrast timetable showing assigned lecture halls, lab sessions, and weekly teaching workload.',
      features: ['Large Legible Cards', 'Pre-Assigned Rooms', 'Workload Counter', 'Zero-Tech Friction'],
      btnText: 'Open Faculty Portal',
      color: 'border-emerald-200/90 hover:border-emerald-500',
    },

  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
      
      {/* Institutional Hero Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-cream-200 px-3.5 py-1 rounded-full border border-stone-300/70 text-xs font-mono font-semibold text-ink-700">
          <Calendar className="w-3.5 h-3.5" />
          <span>University Timetable Infrastructure</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
          Academic Routine & Timetable Portals
        </h1>
        <p className="text-sm text-ink-500 leading-relaxed">
          Select your institutional role below to access your dedicated schedule application.
        </p>
      </div>

      {/* 3 Distinct Portal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {portals.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              onClick={() => onSelectPortal(p.id)}
              className={`bg-white rounded-2xl border p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${p.color}`}
            >
              <div className="space-y-4">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center text-ink-900 border border-stone-200">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cream-200 text-ink-600">
                    {p.subdomain}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    {p.badge}
                  </span>
                  <h2 className="text-base font-bold text-ink-900 tracking-tight mt-0.5">
                    {p.title}
                  </h2>
                </div>

                <p className="text-xs text-ink-600 leading-relaxed">
                  {p.description}
                </p>

                {/* Feature List */}
                <div className="pt-2 border-t border-stone-100 space-y-1.5">
                  {p.features.map((feat, i) => (
                    <div key={i} className="flex items-center space-x-2 text-[11px] text-ink-500 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-xs"
                >
                  <span>{p.btnText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

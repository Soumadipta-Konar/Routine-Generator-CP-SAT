import React from 'react';
import { ShieldCheck, GraduationCap, UserCheck, ArrowRight, Calendar } from 'lucide-react';

export default function PortalGateway({ onSelectPortal = () => {} }) {
  const portals = [
    {
      id: 'admin',
      title: 'Administrator Console',
      subdomain: 'admin.university.edu',
      badge: 'Registrar & HoD',
      icon: ShieldCheck,
      description: 'Run the Google OR-Tools CP-SAT solver, ingest master spreadsheets, and perform manual slot swaps with real-time clash detection.',
      features: ['CP-SAT Solver Engine', 'Master Excel Ingestion', '3-Layer Clash Detection', 'Room & Cohort Control'],
      btnText: 'Enter Admin Console',
    },
    {
      id: 'student',
      title: 'Student Academic Timetable',
      subdomain: 'student.university.edu',
      badge: 'UG & PG Students',
      icon: GraduationCap,
      description: 'Access clash-free weekly class schedules, view individually enrolled NEP electives, and export printable routines.',
      features: ['Section Timetables', 'NEP Electives Badging', 'Zero-Conflict Guarantee', 'Print-Friendly Matrix'],
      btnText: 'Open Student Portal',
    },
    {
      id: 'faculty',
      title: 'Faculty Teaching Schedule',
      subdomain: 'faculty.university.edu',
      badge: 'Professors & Instructors',
      icon: UserCheck,
      description: 'Clean timetable showing assigned lecture halls, lab sessions, and weekly teaching workload.',
      features: ['Legible Cards', 'Pre-Assigned Rooms', 'Workload Counter', 'Zero Overlaps'],
      btnText: 'Open Faculty Portal',
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 space-y-10 transition-colors">
      
      {/* Hero */}
      <div className="max-w-2xl space-y-2">
        <div className="flex items-center space-x-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] dark:text-[#6B7280]">
          <Calendar className="w-3.5 h-3.5 text-[#4F46E5] dark:text-[#6366F1]" strokeWidth={1.75} />
          <span>University Timetable Infrastructure</span>
        </div>
        <h1 className="text-3xl font-semibold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
          Academic Routine & Timetable Portals
        </h1>
        <p className="text-sm font-normal text-[#4B5563] dark:text-[#A1A6B3] leading-[1.5]">
          Select your institutional role below to access your dedicated schedule application.
        </p>
      </div>

      {/* 3 Portal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {portals.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              onClick={() => onSelectPortal(p.id)}
              className="bg-white dark:bg-[#14161C] border border-[#E5E7EB] dark:border-[#2A2D37] rounded-xl p-6 transition-all duration-150 cursor-pointer flex flex-col justify-between hover:border-[#4F46E5] dark:hover:border-[#6366F1] group"
            >
              <div className="space-y-4">
                
                {/* Header Icon + Subdomain */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#F1F2F5] dark:bg-[#1B1E26] flex items-center justify-center text-[#111827] dark:text-[#F3F4F6] border border-[#E5E7EB] dark:border-[#2A2D37]">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <span className="text-[0.6875rem] font-mono text-[#9CA3AF] dark:text-[#6B7280]">
                    {p.subdomain}
                  </span>
                </div>

                <div>
                  <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] dark:text-[#6B7280]">
                    {p.badge}
                  </span>
                  <h2 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6] mt-1">
                    {p.title}
                  </h2>
                </div>

                <p className="text-xs text-[#4B5563] dark:text-[#A1A6B3] leading-relaxed">
                  {p.description}
                </p>

                {/* Features */}
                <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#2A2D37] space-y-1.5">
                  {p.features.map((feat, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-[#4B5563] dark:text-[#A1A6B3]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] dark:bg-[#6B7280]"></div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Enter Button */}
              <div className="pt-6">
                <button
                  className="w-full h-10 px-4 rounded-lg text-sm font-medium bg-[#111827] dark:bg-[#F3F4F6] text-white dark:text-[#111827] group-hover:bg-[#4F46E5] dark:group-hover:bg-[#6366F1] dark:group-hover:text-white transition-colors inline-flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{p.btnText}</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

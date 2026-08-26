import React from 'react';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ currentPortal = 'admin', onNavigate = () => {} }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#14161C] border-b border-[#E5E7EB] dark:border-[#2A2D37] h-16 px-4 sm:px-8 transition-colors no-print">
      <div className="max-w-[1440px] h-full mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Portals Hub Button, Divider, Registrar Pill, Administrator Console */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => onNavigate('gateway')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-[#4B5563] dark:text-[#A1A6B3] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F1F2F5] dark:hover:bg-[#1B1E26] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            <span>Portals Hub</span>
          </button>

          {/* 1px Vertical Hairline */}
          <div className="h-5 w-px bg-[#E5E7EB] dark:bg-[#2A2D37]" />

          {/* Role Pill Badge */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold tracking-wider uppercase bg-[#EEF2FF] dark:bg-[#1E1F3A] text-[#4F46E5] dark:text-[#6366F1]">
            {currentPortal === 'admin' ? 'REGISTRAR' : currentPortal === 'student' ? 'STUDENT' : 'FACULTY'}
          </span>

          {/* Context Label */}
          <span className="text-[0.9375rem] font-medium text-[#111827] dark:text-[#F3F4F6] hidden md:inline">
            {currentPortal === 'admin' ? 'Administrator Console' : currentPortal === 'student' ? 'Student Portal' : 'Faculty Portal'}
          </span>
        </div>

        {/* Right: Segmented Control & Dark Mode Toggle */}
        <div className="flex items-center space-x-3">
          
          {/* Segmented Control for Portals */}
          <div className="bg-[#F1F2F5] dark:bg-[#1B1E26] p-1 rounded-lg inline-flex items-center">
            {[
              { id: 'admin', label: 'Admin' },
              { id: 'student', label: 'Student' },
              { id: 'faculty', label: 'Faculty' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  currentPortal === tab.id
                    ? 'bg-white dark:bg-[#14161C] text-[#111827] dark:text-[#F3F4F6] shadow-sm font-semibold'
                    : 'text-[#4B5563] dark:text-[#A1A6B3] hover:text-[#111827] dark:hover:text-[#F3F4F6]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#4B5563] dark:text-[#A1A6B3] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F1F2F5] dark:hover:bg-[#1B1E26] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
            ) : (
              <Moon className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>

        </div>

      </div>
    </header>
  );
}

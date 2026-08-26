import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import PortalGateway from './pages/PortalGateway';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';

function AppContent() {
  const getInitialPortal = () => {
    const hash = window.location.hash.toLowerCase().replace('#/', '').replace('#', '');
    const path = window.location.pathname.toLowerCase().replace('/', '');
    const target = hash || path;

    if (['admin', 'administrator'].includes(target)) return 'admin';
    if (['student', 'students'].includes(target)) return 'student';
    if (['faculty', 'prof', 'professor', 'teacher'].includes(target)) return 'faculty';
    return 'gateway';
  };

  const [currentPortal, setCurrentPortal] = useState(getInitialPortal);

  const navigateTo = (portalId) => {
    setCurrentPortal(portalId);
    if (portalId === 'gateway') {
      window.location.hash = '';
    } else {
      window.location.hash = `#/${portalId}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPortal(getInitialPortal());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] dark:bg-[#0B0D12] text-[#111827] dark:text-[#F3F4F6] transition-colors duration-150 font-sans">
      
      {/* 6.1 Top Navigation Bar */}
      <Navbar currentPortal={currentPortal} onNavigate={navigateTo} />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPortal === 'gateway' && <PortalGateway onSelectPortal={navigateTo} />}
        {currentPortal === 'admin' && <AdminDashboard />}
        {currentPortal === 'student' && <StudentDashboard />}
        {currentPortal === 'faculty' && <FacultyDashboard />}
      </main>

      {/* Institutional Hairline Footer */}
      <footer className="border-t border-[#E5E7EB] dark:border-[#2A2D37] bg-white dark:bg-[#14161C] py-4 px-4 sm:px-8 text-xs text-[#9CA3AF] dark:text-[#6B7280] transition-colors no-print">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>University Timetable Platform • Google OR-Tools CP-SAT Optimization Engine</span>
          <span className="font-mono text-[0.6875rem]">NEP 2020 Compliant • Zero-Conflict Guarantee</span>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

import React, { useState, useEffect } from 'react';
import PortalGateway from './pages/PortalGateway';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import { ArrowLeft, ShieldCheck, GraduationCap, UserCheck, Calendar } from 'lucide-react';

export default function App() {
  // Read initial route from window.location.hash or pathname
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

  // Sync hash in URL when portal changes
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
    <div className="min-h-screen flex flex-col bg-cream-100 text-ink-900 font-sans">
      
      {/* Dedicated Portal Top Bar (only shown inside specific portals) */}
      {currentPortal !== 'gateway' && (
        <header className="sticky top-0 z-30 bg-cream-100/95 backdrop-blur-md border-b border-stone-200/80 px-6 py-3 transition-all no-print">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            
            {/* Back to Gateway Hub */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigateTo('gateway')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cream-200 hover:bg-cream-300 text-ink-700 transition-colors border border-stone-300/60"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>University Hub</span>
              </button>

              <div className="h-4 w-px bg-stone-300 hidden sm:block"></div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-ink-900 uppercase">
                  {currentPortal === 'admin' ? '🛡️ Admin Console (admin.university.edu)' : currentPortal === 'student' ? '🎓 Student Portal (student.university.edu)' : '👨‍🏫 Faculty Portal (faculty.university.edu)'}
                </span>

              </div>
            </div>

            {/* Quick Switch Links */}
            <div className="flex items-center space-x-2 text-xs font-medium text-ink-500">
              <span className="text-[11px] text-ink-400 hidden md:inline">Jump to:</span>
              {currentPortal !== 'admin' && (
                <button onClick={() => navigateTo('admin')} className="hover:text-ink-900 hover:underline">
                  Admin
                </button>
              )}
              {currentPortal !== 'student' && (
                <button onClick={() => navigateTo('student')} className="hover:text-ink-900 hover:underline">
                  Student
                </button>
              )}
              {currentPortal !== 'faculty' && (
                <button onClick={() => navigateTo('faculty')} className="hover:text-ink-900 hover:underline">
                  Faculty
                </button>
              )}
            </div>

          </div>
        </header>
      )}

      {/* Main Content View */}
      <main className="flex-1">
        {currentPortal === 'gateway' && <PortalGateway onSelectPortal={navigateTo} />}
        {currentPortal === 'admin' && <AdminDashboard onNavigateHome={() => navigateTo('gateway')} />}
        {currentPortal === 'student' && <StudentDashboard onNavigateHome={() => navigateTo('gateway')} />}
        {currentPortal === 'faculty' && <FacultyDashboard onNavigateHome={() => navigateTo('gateway')} />}
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-stone-200/80 bg-cream-50/50 py-4 px-6 text-center text-xs text-ink-400 font-medium no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Automatic Class Routine Generation System • Google OR-Tools CP-SAT</span>
          <span className="font-mono text-[11px]">Deployable Subdomain Portals (Admin / Student / Faculty)</span>
        </div>
      </footer>

    </div>
  );
}

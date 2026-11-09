import React, { useState } from 'react';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import type { ActiveTab } from './types';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { BookView } from './components/BookView';
import { PotentialMarkView } from './components/PotentialMarkView';
import { SubjectModal } from './components/modals/SubjectModal';
import { ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const { addSubject, setSelectedSubjectId, error, isOwner, ownerEmail } = useAcademic();

  const handleNavigate = (tab: ActiveTab, subjectId?: string) => {
    setActiveTab(tab);
    if (subjectId) {
      setSelectedSubjectId(subjectId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Database Error Banner if any */}
      {error && (
        <div className="bg-rose-500 text-white text-xs px-4 py-2 font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={handleNavigate}
            onOpenCreateSubject={() => setIsCreateSubjectOpen(true)}
          />
        )}

        {activeTab === 'book' && (
          <BookView onOpenCreateSubject={() => setIsCreateSubjectOpen(true)} />
        )}

        {activeTab === 'potential' && (
          <PotentialMarkView onOpenCreateSubject={() => setIsCreateSubjectOpen(true)} />
        )}
      </main>

      {/* Clean Academic Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 dark:text-slate-200">HSC</span>
            <span>— Personal Academic Tracking & Management</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            {isOwner ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Authorized Owner: {ownerEmail}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Public Visitor View (Read-Only)</span>
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* Global Create Subject Modal */}
      <SubjectModal
        isOpen={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
        onSubmit={async (data) => {
          await addSubject(data);
          setActiveTab('book');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AcademicProvider>
      <AppContent />
    </AcademicProvider>
  );
}

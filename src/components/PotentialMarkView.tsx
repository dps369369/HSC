import React, { useState, useMemo } from 'react';
import { useAcademic } from '../context/AcademicContext';
import type { Subject, PotentialRecord, PotentialRecordStatus } from '../types';
import {
  Target,
  Award,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  Save,
  BookOpen,
  Plus,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  History,
  Sparkles,
  Filter,
  BarChart3,
  Layers,
  Lock,
  ShieldCheck,
  ChevronRight,
  Info,
  CalendarDays,
} from 'lucide-react';
import { formatSurveyDate, formatShortSurveyDate } from '../utils/dhakaTime';

interface PotentialMarkViewProps {
  onOpenCreateSubject: () => void;
}

export function getHSCGrade(percentage: number): { grade: string; gpa: string; color: string } {
  if (percentage >= 80) return { grade: 'A+', gpa: '5.00', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' };
  if (percentage >= 70) return { grade: 'A', gpa: '4.00', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800' };
  if (percentage >= 60) return { grade: 'A-', gpa: '3.50', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800' };
  if (percentage >= 50) return { grade: 'B', gpa: '3.00', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' };
  if (percentage >= 40) return { grade: 'C', gpa: '2.00', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800' };
  if (percentage >= 33) return { grade: 'D', gpa: '1.00', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800' };
  return { grade: 'F', gpa: '0.00', color: 'text-red-700 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800' };
}

type PotentialViewSection = 'survey' | 'growth' | 'charts' | 'history' | 'subjects';

export const PotentialMarkView: React.FC<PotentialMarkViewProps> = ({ onOpenCreateSubject }) => {
  const {
    subjects,
    overallStats,
    isOwner,
    potentialRecords,
    surveyCycle,
    growthStats,
    submitWeeklySurvey,
    carryForwardPendingSubjects,
    reconcileHistoricalRecords,
    isSubmittingSurvey,
    loading,
  } = useAcademic();

  const [activeSection, setActiveSection] = useState<PotentialViewSection>('survey');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Weekly Survey Form State: subjectId -> numeric input value
  const [surveyInputs, setSurveyInputs] = useState<Record<string, number | ''>>({});
  const [savingSubjectId, setSavingSubjectId] = useState<string | null>(null);

  // Selected subject for progression trajectory chart
  const [chartSubjectId, setChartSubjectId] = useState<string>('');

  // History filters
  const [historyWeekFilter, setHistoryWeekFilter] = useState<string>('ALL');
  const [historySubjectFilter, setHistorySubjectFilter] = useState<string>('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | PotentialRecordStatus>('ALL');

  // Initialize chartSubjectId once subjects load
  React.useEffect(() => {
    if (subjects.length > 0 && !chartSubjectId) {
      setChartSubjectId(subjects[0].id);
    }
  }, [subjects, chartSubjectId]);

  // Pre-fill survey inputs with subjects' current potential marks if uninitialized
  const initializeInputs = () => {
    const initial: Record<string, number | ''> = {};
    subjects.forEach((s) => {
      initial[s.id] = s.potentialMarks ?? 0;
    });
    setSurveyInputs(initial);
  };

  const handleInputChange = (subjectId: string, val: string, fullMarks: number) => {
    if (val === '') {
      setSurveyInputs((prev) => ({ ...prev, [subjectId]: '' }));
      return;
    }
    const num = Number(val);
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(fullMarks, num));
      setSurveyInputs((prev) => ({ ...prev, [subjectId]: clamped }));
    }
  };

  // Submit single subject
  const handleSubmitSingleSubject = async (sub: Subject) => {
    const markVal = surveyInputs[sub.id] !== undefined ? surveyInputs[sub.id] : sub.potentialMarks;
    const finalMark = Number(markVal) || 0;

    try {
      setSavingSubjectId(sub.id);
      await submitWeeklySurvey([
        {
          subjectId: sub.id,
          potentialMarks: finalMark,
          fullMarks: sub.fullMarks,
        },
      ]);
      setSuccessToast(`Saved ${sub.name}: ${finalMark} marks`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSubjectId(null);
    }
  };

  // Submit all subjects at once
  const handleSubmitAllSurvey = async () => {
    if (subjects.length === 0) return;
    const items = subjects.map((sub) => {
      const markVal = surveyInputs[sub.id] !== undefined ? surveyInputs[sub.id] : sub.potentialMarks;
      return {
        subjectId: sub.id,
        potentialMarks: Number(markVal) || 0,
        fullMarks: sub.fullMarks,
      };
    });

    try {
      await submitWeeklySurvey(items);
      setSuccessToast(`Finalized weekly survey for all ${items.length} subjects!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  // Carry forward all remaining unsubmitted subjects
  const handleCarryForwardRemaining = async () => {
    try {
      await carryForwardPendingSubjects();
      setSuccessToast('Carried forward remaining unsubmitted subjects for this week');
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading potential marks & weekly survey data...</p>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Target className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          POTENTIAL MARK: No Subjects Configured
        </h2>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          {isOwner
            ? 'Create academic subjects or initialize the official HSC syllabus in the BOOK module to start weekly self-assessment surveys and track mark growth.'
            : 'No subjects have been configured for potential mark surveys yet.'}
        </p>
        {isOwner && (
          <button
            type="button"
            onClick={onOpenCreateSubject}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Subject</span>
          </button>
        )}
      </div>
    );
  }

  const overallGrade = getHSCGrade(overallStats.overallPercentage);
  const currentWeekRecords = potentialRecords.filter((r) => r.weekId === surveyCycle.weekId);
  const currentWeekMap = new Map<string, PotentialRecord>();
  currentWeekRecords.forEach((r) => currentWeekMap.set(r.subjectId, r));

  // Filtered historical records
  const filteredHistory = potentialRecords.filter((r) => {
    if (historyWeekFilter !== 'ALL' && r.weekId !== historyWeekFilter) return false;
    if (historySubjectFilter !== 'ALL' && r.subjectId !== historySubjectFilter) return false;
    if (historyStatusFilter !== 'ALL' && r.status !== historyStatusFilter) return false;
    return true;
  });

  const distinctWeeks = Array.from(new Set(potentialRecords.map((r) => r.weekId)));

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. AGGREGATE SCORE & BANGLADESH SURVEY STATUS HERO */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-xl border border-indigo-950/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
                <Target className="w-3.5 h-3.5" />
                <span>Potential Mark V2</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50 text-[11px] font-medium">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>Asia/Dhaka (UTC+6)</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Weekly Self-Assessment & Expected Marks
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Every Saturday, the owner evaluates their realistic target marks across all {subjects.length} subjects.
              Unsubmitted marks are automatically carried forward, preserving a permanent academic expectation timeline.
            </p>
          </div>

          {/* Grade & Expected Percentage Badges */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 shrink-0 shadow-inner">
            <div className="text-center px-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                Projected Grade
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white">
                {overallGrade.grade}
              </div>
              <div className="text-[11px] font-semibold text-indigo-300">
                GPA {overallGrade.gpa}
              </div>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div className="text-center px-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                Expected Score
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">
                {overallStats.overallPercentage.toFixed(1)}%
              </div>
              <div className="text-[11px] font-medium text-slate-300">
                {overallStats.totalPotentialMarks} / {overallStats.totalFullMarks}
              </div>
            </div>
          </div>
        </div>

        {/* Survey Cycle Live Monitor Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Survey Week</div>
              <div className="font-bold text-white text-sm">{surveyCycle.weekId}</div>
              <div className="text-slate-400 text-[11px]">{surveyCycle.formattedDate}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Cycle Status</div>
              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                {surveyCycle.isFullyFinalized ? (
                  <span className="text-emerald-400">All Finalized</span>
                ) : (
                  <span className="text-amber-400">In Progress</span>
                )}
              </div>
              <div className="text-slate-400 text-[11px]">
                {surveyCycle.submittedCount} submitted, {surveyCycle.carriedForwardCount} carried
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Cycle Closes In</div>
              <div className="font-bold text-white text-sm">{surveyCycle.timeRemaining}</div>
              <div className="text-slate-400 text-[11px]">Next Saturday resets cycle</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Historical Archive</div>
              <div className="font-bold text-white text-sm">{growthStats.overall.totalWeeksRecorded} Weeks Recorded</div>
              <div className="text-slate-400 text-[11px]">{potentialRecords.length} permanent records</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUBSECTION NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSection('survey')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSection === 'survey'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Weekly Survey</span>
          {surveyCycle.pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
              {surveyCycle.pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('growth')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSection === 'growth'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Growth Statistics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('charts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSection === 'charts'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Progress Charts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSection === 'history'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historical Records</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {potentialRecords.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('subjects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSection === 'subjects'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Subjects</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: WEEKLY SURVEY WORKSPACE */}
      {/* ========================================================================= */}
      {activeSection === 'survey' && (
        <div className="space-y-6">
          {/* Survey Control Banner */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Survey: {surveyCycle.weekId}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Dhaka Time
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter your self-assessed target mark for each subject. If any subject is left unsubmitted, it will be automatically carried forward.
              </p>
            </div>

            {isOwner ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={initializeInputs}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Pre-fill Current Marks
                </button>
                <button
                  type="button"
                  onClick={handleCarryForwardRemaining}
                  disabled={isSubmittingSurvey || surveyCycle.pendingCount === 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
                >
                  Carry Forward Pending ({surveyCycle.pendingCount})
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAllSurvey}
                  disabled={isSubmittingSurvey}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmittingSurvey ? 'Finalizing...' : 'Finalize All Subjects'}</span>
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>Public Visitor — Survey responses are view only</span>
              </div>
            )}
          </div>

          {/* Survey Items Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-3 text-center">Full Marks</th>
                    <th className="py-3.5 px-3 text-center">Previous Recorded</th>
                    <th className="py-3.5 px-4 text-center">Weekly Target Mark</th>
                    <th className="py-3.5 px-3 text-center">Survey Status</th>
                    {isOwner && <th className="py-3.5 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {subjects.map((sub) => {
                    const existingRecord = currentWeekMap.get(sub.id);
                    const inputValue = surveyInputs[sub.id] !== undefined ? surveyInputs[sub.id] : sub.potentialMarks;
                    const numInput = Number(inputValue) || 0;
                    const isSubmittedThisWeek = existingRecord?.status === 'SUBMITTED';
                    const isCarriedThisWeek = existingRecord?.status === 'CARRIED_FORWARD';
                    const isPending = !existingRecord;

                    // Calculate live diff
                    const lastKnownMark = sub.potentialMarks ?? 0;
                    const delta = numInput - lastKnownMark;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {sub.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {sub.nameBn && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                                {sub.nameBn}
                              </span>
                            )}
                            {sub.paper && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                {sub.paper === 'FIRST' ? '1st Paper' : '2nd Paper'}
                              </span>
                            )}
                            {sub.code && (
                              <span className="text-[10px] text-slate-400">Code: {sub.code}</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {sub.fullMarks}
                        </td>

                        <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-900 dark:text-white">{sub.potentialMarks}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {sub.fullMarks > 0 ? `${((sub.potentialMarks / sub.fullMarks) * 100).toFixed(0)}%` : ''}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isOwner ? (
                            <div className="inline-flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type="number"
                                  min={0}
                                  max={sub.fullMarks}
                                  value={inputValue}
                                  onChange={(e) => handleInputChange(sub.id, e.target.value, sub.fullMarks)}
                                  className="w-20 px-2.5 py-1.5 text-center text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  max {sub.fullMarks}
                                </span>
                              </div>

                              {/* Real-time live difference */}
                              {delta !== 0 && (
                                <span
                                  className={`inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                    delta > 0
                                      ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950'
                                      : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950'
                                  }`}
                                >
                                  {delta > 0 ? `+${delta}` : delta}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {sub.potentialMarks}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {isSubmittedThisWeek ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>SUBMITTED</span>
                            </span>
                          ) : isCarriedThisWeek ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <RefreshCw className="w-3 h-3" />
                              <span>CARRIED FORWARD</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Awaiting Submission</span>
                            </span>
                          )}
                        </td>

                        {isOwner && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleSubmitSingleSubject(sub)}
                              disabled={savingSubjectId === sub.id}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
                            >
                              {savingSubjectId === sub.id ? 'Saving...' : 'Save'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: GROWTH STATISTICS */}
      {/* ========================================================================= */}
      {activeSection === 'growth' && (
        <div className="space-y-6">
          {/* Overall Growth Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Expected %</span>
                <Percent className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {growthStats.overall.currentPercentage}%
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {growthStats.overall.currentTotalPotential} of {growthStats.overall.currentTotalFull} marks
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Week-over-Week Diff</span>
                {growthStats.overall.totalMarkDifference >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-rose-500" />
                )}
              </div>
              <div
                className={`mt-2 text-2xl font-black ${
                  growthStats.overall.totalMarkDifference > 0
                    ? 'text-emerald-600'
                    : growthStats.overall.totalMarkDifference < 0
                    ? 'text-rose-600'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {growthStats.overall.totalMarkDifference > 0 ? `+${growthStats.overall.totalMarkDifference}` : growthStats.overall.totalMarkDifference} marks
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {growthStats.overall.percentagePointDifference >= 0 ? `+${growthStats.overall.percentagePointDifference}` : growthStats.overall.percentagePointDifference}% pts vs last week
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Evaluations Recorded</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {growthStats.overall.totalSubmittedAssessments}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {growthStats.overall.totalCarriedForwardAssessments} auto carried-forward
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tracking Span</span>
                <Calendar className="w-4 h-4 text-sky-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {growthStats.overall.totalWeeksRecorded} Weeks
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {growthStats.overall.firstSurveyDate ? `Since ${formatShortSurveyDate(growthStats.overall.firstSurveyDate)}` : 'Active cycle'}
              </div>
            </div>
          </div>

          {/* Subject-Wise Growth Statistics Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Subject-Wise Assessment Growth
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Growth is calculated strictly from actual submitted evaluations, never treating automatic carry-forward as growth.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-3 text-center">Current</th>
                    <th className="py-3.5 px-3 text-center">Previous</th>
                    <th className="py-3.5 px-3 text-center">Weekly Change</th>
                    <th className="py-3.5 px-3 text-center">All-Time Peak</th>
                    <th className="py-3.5 px-3 text-center">All-Time Low</th>
                    <th className="py-3.5 px-3 text-center">Total Net Growth</th>
                    <th className="py-3.5 px-4 text-center">Submissions / Carried</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {growthStats.subjectStats.map((stat) => {
                    const sub = stat.subject;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {sub.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {sub.nameBn} • max {sub.fullMarks}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-slate-900 dark:text-white text-sm">
                          {stat.currentMark}
                        </td>

                        <td className="py-3.5 px-3 text-center text-slate-500">
                          {stat.previousMark !== null ? stat.previousMark : '—'}
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold">
                          {stat.weekDifference > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">+{stat.weekDifference}</span>
                          ) : stat.weekDifference < 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">{stat.weekDifference}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                          {stat.highestMark}
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-slate-600 dark:text-slate-400">
                          {stat.lowestMark}
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold">
                          {stat.totalGrowth > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              +{stat.totalGrowth} marks
                            </span>
                          ) : stat.totalGrowth < 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              {stat.totalGrowth} marks
                            </span>
                          ) : (
                            <span className="text-slate-400">0 marks</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-[11px]">
                            <span className="text-emerald-600 font-semibold">{stat.submittedSurveysCount} submitted</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-amber-600 font-medium">{stat.carriedForwardCount} carried</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: PROGRESS CHARTS */}
      {/* ========================================================================= */}
      {activeSection === 'charts' && (
        <div className="space-y-8">
          {/* Chart 1: Overall Potential Mark Progression Over Time */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Overall Potential Mark Progression</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Timeline of aggregate expected HSC marks across all completed weekly cycles.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  Aggregate Potential Score
                </span>
              </div>
            </div>

            {growthStats.overall.weeklyTrend.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No weekly survey records yet. Finalize your first Saturday survey to generate progress curves.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                {/* Responsive SVG Chart */}
                <div className="min-w-[500px]">
                  <svg viewBox="0 0 700 220" className="w-full h-56 select-none">
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="50" y1="30" x2="680" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                    <line x1="50" y1="85" x2="680" y2="85" stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                    <line x1="50" y1="140" x2="680" y2="140" stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                    <line x1="50" y1="190" x2="680" y2="190" stroke="#cbd5e1" className="dark:stroke-slate-700" />

                    {/* Y-axis labels */}
                    <text x="42" y="34" textAnchor="end" fontSize="10" fill="#94a3b8">100%</text>
                    <text x="42" y="89" textAnchor="end" fontSize="10" fill="#94a3b8">75%</text>
                    <text x="42" y="144" textAnchor="end" fontSize="10" fill="#94a3b8">50%</text>
                    <text x="42" y="193" textAnchor="end" fontSize="10" fill="#94a3b8">0%</text>

                    {/* Calculate coordinates */}
                    {(() => {
                      const trend = growthStats.overall.weeklyTrend;
                      const count = trend.length;
                      const getX = (idx: number) => {
                        if (count === 1) return 365;
                        return 60 + (idx / (count - 1)) * 600;
                      };
                      const getY = (pct: number) => 190 - (pct / 100) * 160;

                      const points = trend.map((t, idx) => ({
                        x: getX(idx),
                        y: getY(t.percentage),
                        data: t,
                      }));

                      const pathD = points.reduce(
                        (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                        ''
                      );

                      const areaD =
                        points.length > 1
                          ? `${pathD} L ${points[points.length - 1].x} 190 L ${points[0].x} 190 Z`
                          : '';

                      return (
                        <>
                          {areaD && <path d={areaD} fill="url(#scoreGradient)" />}
                          {pathD && (
                            <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
                          )}

                          {points.map((p, idx) => (
                            <g key={idx} className="group cursor-pointer">
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="5"
                                fill="#ffffff"
                                stroke="#4f46e5"
                                strokeWidth="3"
                                className="transition-transform group-hover:scale-150"
                              />
                              {/* Label above point */}
                              <text
                                x={p.x}
                                y={p.y - 10}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="bold"
                                fill="#4f46e5"
                              >
                                {p.data.percentage}%
                              </text>
                              {/* X-axis week label */}
                              <text
                                x={p.x}
                                y="208"
                                textAnchor="middle"
                                fontSize="10"
                                fill="#64748b"
                              >
                                {p.data.formattedDate}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Chart 2: Individual Subject Trajectory (Submitted vs Carried-Forward) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Individual Subject Trajectory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compare weekly changes, clearly distinguishing new assessments from automatic carry-forwards.
                </p>
              </div>

              {/* Subject selector */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Subject:</label>
                <select
                  value={chartSubjectId}
                  onChange={(e) => setChartSubjectId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.paper ? `(${s.paper === 'FIRST' ? '1st' : '2nd'} Paper)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs mb-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-700" />
                <span>Submitted Assessment</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-amber-100 border-2 border-amber-500" />
                <span>Carried Forward (No Growth)</span>
              </span>
            </div>

            {(() => {
              const selectedSubject = subjects.find((s) => s.id === chartSubjectId);
              const subjectHistory = potentialRecords
                .filter((r) => r.subjectId === chartSubjectId)
                .sort((a, b) => a.surveyDate.localeCompare(b.surveyDate));

              if (!selectedSubject || subjectHistory.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No historical records recorded yet for this subject.
                  </div>
                );
              }

              const fullMarks = selectedSubject.fullMarks || 100;
              const count = subjectHistory.length;
              const getX = (idx: number) => (count === 1 ? 365 : 60 + (idx / (count - 1)) * 600);
              const getY = (mark: number) => 180 - (mark / fullMarks) * 150;

              const points = subjectHistory.map((rec, idx) => ({
                x: getX(idx),
                y: getY(rec.potentialMarks),
                rec,
              }));

              const pathD = points.reduce(
                (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                ''
              );

              return (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[500px]">
                    <svg viewBox="0 0 700 210" className="w-full h-52 select-none">
                      <line x1="50" y1="30" x2="680" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                      <line x1="50" y1="105" x2="680" y2="105" stroke="#e2e8f0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                      <line x1="50" y1="180" x2="680" y2="180" stroke="#cbd5e1" className="dark:stroke-slate-700" />

                      <text x="42" y="34" textAnchor="end" fontSize="10" fill="#94a3b8">{fullMarks}</text>
                      <text x="42" y="109" textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(fullMarks / 2)}</text>
                      <text x="42" y="184" textAnchor="end" fontSize="10" fill="#94a3b8">0</text>

                      {pathD && (
                        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="4 4" />
                      )}

                      {points.map((p, idx) => (
                        <g key={idx} className="cursor-pointer">
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="6"
                            fill={p.rec.status === 'SUBMITTED' ? '#10b981' : '#fef3c7'}
                            stroke={p.rec.status === 'SUBMITTED' ? '#047857' : '#f59e0b'}
                            strokeWidth="2.5"
                          />
                          <text
                            x={p.x}
                            y={p.y - 10}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill={p.rec.status === 'SUBMITTED' ? '#047857' : '#b45309'}
                          >
                            {p.rec.potentialMarks}
                          </text>
                          <text x={p.x} y="198" textAnchor="middle" fontSize="10" fill="#64748b">
                            {formatShortSurveyDate(p.rec.surveyDate)}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: HISTORICAL RECORDS ARCHIVE */}
      {/* ========================================================================= */}
      {activeSection === 'history' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Week Filter */}
            <select
              value={historyWeekFilter}
              onChange={(e) => setHistoryWeekFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
            >
              <option value="ALL">All Weeks ({distinctWeeks.length})</option>
              {distinctWeeks.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

            {/* Subject Filter */}
            <select
              value={historySubjectFilter}
              onChange={(e) => setHistorySubjectFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
            >
              <option value="ALL">All Subjects ({subjects.length})</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={historyStatusFilter}
              onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED only</option>
              <option value="CARRIED_FORWARD">CARRIED_FORWARD only</option>
            </select>

            {isOwner && (
              <button
                type="button"
                onClick={reconcileHistoricalRecords}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-check Carry-Forwards</span>
              </button>
            )}
          </div>

          {/* Records Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {filteredHistory.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No historical records match the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Week & Date</th>
                      <th className="py-3.5 px-4">Subject</th>
                      <th className="py-3.5 px-3 text-center">Potential Mark</th>
                      <th className="py-3.5 px-3 text-center">Full Marks</th>
                      <th className="py-3.5 px-3 text-center">Score %</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredHistory.map((rec) => {
                      const pct = rec.fullMarks > 0 ? (rec.potentialMarks / rec.fullMarks) * 100 : 0;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 dark:text-white block">{rec.weekId}</span>
                            <span className="text-[11px] text-slate-400">{formatShortSurveyDate(rec.surveyDate)}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 dark:text-white">{rec.subjectName}</span>
                            {rec.subjectNameBn && (
                              <span className="text-[11px] text-slate-400 block">{rec.subjectNameBn}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-center font-bold text-sm text-slate-900 dark:text-white">
                            {rec.potentialMarks}
                          </td>

                          <td className="py-3.5 px-3 text-center text-slate-500">
                            {rec.fullMarks}
                          </td>

                          <td className="py-3.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                            {pct.toFixed(0)}%
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {rec.status === 'SUBMITTED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>SUBMITTED</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <RefreshCw className="w-3 h-3" />
                                <span>CARRIED_FORWARD</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: ALL SUBJECTS OVERVIEW */}
      {/* ========================================================================= */}
      {activeSection === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => {
            const pct = sub.fullMarks > 0 ? (sub.potentialMarks / sub.fullMarks) * 100 : 0;
            const grade = getHSCGrade(pct);

            return (
              <div
                key={sub.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {sub.name}
                      </h4>
                      {sub.nameBn && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {sub.nameBn}
                        </p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${grade.color}`}>
                      {grade.grade}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {sub.potentialMarks}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">/ {sub.fullMarks} marks</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {pct.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Paper: {sub.paper === 'FIRST' ? '1st Paper' : sub.paper === 'SECOND' ? '2nd Paper' : 'Standard'}</span>
                  <span>Code: {sub.code || 'N/A'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

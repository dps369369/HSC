import React from 'react';
import { useAcademic } from '../context/AcademicContext';
import type { ActiveTab } from '../types';
import {
  BookOpen,
  Layers,
  FileText,
  Target,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
  Flame,
  Star,
  Minus,
  CheckCircle2,
  Clock,
  Bookmark,
  AlertTriangle,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { MasteryBadge, DifficultyBadge, BoardImportanceBadge } from './StatusBadge';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab, subjectId?: string) => void;
  onOpenCreateSubject: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenCreateSubject,
}) => {
  const {
    subjects,
    chapters,
    topics,
    loading,
    overallStats,
    subjectSummaries,
    isOwner,
    populateOfficialSyllabus,
    isPopulatingSyllabus,
  } = useAcademic();

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading HSC academic metrics...</p>
      </div>
    );
  }

  const hasData = subjects.length > 0;

  if (!hasData) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          HSC Academic Tracker
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {isOwner
            ? 'The database is currently empty. You can initialize the permanent official HSC syllabus (13 subjects, 105 chapters, and literature topics) with one click.'
            : 'The syllabus is currently being initialized by the owner. Please check back shortly.'}
        </p>

        {isOwner && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={isPopulatingSyllabus}
              onClick={async () => {
                await populateOfficialSyllabus();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isPopulatingSyllabus ? 'Writing Official Syllabus to Database...' : 'Initialize Official HSC Syllabus'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateSubject}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Subject</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Distribution calculations
  const totalTopics = overallStats.totalTopics || 0;

  const masteredPct = totalTopics > 0 ? Math.round((overallStats.masteredCount / totalTopics) * 100) : 0;
  const masteringPct = totalTopics > 0 ? Math.round((overallStats.masteringCount / totalTopics) * 100) : 0;
  const willPct = totalTopics > 0 ? Math.round((overallStats.willCount / totalTopics) * 100) : 0;

  const easyPct = totalTopics > 0 ? Math.round((overallStats.easyCount / totalTopics) * 100) : 0;
  const hardPct = totalTopics > 0 ? Math.round((overallStats.hardCount / totalTopics) * 100) : 0;
  const canIPct = totalTopics > 0 ? Math.round((overallStats.canICount / totalTopics) * 100) : 0;

  const popularPct = totalTopics > 0 ? Math.round((overallStats.popularCount / totalTopics) * 100) : 0;
  const commonPct = totalTopics > 0 ? Math.round((overallStats.commonCount / totalTopics) * 100) : 0;
  const rarePct = totalTopics > 0 ? Math.round((overallStats.rareCount / totalTopics) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Overview Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Subjects */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Subjects</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {overallStats.totalSubjects}
            </span>
            <span className="text-xs text-slate-500">enrolled</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>{overallStats.totalChapters} chapters in syllabus</span>
          </div>
        </div>

        {/* Total Topics */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Topics</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {overallStats.totalTopics}
            </span>
            <span className="text-xs text-slate-500">tracked</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {overallStats.masteredCount} Mastered ({masteredPct}%)
          </div>
        </div>

        {/* Overall Academic Progress */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Academic Progress</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {overallStats.masteryPercentage}%
            </span>
            <span className="text-xs text-slate-500">syllabus complete</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${masteredPct}%` }}
              className="bg-emerald-500 h-full"
              title={`Mastered: ${masteredPct}%`}
            />
            <div
              style={{ width: `${masteringPct}%` }}
              className="bg-amber-500 h-full"
              title={`Mastering: ${masteringPct}%`}
            />
          </div>
        </div>

        {/* Potential Marks Summary */}
        <div
          onClick={() => onNavigate('potential')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-violet-600 transition-colors">Weekly Potential Marks</span>
            <Target className="w-4 h-4 text-violet-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {overallStats.totalPotentialMarks}
            </span>
            <span className="text-sm font-semibold text-slate-500">
              / {overallStats.totalFullMarks}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-violet-600 dark:text-violet-400">
            <span>{overallStats.overallPercentage}% expected aggregate</span>
            <span className="text-slate-400 font-semibold group-hover:text-violet-600 transition-colors">Survey & Charts &rarr;</span>
          </div>
        </div>
      </div>

      {/* The 3 Core Distributions */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Syllabus Topic Distributions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Calculated in real-time across all {overallStats.totalTopics} topics in the database
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. MASTERY DISTRIBUTION */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  1. MASTERY DISTRIBUTION
                </span>
                <span className="text-xs font-bold text-slate-400">{totalTopics} total</span>
              </div>

              {/* Progress visual bar */}
              <div className="mt-4 w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                <div style={{ width: `${masteredPct}%` }} className="bg-emerald-500 h-full" />
                <div style={{ width: `${masteringPct}%` }} className="bg-amber-500 h-full" />
                <div style={{ width: `${willPct}%` }} className="bg-sky-500 h-full" />
              </div>

              {/* Breakdown */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">MASTERED</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-black text-slate-900 dark:text-white">{overallStats.masteredCount}</span>
                    <span className="text-slate-400 text-[11px]">({masteredPct}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">MASTERING</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-black text-slate-900 dark:text-white">{overallStats.masteringCount}</span>
                    <span className="text-slate-400 text-[11px]">({masteringPct}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">WILL</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-black text-slate-900 dark:text-white">{overallStats.willCount}</span>
                    <span className="text-slate-400 text-[11px]">({willPct}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              Personal learning acquisition progress
            </div>
          </div>

          {/* 2. DIFFICULTY DISTRIBUTION */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  2. DIFFICULTY DISTRIBUTION
                </span>
                <span className="text-xs font-bold text-slate-400">{totalTopics} total</span>
              </div>

              {/* Progress visual bar */}
              <div className="mt-4 w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                <div style={{ width: `${easyPct}%` }} className="bg-teal-500 h-full" />
                <div style={{ width: `${hardPct}%` }} className="bg-rose-500 h-full" />
                <div style={{ width: `${canIPct}%` }} className="bg-violet-500 h-full" />
              </div>

              {/* Breakdown */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">EASY</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-black text-slate-900 dark:text-white">{overallStats.easyCount}</span>
                    <span className="text-slate-400 text-[11px]">({easyPct}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">HARD</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-black text-slate-900 dark:text-white">{overallStats.hardCount}</span>
                    <span className="text-slate-400 text-[11px]">({hardPct}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">CAN I?</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-black text-slate-900 dark:text-white">{overallStats.canICount}</span>
                    <span className="text-slate-400 text-[11px]">({canIPct}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              Personal perception of cognitive resistance
            </div>
          </div>

          {/* 3. BOARD IMPORTANCE DISTRIBUTION */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  3. BOARD IMPORTANCE DISTRIBUTION
                </span>
                <span className="text-xs font-bold text-slate-400">{totalTopics} total</span>
              </div>

              {/* Progress visual bar */}
              <div className="mt-4 w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                <div style={{ width: `${popularPct}%` }} className="bg-orange-500 h-full" />
                <div style={{ width: `${commonPct}%` }} className="bg-indigo-500 h-full" />
                <div style={{ width: `${rarePct}%` }} className="bg-zinc-500 h-full" />
              </div>

              {/* Breakdown */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">POPULAR</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-black text-slate-900 dark:text-white">{overallStats.popularCount}</span>
                    <span className="text-slate-400 text-[11px]">({popularPct}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">COMMON</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-black text-slate-900 dark:text-white">{overallStats.commonCount}</span>
                    <span className="text-slate-400 text-[11px]">({commonPct}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">RARE</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-black text-slate-900 dark:text-white">{overallStats.rareCount}</span>
                    <span className="text-slate-400 text-[11px]">({rarePct}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              Exam occurrence frequency & weight
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Academic Progress Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Subject-Wise Academic Progress
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Topic mastery summaries, chapter counts, and potential marks for each subject
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('book')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>Explore in BOOK</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => {
            const summary = subjectSummaries.get(sub.id);
            if (!summary) return null;

            const subTopics = summary.totalTopics;
            const subMasteredPct = subTopics > 0 ? Math.round((summary.masteredCount / subTopics) * 100) : 0;
            const subMasteringPct = subTopics > 0 ? Math.round((summary.masteringCount / subTopics) * 100) : 0;

            return (
              <div
                key={sub.id}
                onClick={() => onNavigate('book', sub.id)}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {sub.name}
                        </h4>
                        {sub.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                            {sub.code}
                          </span>
                        )}
                        {sub.paper && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                            {sub.paper === 'FIRST' ? '1st Paper' : '2nd Paper'}
                          </span>
                        )}
                      </div>
                      {sub.nameBn && (
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                          {sub.nameBn}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {summary.totalChapters} chapters • {summary.totalTopics} topics
                        {sub.practicalComponents && sub.practicalComponents.length > 0 && (
                          <span> • {sub.practicalComponents.length} practicals</span>
                        )}
                      </p>
                    </div>

                    {/* Potential Mark Badge */}
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {sub.potentialMarks}
                      </span>
                      <span className="text-xs text-slate-400">/{sub.fullMarks}</span>
                      <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                        {summary.potentialPercentage}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                        Mastery Completion
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {summary.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div
                        style={{ width: `${subMasteredPct}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Mastered: ${subMasteredPct}%`}
                      />
                      <div
                        style={{ width: `${subMasteringPct}%` }}
                        className="bg-amber-500 h-full"
                        title={`Mastering: ${subMasteringPct}%`}
                      />
                    </div>
                  </div>

                  {/* Topic breakdown mini-pills */}
                  <div className="mt-4 grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                      <div className="font-bold">{summary.masteredCount}</div>
                      <div className="text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Mastered</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                      <div className="font-bold">{summary.masteringCount}</div>
                      <div className="text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400">Mastering</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 text-sky-800 dark:text-sky-300">
                      <div className="font-bold">{summary.willCount}</div>
                      <div className="text-[9px] uppercase tracking-wider text-sky-600 dark:text-sky-400">Will</div>
                    </div>
                  </div>
                </div>

                {/* Footer link */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <span>Open Chapters & Topics</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

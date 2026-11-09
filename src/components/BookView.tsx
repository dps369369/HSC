import React, { useState } from 'react';
import { useAcademic } from '../context/AcademicContext';
import type {
  Subject,
  Chapter,
  Topic,
  MasteryStatus,
  DifficultyStatus,
  BoardImportance,
} from '../types';
import {
  BookOpen,
  Folder,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
  HelpCircle,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { MasteryBadge, DifficultyBadge, BoardImportanceBadge } from './StatusBadge';
import { SubjectModal } from './modals/SubjectModal';
import { ChapterModal } from './modals/ChapterModal';
import { TopicModal } from './modals/TopicModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';

interface BookViewProps {
  onOpenCreateSubject: () => void;
}

export const BookView: React.FC<BookViewProps> = ({ onOpenCreateSubject }) => {
  const {
    subjects,
    chapters,
    topics,
    loading,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedChapterId,
    setSelectedChapterId,
    subjectSummaries,
    chapterSummaries,
    isOwner,
    editSubject,
    removeSubject,
    addChapter,
    editChapter,
    removeChapter,
    addTopic,
    editTopic,
    removeTopic,
    setTopicMastery,
    setTopicDifficulty,
    setTopicBoardImportance,
    populateOfficialSyllabus,
    isPopulatingSyllabus,
  } = useAcademic();

  const [showPracticals, setShowPracticals] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Modal states
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isEditSubjectOpen, setIsEditSubjectOpen] = useState(false);

  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [isEditChapterOpen, setIsEditChapterOpen] = useState(false);

  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isEditTopicOpen, setIsEditTopicOpen] = useState(false);
  const [topicTargetChapterId, setTopicTargetChapterId] = useState<string | null>(null);

  // Deletion modals
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'subject' | 'chapter' | 'topic';
    id: string;
    name: string;
  } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [masteryFilter, setMasteryFilter] = useState<MasteryStatus | 'ALL'>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyStatus | 'ALL'>('ALL');
  const [importanceFilter, setImportanceFilter] = useState<BoardImportance | 'ALL'>('ALL');

  // Collapsed chapters in main view
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  const toggleChapterCollapse = (chapId: string) => {
    setCollapsedChapters((prev) => ({ ...prev, [chapId]: !prev[chapId] }));
  };

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null;

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading syllabus hierarchy...</p>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          BOOK Module: Empty Syllabus
        </h2>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          {isOwner
            ? 'Create your first Subject to start structuring Chapters and Topics with Mastery, Difficulty, and Board Importance.'
            : 'No subjects have been added to the syllabus by the owner yet.'}
        </p>
        {isOwner && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={isPopulatingSyllabus}
              onClick={async () => {
                await populateOfficialSyllabus();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isPopulatingSyllabus ? 'Populating 13 Subjects...' : 'Initialize Official HSC Syllabus'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreateSubject}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Subject</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active Subject's chapters
  const currentChapters = chapters.filter((c) => c.subjectId === activeSubject?.id);
  const activeSubjectSummary = activeSubject ? subjectSummaries.get(activeSubject.id) : null;

  // Handle deletions
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'subject') {
      await removeSubject(deleteTarget.id);
    } else if (deleteTarget.type === 'chapter') {
      await removeChapter(deleteTarget.id);
    } else if (deleteTarget.type === 'topic') {
      await removeTopic(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Subject Selector Tabs / Pills */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
            Subjects:
          </span>
          <div className="flex items-center gap-2">
            {subjects.map((sub) => {
              const isSelected = sub.id === activeSubject?.id;
              const summary = subjectSummaries.get(sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400 dark:text-indigo-600' : 'text-slate-400'}`} />
                  <span>{sub.name}</span>
                  {sub.paper && (
                    <span className="text-[9px] font-semibold opacity-75">
                      ({sub.paper === 'FIRST' ? '1st' : '2nd'})
                    </span>
                  )}
                  {summary && summary.totalTopics > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {summary.progressPercentage}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isPopulatingSyllabus}
              onClick={async () => {
                const res = await populateOfficialSyllabus();
                setSyncToast(`Synced official syllabus: ${res.subjectsCount} subjects, ${res.chaptersCount} chapters, ${res.topicsCount} topics.`);
                setTimeout(() => setSyncToast(null), 4000);
              }}
              title="Populate or sync official HSC syllabus (13 subjects & 105 chapters)"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors border border-amber-200 dark:border-amber-800 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{isPopulatingSyllabus ? 'Syncing...' : 'Sync HSC Syllabus'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateSubject}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-200 dark:border-indigo-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Subject</span>
            </button>
          </div>
        )}
      </div>

      {syncToast && (
        <div className="p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <span>{syncToast}</span>
          <button type="button" onClick={() => setSyncToast(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {activeSubject && (
        <div className="space-y-6">
          {/* Active Subject Banner & Calculated Topic Summary */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                    Subject Module
                  </span>
                  {activeSubject.code && (
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      Code: {activeSubject.code}
                    </span>
                  )}
                  {activeSubject.paper && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {activeSubject.paper === 'FIRST' ? '1st Paper' : '2nd Paper'}
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeSubject.name}
                  </h2>
                  {activeSubject.nameBn && (
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {activeSubject.nameBn}
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Contains {currentChapters.length} chapters and {activeSubjectSummary?.totalTopics || 0} topics in curriculum
                  {activeSubject.practicalComponents && activeSubject.practicalComponents.length > 0 && (
                    <span> • {activeSubject.practicalComponents.length} Board Practicals</span>
                  )}
                </p>
              </div>

              {/* Potential Mark Pill & Owner Controls */}
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                    Potential Mark
                  </div>
                  <div className="text-base font-black text-violet-900 dark:text-violet-100">
                    {activeSubject.potentialMarks} <span className="text-xs text-violet-500 font-normal">/ {activeSubject.fullMarks}</span>
                    <span className="text-xs ml-1.5 font-bold">({activeSubjectSummary?.potentialPercentage || 0}%)</span>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubject(activeSubject);
                        setIsEditSubjectOpen(true);
                      }}
                      title="Edit Subject"
                      className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: 'subject',
                          id: activeSubject.id,
                          name: activeSubject.name,
                        })
                      }
                      title="Delete Subject"
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Calculated Subject Summary (Strictly calculated from topics, no manual editing) */}
            {activeSubjectSummary && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {/* Academic Progress */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Calculated Mastery
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {activeSubjectSummary.progressPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({activeSubjectSummary.masteredCount}/{activeSubjectSummary.totalTopics} mastered)
                    </span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div
                      style={{
                        width: `${
                          activeSubjectSummary.totalTopics > 0
                            ? (activeSubjectSummary.masteredCount / activeSubjectSummary.totalTopics) * 100
                            : 0
                        }%`,
                      }}
                      className="bg-emerald-500 h-full"
                    />
                    <div
                      style={{
                        width: `${
                          activeSubjectSummary.totalTopics > 0
                            ? (activeSubjectSummary.masteringCount / activeSubjectSummary.totalTopics) * 100
                            : 0
                        }%`,
                      }}
                      className="bg-amber-500 h-full"
                    />
                  </div>
                </div>

                {/* Mastery Distribution */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Mastery Breakdown
                  </span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between font-medium">
                      <span className="text-emerald-600 dark:text-emerald-400">Mastered:</span>
                      <span className="font-bold">{activeSubjectSummary.masteredCount}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-amber-600 dark:text-amber-400">Mastering:</span>
                      <span className="font-bold">{activeSubjectSummary.masteringCount}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-sky-600 dark:text-sky-400">Will:</span>
                      <span className="font-bold">{activeSubjectSummary.willCount}</span>
                    </div>
                  </div>
                </div>

                {/* Difficulty Distribution */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Difficulty Breakdown
                  </span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between font-medium">
                      <span className="text-teal-600 dark:text-teal-400">Easy:</span>
                      <span className="font-bold">{activeSubjectSummary.easyCount}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-rose-600 dark:text-rose-400">Hard:</span>
                      <span className="font-bold">{activeSubjectSummary.hardCount}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-violet-600 dark:text-violet-400">Can I?:</span>
                      <span className="font-bold">{activeSubjectSummary.canICount}</span>
                    </div>
                  </div>
                </div>

                {/* Board Importance Distribution */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Board Importance
                  </span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between font-medium">
                      <span className="text-orange-600 dark:text-orange-400">Popular:</span>
                      <span className="font-bold">{activeSubjectSummary.popularCount}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-indigo-600 dark:text-indigo-400">Common:</span>
                      <span className="font-bold">{activeSubjectSummary.commonCount}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-zinc-600 dark:text-zinc-400">Rare:</span>
                      <span className="font-bold">{activeSubjectSummary.rareCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Board Practical Components if available */}
            {activeSubject.practicalComponents && activeSubject.practicalComponents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPracticals(!showPracticals)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Board Practical Components ({activeSubject.practicalComponents.length} experiments)</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${showPracticals ? 'rotate-180' : ''}`} />
                </button>

                {showPracticals && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {activeSubject.practicalComponents.map((prac, pIdx) => (
                      <div
                        key={prac.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-start gap-2"
                      >
                        <span className="text-[10px] font-mono text-indigo-500 font-bold shrink-0 pt-0.5">
                          P{(pIdx + 1).toString().padStart(2, '0')}
                        </span>
                        <span>{prac.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chapters & Topics Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Chapters & Syllabus Topics
              </h3>
              <span className="text-xs text-slate-400 font-semibold">
                ({currentChapters.length} chapters)
              </span>
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  setEditingChapter(null);
                  setIsAddChapterOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chapter</span>
              </button>
            )}
          </div>

          {/* Filters Bar for Topics */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics by title..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filter by Mastery */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] font-semibold">Mastery:</span>
              <select
                value={masteryFilter}
                onChange={(e) => setMasteryFilter(e.target.value as MasteryStatus | 'ALL')}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="ALL">All Mastery</option>
                <option value="MASTERED">Mastered</option>
                <option value="MASTERING">Mastering</option>
                <option value="WILL">Will</option>
              </select>
            </div>

            {/* Filter by Difficulty */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] font-semibold">Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as DifficultyStatus | 'ALL')}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="ALL">All Difficulty</option>
                <option value="EASY">Easy</option>
                <option value="HARD">Hard</option>
                <option value="CAN I?">Can I?</option>
              </select>
            </div>

            {/* Filter by Board Importance */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] font-semibold">Importance:</span>
              <select
                value={importanceFilter}
                onChange={(e) => setImportanceFilter(e.target.value as BoardImportance | 'ALL')}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="ALL">All Board</option>
                <option value="POPULAR">Popular</option>
                <option value="COMMON">Common</option>
                <option value="RARE">Rare</option>
              </select>
            </div>

            {(searchQuery || masteryFilter !== 'ALL' || difficultyFilter !== 'ALL' || importanceFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setMasteryFilter('ALL');
                  setDifficultyFilter('ALL');
                  setImportanceFilter('ALL');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Chapters List */}
          {currentChapters.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center">
              <Folder className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No chapters created in {activeSubject.name} yet
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isOwner
                  ? 'Add your first chapter (e.g. Chapter 1: Physical World and Measurement) to begin adding syllabus topics.'
                  : 'The owner has not added chapters to this subject.'}
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingChapter(null);
                    setIsAddChapterOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Chapter</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentChapters.map((chapter) => {
                const isCollapsed = !!collapsedChapters[chapter.id];
                const chapterSummary = chapterSummaries.get(chapter.id);
                const chapterTopics = topics.filter((t) => t.chapterId === chapter.id);

                // Apply filters to topics
                const q = searchQuery.toLowerCase().trim();
                const filteredTopics = chapterTopics.filter((t) => {
                  if (q) {
                    const matchName = t.name.toLowerCase().includes(q);
                    const matchNameBn = t.nameBn ? t.nameBn.toLowerCase().includes(q) : false;
                    const matchAuthor = t.author ? t.author.toLowerCase().includes(q) : false;
                    if (!matchName && !matchNameBn && !matchAuthor) {
                      return false;
                    }
                  }
                  if (masteryFilter !== 'ALL' && t.mastery !== masteryFilter) {
                    return false;
                  }
                  if (difficultyFilter !== 'ALL' && t.difficulty !== difficultyFilter) {
                    return false;
                  }
                  if (importanceFilter !== 'ALL' && t.boardImportance !== importanceFilter) {
                    return false;
                  }
                  return true;
                });

                return (
                  <div
                    key={chapter.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
                  >
                    {/* Chapter Header */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleChapterCollapse(chapter.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {chapter.chapterNumber !== undefined && (
                              <span className="text-[11px] font-bold text-slate-500 font-mono">
                                CH {chapter.chapterNumber}:
                              </span>
                            )}
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {chapter.name}
                            </h4>
                            {chapter.nameBn && (
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                ({chapter.nameBn})
                              </span>
                            )}
                          </div>

                          {/* Calculated Chapter Summary */}
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span>{chapterSummary?.totalTopics || 0} topics</span>
                            <span>•</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {chapterSummary?.masteredCount || 0} Mastered ({chapterSummary?.progressPercentage || 0}%)
                            </span>
                            <span>•</span>
                            <span>{chapterSummary?.masteringCount || 0} Mastering</span>
                            <span>•</span>
                            <span>{chapterSummary?.willCount || 0} Will</span>
                          </div>
                        </div>
                      </div>

                      {/* Chapter Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isOwner && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setTopicTargetChapterId(chapter.id);
                                setEditingTopic(null);
                                setIsAddTopicOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Topic</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingChapter(chapter);
                                setIsEditChapterOpen(true);
                              }}
                              title="Edit Chapter"
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'chapter',
                                  id: chapter.id,
                                  name: chapter.name,
                                })
                              }
                              title="Delete Chapter"
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Topics List Inside Chapter */}
                    {!isCollapsed && (
                      <div className="p-4 sm:p-5">
                        {chapterTopics.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-500">
                            <p>No topics added to this chapter yet.</p>
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTopicTargetChapterId(chapter.id);
                                  setEditingTopic(null);
                                  setIsAddTopicOpen(true);
                                }}
                                className="mt-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                              >
                                + Add first topic
                              </button>
                            )}
                          </div>
                        ) : filteredTopics.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400 italic">
                            No topics matched the selected search or filters.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {filteredTopics.map((topic, idx) => (
                              <div
                                key={topic.id}
                                className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                              >
                                {/* Topic title & sequence */}
                                <div className="flex items-start gap-2.5">
                                  <span className="text-[11px] font-mono text-slate-400 font-semibold pt-0.5 w-6 shrink-0">
                                    {(idx + 1).toString().padStart(2, '0')}.
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                        {topic.name}
                                      </span>
                                      {topic.nameBn && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                          ({topic.nameBn})
                                        </span>
                                      )}
                                    </div>
                                    {topic.author && (
                                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                                        Author: {topic.author}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Three Independently Configurable Topic Properties */}
                                <div className="flex flex-wrap items-center gap-3 shrink-0 lg:ml-auto">
                                  {/* 1. MASTERY */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 hidden xl:inline">
                                      Mastery:
                                    </span>
                                    <MasteryBadge
                                      status={topic.mastery}
                                      size="sm"
                                      interactive={isOwner}
                                      onSelect={(newStatus) => setTopicMastery(topic.id, newStatus)}
                                    />
                                  </div>

                                  {/* 2. DIFFICULTY */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 hidden xl:inline">
                                      Diff:
                                    </span>
                                    <DifficultyBadge
                                      status={topic.difficulty}
                                      size="sm"
                                      interactive={isOwner}
                                      onSelect={(newStatus) => setTopicDifficulty(topic.id, newStatus)}
                                    />
                                  </div>

                                  {/* 3. BOARD IMPORTANCE */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 hidden xl:inline">
                                      Board:
                                    </span>
                                    <BoardImportanceBadge
                                      status={topic.boardImportance}
                                      size="sm"
                                      interactive={isOwner}
                                      onSelect={(newStatus) => setTopicBoardImportance(topic.id, newStatus)}
                                    />
                                  </div>

                                  {/* Edit / Delete (Owner only) */}
                                  {isOwner && (
                                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingTopic(topic);
                                          setTopicTargetChapterId(chapter.id);
                                          setIsEditTopicOpen(true);
                                        }}
                                        title="Edit Topic"
                                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-md transition-colors"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDeleteTarget({
                                            type: 'topic',
                                            id: topic.id,
                                            name: topic.name,
                                          })
                                        }
                                        title="Delete Topic"
                                        className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}

      {/* Edit Subject */}
      <SubjectModal
        isOpen={isEditSubjectOpen}
        onClose={() => {
          setIsEditSubjectOpen(false);
          setEditingSubject(null);
        }}
        subjectToEdit={editingSubject}
        onSubmit={async (data) => {
          if (editingSubject) {
            await editSubject(editingSubject.id, data);
          }
        }}
      />

      {/* Add / Edit Chapter */}
      <ChapterModal
        isOpen={isAddChapterOpen || isEditChapterOpen}
        onClose={() => {
          setIsAddChapterOpen(false);
          setIsEditChapterOpen(false);
          setEditingChapter(null);
        }}
        chapterToEdit={editingChapter}
        subjectName={activeSubject?.name}
        defaultChapterNumber={currentChapters.length + 1}
        onSubmit={async (data) => {
          if (editingChapter) {
            await editChapter(editingChapter.id, data);
          } else if (activeSubject) {
            await addChapter({
              subjectId: activeSubject.id,
              name: data.name,
              nameBn: data.nameBn,
              chapterNumber: data.chapterNumber,
            });
          }
        }}
      />

      {/* Add / Edit Topic */}
      <TopicModal
        isOpen={isAddTopicOpen || isEditTopicOpen}
        onClose={() => {
          setIsAddTopicOpen(false);
          setIsEditTopicOpen(false);
          setEditingTopic(null);
          setTopicTargetChapterId(null);
        }}
        topicToEdit={editingTopic}
        chapterName={
          chapters.find((c) => c.id === (topicTargetChapterId || editingTopic?.chapterId))?.name
        }
        onSubmit={async (data) => {
          if (editingTopic) {
            await editTopic(editingTopic.id, data);
          } else if (activeSubject && topicTargetChapterId) {
            await addTopic({
              subjectId: activeSubject.id,
              chapterId: topicTargetChapterId,
              name: data.name,
              nameBn: data.nameBn,
              author: data.author,
              mastery: data.mastery,
              difficulty: data.difficulty,
              boardImportance: data.boardImportance,
            });
          }
        }}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={
          deleteTarget?.type === 'subject'
            ? 'Delete Subject'
            : deleteTarget?.type === 'chapter'
            ? 'Delete Chapter'
            : 'Delete Topic'
        }
        message={
          deleteTarget?.type === 'subject'
            ? `Are you sure you want to delete "${deleteTarget?.name}"? This will permanently delete all chapters and topics inside this subject.`
            : deleteTarget?.type === 'chapter'
            ? `Are you sure you want to delete "${deleteTarget?.name}"? All topics inside this chapter will be permanently deleted.`
            : `Are you sure you want to delete topic "${deleteTarget?.name}"?`
        }
        itemDescription={`Item: ${deleteTarget?.name} (${deleteTarget?.type.toUpperCase()})`}
      />
    </div>
  );
};

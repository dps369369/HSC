import React, { useState, useEffect } from 'react';
import type { Topic, MasteryStatus, DifficultyStatus, BoardImportance } from '../../types';
import { X, FileText, AlertCircle } from 'lucide-react';
import { MasteryBadge, DifficultyBadge, BoardImportanceBadge } from '../StatusBadge';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    nameBn?: string;
    author?: string;
    mastery: MasteryStatus;
    difficulty: DifficultyStatus;
    boardImportance: BoardImportance;
  }) => Promise<void>;
  topicToEdit?: Topic | null;
  chapterName?: string;
}

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  topicToEdit,
  chapterName,
}) => {
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [author, setAuthor] = useState('');
  const [mastery, setMastery] = useState<MasteryStatus>('WILL');
  const [difficulty, setDifficulty] = useState<DifficultyStatus>('EASY');
  const [boardImportance, setBoardImportance] = useState<BoardImportance>('COMMON');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (topicToEdit) {
      setName(topicToEdit.name);
      setNameBn(topicToEdit.nameBn || '');
      setAuthor(topicToEdit.author || '');
      setMastery(topicToEdit.mastery);
      setDifficulty(topicToEdit.difficulty);
      setBoardImportance(topicToEdit.boardImportance);
    } else {
      setName('');
      setNameBn('');
      setAuthor('');
      setMastery('WILL');
      setDifficulty('EASY');
      setBoardImportance('COMMON');
    }
    setError(null);
  }, [topicToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Topic name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        nameBn: nameBn.trim() || undefined,
        author: author.trim() || undefined,
        mastery,
        difficulty,
        boardImportance,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save topic');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {topicToEdit ? 'Edit Topic' : 'Add Topic'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inside {chapterName || 'Chapter'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topic Name (English) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dot Product, Cross Product & Geometric Meaning"
              maxLength={200}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bengali Title (বাংলা শিরোনাম) <span className="text-slate-400 font-normal">Optional</span>
              </label>
              <input
                type="text"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="e.g. ডট গুণন ও ক্রস গুণন"
                maxLength={200}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Author / Poet / Creator <span className="text-slate-400 font-normal">Optional</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. রবীন্দ্রনাথ ঠাকুর / W. Shakespeare"
                maxLength={100}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 3 Independently Configurable Properties */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* 1. MASTERY */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  1. MASTERY
                </label>
                <MasteryBadge status={mastery} size="sm" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['MASTERED', 'MASTERING', 'WILL'] as MasteryStatus[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMastery(m)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                      mastery === m
                        ? m === 'MASTERED'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : m === 'MASTERING'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. DIFFICULTY */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  2. DIFFICULTY
                </label>
                <DifficultyBadge status={difficulty} size="sm" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['EASY', 'HARD', 'CAN I?'] as DifficultyStatus[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                      difficulty === d
                        ? d === 'EASY'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : d === 'HARD'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. BOARD IMPORTANCE */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  3. BOARD IMPORTANCE
                </label>
                <BoardImportanceBadge status={boardImportance} size="sm" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['POPULAR', 'COMMON', 'RARE'] as BoardImportance[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBoardImportance(b)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                      boardImportance === b
                        ? b === 'POPULAR'
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : b === 'COMMON'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-zinc-600 text-white border-zinc-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : topicToEdit ? 'Save Changes' : 'Add Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

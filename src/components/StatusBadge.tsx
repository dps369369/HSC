import React from 'react';
import type { MasteryStatus, DifficultyStatus, BoardImportance } from '../types';
import { CheckCircle2, Clock, Bookmark, Sparkles, AlertTriangle, HelpCircle, Flame, Star, Minus } from 'lucide-react';

interface MasteryBadgeProps {
  status: MasteryStatus;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onSelect?: (status: MasteryStatus) => void;
}

export const MasteryBadge: React.FC<MasteryBadgeProps> = ({
  status,
  size = 'md',
  interactive = false,
  onSelect,
}) => {
  const config = {
    MASTERED: {
      label: 'MASTERED',
      icon: CheckCircle2,
      activeClasses: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25',
      indicator: 'bg-emerald-500',
    },
    MASTERING: {
      label: 'MASTERING',
      icon: Clock,
      activeClasses: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25',
      indicator: 'bg-amber-500',
    },
    WILL: {
      label: 'WILL',
      icon: Bookmark,
      activeClasses: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/25',
      indicator: 'bg-sky-500',
    },
  }[status];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  const Icon = config.icon;

  if (interactive && onSelect) {
    const statuses: MasteryStatus[] = ['MASTERED', 'MASTERING', 'WILL'];
    return (
      <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900/50 shadow-xs">
        {statuses.map((s) => {
          const isCurrent = s === status;
          const sConf = {
            MASTERED: 'hover:text-emerald-600',
            MASTERING: 'hover:text-amber-600',
            WILL: 'hover:text-sky-600',
          }[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                isCurrent
                  ? s === 'MASTERED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : s === 'MASTERING'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-sky-600 text-white shadow-xs'
                  : `text-slate-600 dark:text-slate-400 ${sConf} hover:bg-white/60 dark:hover:bg-slate-800/60`
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border tracking-wider ${sizeClasses} ${config.activeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};

interface DifficultyBadgeProps {
  status: DifficultyStatus;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onSelect?: (status: DifficultyStatus) => void;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  status,
  size = 'md',
  interactive = false,
  onSelect,
}) => {
  const config = {
    EASY: {
      label: 'EASY',
      icon: Sparkles,
      activeClasses: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 hover:bg-teal-500/25',
    },
    HARD: {
      label: 'HARD',
      icon: AlertTriangle,
      activeClasses: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/25',
    },
    'CAN I?': {
      label: 'CAN I?',
      icon: HelpCircle,
      activeClasses: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30 hover:bg-violet-500/25',
    },
  }[status];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  const Icon = config.icon;

  if (interactive && onSelect) {
    const statuses: DifficultyStatus[] = ['EASY', 'HARD', 'CAN I?'];
    return (
      <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900/50 shadow-xs">
        {statuses.map((s) => {
          const isCurrent = s === status;
          const sConf = {
            EASY: 'hover:text-teal-600',
            HARD: 'hover:text-rose-600',
            'CAN I?': 'hover:text-violet-600',
          }[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                isCurrent
                  ? s === 'EASY'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : s === 'HARD'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-violet-600 text-white shadow-xs'
                  : `text-slate-600 dark:text-slate-400 ${sConf} hover:bg-white/60 dark:hover:bg-slate-800/60`
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border tracking-wider ${sizeClasses} ${config.activeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};

interface BoardImportanceBadgeProps {
  status: BoardImportance;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onSelect?: (status: BoardImportance) => void;
}

export const BoardImportanceBadge: React.FC<BoardImportanceBadgeProps> = ({
  status,
  size = 'md',
  interactive = false,
  onSelect,
}) => {
  const config = {
    POPULAR: {
      label: 'POPULAR',
      icon: Flame,
      activeClasses: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30 hover:bg-orange-500/25',
    },
    COMMON: {
      label: 'COMMON',
      icon: Star,
      activeClasses: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25',
    },
    RARE: {
      label: 'RARE',
      icon: Minus,
      activeClasses: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30 hover:bg-zinc-500/25',
    },
  }[status];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  const Icon = config.icon;

  if (interactive && onSelect) {
    const statuses: BoardImportance[] = ['POPULAR', 'COMMON', 'RARE'];
    return (
      <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900/50 shadow-xs">
        {statuses.map((s) => {
          const isCurrent = s === status;
          const sConf = {
            POPULAR: 'hover:text-orange-600',
            COMMON: 'hover:text-indigo-600',
            RARE: 'hover:text-zinc-600',
          }[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                isCurrent
                  ? s === 'POPULAR'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : s === 'COMMON'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-zinc-600 text-white shadow-xs'
                  : `text-slate-600 dark:text-slate-400 ${sConf} hover:bg-white/60 dark:hover:bg-slate-800/60`
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border tracking-wider ${sizeClasses} ${config.activeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};

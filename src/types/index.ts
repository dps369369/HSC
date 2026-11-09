export type MasteryStatus = 'MASTERED' | 'MASTERING' | 'WILL';
export type DifficultyStatus = 'EASY' | 'HARD' | 'CAN I?';
export type BoardImportance = 'POPULAR' | 'COMMON' | 'RARE';

export interface PracticalComponent {
  id: string;
  name: string;
  nameBn?: string | null;
}

export interface Subject {
  id: string;
  name: string;
  nameBn?: string | null;
  code?: string;
  paper?: 'FIRST' | 'SECOND' | null;
  fullMarks: number;
  potentialMarks: number;
  order: number;
  practicalComponents?: PracticalComponent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  nameBn?: string | null;
  chapterNumber?: number;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  chapterId: string;
  name: string;
  nameBn?: string | null;
  author?: string | null;
  order: number;
  mastery: MasteryStatus;
  difficulty: DifficultyStatus;
  boardImportance: BoardImportance;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChapterSummary {
  chapter: Chapter;
  totalTopics: number;
  masteredCount: number;
  masteringCount: number;
  willCount: number;
  easyCount: number;
  hardCount: number;
  canICount: number;
  popularCount: number;
  commonCount: number;
  rareCount: number;
  progressPercentage: number;
}

export interface SubjectSummary {
  subject: Subject;
  totalChapters: number;
  totalTopics: number;
  masteredCount: number;
  masteringCount: number;
  willCount: number;
  easyCount: number;
  hardCount: number;
  canICount: number;
  popularCount: number;
  commonCount: number;
  rareCount: number;
  progressPercentage: number;
  potentialPercentage: number;
}

export interface OverallStats {
  totalSubjects: number;
  totalChapters: number;
  totalTopics: number;
  masteredCount: number;
  masteringCount: number;
  willCount: number;
  easyCount: number;
  hardCount: number;
  canICount: number;
  popularCount: number;
  commonCount: number;
  rareCount: number;
  totalFullMarks: number;
  totalPotentialMarks: number;
  overallPercentage: number;
  masteryPercentage: number;
}

export type ActiveTab = 'dashboard' | 'book' | 'potential';

// ==================== POTENTIAL MARK V2 ====================

export type PotentialRecordStatus = 'SUBMITTED' | 'CARRIED_FORWARD';

export interface PotentialRecord {
  id: string; // Deterministic: rec_{weekId}_{subjectId}
  subjectId: string;
  subjectName: string;
  subjectNameBn?: string | null;
  subjectCode?: string | null;
  paper?: 'FIRST' | 'SECOND' | null;
  weekId: string; // e.g. "2026-W45"
  surveyDate: string; // Saturday date "YYYY-MM-DD"
  potentialMarks: number;
  fullMarks: number;
  status: PotentialRecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklySurveyCycle {
  weekId: string;
  surveyDate: string; // YYYY-MM-DD
  formattedDate: string; // "Saturday, 07 November 2026"
  totalSubjects: number;
  submittedCount: number;
  carriedForwardCount: number;
  pendingCount: number;
  isFullyFinalized: boolean;
  timeRemaining: string;
}

export interface SubjectGrowthStat {
  subject: Subject;
  currentMark: number;
  previousMark: number | null;
  weekDifference: number; // current - previous
  highestMark: number;
  lowestMark: number;
  baselineMark: number | null;
  totalGrowth: number; // based on actual submitted assessments
  submittedSurveysCount: number;
  carriedForwardCount: number;
  currentStatus: 'SUBMITTED' | 'CARRIED_FORWARD' | 'PENDING';
  recordsHistory: PotentialRecord[];
}

export interface OverallGrowthStat {
  currentTotalPotential: number;
  currentTotalFull: number;
  currentPercentage: number;
  previousTotalPotential: number | null;
  previousTotalFull: number | null;
  previousPercentage: number | null;
  totalMarkDifference: number;
  percentagePointDifference: number;
  totalWeeksRecorded: number;
  firstSurveyDate: string | null;
  latestSurveyDate: string | null;
  totalSubmittedAssessments: number;
  totalCarriedForwardAssessments: number;
  weeklyTrend: {
    weekId: string;
    surveyDate: string;
    formattedDate: string;
    totalPotential: number;
    totalFull: number;
    percentage: number;
    submittedCount: number;
    carriedCount: number;
  }[];
}


import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  auth,
  db,
  isUserOwner,
  handleFirestoreError,
  OperationType,
  testConnection,
  loginWithOwner,
  logout,
  OWNER_EMAIL,
} from '../firebase';
import type {
  Subject,
  Chapter,
  Topic,
  OverallStats,
  SubjectSummary,
  ChapterSummary,
  MasteryStatus,
  DifficultyStatus,
  BoardImportance,
  PotentialRecord,
  WeeklySurveyCycle,
  SubjectGrowthStat,
  OverallGrowthStat,
} from '../types';
import {
  SUBJECTS_COLLECTION,
  CHAPTERS_COLLECTION,
  TOPICS_COLLECTION,
  POTENTIAL_RECORDS_COLLECTION,
  createSubject,
  updateSubject,
  deleteSubject,
  createChapter,
  updateChapter,
  deleteChapter,
  createTopic,
  updateTopic,
  deleteTopic,
  calculateOverallStats,
  calculateSubjectSummary,
  calculateChapterSummary,
  seedOfficialHscSyllabus,
  submitWeeklyPotentialMarks,
  carryForwardWeeklyPotentialMarks,
  reconcileWeeklyPotentialRecords,
  calculateGrowthStatistics,
} from '../services/academicService';
import {
  getSurveySaturday,
  formatSurveyDate,
  getTimeUntilNextSurvey,
} from '../utils/dhakaTime';

interface AcademicContextType {
  // Auth state
  user: User | null;
  isOwner: boolean;
  authLoading: boolean;
  ownerEmail: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;

  // Data state
  subjects: Subject[];
  chapters: Chapter[];
  topics: Topic[];
  loading: boolean;
  error: string | null;

  // Selected state for BOOK module
  selectedSubjectId: string | null;
  setSelectedSubjectId: (id: string | null) => void;
  selectedChapterId: string | null;
  setSelectedChapterId: (id: string | null) => void;

  // Calculated Stats
  overallStats: OverallStats;
  subjectSummaries: Map<string, SubjectSummary>;
  chapterSummaries: Map<string, ChapterSummary>;

  // Subject Actions
  addSubject: (data: { name: string; code?: string; fullMarks: number; potentialMarks: number }) => Promise<Subject>;
  editSubject: (id: string, data: Partial<Pick<Subject, 'name' | 'code' | 'fullMarks' | 'potentialMarks'>>) => Promise<void>;
  removeSubject: (id: string) => Promise<void>;

  // Chapter Actions
  addChapter: (data: { subjectId: string; name: string; nameBn?: string; chapterNumber?: number }) => Promise<Chapter>;
  editChapter: (id: string, data: Partial<Pick<Chapter, 'name' | 'nameBn' | 'chapterNumber'>>) => Promise<void>;
  removeChapter: (id: string) => Promise<void>;

  // Topic Actions
  addTopic: (data: {
    subjectId: string;
    chapterId: string;
    name: string;
    nameBn?: string;
    author?: string;
    mastery: MasteryStatus;
    difficulty: DifficultyStatus;
    boardImportance: BoardImportance;
  }) => Promise<Topic>;
  editTopic: (
    id: string,
    data: Partial<Pick<Topic, 'name' | 'nameBn' | 'author' | 'mastery' | 'difficulty' | 'boardImportance'>>
  ) => Promise<void>;
  removeTopic: (id: string) => Promise<void>;

  // Fast inline property update
  setTopicMastery: (id: string, mastery: MasteryStatus) => Promise<void>;
  setTopicDifficulty: (id: string, difficulty: DifficultyStatus) => Promise<void>;
  setTopicBoardImportance: (id: string, importance: BoardImportance) => Promise<void>;

  // Potential marks quick update
  updateSubjectPotentialMarks: (id: string, potentialMarks: number, fullMarks?: number) => Promise<void>;

  // Potential Mark V2: Weekly Survey & Historical Records
  potentialRecords: PotentialRecord[];
  surveyCycle: WeeklySurveyCycle;
  growthStats: { overall: OverallGrowthStat; subjectStats: SubjectGrowthStat[] };
  submitWeeklySurvey: (items: { subjectId: string; potentialMarks: number; fullMarks?: number }[]) => Promise<void>;
  carryForwardPendingSubjects: (targetSubjectIds?: string[]) => Promise<void>;
  reconcileHistoricalRecords: () => Promise<void>;
  isSubmittingSurvey: boolean;

  // Permanent official HSC syllabus seeding
  populateOfficialSyllabus: () => Promise<{ subjectsCount: number; chaptersCount: number; topicsCount: number }>;
  isPopulatingSyllabus: boolean;
}

const AcademicContext = createContext<AcademicContextType | null>(null);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [potentialRecords, setPotentialRecords] = useState<PotentialRecord[]>([]);
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(() => getTimeUntilNextSurvey().formatted);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // Time remaining update interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilNextSurvey().formatted);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 1. Connection check and Auth listener
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time data sync with Firestore
  useEffect(() => {
    // Both visitors and owner can read data in real-time
    const subjectsCol = collection(db, SUBJECTS_COLLECTION);
    const chaptersCol = collection(db, CHAPTERS_COLLECTION);
    const topicsCol = collection(db, TOPICS_COLLECTION);
    const potentialCol = collection(db, POTENTIAL_RECORDS_COLLECTION);

    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= 4) {
        setLoading(false);
      }
    };

    const unsubSubjects = onSnapshot(
      subjectsCol,
      (snapshot) => {
        const subs: Subject[] = [];
        snapshot.forEach((docSnap) => {
          subs.push({ ...(docSnap.data() as Subject), id: docSnap.id });
        });
        // Sort by order, then name
        subs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
        setSubjects(subs);
        checkAllLoaded();
      },
      (err) => {
        setError('Failed to load subjects from database');
        handleFirestoreError(err, OperationType.GET, SUBJECTS_COLLECTION);
      }
    );

    const unsubChapters = onSnapshot(
      chaptersCol,
      (snapshot) => {
        const chaps: Chapter[] = [];
        snapshot.forEach((docSnap) => {
          chaps.push({ ...(docSnap.data() as Chapter), id: docSnap.id });
        });
        // Sort by chapterNumber, then order, then name
        chaps.sort((a, b) => {
          if (a.chapterNumber !== undefined && b.chapterNumber !== undefined) {
            return a.chapterNumber - b.chapterNumber;
          }
          return (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name);
        });
        setChapters(chaps);
        checkAllLoaded();
      },
      (err) => {
        setError('Failed to load chapters from database');
        handleFirestoreError(err, OperationType.GET, CHAPTERS_COLLECTION);
      }
    );

    const unsubTopics = onSnapshot(
      topicsCol,
      (snapshot) => {
        const tops: Topic[] = [];
        snapshot.forEach((docSnap) => {
          tops.push({ ...(docSnap.data() as Topic), id: docSnap.id });
        });
        // Sort by order, then name
        tops.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
        setTopics(tops);
        checkAllLoaded();
      },
      (err) => {
        setError('Failed to load topics from database');
        handleFirestoreError(err, OperationType.GET, TOPICS_COLLECTION);
      }
    );

    const unsubPotential = onSnapshot(
      potentialCol,
      (snapshot) => {
        const recs: PotentialRecord[] = [];
        snapshot.forEach((docSnap) => {
          recs.push({ ...(docSnap.data() as PotentialRecord), id: docSnap.id });
        });
        recs.sort((a, b) => a.surveyDate.localeCompare(b.surveyDate));
        setPotentialRecords(recs);
        checkAllLoaded();
      },
      (err) => {
        setError('Failed to load potential survey records from database');
        handleFirestoreError(err, OperationType.GET, POTENTIAL_RECORDS_COLLECTION);
      }
    );

    return () => {
      unsubSubjects();
      unsubChapters();
      unsubTopics();
      unsubPotential();
    };
  }, []);

  // Sync selected subject if none selected
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    } else if (subjects.length > 0 && selectedSubjectId && !subjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Sync selected chapter if none selected or invalid
  useEffect(() => {
    if (!selectedSubjectId) {
      setSelectedChapterId(null);
      return;
    }
    const currentSubjectChapters = chapters.filter((c) => c.subjectId === selectedSubjectId);
    if (currentSubjectChapters.length > 0) {
      if (!selectedChapterId || !currentSubjectChapters.some((c) => c.id === selectedChapterId)) {
        setSelectedChapterId(currentSubjectChapters[0].id);
      }
    } else {
      setSelectedChapterId(null);
    }
  }, [selectedSubjectId, chapters, selectedChapterId]);

  const isOwner = isUserOwner(user);

  // Pre-calculated stats
  const overallStats = calculateOverallStats(subjects, chapters, topics);

  const subjectSummaries = new Map<string, SubjectSummary>();
  for (const s of subjects) {
    subjectSummaries.set(s.id, calculateSubjectSummary(s, chapters, topics));
  }

  const chapterSummaries = new Map<string, ChapterSummary>();
  for (const c of chapters) {
    chapterSummaries.set(c.id, calculateChapterSummary(c, topics));
  }

  // Auth actions
  const login = async () => {
    try {
      await loginWithOwner();
    } catch (err) {
      console.error('Sign-in failed:', err);
      throw err;
    }
  };

  const logoutAction = async () => {
    await logout();
  };

  // Subject Actions
  const addSubject = async (data: { name: string; code?: string; fullMarks: number; potentialMarks: number }) => {
    const order = subjects.length;
    const sub = await createSubject({ ...data, order });
    setSelectedSubjectId(sub.id);
    return sub;
  };

  const editSubject = async (
    id: string,
    data: Partial<Pick<Subject, 'name' | 'code' | 'fullMarks' | 'potentialMarks'>>
  ) => {
    await updateSubject(id, data);
  };

  const removeSubject = async (id: string) => {
    await deleteSubject(id, chapters, topics);
    if (selectedSubjectId === id) {
      const remaining = subjects.filter((s) => s.id !== id);
      setSelectedSubjectId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Chapter Actions
  const addChapter = async (data: { subjectId: string; name: string; nameBn?: string; chapterNumber?: number }) => {
    const count = chapters.filter((c) => c.subjectId === data.subjectId).length;
    const chap = await createChapter({
      ...data,
      order: count,
      chapterNumber: data.chapterNumber ?? count + 1,
    });
    setSelectedChapterId(chap.id);
    return chap;
  };

  const editChapter = async (
    id: string,
    data: Partial<Pick<Chapter, 'name' | 'nameBn' | 'chapterNumber'>>
  ) => {
    await updateChapter(id, data);
  };

  const removeChapter = async (id: string) => {
    await deleteChapter(id, topics);
    if (selectedChapterId === id) {
      const remaining = chapters.filter((c) => c.subjectId === selectedSubjectId && c.id !== id);
      setSelectedChapterId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Topic Actions
  const addTopic = async (data: {
    subjectId: string;
    chapterId: string;
    name: string;
    nameBn?: string;
    author?: string;
    mastery: MasteryStatus;
    difficulty: DifficultyStatus;
    boardImportance: BoardImportance;
  }) => {
    const count = topics.filter((t) => t.chapterId === data.chapterId).length;
    return await createTopic({
      ...data,
      order: count,
    });
  };

  const editTopic = async (
    id: string,
    data: Partial<Pick<Topic, 'name' | 'nameBn' | 'author' | 'mastery' | 'difficulty' | 'boardImportance'>>
  ) => {
    await updateTopic(id, data);
  };

  const removeTopic = async (id: string) => {
    await deleteTopic(id);
  };

  // Fast inline property updates
  const setTopicMastery = async (id: string, mastery: MasteryStatus) => {
    await updateTopic(id, { mastery });
  };

  const setTopicDifficulty = async (id: string, difficulty: DifficultyStatus) => {
    await updateTopic(id, { difficulty });
  };

  const setTopicBoardImportance = async (id: string, boardImportance: BoardImportance) => {
    await updateTopic(id, { boardImportance });
  };

  const updateSubjectPotentialMarks = async (id: string, potentialMarks: number, fullMarks?: number) => {
    const payload: Partial<Pick<Subject, 'potentialMarks' | 'fullMarks'>> = { potentialMarks };
    if (fullMarks !== undefined) {
      payload.fullMarks = fullMarks;
    }
    await updateSubject(id, payload);
  };

  // ==================== POTENTIAL MARK V2 ACTIONS & STATS ====================

  const surveyCycle: WeeklySurveyCycle = useMemo(() => {
    const cycle = getSurveySaturday();
    const cycleRecords = potentialRecords.filter((r) => r.weekId === cycle.weekId);
    const submittedCount = cycleRecords.filter((r) => r.status === 'SUBMITTED').length;
    const carriedForwardCount = cycleRecords.filter((r) => r.status === 'CARRIED_FORWARD').length;
    const pendingCount = Math.max(0, subjects.length - (submittedCount + carriedForwardCount));
    const isFullyFinalized = subjects.length > 0 && pendingCount === 0;

    return {
      weekId: cycle.weekId,
      surveyDate: cycle.surveyDate,
      formattedDate: formatSurveyDate(cycle.saturdayDate),
      totalSubjects: subjects.length,
      submittedCount,
      carriedForwardCount,
      pendingCount,
      isFullyFinalized,
      timeRemaining,
    };
  }, [potentialRecords, subjects.length, timeRemaining]);

  const growthStats = useMemo(() => {
    return calculateGrowthStatistics(subjects, potentialRecords);
  }, [subjects, potentialRecords]);

  const submitWeeklySurvey = async (
    items: { subjectId: string; potentialMarks: number; fullMarks?: number }[]
  ) => {
    if (items.length === 0) return;
    try {
      setIsSubmittingSurvey(true);
      const itemsToSubmit = items.map((item) => {
        const sub = subjects.find((s) => s.id === item.subjectId);
        return {
          subjectId: item.subjectId,
          subjectName: sub?.name || 'Subject',
          subjectNameBn: sub?.nameBn,
          subjectCode: sub?.code,
          paper: sub?.paper,
          potentialMarks: item.potentialMarks,
          fullMarks: item.fullMarks ?? sub?.fullMarks ?? 100,
        };
      });
      await submitWeeklyPotentialMarks(itemsToSubmit);
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  const carryForwardPendingSubjects = async (targetSubjectIds?: string[]) => {
    const cycle = getSurveySaturday();
    const cycleRecordSubjectIds = new Set(
      potentialRecords.filter((r) => r.weekId === cycle.weekId).map((r) => r.subjectId)
    );

    const pending = subjects.filter((s) => {
      if (targetSubjectIds && !targetSubjectIds.includes(s.id)) return false;
      return !cycleRecordSubjectIds.has(s.id);
    });

    if (pending.length === 0) return;

    try {
      setIsSubmittingSurvey(true);
      await carryForwardWeeklyPotentialMarks(pending, cycle);
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  const reconcileHistoricalRecords = async () => {
    if (subjects.length === 0) return;
    try {
      await reconcileWeeklyPotentialRecords(subjects, potentialRecords);
    } catch (err) {
      console.error('Failed to reconcile weekly records:', err);
    }
  };

  // Automated background catch-up & carry-forward for owner
  const hasAutoReconciledRef = useRef(false);
  useEffect(() => {
    if (isOwner && !loading && subjects.length > 0 && !hasAutoReconciledRef.current) {
      hasAutoReconciledRef.current = true;
      reconcileWeeklyPotentialRecords(subjects, potentialRecords).catch((err) => {
        console.error('Background survey reconciliation error:', err);
      });
    }
  }, [isOwner, loading, subjects.length, potentialRecords.length]);

  const [isPopulatingSyllabus, setIsPopulatingSyllabus] = useState(false);

  // Seed official syllabus
  const populateOfficialSyllabus = async () => {
    try {
      setIsPopulatingSyllabus(true);
      const res = await seedOfficialHscSyllabus();
      return res;
    } catch (err) {
      console.error('Failed to populate syllabus:', err);
      throw err;
    } finally {
      setIsPopulatingSyllabus(false);
    }
  };

  return (
    <AcademicContext.Provider
      value={{
        user,
        isOwner,
        authLoading,
        ownerEmail: OWNER_EMAIL,
        login,
        logout: logoutAction,
        subjects,
        chapters,
        topics,
        loading,
        error,
        selectedSubjectId,
        setSelectedSubjectId,
        selectedChapterId,
        setSelectedChapterId,
        overallStats,
        subjectSummaries,
        chapterSummaries,
        addSubject,
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
        updateSubjectPotentialMarks,
        potentialRecords,
        surveyCycle,
        growthStats,
        submitWeeklySurvey,
        carryForwardPendingSubjects,
        reconcileHistoricalRecords,
        isSubmittingSurvey,
        populateOfficialSyllabus,
        isPopulatingSyllabus,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export function useAcademic(): AcademicContextType {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
}

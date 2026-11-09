import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  Subject,
  Chapter,
  Topic,
  MasteryStatus,
  DifficultyStatus,
  BoardImportance,
  ChapterSummary,
  SubjectSummary,
  OverallStats,
  PotentialRecord,
  SubjectGrowthStat,
  OverallGrowthStat,
} from '../types';
import { HSC_PERMANENT_SUBJECTS } from '../data/hscPermanentData';
import { getSurveySaturday, formatShortSurveyDate, generateSaturdaySequence } from '../utils/dhakaTime';

export const SUBJECTS_COLLECTION = 'subjects';
export const CHAPTERS_COLLECTION = 'chapters';
export const TOPICS_COLLECTION = 'topics';
export const POTENTIAL_RECORDS_COLLECTION = 'potential_records';

export function getPotentialRecordId(weekId: string, subjectId: string): string {
  const safeWeek = weekId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSub = subjectId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `rec_${safeWeek}_${safeSub}`;
}

// Helper to generate clean, collision-free Firestore IDs matching the regex ^[a-zA-Z0-9_\-]+$
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomStr}`;
}

// ==================== SUBJECT CRUD ====================

export async function createSubject(data: {
  name: string;
  nameBn?: string;
  code?: string;
  paper?: 'FIRST' | 'SECOND' | null;
  fullMarks: number;
  potentialMarks: number;
  order?: number;
}): Promise<Subject> {
  const subjectId = generateId('sub');
  const now = new Date().toISOString();
  const subjectPayload: Record<string, unknown> = {
    id: subjectId,
    name: data.name.trim(),
    fullMarks: Number(data.fullMarks) || 100,
    potentialMarks: Number(data.potentialMarks) || 0,
    order: data.order ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  if (data.nameBn && data.nameBn.trim()) {
    subjectPayload.nameBn = data.nameBn.trim();
  }
  if (data.paper) {
    subjectPayload.paper = data.paper;
  }
  if (data.code && data.code.trim()) {
    subjectPayload.code = data.code.trim();
  }

  const subject: Subject = {
    id: subjectId,
    name: data.name.trim(),
    code: data.code?.trim() || '',
    fullMarks: Number(data.fullMarks) || 100,
    potentialMarks: Number(data.potentialMarks) || 0,
    order: data.order ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  const path = `${SUBJECTS_COLLECTION}/${subjectId}`;
  try {
    const docRef = doc(db, SUBJECTS_COLLECTION, subjectId);
    await setDoc(docRef, subjectPayload);
    return subject;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSubject(
  id: string,
  data: Partial<Pick<Subject, 'name' | 'nameBn' | 'paper' | 'code' | 'fullMarks' | 'potentialMarks' | 'order' | 'practicalComponents'>>
): Promise<void> {
  const path = `${SUBJECTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, SUBJECTS_COLLECTION, id);
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.nameBn !== undefined) updatePayload.nameBn = data.nameBn ? data.nameBn.trim() : '';
    if (data.paper !== undefined) updatePayload.paper = data.paper;
    if (data.code !== undefined) updatePayload.code = data.code.trim();
    if (data.fullMarks !== undefined) updatePayload.fullMarks = Number(data.fullMarks);
    if (data.potentialMarks !== undefined) updatePayload.potentialMarks = Number(data.potentialMarks);
    if (data.order !== undefined) updatePayload.order = Number(data.order);
    if (data.practicalComponents !== undefined) updatePayload.practicalComponents = data.practicalComponents;

    await updateDoc(docRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSubject(
  subjectId: string,
  associatedChapters: Chapter[] = [],
  associatedTopics: Topic[] = []
): Promise<void> {
  const path = `${SUBJECTS_COLLECTION}/${subjectId}`;
  try {
    const batch = writeBatch(db);

    // Delete associated topics
    const topicsToDelete = associatedTopics.filter((t) => t.subjectId === subjectId);
    for (const t of topicsToDelete) {
      batch.delete(doc(db, TOPICS_COLLECTION, t.id));
    }

    // Delete associated chapters
    const chaptersToDelete = associatedChapters.filter((c) => c.subjectId === subjectId);
    for (const c of chaptersToDelete) {
      batch.delete(doc(db, CHAPTERS_COLLECTION, c.id));
    }

    // Delete subject
    batch.delete(doc(db, SUBJECTS_COLLECTION, subjectId));

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== CHAPTER CRUD ====================

export async function createChapter(data: {
  subjectId: string;
  name: string;
  nameBn?: string;
  chapterNumber?: number;
  order?: number;
}): Promise<Chapter> {
  const chapterId = generateId('ch');
  const now = new Date().toISOString();
  const chapterPayload: Record<string, unknown> = {
    id: chapterId,
    subjectId: data.subjectId,
    name: data.name.trim(),
    order: data.order ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  if (data.nameBn && data.nameBn.trim()) {
    chapterPayload.nameBn = data.nameBn.trim();
  }
  if (data.chapterNumber !== undefined && !isNaN(Number(data.chapterNumber))) {
    chapterPayload.chapterNumber = Number(data.chapterNumber);
  }

  const chapter: Chapter = {
    id: chapterId,
    subjectId: data.subjectId,
    name: data.name.trim(),
    nameBn: data.nameBn?.trim(),
    chapterNumber: data.chapterNumber !== undefined ? Number(data.chapterNumber) : undefined,
    order: data.order ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  const path = `${CHAPTERS_COLLECTION}/${chapterId}`;
  try {
    const docRef = doc(db, CHAPTERS_COLLECTION, chapterId);
    await setDoc(docRef, chapterPayload);
    return chapter;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateChapter(
  id: string,
  data: Partial<Pick<Chapter, 'name' | 'nameBn' | 'chapterNumber' | 'order'>>
): Promise<void> {
  const path = `${CHAPTERS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, CHAPTERS_COLLECTION, id);
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.nameBn !== undefined) updatePayload.nameBn = data.nameBn ? data.nameBn.trim() : '';
    if (data.chapterNumber !== undefined) updatePayload.chapterNumber = Number(data.chapterNumber);
    if (data.order !== undefined) updatePayload.order = Number(data.order);

    await updateDoc(docRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteChapter(chapterId: string, associatedTopics: Topic[] = []): Promise<void> {
  const path = `${CHAPTERS_COLLECTION}/${chapterId}`;
  try {
    const batch = writeBatch(db);

    const topicsToDelete = associatedTopics.filter((t) => t.chapterId === chapterId);
    for (const t of topicsToDelete) {
      batch.delete(doc(db, TOPICS_COLLECTION, t.id));
    }

    batch.delete(doc(db, CHAPTERS_COLLECTION, chapterId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== TOPIC CRUD ====================

export async function createTopic(data: {
  subjectId: string;
  chapterId: string;
  name: string;
  nameBn?: string;
  author?: string;
  mastery: MasteryStatus;
  difficulty: DifficultyStatus;
  boardImportance: BoardImportance;
  order?: number;
}): Promise<Topic> {
  const topicId = generateId('top');
  const now = new Date().toISOString();
  const topicPayload: Record<string, unknown> = {
    id: topicId,
    subjectId: data.subjectId,
    chapterId: data.chapterId,
    name: data.name.trim(),
    mastery: data.mastery,
    difficulty: data.difficulty,
    boardImportance: data.boardImportance,
    order: data.order ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  if (data.nameBn && data.nameBn.trim()) {
    topicPayload.nameBn = data.nameBn.trim();
  }
  if (data.author && data.author.trim()) {
    topicPayload.author = data.author.trim();
  }

  const topic: Topic = {
    id: topicId,
    subjectId: data.subjectId,
    chapterId: data.chapterId,
    name: data.name.trim(),
    nameBn: data.nameBn?.trim(),
    author: data.author?.trim(),
    mastery: data.mastery,
    difficulty: data.difficulty,
    boardImportance: data.boardImportance,
    order: data.order ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  const path = `${TOPICS_COLLECTION}/${topicId}`;
  try {
    const docRef = doc(db, TOPICS_COLLECTION, topicId);
    await setDoc(docRef, topicPayload);
    return topic;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTopic(
  id: string,
  data: Partial<Pick<Topic, 'name' | 'nameBn' | 'author' | 'mastery' | 'difficulty' | 'boardImportance' | 'order'>>
): Promise<void> {
  const path = `${TOPICS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, TOPICS_COLLECTION, id);
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.nameBn !== undefined) updatePayload.nameBn = data.nameBn ? data.nameBn.trim() : '';
    if (data.author !== undefined) updatePayload.author = data.author ? data.author.trim() : '';
    if (data.mastery !== undefined) updatePayload.mastery = data.mastery;
    if (data.difficulty !== undefined) updatePayload.difficulty = data.difficulty;
    if (data.boardImportance !== undefined) updatePayload.boardImportance = data.boardImportance;
    if (data.order !== undefined) updatePayload.order = Number(data.order);

    await updateDoc(docRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTopic(topicId: string): Promise<void> {
  const path = `${TOPICS_COLLECTION}/${topicId}`;
  try {
    const docRef = doc(db, TOPICS_COLLECTION, topicId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== AGGREGATIONS & SUMMARIES ====================

export function calculateChapterSummary(chapter: Chapter, topics: Topic[]): ChapterSummary {
  const chapterTopics = topics.filter((t) => t.chapterId === chapter.id);
  const totalTopics = chapterTopics.length;

  let masteredCount = 0;
  let masteringCount = 0;
  let willCount = 0;
  let easyCount = 0;
  let hardCount = 0;
  let canICount = 0;
  let popularCount = 0;
  let commonCount = 0;
  let rareCount = 0;

  for (const t of chapterTopics) {
    if (t.mastery === 'MASTERED') masteredCount++;
    else if (t.mastery === 'MASTERING') masteringCount++;
    else if (t.mastery === 'WILL') willCount++;

    if (t.difficulty === 'EASY') easyCount++;
    else if (t.difficulty === 'HARD') hardCount++;
    else if (t.difficulty === 'CAN I?') canICount++;

    if (t.boardImportance === 'POPULAR') popularCount++;
    else if (t.boardImportance === 'COMMON') commonCount++;
    else if (t.boardImportance === 'RARE') rareCount++;
  }

  // Progress: MASTERED is 100%, MASTERING is 50%, WILL is 0%
  const progressPercentage = totalTopics > 0
    ? Math.round(((masteredCount * 1.0 + masteringCount * 0.5) / totalTopics) * 100)
    : 0;

  return {
    chapter,
    totalTopics,
    masteredCount,
    masteringCount,
    willCount,
    easyCount,
    hardCount,
    canICount,
    popularCount,
    commonCount,
    rareCount,
    progressPercentage,
  };
}

export function calculateSubjectSummary(
  subject: Subject,
  chapters: Chapter[],
  topics: Topic[]
): SubjectSummary {
  const subjectChapters = chapters.filter((c) => c.subjectId === subject.id);
  const subjectTopics = topics.filter((t) => t.subjectId === subject.id);
  const totalTopics = subjectTopics.length;

  let masteredCount = 0;
  let masteringCount = 0;
  let willCount = 0;
  let easyCount = 0;
  let hardCount = 0;
  let canICount = 0;
  let popularCount = 0;
  let commonCount = 0;
  let rareCount = 0;

  for (const t of subjectTopics) {
    if (t.mastery === 'MASTERED') masteredCount++;
    else if (t.mastery === 'MASTERING') masteringCount++;
    else if (t.mastery === 'WILL') willCount++;

    if (t.difficulty === 'EASY') easyCount++;
    else if (t.difficulty === 'HARD') hardCount++;
    else if (t.difficulty === 'CAN I?') canICount++;

    if (t.boardImportance === 'POPULAR') popularCount++;
    else if (t.boardImportance === 'COMMON') commonCount++;
    else if (t.boardImportance === 'RARE') rareCount++;
  }

  const progressPercentage = totalTopics > 0
    ? Math.round(((masteredCount * 1.0 + masteringCount * 0.5) / totalTopics) * 100)
    : 0;

  const potentialPercentage = subject.fullMarks > 0
    ? Math.round((subject.potentialMarks / subject.fullMarks) * 100)
    : 0;

  return {
    subject,
    totalChapters: subjectChapters.length,
    totalTopics,
    masteredCount,
    masteringCount,
    willCount,
    easyCount,
    hardCount,
    canICount,
    popularCount,
    commonCount,
    rareCount,
    progressPercentage,
    potentialPercentage,
  };
}

export function calculateOverallStats(
  subjects: Subject[],
  chapters: Chapter[],
  topics: Topic[]
): OverallStats {
  const totalSubjects = subjects.length;
  const totalChapters = chapters.length;
  const totalTopics = topics.length;

  let masteredCount = 0;
  let masteringCount = 0;
  let willCount = 0;
  let easyCount = 0;
  let hardCount = 0;
  let canICount = 0;
  let popularCount = 0;
  let commonCount = 0;
  let rareCount = 0;

  for (const t of topics) {
    if (t.mastery === 'MASTERED') masteredCount++;
    else if (t.mastery === 'MASTERING') masteringCount++;
    else if (t.mastery === 'WILL') willCount++;

    if (t.difficulty === 'EASY') easyCount++;
    else if (t.difficulty === 'HARD') hardCount++;
    else if (t.difficulty === 'CAN I?') canICount++;

    if (t.boardImportance === 'POPULAR') popularCount++;
    else if (t.boardImportance === 'COMMON') commonCount++;
    else if (t.boardImportance === 'RARE') rareCount++;
  }

  let totalFullMarks = 0;
  let totalPotentialMarks = 0;
  for (const s of subjects) {
    totalFullMarks += s.fullMarks || 0;
    totalPotentialMarks += s.potentialMarks || 0;
  }

  const overallPercentage = totalFullMarks > 0
    ? Math.round((totalPotentialMarks / totalFullMarks) * 100)
    : 0;

  const masteryPercentage = totalTopics > 0
    ? Math.round(((masteredCount * 1.0 + masteringCount * 0.5) / totalTopics) * 100)
    : 0;

  return {
    totalSubjects,
    totalChapters,
    totalTopics,
    masteredCount,
    masteringCount,
    willCount,
    easyCount,
    hardCount,
    canICount,
    popularCount,
    commonCount,
    rareCount,
    totalFullMarks,
    totalPotentialMarks,
    overallPercentage,
    masteryPercentage,
  };
}

// ==================== SEED OFFICIAL HSC SYLLABUS ====================

export async function seedOfficialHscSyllabus(): Promise<{
  subjectsCount: number;
  chaptersCount: number;
  topicsCount: number;
}> {
  const now = new Date().toISOString();
  let subjectsCount = 0;
  let chaptersCount = 0;
  let topicsCount = 0;

  // Firestore allows up to 500 writes per batch. Total docs is ~188, so one batch is sufficient.
  const batch = writeBatch(db);

  for (let sIdx = 0; sIdx < HSC_PERMANENT_SUBJECTS.length; sIdx++) {
    const rawSub = HSC_PERMANENT_SUBJECTS[sIdx];
    subjectsCount++;

    const subjectPayload: Record<string, unknown> = {
      id: rawSub.id,
      name: rawSub.name,
      code: rawSub.subjectCode,
      fullMarks: 100,
      potentialMarks: 85,
      order: sIdx,
      createdAt: now,
      updatedAt: now,
    };
    if (rawSub.nameBn) subjectPayload.nameBn = rawSub.nameBn;
    if (rawSub.paper) subjectPayload.paper = rawSub.paper;
    if (rawSub.practicalComponents && rawSub.practicalComponents.length > 0) {
      subjectPayload.practicalComponents = rawSub.practicalComponents;
    }

    batch.set(doc(db, SUBJECTS_COLLECTION, rawSub.id), subjectPayload);

    for (let cIdx = 0; cIdx < rawSub.chapters.length; cIdx++) {
      const rawChap = rawSub.chapters[cIdx];
      chaptersCount++;

      const chapterPayload: Record<string, unknown> = {
        id: rawChap.id,
        subjectId: rawSub.id,
        name: rawChap.name,
        chapterNumber: rawChap.number,
        order: cIdx,
        createdAt: now,
        updatedAt: now,
      };
      if (rawChap.nameBn) chapterPayload.nameBn = rawChap.nameBn;

      batch.set(doc(db, CHAPTERS_COLLECTION, rawChap.id), chapterPayload);

      for (let tIdx = 0; tIdx < rawChap.topics.length; tIdx++) {
        const rawTop = rawChap.topics[tIdx];
        topicsCount++;

        const topicPayload: Record<string, unknown> = {
          id: rawTop.id,
          subjectId: rawSub.id,
          chapterId: rawChap.id,
          name: rawTop.name,
          order: tIdx,
          mastery: rawTop.tracking?.mastery || 'WILL',
          difficulty: rawTop.tracking?.difficulty || 'EASY',
          boardImportance: rawTop.tracking?.boardImportance || 'COMMON',
          createdAt: now,
          updatedAt: now,
        };
        if (rawTop.nameBn) topicPayload.nameBn = rawTop.nameBn;
        if (rawTop.author) topicPayload.author = rawTop.author;

        batch.set(doc(db, TOPICS_COLLECTION, rawTop.id), topicPayload);
      }
    }
  }

  const path = 'batch/seedOfficialHscSyllabus';
  try {
    await batch.commit();
    return { subjectsCount, chaptersCount, topicsCount };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==================== POTENTIAL MARK V2 ====================

/**
 * Submit weekly potential mark assessments for one or multiple subjects.
 * Creates 'SUBMITTED' records in potential_records and updates subject potentialMarks.
 */
export async function submitWeeklyPotentialMarks(
  items: {
    subjectId: string;
    subjectName: string;
    subjectNameBn?: string | null;
    subjectCode?: string | null;
    paper?: 'FIRST' | 'SECOND' | null;
    potentialMarks: number;
    fullMarks: number;
  }[],
  weekOverride?: { weekId: string; surveyDate: string }
): Promise<void> {
  if (items.length === 0) return;

  const cycle = weekOverride || getSurveySaturday();
  const now = new Date().toISOString();
  const batch = writeBatch(db);

  for (const item of items) {
    const validatedPotential = Math.max(0, Math.min(item.fullMarks, Number(item.potentialMarks) || 0));
    const validatedFull = Math.max(1, Number(item.fullMarks) || 100);
    const recordId = getPotentialRecordId(cycle.weekId, item.subjectId);

    const recordPayload: Record<string, unknown> = {
      id: recordId,
      subjectId: item.subjectId,
      subjectName: item.subjectName.trim(),
      weekId: cycle.weekId,
      surveyDate: cycle.surveyDate,
      potentialMarks: validatedPotential,
      fullMarks: validatedFull,
      status: 'SUBMITTED',
      createdAt: now,
      updatedAt: now,
    };
    if (item.subjectNameBn) recordPayload.subjectNameBn = item.subjectNameBn;
    if (item.subjectCode) recordPayload.subjectCode = item.subjectCode;
    if (item.paper) recordPayload.paper = item.paper;

    // 1. Write or update potential record
    const recordRef = doc(db, POTENTIAL_RECORDS_COLLECTION, recordId);
    batch.set(recordRef, recordPayload);

    // 2. Synchronize current potential marks on the subject document
    const subjectRef = doc(db, SUBJECTS_COLLECTION, item.subjectId);
    batch.update(subjectRef, {
      potentialMarks: validatedPotential,
      fullMarks: validatedFull,
      updatedAt: now,
    });
  }

  const path = `batch/submitWeeklyPotentialMarks/${cycle.weekId}`;
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Carry forward existing potential marks for subjects that did not receive a new submission.
 * Creates 'CARRIED_FORWARD' records in potential_records.
 * Guarantees idempotency via deterministic record IDs.
 */
export async function carryForwardWeeklyPotentialMarks(
  subjectsToCarry: {
    id: string;
    name: string;
    nameBn?: string | null;
    code?: string | null;
    paper?: 'FIRST' | 'SECOND' | null;
    potentialMarks: number;
    fullMarks: number;
  }[],
  weekInfo: { weekId: string; surveyDate: string }
): Promise<void> {
  if (subjectsToCarry.length === 0) return;

  const now = new Date().toISOString();
  const batch = writeBatch(db);

  for (const sub of subjectsToCarry) {
    const recordId = getPotentialRecordId(weekInfo.weekId, sub.id);
    const validatedPotential = Math.max(0, Math.min(sub.fullMarks, Number(sub.potentialMarks) || 0));
    const validatedFull = Math.max(1, Number(sub.fullMarks) || 100);

    const recordPayload: Record<string, unknown> = {
      id: recordId,
      subjectId: sub.id,
      subjectName: sub.name.trim(),
      weekId: weekInfo.weekId,
      surveyDate: weekInfo.surveyDate,
      potentialMarks: validatedPotential,
      fullMarks: validatedFull,
      status: 'CARRIED_FORWARD',
      createdAt: now,
      updatedAt: now,
    };
    if (sub.nameBn) recordPayload.subjectNameBn = sub.nameBn;
    if (sub.code) recordPayload.subjectCode = sub.code;
    if (sub.paper) recordPayload.paper = sub.paper;

    const recordRef = doc(db, POTENTIAL_RECORDS_COLLECTION, recordId);
    batch.set(recordRef, recordPayload);
  }

  const path = `batch/carryForwardWeeklyPotentialMarks/${weekInfo.weekId}`;
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Automated reconciliation to ensure no historical Saturday cycle is missing.
 * Runs on application mount / owner login. If past weeks lack records, carries forward
 * the last known marks chronologically.
 */
export async function reconcileWeeklyPotentialRecords(
  subjects: Subject[],
  existingRecords: PotentialRecord[]
): Promise<{ addedCount: number }> {
  if (subjects.length === 0) return { addedCount: 0 };

  const currentCycle = getSurveySaturday();
  const existingRecordMap = new Map<string, PotentialRecord>();
  for (const r of existingRecords) {
    existingRecordMap.set(`${r.weekId}_${r.subjectId}`, r);
  }

  // Find all distinct weeks recorded or default to current week
  const recordWeeks = Array.from(new Set(existingRecords.map((r) => r.weekId))).sort();
  let targetWeeks: { weekId: string; surveyDate: string }[] = [];

  if (recordWeeks.length > 0) {
    // Collect all Saturday cycles from earliest recorded week up to current
    const earliestRecord = existingRecords.reduce((earliest, r) => (r.surveyDate < earliest.surveyDate ? r : earliest), existingRecords[0]);
    targetWeeks = generateSaturdaySequence(earliestRecord.surveyDate, currentCycle.saturdayDate);
  } else {
    // No prior records: start with current Saturday cycle
    targetWeeks = [{ weekId: currentCycle.weekId, surveyDate: currentCycle.surveyDate }];
  }

  // Identify missing records
  const missingByWeek = new Map<string, { week: { weekId: string; surveyDate: string }; subjects: Subject[] }>();

  for (const week of targetWeeks) {
    // For past weeks (or current week if requested), check which subjects lack a record
    const missingSubs: Subject[] = [];
    for (const sub of subjects) {
      const key = `${week.weekId}_${sub.id}`;
      if (!existingRecordMap.has(key)) {
        // Only carry forward if subject has a valid potential mark (> 0 or configured)
        if (typeof sub.potentialMarks === 'number' && !isNaN(sub.potentialMarks)) {
          missingSubs.push(sub);
        }
      }
    }
    if (missingSubs.length > 0) {
      missingByWeek.set(week.weekId, { week, subjects: missingSubs });
    }
  }

  let totalAdded = 0;
  // Apply carry forwards week by week chronologically
  for (const [, entry] of missingByWeek) {
    await carryForwardWeeklyPotentialMarks(entry.subjects, entry.week);
    totalAdded += entry.subjects.length;
  }

  return { addedCount: totalAdded };
}

/**
 * Calculate Comprehensive Growth Statistics from actual database records.
 * Carried-forward records represent no new assessment, so they are not treated as new growth.
 */
export function calculateGrowthStatistics(
  subjects: Subject[],
  records: PotentialRecord[]
): {
  overall: OverallGrowthStat;
  subjectStats: SubjectGrowthStat[];
} {
  const currentCycle = getSurveySaturday();

  // 1. Group records by week and by subject
  const recordsByWeek = new Map<string, PotentialRecord[]>();
  const recordsBySubject = new Map<string, PotentialRecord[]>();

  for (const r of records) {
    if (!recordsByWeek.has(r.weekId)) {
      recordsByWeek.set(r.weekId, []);
    }
    recordsByWeek.get(r.weekId)!.push(r);

    if (!recordsBySubject.has(r.subjectId)) {
      recordsBySubject.set(r.subjectId, []);
    }
    recordsBySubject.get(r.subjectId)!.push(r);
  }

  // Sort chronological weeks by surveyDate
  const sortedWeeks = Array.from(recordsByWeek.entries())
    .map(([weekId, recs]) => ({
      weekId,
      surveyDate: recs[0].surveyDate,
      records: recs,
    }))
    .sort((a, b) => a.surveyDate.localeCompare(b.surveyDate));

  // Build weeklyTrend
  const weeklyTrend = sortedWeeks.map((w) => {
    const totalPotential = w.records.reduce((acc, r) => acc + (r.potentialMarks || 0), 0);
    const totalFull = w.records.reduce((acc, r) => acc + (r.fullMarks || 0), 0);
    const percentage = totalFull > 0 ? (totalPotential / totalFull) * 100 : 0;
    const submittedCount = w.records.filter((r) => r.status === 'SUBMITTED').length;
    const carriedCount = w.records.filter((r) => r.status === 'CARRIED_FORWARD').length;

    return {
      weekId: w.weekId,
      surveyDate: w.surveyDate,
      formattedDate: formatShortSurveyDate(w.surveyDate),
      totalPotential,
      totalFull,
      percentage: Math.round(percentage * 10) / 10,
      submittedCount,
      carriedCount,
    };
  });

  // Calculate Overall Totals
  const currentTotalPotential = subjects.reduce((sum, s) => sum + (s.potentialMarks || 0), 0);
  const currentTotalFull = subjects.reduce((sum, s) => sum + (s.fullMarks || 0), 0);
  const currentPercentage = currentTotalFull > 0 ? (currentTotalPotential / currentTotalFull) * 100 : 0;

  let previousTotalPotential: number | null = null;
  let previousTotalFull: number | null = null;
  let previousPercentage: number | null = null;

  if (weeklyTrend.length >= 2) {
    const prevTrend = weeklyTrend[weeklyTrend.length - 2];
    previousTotalPotential = prevTrend.totalPotential;
    previousTotalFull = prevTrend.totalFull;
    previousPercentage = prevTrend.percentage;
  } else if (weeklyTrend.length === 1) {
    const firstTrend = weeklyTrend[0];
    if (firstTrend.weekId !== currentCycle.weekId) {
      previousTotalPotential = firstTrend.totalPotential;
      previousTotalFull = firstTrend.totalFull;
      previousPercentage = firstTrend.percentage;
    }
  }

  const totalMarkDifference = previousTotalPotential !== null ? currentTotalPotential - previousTotalPotential : 0;
  const percentagePointDifference = previousPercentage !== null ? currentPercentage - previousPercentage : 0;

  const totalSubmittedAssessments = records.filter((r) => r.status === 'SUBMITTED').length;
  const totalCarriedForwardAssessments = records.filter((r) => r.status === 'CARRIED_FORWARD').length;

  const overall: OverallGrowthStat = {
    currentTotalPotential,
    currentTotalFull,
    currentPercentage: Math.round(currentPercentage * 10) / 10,
    previousTotalPotential,
    previousTotalFull,
    previousPercentage: previousPercentage !== null ? Math.round(previousPercentage * 10) / 10 : null,
    totalMarkDifference,
    percentagePointDifference: Math.round(percentagePointDifference * 10) / 10,
    totalWeeksRecorded: weeklyTrend.length,
    firstSurveyDate: sortedWeeks.length > 0 ? sortedWeeks[0].surveyDate : null,
    latestSurveyDate: sortedWeeks.length > 0 ? sortedWeeks[sortedWeeks.length - 1].surveyDate : null,
    totalSubmittedAssessments,
    totalCarriedForwardAssessments,
    weeklyTrend,
  };

  // 2. Calculate Subject-Wise Growth Statistics
  const subjectStats: SubjectGrowthStat[] = subjects.map((sub) => {
    const subRecords = (recordsBySubject.get(sub.id) || []).slice().sort((a, b) => a.surveyDate.localeCompare(b.surveyDate));

    const currentMark = typeof sub.potentialMarks === 'number' ? sub.potentialMarks : 0;

    // Previous week mark
    let previousMark: number | null = null;
    if (subRecords.length >= 2) {
      previousMark = subRecords[subRecords.length - 2].potentialMarks;
    } else if (subRecords.length === 1 && subRecords[0].weekId !== currentCycle.weekId) {
      previousMark = subRecords[0].potentialMarks;
    }

    const weekDifference = previousMark !== null ? currentMark - previousMark : 0;

    // Highest and lowest recorded marks
    let highestMark = currentMark;
    let lowestMark = currentMark;
    if (subRecords.length > 0) {
      highestMark = Math.max(...subRecords.map((r) => r.potentialMarks));
      lowestMark = Math.min(...subRecords.map((r) => r.potentialMarks));
    }

    // Baseline mark: first recorded mark for this subject
    const baselineMark = subRecords.length > 0 ? subRecords[0].potentialMarks : null;

    // Total growth calculated strictly from actual assessments (not phantom carry-forwards)
    // If baseline exists: currentMark - baselineMark
    const totalGrowth = baselineMark !== null ? currentMark - baselineMark : 0;

    const submittedSurveysCount = subRecords.filter((r) => r.status === 'SUBMITTED').length;
    const carriedForwardCount = subRecords.filter((r) => r.status === 'CARRIED_FORWARD').length;

    // Determine current status in this week's survey cycle
    const currentWeekRecord = subRecords.find((r) => r.weekId === currentCycle.weekId);
    let currentStatus: 'SUBMITTED' | 'CARRIED_FORWARD' | 'PENDING' = 'PENDING';
    if (currentWeekRecord) {
      currentStatus = currentWeekRecord.status;
    }

    return {
      subject: sub,
      currentMark,
      previousMark,
      weekDifference,
      highestMark,
      lowestMark,
      baselineMark,
      totalGrowth,
      submittedSurveysCount,
      carriedForwardCount,
      currentStatus,
      recordsHistory: subRecords,
    };
  });

  return { overall, subjectStats };
}



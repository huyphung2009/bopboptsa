import type { Exam, Question, UserAnswers } from '../types/exam';
import { gradeQuestion } from '../utils/scoring';
import { supabase } from './supabase';

export interface QuestionStatRecord {
  question_id: string;
  exam_id: string;
  total_attempts: number;
  wrong_attempts: number;
  is_bounty_pinned: boolean;
  updated_at?: string;
}

export interface BountyQuestionItem {
  question: Question;
  examId: string;
  examTitle: string;
  totalAttempts: number;
  wrongAttempts: number;
  wrongRate: number; // 0..100
  isPinned: boolean;
  solutionsCount: number;
}

export interface BountySolutionRecord {
  id: string;
  question_id: string;
  user_id: string;
  author_name: string;
  author_xp: number;
  content: string;
  upvotes_count: number;
  is_pinned: boolean;
  created_at: string;
}

const LOCAL_STATS_KEY = 'parabol_question_stats_v1';
const LOCAL_SOLUTIONS_KEY = 'parabol_bounty_solutions_v1';
const LOCAL_VOTES_KEY = 'parabol_bounty_votes_v1';

function readLocalStats(): Record<string, QuestionStatRecord> {
  try {
    const raw = localStorage.getItem(LOCAL_STATS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, QuestionStatRecord>) : {};
  } catch {
    return {};
  }
}

function writeLocalStats(map: Record<string, QuestionStatRecord>): void {
  try {
    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function readLocalSolutions(): BountySolutionRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_SOLUTIONS_KEY);
    return raw ? (JSON.parse(raw) as BountySolutionRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalSolutions(items: BountySolutionRecord[]): void {
  try {
    localStorage.setItem(LOCAL_SOLUTIONS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function readLocalVotes(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(LOCAL_VOTES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function writeLocalVotes(map: Record<string, string[]>): void {
  try {
    localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export async function recordQuestionStats(params: {
  exam: Exam;
  answers: UserAnswers;
  targetSectionId?: string;
}): Promise<void> {
  const { exam, answers, targetSectionId } = params;
  const targetQuestions = targetSectionId
    ? exam.questions.filter(
        (q) => q.sectionId === targetSectionId || q.section === targetSectionId
      )
    : exam.questions;

  if (targetQuestions.length === 0) return;

  const localMap = readLocalStats();
  const questionIds = targetQuestions.map((q) => q.id);

  // Fetch existing stats from Supabase if available
  let remoteMap: Record<string, QuestionStatRecord> = {};
  try {
    const { data, error } = await supabase
      .from('question_stats')
      .select('*')
      .in('question_id', questionIds);
    if (!error && data) {
      for (const row of data as QuestionStatRecord[]) {
        remoteMap[row.question_id] = row;
      }
    }
  } catch {
    // fallback to local
  }

  const upsertRows: QuestionStatRecord[] = targetQuestions.map((q) => {
    const graded = gradeQuestion(q, answers[q.id]);
    const prev = remoteMap[q.id] ?? localMap[q.id];
    const next: QuestionStatRecord = {
      question_id: q.id,
      exam_id: exam.id,
      total_attempts: Number(prev?.total_attempts ?? 0) + 1,
      wrong_attempts:
        Number(prev?.wrong_attempts ?? 0) + (graded.isFullCorrect ? 0 : 1),
      is_bounty_pinned: Boolean(prev?.is_bounty_pinned),
      updated_at: new Date().toISOString(),
    };
    localMap[q.id] = next;
    return next;
  });

  writeLocalStats(localMap);

  try {
    await supabase
      .from('question_stats')
      .upsert(upsertRows, { onConflict: 'question_id' });
  } catch {
    // non-fatal
  }
}

export async function fetchBountyQuestions(
  exams: Exam[]
): Promise<BountyQuestionItem[]> {
  const statsMap: Record<string, QuestionStatRecord> = { ...readLocalStats() };
  const solutionCounts: Record<string, number> = {};

  for (const sol of readLocalSolutions()) {
    solutionCounts[sol.question_id] = (solutionCounts[sol.question_id] ?? 0) + 1;
  }

  try {
    const [statsRes, solsRes] = await Promise.all([
      supabase.from('question_stats').select('*'),
      supabase.from('bounty_solutions').select('question_id'),
    ]);

    if (!statsRes.error && statsRes.data) {
      for (const row of statsRes.data as QuestionStatRecord[]) {
        statsMap[row.question_id] = row;
      }
    }
    if (!solsRes.error && solsRes.data) {
      const remoteCounts: Record<string, number> = {};
      for (const row of solsRes.data as { question_id: string }[]) {
        remoteCounts[row.question_id] = (remoteCounts[row.question_id] ?? 0) + 1;
      }
      Object.assign(solutionCounts, remoteCounts);
    }
  } catch {
    // use local fallback
  }

  const items: BountyQuestionItem[] = [];

  for (const exam of exams) {
    for (const q of exam.questions) {
      const stat = statsMap[q.id];
      const total = Number(stat?.total_attempts ?? 0);
      const wrong = Number(stat?.wrong_attempts ?? 0);
      const isPinned = Boolean(stat?.is_bounty_pinned);
      const wrongRate = total > 0 ? Math.round((wrong / total) * 100) : 0;

      const qualifiesAuto = total >= 5 && wrong / total >= 0.7;
      if (qualifiesAuto || isPinned) {
        items.push({
          question: q,
          examId: exam.id,
          examTitle: exam.title,
          totalAttempts: total,
          wrongAttempts: wrong,
          wrongRate: isPinned && total === 0 ? 75 : wrongRate,
          isPinned,
          solutionsCount: solutionCounts[q.id] ?? 0,
        });
      }
    }
  }

  return items.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.wrongRate - a.wrongRate;
  });
}

export async function toggleBountyPinQuestion(params: {
  questionId: string;
  examId: string;
  pinned: boolean;
}): Promise<void> {
  const localMap = readLocalStats();
  const prev = localMap[params.questionId];
  const updated: QuestionStatRecord = {
    question_id: params.questionId,
    exam_id: params.examId,
    total_attempts: Number(prev?.total_attempts ?? 0),
    wrong_attempts: Number(prev?.wrong_attempts ?? 0),
    is_bounty_pinned: params.pinned,
    updated_at: new Date().toISOString(),
  };
  localMap[params.questionId] = updated;
  writeLocalStats(localMap);

  try {
    await supabase
      .from('question_stats')
      .upsert([updated], { onConflict: 'question_id' });
  } catch {
    // ignore
  }
}

export async function fetchBountySolutions(
  questionId: string,
  currentUserId?: string
): Promise<{
  solutions: BountySolutionRecord[];
  votedSolutionIds: Set<string>;
}> {
  const localSolutions = readLocalSolutions().filter(
    (s) => s.question_id === questionId
  );
  const localVotes = readLocalVotes();
  const votedSet = new Set<string>(
    currentUserId ? localVotes[currentUserId] ?? [] : []
  );

  try {
    const { data, error } = await supabase
      .from('bounty_solutions')
      .select('*')
      .eq('question_id', questionId)
      .order('is_pinned', { ascending: false })
      .order('upvotes_count', { ascending: false })
      .order('created_at', { ascending: true });

    if (!error && data) {
      const solutions = data as BountySolutionRecord[];
      if (currentUserId && solutions.length > 0) {
        const solIds = solutions.map((s) => s.id);
        const { data: votesData } = await supabase
          .from('bounty_votes')
          .select('solution_id')
          .eq('user_id', currentUserId)
          .in('solution_id', solIds);
        if (votesData) {
          votedSet.clear();
          for (const v of votesData as { solution_id: string }[]) {
            votedSet.add(v.solution_id);
          }
        }
      }
      return { solutions, votedSolutionIds: votedSet };
    }
  } catch {
    // fallback
  }

  localSolutions.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return b.upvotes_count - a.upvotes_count;
  });
  return { solutions: localSolutions, votedSolutionIds: votedSet };
}

export async function fetchTopCommunitySolutionsMap(
  questionIds: string[]
): Promise<Record<string, BountySolutionRecord>> {
  if (questionIds.length === 0) return {};
  const result: Record<string, BountySolutionRecord> = {};

  for (const sol of readLocalSolutions()) {
    if (!questionIds.includes(sol.question_id)) continue;
    const cur = result[sol.question_id];
    if (
      !cur ||
      (sol.is_pinned && !cur.is_pinned) ||
      (sol.is_pinned === cur.is_pinned && sol.upvotes_count > cur.upvotes_count)
    ) {
      result[sol.question_id] = sol;
    }
  }

  try {
    const { data, error } = await supabase
      .from('bounty_solutions')
      .select('*')
      .in('question_id', questionIds)
      .order('is_pinned', { ascending: false })
      .order('upvotes_count', { ascending: false });

    if (!error && data) {
      for (const sol of data as BountySolutionRecord[]) {
        if (!result[sol.question_id]) {
          result[sol.question_id] = sol;
        }
      }
    }
  } catch {
    // ignore
  }

  return result;
}

export async function submitBountySolution(params: {
  questionId: string;
  userId: string;
  authorName: string;
  authorXp: number;
  content: string;
}): Promise<BountySolutionRecord> {
  const localItem: BountySolutionRecord = {
    id: crypto.randomUUID(),
    question_id: params.questionId,
    user_id: params.userId,
    author_name: params.authorName,
    author_xp: params.authorXp,
    content: params.content,
    upvotes_count: 0,
    is_pinned: false,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('bounty_solutions')
      .insert([
        {
          question_id: params.questionId,
          user_id: params.userId,
          author_name: params.authorName,
          author_xp: params.authorXp,
          content: params.content,
          upvotes_count: 0,
          is_pinned: false,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      return data as BountySolutionRecord;
    }
  } catch {
    // fallback to local
  }

  const allLocal = readLocalSolutions();
  writeLocalSolutions([localItem, ...allLocal]);
  return localItem;
}

export async function toggleBountyVote(params: {
  solution: BountySolutionRecord;
  userId: string;
  currentlyVoted: boolean;
}): Promise<{ newCount: number; voted: boolean }> {
  const { solution, userId, currentlyVoted } = params;
  const nextVoted = !currentlyVoted;
  const nextCount = Math.max(0, solution.upvotes_count + (nextVoted ? 1 : -1));

  // Update local fallback
  const votesMap = readLocalVotes();
  const userVotes = new Set(votesMap[userId] ?? []);
  if (nextVoted) userVotes.add(solution.id);
  else userVotes.delete(solution.id);
  votesMap[userId] = Array.from(userVotes);
  writeLocalVotes(votesMap);

  const localSols = readLocalSolutions().map((s) =>
    s.id === solution.id ? { ...s, upvotes_count: nextCount } : s
  );
  writeLocalSolutions(localSols);

  try {
    if (nextVoted) {
      await supabase
        .from('bounty_votes')
        .insert([{ solution_id: solution.id, user_id: userId }]);
    } else {
      await supabase
        .from('bounty_votes')
        .delete()
        .eq('solution_id', solution.id)
        .eq('user_id', userId);
    }

    await supabase
      .from('bounty_solutions')
      .update({ upvotes_count: nextCount })
      .eq('id', solution.id);
  } catch {
    // fallback handled above
  }

  return { newCount: nextCount, voted: nextVoted };
}

export async function pinBountySolution(params: {
  solutionId: string;
  questionId: string;
  pinned: boolean;
}): Promise<void> {
  const localSols = readLocalSolutions().map((s) =>
    s.question_id === params.questionId
      ? { ...s, is_pinned: s.id === params.solutionId ? params.pinned : false }
      : s
  );
  writeLocalSolutions(localSols);

  try {
    if (params.pinned) {
      await supabase
        .from('bounty_solutions')
        .update({ is_pinned: false })
        .eq('question_id', params.questionId);
    }
    await supabase
      .from('bounty_solutions')
      .update({ is_pinned: params.pinned })
      .eq('id', params.solutionId);
  } catch {
    // ignore
  }
}

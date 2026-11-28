import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Award,
  CheckCircle2,
  Eye,
  Flame,
  Pin,
  Send,
  ThumbsUp,
  Trophy,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchBountySolutions,
  pinBountySolution,
  submitBountySolution,
  toggleBountyVote,
  type BountyQuestionItem,
  type BountySolutionRecord,
} from '../lib/bountyService';
import type { UserProfile } from '../lib/profileService';
import { MathText } from './MathText';
import { RankBadge } from './RankBadge';

interface BountyDetailModalProps {
  item: BountyQuestionItem | null;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  isSuperAdmin: boolean;
  onClose: () => void;
  onRequireAuth: (notice: string) => void;
  onSolutionChanged: () => void;
}

export const BountyDetailModal: React.FC<BountyDetailModalProps> = ({
  item,
  user,
  profile,
  isSuperAdmin,
  onClose,
  onRequireAuth,
  onSolutionChanged,
}) => {
  const [solutions, setSolutions] = useState<BountySolutionRecord[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [draft, setDraft] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadSolutions = useCallback(async () => {
    if (!item) return;
    setLoading(true);
    const res = await fetchBountySolutions(item.question.id, user?.id);
    setSolutions(res.solutions);
    setVotedIds(res.votedSolutionIds);
    setLoading(false);
  }, [item, user?.id]);

  useEffect(() => {
    if (!item) return;
    setDraft('');
    setShowPreview(false);
    void loadSolutions();
  }, [item, loadSolutions]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth('Vui lòng đăng nhập để đóng góp lời giải cộng đồng.');
      return;
    }
    if (!draft.trim()) return;
    setSubmitting(true);
    const authorName =
      profile?.full_name ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split('@')[0] ||
      'Thí sinh Parabol';

    await submitBountySolution({
      questionId: item.question.id,
      userId: user.id,
      authorName,
      authorXp: profile?.xp ?? 0,
      content: draft.trim(),
    });

    setDraft('');
    setShowPreview(false);
    setSubmitting(false);
    await loadSolutions();
    onSolutionChanged();
  };

  const handleVote = async (sol: BountySolutionRecord) => {
    if (!user) {
      onRequireAuth('Vui lòng đăng nhập để bình chọn lời giải hữu ích.');
      return;
    }
    const currentlyVoted = votedIds.has(sol.id);
    const res = await toggleBountyVote({
      solution: sol,
      userId: user.id,
      currentlyVoted,
    });
    setSolutions((prev) =>
      prev
        .map((s) =>
          s.id === sol.id ? { ...s, upvotes_count: res.newCount } : s
        )
        .sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return b.upvotes_count - a.upvotes_count;
        })
    );
    setVotedIds((prev) => {
      const next = new Set(prev);
      if (res.voted) next.add(sol.id);
      else next.delete(sol.id);
      return next;
    });
  };

  const handlePin = async (sol: BountySolutionRecord) => {
    if (!isSuperAdmin) return;
    await pinBountySolution({
      solutionId: sol.id,
      questionId: item.question.id,
      pinned: !sol.is_pinned,
    });
    await loadSolutions();
  };

  // Top solution index (either pinned or highest votes > 0)
  const topSolutionId =
    solutions.find((s) => s.is_pinned)?.id ??
    (solutions[0] && solutions[0].upvotes_count > 0 ? solutions[0].id : null);

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-[#261118]/45 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded-[26px] border border-[var(--line)] bg-white/95 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-gradient-to-r from-[#fff5f6] via-white to-[#ffeff1]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-crimson text-white px-3 py-1 text-[11px] font-bold shrink-0">
              <Flame className="w-3.5 h-3.5" />
              {item.wrongRate}% thí sinh gục ngã
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#2a161b] truncate">
                {item.examTitle}
              </h3>
              <p className="text-[11px] text-[#876870]">
                Phần thi: {item.question.section} · Thưởng +200 XP &amp; Danh hiệu Thợ Săn Câu Khó
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] transition-colors cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 max-h-[78vh] overflow-y-auto custom-scrollbar space-y-6">
          {/* Question Body */}
          <div className="rounded-2xl border border-crimson/20 bg-[#fff9fa] p-5 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-crimson">
              Nội dung câu hỏi bị truy nã
            </div>
            <div className="text-sm sm:text-[15px] text-[#2a161b] leading-relaxed">
              <MathText text={item.question.prompt} />
            </div>

            {(item.question.type === 'single_choice' ||
              item.question.type === 'multiple_choice_multi') &&
              item.question.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {item.question.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs text-[#2a161b]"
                  >
                    <span className="font-bold text-crimson mr-1.5">{opt.id}.</span>
                    <MathText text={opt.text} />
                  </div>
                ))}
              </div>
            )}

            {item.question.explanation && (
              <div className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3.5 text-xs text-[#5e4249] leading-relaxed">
                <span className="font-bold text-crimson uppercase tracking-wider block mb-1">
                  Lời giải tham khảo
                </span>
                <MathText text={item.question.explanation} />
              </div>
            )}
          </div>

          {/* Community Solutions Editor */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-[#2a161b] flex items-center gap-2">
                <Award className="w-4 h-4 text-crimson" />
                Đóng góp lời giải của bạn (hỗ trợ LaTeX $...$, $$...$$)
              </h4>
              <button
                type="button"
                onClick={() => setShowPreview((p) => !p)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[#fff5f6] px-3 py-1 text-xs font-semibold text-crimson hover:bg-[#ffeff1] transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                {showPreview ? 'Ẩn xem trước' : 'Xem trước (Preview KaTeX)'}
              </button>
            </div>

            <div className={`grid gap-3 ${showPreview ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
              <textarea
                rows={4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Nhập lời giải ngắn gọn, dễ hiểu... Ví dụ: Ta có $\Delta = b^2 - 4ac > 0$ nên phương trình có 2 nghiệm phân biệt."
                className="w-full rounded-2xl border border-[var(--line)] bg-white p-3.5 text-sm text-[#2a161b] focus:border-crimson focus:ring-2 focus:ring-crimson/15 focus:outline-none"
              />
              {showPreview && (
                <div className="rounded-2xl border border-dashed border-crimson/35 bg-[#fff9fa] p-3.5 text-sm text-[#2a161b] overflow-y-auto max-h-[140px]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-crimson mb-1">
                    Xem trước KaTeX
                  </div>
                  {draft.trim() ? (
                    <MathText text={draft} />
                  ) : (
                    <span className="text-xs text-[#876870]">
                      Nhập công thức bên trái để xem trước...
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !draft.trim()}
                className="btn btn-crimson btn-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Đang đăng...' : 'Đăng lời giải'}
              </button>
            </div>
          </form>

          {/* Community Solutions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[#876870]">
                Lời giải từ cộng đồng ({solutions.length})
              </h4>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-[#876870]">
                Đang tải lời giải cộng đồng...
              </div>
            ) : solutions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[#fff9fa] p-6 text-center text-xs text-[#876870]">
                Chưa có lời giải nào từ cộng đồng. Hãy là người đầu tiên phá giải câu hỏi này để nhận +200 XP!
              </div>
            ) : (
              solutions.map((sol) => {
                const isTop = sol.id === topSolutionId;
                const voted = votedIds.has(sol.id);

                return (
                  <div
                    key={sol.id}
                    className={`rounded-2xl border p-4 space-y-3 transition-all ${
                      isTop
                        ? 'border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-[#fff6f7] shadow-xs'
                        : 'border-[var(--line)] bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#2a161b]">
                          {sol.author_name}
                        </span>
                        <RankBadge xp={sol.author_xp} />
                        {isTop && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-900">
                            <Trophy className="w-3 h-3 text-amber-600" />
                            🏆 Lời giải ngắn gọn nhất
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handlePin(sol)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors cursor-pointer ${
                              sol.is_pinned
                                ? 'bg-crimson text-white border-crimson'
                                : 'bg-white text-[#5e4249] border-[var(--line)] hover:border-crimson hover:text-crimson'
                            }`}
                          >
                            <Pin className="w-3 h-3" />
                            {sol.is_pinned ? 'Đã duyệt' : 'Duyệt hay nhất'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleVote(sol)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                            voted
                              ? 'bg-crimson text-white border-crimson shadow-xs'
                              : 'bg-[#fff6f7] text-[#5e4249] border-[var(--line)] hover:border-crimson hover:text-crimson'
                          }`}
                        >
                          {voted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <ThumbsUp className="w-3.5 h-3.5" />
                          )}
                          <span>Hữu ích ({sol.upvotes_count})</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-[#2a161b] leading-relaxed">
                      <MathText text={sol.content} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

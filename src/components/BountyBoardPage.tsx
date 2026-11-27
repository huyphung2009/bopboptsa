import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  ArrowLeft,
  Flame,
  MessageSquare,
  Pin,
  Plus,
  Skull,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchBountyQuestions,
  toggleBountyPinQuestion,
  type BountyQuestionItem,
} from '../lib/bountyService';
import type { UserProfile } from '../lib/profileService';
import type { Exam } from '../types/exam';
import { BountyDetailModal } from './BountyDetailModal';
import { MathText } from './MathText';

interface BountyBoardPageProps {
  exams: Exam[];
  user: SupabaseUser | null;
  profile: UserProfile | null;
  isSuperAdmin: boolean;
  onBackHome: () => void;
  onRequireAuth: (notice: string) => void;
}

type SectionFilter =
  | 'ALL'
  | 'Tư duy Toán học'
  | 'Tư duy Đọc hiểu'
  | 'Tư duy Khoa học';

const SECTION_FILTERS: SectionFilter[] = [
  'ALL',
  'Tư duy Toán học',
  'Tư duy Đọc hiểu',
  'Tư duy Khoa học',
];

export const BountyBoardPage: React.FC<BountyBoardPageProps> = ({
  exams,
  user,
  profile,
  isSuperAdmin,
  onBackHome,
  onRequireAuth,
}) => {
  const [items, setItems] = useState<BountyQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('ALL');
  const [selectedItem, setSelectedItem] = useState<BountyQuestionItem | null>(null);
  const [pinPickerOpen, setPinPickerOpen] = useState(false);

  const loadBounties = useCallback(async () => {
    setLoading(true);
    const list = await fetchBountyQuestions(exams);
    setItems(list);
    setLoading(false);
  }, [exams]);

  useEffect(() => {
    void loadBounties();
  }, [loadBounties]);

  const filteredItems = useMemo(() => {
    if (sectionFilter === 'ALL') return items;
    return items.filter((item) =>
      item.question.section.toLowerCase().includes(sectionFilter.toLowerCase())
    );
  }, [items, sectionFilter]);

  return (
    <div className="min-h-screen bg-[#fffafb] text-[#2a161b]">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackHome}
            className="btn btn-pill btn-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-crimson" />
            Quay lại Trang chủ
          </button>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setPinPickerOpen(true)}
                className="btn btn-crimson btn-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Ghim câu khó thủ công
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Wanted Board Banner */}
        <section className="rounded-[28px] border-2 border-crimson/25 bg-gradient-to-br from-[#fff5f6] via-white to-[#ffeff1] p-6 sm:p-8 shadow-[0_24px_60px_-28px_rgba(220,38,62,0.3)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-crimson text-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest">
                <Skull className="w-3.5 h-3.5" />
                LỆNH TRUY NÃ CÂU KHÓ · COMMUNITY BOUNTY
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2a161b]">
                Bảng Truy Nã Câu Hỏi Tỷ Lệ Sai Cao (&ge; 70%)
              </h1>
              <p className="text-sm text-[#5e4249] leading-relaxed">
                Hệ thống tự động điểm mặt các câu hỏi khiến trên 70% thí sinh gục ngã. Đóng góp lời giải súc tích kèm công thức KaTeX để nhận{' '}
                <strong className="text-crimson">+200 XP &amp; Danh hiệu Thợ Săn Câu Khó</strong>!
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-2xl border border-crimson/20 bg-white px-5 py-3 text-center shadow-xs">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#876870]">
                  Đang truy nã
                </div>
                <div className="text-2xl font-bold font-mono text-crimson mt-0.5">
                  {items.length} câu
                </div>
              </div>
            </div>
          </div>

          {/* Section Filter Pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {SECTION_FILTERS.map((sec) => {
              const active = sectionFilter === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSectionFilter(sec)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-crimson text-white border-crimson shadow-xs'
                      : 'bg-white text-[#5e4249] border-[var(--line)] hover:border-crimson/40 hover:text-crimson'
                  }`}
                >
                  {sec === 'ALL' ? 'Tất cả phần thi' : sec}
                </button>
              );
            })}
          </div>
        </section>

        {/* Wanted Cards Grid */}
        {loading ? (
          <div className="py-16 text-center text-sm text-[#876870]">
            Đang quét dữ liệu truy nã câu khó...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--line)] bg-white p-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-crimson mx-auto" />
            <h3 className="text-base font-bold text-[#2a161b]">
              Chưa có câu hỏi nào bị truy nã ở mục này
            </h3>
            <p className="text-xs text-[#876870] max-w-md mx-auto">
              Câu hỏi có từ 5 lượt làm bài trở lên với tỷ lệ sai &ge; 70% sẽ tự động xuất hiện tại đây (hoặc Super Admin có thể ghim thủ công).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredItems.map((item) => {
              const isRankS = item.wrongRate >= 80;
              return (
                <article
                  key={item.question.id}
                  onClick={() => setSelectedItem(item)}
                  className="group rounded-[24px] border-2 border-crimson/20 bg-white hover:border-crimson/55 hover:shadow-[0_20px_45px_-20px_rgba(220,38,62,0.3)] transition-all p-5 flex flex-col justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Wanted Poster Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-dashed border-crimson/20">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                          isRankS
                            ? 'bg-crimson text-white'
                            : 'bg-[#ffeff1] text-crimson border border-crimson/25'
                        }`}
                      >
                        {isRankS ? (
                          <>
                            <Skull className="w-3.5 h-3.5" />
                            ☠️ Truy nã cấp S · {item.wrongRate}% sai
                          </>
                        ) : (
                          <>
                            <Flame className="w-3.5 h-3.5" />
                            🔥 {item.wrongRate}% thí sinh gục ngã
                          </>
                        )}
                      </span>

                      <span className="rounded-full bg-[#fff5f6] border border-[var(--line)] px-2.5 py-0.5 text-[11px] font-medium text-[#5e4249]">
                        {item.question.section}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium text-[#876870] truncate">
                      Đề: {item.examTitle}
                    </div>

                    {/* Question Preview */}
                    <div className="text-sm text-[#2a161b] leading-relaxed line-clamp-4">
                      <MathText text={item.question.prompt} />
                    </div>
                  </div>

                  {/* Wanted Card Footer */}
                  <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 text-[11px]">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      +200 XP &amp; Thợ Săn Câu Khó
                    </span>

                    <span className="inline-flex items-center gap-1.5 font-semibold text-crimson group-hover:underline">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {item.solutionsCount} lời giải cộng đồng
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail & Community Solutions Modal */}
      <BountyDetailModal
        item={selectedItem}
        user={user}
        profile={profile}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setSelectedItem(null)}
        onRequireAuth={onRequireAuth}
        onSolutionChanged={() => void loadBounties()}
      />

      {/* Super Admin Manual Pin Picker */}
      {isSuperAdmin && pinPickerOpen && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-[#261118]/45 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPinPickerOpen(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-[26px] border border-[var(--line)] bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[#fff5f6]">
              <h3 className="text-base font-bold text-[#2a161b]">
                Ghim câu hỏi lên Bảng Truy Nã (Super Admin)
              </h3>
              <button
                type="button"
                onClick={() => setPinPickerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-[#876870] hover:text-crimson cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
              {exams.map((ex) => (
                <div key={ex.id} className="space-y-2">
                  <div className="text-xs font-bold text-crimson uppercase tracking-wider">
                    {ex.title}
                  </div>
                  {ex.questions.slice(0, 10).map((q, idx) => {
                    const pinned = items.some(
                      (it) => it.question.id === q.id && it.isPinned
                    );
                    return (
                      <div
                        key={q.id}
                        className="rounded-xl border border-[var(--line)] p-3 flex items-center justify-between gap-3"
                      >
                        <div className="text-xs text-[#2a161b] line-clamp-2 flex-1">
                          <span className="font-bold mr-1">Câu {idx + 1}:</span>
                          {q.prompt}
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await toggleBountyPinQuestion({
                              questionId: q.id,
                              examId: ex.id,
                              pinned: !pinned,
                            });
                            await loadBounties();
                          }}
                          className={`btn btn-sm shrink-0 ${
                            pinned ? 'btn-crimson' : 'btn-pill'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                          {pinned ? 'Bỏ ghim' : 'Ghim truy nã'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

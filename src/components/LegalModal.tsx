import { FileText, ShieldCheck, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export type LegalTab = 'terms' | 'privacy';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="relative w-full max-w-xl rounded-[26px] border border-[var(--line)] bg-white/98 dark:bg-[#1b0d13]/98 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[#fff5f6]/70 dark:bg-[#241219]/80">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-crimson/10 text-crimson">
              {activeTab === 'terms' ? (
                <FileText className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </span>
            <div>
              <h2
                id="legal-modal-title"
                className="text-base font-bold text-[#2a161b] dark:text-[#fff2f4]"
              >
                Điều khoản &amp; Chính sách Parabol
              </h2>
              <p className="text-[11px] text-[#876870] dark:text-[#b88c95]">
                Cập nhật thông tin minh bạch dành cho thí sinh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#876870] hover:text-crimson hover:bg-[#fff2f4] dark:hover:bg-[#2b141d] transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 rounded-full bg-[#fff5f6] dark:bg-[#241219] border border-[var(--line)] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`rounded-full py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-crimson text-white shadow-xs'
                  : 'text-[#876870] dark:text-[#c49ba3] hover:text-crimson'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Điều khoản sử dụng
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`rounded-full py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-crimson text-white shadow-xs'
                  : 'text-[#876870] dark:text-[#c49ba3] hover:text-crimson'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Chính sách bảo mật
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4 text-sm leading-relaxed text-[#42272f] dark:text-[#ebd7dc]">
          {activeTab === 'terms' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--line)] bg-[#fff9fa] dark:bg-[#221017] p-4">
                <h3 className="font-bold text-[#2a161b] dark:text-[#fff2f4] mb-1.5">
                  1. Mục đích hoạt động &amp; Miễn trừ trách nhiệm
                </h3>
                <p>
                  Parabol là nền tảng luyện thi trực tuyến phi thương mại hỗ trợ ôn tập TSA, HSA, V-ACT và THPT Quốc gia. Dự án hoạt động độc lập, không trực thuộc bất kỳ trường đại học hay tổ chức khảo thí nào; điểm số chỉ mang tính chất tham khảo.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[#fff9fa] dark:bg-[#221017] p-4">
                <h3 className="font-bold text-[#2a161b] dark:text-[#fff2f4] mb-1.5">
                  2. Bản quyền &amp; Nội dung đề thi
                </h3>
                <p>
                  Các đề thi và lời giải được tổng hợp phục vụ mục đích học tập phi lợi nhuận. Nếu bạn là chủ sở hữu bản quyền và yêu cầu gỡ bỏ, chúng tôi cam kết xóa ngay trong vòng 24–48 giờ sau khi xác minh.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[#fff9fa] dark:bg-[#221017] p-4">
                <h3 className="font-bold text-[#2a161b] dark:text-[#fff2f4] mb-1.5">
                  3. Quy định tài khoản &amp; Quy chế phòng thi
                </h3>
                <p>
                  Người dùng tự bảo mật tài khoản, không dùng tên phản cảm, không gian lận kỹ thuật. Các lượt thi vi phạm quy chế (chuyển tab, thoát toàn màn hình quá quy định) sẽ không được tính trên Bảng xếp hạng.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--line)] bg-[#fff9fa] dark:bg-[#221017] p-4">
                <h3 className="font-bold text-[#2a161b] dark:text-[#fff2f4] mb-1.5">
                  1. Dữ liệu thu thập
                </h3>
                <p>
                  Chỉ lưu Tên hiển thị, Email, ảnh đại diện (nếu đăng nhập Google) và dữ liệu học tập (lịch sử thi, điểm số, XP, mục tiêu nguyện vọng).
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[#fff9fa] dark:bg-[#221017] p-4">
                <h3 className="font-bold text-[#2a161b] dark:text-[#fff2f4] mb-1.5">
                  2. Mục đích sử dụng
                </h3>
                <p>
                  Đồng bộ lịch sử làm bài và hiển thị trên Bảng xếp hạng công khai (tuyệt đối không công khai Email của người dùng).
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[#fff9fa] dark:bg-[#221017] p-4">
                <h3 className="font-bold text-[#2a161b] dark:text-[#fff2f4] mb-1.5">
                  3. Bảo mật dữ liệu
                </h3>
                <p>
                  Dữ liệu được lưu trữ an toàn và mã hóa trên hệ thống Supabase. Parabol cam kết không bán hay chia sẻ thông tin cá nhân cho bên thứ ba.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[#fff9fa] dark:bg-[#221017] p-4">
                <h3 className="font-bold text-[#2a161b] dark:text-[#fff2f4] mb-1.5">
                  4. Quyền của người dùng
                </h3>
                <p>
                  Bạn có quyền yêu cầu xóa vĩnh viễn tài khoản và toàn bộ dữ liệu bất cứ lúc nào qua email liên hệ:{' '}
                  <a
                    href="mailto:kienphung15101981@gmail.com"
                    className="text-crimson font-semibold hover:underline"
                  >
                    kienphung15101981@gmail.com
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--line)] bg-[#fff5f6]/50 dark:bg-[#241219]/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-crimson !px-5 !py-2 text-xs font-semibold"
          >
            Tôi đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

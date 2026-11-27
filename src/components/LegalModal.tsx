import { X } from 'lucide-react';
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-lg border border-neutral-300 bg-white text-neutral-800 shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
          <h2
            id="legal-modal-title"
            className="text-base font-bold text-neutral-950 tracking-tight"
          >
            Văn bản Pháp lý &amp; Quy định sử dụng Parabol
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plain Document Tabs */}
        <div className="flex border-b border-neutral-200 px-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`py-3 mr-6 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'terms'
                ? 'border-neutral-900 text-neutral-950'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Điều khoản sử dụng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-3 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-neutral-900 text-neutral-950'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Chính sách bảo mật
          </button>
        </div>

        {/* Scrollable Plain Document Body */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto bg-white text-[13.5px] leading-relaxed text-neutral-700 text-justify space-y-4">
          {activeTab === 'terms' ? (
            <>
              <div className="space-y-1.5">
                <p className="text-center font-bold text-sm text-neutral-950 uppercase tracking-wide">
                  ĐIỀU KHOẢN SỬ DỤNG VÀ MIỄN TRỪ TRÁCH NHIỆM
                </p>
                <p className="text-center text-xs text-neutral-500">
                  Áp dụng đối với toàn bộ người dùng truy cập và sử dụng hệ thống luyện thi trực tuyến Parabol.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-neutral-950">
                  Điều 1. Mục đích hoạt động và Miễn trừ trách nhiệm tuyệt đối
                </h3>
                <p>
                  <span className="font-semibold text-neutral-900">1.1.</span> Parabol là nền tảng luyện thi trực tuyến hoạt động theo mô hình phi thương mại, được xây dựng nhằm hỗ trợ học sinh ôn tập và làm quen với cấu trúc các kỳ thi Đánh giá tư duy (TSA), Đánh giá năng lực (HSA, V-ACT) và Kỳ thi Tốt nghiệp Trung học Phổ thông Quốc gia.
                </p>
                <p>
                  <span className="font-semibold text-neutral-900">1.2.</span> Dự án hoạt động hoàn toàn độc lập, không trực thuộc, không liên kết, không được ủy quyền hay đại diện cho bất kỳ trường đại học, sở giáo dục, bộ ban ngành hoặc tổ chức khảo thí chính thức nào. Mọi điểm số, bảng xếp hạng, phân tích năng lực hay thông số đếm ngược mục tiêu hiển thị trên hệ thống chỉ mang tính chất tham khảo nội bộ, hoàn toàn không có giá trị quy đổi, bảo đảm hoặc thay thế cho kết quả thi tuyển chính thức.
                </p>
                <p>
                  <span className="font-semibold text-neutral-900">1.3.</span> Ban quản trị Parabol được miễn trừ trách nhiệm tuyệt đối đối với mọi thiệt hại trực tiếp hoặc gián tiếp phát sinh từ việc người dùng sử dụng tài liệu ôn tập, lỗi hiển thị kỹ thuật ngoài ý muốn, sự gián đoạn đường truyền mạng hoặc việc người dùng sử dụng kết quả thi thử để đưa ra các quyết định đăng ký nguyện vọng xét tuyển.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-neutral-950">
                  Điều 2. Bản quyền và Nội dung đề thi
                </h3>
                <p>
                  <span className="font-semibold text-neutral-900">2.1.</span> Các bộ đề thi thử, câu hỏi luyện tập và hướng dẫn giải chi tiết trên Parabol được sưu tầm, biên soạn và tổng hợp thuần túy phục vụ mục đích học tập, tự rèn luyện kiến thức phi lợi nhuận của cộng đồng học sinh.
                </p>
                <p>
                  <span className="font-semibold text-neutral-900">2.2.</span> Chúng tôi luôn tôn trọng quyền sở hữu trí tuệ của các tác giả và đơn vị xuất bản. Trong trường hợp cá nhân hoặc tổ chức là chủ sở hữu hợp pháp của bất kỳ nội dung nào được đăng tải trên hệ thống có yêu cầu gỡ bỏ, xin vui lòng liên hệ trực tiếp qua email quản trị; Parabol cam kết xác minh và xóa bỏ hoàn toàn nội dung liên quan trong thời hạn từ 24 đến 48 giờ làm việc.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-neutral-950">
                  Điều 3. Quy định tài khoản và Quy chế phòng thi trực tuyến
                </h3>
                <p>
                  <span className="font-semibold text-neutral-900">3.1.</span> Người dùng có trách nhiệm tự bảo mật thông tin đăng nhập, mật khẩu và toàn bộ hoạt động phát sinh dưới tài khoản của mình. Tên hiển thị trên hệ thống không được chứa ngôn từ thô tục, phản cảm, công kích cá nhân hoặc mạo danh tổ chức, cơ quan nhà nước.
                </p>
                <p>
                  <span className="font-semibold text-neutral-900">3.2.</span> Khi tham gia chế độ thi thử tính giờ, thí sinh phải tuân thủ nghiêm túc quy chế trung thực, tuyệt đối không sử dụng công cụ can thiệp kỹ thuật, phần mềm tự động hoặc hành vi gian lận. Các lượt thi ghi nhận vi phạm quy chế phòng thi (bao gồm nhưng không giới hạn ở việc chuyển đổi thẻ trình duyệt, thoát chế độ toàn màn hình vượt quá số lần cho phép) sẽ bị hệ thống tự động đánh dấu không hợp lệ và loại bỏ hoàn toàn khỏi Bảng xếp hạng công khai.
                </p>
              </section>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <p className="text-center font-bold text-sm text-neutral-950 uppercase tracking-wide">
                  CHÍNH SÁCH BẢO MẬT THÔNG TIN NGƯỜI DÙNG
                </p>
                <p className="text-center text-xs text-neutral-500">
                  Cam kết về giới hạn thu thập, lưu trữ và bảo vệ dữ liệu cá nhân trên hệ thống Parabol.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-neutral-950">
                  Điều 1. Phạm vi dữ liệu thu thập và Cam kết không thu thập dữ liệu nhạy cảm
                </h3>
                <p>
                  <span className="font-semibold text-neutral-900">1.1.</span> Để phục vụ việc định danh và đồng bộ tiến độ ôn tập, Parabol chỉ lưu trữ các thông tin cơ bản tối thiểu bao gồm: Tên hiển thị, địa chỉ Email, ảnh đại diện công khai (trong trường hợp người dùng đăng nhập thông qua Google OAuth) cùng dữ liệu quá trình học tập (lịch sử làm bài thi, điểm số, điểm kinh nghiệm XP và mục tiêu nguyện vọng cá nhân do người dùng tự thiết lập).
                </p>
                <p>
                  <span className="font-semibold text-neutral-900">1.2.</span> Parabol cam kết tuyệt đối không thu thập, không yêu cầu cung cấp và không lưu trữ bất kỳ dữ liệu cá nhân nhạy cảm nào khác của người dùng, bao gồm: số Căn cước công dân/Chứng minh nhân dân, số điện thoại cá nhân, địa chỉ cư trú, thông tin tài chính, tài khoản ngân hàng hoặc dữ liệu sinh trắc học.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-neutral-950">
                  Điều 2. Mục đích sử dụng thông tin
                </h3>
                <p>
                  <span className="font-semibold text-neutral-900">2.1.</span> Toàn bộ dữ liệu được lưu trữ chỉ nhằm mục đích duy trì phiên đăng nhập, đồng bộ lịch sử làm bài trên các thiết bị khác nhau, tính toán tiến độ ôn tập cá nhân và hiển thị thành tích thi thử trên Bảng xếp hạng công khai của hệ thống.
                </p>
                <p>
                  <span className="font-semibold text-neutral-900">2.2.</span> Trong mọi trường hợp hiển thị công khai trên Bảng xếp hạng hoặc hồ sơ thành tích, hệ thống chỉ hiển thị Tên hiển thị và điểm số; địa chỉ Email của người dùng được bảo mật hoàn toàn và tuyệt đối không bị công khai cho người dùng khác.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-neutral-950">
                  Điều 3. Lưu trữ và Bảo mật dữ liệu
                </h3>
                <p>
                  <span className="font-semibold text-neutral-900">3.1.</span> Dữ liệu tài khoản và lịch sử làm bài được lưu trữ an toàn, phân quyền truy cập chặt chẽ và mã hóa trên hạ tầng cơ sở dữ liệu Supabase theo các tiêu chuẩn bảo mật hiện hành.
                </p>
                <p>
                  <span className="font-semibold text-neutral-900">3.2.</span> Parabol cam kết không mua bán, trao đổi, cho thuê hoặc chia sẻ thông tin cá nhân của người dùng cho bất kỳ bên thứ ba nào vì mục đích thương mại, quảng cáo hay tiếp thị.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-neutral-950">
                  Điều 4. Quyền của người dùng và Thông tin liên hệ
                </h3>
                <p>
                  <span className="font-semibold text-neutral-900">4.1.</span> Người dùng có toàn quyền chỉnh sửa tên hiển thị, cập nhật mục tiêu cá nhân hoặc yêu cầu xóa vĩnh viễn tài khoản cùng toàn bộ lịch sử dữ liệu liên quan khỏi hệ thống vào bất kỳ thời điểm nào.
                </p>
                <p>
                  <span className="font-semibold text-neutral-900">4.2.</span> Mọi yêu cầu liên quan đến quyền riêng tư, xóa dữ liệu hoặc khiếu nại bản quyền xin vui lòng gửi về địa chỉ email liên hệ chính thức:{' '}
                  <a
                    href="mailto:kienphung15101981@gmail.com"
                    className="font-semibold text-neutral-950 underline"
                  >
                    kienphung15101981@gmail.com
                  </a>
                  .
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-md bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Tôi đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

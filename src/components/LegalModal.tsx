import { X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

export type LegalTab = 'terms' | 'privacy' | 'disclaimer';

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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    if (initialTab === 'privacy') {
      const target = container.querySelector('#legal-dieu-7') as HTMLElement | null;
      if (target) {
        container.scrollTo({ top: target.offsetTop - 16, behavior: 'auto' });
        return;
      }
    } else if (initialTab === 'disclaimer') {
      const target = container.querySelector('#legal-dieu-6') as HTMLElement | null;
      if (target) {
        container.scrollTo({ top: target.offsetTop - 16, behavior: 'auto' });
        return;
      }
    }
    container.scrollTo({ top: 0, behavior: 'auto' });
  }, [isOpen, initialTab]);

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
      <div className="relative w-full max-w-2xl rounded-lg border border-neutral-300 bg-[#FFFFFF] text-[#1F2937] shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-[#FFFFFF]">
          <h2
            id="legal-modal-title"
            className="text-sm font-bold text-black tracking-tight"
          >
            Điều khoản sử dụng, Chính sách bảo mật &amp; Miễn trừ trách nhiệm
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plain Legal Document Body */}
        <div
          ref={scrollContainerRef}
          className="max-h-[70vh] overflow-y-auto px-6 py-5 bg-[#FFFFFF] text-[#1F2937] text-[13px] leading-[1.7] text-justify space-y-4"
        >
          <p className="font-bold text-black text-center">
            THỎA THUẬN ĐIỀU KHOẢN SỬ DỤNG, CHÍNH SÁCH BẢO MẬT VÀ TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM CỦA HỆ THỐNG LUYỆN THI TRỰC TUYẾN PARABOL
          </p>

          <p className="text-center">
            Cập nhật lần cuối: Tháng 11 năm 2026
            <br />
            Phiên bản hiệu lực: 2.0 (Áp dụng toàn hệ thống)
          </p>

          <p>
            Vui lòng đọc kỹ toàn bộ Thỏa thuận này trước khi tiến hành đăng ký tài khoản, truy cập hoặc sử dụng bất kỳ tính năng, đề thi, tài liệu hay dịch vụ nào trên nền tảng Parabol. Bằng việc đánh dấu vào ô xác nhận &quot;Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Parabol&quot;, bấm nút &quot;Tạo tài khoản&quot;, &quot;Đăng nhập bằng Google&quot; hoặc tiếp tục truy cập và sử dụng nền tảng dưới bất kỳ hình thức nào, bạn xác nhận rằng bạn đã đọc, đã hiểu rõ, hoàn toàn tự nguyện chấp thuận và cam kết tuân thủ vô điều kiện mọi điều khoản, quy định và tuyên bố miễn trừ trách nhiệm được nêu trong văn bản này. Nếu bạn không đồng ý với bất kỳ nội dung nào tại đây, vui lòng ngừng truy cập và không sử dụng hệ thống ngay lập tức.
          </p>

          <div className="space-y-2">
            <h3 className="font-bold text-black">
              ĐIỀU 1. ĐỊNH NGHĨA VÀ GIẢI THÍCH THUẬT NGỮ
            </h3>
            <p>
              1.1. &quot;Parabol&quot;, &quot;Hệ thống&quot;, &quot;Nền tảng&quot; hoặc &quot;Chúng tôi&quot; dùng để chỉ ứng dụng web luyện thi trực tuyến Parabol (bao gồm tên miền chính thức, các tên miền phụ, giao diện người dùng, cơ sở dữ liệu và toàn bộ mã nguồn vận hành đi kèm) được xây dựng và duy trì bởi nhóm phát triển độc lập.
            </p>
            <p>
              1.2. &quot;Người dùng&quot;, &quot;Thí sinh&quot; hoặc &quot;Bạn&quot; dùng để chỉ bất kỳ cá nhân nào truy cập, đăng ký tài khoản, tham gia làm bài thi thử, xem lời giải, tương tác trên bảng xếp hạng hoặc sử dụng bất kỳ tiện ích nào do Parabol cung cấp.
            </p>
            <p>
              1.3. &quot;Nội dung hệ thống&quot; bao gồm nhưng không giới hạn ở toàn bộ ngân hàng câu hỏi, đề thi mô phỏng, đáp án, lời giải chi tiết, công thức toán học, hình vẽ minh họa, biểu đồ thống kê, điểm kinh nghiệm (XP), cấp bậc và dữ liệu hiển thị trên giao diện.
            </p>
            <p>
              1.4. &quot;Tài khoản&quot; là định danh duy nhất được cấp cho Người dùng thông qua quá trình đăng ký bằng địa chỉ thư điện tử (Email) hoặc liên kết xác thực thông qua bên thứ ba (Google OAuth) nhằm lưu trữ và đồng bộ hóa kết quả học tập.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-black">
              ĐIỀU 2. BẢN CHẤT NỀN TẢNG, TÍNH CHẤT PHI THƯƠNG MẠI VÀ ĐỘC LẬP
            </h3>
            <p>
              2.1. Parabol là một dự án cộng đồng tự phát, hoạt động hoàn toàn phi lợi nhuận và phi thương mại, được xây dựng với mục đích duy nhất là cung cấp không gian mô phỏng phòng thi trực tuyến hỗ trợ học sinh trung học phổ thông tự ôn luyện cho các kỳ thi Đánh giá tư duy (TSA), Đánh giá năng lực (HSA, V-ACT, V-SAT) và Kỳ thi Tốt nghiệp THPT Quốc gia.
            </p>
            <p>
              2.2. Parabol hoạt động hoàn toàn độc lập. Hệ thống KHÔNG trực thuộc, KHÔNG liên kết, KHÔNG được tài trợ, KHÔNG đại diện và KHÔNG mang tư cách pháp nhân thay mặt cho Đại học Bách khoa Hà Nội (HUST), Đại học Quốc gia Hà Nội (VNU), Đại học Quốc gia TP.HCM, Bộ Giáo dục và Đào tạo hay bất kỳ cơ sở giáo dục, tổ chức khảo thí nào khác.
            </p>
            <p>
              2.3. Mọi điểm số, thứ hạng, huy hiệu, điểm kinh nghiệm (XP) và nhận định đánh giá năng lực trên Parabol chỉ có giá trị tham khảo nội bộ phục vụ quá trình tự học, hoàn toàn không có giá trị pháp lý, không có giá trị quy đổi điểm xét tuyển đại học và không phản ánh hay bảo đảm kết quả thi thực tế của Người dùng tại các kỳ thi chính thức.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-black">
              ĐIỀU 3. ĐIỀU KIỆN ĐĂNG KÝ, QUẢN LÝ TÀI KHOẢN VÀ NGHĨA VỤ NGƯỜI DÙNG
            </h3>
            <p>
              3.1. Để sử dụng đầy đủ các tính năng làm bài thi, lưu trữ lịch sử, ghi nhận thành tích trên Bảng xếp hạng và xem lời giải chi tiết, Người dùng bắt buộc phải đăng ký và đăng nhập bằng Tài khoản hợp lệ. Chế độ truy cập ẩn danh hoặc tài khoản Khách không được áp dụng cho các tính năng thi cử cốt lõi.
            </p>
            <p>
              3.2. Người dùng cam kết tự chịu hoàn toàn trách nhiệm về tính chính xác của thông tin hiển thị và việc bảo mật thông tin đăng nhập (email, mật khẩu, phiên đăng nhập Google) của mình. Parabol không chịu trách nhiệm đối với bất kỳ tổn thất dữ liệu học tập hay hành vi lạm dụng nào phát sinh từ việc Người dùng để lộ thông tin đăng nhập hoặc chia sẻ tài khoản cho người khác.
            </p>
            <p>
              3.3. Khi tham gia sử dụng hệ thống, Người dùng cam kết nghiêm cấm tuyệt đối các hành vi sau đây: (a) Sử dụng tên hiển thị, ảnh đại diện hoặc nội dung bình luận chứa ngôn từ thô tục, xúc phạm danh dự nhân phẩm cá nhân, kích động, phân biệt đối xử hoặc vi phạm thuần phong mỹ tục và pháp luật hiện hành; (b) Sử dụng phần mềm tự động (bot, script, crawler), công cụ can thiệp mã nguồn trình duyệt (DevTools, chỉnh sửa gói tin/request API) nhằm gian lận điểm số, thao túng bảng xếp hạng hoặc phá hoại hệ thống; (c) Cố tình khai thác lỗ hổng bảo mật, tấn công từ chối dịch vụ (DDoS) hoặc gây quá tải máy chủ lưu trữ; (d) Sao chép hàng loạt cơ sở dữ liệu đề thi để trục lợi thương mại.
            </p>
            <p>
              3.4. Nhóm phát triển Parabol có toàn quyền tạm khóa, vô hiệu hóa vĩnh viễn tài khoản hoặc xóa bỏ toàn bộ lịch sử điểm số của Người dùng mà không cần thông báo trước nếu phát hiện bất kỳ dấu hiệu vi phạm nào đối với các quy định tại Điều 3.3.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-black">
              ĐIỀU 4. QUY CHẾ PHÒNG THI, HỆ THỐNG GIÁM SÁT VÀ BẢNG XẾP HẠNG
            </h3>
            <p>
              4.1. Nhằm duy trì tính công bằng và trải nghiệm sát với kỳ thi thực tế, chế độ &quot;Thi thử&quot; trên Parabol có tích hợp cơ chế giám sát kỹ thuật phía trình duyệt (bao gồm phát hiện thoát chế độ toàn màn hình, chuyển đổi tab trình duyệt, mất tiêu điểm cửa sổ hoặc vượt quá thời gian quy định).
            </p>
            <p>
              4.2. Mọi lượt thi phát sinh hành vi vi phạm quy chế quá giới hạn cho phép sẽ tự động bị hệ thống gắn cờ đánh dấu &quot;Vi phạm quy chế&quot;. Các lượt thi bị đánh dấu vi phạm sẽ bị loại bỏ hoàn toàn khỏi Bảng xếp hạng công khai của từng đề thi và không được tính vào điểm trung bình mục tiêu.
            </p>
            <p>
              4.3. Trên Bảng xếp hạng theo từng đề thi, hệ thống chỉ ghi nhận duy nhất một (01) kết quả hợp lệ có điểm số cao nhất của mỗi Người dùng (trong trường hợp bằng điểm, hệ thống ưu tiên lượt thi có thời gian hoàn thành ngắn hơn).
            </p>
            <p>
              4.4. Người dùng hiểu và chấp nhận rằng cơ chế giám sát trình duyệt có thể chịu ảnh hưởng từ thông báo hệ thống (pop-up), ứng dụng chạy nền hoặc sự cố mạng từ phía thiết bị của Người dùng. Parabol không có nghĩa vụ khôi phục, điều chỉnh thủ công hoặc hủy bỏ trạng thái vi phạm cho bất kỳ lượt thi nào.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-black">
              ĐIỀU 5. QUYỀN SỞ HỮU TRÍ TUỆ, BẢN QUYỀN TÀI LIỆU VÀ CƠ CHẾ GỠ BỎ
            </h3>
            <p>
              5.1. Toàn bộ giao diện thiết kế, mã nguồn, bố cục trang web, tên gọi và biểu trưng (logo) của Parabol thuộc quyền quản lý của nhóm phát triển.
            </p>
            <p>
              5.2. Các đề thi mô phỏng, câu hỏi trắc nghiệm và lời giải chi tiết hiển thị trên hệ thống được tổng hợp, biên soạn và số hóa từ nhiều nguồn học liệu công khai trên Internet với mục đích duy nhất là phục vụ cộng đồng học sinh tự ôn luyện miễn phí, không nhằm mục đích kinh doanh hay thương mại hóa.
            </p>
            <p>
              5.3. Parabol tôn trọng tuyệt đối quyền sở hữu trí tuệ của các tác giả, nhà xuất bản và đơn vị biên soạn đề thi. Trong trường hợp cá nhân hoặc tổ chức là chủ sở hữu bản quyền hợp pháp của bất kỳ câu hỏi, hình ảnh hay đề thi nào xuất hiện trên hệ thống và không đồng ý cho phép lưu hành phục vụ học tập tại đây, vui lòng gửi yêu cầu thông báo qua địa chỉ email liên hệ tại Điều 10. Chúng tôi cam kết tiến hành xác minh và gỡ bỏ hoàn toàn nội dung liên quan trong vòng từ 24 đến 48 giờ làm việc kể từ thời điểm tiếp nhận thông báo hợp lệ.
            </p>
            <p>
              5.4. Parabol không chịu trách nhiệm đối với bất kỳ hành vi tự ý chụp màn hình, sao chép, tải xuống, chỉnh sửa hoặc phát tán lại nội dung từ hệ thống sang các nền tảng khác do Người dùng tự thực hiện.
            </p>
          </div>

          <div id="legal-dieu-6" className="space-y-2">
            <h3 className="font-bold text-black">
              ĐIỀU 6. TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM TUYỆT ĐỐI
            </h3>
            <p>
              6.1. Nền tảng Parabol và toàn bộ nội dung, công cụ, tính năng đi kèm được cung cấp theo đúng nguyên trạng (&quot;NGUYÊN TRẠNG - AS IS&quot;) và theo khả năng sẵn có (&quot;SẴN CÓ - AS AVAILABLE&quot;) mà không đi kèm bất kỳ sự bảo đảm nào, dù là công khai hay ngầm định.
            </p>
            <p>
              6.2. Miễn trừ về tính chính xác của nội dung: Mặc dù nhóm phát triển luôn nỗ lực rà soát lỗi chính tả, công thức toán học (LaTeX/KaTeX) và đáp án, Parabol không cam kết và không bảo đảm rằng mọi đề thi, câu hỏi hay lời giải trên hệ thống đều chính xác tuyệt đối 100%. Nhóm phát triển được miễn trừ toàn bộ trách nhiệm pháp lý đối với bất kỳ sai sót học thuật, nhầm lẫn đáp án hoặc hiểu lầm kiến thức nào phát sinh trong quá trình Người dùng tự học trên hệ thống.
            </p>
            <p>
              6.3. Miễn trừ về sự cố kỹ thuật và gián đoạn dịch vụ: Parabol vận hành dựa trên các hạ tầng đám mây miễn phí và dịch vụ của bên thứ ba (như Vercel, Supabase, GitHub). Chúng tôi không bảo đảm hệ thống sẽ hoạt động liên tục, không bị gián đoạn, không có lỗi phần mềm (bug) hoặc không bị mất dữ liệu do bảo trì, hết hạn mức tài nguyên, lỗi đường truyền Internet hoặc sự cố từ nhà cung cấp hạ tầng.
            </p>
            <p>
              6.4. Miễn trừ về mọi thiệt hại phát sinh: Trong mọi trường hợp và trong phạm vi tối đa mà pháp luật cho phép, nhóm phát triển Parabol được miễn trừ hoàn toàn mọi trách nhiệm dân sự, hành chính hay pháp lý đối với bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên, đặc biệt hay hệ quả nào (bao gồm nhưng không giới hạn ở: mất dữ liệu bài làm, gián đoạn quá trình ôn thi, kết quả thi thực tế không như kỳ vọng, hoặc hư hỏng thiết bị/phần mềm của Người dùng) phát sinh từ hoặc có liên quan đến việc truy cập, sử dụng hoặc không thể sử dụng nền tảng Parabol.
            </p>
            <p>
              6.5. Người dùng xác nhận rằng mọi rủi ro liên quan đến việc sử dụng nền tảng hoàn toàn do Người dùng tự chịu trách nhiệm.
            </p>
          </div>

          <div id="legal-dieu-7" className="space-y-2">
            <h3 className="font-bold text-black">
              ĐIỀU 7. CHÍNH SÁCH BẢO MẬT VÀ CAM KẾT KHÔNG THU THẬP DỮ LIỆU CÁ NHÂN NHẠY CẢM
            </h3>
            <p>
              7.1. Cam kết cốt lõi về quyền riêng tư: Parabol cam kết KHÔNG thu thập, KHÔNG yêu cầu cung cấp, KHÔNG lưu trữ và KHÔNG khai thác bất kỳ dữ liệu cá nhân nhạy cảm nào của Người dùng. Các thông tin mà hệ thống tuyệt đối không bao giờ yêu cầu bao gồm nhưng không giới hạn ở: số điện thoại cá nhân, số Căn cước công dân / Chứng minh nhân dân, ngày tháng năm sinh, địa chỉ cư trú, thông tin trường lớp cụ thể, tọa độ định vị GPS, danh bạ thiết bị, hình ảnh riêng tư, thông tin tài khoản ngân hàng, thẻ tín dụng hay bất kỳ dữ liệu tài chính nào.
            </p>
            <p>
              7.2. Không theo dõi quảng cáo và không chia sẻ bên thứ ba: Hệ thống Parabol hoàn toàn không tích hợp mã theo dõi quảng cáo hành vi (Ad-tracking pixels), không bán không gian quảng cáo nhắm mục tiêu và cam kết tuyệt đối KHÔNG bán, KHÔNG cho thuê, KHÔNG trao đổi và KHÔNG tiết lộ bất kỳ thông tin nào của Người dùng cho bất kỳ cá nhân, tổ chức hay bên thứ ba nào dưới mọi hình thức.
            </p>
            <p>
              7.3. Dữ liệu kỹ thuật tối thiểu phục vụ vận hành: Để duy trì chức năng đăng nhập và đồng bộ lịch sử bài thi, hệ thống chỉ tiếp nhận và lưu giữ các dữ liệu định danh kỹ thuật ở mức tối thiểu nhất thông qua cơ chế xác thực mã hóa của Supabase và Google OAuth, bao gồm: (a) Địa chỉ Email dùng để định danh đăng nhập; (b) Tên hiển thị và ảnh đại diện công khai (nếu có); (c) Dữ liệu học tập do chính Người dùng tạo ra trên nền tảng (lịch sử lượt làm bài, điểm số, thời gian làm bài, điểm XP, sổ tay câu sai và mục tiêu điểm số tự nhập).
            </p>
            <p>
              7.4. Bảo mật hiển thị công khai: Trên Bảng xếp hạng công khai của hệ thống, Parabol chỉ hiển thị Tên hiển thị, ảnh đại diện, cấp bậc và thành tích làm bài. Địa chỉ Email của Người dùng luôn được giữ kín trong cơ sở dữ liệu bảo mật và tuyệt đối không hiển thị công khai cho người dùng khác.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-black">
              ĐIỀU 8. LƯU TRỮ DỮ LIỆU, BẢO MẬT HẠ TẦNG VÀ QUYỀN CỦA NGƯỜI DÙNG
            </h3>
            <p>
              8.1. Toàn bộ dữ liệu kỹ thuật tối thiểu và lịch sử học tập được lưu trữ trên hạ tầng cơ sở dữ liệu Supabase có áp dụng cơ chế mã hóa mật khẩu một chiều và chính sách phân quyền bảo mật theo từng hàng dữ liệu (Row Level Security - RLS). Nhóm quản trị viên không thể đọc, xem hoặc giải mã mật khẩu tài khoản của Người dùng.
            </p>
            <p>
              8.2. Hệ thống có thể sử dụng bộ nhớ cục bộ của trình duyệt (LocalStorage / SessionStorage) trên chính thiết bị của Người dùng nhằm mục đích duy nhất là duy trì phiên đăng nhập và tự động lưu tạm đáp án đang làm dở phòng trường hợp mất kết nối mạng.
            </p>
            <p>
              8.3. Quyền kiểm soát của Người dùng: Người dùng có toàn quyền truy cập, tự chỉnh sửa Tên hiển thị, mục tiêu học tập hoặc gửi yêu cầu xóa vĩnh viễn Tài khoản cùng toàn bộ lịch sử dữ liệu học tập liên quan ra khỏi hệ thống bất cứ lúc nào.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-black">
              ĐIỀU 9. SỬA ĐỔI ĐIỀU KHOẢN VÀ HIỆU LỰC THI HÀNH
            </h3>
            <p>
              9.1. Nhóm phát triển Parabol bảo lưu quyền cập nhật, bổ sung, chỉnh sửa hoặc thay thế bất kỳ phần nào của văn bản Thỏa thuận này vào bất kỳ thời điểm nào nhằm phù hợp với quá trình nâng cấp tính năng hoặc thay đổi kỹ thuật của hệ thống mà không bắt buộc phải gửi thông báo riêng lẻ tới từng Người dùng.
            </p>
            <p>
              9.2. Các thay đổi sẽ có hiệu lực ngay lập tức kể từ thời điểm phiên bản mới được đăng tải công khai trên nền tảng. Việc Người dùng tiếp tục truy cập hoặc sử dụng Parabol sau thời điểm cập nhật đồng nghĩa với việc Người dùng hoàn toàn chấp thuận các điều khoản sửa đổi mới nhất.
            </p>
            <p>
              9.3. Trong trường hợp bất kỳ điều khoản nào trong văn bản này bị coi là không có hiệu lực hoặc không thể thi hành, các điều khoản còn lại vẫn giữ nguyên giá trị hiệu lực đầy đủ.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-black">
              ĐIỀU 10. THÔNG TIN LIÊN HỆ VÀ TIẾP NHẬN YÊU CẦU
            </h3>
            <p>
              Mọi yêu cầu liên quan đến việc gỡ bỏ nội dung bản quyền, báo cáo lỗi kỹ thuật, đề nghị xóa vĩnh viễn tài khoản và dữ liệu học tập, hoặc các thắc mắc khác về Thỏa thuận này, vui lòng liên hệ trực tiếp với quản trị viên dự án Parabol qua địa chỉ thư điện tử chính thức: kienphung15101981@gmail.com.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-[#FFFFFF] flex justify-end">
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

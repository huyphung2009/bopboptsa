import type { Exam } from '../types/exam';

export const SAMPLE_EXAM: Exam = {
  id: 'sample-tsa-2026-01',
  title: 'Đề minh họa Đánh giá tư duy TSA HUST — Đề chuẩn mẫu #01',
  description:
    'Đề thi mẫu tích hợp đầy đủ 3 phần: Tư duy Toán học, Tư duy Đọc hiểu và Tư duy Khoa học với đủ 4 định dạng câu hỏi TSA chuẩn Đại học Bách khoa Hà Nội.',
  exam_type: 'TSA',
  section: 'Tổng hợp (Toán - Đọc - Khoa học)',
  duration_minutes: 60,
  is_sample: true,
  sections: [
    { id: 'sec-math', title: 'Phần 1: Tư duy Toán học', duration_minutes: 25 },
    { id: 'sec-reading', title: 'Phần 2: Tư duy Đọc hiểu', duration_minutes: 15 },
    { id: 'sec-science', title: 'Phần 3: Tư duy Khoa học', duration_minutes: 20 },
  ],
  passages: [
    {
      id: 'p-math',
      section: 'Tư duy Toán học',
      title: 'Ngữ liệu Phần 1: Tư duy Toán học',
      content:
        'Trong phần Tư duy Toán học, thí sinh vận dụng kiến thức đại số, giải tích, hình học và tổ hợp - xác suất để giải quyết các bài toán thực tiễn và suy luận logic.\n\nLưu ý: Với câu trả lời ngắn dạng số thập phân, sử dụng dấu chấm (.) hoặc dấu phẩy (,) đều được hệ thống chấp nhận. Thí sinh có thể mở Máy tính cầm tay ở thanh công cụ phía trên để hỗ trợ tính toán.',
    },
    {
      id: 'p-reading',
      section: 'Tư duy Đọc hiểu',
      title: 'Ngữ liệu Đọc hiểu: Pin thể rắn và tương lai xe điện',
      content:
        'Pin lithium-ion truyền thống sử dụng chất điện phân lỏng hữu cơ để vận chuyển ion $Li^+$ giữa cực âm (anode) và cực dương (cathode). Dù đã đạt được mật độ năng lượng khoảng $250 - 300\\text{ Wh/kg}$, loại pin này vẫn tồn tại hai rào cản lớn: nguy cơ cháy nổ khi quá nhiệt (thermal runaway) và tốc độ sạc bị giới hạn do hiện tượng mọc nhánh tinh thể lithium (dendrite) làm đoản mạch.\n\nPin thể rắn (Solid-State Battery - SSB) thay thế hoàn toàn chất điện phân lỏng bằng chất điện phân rắn (gốm oxit, sunfua hoặc polyme). Cấu trúc rắn không bắt lửa giúp triệt tiêu nguy cơ cháy nổ ở nhiệt độ cao, đồng thời cho phép sử dụng cực âm bằng kim loại lithium nguyên chất, nâng mật độ năng lượng lý thuyết lên tới $400 - 500\\text{ Wh/kg}$.\n\nTuy nhiên, thách thức lớn nhất hiện nay của pin thể rắn là trở kháng tiếp xúc tại bề mặt phân cách rắn–rắn giữa điện cực và chất điện phân, cũng như chi phí sản xuất hàng loạt còn cao gấp $3 - 5$ lần so với pin lithium-ion hiện hành.',
    },
    {
      id: 'p-science',
      section: 'Tư duy Khoa học',
      title: 'Ngữ liệu Khoa học: Động học phản ứng phân hủy $H_2O_2$',
      content:
        'Một nhóm nghiên cứu khảo sát tốc độ phản ứng phân hủy dung dịch hydrogen peroxide ($H_2O_2$) khi có mặt xúc tác $MnO_2$ ở nhiệt độ không đổi $25^\\circ\\text{C}$:\n$$2H_2O_2(aq) \\xrightarrow{MnO_2} 2H_2O(l) + O_2(g)\\uparrow$$\n\nThí nghiệm đo thể tích khí $O_2$ thoát ra (quy về điều kiện chuẩn, $1\\text{ mol}$ khí chiếm $24.79\\text{ L}$) theo thời gian $t$ với $100\\text{ mL}$ dung dịch $H_2O_2$ nồng độ ban đầu $C_0 = 0.8\\text{ M}$:\n• Tại $t = 0\\text{ s}$: $V_{O_2} = 0\\text{ mL}$\n• Tại $t = 20\\text{ s}$: $V_{O_2} = 247.9\\text{ mL}$\n• Tại $t = 40\\text{ s}$: $V_{O_2} = 433.8\\text{ mL}$\n• Tại $t = 60\\text{ s}$: $V_{O_2} = 557.8\\text{ mL}$\n\nBiết rằng tốc độ phản ứng tỉ lệ thuận với nồng độ $H_2O_2$ còn lại trong dung dịch.',
    },
  ],
  questions: [
    {
      id: 'q1',
      type: 'single_choice',
      section: 'Tư duy Toán học',
      passageId: 'p-math',
      prompt:
        'Cho hàm số $f(x) = x^3 - 3x^2 + 2$. Tổng giá trị cực đại và giá trị cực tiểu của hàm số đã cho bằng bao nhiêu?',
      options: [
        { id: 'A', text: '$0$' },
        { id: 'B', text: '$2$' },
        { id: 'C', text: '$-2$' },
        { id: 'D', text: '$4$' },
      ],
      correctOption: 'A',
      explanation:
        'Ta có $f\'(x) = 3x^2 - 6x = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$.\nGiá trị cực đại $f(0) = 2$, giá trị cực tiểu $f(2) = 8 - 12 + 2 = -2$.\nTổng hai giá trị là $2 + (-2) = 0$.',
      points: 1,
    },
    {
      id: 'q2',
      type: 'true_false',
      section: 'Tư duy Toán học',
      passageId: 'p-math',
      prompt:
        'Xét tích phân $I = \\int_{0}^{2} (2x + e^x)\\,dx$. Hãy xác định tính Đúng/Sai của các khẳng định sau:',
      statements: [
        {
          id: 's1',
          text: 'Nguyên hàm của hàm số $g(x) = 2x + e^x$ là $G(x) = x^2 + e^x + C$.',
          correct: true,
        },
        {
          id: 's2',
          text: 'Giá trị chính xác của tích phân là $I = 3 + e^2$.',
          correct: true,
        },
        {
          id: 's3',
          text: 'Nếu $I = a + e^b$ với $a, b \\in \\mathbb{Z}$ thì $a + b = 6$.',
          correct: false,
        },
        {
          id: 's4',
          text: 'Giá trị của $I$ lớn hơn $10$.',
          correct: true,
        },
      ],
      explanation:
        '$I = [x^2 + e^x]_0^2 = (4 + e^2) - (0 + 1) = 3 + e^2$.\nVới $e \\approx 2.718 \\Rightarrow e^2 \\approx 7.389 \\Rightarrow I \\approx 10.389 > 10$.\nDo $a = 3, b = 2$ nên $a + b = 5 \\neq 6$.',
      points: 1,
    },
    {
      id: 'q3',
      type: 'short_answer',
      section: 'Tư duy Toán học',
      passageId: 'p-math',
      prompt:
        'Một hộp có $5$ viên bi xanh và $4$ viên bi đỏ. Lấy ngẫu nhiên đồng thời $3$ viên bi. Xác suất để $3$ viên bi lấy ra có đúng $2$ viên bi xanh là $\\frac{a}{b}$ (phân số tối giản). Tính giá trị của $a + b$.',
      correctAnswers: ['31'],
      placeholder: 'Nhập một số nguyên...',
      explanation:
        'Số cách chọn $3$ viên bi bất kỳ: $C_9^3 = 84$.\nSố cách chọn $2$ bi xanh và $1$ bi đỏ: $C_5^2 \\cdot C_4^1 = 10 \\cdot 4 = 40$.\nXác suất $P = \\frac{40}{84} = \\frac{10}{21}$. Vậy $a = 10, b = 21 \\Rightarrow a + b = 31$.',
      points: 1,
    },
    {
      id: 'q4',
      type: 'drag_drop',
      section: 'Tư duy Đọc hiểu',
      passageId: 'p-reading',
      prompt:
        'Hoàn thành đoạn tóm tắt sau bằng cách kéo thả (hoặc chọn) các cụm từ thích hợp vào chỗ trống:\n\nPin thể rắn thay thế chất điện phân [[b1]] bằng chất điện phân rắn, giúp loại bỏ nguy cơ [[b2]] và cho phép dùng cực âm [[b3]] nguyên chất. Tuy nhiên, pin vẫn gặp khó khăn do [[b4]] tại bề mặt tiếp xúc rắn–rắn.',
      wordBank: [
        'lỏng hữu cơ',
        'cháy nổ',
        'kim loại lithium',
        'trở kháng tiếp xúc',
        'than chì (graphite)',
        'ăn mòn điện hóa',
      ],
      blanks: [
        { id: 'b1', correctWord: 'lỏng hữu cơ' },
        { id: 'b2', correctWord: 'cháy nổ' },
        { id: 'b3', correctWord: 'kim loại lithium' },
        { id: 'b4', correctWord: 'trở kháng tiếp xúc' },
      ],
      explanation:
        'Dựa trực tiếp vào đoạn 2 và đoạn 3 của ngữ liệu: thay chất điện phân lỏng hữu cơ bằng chất điện phân rắn; triệt tiêu nguy cơ cháy nổ; dùng cực âm kim loại lithium nguyên chất; trở ngại lớn nhất là trở kháng tiếp xúc.',
      points: 1,
    },
    {
      id: 'q5',
      type: 'single_choice',
      section: 'Tư duy Đọc hiểu',
      passageId: 'p-reading',
      prompt:
        'Theo bài đọc, mật độ năng lượng lý thuyết tối đa của pin thể rắn cao hơn khoảng bao nhiêu lần so với mức thấp nhất của pin lithium-ion truyền thống được nêu trong bài?',
      options: [
        { id: 'A', text: '$1.5$ lần' },
        { id: 'B', text: '$2.0$ lần' },
        { id: 'C', text: '$2.5$ lần' },
        { id: 'D', text: '$3.0$ lần' },
      ],
      correctOption: 'B',
      explanation:
        'Mật độ năng lượng lý thuyết tối đa của pin thể rắn là $500\\text{ Wh/kg}$, còn mức thấp nhất của pin lithium-ion truyền thống nêu trong bài là $250\\text{ Wh/kg}$. Tỉ số là $500 / 250 = 2.0$ lần.',
      points: 1,
    },
    {
      id: 'q6',
      type: 'true_false',
      section: 'Tư duy Khoa học',
      passageId: 'p-science',
      prompt:
        'Dựa vào ngữ liệu thí nghiệm phân hủy $H_2O_2$, xác định tính Đúng/Sai của các nhận định sau:',
      statements: [
        {
          id: 'k1',
          text: 'Trong $20\\text{ s}$ đầu tiên, số mol khí $O_2$ sinh ra là $0.01\\text{ mol}$.',
          correct: true,
        },
        {
          id: 'k2',
          text: 'Lượng $H_2O_2$ đã bị phân hủy trong $20\\text{ s}$ đầu tiên là $0.02\\text{ mol}$.',
          correct: true,
        },
        {
          id: 'k3',
          text: 'Tốc độ trung bình tạo thành $O_2$ tăng dần theo thời gian từ $0\\text{ s}$ đến $60\\text{ s}$.',
          correct: false,
        },
        {
          id: 'k4',
          text: 'Chất xúc tác $MnO_2$ bị tiêu hao hoàn toàn sau khi phản ứng kết thúc.',
          correct: false,
        },
      ],
      explanation:
        '• $n_{O_2}(20\\text{ s}) = 0.2479 / 24.79 = 0.01\\text{ mol}$ (Đúng).\n• Theo phương trình, $n_{H_2O_2\\text{ pư}} = 2 n_{O_2} = 0.02\\text{ mol}$ (Đúng).\n• Lượng khí sinh ra mỗi $20\\text{ s}$ giảm dần ($247.9 \\rightarrow 185.9 \\rightarrow 124.0\\text{ mL}$), nên tốc độ giảm dần (Sai).\n• Chất xúc tác không bị tiêu hao sau phản ứng (Sai).',
      points: 1,
    },
    {
      id: 'q7',
      type: 'short_answer',
      section: 'Tư duy Khoa học',
      passageId: 'p-science',
      prompt:
        'Tính nồng độ mol ($\\text{M}$) còn lại của dung dịch $H_2O_2$ tại thời điểm $t = 20\\text{ s}$ (giả sử thể tích dung dịch không đổi bằng $100\\text{ mL}$).',
      correctAnswers: ['0.6', '0,6'],
      placeholder: 'Nhập kết quả (VD: 0.6)...',
      explanation:
        'Số mol $H_2O_2$ ban đầu: $n_0 = 0.1 \\times 0.8 = 0.08\\text{ mol}$.\nTại $t = 20\\text{ s}$, $n_{O_2} = 0.01\\text{ mol} \\Rightarrow n_{H_2O_2\\text{ pư}} = 0.02\\text{ mol}$.\nSố mol $H_2O_2$ còn lại: $0.08 - 0.02 = 0.06\\text{ mol}$.\nNồng độ còn lại: $C = 0.06 / 0.1 = 0.6\\text{ M}$.',
      points: 1,
    },
  ],
};

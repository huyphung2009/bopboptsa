import type { ExamType } from '../types/exam';

export interface ExamSectionFormat {
  id: string;
  title: string;
  questionCount: number;
  duration_minutes: number;
  max_score: number;
}

export interface ExamFormatConfig {
  exam_type: ExamType;
  fullName: string;
  reportTitle: string;
  totalMaxScore: number;
  totalDurationMinutes: number;
  sections: ExamSectionFormat[];
}

export const EXAM_FORMATS: Record<ExamType, ExamFormatConfig> = {
  TSA: {
    exam_type: 'TSA',
    fullName: 'Đánh giá tư duy ĐHBK Hà Nội (TSA)',
    reportTitle: 'PHIẾU BÁO KẾT QUẢ THI ĐÁNH GIÁ TƯ DUY TSA — THANG 100',
    totalMaxScore: 100,
    totalDurationMinutes: 150,
    sections: [
      {
        id: 'sec-tsa-math',
        title: 'Phần 1: Tư duy Toán học',
        questionCount: 40,
        duration_minutes: 60,
        max_score: 40,
      },
      {
        id: 'sec-tsa-reading',
        title: 'Phần 2: Tư duy Đọc hiểu',
        questionCount: 20,
        duration_minutes: 30,
        max_score: 20,
      },
      {
        id: 'sec-tsa-science',
        title: 'Phần 3: Tư duy Khoa học / GQVĐ',
        questionCount: 40,
        duration_minutes: 60,
        max_score: 40,
      },
    ],
  },
  HSA: {
    exam_type: 'HSA',
    fullName: 'Đánh giá năng lực ĐHQG Hà Nội (HSA)',
    reportTitle: 'PHIẾU BÁO ĐIỂM ĐÁNH GIÁ NĂNG LỰC HSA — THANG 150',
    totalMaxScore: 150,
    totalDurationMinutes: 195,
    sections: [
      {
        id: 'sec-hsa-quant',
        title: 'Phần 1: Toán học & Xử lý số liệu',
        questionCount: 50,
        duration_minutes: 75,
        max_score: 50,
      },
      {
        id: 'sec-hsa-lang',
        title: 'Phần 2: Ngôn ngữ - Văn học',
        questionCount: 50,
        duration_minutes: 60,
        max_score: 50,
      },
      {
        id: 'sec-hsa-science',
        title: 'Phần 3: Khoa học / Tiếng Anh',
        questionCount: 50,
        duration_minutes: 60,
        max_score: 50,
      },
    ],
  },
  THPTQG: {
    exam_type: 'THPTQG',
    fullName: 'Kỳ thi Tốt nghiệp THPT Quốc gia (THPTQG)',
    reportTitle: 'PHIẾU BÁO ĐIỂM THI THỬ TỐT NGHIỆP THPT QUỐC GIA — THANG 10',
    totalMaxScore: 10,
    totalDurationMinutes: 90,
    sections: [
      {
        id: 'sec-thpt-main',
        title: 'Bài thi môn thành phần',
        questionCount: 40,
        duration_minutes: 90,
        max_score: 10,
      },
    ],
  },
  QDA: {
    exam_type: 'QDA',
    fullName: 'Đánh giá năng lực Quân đội (QDA)',
    reportTitle: 'PHIẾU BÁO ĐIỂM ĐGNL QUÂN ĐỘI QDA — THANG 150',
    totalMaxScore: 150,
    totalDurationMinutes: 195,
    sections: [
      {
        id: 'sec-qda-quant',
        title: 'Phần 1: Toán học & Xử lý số liệu',
        questionCount: 50,
        duration_minutes: 75,
        max_score: 50,
      },
      {
        id: 'sec-qda-lang',
        title: 'Phần 2: Ngôn ngữ - Văn học',
        questionCount: 50,
        duration_minutes: 60,
        max_score: 50,
      },
      {
        id: 'sec-qda-science',
        title: 'Phần 3: Khoa học / Tiếng Anh',
        questionCount: 50,
        duration_minutes: 60,
        max_score: 50,
      },
    ],
  },
  VACT: {
    exam_type: 'VACT',
    fullName: 'Đánh giá năng lực ĐHQG TP.HCM (V-ACT)',
    reportTitle: 'PHIẾU BÁO ĐIỂM V-ACT — THANG 1200',
    totalMaxScore: 1200,
    totalDurationMinutes: 150,
    sections: [
      {
        id: 'sec-vact-lang',
        title: 'Phần 1: Sử dụng ngôn ngữ',
        questionCount: 40,
        duration_minutes: 50,
        max_score: 400,
      },
      {
        id: 'sec-vact-math',
        title: 'Phần 2: Toán học',
        questionCount: 30,
        duration_minutes: 40,
        max_score: 300,
      },
      {
        id: 'sec-vact-science',
        title: 'Phần 3: Tư duy khoa học',
        questionCount: 50,
        duration_minutes: 60,
        max_score: 500,
      },
    ],
  },
  VSAT: {
    exam_type: 'VSAT',
    fullName: 'Đánh giá đầu vào ĐH trên máy tính (V-SAT)',
    reportTitle: 'PHIẾU BÁO ĐIỂM THI V-SAT — THANG 150',
    totalMaxScore: 150,
    totalDurationMinutes: 90,
    sections: [
      {
        id: 'sec-vsat-main',
        title: 'Môn thi độc lập V-SAT',
        questionCount: 30,
        duration_minutes: 90,
        max_score: 150,
      },
    ],
  },
  BCA: {
    exam_type: 'BCA',
    fullName: 'Đánh giá tuyển sinh Bộ Công an (BCA)',
    reportTitle: 'PHIẾU BÁO KẾT QUẢ THI BỘ CÔNG AN BCA — THANG 100',
    totalMaxScore: 100,
    totalDurationMinutes: 150,
    sections: [
      {
        id: 'sec-bca-mc',
        title: 'Phần 1: Trắc nghiệm chung (Toán, Ngôn ngữ, KH/XH)',
        questionCount: 60,
        duration_minutes: 90,
        max_score: 60,
      },
      {
        id: 'sec-bca-essay',
        title: 'Phần 2: Tự luận / Giải quyết vấn đề',
        questionCount: 20,
        duration_minutes: 60,
        max_score: 40,
      },
    ],
  },
};

export function getExamFormat(examType?: ExamType): ExamFormatConfig {
  return EXAM_FORMATS[examType ?? 'TSA'] ?? EXAM_FORMATS.TSA;
}

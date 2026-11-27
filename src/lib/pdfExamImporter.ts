import { getExamFormat } from '../config/examFormats';
import type { Exam, ExamSection, ExamType, Passage, Question } from '../types/exam';
import { normalizeExamType } from '../utils/examTypes';

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Không thể đọc dữ liệu file PDF.'));
        return;
      }
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file PDF từ trình duyệt.'));
    reader.readAsDataURL(file);
  });
}

function buildExtractionPrompt(targetExamType: ExamType): string {
  const fmt = getExamFormat(targetExamType);
  const standardSectionsDesc = fmt.sections
    .map(
      (s) =>
        `  - id: "${s.id}", title: "${s.title}", duration_minutes: ${s.duration_minutes}, max_score: ${s.max_score}`
    )
    .join('\n');

  return `Bạn là chuyên gia số hóa đề thi đánh giá năng lực & tư duy Việt Nam (${fmt.fullName}).
Hãy đọc toàn bộ file PDF đính kèm và trích xuất CHÍNH XÁC 100% nội dung đề thi thành một đối tượng JSON hợp lệ theo đúng schema dưới đây.

KHUNG PHẦN THI CHUẨN CỦA KỲ THI ${targetExamType} (Thang tổng ${fmt.totalMaxScore} điểm):
${standardSectionsDesc}

YÊU CẦU BẮT BUỘC:
1. Chỉ trả về JSON thuần hợp lệ (không markdown code fence, không giải thích thừa).
2. Giữ nguyên toàn bộ công thức Toán, Vật lí, Hóa học dưới dạng KaTeX:
   - Dùng $...$ cho công thức nội dòng (inline).
   - Dùng $$...$$ cho công thức đứng riêng dòng (block).
   - Escape đúng dấu gạch chéo ngược trong JSON (ví dụ: "\\\\frac{a}{b}", "\\\\int_0^1", "\\\\sqrt{x}").
3. Tự động tách các đoạn văn đọc hiểu hoặc ngữ liệu khoa học dùng chung vào mảng "passages" với id "p1", "p2",... và gắn "passageId" tương ứng cho các câu hỏi liên quan. Câu hỏi độc lập hoặc câu Toán không có đoạn văn thì bỏ trống hoặc không gắn "passageId".
4. Nhận diện chính xác 4 dạng câu hỏi vào trường "type":
   - "single_choice": Trắc nghiệm 1 đáp án (A, B, C, D). Cần có "options": [{"id":"A","text":"..."}, ...] và "correctOption": "A".
   - "true_false": Câu Đúng/Sai nhiều ý. Cần có "statements": [{"id":"s1","text":"...","correct":true}, ...].
   - "drag_drop": Điền từ / Kéo thả chỗ trống. Trong "prompt" đặt placeholder dạng [[b1]], [[b2]]...; cần có "blanks": [{"id":"b1","correctWord":"..."}] và "wordBank": ["...", ...] (bao gồm cả từ đúng và từ nhiễu nếu có).
   - "short_answer": Trả lời ngắn / Điền số. Cần có "correctAnswers": ["..."].
5. Map các câu hỏi vào đúng tên các phần thi chuẩn trong mảng "sections" ở trên (kèm "duration_minutes" và "max_score"), và gắn "sectionId" + "section" cho mỗi câu hỏi khớp với phần thi tương ứng (nếu PDF chỉ chứa 1 phần lẻ thì chỉ giữ lại phần đó trong "sections").
6. Nếu cuối file PDF có bảng đáp án hoặc hướng dẫn giải, hãy điền chính xác đáp án đúng vào từng câu và trích xuất lời giải chi tiết vào trường "explanation" (hỗ trợ KaTeX). Nếu không có đáp án trong PDF, đặt đáp án mặc định hợp lý và ghi chú ngắn trong "explanation".

SCHEMA JSON MỤC TIÊU:
{
  "title": "Tên đề thi trích xuất từ PDF",
  "description": "Mô tả ngắn gọn nội dung đề thi",
  "exam_type": "${targetExamType}",
  "section": "Tổng hợp" | "Tư duy Toán học" | "Tư duy Đọc hiểu" | "Tư duy Khoa học",
  "duration_minutes": ${fmt.totalDurationMinutes},
  "sections": [
    { "id": "${fmt.sections[0]?.id ?? 'sec-1'}", "title": "${fmt.sections[0]?.title ?? 'Phần 1'}", "duration_minutes": ${fmt.sections[0]?.duration_minutes ?? 60}, "max_score": ${fmt.sections[0]?.max_score ?? 100} }
  ],
  "passages": [
    {
      "id": "p1",
      "section": "Tư duy Đọc hiểu",
      "title": "Tiêu đề ngữ liệu",
      "content": "Nội dung đầy đủ của ngữ liệu..."
    }
  ],
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "section": "Tư duy Toán học",
      "sectionId": "sec-1",
      "prompt": "Nội dung câu hỏi...",
      "options": [
        {"id": "A", "text": "..."},
        {"id": "B", "text": "..."},
        {"id": "C", "text": "..."},
        {"id": "D", "text": "..."}
      ],
      "correctOption": "A",
      "explanation": "Lời giải chi tiết...",
      "points": 1
    }
  ]
}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeExtractedExam(raw: any, targetExamType: ExamType): Partial<Exam> {
  const sections: ExamSection[] | undefined = Array.isArray(raw?.sections)
    ? raw.sections.map((s: Partial<ExamSection>, idx: number) => ({
        id: String(s.id || `sec-${idx + 1}`),
        title: String(s.title || `Phần ${idx + 1}`),
        duration_minutes: Math.max(5, Number(s.duration_minutes ?? 30)),
        max_score: s.max_score !== undefined ? Number(s.max_score) : undefined,
      }))
    : undefined;

  const passages: Passage[] = Array.isArray(raw?.passages)
    ? raw.passages.map((p: Partial<Passage>, idx: number) => ({
        id: String(p.id || `p${idx + 1}`),
        section: String(p.section || 'Tư duy Đọc hiểu'),
        title: String(p.title || `Ngữ liệu ${idx + 1}`),
        content: String(p.content || ''),
      }))
    : [];

  const questions: Question[] = Array.isArray(raw?.questions)
    ? raw.questions.map((q: Partial<Question>, idx: number) => {
        const type =
          q.type === 'single_choice' ||
          q.type === 'true_false' ||
          q.type === 'drag_drop' ||
          q.type === 'short_answer'
            ? q.type
            : 'single_choice';

        return {
          id: String(q.id || `q_${Date.now().toString(36)}_${idx + 1}`),
          type,
          section: String(q.section || 'Tư duy Toán học'),
          sectionId: q.sectionId ? String(q.sectionId) : undefined,
          passageId: q.passageId ? String(q.passageId) : undefined,
          prompt: String(q.prompt || ''),
          options: Array.isArray(q.options) ? q.options : undefined,
          correctOption: q.correctOption ? String(q.correctOption) : undefined,
          statements: Array.isArray(q.statements) ? q.statements : undefined,
          wordBank: Array.isArray(q.wordBank) ? q.wordBank : undefined,
          blanks: Array.isArray(q.blanks) ? q.blanks : undefined,
          correctAnswers: Array.isArray(q.correctAnswers)
            ? q.correctAnswers.map(String)
            : undefined,
          placeholder: q.placeholder ? String(q.placeholder) : undefined,
          explanation: q.explanation ? String(q.explanation) : '',
          points: Number(q.points ?? 1),
        };
      })
    : [];

  return {
    title: String(raw?.title || 'Đề thi trích xuất từ PDF'),
    description: String(raw?.description || 'Đề thi được bóc tách tự động bởi Gemini AI'),
    exam_type: normalizeExamType(raw?.exam_type ?? targetExamType),
    section: String(raw?.section || 'Tổng hợp'),
    duration_minutes: Math.max(5, Number(raw?.duration_minutes ?? 60)),
    sections,
    passages,
    questions,
  };
}

export async function extractExamFromPdf(params: {
  file: File;
  apiKey: string;
  targetExamType: ExamType;
}): Promise<Partial<Exam>> {
  const { file, apiKey, targetExamType } = params;

  if (!apiKey.trim()) {
    throw new Error('Vui lòng nhập Gemini API Key.');
  }
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Chỉ hỗ trợ định dạng file .pdf.');
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error('Dung lượng file PDF vượt quá giới hạn tối đa 20MB.');
  }

  const base64Data = await fileToBase64(file);

  const response = await fetch(
    `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey.trim())}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: base64Data,
                },
              },
              {
                text: buildExtractionPrompt(targetExamType),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    const errMsg =
      errBody?.error?.message || `Gemini API trả về lỗi HTTP ${response.status}`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  const rawText: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini không trả về nội dung JSON hợp lệ.');
  }

  let parsed: unknown;
  try {
    const cleaned = rawText
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Không thể phân tích JSON trả về từ Gemini. Vui lòng thử lại.');
  }

  const exam = sanitizeExtractedExam(parsed, targetExamType);
  if (!exam.questions || exam.questions.length === 0) {
    throw new Error('AI không tìm thấy câu hỏi nào trong file PDF này.');
  }

  return exam;
}

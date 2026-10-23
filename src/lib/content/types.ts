/**
 * Mô hình nội dung bài tập. Dùng chung cho mọi kiểu câu hỏi và mọi game mini:
 * component chỉ cần một mảng Exercise, không biết nội dung đến từ đâu (tệp, Supabase...).
 * Mỗi kiểu câu hỏi mới = thêm một biến thể vào `Exercise`, không sửa các biến thể cũ.
 */
export type Language = "en" | "ja" | "zh" | "ko"

/** Thang năng lực. Giá trị cụ thể của từng thang sẽ được kiểm chứng ở giai đoạn 3 của ROADMAP. */
export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"

interface ExerciseBase {
  id: string
  language: Language
  /** Cấp CEFR của riêng câu này. Bản nhập từ bản cũ chưa có (sẽ gắn ở giai đoạn 3 của lộ trình) */
  level?: Level
  /** Chủ điểm, ví dụ "present-simple". Dùng cho phân tích lỗi theo chủ điểm */
  topic: string
  /** Mục lý thuyết (usage) mà câu này luyện; dùng để dẫn về đúng chỗ khi trả lời sai. Phải trùng `GrammarUsage.id` của chuyên đề */
  usageId?: string
  /** Nhãn lỗi chi tiết hơn chủ điểm, dùng để gợi ý ôn lại */
  tags: string[]
  /** 1 = dễ, 3 = khó (chế độ thử thách) */
  difficulty: 1 | 2 | 3
}

export interface McqExercise extends ExerciseBase {
  kind: "mcq"
  /** Tiêu đề kiểu bài, ví dụ "Điền từ vào chỗ trống" */
  title?: string
  /** Đề bài. Chỗ trống dùng "____" */
  prompt: string
  choices: string[]
  correctIndex: number
  /** Giải thích chung. Dùng khi không có giải thích riêng từng đáp án */
  explanation: string
  /** Giải thích riêng cho từng đáp án (cùng độ dài với choices), nếu có */
  choiceExplanations?: string[]
}

export type Exercise = McqExercise

export interface AnswerRecord {
  exerciseId: string
  correct: boolean
  /** Chỉ số đáp án đã chọn (mcq) */
  choiceIndex: number
}

// ---------------------------------------------------------------------------
// Lý thuyết ngữ pháp (khu "Học")
// ---------------------------------------------------------------------------

export type GrammarCategory = "tenses" | "word-classes" | "sentence-structure"

export interface GrammarExample {
  en: string
  vi: string
}

/** Một cách dùng của chuyên đề. `id` là nhãn ổn định, được bài tập tham chiếu qua `usageId`. */
export interface GrammarUsage {
  id: string
  label: string
  explanationVi: string
  examples: GrammarExample[]
}

/** Một lỗi thường gặp: mô tả lỗi, các cặp ví dụ sai/đúng và giải thích. Có thể chỉ có mô tả (chưa có ví dụ). */
export interface GrammarMistake {
  id: string
  description?: string
  examples: { wrong: string; correct: string }[]
  note?: string
}

export interface GrammarTheory {
  usages: GrammarUsage[]
  /** Công thức theo dạng câu (khẳng định, phủ định, nghi vấn...). Một số chuyên đề chưa có */
  formulas?: Record<string, string>
  signalWords: { word: string; meaningVi: string }[]
  commonMistakes: GrammarMistake[]
}

/** Thông tin ngắn của chuyên đề, dùng cho danh sách/lộ trình. */
export interface GrammarTopicMeta {
  id: string
  title: string
  /** Một chuyên đề có thể trải nhiều cấp, ví dụ ["A1", "A2"] */
  levels: Level[]
  /** Thứ tự gợi ý trong lộ trình */
  order: number
  category: GrammarCategory
  usageCount: number
}

export interface GrammarTopic extends Omit<GrammarTopicMeta, "usageCount"> {
  language: Language
  theory: GrammarTheory
}

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
  level: Level
  /** Chủ điểm, ví dụ "present-simple". Dùng cho phân tích lỗi theo chủ điểm */
  topic: string
  /** Nhãn lỗi chi tiết hơn chủ điểm, dùng để gợi ý ôn lại */
  tags: string[]
  /** 1 = dễ, 3 = khó (chế độ thử thách) */
  difficulty: 1 | 2 | 3
}

export interface McqExercise extends ExerciseBase {
  kind: "mcq"
  /** Tiêu đề kiểu bài, ví dụ "Điền từ vào chỗ trống" */
  title: string
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

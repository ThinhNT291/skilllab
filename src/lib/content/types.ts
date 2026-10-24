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

/** Nội dung thẻ ôn tập dựng sẵn từ câu gốc. Câu biến thể (sắp xếp, gõ, nghe chép) mang theo để sai thì vẫn tạo đúng một thẻ cho câu gốc. */
export interface CardSource {
  /** Mã câu gốc (dùng làm khóa chống trùng thẻ) */
  key: string
  front: string
  answer: string
  filled: string | null
  explanation: string
}

/** Sắp xếp các từ thành câu đúng. Sinh từ câu trắc nghiệm gốc (xem lib/content/derive.ts). */
export interface ReorderExercise extends ExerciseBase {
  kind: "reorder"
  prompt: string
  /** Các từ đã xáo, hiện cho người học chọn */
  pool: string[]
  /** Thứ tự đúng */
  answerWords: string[]
  explanation: string
  card: CardSource
}

/** Tự gõ đáp án vào chỗ trống. Sinh từ câu trắc nghiệm gốc. */
export interface TypedExercise extends ExerciseBase {
  kind: "typed"
  prompt: string
  /** Các đáp án được chấp nhận (đã gồm dạng viết tắt/đầy đủ như doesn't / does not) */
  answers: string[]
  explanation: string
  card: CardSource
}

/** Nghe câu rồi gõ lại. Sinh từ câu hoàn chỉnh của câu trắc nghiệm gốc. */
export interface DictationExercise extends ExerciseBase {
  kind: "dictation"
  /** Câu được đọc to và là đáp án */
  text: string
  answers: string[]
  explanation: string
  card: CardSource
}

/** Tìm từ sai trong câu: câu bị điền một đáp án sai, người học chạm vào chỗ sai. Sinh từ câu trắc nghiệm gốc. */
export interface SpotExercise extends ExerciseBase {
  kind: "spot"
  prompt: string
  words: string[]
  /** Khoảng chỉ số từ chứa lỗi (gồm cả hai đầu) */
  errorFrom: number
  errorTo: number
  /** Câu đúng, hiện sau khi trả lời */
  correctSentence: string
  /** Vì sao chỗ đó sai (lấy từ lời giải thích của đáp án sai gốc) */
  explanation: string
  card: CardSource
}

export type Exercise = McqExercise | ReorderExercise | TypedExercise | DictationExercise | SpotExercise

export interface AnswerRecord {
  exerciseId: string
  correct: boolean
  /** Chỉ số đáp án đã chọn (chỉ với trắc nghiệm) */
  choiceIndex?: number
  /** Nội dung người học nhập/sắp xếp (các kiểu khác trắc nghiệm) */
  response?: string
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
  /** Cấp CEFR định hướng của mục này (chưa kiểm chứng với nguồn chính thức, không hiển thị cho người học). Mới gắn cho một số mục */
  level?: Level
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

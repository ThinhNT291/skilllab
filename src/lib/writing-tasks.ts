import type { Skill } from "./rubric.ts"

export interface SpeechTask {
  id: string
  bac: number
  /** Số từ gợi ý tối thiểu (bài viết) hoặc số giây nói gợi ý (bài nói) */
  hint: number
  prompt: string
}

/** Đề tự soạn, bám mô tả năng lực theo bậc (A1–B2 = Bậc 1–4). Bậc chỉ để chọn độ khó của đề. */
export const TASKS: Record<Skill, SpeechTask[]> = {
  writing: [
    { id: "w-me", bac: 1, hint: 30, prompt: "Introduce yourself: your name, your age, where you live, and one thing you like." },
    { id: "w-family", bac: 1, hint: 35, prompt: "Write about your family. Who is in your family and what do they do?" },
    { id: "w-day", bac: 2, hint: 50, prompt: "Describe a normal school day. What do you do in the morning, at school, and in the evening?" },
    { id: "w-weekend", bac: 2, hint: 50, prompt: "What did you do last weekend? Write about two or three things." },
    { id: "w-friend", bac: 2, hint: 60, prompt: "Describe your best friend. What does he or she look like, and why do you like him or her?" },
    { id: "w-invite", bac: 3, hint: 70, prompt: "Write an email to a friend. Invite him or her to your birthday party. Say when and where it is and what you will do." },
    { id: "w-hobby", bac: 3, hint: 80, prompt: "Write about a hobby you enjoy. When did you start it, and why do you like it?" },
    { id: "w-future", bac: 3, hint: 80, prompt: "What do you want to be in the future, and what will you do to reach this goal?" },
    { id: "w-phones", bac: 4, hint: 100, prompt: "Some people think students should not bring phones to school. Do you agree or disagree? Give reasons and examples." },
    { id: "w-travel", bac: 4, hint: 100, prompt: "Describe a trip you remember well. Where did you go, what happened, and how did you feel?" },
  ],
  speaking: [
    { id: "s-me", bac: 1, hint: 20, prompt: "Tell me about yourself: your name, your age, and what you like." },
    { id: "s-food", bac: 1, hint: 20, prompt: "What is your favorite food? Why do you like it?" },
    { id: "s-day", bac: 2, hint: 30, prompt: "Talk about what you do on a normal school day." },
    { id: "s-weekend", bac: 2, hint: 30, prompt: "What did you do last weekend?" },
    { id: "s-place", bac: 3, hint: 45, prompt: "Describe a place you like to visit. Where is it, and what do you do there?" },
    { id: "s-hobby", bac: 3, hint: 45, prompt: "Talk about a hobby. When did you start it and why do you enjoy it?" },
    { id: "s-opinion", bac: 4, hint: 60, prompt: "Do you think students should have homework every day? Give your opinion and reasons." },
    { id: "s-memory", bac: 4, hint: 60, prompt: "Talk about a happy memory. What happened and how did you feel?" },
  ],
}

export function tasksFor(skill: Skill, maxBac: number): SpeechTask[] {
  return TASKS[skill].filter((t) => t.bac <= maxBac)
}

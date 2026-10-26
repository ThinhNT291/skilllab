/**
 * Lời nhắc sinh và phản biện bài đọc/nghe (khuôn ở docs/prompt-sinh-noi-dung.md mục 10.4). Có phiên bản để so sánh về sau.
 * Hàm thuần: nhận dữ liệu, trả chuỗi.
 */
export const PASSAGE_PROMPT_VERSION = "passages-v1"

export interface PassageInput {
  kind: "reading" | "listening"
  bac: number
  cefr: string
  genre: string
  topic: string
  minWords: number
  maxWords: number
  avgSentence: number
  allowedGrammar: string
  forbiddenGrammar: string
  usedTopics: string[]
  questionMix: string
}

/** Quy tắc ngữ pháp được phép / cấm theo bậc: điểm khởi đầu, đối chiếu thêm với English Grammar Profile khi duyệt. */
export const GRAMMAR_BY_BAC: Record<number, { allowed: string; forbidden: string; avgSentence: number }> = {
  1: { allowed: "present simple, present continuous, can, there is/are, simple past of very common verbs", forbidden: "passive voice, relative clauses, perfect tenses, idioms", avgSentence: 7 },
  2: { allowed: "present and past simple, present continuous, going to, will, comparatives, simple conjunctions (and, but, because, so)", forbidden: "passive voice (except fixed phrases), conditionals, reported speech, idioms", avgSentence: 10 },
  3: { allowed: "all common tenses incl. present perfect, first conditional, simple relative clauses, modals of obligation and advice, simple passive", forbidden: "inversion, mixed conditionals, participle clauses, rare idioms", avgSentence: 13 },
  4: { allowed: "passive, second/third conditional, reported speech, relative clauses, modals of deduction, linking words (although, however)", forbidden: "inversion for emphasis, advanced ellipsis, very rare idioms", avgSentence: 16 },
  5: { allowed: "participle clauses, inversion, cleft sentences, mixed conditionals, hedging, abstract nouns, natural collocations", forbidden: "archaic or highly literary structures", avgSentence: 19 },
  6: { allowed: "full range incl. complex noun phrases, subtle register shifts, advanced linking, nuanced modality", forbidden: "nothing; keep it natural and correct", avgSentence: 22 },
}

export function buildPassagePrompt(i: PassageInput): string {
  const reading = i.kind === "reading"
  const content = reading
    ? `GENRE: ${i.genre}. Engaging text with a real story, feeling or surprise, written for the eye.`
    : `GENRE: ${i.genre}. Write FOR THE EAR, not the eye: sentences shorter than written prose, few nested clauses, natural spoken style (from Bậc 3 you may use light fillers such as "well", "you know", "so" but do not overuse them). If it is a dialogue, EVERY line starts with a speaker label ("Anna:", "Tom:") and there are at least two different speakers; a monologue has no labels. Key information must be spoken once clearly, then PARAPHRASED in the answer options (never repeat the exact words of the recording in the correct option).`
  return `You are an experienced EFL materials writer. Write ONE ${i.kind} ${reading ? "passage" : "script"} for Vietnamese students aged 9–15 at Bậc ${i.bac} of the Vietnamese 6-level framework = CEFR ${i.cefr}. American English. Original text only.
${content}
TOPIC: ${i.topic}  (topics already used at this level, do not repeat: ${i.usedTopics.join("; ") || "none"})
LENGTH: ${i.minWords}–${i.maxWords} words.
LEVEL CONTROL: at least 95% of the running words must be at or below CEFR ${i.cefr} (English Vocabulary Profile); the rest are proper names or words the context makes clear. Average sentence length about ${i.avgSentence} words. Allowed grammar: ${i.allowedGrammar}. NOT allowed: ${i.forbiddenGrammar}. If unsure whether a word is too hard, use a simpler word.
CONTENT RULES: suitable for children; no violence, romance, politics, brands or real people. Real-world facts (dates, numbers, places) must be correct and widely known; list each fact in "facts". No markdown in the text.
QUESTIONS: write exactly 4 questions in this mix: ${i.questionMix}.
- Four-option questions (type detail | main_idea | inference | vocab | attitude): the correct option PARAPHRASES the text; each wrong option is plausible and uses words from the text but is clearly wrong; exactly one option is correct. PUT THE CORRECT OPTION FIRST (index 0); the system shuffles. Give "evidence": an exact short quote from the text that proves the answer.
- True/False/Not given (type tfng): question starts "True, False, or Not given?" then a statement; give "answer" as "True", "False" or "Not given". True/False need an exact "evidence" quote; Not given must truly not be inferable (no evidence). At most 2 per text.
- choiceExplanations: Vietnamese strings, one per option in the same order ("Đúng —" for the correct option, "Sai —" for each wrong one, then why). For tfng exactly three, in the order True, False, Not given.
- explanation: 1–2 Vietnamese sentences with the reason and, where useful, the sentence in the text.
Return ONLY JSON: {"title":"short English title","genre":"","text":"","facts":[],"intendedBac":0,"questions":[{"type":"detail","question":"","choices":["correct","wrong1","wrong2","wrong3"],"choiceExplanations":["","","",""],"explanation":"","evidence":"exact quote from the text"},{"type":"tfng","question":"True, False, or Not given? …","answer":"Not given","choiceExplanations":["","",""],"explanation":"","evidence":null}]}`
}

export interface PassageReviewItem {
  id: string
  text: string
  questions: { question: string; choices: string[] }[]
}

/** Giải mù: trả lời câu hỏi CHỈ dựa vào đoạn, không thấy đáp án hay lời giải. */
export function buildPassageReviewPrompt(items: PassageReviewItem[], kind: "reading" | "listening", bac: number): string {
  const body = items
    .map((it) => `### ${it.id}\n${it.text}\n${it.questions.map((q, k) => `Q${k + 1}. ${q.question}\n${q.choices.map((c, j) => `   ${"ABCD"[j]}. ${c}`).join("\n")}`).join("\n")}`)
    .join("\n\n")
  return `You are a strict English teacher checking comprehension items for Vietnamese students (Bậc ${bac}). Answer every question using ONLY the ${kind === "reading" ? "passage" : "recording script"} given; do not use outside knowledge. For each question return the 0-based indexes of ALL options that the text supports as correct (usually exactly one), plus issues.
${body}
Return ONLY JSON: [{"id":"","answers":[{"q":1,"acceptableIndexes":[],"issues":[],"note":""}],"naturalness":0,"levelFit":0,"overallIssues":[]}] where issues/overallIssues use: ambiguity, not_in_text, multiple_correct, unnatural, wrong_level, off_topic, age_unsuitable, factual_error; naturalness and levelFit are 1–5.`
}

export interface PassageVerdict {
  id: string
  answers: { q: number; acceptableIndexes: number[]; issues: string[] }[]
  naturalness: number
  levelFit: number
  overallIssues: string[]
}

/** Giữ bài khi giải mù chọn ĐÚNG đáp án đúng ở mọi câu và chỉ đáp án đó, bài tự nhiên, vừa bậc, không có vấn đề nặng. */
export function passesPassageReview(v: PassageVerdict | undefined, correctIndexes: number[]): { pass: boolean; why: string[] } {
  if (!v) return { pass: false, why: ["không có kết quả phản biện"] }
  const why: string[] = []
  correctIndexes.forEach((ci, k) => {
    const a = v.answers.find((x) => x.q === k + 1)
    const set = [...new Set(a?.acceptableIndexes ?? [])].sort()
    if (set.length !== 1 || set[0] !== ci) why.push(`câu ${k + 1}: giải mù chọn [${set.join(",")}] khác đáp án đúng [${ci}]`)
    const serious = (a?.issues ?? []).filter((i) => ["ambiguity", "not_in_text", "multiple_correct", "factual_error"].includes(i))
    if (serious.length) why.push(`câu ${k + 1}: ${serious.join(", ")}`)
  })
  if (v.naturalness < 4) why.push(`độ tự nhiên ${v.naturalness} < 4`)
  if (v.levelFit < 3) why.push(`độ vừa bậc ${v.levelFit} < 3`)
  const serious = v.overallIssues.filter((i) => ["unnatural", "wrong_level", "off_topic", "age_unsuitable", "factual_error"].includes(i))
  if (serious.length) why.push(`vấn đề: ${serious.join(", ")}`)
  return { pass: why.length === 0, why }
}

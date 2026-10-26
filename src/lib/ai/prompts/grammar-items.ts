/**
 * Lời nhắc sinh và phản biện câu ngữ pháp trắc nghiệm (khuôn ở docs/prompt-sinh-noi-dung.md mục 4–5). Có phiên bản để so sánh về sau.
 * Hàm thuần: nhận dữ liệu, trả chuỗi. Không gọi mạng.
 */
export const GRAMMAR_ITEMS_PROMPT_VERSION = "grammar-items-v1"

export interface UsageInfo {
  id: string
  label: string
  explanationVi: string
  examples: { en: string; vi: string }[]
}

export interface GenerationInput {
  topicTitle: string
  bac: number
  cefr: string
  usages: UsageInfo[]
  commonMistakes: string[]
  existingPrompts: string[]
  count: number
  difficultyPlan: string
}

export function buildGenerationPrompt(i: GenerationInput): string {
  const usages = i.usages.map((u) => `- ${u.id} | ${u.label} | ${u.explanationVi} | e.g. ${u.examples.slice(0, 2).map((e) => e.en).join(" / ")}`).join("\n")
  const mistakes = i.commonMistakes.map((m) => `- ${m}`).join("\n") || "- (none listed)"
  const existing = i.existingPrompts.slice(0, 40).map((p) => `- ${p}`).join("\n") || "- (none)"
  return `You are an experienced EFL item writer and teacher writing multiple-choice grammar items for Vietnamese students aged 9–15 (grades 4–9). Use American English. Write ORIGINAL sentences; never copy from textbooks or exams.

TOPIC: ${i.topicTitle}
TARGET LEVEL: Bậc ${i.bac} of the Vietnamese 6-level framework = CEFR ${i.cefr}.
TAUGHT POINTS you may test (each item must test exactly ONE of these and nothing else):
${usages}
TYPICAL MISTAKES of Vietnamese learners on this topic (use them to design distractors):
${mistakes}
ALREADY IN THE BANK (do not repeat the same sentence or the same context):
${existing}

Write ${i.count} items. For each item:
1. Test ONE taught point (usageId). Do not test anything outside the list above.
2. One sentence, 8–22 words, one blank written exactly "______" (never ** or _). Natural, realistic context (school, family, hobbies, travel, animals, technology, food, sports). Vary names and contexts across items. No real people, brands, politics, violence, romance, or other topics unsuitable for children.
3. Vocabulary outside the target point must be at or below CEFR ${i.cefr}.
4. A learner who knows the rule must be able to decide from the sentence alone. Include a cue (time word, subject, meaning) that makes exactly ONE option correct. No trick punctuation, no spelling traps, no negative stems ("Which is NOT…").
5. Exactly four options, grammatically parallel and of similar length. PUT THE CORRECT OPTION FIRST (index 0); the system will shuffle. Never use "all of the above" or "none of the above".
6. Each of the three wrong options must (a) be a plausible mistake a Vietnamese learner really makes, and (b) be CLEARLY wrong in THIS sentence. If a wrong option could be acceptable in natural English, rewrite the item. Label each wrong option with ONE distractorType: wrong_tense | agreement | wrong_form | wrong_word | l1_transfer | overgeneralisation | word_order | missing_word.
7. choiceExplanations: four short Vietnamese strings, in the same order as choices. Start the correct one with "Đúng —" and each wrong one with "Sai —", then say WHY (the rule or the cue in the sentence). Vietnamese a 12-year-old understands.
8. explanation: 1–2 Vietnamese sentences with the rule, naming the cue word if any.
9. Difficulty plan: ${i.difficultyPlan}. easy = one clear cue, common word; hard = longer sentence, subtle cue, or a contrast with a similar point.
10. selfCheck: set "oneAcceptable": true only if you are sure exactly one option is acceptable; otherwise rewrite the item.

Return ONLY JSON: {"items":[{"usageId":"","intendedBac":0,"difficultyHint":1,"prompt":"","choices":["correct","wrong1","wrong2","wrong3"],"distractorTypes":["","",""],"choiceExplanations":["","","",""],"explanation":"","selfCheck":{"oneAcceptable":true}}]}`
}

export interface ReviewItem {
  id: string
  prompt: string
  /** Đã xáo bằng mã, KHÔNG kèm đáp án */
  choices: string[]
}

/** Lời nhắc "giải mù": mô hình tự quyết đáp án nào chấp nhận được, không thấy đáp án hay lời giải. */
export function buildReviewPrompt(items: ReviewItem[], bac: number): string {
  const list = items.map((it) => `${it.id} | ${it.prompt} | ${it.choices.map((c, k) => `${"ABCD"[k]}. ${c}`).join("  ")}`).join("\n")
  return `You are a strict English teacher checking exam items. For each item below, decide independently which options are acceptable in natural American English in the given sentence. Items:
${list}
For each item return: acceptableIndexes (0-based indexes of ALL options that are grammatically AND naturally acceptable), naturalness (1–5 for the sentence), levelFit (1–5: suits students at Bậc ${bac} of the Vietnamese 6-level framework), issues (list: ambiguity, unnatural, wrong_cue, off_topic, age_unsuitable, other) and a one-line note. Return ONLY JSON: [{"id":"","acceptableIndexes":[],"naturalness":0,"levelFit":0,"issues":[],"note":""}]`
}

export interface ReviewVerdict {
  id: string
  acceptableIndexes: number[]
  naturalness: number
  levelFit: number
  issues: string[]
}

/** Giữ câu khi người giải mù chọn ĐÚNG đáp án đúng và không chọn gì khác, câu tự nhiên, vừa bậc, không có vấn đề nặng. */
export function passesReview(v: ReviewVerdict | undefined, correctIndex: number): { pass: boolean; why: string[] } {
  if (!v) return { pass: false, why: ["không có kết quả phản biện"] }
  const why: string[] = []
  const set = [...new Set(v.acceptableIndexes)].sort()
  if (set.length !== 1 || set[0] !== correctIndex) why.push(`giải mù chọn [${set.join(",")}] khác đáp án đúng [${correctIndex}]`)
  if (v.naturalness < 4) why.push(`độ tự nhiên ${v.naturalness} < 4`)
  if (v.levelFit < 3) why.push(`độ vừa bậc ${v.levelFit} < 3`)
  const serious = v.issues.filter((i) => ["ambiguity", "unnatural", "wrong_cue", "off_topic", "age_unsuitable"].includes(i))
  if (serious.length) why.push(`vấn đề: ${serious.join(", ")}`)
  return { pass: why.length === 0, why }
}

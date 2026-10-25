"use client"

import Link from "next/link"
import type { Exercise } from "@/lib/content/types"
import { analyzeWrong, type RuleHints } from "@/lib/content/rule-hints"

/**
 * Nhận xét có cấu trúc khi trả lời sai: vì sao sai → quy tắc liên quan → lỗi thường gặp → nên ôn tiếp gì.
 * Hiện bên dưới phần giải thích từng đáp án; chỉ hiện khi câu thuộc một mục lý thuyết đã biết.
 */
export function WrongFeedback({ ex, choiceIndex, rules, theoryHref, practiceBase, repeat = 1 }: { ex: Exercise; choiceIndex?: number; rules: RuleHints; theoryHref?: string | null; practiceBase?: string; repeat?: number }) {
  const a = analyzeWrong(ex, choiceIndex, rules)
  if (!a.rule) return null
  return (
    <div className="mt-3 space-y-2 rounded-game border-2 border-border bg-card p-3 text-base" aria-label="Phân tích lỗi sai">
      <p className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">Phân tích</p>
      {repeat >= 2 && (
        <p className="rounded-game bg-success-soft px-3 py-2 font-extrabold" role="note">
          Mục này đã gặp {repeat} lần trong lượt này. Không sao cả, đây chính là chỗ cần luyện thêm: đọc kỹ quy tắc dưới đây rồi luyện riêng vài câu nhé.
        </p>
      )}
      <p>
        <span className="font-extrabold text-danger">Vì sao sai: </span>
        {a.why}
      </p>
      <div>
        <p className="font-extrabold">Quy tắc liên quan: {a.rule.label}</p>
        <p className="text-muted-foreground">{a.rule.explanationVi}</p>
        {a.rule.example && (
          <p className="mt-1" lang="en">
            <span className="text-muted-foreground">Ví dụ: </span>
            {a.rule.example.en} <span className="text-muted-foreground">({a.rule.example.vi})</span>
          </p>
        )}
      </div>
      {a.mistake && (
        <p>
          <span className="font-extrabold">Lỗi hay gặp: </span>
          {a.mistake.description && <span className="text-muted-foreground">{a.mistake.description} </span>}
          <span className="line-through" lang="en">
            {a.mistake.wrong}
          </span>{" "}
          → <strong lang="en">{a.mistake.correct}</strong>
        </p>
      )}
      <p className="flex flex-wrap gap-3 font-extrabold">
        {theoryHref && (
          <Link href={theoryHref} target="_blank" className="text-primary underline underline-offset-4">
            Xem lại lý thuyết
          </Link>
        )}
        {(a.rule.topicId ? `/hoc/${a.rule.topicId}` : practiceBase) && ex.usageId && (
          <Link href={`${a.rule.topicId ? `/hoc/${a.rule.topicId}` : practiceBase}/luyen-tap?tag=${encodeURIComponent(ex.usageId)}`} className="text-primary underline underline-offset-4">
            Nên ôn tiếp: luyện riêng mục này
          </Link>
        )}
      </p>
    </div>
  )
}

/** Gợi ý trước khi cho thử lại (chế độ "gợi ý rồi thử lại"): nhắc quy tắc, chưa lộ đáp án. */
export function RetryHint({ ex, rule }: { ex: Exercise; rule?: RuleHints[string] }) {
  return (
    <div role="status" className="mt-4 rounded-game border-2 border-accent bg-background p-3">
      <p className="font-extrabold">💡 Chưa đúng. Đọc gợi ý rồi thử lại một lần nhé (lần đầu vẫn được ghi để ôn).</p>
      {rule ? (
        <div className="mt-1 text-base">
          <p className="font-extrabold">{rule.label}</p>
          <p className="text-muted-foreground">{rule.explanationVi}</p>
          {rule.example && (
            <p className="mt-1" lang="en">
              {rule.example.en} <span className="text-muted-foreground">({rule.example.vi})</span>
            </p>
          )}
        </div>
      ) : (
        <p className="mt-1 text-muted-foreground">Đọc lại đề thật chậm và kiểm tra từng từ.</p>
      )}
      {ex.kind === "typed" && <p className="mt-1 text-sm text-muted-foreground">Gợi ý: đáp án có {ex.answers[0].trim().split(/\s+/).length} từ.</p>}
    </div>
  )
}

/** Cuối lượt: các mục lý thuyết đã sai trong lượt, kèm liên kết luyện riêng (tối đa 3). */
export function ReviewNext({ usages, rules, practiceBase }: { usages: string[]; rules: RuleHints; practiceBase: string }) {
  const counts = new Map<string, number>()
  for (const u of usages) if (rules[u]) counts.set(u, (counts.get(u) ?? 0) + 1)
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3)
  if (!top.length) return null
  return (
    <div className="mt-3 rounded-game border-2 border-border bg-background p-3 text-left">
      <p className="font-extrabold">Nên ôn tiếp</p>
      <ul className="mt-1 space-y-1">
        {top.map(([id, n]) => (
          <li key={id}>
            <Link href={`${rules[id].topicId ? `/hoc/${rules[id].topicId}` : practiceBase}/luyen-tap?tag=${encodeURIComponent(id)}`} className="text-primary underline underline-offset-4">
              {rules[id].label}
            </Link>{" "}
            <span className="text-sm text-muted-foreground">({n} câu)</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

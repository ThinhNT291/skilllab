"use client"

import Link from "next/link"
import type { Exercise } from "@/lib/content/types"
import { analyzeWrong, type RuleHints } from "@/lib/content/rule-hints"

/**
 * Nhận xét có cấu trúc khi trả lời sai: vì sao sai → quy tắc liên quan → lỗi thường gặp → nên ôn tiếp gì.
 * Hiện bên dưới phần giải thích từng đáp án; chỉ hiện khi câu thuộc một mục lý thuyết đã biết.
 */
export function WrongFeedback({ ex, choiceIndex, rules, theoryHref, practiceBase }: { ex: Exercise; choiceIndex?: number; rules: RuleHints; theoryHref?: string | null; practiceBase?: string }) {
  const a = analyzeWrong(ex, choiceIndex, rules)
  if (!a.rule) return null
  return (
    <div className="mt-3 space-y-2 rounded-game border-2 border-border bg-card p-3 text-base" aria-label="Phân tích lỗi sai">
      <p className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">Phân tích</p>
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
        {practiceBase && ex.usageId && (
          <Link href={`${practiceBase}/luyen-tap?tag=${encodeURIComponent(ex.usageId)}`} className="text-primary underline underline-offset-4">
            Nên ôn tiếp: luyện riêng mục này
          </Link>
        )}
      </p>
    </div>
  )
}

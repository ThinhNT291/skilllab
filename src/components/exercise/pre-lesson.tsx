"use client"

import { useState } from "react"
import Link from "next/link"
import type { RuleHint, WarmupItem } from "@/lib/content/rule-hints"

const PRIMARY = "rounded-game border-b-[5px] border-primary-deep bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
const GHOST = "rounded-game border-2 border-border bg-card px-4 py-3 font-extrabold hover:border-primary"

/**
 * Bước dạy trước khi làm bài: nhắc nhanh các quy tắc sắp gặp và vài ví dụ "che từ đích" (đoán rồi bấm xem).
 * `required`: bài kiểm tra bắt buộc đi qua bước này; luyện tập thường cho bỏ qua.
 */
export function PreLesson({ rules, warmup, topicHref, required, children }: { rules: RuleHint[]; warmup: WarmupItem[]; topicHref: string; required?: boolean; children: React.ReactNode }) {
  const [started, setStarted] = useState(false)
  const [shown, setShown] = useState<Record<number, boolean>>({})
  if (started || (rules.length === 0 && warmup.length === 0)) return <>{children}</>

  return (
    <section aria-labelledby="pre-heading" className="space-y-4 rounded-game border-2 border-primary bg-card p-4">
      <h2 id="pre-heading" className="text-xl font-extrabold">
        {required ? "Ôn nhanh trước khi kiểm tra" : "Ôn nhanh 1 phút trước khi làm"}
      </h2>
      {rules.length > 0 && (
        <ul className="space-y-3">
          {rules.map((r) => (
            <li key={r.id}>
              <p className="font-extrabold">{r.label}</p>
              <p className="text-sm text-muted-foreground">{r.explanationVi}</p>
              {r.example && (
                <p className="mt-0.5 text-sm" lang="en">
                  {r.example.en} <span className="text-muted-foreground">({r.example.vi})</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {warmup.length > 0 && (
        <div>
          <p className="mb-1 font-extrabold">Thử đoán từ còn thiếu</p>
          <ul className="space-y-2">
            {warmup.map((w, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <span lang="en" className="text-lg">
                  {shown[i] ? w.sentence.replace(/_{2,}/, w.answer) : w.sentence}
                </span>
                {shown[i] ? (
                  <span aria-hidden="true">✅</span>
                ) : (
                  <button type="button" className="rounded-full border-2 border-border px-3 py-0.5 text-sm font-extrabold hover:border-primary" onClick={() => setShown((s) => ({ ...s, [i]: true }))}>
                    Xem từ
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={PRIMARY} onClick={() => setStarted(true)}>
          {required ? "Tôi đã sẵn sàng, bắt đầu" : "Bắt đầu làm bài"}
        </button>
        <Link href={topicHref} target="_blank" className={GHOST}>
          Đọc lý thuyết đầy đủ
        </Link>
      </div>
    </section>
  )
}

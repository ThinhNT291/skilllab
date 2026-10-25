"use client"

import Link from "next/link"
import { bacLabel } from "@/lib/content/bac"
import type { Bac } from "@/lib/content/types"
import { candoFor } from "@/lib/content/cando"
import { CATEGORY_LABEL, CRITERIA, DESCRIPTORS, MAX_PER_CRITERION, type Feedback, type Skill } from "@/lib/rubric"
import { paceNote, type SpeakingMetrics, type WritingMetrics } from "@/lib/grading/metrics"

export type Metrics = ({ kind: "writing" } & WritingMetrics) | ({ kind: "speaking" } & SpeakingMetrics)
export type TagInfoMap = Record<string, { label: string; topicId: string; topicTitle: string }>

const bacText = (n: number) => (n <= 0 ? "Dưới Bậc 1" : bacLabel(n as Bac))
const H = "mb-2 text-lg font-extrabold"
const CARD = "rounded-game border-2 border-border bg-background p-4"

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-border" aria-hidden="true">
      <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${(value / max) * 100}%` }} />
    </div>
  )
}

/** Báo cáo chấm điểm: điểm từng tiêu chí kèm bằng chứng, ưu tiên cải thiện, lỗi có phân loại, số liệu đo được và kế hoạch luyện. */
export function GradeReport({ skill, feedback: f, metrics, tagInfo, saveNote }: { skill: Skill; feedback: Feedback; metrics: Metrics | null; tagInfo: TagInfoMap; saveNote: string }) {
  const cando = candoFor(f.estimatedBac, skill)
  return (
    <section aria-label="Kết quả chấm" className="anim-pop space-y-5 rounded-game border-2 border-border bg-card p-5">
      <div>
        <p className="text-4xl font-extrabold">
          {f.total}
          <span className="text-xl text-muted-foreground">/10</span>
        </p>
        <p className="text-muted-foreground">
          Mức bạn thể hiện (máy ước lượng, chỉ để tham khảo): <strong>{bacText(f.estimatedBac)}</strong>
        </p>
        {saveNote && (
          <p className="mt-1 text-sm text-muted-foreground" role="status">
            {saveNote}
          </p>
        )}
        {cando && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-extrabold text-primary">Mức này nghĩa là gì? ({cando.label}, tương đương {cando.cefr})</summary>
            <p className="mt-1 text-muted-foreground">{cando.text}</p>
            <p className="mt-1 text-xs text-muted-foreground">Trích từ Khung năng lực ngoại ngữ kèm Thông tư 33/2026/TT-BGDĐT (mô tả tổng quát cho kỹ năng {skill === "writing" ? "Viết" : "Nói"}). <Link href="/khung-nang-luc" className="underline">Xem cả khung 6 bậc</Link>.</p>
          </details>
        )}
      </div>

      <div>
        <h2 className={H}>Điểm từng tiêu chí</h2>
        <ul className="space-y-3">
          {CRITERIA[skill].map((c) => {
            const d = f.criteria.find((x) => x.key === c.key)
            const score = f.scores[c.key]
            return (
              <li key={c.key} className={CARD}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-extrabold">
                    {c.label} <span className="text-sm font-normal text-muted-foreground">({c.en})</span>
                  </span>
                  <span className="font-extrabold">
                    {score}/{MAX_PER_CRITERION}
                    {d?.bac !== null && d?.bac !== undefined && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{bacText(d.bac)}</span>}
                  </span>
                </div>
                <div className="mt-1">
                  <Bar value={score} max={MAX_PER_CRITERION} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Điểm {score}: {DESCRIPTORS[c.key]?.[score]}
                </p>
                {d && (d.evidence.length > 0 || d.strengths.length > 0 || d.weaknesses.length > 0 || d.howToImprove) && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-extrabold text-primary">Xem lý do và cách cải thiện</summary>
                    <div className="mt-2 space-y-2 text-sm">
                      {d.evidence.length > 0 && (
                        <div>
                          <p className="font-extrabold">Bằng chứng trong bài</p>
                          <ul className="list-disc pl-5" lang="en">
                            {d.evidence.map((e) => (
                              <li key={e}>“{e}”</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {d.strengths.length > 0 && (
                        <p>
                          <strong>👍 </strong>
                          {d.strengths.join(" ")}
                        </p>
                      )}
                      {d.weaknesses.length > 0 && (
                        <p>
                          <strong>🎯 </strong>
                          {d.weaknesses.join(" ")}
                        </p>
                      )}
                      {d.howToImprove && (
                        <p className="rounded-game bg-success-soft px-3 py-2">
                          <strong>Cách cải thiện: </strong>
                          {d.howToImprove}
                        </p>
                      )}
                    </div>
                  </details>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {f.priorities.length > 0 && (
        <div>
          <h2 className={H}>3 việc nên làm trước</h2>
          <ol className="space-y-3">
            {f.priorities.map((p, i) => (
              <li key={i} className="flex gap-3 rounded-game border-2 border-primary bg-background p-4">
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-extrabold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <p className="font-extrabold">
                    {p.issue}
                    {p.criterion && <span className="ml-2 text-sm font-normal text-muted-foreground">({CRITERIA[skill].find((c) => c.key === p.criterion)?.label})</span>}
                  </p>
                  {p.why && <p className="text-sm text-muted-foreground">Vì sao quan trọng: {p.why}</p>}
                  <p className="text-sm">
                    <strong>Làm thế nào: </strong>
                    {p.action}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {metrics && <MetricsCard m={metrics} />}

      {f.transcript && (
        <div>
          <h2 className={H}>📝 Máy nghe được</h2>
          <p lang="en" className="text-muted-foreground">
            {f.transcript}
          </p>
        </div>
      )}

      {f.corrections.length > 0 && (
        <div>
          <h2 className={H}>✏️ Lỗi cần sửa</h2>
          <ul className="space-y-3">
            {f.corrections.map((c, i) => {
              const t = c.tag ? tagInfo[c.tag] : undefined
              return (
                <li key={i} className={CARD}>
                  <p>
                    <span className="line-through" lang="en">
                      {c.original}
                    </span>{" "}
                    → <strong lang="en">{c.fixed}</strong>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.reasonVi}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border-2 border-border px-2 py-0.5 font-extrabold">{CATEGORY_LABEL[c.category]}</span>
                    {c.transfer && <span className="rounded-full bg-accent px-2 py-0.5 font-extrabold text-accent-foreground">Dịch từng chữ từ tiếng Việt</span>}
                    <span className="text-muted-foreground">{c.severity === 3 ? "Ảnh hưởng nhiều đến việc hiểu" : c.severity === 1 ? "Lỗi nhẹ" : "Lỗi đáng chú ý"}</span>
                    {t && c.tag && (
                      <Link href={`/hoc/${t.topicId}#${c.tag}`} className="font-extrabold text-primary underline underline-offset-2">
                        Ôn lại: {t.label} →
                      </Link>
                    )}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {f.phonetics && (
        <div>
          <h2 className={H}>🔊 Phát âm và ngữ điệu</h2>
          <div className="space-y-3 text-sm">
            {f.phonetics.sounds.map((s) => (
              <div key={s.sound} className={CARD}>
                <p>
                  <strong lang="en">{s.sound}</strong>
                  {s.examples.length > 0 && (
                    <span className="text-muted-foreground" lang="en">
                      {" "}
                      — {s.examples.join(", ")}
                    </span>
                  )}
                </p>
                <p className="mt-1">{s.tipVi}</p>
              </div>
            ))}
            {f.phonetics.stressVi && <p><strong>Trọng âm: </strong>{f.phonetics.stressVi}</p>}
            {f.phonetics.intonationVi && <p><strong>Ngắt nghỉ và ngữ điệu: </strong>{f.phonetics.intonationVi}</p>}
            {f.phonetics.toneVi && <p><strong>Giọng điệu: </strong>{f.phonetics.toneVi}</p>}
          </div>
        </div>
      )}

      {f.versions.length > 0 && (
        <div>
          <h2 className={H}>Bản viết lại tham khảo</h2>
          <ul className="space-y-3">
            {f.versions.map((v) => (
              <li key={v.label} className={CARD}>
                <p className="font-extrabold">{v.label}</p>
                <p lang="en" className="mt-1 whitespace-pre-line">
                  {v.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {f.practicePlan.length > 0 && (
        <div>
          <h2 className={H}>Kế hoạch luyện hôm nay</h2>
          <ul className="space-y-2">
            {f.practicePlan.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden="true">☐</span>
                <span>
                  <strong>{p.title}</strong> <span className="text-sm text-muted-foreground">(~{p.minutes} phút)</span>
                  <span className="block text-sm">{p.how}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {f.message && (
        <div className={CARD}>
          {f.message.split(/\n\s*\n/).map((para, i) => (
            <p key={i} className={i > 0 ? "mt-2" : ""}>
              {para}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}

function MetricsCard({ m }: { m: Metrics }) {
  const items: { label: string; value: string }[] =
    m.kind === "writing"
      ? [
          { label: "Số từ", value: String(m.words) },
          { label: "Số câu", value: String(m.sentences) },
          { label: "Số đoạn", value: String(m.paragraphs) },
          { label: "Câu dài TB", value: `${m.avgSentenceWords} từ` },
          { label: "Đa dạng từ", value: m.lexicalVariety === null ? "—" : `${Math.round(m.lexicalVariety * 100)}%` },
          { label: "Từ nối đã dùng", value: m.connectors.length ? m.connectors.join(", ") : "chưa có" },
        ]
      : [
          { label: "Số từ nói", value: String(m.words) },
          { label: "Thời gian", value: m.durationSec ? `${Math.round(m.durationSec)} giây` : "—" },
          { label: "Tốc độ", value: m.wpm === null ? "—" : `${m.wpm} từ/phút` },
          { label: "Từ đệm (um, uh…)", value: String(m.fillers) },
          { label: "Đoạn nghe không rõ", value: String(m.unclear) },
        ]
  return (
    <div>
      <h2 className={H}>Số liệu máy đo được</h2>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className={CARD}>
            <dt className="text-xs text-muted-foreground">{it.label}</dt>
            <dd className="font-extrabold">{it.value}</dd>
          </div>
        ))}
      </dl>
      {m.kind === "writing" && m.repeatedWords.length > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Từ lặp nhiều: {m.repeatedWords.map((w) => `${w.word} (${w.count})`).join(", ")} — thử thay bằng từ đồng nghĩa.
        </p>
      )}
      {m.kind === "speaking" && paceNote(m.wpm) && <p className="mt-2 text-sm text-muted-foreground">{paceNote(m.wpm)} (mức tham khảo thô, không dùng để chấm điểm).</p>}
    </div>
  )
}

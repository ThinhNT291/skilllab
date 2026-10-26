"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { deleteBatch, getAccountInfo, importBatch, listBatches, listDrafts, setDraftStatus, type BatchRow, type DraftRow } from "@/lib/db"
import { DRAFT_STATUSES, parseBatch, REJECT_REASONS, STATUS_LABEL, type DraftStatus } from "@/lib/contentdraft/parse"
import { buildExport } from "@/lib/contentdraft/export"
import { draftStats, type GroupRow, type Rate } from "@/lib/contentdraft/stats"
import { levelLabel } from "@/lib/content/bac"

const BTN = "rounded-game border-b-4 border-primary-deep bg-primary px-4 py-2 font-extrabold text-primary-foreground enabled:active:translate-y-[2px] enabled:active:border-b-2 disabled:opacity-50"
const GHOST = "rounded-game border-2 border-border bg-card px-3 py-1.5 text-sm font-extrabold enabled:hover:border-primary disabled:opacity-50"
const pct = (r: Rate) => (r.value === null ? "—" : `${Math.round(r.value * 100)}% (${r.num}/${r.den})`)

/** Trước trạng thái "đã quyết định" thì mục ở trạng thái nào (suy từ kết quả giải mù), dùng để mở lại. */
const baseStatus = (d: DraftRow): DraftStatus => (d.blind ? (d.blind.pass ? "review_passed" : "review_failed") : "generated")

export function ContentReview() {
  const [role, setRole] = useState<"loading" | "admin" | "other">("loading")
  const [batches, setBatches] = useState<BatchRow[] | null>(null)
  const [drafts, setDrafts] = useState<DraftRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<DraftStatus | "all">("review_passed")
  const [batchFilter, setBatchFilter] = useState<string>("all")
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const [b, d] = await Promise.all([listBatches(), listDrafts()])
    if (!b.ok || !d.ok) {
      const f = !b.ok ? b : (d as Extract<typeof d, { ok: false }>)
      setError(f.reason === "not_configured" ? "Chưa kết nối Supabase." : `${f.message ?? "lỗi không rõ"} (đã chạy tệp 0017_content_drafts.sql và đăng nhập bằng tài khoản quản trị chưa?)`)
      setBatches([])
      return
    }
    setError(null)
    setBatches(b.rows)
    setDrafts(d.rows)
  }, [])

  useEffect(() => {
    getAccountInfo().then((a) => {
      setRole(a?.role === "admin" ? "admin" : "other")
      if (a?.role === "admin") void reload()
    })
  }, [reload])

  const stats = useMemo(
    () =>
      draftStats(
        drafts.map((d) => ({ batchId: d.batch_id, kind: d.kind, topic: d.topic, bac: d.bac, status: d.status, rejectReason: d.reject_reason, blindPass: d.blind ? d.blind.pass : null, data: d.data })),
        (batches ?? []).map((b) => ({ id: b.id, model: b.model, promptVersion: b.prompt_version, counts: b.counts })),
      ),
    [drafts, batches],
  )
  const shown = useMemo(() => drafts.filter((d) => (statusFilter === "all" || d.status === statusFilter) && (batchFilter === "all" || d.batch_id === batchFilter)), [drafts, statusFilter, batchFilter])

  async function decide(ids: string[], status: DraftStatus, reason: string | null = null) {
    setBusy(true)
    const r = await setDraftStatus(ids, status, reason)
    setBusy(false)
    if (!r.ok) return setNote(`Không lưu được: ${r.reason === "error" ? r.message : "chưa kết nối"}`)
    setDrafts((list) => list.map((d) => (ids.includes(d.id) ? { ...d, status, reject_reason: status === "rejected" ? reason : null, decided_at: new Date().toISOString() } : d)))
  }

  async function reopen(d: DraftRow) {
    await decide([d.id], baseStatus(d))
  }

  if (role === "loading") return <p className="text-muted-foreground">Đang kiểm tra quyền…</p>
  if (role !== "admin") return <p className="rounded-game border-2 border-dashed border-border p-4 text-muted-foreground">Chỉ tài khoản quản trị mới duyệt được nội dung.</p>

  const approvable = shown.filter((d) => d.status === "review_passed")
  return (
    <div className="space-y-6">
      <ImportPanel onDone={async (msg) => { setNote(msg); await reload() }} />
      {error && <p className="rounded-game border-2 border-dashed border-border p-3 text-sm text-muted-foreground">{error}</p>}
      {note && <p className="rounded-game bg-card p-3 text-sm font-bold" role="status">{note}</p>}

      <StatsPanel stats={stats} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-bold">
            Trạng thái{" "}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DraftStatus | "all")} className="rounded-lg border-2 border-border bg-card px-2 py-1">
              <option value="all">Tất cả ({drafts.length})</option>
              {DRAFT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]} ({stats.byStatus[s]})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Lô{" "}
            <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="max-w-64 rounded-lg border-2 border-border bg-card px-2 py-1">
              <option value="all">Tất cả lô</option>
              {(batches ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.topic ?? b.kind} · Bậc {b.bac} · {new Date(b.created_at).toLocaleDateString("vi-VN")} · {b.prompt_version}
                </option>
              ))}
            </select>
          </label>
          {batchFilter !== "all" && (
            <button
              type="button"
              className={GHOST}
              onClick={async () => {
                if (!window.confirm("Xóa lô này và mọi mục nháp trong lô?")) return
                const r = await deleteBatch(batchFilter)
                setNote(r.ok ? "Đã xóa lô." : `Không xóa được: ${r.reason === "error" ? r.message : ""}`)
                setBatchFilter("all")
                await reload()
              }}
            >
              Xóa lô này
            </button>
          )}
          <button type="button" className={`${BTN} ml-auto`} disabled={busy || approvable.length === 0} onClick={() => window.confirm(`Duyệt ${approvable.length} mục đang hiện đã qua giải mù? Hãy chắc bạn đã đọc chúng.`) && decide(approvable.map((d) => d.id), "approved")}>
            Duyệt {approvable.length} mục đã qua giải mù
          </button>
        </div>

        {shown.length === 0 ? <p className="text-muted-foreground">Không có mục nào với bộ lọc này.</p> : shown.slice(0, 60).map((d) => <DraftCard key={d.id} d={d} busy={busy} onApprove={() => decide([d.id], "approved")} onReject={(why) => decide([d.id], "rejected", why)} onReopen={() => reopen(d)} />)}
        {shown.length > 60 && <p className="text-sm text-muted-foreground">Đang hiện 60 mục đầu trong {shown.length}; lọc theo lô hoặc trạng thái để xem tiếp.</p>}
      </section>

      <ExportPanel drafts={drafts} />
    </div>
  )
}

function ImportPanel({ onDone }: { onDone: (msg: string) => void | Promise<void> }) {
  const [batchFile, setBatchFile] = useState<File | null>(null)
  const [reviewedFile, setReviewedFile] = useState<File | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run() {
    if (!batchFile) return
    setBusy(true)
    setMsg(null)
    try {
      if (batchFile.size > 2_000_000 || (reviewedFile && reviewedFile.size > 2_000_000)) throw new Error("Tệp quá lớn (tối đa 2 MB).")
      const batchJson = JSON.parse(await batchFile.text())
      const reviewedJson = reviewedFile ? JSON.parse(await reviewedFile.text()) : undefined
      const parsed = parseBatch(batchJson, reviewedJson)
      if (!parsed.ok) throw new Error(parsed.error)
      const r = await importBatch(parsed.batch, parsed.drafts)
      if (!r.ok) throw new Error(r.reason === "error" ? (r.message ?? "lỗi không rõ") : "Chưa kết nối Supabase.")
      setBatchFile(null)
      setReviewedFile(null)
      await onDone(`Đã nạp ${parsed.drafts.length} mục (${parsed.batch.topic ?? parsed.batch.kind}, Bậc ${parsed.batch.bac}).`)
    } catch (e) {
      setMsg(e instanceof SyntaxError ? "Tệp không phải JSON hợp lệ." : e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="rounded-game border-2 border-border bg-card p-4" open>
      <summary className="cursor-pointer font-extrabold">Nạp lô từ script</summary>
      <p className="mt-2 text-sm text-muted-foreground">
        Chọn tệp lô trong <code>tmp/gen/</code> (do <code>gen-items.mjs</code> hoặc <code>gen-passages.mjs</code> ghi), và nếu đã giải mù thì thêm tệp <code>….reviewed.json</code> cùng tên. Xem <code>docs/thu-gen-noi-dung.md</code>.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold">
          Tệp lô (.json)
          <input type="file" accept="application/json,.json" onChange={(e) => setBatchFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm font-normal" />
        </label>
        <label className="text-sm font-bold">
          Tệp giải mù (.reviewed.json, tùy chọn)
          <input type="file" accept="application/json,.json" onChange={(e) => setReviewedFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm font-normal" />
        </label>
      </div>
      <button type="button" className={`${BTN} mt-3`} disabled={!batchFile || busy} onClick={run}>
        {busy ? "Đang nạp…" : "Nạp lô"}
      </button>
      {msg && <p className="mt-2 text-sm text-danger" role="alert">{msg}</p>}
    </details>
  )
}

function GroupTable({ title, rows }: { title: string; rows: GroupRow[] }) {
  if (rows.length === 0) return null
  return (
    <div>
      <p className="mb-1 text-sm font-extrabold">{title}</p>
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground">
          <tr>
            <th className="py-0.5 pr-2 font-bold">Nhóm</th>
            <th className="px-2 font-bold">Số mục</th>
            <th className="px-2 font-bold">Qua giải mù</th>
            <th className="px-2 font-bold">Bạn đồng ý</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-border">
              <td className="py-0.5 pr-2">{r.key}</td>
              <td className="px-2">{r.total}</td>
              <td className="px-2">{pct(r.blindPass)}</td>
              <td className="px-2">{pct(r.humanApprove)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatsPanel({ stats }: { stats: ReturnType<typeof draftStats> }) {
  const c = stats.calibration
  const both = c.passApproved + c.passRejected + c.failApproved + c.failRejected
  const bar = (n: number, max: number) => <span className="inline-block h-2 rounded-full bg-primary align-middle" style={{ width: `${max ? Math.max(4, Math.round((n / max) * 80)) : 4}px` }} />
  const maxPos = Math.max(...stats.positions, 1)
  return (
    <details className="rounded-game border-2 border-border bg-card p-4" open>
      <summary className="cursor-pointer font-extrabold">Thống kê ({stats.total} mục)</summary>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <p className="rounded-game bg-background p-3">
          <span className="block text-muted-foreground">Qua kiểm bằng mã</span>
          <strong className="text-lg">{pct(stats.codePass)}</strong>
        </p>
        <p className="rounded-game bg-background p-3">
          <span className="block text-muted-foreground">Qua giải mù</span>
          <strong className="text-lg">{pct(stats.blindPass)}</strong>
        </p>
        <p className="rounded-game bg-background p-3">
          <span className="block text-muted-foreground">Bạn đồng ý (đã quyết định)</span>
          <strong className="text-lg">{pct(stats.humanApprove)}</strong>
        </p>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Trạng thái: {DRAFT_STATUSES.map((s) => `${STATUS_LABEL[s]} ${stats.byStatus[s]}`).join(" · ")}
      </p>
      {both > 0 && (
        <p className="mt-2 text-sm">
          <strong>Giải mù đáng tin đến đâu</strong> (so với quyết định của bạn, {both} mục): qua giải mù và bạn duyệt {c.passApproved}, qua giải mù nhưng bạn loại <strong>{c.passRejected}</strong>, trượt giải mù nhưng bạn duyệt <strong>{c.failApproved}</strong>, trượt và bạn loại {c.failRejected}. Hai số in đậm càng nhỏ thì giải mù càng đáng tin.
        </p>
      )}
      <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="mb-1 font-extrabold">Vị trí đáp án đúng (ngữ pháp)</p>
          <ul>
            {stats.positions.map((n, i) => (
              <li key={i}>
                {"ABCD"[i]} {bar(n, maxPos)} {n}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 font-extrabold">Độ khó (ngữ pháp) · Bậc</p>
          <p>
            Dễ {stats.difficulty[1]} · Vừa {stats.difficulty[2]} · Khó {stats.difficulty[3]}
          </p>
          <p>{Object.entries(stats.bac).map(([b, n]) => `${levelLabel(Number(b))}: ${n}`).join(" · ") || "—"}</p>
        </div>
      </div>
      {stats.rejectReasons.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="mb-1 font-extrabold">Lý do loại phổ biến</p>
          <ul>
            {stats.rejectReasons.map((r) => (
              <li key={r.reason}>
                {r.reason}: {r.count}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GroupTable title="Theo phiên bản lời nhắc" rows={stats.byPromptVersion} />
        <GroupTable title="Theo mô hình" rows={stats.byModel} />
        <GroupTable title="Theo chuyên đề" rows={stats.byTopic} />
        <GroupTable title="Theo bậc" rows={stats.byBac} />
      </div>
    </details>
  )
}

function DraftCard({ d, busy, onApprove, onReject, onReopen }: { d: DraftRow; busy: boolean; onApprove: () => void; onReject: (why: string) => void; onReopen: () => void }) {
  const [why, setWhy] = useState<string>(REJECT_REASONS[0])
  const [custom, setCustom] = useState("")
  const decided = d.status === "approved" || d.status === "rejected"
  const data = d.data as Record<string, unknown>
  return (
    <article className="rounded-game border-2 border-border bg-card p-4">
      <header className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border-2 border-border px-2 py-0.5 font-extrabold">{STATUS_LABEL[d.status]}</span>
        <span className="text-muted-foreground">
          {d.item_id} · {d.topic} · {levelLabel(d.bac)}
          {d.kind === "grammar" ? ` · mức khó ${String(data.difficulty ?? "?")}` : ""}
        </span>
        {d.meta?.intendedBac !== undefined && <span className="text-muted-foreground">mô hình đề xuất Bậc {String(d.meta.intendedBac)}</span>}
        {d.reject_reason && <span className="text-danger">Lý do loại: {d.reject_reason}</span>}
      </header>

      {d.kind === "grammar" ? <GrammarPreview data={data} /> : <PassagePreview data={data} />}

      {d.blind && (
        <p className={`mt-2 text-sm ${d.blind.pass ? "text-success" : "text-danger"}`}>
          Giải mù: {d.blind.pass ? "qua" : "trượt"}
          {d.blind.why.length ? ` — ${[...new Set(d.blind.why)].join("; ")}` : ""}
        </p>
      )}
      {Array.isArray(d.meta?.distractorTypes) && <p className="mt-1 text-xs text-muted-foreground">Kiểu đáp án nhiễu: {(d.meta.distractorTypes as string[]).join(", ")}</p>}

      <footer className="mt-3 flex flex-wrap items-center gap-2">
        {decided ? (
          <button type="button" className={GHOST} disabled={busy} onClick={onReopen}>
            Mở lại
          </button>
        ) : (
          <>
            <button type="button" className={BTN} disabled={busy} onClick={onApprove}>
              Duyệt
            </button>
            <select value={why} onChange={(e) => setWhy(e.target.value)} aria-label="Lý do loại" className="rounded-lg border-2 border-border bg-card px-2 py-1.5 text-sm">
              {REJECT_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
              <option value="">Lý do khác…</option>
            </select>
            {why === "" && <input value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={200} placeholder="Ghi lý do" className="rounded-lg border-2 border-border bg-card px-2 py-1.5 text-sm" />}
            <button type="button" className={GHOST} disabled={busy || (why === "" && !custom.trim())} onClick={() => onReject(why || custom.trim())}>
              Loại
            </button>
          </>
        )}
      </footer>
    </article>
  )
}

function GrammarPreview({ data }: { data: Record<string, unknown> }) {
  const choices = (data.choices as string[]) ?? []
  const exps = (data.choiceExplanations as string[]) ?? []
  const ci = Number(data.correctIndex)
  return (
    <>
      <p className="whitespace-pre-line text-lg font-extrabold" lang="en">
        {String(data.prompt)}
      </p>
      <ul className="mt-2 space-y-1.5 text-sm">
        {choices.map((c, i) => (
          <li key={i} className={i === ci ? "rounded bg-success-soft px-2 py-1" : "px-2 py-1"}>
            <span className="font-extrabold">{"ABCD"[i]}.</span> <span lang="en">{c}</span>
            <span className="block text-muted-foreground">{exps[i]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-muted-foreground">
        Mục dạy: {String(data.usageId ?? "?")} · {String(data.explanation ?? "")}
      </p>
    </>
  )
}

function PassagePreview({ data }: { data: Record<string, unknown> }) {
  const qs = (data.questions as { prompt: string; choices: string[]; correctIndex: number; explanation: string }[]) ?? []
  return (
    <>
      <p className="font-extrabold">{String(data.title)}</p>
      <p className="mt-1 whitespace-pre-line text-sm" lang="en">
        {String(data.text ?? data.transcript)}
      </p>
      <ol className="mt-2 space-y-2 text-sm">
        {qs.map((q, i) => (
          <li key={i}>
            <span className="font-bold" lang="en">
              {i + 1}. {q.prompt}
            </span>
            <ul className="ml-4 list-disc">
              {q.choices.map((c, k) => (
                <li key={k} className={k === q.correctIndex ? "font-bold text-success" : ""} lang="en">
                  {c}
                </li>
              ))}
            </ul>
            <span className="text-muted-foreground">{q.explanation}</span>
          </li>
        ))}
      </ol>
    </>
  )
}

function ExportPanel({ drafts }: { drafts: DraftRow[] }) {
  const approved = drafts.filter((d) => d.status === "approved")
  const [warnings, setWarnings] = useState<string[]>([])
  function run() {
    const res = buildExport(approved.map((d) => ({ itemId: d.item_id, kind: d.kind, topic: d.topic, bac: d.bac, data: d.data })))
    setWarnings(res.warnings)
    const blob = new Blob([JSON.stringify(res, null, 1)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `noi-dung-da-duyet-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  return (
    <section className="rounded-game border-2 border-border bg-card p-4">
      <p className="font-extrabold">Xuất mục đã duyệt ({approved.length})</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Tải tệp gồm các phần theo tệp đích trong <code>src/content</code>. Ứng dụng không tự ghi vào kho nội dung: gộp tệp này vào repo (nhờ Claude gộp), chạy <code>npm run check:content</code>, <code>node scripts/build-item-meta.mjs</code>, <code>npm test</code>, rồi <code>npm run content:push</code>.
      </p>
      <button type="button" className={`${BTN} mt-3`} disabled={approved.length === 0} onClick={run}>
        Tải tệp xuất
      </button>
      {warnings.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

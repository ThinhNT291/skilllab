"use client"

import { useRef, useState } from "react"
import { bacLabel } from "@/lib/content/bac"
import type { Bac } from "@/lib/content/types"
import { countWords, MAX_WRITING_CHARS, MIN_WORDS, type Feedback, type Skill } from "@/lib/rubric"
import { detailFromFeedback } from "@/lib/grading/detail"
import { GradeReport, type Metrics, type TagInfoMap } from "./grade-report"
import { saveAttempt } from "@/lib/db"
import type { WritingHints } from "@/lib/hints"
import { HintsView } from "./hints-view"
import { TASKS, type SpeechTask } from "@/lib/writing-tasks"

const BTN = "rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2 disabled:opacity-50"
const MAX_RECORD_SECONDS = 90

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let bin = ""
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

/** Chọn đề, làm bài (gõ hoặc ghi âm), gửi chấm và hiện nhận xét theo tiêu chí. */
export function GradePanel({ skill }: { skill: Skill }) {
  const tasks = TASKS[skill]
  const [task, setTask] = useState<SpeechTask>(tasks[0])
  const [text, setText] = useState("")
  const [audio, setAudio] = useState<Blob | null>(null)
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [tagInfo, setTagInfo] = useState<TagInfoMap>({})
  const [recordedSec, setRecordedSec] = useState(0)
  const startedAt = useRef(0)
  const [hints, setHints] = useState<WritingHints | null>(null)
  const [hintBusy, setHintBusy] = useState(false)
  const [saved, setSaved] = useState<"idle" | "saved" | "failed">("idle")
  const [saveDetail, setSaveDetail] = useState("")
  const recorder = useRef<MediaRecorder | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const words = countWords(text)
  const ready = skill === "writing" ? words >= MIN_WORDS : audio !== null

  async function startRecording() {
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      rec.ondataavailable = (e) => chunks.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecordedSec(Math.round((Date.now() - startedAt.current) / 1000))
        setAudio(new Blob(chunks, { type: rec.mimeType || "audio/webm" }))
        setRecording(false)
      }
      rec.start()
      startedAt.current = Date.now()
      recorder.current = rec
      setAudio(null)
      setRecording(true)
      timer.current = setTimeout(() => {
        if (rec.state === "recording") rec.stop()
      }, MAX_RECORD_SECONDS * 1000)
    } catch {
      setError("Không mở được micro. Hãy cho phép dùng micro trong trình duyệt.")
    }
  }

  function stopRecording() {
    if (timer.current) clearTimeout(timer.current)
    if (recorder.current?.state === "recording") recorder.current.stop()
  }

  async function loadHints() {
    setHintBusy(true)
    setError("")
    try {
      const res = await fetch("/api/hints", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: task.prompt, targetBac: task.bac }) })
      const json = (await res.json()) as { hints?: WritingHints; error?: string }
      if (!res.ok || !json.hints) setError(json.error ?? "Chưa tạo được gợi ý, thử lại nhé.")
      else setHints(json.hints)
    } catch {
      setError("Không kết nối được. Kiểm tra mạng rồi thử lại nhé.")
    } finally {
      setHintBusy(false)
    }
  }

  async function submit() {
    setBusy(true)
    setError("")
    setFeedback(null)
    setSaved("idle")
    try {
      const body =
        skill === "writing"
          ? { skill, task: task.prompt, targetBac: task.bac, text }
          : { skill, task: task.prompt, targetBac: task.bac, audio: { mime: audio!.type, data: await toBase64(audio!) }, durationSec: recordedSec }
      const res = await fetch("/api/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      const json = (await res.json()) as { feedback?: Feedback; metrics?: Metrics; tagInfo?: TagInfoMap; error?: string }
      if (!res.ok || !json.feedback) setError(json.error ?? "Chưa chấm được, thử lại nhé.")
      else {
        setFeedback(json.feedback)
        setMetrics(json.metrics ?? null)
        setTagInfo(json.tagInfo ?? {})
        // Chỉ lưu điểm và một nhận xét ngắn, không lưu bài làm hay bản ghi âm.
        const f = json.feedback
        const r = await saveAttempt({ skill, taskId: task.id, targetBac: task.bac, total: f.total, estimatedBac: f.estimatedBac, scores: f.scores, note: f.priorities[0]?.issue ?? f.improvements[0], detail: detailFromFeedback(f) })
        setSaved(r.ok ? "saved" : "failed")
        setSaveDetail(r.ok ? "" : r.reason === "not_configured" ? "chưa kết nối Supabase" : (r.message ?? "lỗi không rõ"))
      }
    } catch {
      setError("Không kết nối được. Kiểm tra mạng rồi thử lại nhé.")
    } finally {
      setBusy(false)
    }
  }

  function pick(id: string) {
    const t = tasks.find((x) => x.id === id)
    if (!t) return
    setTask(t)
    setText("")
    setAudio(null)
    setFeedback(null)
    setHints(null)
    setError("")
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="font-extrabold">Chọn đề</span>
        <select value={task.id} onChange={(e) => pick(e.target.value)} className="mt-1 block w-full rounded-game border-2 border-border bg-card p-3">
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {bacLabel(t.bac as Bac)} · {t.prompt.slice(0, 50)}…
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-game border-2 border-border bg-card p-4">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Đề · {bacLabel(task.bac as Bac)} · {skill === "writing" ? `khoảng ${task.hint} từ` : `khoảng ${task.hint} giây`}
        </p>
        <p className="mt-1 text-lg font-bold">{task.prompt}</p>
      </div>

      {skill === "writing" && (
        <div className="space-y-3">
          <button type="button" onClick={loadHints} disabled={hintBusy} className="rounded-game border-2 border-accent bg-card px-4 py-2 font-extrabold hover:border-primary disabled:opacity-50">
            {hintBusy ? "Đang nghĩ…" : "💡 Gợi ý dàn ý"}
          </button>
          {hints && <HintsView hints={hints} />}
        </div>
      )}

      {skill === "writing" ? (
        <label className="block">
          <span className="sr-only">Bài viết của bạn</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_WRITING_CHARS))}
            rows={8}
            className="block w-full rounded-game border-2 border-border bg-card p-3 text-lg"
            placeholder="Viết bằng tiếng Anh ở đây…"
            lang="en"
          />
          <span className="text-sm text-muted-foreground">
            {words} từ{words < MIN_WORDS ? ` (cần ít nhất ${MIN_WORDS})` : ""}
          </span>
        </label>
      ) : (
        <div className="space-y-2">
          {!recording ? (
            <button type="button" onClick={startRecording} className={BTN}>
              🎙 {audio ? "Ghi lại" : "Bắt đầu ghi âm"}
            </button>
          ) : (
            <button type="button" onClick={stopRecording} className={BTN}>
              ⏹ Dừng (tối đa {MAX_RECORD_SECONDS} giây)
            </button>
          )}
          {recording && <p role="status">Đang ghi âm…</p>}
          {audio && !recording && <audio controls src={URL.createObjectURL(audio)} className="w-full" />}
        </div>
      )}

      <button type="button" onClick={submit} disabled={!ready || busy || recording} className={BTN}>
        {busy ? "Đang chấm…" : "Nộp bài để chấm"}
      </button>
      {error && (
        <p role="alert" className="font-bold text-danger">
          {error}
        </p>
      )}

      {feedback && (
        <GradeReport
          skill={skill}
          feedback={feedback}
          metrics={metrics}
          tagInfo={tagInfo}
          saveNote={saved === "idle" ? "" : saved === "saved" ? "Đã lưu điểm vào tiến độ." : `Chưa lưu được điểm (${saveDetail}). Nếu thông báo nhắc đến bảng graded_attempts, cần chạy tệp supabase/migrations/0006_graded_attempts.sql trong Supabase.`}
        />
      )}
    </div>
  )
}

"use client"

import { useRef, useState } from "react"
import { bacLabel } from "@/lib/content/bac"
import type { Bac } from "@/lib/content/types"
import { CRITERIA, countWords, MAX_PER_CRITERION, MAX_WRITING_CHARS, MIN_WORDS, type Feedback, type Skill } from "@/lib/rubric"
import { TASKS, type SpeechTask } from "@/lib/writing-tasks"

const BTN = "rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2 disabled:opacity-50"
const MAX_RECORD_SECONDS = 90

function bacText(n: number): string {
  return n <= 0 ? "Dưới Bậc 1" : bacLabel(n as Bac)
}

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
        setAudio(new Blob(chunks, { type: rec.mimeType || "audio/webm" }))
        setRecording(false)
      }
      rec.start()
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

  async function submit() {
    setBusy(true)
    setError("")
    setFeedback(null)
    try {
      const body =
        skill === "writing"
          ? { skill, task: task.prompt, targetBac: task.bac, text }
          : { skill, task: task.prompt, targetBac: task.bac, audio: { mime: audio!.type, data: await toBase64(audio!) } }
      const res = await fetch("/api/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      const json = (await res.json()) as { feedback?: Feedback; error?: string }
      if (!res.ok || !json.feedback) setError(json.error ?? "Chưa chấm được, thử lại nhé.")
      else setFeedback(json.feedback)
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
        <section aria-label="Kết quả chấm" className="anim-pop space-y-3 rounded-game border-2 border-border bg-card p-5">
          <p className="text-3xl font-extrabold">{feedback.total}/10</p>
          <p className="text-muted-foreground">
            Mức bạn thể hiện (máy ước lượng, chỉ để tham khảo): <strong>{bacText(feedback.estimatedBac)}</strong>
          </p>
          <ul className="space-y-1">
            {CRITERIA[skill].map((c) => (
              <li key={c.key} className="flex justify-between gap-3">
                <span>{c.label}</span>
                <strong>
                  {feedback.scores[c.key]}/{MAX_PER_CRITERION}
                </strong>
              </li>
            ))}
          </ul>
          {feedback.strengths.length > 0 && (
            <div>
              <h2 className="font-extrabold">👍 Làm tốt</h2>
              <ul className="list-disc pl-5">{feedback.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
          {feedback.improvements.length > 0 && (
            <div>
              <h2 className="font-extrabold">🎯 Cần cải thiện</h2>
              <ul className="list-disc pl-5">{feedback.improvements.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
          {feedback.corrections.length > 0 && (
            <div>
              <h2 className="font-extrabold">✏️ Sửa lỗi</h2>
              <ul className="space-y-2">
                {feedback.corrections.map((c, i) => (
                  <li key={i}>
                    <span className="line-through" lang="en">{c.original}</span> → <strong lang="en">{c.fixed}</strong>
                    <br />
                    <span className="text-sm text-muted-foreground">{c.reasonVi}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback.corrected && (
            <div>
              <h2 className="font-extrabold">Bản đã sửa</h2>
              <p lang="en">{feedback.corrected}</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

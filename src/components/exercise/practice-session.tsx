"use client"

import { useState } from "react"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { recordAnswer } from "@/lib/db"
import type { RuleHints } from "@/lib/content/rule-hints"
import { ExerciseRunner } from "./exercise-runner"

type Status = "idle" | "saved" | "not_saved"

/** Chạy một lượt bài tập và lưu từng câu trả lời (nếu đã kết nối Supabase). */
export function PracticeSession({ exercises, theoryBase, bonusHref, adaptive, rules, byTopic }: { exercises: Exercise[]; theoryBase?: string; /** Lượt trộn nhiều chuyên đề: dẫn về lý thuyết theo chuyên đề của từng câu */ byTopic?: boolean; bonusHref?: string; adaptive?: { ladder: Exercise[]; count: number; start?: number; steps?: { up: number; down: number } }; rules?: RuleHints }) {
  const [status, setStatus] = useState<Status>("idle")
  const [detail, setDetail] = useState("")

  async function onAnswer(record: AnswerRecord) {
    const ex = [...exercises, ...(adaptive?.ladder ?? [])].find((e) => e.id === record.exerciseId)
    if (!ex) return
    const result = await recordAnswer(record, ex)
    setStatus(result.ok ? "saved" : "not_saved")
    setDetail(result.ok ? "" : result.reason === "not_configured" ? "chưa kết nối Supabase" : (result.message ?? "lỗi không rõ"))
  }

  return (
    <div>
      <ExerciseRunner
        exercises={exercises}
        onAnswer={onAnswer}
        bonusHref={bonusHref}
        adaptive={adaptive}
        rules={rules}
        practiceBase={theoryBase}
        theoryHref={byTopic ? (ex) => `/hoc/${ex.topic}${ex.usageId ? `#${ex.usageId}` : ""}` : theoryBase ? (ex) => `${theoryBase}${ex.usageId ? `#${ex.usageId}` : ""}` : undefined}
      />
      {/* Dòng trạng thái chỉ để kiểm tra khi dev; sẽ bỏ khi có màn đăng nhập/tiến độ. */}
      {status !== "idle" && (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {status === "saved" ? "Đã lưu kết quả." : `Chưa lưu được kết quả (${detail}).`}
        </p>
      )}
    </div>
  )
}

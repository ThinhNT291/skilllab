"use client"

import { useState } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { recordAnswer, saveTopicTest } from "@/lib/db"
import { passedTest, TEST_PASS_RATIO } from "@/lib/progress/mastery"
import type { RuleHints } from "@/lib/content/rule-hints"
import { ExerciseRunner } from "./exercise-runner"

/** Bài kiểm tra cuối chủ điểm: làm hết lượt rồi mới biết đạt hay chưa, kết quả được lưu để bản đồ chuyên đề hiện "đã vững". */
export function TestSession({ exercises, topic, topicTitle, rules }: { exercises: Exercise[]; topic: string; topicTitle: string; rules?: RuleHints }) {
  const [results, setResults] = useState<boolean[]>([])
  const [finished, setFinished] = useState(false)
  const [saved, setSaved] = useState<"pending" | "ok" | "fail">("pending")

  function onAnswer(record: AnswerRecord, ex: Exercise) {
    // Câu đọc to được ghi lại nhưng không tính vào đạt/chưa đạt: nhận dạng giọng nói có thể nghe sai, không nên làm trượt bài kiểm tra.
    if (ex.kind !== "speak") setResults((r) => [...r, record.correct])
    void recordAnswer(record, ex)
  }

  // Câu cuối đã được ghi nhận từ lúc trả lời (trước khi bấm "Xem kết quả") nên `results` ở đây đã đủ.
  function onFinish() {
    const correct = results.filter(Boolean).length
    const passed = passedTest(correct, results.length)
    void saveTopicTest(topic, correct, results.length, passed).then((r) => setSaved(r.ok ? "ok" : "fail"))
    if (passed && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } })
    setFinished(true)
  }

  if (!finished) {
    return <ExerciseRunner exercises={exercises} onAnswer={onAnswer} onFinish={onFinish} speak rules={rules} practiceBase={`/hoc/${topic}`} theoryHref={(ex) => `/hoc/${ex.topic}${ex.usageId ? `#${ex.usageId}` : ""}`} />
  }

  const correct = results.filter(Boolean).length
  const total = results.length
  const passed = passedTest(correct, total)
  return <Result topic={topic} topicTitle={topicTitle} correct={correct} total={total} passed={passed} saved={saved} />
}

function Result({ topic, topicTitle, correct, total, passed, saved }: { topic: string; topicTitle: string; correct: number; total: number; passed: boolean; saved: "pending" | "ok" | "fail" }) {
  return (
    <div className="anim-pop rounded-game border-2 border-border bg-card p-6 text-center">
      <p className="text-5xl">{passed ? "🏅" : "💪"}</p>
      <p className="mt-2 text-2xl font-extrabold">{passed ? "Bạn đã vượt qua bài kiểm tra!" : "Chưa đạt lần này"}</p>
      <p className="mt-1 text-xl font-extrabold">
        Đúng {correct}/{total} câu
      </p>
      <p className="mt-1 text-muted-foreground">
        {passed ? `${topicTitle} giờ được đánh dấu là đã vững.` : `Cần đúng từ ${Math.round(TEST_PASS_RATIO * 100)}% để đạt. Ôn lại một chút rồi thử lại nhé, bài sẽ có câu khác.`}
      </p>
      {saved === "fail" && <p className="mt-2 text-sm text-danger">Chưa lưu được kết quả (đã chạy tệp 0005_topic_tests.sql trong Supabase chưa?).</p>}
      <div className="mt-4 flex flex-col gap-2">
        {!passed && (
          <Link href={`/hoc/${topic}`} className="rounded-game border-2 border-border py-3 font-extrabold hover:border-primary">
            Xem lại lý thuyết
          </Link>
        )}
        <button type="button" onClick={() => window.location.reload()} className="rounded-game border-b-[5px] border-primary-deep bg-primary py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2">
          {passed ? "Làm bài khác" : "Thử lại"}
        </button>
        <Link href="/hoc" className="py-2 text-primary underline underline-offset-4">
          Về bản đồ chuyên đề
        </Link>
      </div>
    </div>
  )
}

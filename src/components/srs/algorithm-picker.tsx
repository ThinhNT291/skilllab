"use client"

import { RETENTIONS, updateSettings, useSettings, type SrsAlgorithm } from "@/lib/settings"

const CHIP = "rounded-full border-2 border-border px-3 py-1 font-extrabold aria-pressed:border-primary aria-pressed:text-primary"

const ALGOS: { id: SrsAlgorithm; label: string }[] = [
  { id: "fsrs", label: "FSRS (mới)" },
  { id: "sm2", label: "SM-2 (cũ)" },
]

/** Chọn thuật toán lập lịch ôn và mức nhớ mục tiêu (lưu trên máy này). Cả hai thuật toán đều được tính mỗi lượt ôn nên đổi qua lại không mất dữ liệu. */
export function AlgorithmPicker() {
  const { srsAlgorithm, retention } = useSettings()
  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Thuật toán lập lịch ôn tập">
        <span className="text-muted-foreground">Cách lập lịch:</span>
        {ALGOS.map((a) => (
          <button key={a.id} type="button" aria-pressed={srsAlgorithm === a.id} onClick={() => updateSettings({ srsAlgorithm: a.id })} className={CHIP}>
            {a.label}
          </button>
        ))}
      </div>
      {srsAlgorithm === "fsrs" && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Mức nhớ mục tiêu">
          <span className="text-muted-foreground">Muốn nhớ được khoảng:</span>
          {RETENTIONS.map((r) => (
            <button key={r} type="button" aria-pressed={retention === r} onClick={() => updateSettings({ retention: r })} className={CHIP}>
              {Math.round(r * 100)}%
            </button>
          ))}
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        {srsAlgorithm === "fsrs"
          ? "FSRS hẹn ôn lại đúng lúc khả năng nhớ còn khoảng mức bạn chọn. Chọn cao hơn thì ôn nhiều hơn nhưng nhớ chắc hơn."
          : "SM-2: khoảng cách tăng theo hệ số dễ của mỗi thẻ."}
      </p>
    </div>
  )
}

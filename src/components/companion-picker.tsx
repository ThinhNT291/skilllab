"use client"

import { Mascot } from "@/components/game/mascot"
import { cn } from "@/lib/utils"
import { AGE_SETS, CHARACTERS, updateSettings, useSettings } from "@/lib/settings"

/** Chọn nhân vật đồng hành và bộ giao diện theo tuổi. Lưu theo máy. */
export function CompanionPicker() {
  const { character, ageSet, feedbackMode, calmMode } = useSettings()
  const opt = (active: boolean) => cn("rounded-game border-2 bg-card px-3 py-3 text-center transition-colors", active ? "border-primary" : "border-border hover:border-primary")
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 font-extrabold">Chọn bạn đồng hành</legend>
        <div className="grid grid-cols-3 gap-2">
          {CHARACTERS.map((c) => (
            <button key={c.id} type="button" className={opt(character === c.id)} aria-pressed={character === c.id} onClick={() => updateSettings({ character: c.id })}>
              <Mascot character={c.id} mood="happy" size={72} className="mx-auto" />
              <span className="mt-1 block text-sm font-extrabold">{c.label}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-extrabold">Bạn đang học lớp mấy?</legend>
        <div className="grid grid-cols-2 gap-2">
          {AGE_SETS.map((a) => (
            <button key={a.id} type="button" className={opt(ageSet === a.id)} aria-pressed={ageSet === a.id} onClick={() => updateSettings({ ageSet: a.id })}>
              <span className="block font-extrabold">{a.label}</span>
              <span className="block text-sm text-muted-foreground">{a.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-extrabold">Khi làm sai lần đầu (câu gõ, sắp xếp, sửa lỗi)</legend>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={opt(feedbackMode === "immediate")} aria-pressed={feedbackMode === "immediate"} onClick={() => updateSettings({ feedbackMode: "immediate" })}>
            <span className="block font-extrabold">Xem đáp án ngay</span>
            <span className="block text-sm text-muted-foreground">Nhanh, nhẹ nhàng</span>
          </button>
          <button type="button" className={opt(feedbackMode === "hint-first")} aria-pressed={feedbackMode === "hint-first"} onClick={() => updateSettings({ feedbackMode: "hint-first" })}>
            <span className="block font-extrabold">Gợi ý rồi thử lại</span>
            <span className="block text-sm text-muted-foreground">Tự nghĩ thêm một lần</span>
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-extrabold">Áp lực khi học</legend>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={opt(!calmMode)} aria-pressed={!calmMode} onClick={() => updateSettings({ calmMode: false })}>
            <span className="block font-extrabold">Có chuỗi ngày và mục tiêu</span>
            <span className="block text-sm text-muted-foreground">Giúp học đều mỗi ngày</span>
          </button>
          <button type="button" className={opt(calmMode)} aria-pressed={calmMode} onClick={() => updateSettings({ calmMode: true })}>
            <span className="block font-extrabold">Nhẹ nhàng</span>
            <span className="block text-sm text-muted-foreground">Ẩn chuỗi ngày và mục tiêu</span>
          </button>
        </div>
      </fieldset>
    </div>
  )
}

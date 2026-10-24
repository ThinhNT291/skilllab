import type { KeyboardEvent, ReactNode } from "react"

/** Hoa văn trang trí ở bốn góc thẻ (SVG nội tuyến, màu theo chữ của mặt thẻ). */
function Corner({ className }: { className: string }) {
  return (
    <svg className={`flashcard-corner ${className}`} viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">
      <circle cx="20" cy="9" r="5" />
      <circle cx="31" cy="20" r="5" />
      <circle cx="20" cy="31" r="5" />
      <circle cx="9" cy="20" r="5" />
      <circle cx="20" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function Corners({ tone = "" }: { tone?: string }) {
  return (
    <>
      <Corner className={`left-3 top-3 ${tone}`} />
      <Corner className={`right-3 top-3 ${tone}`} />
      <Corner className={`bottom-3 left-3 ${tone}`} />
      <Corner className={`bottom-3 right-3 ${tone}`} />
    </>
  )
}

/** Thẻ lật 3D: mặt trước là câu hỏi, mặt sau là đáp án. Lật bằng chuột, Space hoặc Enter. */
export function Flashcard({
  frontLabel,
  backLabel,
  front,
  back,
  flipped,
  onFlip,
}: {
  frontLabel: string
  backLabel: string
  front: ReactNode
  back: ReactNode
  flipped: boolean
  onFlip: () => void
}) {
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      onFlip()
    }
  }

  return (
    <div className="flip-scene mx-auto h-[24rem] w-full max-w-sm">
      <div
        className="flip-card"
        data-flipped={flipped}
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? "Thẻ đang hiện đáp án. Nhấn để lật lại." : "Thẻ đang hiện câu hỏi. Nhấn để xem đáp án."}
        onClick={onFlip}
        onKeyDown={onKeyDown}
      >
        <div className="flip-face flashcard-front" aria-hidden={flipped}>
          <div className="flashcard-frame" />
          <Corners />
          <span className="flashcard-ribbon font-extrabold">{frontLabel}</span>
          <div className="flex h-full flex-col items-center justify-center px-9 pb-12 pt-16 text-center">{front}</div>
          <span className="absolute bottom-4 left-0 right-0 text-center text-sm opacity-80">Chạm để lật thẻ ↻</span>
        </div>
        <div className="flip-face flip-back flashcard-back" aria-hidden={!flipped}>
          <div className="flashcard-frame text-accent-deep" />
          <Corners tone="text-accent-deep" />
          <span className="flashcard-ribbon font-extrabold">{backLabel}</span>
          <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-9 pb-10 pt-16 text-center">{back}</div>
        </div>
      </div>
    </div>
  )
}

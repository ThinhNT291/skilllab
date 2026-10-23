import { cn } from "@/lib/utils"

type State = "idle" | "correct" | "wrong"

/** Nút đáp án kiểu 3D: viền dưới dày, lún khi nhấn. Đúng thì nảy, sai thì rung. */
export function ChoiceButton({
  label,
  text,
  state = "idle",
  disabled,
  onClick,
}: {
  label: string
  text: string
  state?: State
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-game border-2 border-b-[5px] px-4 py-3 text-left text-lg transition-transform",
        "enabled:cursor-pointer enabled:active:translate-y-[3px] enabled:active:border-b-2 enabled:active:mb-[3px]",
        state === "idle" && "border-border bg-card text-foreground enabled:hover:border-primary",
        state === "correct" && "anim-bounce border-success bg-success-soft text-foreground",
        state === "wrong" && "anim-shake border-danger bg-danger-soft text-foreground",
      )}
    >
      <span className="text-muted-foreground">{label}.</span> {text}
    </button>
  )
}

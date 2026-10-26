import data from "@/content/cando/vi.json"
import { getScaleTotals } from "@/lib/progress/totals"

export const metadata = { title: "Khung năng lực 6 bậc" }

type Level = { bac: number; label: string; cefr: string; listening?: string | null; speaking?: string | null; interaction?: string | null; reading?: string | null; writing?: string | null }
const levels = (data as { levels: Level[] }).levels

const SKILLS: { key: keyof Level; label: string }[] = [
  { key: "listening", label: "Nghe" },
  { key: "speaking", label: "Nói (trình bày)" },
  { key: "interaction", label: "Nói (tương tác)" },
  { key: "reading", label: "Đọc" },
  { key: "writing", label: "Viết" },
]

export default async function FrameworkPage() {
  const totals = await getScaleTotals()
  const have = (bac: number) => {
    const parts = [
      [totals.grammar[bac], "câu ngữ pháp"],
      [totals.vocab[bac], "từ vựng"],
      [totals.reading[bac], "bài đọc"],
      [totals.listening[bac], "bài nghe"],
    ].filter(([n]) => (n as number) > 0)
    return parts.length ? parts.map(([n, l]) => `${n} ${l}`).join(" · ") : "chưa có nội dung"
  }
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <h1 className="text-3xl font-extrabold">Khung năng lực 6 bậc</h1>
      <p className="mb-4 max-w-5xl text-muted-foreground">
        “Bậc” của bạn là gì và biết làm được những gì ở mỗi bậc. Nội dung trích từ Khung năng lực ngoại ngữ kèm Thông tư 33/2026/TT-BGDĐT (các bảng mô tả tổng quát). Tiền Bậc 1 tương đương Pre-A1, Bậc 1–6 tương đương A1–C2.
      </p>
      <ul className="space-y-4">
        {levels.map((l) => (
          <li key={l.bac}>
            <details className="rounded-game border-2 border-border bg-card p-4" open={l.bac === 2}>
              <summary className="cursor-pointer text-xl font-extrabold">
                {l.label} <span className="text-base font-normal text-muted-foreground">({l.cefr})</span>
              </summary>
              <dl className="mt-3 space-y-3">
                {SKILLS.filter((s) => l[s.key]).map((s) => (
                  <div key={s.key}>
                    <dt className="font-extrabold">{s.label}</dt>
                    <dd className="text-muted-foreground">{l[s.key] as string}</dd>
                  </div>
                ))}
              </dl>
              {l.bac >= 1 && (
                <p className="mt-3 border-t-2 border-border pt-2 text-sm">
                  <span className="font-extrabold">Nội dung trong ứng dụng:</span> <span className="text-muted-foreground">{have(l.bac)}</span>
                </p>
              )}
            </details>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-5xl text-sm text-muted-foreground">Mô tả được chép lại từ bản quét của văn bản nên có thể còn sai sót nhỏ; hãy đối chiếu bản gốc khi cần dùng chính thức. Bậc do máy ước lượng trong ứng dụng chỉ để tham khảo.</p>
    </main>
  )
}

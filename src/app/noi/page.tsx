import { GradePanel } from "@/components/writing/grade-panel"

export const metadata = { title: "Nói" }

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <h1 className="text-3xl font-extrabold">Nói</h1>
      <p className="mb-4 text-muted-foreground">Ghi âm câu trả lời bằng tiếng Anh, nhận điểm và nhận xét theo bốn tiêu chí. Máy chấm chỉ để tham khảo, không thay giáo viên.</p>
      <GradePanel skill="speaking" />
    </main>
  )
}

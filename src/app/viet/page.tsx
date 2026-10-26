import { GradePanel } from "@/components/writing/grade-panel"

export const metadata = { title: "Viết" }

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <h1 className="text-3xl font-extrabold">Viết</h1>
      <p className="mb-4 text-muted-foreground">Viết bằng tiếng Anh theo đề, nhận điểm và nhận xét theo bốn tiêu chí. Máy chấm chỉ để tham khảo, không thay giáo viên.</p>
      <GradePanel skill="writing" />
    </main>
  )
}

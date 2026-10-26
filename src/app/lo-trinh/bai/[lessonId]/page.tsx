import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { LessonSession } from "@/components/path/lesson-session"
import { KIND_LABEL } from "@/lib/path/catalog"
import { getLessonPayload, getPath } from "@/lib/path/data"

export const metadata = { title: "Bài trong Lộ trình" }

export default function LessonPage({ params }: PageProps<"/lo-trinh/bai/[lessonId]">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải bài…</p>}>
        <Lesson params={params} />
      </Suspense>
    </main>
  )
}

async function Lesson({ params }: { params: PageProps<"/lo-trinh/bai/[lessonId]">["params"] }) {
  await connection()
  const { lessonId } = await params
  const found = await getLessonPayload(decodeURIComponent(lessonId))
  if (!found) notFound()
  const { lesson, payload } = found
  const step = (await getPath()).find((s) => s.bac === lesson.bac && s.stepInBac === lesson.stepInBac)
  return (
    <>
      <Link href="/lo-trinh" className="text-sm text-primary underline underline-offset-4">
        ← Lộ trình
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-extrabold">
        {KIND_LABEL[lesson.kind]} · Bậc {lesson.bac} · chặng {lesson.stepInBac}
      </h1>
      <LessonSession payload={payload} bac={lesson.bac} stepLessons={(step?.lessons ?? []).map((l) => ({ id: l.id, title: l.title }))} />
    </>
  )
}

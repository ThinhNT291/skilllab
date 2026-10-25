import { Suspense } from "react"
import { StudentDetail } from "@/components/staff/student-detail"

export const metadata = { title: "Chi tiết học sinh" }

export default function StudentPage({ params }: PageProps<"/quan-ly/hoc-sinh/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Đang tải…</p>}>
      <Detail params={params} />
    </Suspense>
  )
}

async function Detail({ params }: { params: PageProps<"/quan-ly/hoc-sinh/[id]">["params"] }) {
  const { id } = await params
  return <StudentDetail id={id} />
}

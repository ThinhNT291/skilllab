import { PracticeSession } from "@/components/exercise/practice-session"
import { sampleExercises } from "@/lib/content/sample"

export const metadata = { title: "Luyện tập" }

export default function PracticePage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="mb-4 text-3xl font-extrabold">Luyện tập</h1>
      <PracticeSession exercises={sampleExercises} />
    </main>
  )
}

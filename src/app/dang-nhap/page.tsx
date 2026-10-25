import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = { title: "Đăng nhập" }

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-md">
      <h1 className="mb-1 text-3xl font-extrabold">Đăng nhập</h1>
      <p className="mb-4 text-muted-foreground">Dùng tên đăng nhập và mật khẩu do giáo viên cấp.</p>
      <Suspense fallback={<p className="text-muted-foreground">Đang tải…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}

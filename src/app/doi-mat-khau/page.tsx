import { PasswordForm } from "@/components/auth/password-form"

export const metadata = { title: "Đổi mật khẩu" }

export default function ForcedPasswordPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-md">
      <h1 className="mb-1 text-3xl font-extrabold">Đặt mật khẩu của riêng bạn</h1>
      <p className="mb-4 text-muted-foreground">Mật khẩu giáo viên đưa chỉ dùng cho lần đầu. Hãy chọn mật khẩu mới mà bạn nhớ được, và đừng chia sẻ cho ai.</p>
      <PasswordForm forced />
    </main>
  )
}

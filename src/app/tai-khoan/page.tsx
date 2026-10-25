import { AccountView } from "@/components/auth/account-view"

export const metadata = { title: "Tài khoản" }

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-md">
      <h1 className="mb-4 text-3xl font-extrabold">Tài khoản của bạn</h1>
      <AccountView />
    </main>
  )
}

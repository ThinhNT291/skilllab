import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "./globals.css"
import { SettingsBar } from "@/components/settings-bar"
import { SiteNav } from "@/components/site-nav"

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  variable: "--font-nunito",
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "Training Zone", template: "%s · Training Zone" },
  description: "Luyện ngoại ngữ có chấm điểm, nhận xét và theo dõi tiến độ.",
}

// Đặt skin đã lưu trước khi vẽ trang để tránh nháy màu khi tải.
const applySkin = `try{var s=JSON.parse(localStorage.getItem("skilllab.settings")||"{}").skin;if(s)document.documentElement.dataset.skin=s}catch(e){}`

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${nunito.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applySkin }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <div className="mx-auto w-full max-w-xl space-y-3 px-4 pt-4">
          <SiteNav />
          <SettingsBar />
        </div>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  )
}

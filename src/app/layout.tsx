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
const applySkin = `try{var o=JSON.parse(localStorage.getItem("skilllab.settings")||"{}");if(o.skin)document.documentElement.dataset.skin=o.skin;if(o.fontSize)document.documentElement.dataset.font=o.fontSize}catch(e){}`

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${nunito.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applySkin }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#noi-dung" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-game focus:bg-primary focus:px-4 focus:py-2 focus:font-extrabold focus:text-primary-foreground">
          Bỏ qua, tới nội dung chính
        </a>
        <div className="mx-auto w-full max-w-xl space-y-3 px-4 pt-4">
          <SiteNav />
          <SettingsBar />
        </div>
        <div id="noi-dung" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </div>
      </body>
    </html>
  )
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** Đích quay về sau khi đăng nhập Google: đổi mã lấy phiên rồi về trang chủ. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/`)
  }
  return NextResponse.redirect(`${origin}/dang-nhap?error=google`)
}

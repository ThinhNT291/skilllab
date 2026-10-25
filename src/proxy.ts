import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/update-session"
import { canViewStaffArea, isRole } from "@/lib/auth/roles"

/**
 * Cổng kiểm tra đăng nhập cho các khu cần tài khoản thật. Học sinh học thử (đăng nhập ẩn danh) vẫn dùng mọi trang học bình thường.
 *  - /quan-ly: chỉ giáo viên và quản trị (kiểm tra vai trò trong hồ sơ; chặn thật nằm ở RLS và API route).
 *  - /doi-mat-khau: chỉ khi tài khoản còn cờ must_change_password; còn cờ này thì mọi khu trên đều bị chuyển về đó.
 *  - /tai-khoan cần tài khoản thật (không phải ẩn danh); /dang-nhap chuyển về trang chủ nếu đã có tài khoản thật.
 */
export async function proxy(request: NextRequest) {
  const { supabase, user, response } = await updateSession(request)
  const path = request.nextUrl.pathname
  const go = (to: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone()
    url.pathname = to
    url.search = ""
    Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))
    return NextResponse.redirect(url)
  }
  if (!supabase) return response

  const real = !!user && user.is_anonymous !== true
  const mustChange = real && user!.app_metadata?.must_change_password === true

  if (path === "/doi-mat-khau") {
    if (!real) return go("/dang-nhap")
    return mustChange ? response : go("/tai-khoan")
  }
  if (mustChange && path !== "/dang-nhap") return go("/doi-mat-khau")

  if (path === "/dang-nhap") return real && !mustChange ? go("/") : response

  if (path === "/tai-khoan") return real ? response : go("/dang-nhap", { redirect: path })

  if (path === "/quan-ly" || path.startsWith("/quan-ly/")) {
    if (!real) return go("/dang-nhap", { redirect: path })
    const { data } = await supabase.from("profiles").select("role, disabled_at").eq("auth_user_id", user!.id).maybeSingle()
    if (!data || data.disabled_at || !isRole(data.role) || !canViewStaffArea(data.role)) return go("/")
  }
  return response
}

export const config = {
  matcher: ["/quan-ly/:path*", "/quan-ly", "/tai-khoan", "/doi-mat-khau", "/dang-nhap"],
}

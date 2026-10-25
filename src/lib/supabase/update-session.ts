import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { supabaseEnv } from "./env"

/** Làm mới phiên đăng nhập trong proxy và trả về người dùng hiện tại (null nếu chưa đăng nhập hoặc chưa cấu hình Supabase). */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const env = supabaseEnv()
  if (!env) return { supabase: null, user: null, response }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user, response }
}

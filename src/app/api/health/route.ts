import { connection } from "next/server"
import { supabaseEnv } from "@/lib/supabase/env"

/**
 * Kiểm tra kết nối Supabase khi chạy dev: mở http://localhost:3000/api/health
 * Không trả về khóa hay dữ liệu, chỉ trạng thái. Có thể xóa route này khi đã có màn đăng nhập.
 */
export async function GET() {
  await connection() // luôn chạy lúc có yêu cầu, không dựng sẵn lúc build
  const env = supabaseEnv()
  if (!env) {
    return Response.json({ ok: false, supabase: "chưa cấu hình", hint: "Điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local rồi chạy lại npm run dev" })
  }
  try {
    // /auth/v1/health trả 200 khi dự án đang chạy và khóa hợp lệ; dự án bị tạm dừng sẽ lỗi.
    const res = await fetch(`${env.url}/auth/v1/health`, { headers: { apikey: env.anonKey }, signal: AbortSignal.timeout(8000) })
    return Response.json({ ok: res.ok, supabase: res.ok ? "kết nối được" : `lỗi HTTP ${res.status}`, host: new URL(env.url).host })
  } catch {
    return Response.json({ ok: false, supabase: "không kết nối được (dự án có thể đang tạm dừng hoặc URL sai)" })
  }
}

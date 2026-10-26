import { createClient } from "@/lib/supabase/client"
import { existingProfileId } from "./session"

export type RemoteSettings = { settings: unknown; row: boolean }

/**
 * Cài đặt đã lưu trên tài khoản. `null` nếu chưa có phiên/hồ sơ hoặc lỗi (bảng chưa tạo vì chưa chạy migration 0012...).
 * `row: false` nghĩa là có phiên nhưng chưa lưu gì.
 */
export async function fetchRemoteSettings(): Promise<RemoteSettings | null> {
  try {
    const id = await existingProfileId()
    if (!id) return null
    const { data, error } = await createClient().from("profile_settings").select("settings").eq("profile_id", id).maybeSingle()
    if (error) return null
    return data ? { settings: data.settings, row: true } : { settings: null, row: false }
  } catch {
    return null
  }
}

/** Ghi cài đặt lên tài khoản. Trả false nếu chưa có phiên hoặc lỗi; không ném lỗi (không được chặn việc học). */
export async function pushRemoteSettings(settings: unknown): Promise<boolean> {
  try {
    const id = await existingProfileId()
    if (!id) return false
    const { error } = await createClient().from("profile_settings").upsert({ profile_id: id, settings, updated_at: new Date().toISOString() }, { onConflict: "profile_id" })
    return !error
  } catch {
    return false
  }
}

import { createClient } from "@/lib/supabase/client"
import { dbConfigured, ensureProfile } from "./session"

export interface OwnedItems {
  owned: string[]
  equipped: string[]
}

export type ItemsResult = ({ ok: true } & OwnedItems) | { ok: false; reason: "not_configured" | "error"; message?: string }
export type ItemWrite = { ok: true } | { ok: false; reason: "not_configured" | "error"; message?: string }

function fail(e: unknown): { ok: false; reason: "error"; message: string } {
  return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
}

export async function getOwnedItems(): Promise<ItemsResult> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const { data, error } = await createClient().from("player_items").select("item_id, equipped").eq("profile_id", profile.id)
    if (error) return { ok: false, reason: "error", message: error.message }
    const rows = (data ?? []) as { item_id: string; equipped: boolean }[]
    return { ok: true, owned: rows.map((r) => r.item_id), equipped: rows.filter((r) => r.equipped).map((r) => r.item_id) }
  } catch (e) {
    return fail(e)
  }
}

/** Mua vật phẩm (bỏ qua nếu đã có). */
export async function buyItem(itemId: string): Promise<ItemWrite> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const { error } = await createClient()
      .from("player_items")
      .upsert({ profile_id: profile.id, item_id: itemId }, { onConflict: "profile_id,item_id", ignoreDuplicates: true })
    return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** Lưu lại toàn bộ trạng thái đang đeo: những món có trong `equipped` là true, còn lại false. */
export async function saveEquipped(equipped: string[]): Promise<ItemWrite> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const supabase = createClient()
    const off = await supabase.from("player_items").update({ equipped: false }).eq("profile_id", profile.id)
    if (off.error) return { ok: false, reason: "error", message: off.error.message }
    if (equipped.length) {
      const on = await supabase.from("player_items").update({ equipped: true }).eq("profile_id", profile.id).in("item_id", equipped)
      if (on.error) return { ok: false, reason: "error", message: on.error.message }
    }
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

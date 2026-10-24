/** Vật phẩm trang trí cho linh vật. Chỉ để làm đẹp, không ảnh hưởng điểm hay nội dung học. */
export type Slot = "head" | "face" | "neck"

export interface ShopItem {
  id: string
  name: string
  emoji: string
  slot: Slot
  cost: number
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "bow", name: "Nơ xinh", emoji: "🎀", slot: "head", cost: 15 },
  { id: "cap", name: "Mũ tốt nghiệp", emoji: "🎓", slot: "head", cost: 30 },
  { id: "crown", name: "Vương miện", emoji: "👑", slot: "head", cost: 80 },
  { id: "glasses", name: "Kính tròn", emoji: "👓", slot: "face", cost: 25 },
  { id: "shades", name: "Kính râm", emoji: "😎", slot: "face", cost: 40 },
  { id: "scarf", name: "Khăn quàng", emoji: "🧣", slot: "neck", cost: 20 },
  { id: "medal", name: "Huy chương", emoji: "🏅", slot: "neck", cost: 60 },
]

export const SLOT_LABEL: Record<Slot, string> = { head: "Đầu", face: "Mặt", neck: "Cổ" }

export function itemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id)
}

export function spentOn(ownedIds: string[]): number {
  return ownedIds.reduce((sum, id) => sum + (itemById(id)?.cost ?? 0), 0)
}

/** Bật một vật phẩm thì tắt vật phẩm khác cùng vị trí; bật lại vật đang đeo thì tháo ra. */
export function toggleEquip(equipped: string[], id: string): string[] {
  const item = itemById(id)
  if (!item) return equipped
  if (equipped.includes(id)) return equipped.filter((e) => e !== id)
  return [...equipped.filter((e) => itemById(e)?.slot !== item.slot), id]
}

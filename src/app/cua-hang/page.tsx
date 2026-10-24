import { ShopView } from "@/components/game/shop-view"

export const metadata = { title: "Cửa hàng" }

export default function ShopPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-3xl font-extrabold">Cửa hàng của cú</h1>
      <ShopView />
    </main>
  )
}

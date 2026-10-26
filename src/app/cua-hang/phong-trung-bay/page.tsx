import { RoomDemo } from "@/components/game/mascot3d/room-demo"

export const metadata = { title: "Phòng trưng bày 3D (thử nghiệm)" }

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-3xl">
      <h1 className="text-3xl font-extrabold">Phòng trưng bày 3D</h1>
      <p className="mb-4 text-muted-foreground">Bản thử nghiệm: kéo giữ chuột để xoay linh vật 360°, thử đeo phụ kiện và đặt đồ trang trí. Chưa lưu gì vào tài khoản.</p>
      <RoomDemo />
    </main>
  )
}

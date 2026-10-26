/**
 * Ba nhân vật 3D low poly (không phải người) dùng tệp mô hình miễn phí có giấy phép đã kiểm chứng (xem public/models/CREDITS.md):
 *  - Cáo: Fox (PixelMannen CC0; xương và hoạt ảnh tomkranis CC-BY 4.0; chuyển glTF AsoboStudio và scurest CC-BY 4.0), từ KhronosGroup/glTF-Sample-Assets.
 *  - Robot: RobotExpressive (Tomás Laulhé / Quaternius, CC0; chỉnh sửa Don McCurdy), từ ví dụ của three.js.
 *  - Bạn nhỏ: nhân vật Starter Kit 3D Platformer (Kenney, giấy phép MIT).
 * Vị trí neo phụ kiện tính theo "không gian chuẩn hóa" (nhân vật co giãn theo `size`, chân chạm sàn, quay mặt về +z, tâm ở gốc), tính từ vị trí lúc đứng yên của một xương/nút.
 */
export type CharacterId = "fox" | "robot" | "buddy"

export interface Anchor {
  /** Tên xương/nút để gắn vào: phụ kiện đi theo hoạt ảnh và vị trí tính từ vị trí lúc đứng yên của xương này */
  bone: string
  /** Điểm gốc lúc đứng yên: gốc của xương/nút ("origin"), hoặc theo hộp bao của phần cơ thể gắn với xương: tâm, đỉnh (giữa, cao nhất) hay mặt trước (giữa, ra xa nhất về +z) */
  at?: "origin" | "center" | "top" | "front"
  /** Độ lệch so với điểm gốc trong không gian chuẩn hóa (x phải, y lên, z về phía trước) */
  offset: [number, number, number]
  /** Hệ số phóng phụ kiện so với cỡ chuẩn (đầu rộng khoảng 1 đơn vị) */
  scale: number
  /** Nghiêng về phía trước (radian), cho nhân vật cúi đầu */
  rotX?: number
}

export interface CharacterDef {
  id: CharacterId
  name: string
  url: string
  /** Cạnh dài nhất sau khi chuẩn hóa (cáo đi bốn chân nên lấy cạnh dài, không lấy chiều cao) */
  size: number
  /** "height": co theo chiều cao; "max": co theo cạnh dài nhất */
  fit: "height" | "max"
  /** Xoay quanh trục y (radian) để mặt nhìn về +z */
  yaw: number
  /** Tên hoạt ảnh lặp khi đứng yên (null = không có) */
  idle: string | null
  /** Chữ ghi công hiện trên trang */
  credit: string
  anchors: { head: Anchor; face: Anchor; neck: Anchor; chest: Anchor }
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  fox: {
    id: "fox",
    name: "Cáo",
    url: "/models/fox.glb",
    size: 4.4,
    fit: "max",
    yaw: 0,
    idle: "Survey",
    credit: "Cáo: mô hình PixelMannen (CC0), xương và hoạt ảnh tomkranis (CC BY 4.0), chuyển glTF AsoboStudio và scurest (CC BY 4.0).",
    anchors: {
      head: { bone: "b_Head_05", at: "top", offset: [0, -0.05, -0.1], scale: 0.4 },
      face: { bone: "b_Head_05", at: "front", offset: [0, 0.1, -0.45], scale: 0.38, rotX: 0.3 },
      neck: { bone: "b_Neck_04", offset: [0, 0, 0.02], scale: 0.55, rotX: 0.8 },
      chest: { bone: "b_Neck_04", offset: [0, -0.3, 0.22], scale: 0.3, rotX: 0.5 },
    },
  },
  robot: {
    id: "robot",
    name: "Robot",
    url: "/models/robot.glb",
    size: 2.6,
    fit: "height",
    yaw: 0,
    idle: "Idle",
    credit: "Robot: Tomás Laulhé / Quaternius (CC0), chỉnh sửa Don McCurdy.",
    anchors: {
      head: { bone: "Head", at: "top", offset: [0, -0.3, 0], scale: 0.9 },
      face: { bone: "Head", at: "front", offset: [0, 0.05, -0.1], scale: 0.8 },
      neck: { bone: "Neck", offset: [0, 0, 0], scale: 0.9 },
      chest: { bone: "Torso", offset: [0, -0.05, 0.4], scale: 0.7 },
    },
  },
  buddy: {
    id: "buddy",
    name: "Bạn nhỏ",
    url: "/models/buddy.glb",
    size: 2.6,
    fit: "height",
    yaw: -Math.PI / 2,
    idle: "idle",
    credit: "Bạn nhỏ: Kenney (giấy phép MIT).",
    anchors: {
      head: { bone: "torso", at: "origin", offset: [0, 1.32, 0], scale: 0.9 },
      face: { bone: "torso", at: "origin", offset: [0, 0.85, 0.82], scale: 0.9 },
      neck: { bone: "torso", at: "origin", offset: [0, 0.5, 0], scale: 1.12 },
      chest: { bone: "torso", at: "origin", offset: [0, 0.2, 0.86], scale: 0.5 },
    },
  },
}

export const CHARACTER_IDS = Object.keys(CHARACTERS) as CharacterId[]

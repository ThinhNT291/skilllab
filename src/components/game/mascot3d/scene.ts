/**
 * Cảnh 3D low poly của linh vật (bản thử): nhân vật là mô hình glTF miễn phí (xem characters.ts), kéo chuột xoay 360°, đeo phụ kiện dựng bằng mã,
 * đặt đồ trang trí không gian, màu sàn/thảm đổi theo giao diện.
 * Mã bắt buộc chạy trên trình duyệt (cần WebGL). Chia nhỏ để dùng được cả không qua React: `createScene(THREE, container, opts)`.
 */
import type * as ThreeNS from "three"
import { CHARACTERS, type CharacterDef, type CharacterId } from "./characters"

type THREE = typeof ThreeNS

export interface SceneColors {
  primary: string
  primaryDeep: string
  card: string
  accent: string
  ground: string
}

export interface SceneOptions {
  colors: SceneColors
  /** Giảm chuyển động: không tự xoay, không hoạt ảnh nhịp thở/chớp mắt */
  reducedMotion: boolean
}

export interface SceneApi {
  setItems(ids: string[]): void
  /** Tải và hiện một nhân vật (thay nhân vật đang có). Phụ kiện đang đeo được gắn lại vào nhân vật mới. */
  setCharacter(id: CharacterId): Promise<void>
  setDecor(ids: string[]): void
  setColors(c: SceneColors): void
  /** Xoay quanh nhân vật (radian) */
  rotate(dTheta: number, dPhi: number): void
  zoom(factor: number): void
  reset(): void
  setReducedMotion(v: boolean): void
  dispose(): void
}

/** Mã phụ kiện đeo (khớp `src/lib/game/shop.ts`) và đồ trang trí không gian. */
export const ACCESSORY_IDS = ["bow", "cap", "crown", "glasses", "shades", "scarf", "medal"] as const
export const DECOR_IDS = ["plant", "lamp", "rug", "books"] as const
export const DECOR_LABEL: Record<(typeof DECOR_IDS)[number], string> = { plant: "Chậu cây", lamp: "Đèn", rug: "Thảm", books: "Chồng sách" }

const GOLD = "#f5b301"
const DEFAULT_THETA = 0.55
const DEFAULT_PHI = 1.28
const DEFAULT_DIST = 7.4
const MIN_DIST = 4
const MAX_DIST = 14
const TARGET_Y = 1.25

export function createScene(T: THREE, container: HTMLElement, opts: SceneOptions): SceneApi {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.domElement.style.display = "block"
  renderer.domElement.style.width = "100%"
  renderer.domElement.style.height = "100%"
  container.appendChild(renderer.domElement)

  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(36, 1, 0.1, 60)
  scene.add(new T.HemisphereLight("#ffffff", "#8a8fb0", 1.15))
  const sun = new T.DirectionalLight("#ffffff", 1.6)
  sun.position.set(3, 6, 4)
  scene.add(sun)

  let colors = opts.colors
  let reduced = opts.reducedMotion
  const disposables: { dispose(): void }[] = []
  const track = <D extends { dispose(): void }>(d: D): D => {
    disposables.push(d)
    return d
  }
  const mats = new Map<string, ThreeNS.MeshStandardMaterial>()
  /** Chất liệu bóng phẳng dùng chung theo màu (tên màu hoặc mã). */
  const mat = (key: string, color: string, extra?: ThreeNS.MeshStandardMaterialParameters) => {
    const k = `${key}|${color}`
    let m = mats.get(k)
    if (!m) {
      m = track(new T.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0.02, ...extra }))
      mats.set(k, m)
    }
    return m
  }
  const themed: { mesh: ThreeNS.Mesh; role: keyof SceneColors | "white" | "dark" }[] = []
  const themedMesh = (geo: ThreeNS.BufferGeometry, role: keyof SceneColors | "white" | "dark", extra?: ThreeNS.MeshStandardMaterialParameters) => {
    track(geo)
    const color = role === "white" ? "#ffffff" : role === "dark" ? "#1b1b2f" : colors[role]
    const mesh = new T.Mesh(geo, mat(`theme-${role}`, color, extra))
    themed.push({ mesh, role })
    return mesh
  }
  const solid = (geo: ThreeNS.BufferGeometry, color: string, extra?: ThreeNS.MeshStandardMaterialParameters) => {
    track(geo)
    return new T.Mesh(geo, mat("fixed", color, extra))
  }

  // ---------- Nhân vật (mô hình glTF) ----------
  const actor = new T.Group()
  scene.add(actor)
  let mixer: ThreeNS.AnimationMixer | null = null
  let idleAction: ThreeNS.AnimationAction | null = null
  let current: CharacterDef | null = null
  let loadToken = 0
  let equipped: string[] = []

  // Bóng đổ giả dưới chân (không dùng bản đồ bóng cho nhẹ)
  const blob = new T.Mesh(track(new T.CircleGeometry(1.15, 20)), track(new T.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.16 })))
  blob.rotation.x = -Math.PI / 2
  blob.position.y = 0.01
  scene.add(blob)

  // ---------- Phụ kiện: dựng quanh gốc, đặt vào neo của từng nhân vật ----------
  const accessoryBuilders: Record<string, { slot: "head" | "face" | "neck" | "chest"; build: (g: ThreeNS.Group) => void }> = {
    bow: {
      slot: "head",
      build: (g) => {
        for (const s of [-1, 1]) {
          const wing = solid(new T.ConeGeometry(0.22, 0.4, 4), "#ec4899")
          wing.rotation.z = s * (Math.PI / 2)
          wing.position.set(0.55 + s * 0.2, 0.05, 0)
          g.add(wing)
        }
        const knot = solid(new T.IcosahedronGeometry(0.1, 0), "#be185d")
        knot.position.set(0.55, 0.05, 0)
        g.add(knot)
      },
    },
    cap: {
      slot: "head",
      build: (g) => {
        const base = solid(new T.CylinderGeometry(0.5, 0.55, 0.22, 8), "#1f2937")
        const board = solid(new T.BoxGeometry(1.25, 0.07, 1.25), "#111827")
        board.rotation.y = Math.PI / 4
        board.position.y = 0.16
        const tassel = solid(new T.CylinderGeometry(0.02, 0.02, 0.4, 4), GOLD)
        tassel.position.set(0.6, 0, 0.15)
        const tip = solid(new T.IcosahedronGeometry(0.07, 0), GOLD)
        tip.position.set(0.6, -0.2, 0.15)
        g.add(base, board, tassel, tip)
      },
    },
    crown: {
      slot: "head",
      build: (g) => {
        g.add(solid(new T.CylinderGeometry(0.5, 0.55, 0.2, 10), GOLD))
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2
          const tip = solid(new T.ConeGeometry(0.11, 0.3, 4), GOLD)
          tip.position.set(Math.cos(a) * 0.48, 0.22, Math.sin(a) * 0.48)
          g.add(tip)
          const gem = solid(new T.IcosahedronGeometry(0.06, 0), "#ef4444")
          gem.position.set(Math.cos(a) * 0.5, 0.4, Math.sin(a) * 0.5)
          g.add(gem)
        }
      },
    },
    glasses: {
      slot: "face",
      build: (g) => {
        for (const s of [-1, 1]) {
          const rim = solid(new T.TorusGeometry(0.3, 0.045, 5, 10), "#1f2937")
          rim.position.set(s * 0.36, 0, 0)
          g.add(rim)
        }
        const bridge = solid(new T.BoxGeometry(0.16, 0.05, 0.05), "#1f2937")
        bridge.position.y = 0.03
        g.add(bridge)
      },
    },
    shades: {
      slot: "face",
      build: (g) => {
        for (const s of [-1, 1]) {
          const lens = solid(new T.BoxGeometry(0.58, 0.38, 0.08), "#0f172a")
          lens.position.set(s * 0.36, 0, 0)
          g.add(lens)
        }
        const bridge = solid(new T.BoxGeometry(0.2, 0.07, 0.07), "#0f172a")
        bridge.position.y = 0.06
        g.add(bridge)
      },
    },
    scarf: {
      slot: "neck",
      build: (g) => {
        const ring = solid(new T.TorusGeometry(0.72, 0.18, 5, 12), "#ef4444")
        ring.rotation.x = Math.PI / 2
        const tail = solid(new T.BoxGeometry(0.28, 0.75, 0.12), "#dc2626")
        tail.position.set(0.4, -0.4, 0.62)
        tail.rotation.z = 0.12
        g.add(ring, tail)
      },
    },
    medal: {
      slot: "chest",
      build: (g) => {
        const ribbon = solid(new T.BoxGeometry(0.16, 0.5, 0.05), "#2563eb")
        ribbon.position.y = 0.3
        const disc = solid(new T.CylinderGeometry(0.2, 0.2, 0.07, 10), GOLD)
        disc.rotation.x = Math.PI / 2
        g.add(ribbon, disc)
      },
    },
  }
  let accessoryGroups: Map<string, ThreeNS.Group> = new Map()

  /**
   * Hộp bao (không gian thế giới, lúc đứng yên) của phần cơ thể gắn với một xương: các đỉnh mà xương đó ảnh hưởng nhiều nhất; nút không có da thì lấy hộp bao của nút.
   * Trả điểm theo `at`: gốc của xương, tâm, đỉnh (giữa x và z, cao nhất) hoặc mặt trước (giữa x và y, ra xa nhất về +z).
   */
  function restPoint(bone: ThreeNS.Object3D, at: "origin" | "center" | "top" | "front"): ThreeNS.Vector3 {
    if (at === "origin") return bone.getWorldPosition(new T.Vector3())
    const box = new T.Box3()
    const v = new T.Vector3()
    let any = false
    actor.traverse((o) => {
      const sm = o as ThreeNS.SkinnedMesh
      if (!sm.isSkinnedMesh) return
      const idx = sm.skeleton.bones.indexOf(bone as ThreeNS.Bone)
      if (idx < 0) return
      const si = sm.geometry.getAttribute("skinIndex")
      const sw = sm.geometry.getAttribute("skinWeight")
      for (let i = 0; i < si.count; i++) {
        let best = 0
        let bestW = -1
        for (let k = 0; k < 4; k++) {
          const w = sw.getComponent(i, k)
          if (w > bestW) {
            bestW = w
            best = si.getComponent(i, k)
          }
        }
        if (best === idx && bestW > 0.5) {
          sm.getVertexPosition(i, v).applyMatrix4(sm.matrixWorld)
          box.expandByPoint(v)
          any = true
        }
      }
    })
    if (!any) box.setFromObject(bone, true)
    const c = box.getCenter(new T.Vector3())
    if (at === "top") return new T.Vector3(c.x, box.max.y, c.z)
    if (at === "front") return new T.Vector3(c.x, c.y, box.max.z)
    return c
  }

  /** Dựng lại phụ kiện đang đeo vào neo của nhân vật hiện tại (gắn vào xương/nút để đi theo hoạt ảnh nhưng giữ đúng vị trí lúc đứng yên). */
  function mountAccessories() {
    for (const g of accessoryGroups.values()) g.removeFromParent()
    accessoryGroups = new Map()
    if (!current) return
    actor.updateMatrixWorld(true)
    for (const id of equipped) {
      const def = accessoryBuilders[id]
      if (!def) continue
      const anchor = current.anchors[def.slot]
      const bone = actor.getObjectByName(anchor.bone)
      const g = new T.Group()
      def.build(g)
      g.scale.setScalar(anchor.scale)
      g.rotation.order = "YXZ"
      g.rotation.x = anchor.rotX ?? 0
      g.rotation.y = anchor.rotY ?? 0
      // Đặt theo phần cơ thể gắn với xương lúc đứng yên rồi gắn vào xương để đi theo hoạt ảnh (attach giữ nguyên vị trí thế giới).
      const base = bone ? restPoint(bone, anchor.at ?? "center") : new T.Vector3()
      g.position.set(base.x + anchor.offset[0], base.y + anchor.offset[1], base.z + anchor.offset[2])
      actor.add(g)
      g.updateMatrixWorld(true)
      if (bone) bone.attach(g)
      accessoryGroups.set(id, g)
    }
  }

  async function loadCharacter(def: CharacterDef): Promise<void> {
    const token = ++loadToken
    const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js")
    const gltf = await new GLTFLoader().loadAsync(def.url)
    if (token !== loadToken) return
    // Bỏ nhân vật cũ
    for (const g of accessoryGroups.values()) g.removeFromParent()
    accessoryGroups = new Map()
    actor.clear()
    mixer?.stopAllAction()
    mixer = null
    idleAction = null

    const model = gltf.scene
    model.rotation.y = def.yaw
    const holder = new T.Group()
    holder.add(model)
    actor.add(holder)
    holder.updateMatrixWorld(true)
    const box = new T.Box3().setFromObject(holder, true)
    const size = box.getSize(new T.Vector3())
    const k = def.size / Math.max(def.fit === "max" ? Math.max(size.x, size.y, size.z) : size.y, 1e-6)
    holder.scale.setScalar(k)
    holder.updateMatrixWorld(true)
    const box2 = new T.Box3().setFromObject(holder, true)
    const c = box2.getCenter(new T.Vector3())
    holder.position.set(-c.x, -box2.min.y, -c.z)
    holder.traverse((o) => {
      const m = o as ThreeNS.Mesh
      if (m.isMesh) {
        m.frustumCulled = false
        const geo = m.geometry
        disposables.push(geo)
        const mats = Array.isArray(m.material) ? m.material : [m.material]
        for (const mm of mats) disposables.push(mm)
      }
    })
    current = def
    if (def.idle) {
      const clip = gltf.animations.find((a) => a.name === def.idle) ?? gltf.animations[0]
      if (clip) {
        mixer = new T.AnimationMixer(model)
        idleAction = mixer.clipAction(clip)
        idleAction.play()
        // Giảm chuyển động: giữ nguyên một tư thế
        if (reduced) idleAction.paused = true
      }
    }
    mountAccessories()
    if (debug) {
      const names: string[] = []
      holder.traverse((o) => {
        if (o.name) names.push(`${o.name}@${o.getWorldPosition(new T.Vector3()).toArray().map((n) => n.toFixed(2)).join(",")}`)
      })
      console.log("[mascot3d]", def.id, "size", size.toArray().map((n) => n.toFixed(2)).join("x"), "scale", k.toFixed(4), names.slice(0, 60).join(" | "))
    }
  }
  const debug = new URLSearchParams(window.location.search).has("debug3d")

  // ---------- Đồ trang trí không gian ----------
  const decor = new Map<string, ThreeNS.Group>()
  const decorItem = (id: string, build: (g: ThreeNS.Group) => void) => {
    const g = new T.Group()
    build(g)
    g.visible = false
    scene.add(g)
    decor.set(id, g)
  }
  decorItem("plant", (g) => {
    const pot = solid(new T.CylinderGeometry(0.34, 0.26, 0.42, 6), "#b45309")
    pot.position.set(-2.1, 0.21, -0.5)
    g.add(pot)
    for (let i = 0; i < 3; i++) {
      const leaf = solid(new T.ConeGeometry(0.34 - i * 0.07, 0.62, 5), i % 2 ? "#16a34a" : "#22c55e")
      leaf.position.set(-2.1, 0.7 + i * 0.36, -0.5)
      g.add(leaf)
    }
  })
  decorItem("lamp", (g) => {
    const stand = solid(new T.CylinderGeometry(0.05, 0.08, 1.9, 5), "#6b7280")
    stand.position.set(2.2, 0.95, -0.7)
    const shade = solid(new T.ConeGeometry(0.42, 0.46, 6, 1, true), "#fde68a", { emissive: "#fbbf24", emissiveIntensity: 0.55, side: T.DoubleSide })
    shade.position.set(2.2, 2.05, -0.7)
    shade.rotation.x = Math.PI
    const base = solid(new T.CylinderGeometry(0.28, 0.32, 0.08, 6), "#6b7280")
    base.position.set(2.2, 0.04, -0.7)
    g.add(stand, shade, base)
  })
  decorItem("rug", (g) => {
    const rug = themedMesh(new T.CylinderGeometry(2.0, 2.0, 0.04, 14), "accent")
    rug.position.set(0, 0.02, 0.1)
    const inner = themedMesh(new T.CylinderGeometry(1.45, 1.45, 0.05, 14), "card")
    inner.position.set(0, 0.025, 0.1)
    g.add(rug, inner)
  })
  decorItem("books", (g) => {
    const cols = ["#2563eb", "#dc2626", "#16a34a"]
    cols.forEach((c, i) => {
      const b = solid(new T.BoxGeometry(0.9 - i * 0.12, 0.17, 0.6), c)
      b.position.set(1.7, 0.09 + i * 0.17, 1.5)
      b.rotation.y = 0.25 * (i - 1)
      g.add(b)
    })
  })

  // Sàn
  const floor = themedMesh(new T.CylinderGeometry(2.9, 3.0, 0.12, 24), "ground")
  floor.position.y = -0.06
  scene.add(floor)

  // ---------- Máy ảnh quay quanh nhân vật ----------
  // Chỉ để chụp màn hình kiểm tra: ?angle3d=<radian> đặt góc nhìn ban đầu (0 = chính diện).
  const angleParam = new URLSearchParams(window.location.search).get("angle3d")
  const startTheta = angleParam !== null && Number.isFinite(Number(angleParam)) ? Number(angleParam) : DEFAULT_THETA
  let theta = startTheta
  let phi = DEFAULT_PHI
  let dist = DEFAULT_DIST
  let vTheta = 0
  let autoRotate = !reduced
  const target = new T.Vector3(0, TARGET_Y, 0)
  function place() {
    phi = Math.min(1.5, Math.max(0.35, phi))
    dist = Math.min(MAX_DIST, Math.max(MIN_DIST, dist))
    camera.position.set(target.x + dist * Math.sin(phi) * Math.sin(theta), target.y + dist * Math.cos(phi), target.z + dist * Math.sin(phi) * Math.cos(theta))
    camera.lookAt(target)
  }

  function applyColors() {
    for (const t of themed) {
      const color = t.role === "white" ? "#ffffff" : t.role === "dark" ? "#1b1b2f" : colors[t.role]
      t.mesh.material = mat(`theme-${t.role}`, color)
    }
  }

  // ---------- Vòng vẽ ----------
  let raf = 0
  let running = true
  let visible = true
  let last = performance.now()
  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    if (!running || !visible || document.hidden) {
      last = now
      return
    }
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (autoRotate && !reduced) theta += dt * 0.35
    if (Math.abs(vTheta) > 0.0002) {
      theta += vTheta
      vTheta *= 0.92
    }
    if (mixer && !reduced) mixer.update(dt)
    place()
    renderer.render(scene, camera)
  }

  function resize() {
    const w = Math.max(1, container.clientWidth)
    const h = Math.max(1, container.clientHeight)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting)
  })
  io.observe(container)
  resize()
  place()
  raf = requestAnimationFrame(frame)
  applyColors()

  return {
    setItems(ids) {
      equipped = ids
      mountAccessories()
    },
    setCharacter(id) {
      return loadCharacter(CHARACTERS[id])
    },
    setDecor(ids) {
      for (const [id, g] of decor) g.visible = ids.includes(id)
    },
    setColors(c) {
      colors = c
      applyColors()
    },
    rotate(dTheta, dPhi) {
      autoRotate = false
      theta += dTheta
      phi += dPhi
      vTheta = dTheta * 0.4
    },
    zoom(factor) {
      dist *= factor
    },
    reset() {
      theta = startTheta
      phi = DEFAULT_PHI
      dist = DEFAULT_DIST
      vTheta = 0
      autoRotate = !reduced
    },
    setReducedMotion(v) {
      reduced = v
      if (v) autoRotate = false
      if (idleAction) idleAction.paused = v
    },
    dispose() {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      for (const d of disposables) d.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

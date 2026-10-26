"use client"

import { useEffect, useRef, useState } from "react"
import { Mascot } from "@/components/game/mascot"
import type { SceneApi, SceneColors } from "./scene"
import type { CharacterId } from "./characters"

/** Màu của giao diện đang chọn (biến CSS trên <html>), để cảnh 3D đổi theo skin. */
function themeColors(): SceneColors {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return { primary: v("--primary", "#4f46e5"), primaryDeep: v("--primary-deep", "#3730a3"), card: v("--card", "#ffffff"), accent: v("--accent", "#f59e0b"), ground: v("--border", "#e2e8f0") }
}

const STEP = 0.18

/**
 * Linh vật 3D low poly: kéo giữ chuột (hoặc vuốt ngang trên điện thoại) để xoay 360°, phím mũi tên để xoay, nút phóng to/thu nhỏ.
 * Không có WebGL thì dùng lại linh vật SVG. Bật "giảm chuyển động" thì không tự xoay và không hoạt ảnh.
 */
export function Mascot3D({ character = "fox", items = [], decor = [], className }: { character?: CharacterId; items?: string[]; decor?: string[]; className?: string }) {
  const box = useRef<HTMLDivElement | null>(null)
  const api = useRef<SceneApi | null>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let disposed = false
    let cleanup: (() => void) | undefined
    ;(async () => {
      const el = box.current
      if (!el) return
      try {
        const [T, { createScene }] = await Promise.all([import("three"), import("./scene")])
        if (disposed) return
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
        const scene = createScene(T, el, { colors: themeColors(), reducedMotion: reduced.matches })
        api.current = scene

        // Kéo để xoay: chuột kéo cả hai chiều; cảm ứng chỉ xoay theo chiều ngang để dọc vẫn cuộn được trang.
        let dragging = false
        let lx = 0
        let ly = 0
        const down = (e: PointerEvent) => {
          dragging = true
          lx = e.clientX
          ly = e.clientY
          el.setPointerCapture(e.pointerId)
        }
        const move = (e: PointerEvent) => {
          if (!dragging) return
          const dx = e.clientX - lx
          const dy = e.clientY - ly
          lx = e.clientX
          ly = e.clientY
          scene.rotate(-dx * 0.011, e.pointerType === "mouse" ? -dy * 0.008 : 0)
        }
        const up = (e: PointerEvent) => {
          dragging = false
          if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
        }
        el.addEventListener("pointerdown", down)
        el.addEventListener("pointermove", move)
        el.addEventListener("pointerup", up)
        el.addEventListener("pointercancel", up)
        const onMotion = () => scene.setReducedMotion(reduced.matches)
        reduced.addEventListener("change", onMotion)
        setReady(true)
        cleanup = () => {
          el.removeEventListener("pointerdown", down)
          el.removeEventListener("pointermove", move)
          el.removeEventListener("pointerup", up)
          el.removeEventListener("pointercancel", up)
          reduced.removeEventListener("change", onMotion)
          scene.dispose()
          api.current = null
        }
      } catch {
        if (!disposed) setFailed(true)
      }
    })()
    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    let alive = true
    api.current?.setCharacter(character).then(
      () => alive && api.current?.setItems(items),
      () => alive && setFailed(true),
    )
    return () => {
      alive = false
    }
    // Phụ kiện được gắn lại ngay sau khi tải xong nhân vật; đổi phụ kiện riêng xử lý ở hiệu ứng dưới.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, ready])
  useEffect(() => {
    api.current?.setItems(items)
  }, [items, ready])
  useEffect(() => {
    api.current?.setDecor(decor)
  }, [decor, ready])

  // Đổi giao diện (skin) thì tô lại màu.
  useEffect(() => {
    const obs = new MutationObserver(() => api.current?.setColors(themeColors()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-skin"] })
    return () => obs.disconnect()
  }, [])

  if (failed) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center gap-2 rounded-game border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          <Mascot size={120} items={items} />
          Máy này chưa hiển thị được 3D (thiếu WebGL), nên mình dùng hình 2D.
        </div>
      </div>
    )
  }

  const btn = "rounded-game border-2 border-border bg-card px-3 py-1.5 text-sm font-extrabold hover:border-primary"
  return (
    <div className={className}>
      <div
        ref={box}
        tabIndex={0}
        role="group"
        aria-label="Linh vật 3D. Kéo chuột để xoay 360 độ, hoặc dùng phím mũi tên trái phải để xoay, mũi tên lên xuống để nghiêng."
        onKeyDown={(e) => {
          const a = api.current
          if (!a) return
          if (e.key === "ArrowLeft") a.rotate(-STEP, 0)
          else if (e.key === "ArrowRight") a.rotate(STEP, 0)
          else if (e.key === "ArrowUp") a.rotate(0, -STEP)
          else if (e.key === "ArrowDown") a.rotate(0, STEP)
          else if (e.key === "+" || e.key === "=") a.zoom(0.88)
          else if (e.key === "-") a.zoom(1.14)
          else return
          e.preventDefault()
        }}
        className="aspect-[4/3] w-full cursor-grab touch-pan-y overflow-hidden rounded-game border-2 border-border bg-card active:cursor-grabbing"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Điều khiển góc nhìn">
        <button type="button" className={btn} onClick={() => api.current?.rotate(-STEP * 2, 0)} aria-label="Xoay sang trái">
          ⟲ Trái
        </button>
        <button type="button" className={btn} onClick={() => api.current?.rotate(STEP * 2, 0)} aria-label="Xoay sang phải">
          Phải ⟳
        </button>
        <button type="button" className={btn} onClick={() => api.current?.zoom(0.85)} aria-label="Phóng to">
          ＋
        </button>
        <button type="button" className={btn} onClick={() => api.current?.zoom(1.18)} aria-label="Thu nhỏ">
          －
        </button>
        <button type="button" className={btn} onClick={() => api.current?.reset()}>
          Đặt lại
        </button>
      </div>
    </div>
  )
}

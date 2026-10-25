/**
 * Tìm đoạn lời thoại làm căn cứ cho đáp án: lời giải thích trích nguyên văn bằng dấu nháy ('…' hoặc "…");
 * chỉ giữ những đoạn thật sự có trong lời thoại để không tô sáng nhầm. Hàm thuần.
 */
export interface Segment {
  text: string
  hit: boolean
}

const norm = (s: string) => s.replace(/[’‘`]/g, "'").replace(/[“”]/g, '"')

/** Các đoạn trích (đủ dài) có trong lời giải thích. */
export function quotedFragments(...texts: (string | undefined)[]): string[] {
  const out: string[] = []
  for (const raw of texts) {
    if (!raw) continue
    const t = norm(raw)
    for (const m of t.matchAll(/"([^"]{4,160}?)"|'([^']{6,160}?)'/g)) {
      const frag = (m[1] ?? m[2] ?? "").trim().replace(/[.?!,;:]+$/, "")
      if (frag.length >= 4 && !out.includes(frag)) out.push(frag)
    }
  }
  return out
}

/** Chia lời thoại thành các đoạn thường/được tô sáng theo các đoạn trích có trong lời thoại (không phân biệt hoa thường). */
export function highlightSegments(transcript: string, fragments: string[]): Segment[] {
  const text = norm(transcript)
  const lower = text.toLowerCase()
  const ranges: [number, number][] = []
  for (const f of fragments) {
    const needle = f.toLowerCase()
    let from = 0
    for (;;) {
      const i = lower.indexOf(needle, from)
      if (i < 0) break
      ranges.push([i, i + needle.length])
      from = i + needle.length
    }
  }
  if (!ranges.length) return [{ text: transcript, hit: false }]
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([...r])
  }
  const out: Segment[] = []
  let pos = 0
  for (const [a, b] of merged) {
    if (a > pos) out.push({ text: transcript.slice(pos, a), hit: false })
    out.push({ text: transcript.slice(a, b), hit: true })
    pos = b
  }
  if (pos < transcript.length) out.push({ text: transcript.slice(pos), hit: false })
  return out
}

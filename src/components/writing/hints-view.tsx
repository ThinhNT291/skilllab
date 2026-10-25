import type { MindNode, WritingHints } from "@/lib/hints"

function Tree({ nodes }: { nodes: MindNode[] }) {
  return (
    <ul className="space-y-1 border-l-2 border-border pl-3">
      {nodes.map((n, i) => (
        <li key={i}>
          <span className="font-bold">{n.text}</span>
          {n.children.length > 0 && <Tree nodes={n.children} />}
        </li>
      ))}
    </ul>
  )
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <h3 className="font-extrabold">{title}</h3>
      <ul className="list-disc pl-5">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  )
}

/** Gợi ý dàn ý trước khi viết: phân tích đề, bố cục từng đoạn, từ nối, mẫu câu, lỗi hay gặp và sơ đồ tư duy. */
export function HintsView({ hints }: { hints: WritingHints }) {
  return (
    <section aria-label="Gợi ý dàn ý" className="anim-pop space-y-3 rounded-game border-2 border-accent bg-card p-4">
      <Block title="🔍 Phân tích đề" items={hints.analysis} />
      <Block title="🧱 Bố cục" items={hints.organization} />
      <Block title="📚 Từ vựng nên dùng" items={hints.vocabulary} />
      <Block title="🔗 Từ nối" items={hints.linkingWords} />
      <Block title="💬 Mẫu câu hay" items={hints.expressions} />
      <Block title="⚠️ Lỗi hay gặp" items={hints.commonMistakes} />
      {hints.mindmap.length > 0 && (
        <div>
          <h3 className="font-extrabold">🗺 Sơ đồ tư duy</h3>
          <Tree nodes={hints.mindmap} />
        </div>
      )}
    </section>
  )
}

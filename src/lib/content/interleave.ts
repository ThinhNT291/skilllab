/**
 * Luyện xen kẽ (interleaving): trộn câu từ nhiều chuyên đề DỄ NHẦM VỚI NHAU trong cùng một lượt, thay vì làm hết chuyên đề này rồi
 * mới sang chuyên đề khác. Bằng chứng (Brunmair & Richter 2019, xem docs/hoc-thuat-dong-luc.md): xen kẽ có lợi khi các loại
 * giống nhau và việc chính là PHÂN BIỆT chúng; với tài liệu dạng chữ khác nhau nhiều thì làm theo khối lại tốt hơn. Vì vậy chỉ xen kẽ trong
 * từng nhóm chuyên đề dễ lẫn (các thì, mạo từ/đại từ…), không trộn tùy ý. Hàm thuần.
 */
import type { Rng } from "./derive.ts"

export interface ConfusableGroup {
  id: string
  label: string
  topics: string[]
}

export const CONFUSABLE_GROUPS: ConfusableGroup[] = [
  { id: "hien-tai", label: "Các thì hiện tại", topics: ["present-simple", "present-continuous", "present-perfect", "present-perfect-continuous"] },
  { id: "qua-khu", label: "Các thì quá khứ", topics: ["past-simple", "past-continuous", "present-perfect", "past-perfect", "past-perfect-continuous"] },
  { id: "tuong-lai", label: "Các cách nói tương lai", topics: ["future-simple", "future-going-to", "future-continuous", "future-perfect"] },
  { id: "dieu-kien", label: "Câu điều kiện và câu ước", topics: ["conditional-sentences", "subjunctive"] },
  { id: "lien-ket", label: "Liên từ và mệnh đề trạng ngữ", topics: ["conjunctions", "adverbial-clauses"] },
  { id: "han-dinh", label: "Mạo từ và đại từ", topics: ["articles-countable-uncountable", "pronouns-determiners"] },
]

export function findGroup(id: string): ConfusableGroup | undefined {
  return CONFUSABLE_GROUPS.find((g) => g.id === id)
}

function shuffled<T>(list: T[], rng: Rng): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Trộn các nhóm (mỗi nhóm một chuyên đề) theo vòng: A B C A B C…, thứ tự nhóm xáo mỗi vòng sao cho hai câu liền nhau
 * KHÔNG cùng chuyên đề (trừ khi chỉ còn một nhóm). Lấy tối đa `size` câu.
 */
export function interleave<T>(groups: T[][], size: number, rng: Rng = Math.random): T[] {
  const queues = groups.map((g) => [...g]).filter((g) => g.length > 0)
  const out: T[] = []
  let lastGroup = -1
  while (out.length < size && queues.some((q) => q.length > 0)) {
    const order = shuffled(queues.map((_, i) => i).filter((i) => queues[i].length > 0), rng)
    // Không để nhóm vừa dùng ở cuối vòng trước đứng đầu vòng này.
    if (order.length > 1 && order[0] === lastGroup) order.push(order.shift()!)
    for (const gi of order) {
      if (out.length >= size) break
      out.push(queues[gi].shift()!)
      lastGroup = gi
    }
  }
  return out
}

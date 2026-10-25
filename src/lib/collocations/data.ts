import sets from "@/content/collocations/en/sets.json"
import type { CollocationSet } from "./types"

export const COLLOCATION_SETS = sets as CollocationSet[]

export function findSet(id: string): CollocationSet | undefined {
  return COLLOCATION_SETS.find((s) => s.id === id)
}

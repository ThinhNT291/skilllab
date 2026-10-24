// Lớp truy cập dữ liệu: component chỉ import từ đây, không gọi supabase.from() trực tiếp.
export { dbConfigured, ensureProfile } from "./session"
export { recordAnswer, type SaveResult } from "./answers"
export { ensureCardFromError, getDueCards, countDueCards, reviewCard, listAllCards, deleteCard, type SrsCard, type SrsCardRow, type CardsResult } from "./srs"
export { getAnswerHistory, getActivityTimestamps, getAnswerCounts, getRecentTopicRows, type HistoryResult } from "./progress"
export type { Profile } from "./types"
export { getOwnedItems, buyItem, saveEquipped, type OwnedItems, type ItemsResult, type ItemWrite } from "./items"
export { saveTopicTest, getPassedTopics } from "./tests"

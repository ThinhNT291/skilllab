/**
 * Đánh giá lịch ôn từ nhật ký lượt ôn (bảng srs_reviews). Hàm thuần.
 * Câu hỏi cần trả lời bằng số liệu thật: khi hệ thống dự đoán "bạn còn nhớ X%", học sinh có thật sự nhớ khoảng X% không
 * (hiệu chỉnh), và FSRS hẹn xa hơn hay gần hơn SM-2 (khối lượng ôn). "Nhớ" = bấm Khó/Tốt/Dễ, "quên" = bấm Lại.
 */
export interface ReviewLog {
  rating: number
  retrievability: number | null
  elapsedDays: number | null
  fsrsDays: number | null
  sm2Days: number | null
}

export interface CalibrationBucket {
  /** Cận dưới và cận trên của khoảng xác suất dự đoán */
  from: number
  to: number
  count: number
  predicted: number
  actual: number
}

export interface SrsReport {
  reviews: number
  withPrediction: number
  recallRate: number | null
  meanPredicted: number | null
  /** Log loss của dự đoán FSRS (càng thấp càng tốt); null nếu chưa có dự đoán */
  logLoss: number | null
  calibration: CalibrationBucket[]
  /** Trung bình khoảng cách FSRS hẹn / SM-2 hẹn trên các lượt có đủ hai số (>1: FSRS hẹn xa hơn, ít ôn hơn) */
  intervalRatio: number | null
}

const EDGES = [0, 0.5, 0.7, 0.8, 0.9, 0.95, 1.0001]

export function evaluateReviews(logs: ReviewLog[]): SrsReport {
  const withP = logs.filter((l) => l.retrievability !== null)
  const recalled = (l: ReviewLog) => (l.rating >= 2 ? 1 : 0)
  const eps = 1e-6
  const calibration: CalibrationBucket[] = []
  for (let i = 0; i < EDGES.length - 1; i++) {
    const inB = withP.filter((l) => l.retrievability! >= EDGES[i] && l.retrievability! < EDGES[i + 1])
    if (!inB.length) continue
    calibration.push({
      from: EDGES[i],
      to: Math.min(1, EDGES[i + 1]),
      count: inB.length,
      predicted: inB.reduce((s, l) => s + l.retrievability!, 0) / inB.length,
      actual: inB.reduce((s, l) => s + recalled(l), 0) / inB.length,
    })
  }
  const pairs = logs.filter((l) => l.fsrsDays !== null && l.sm2Days !== null && l.sm2Days > 0)
  return {
    reviews: logs.length,
    withPrediction: withP.length,
    recallRate: logs.length ? logs.reduce((s, l) => s + recalled(l), 0) / logs.length : null,
    meanPredicted: withP.length ? withP.reduce((s, l) => s + l.retrievability!, 0) / withP.length : null,
    logLoss: withP.length
      ? -withP.reduce((s, l) => {
          const p = Math.min(1 - eps, Math.max(eps, l.retrievability!))
          return s + (recalled(l) ? Math.log(p) : Math.log(1 - p))
        }, 0) / withP.length
      : null,
    calibration,
    intervalRatio: pairs.length ? pairs.reduce((s, l) => s + l.fsrsDays! / l.sm2Days!, 0) / pairs.length : null,
  }
}

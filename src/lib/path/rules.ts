/**
 * Độ nghiêm ngặt của Lộ trình theo bậc, kiểu game: bậc thấp dễ qua và lên nhanh, bậc cao đòi hỏi nhiều hơn.
 * Hai chỗ thay đổi theo bậc: ngưỡng "xong một bài" (ở đây) và điều kiện nhảy bậc (`JUMP_BY_BAC` ở `jump.ts`).
 * Cố ý không hạ ngưỡng xuống dưới 60%: dưới đó đoán mò cũng qua được bài 4 đáp án.
 * Mọi con số là giá trị khởi điểm (docs/lo-trinh-va-xep-bac.md mục 11), chỉnh dần khi có dữ liệu thật.
 */
export const PASS_BY_BAC: Record<number, number> = { 1: 0.6, 2: 0.65, 3: 0.7, 4: 0.75, 5: 0.8, 6: 0.8 }

export const passRatioFor = (bac: number): number => PASS_BY_BAC[Math.min(6, Math.max(1, Math.round(bac)))]

/** Bài vượt cấp: đúng hết mới được bắt đầu từ chặng đó (chủ dự án chốt). */
export const LEAP_PASS_RATIO = 1

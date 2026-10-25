/** Âm thanh tự tổng hợp bằng WebAudio, không cần tệp âm thanh. Chỉ gọi từ trình duyệt. */
let ctx: AudioContext | null = null

function tone(from: number, to: number, seconds: number, volume: number, delay = 0) {
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return
  ctx ??= new AudioCtor()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  const t = ctx.currentTime + delay
  osc.frequency.setValueAtTime(from, t)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + seconds * 0.65)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + seconds)
  osc.start(t)
  osc.stop(t + seconds + 0.02)
}

/** Năm âm của trò chơi: đúng, sai, bấm, lên cấp, xu. Tự tổng hợp, không cần tệp âm thanh. */
export const sfx = {
  correct: () => tone(520, 780, 0.28, 0.15),
  wrong: () => tone(220, 220, 0.28, 0.15),
  click: () => tone(900, 700, 0.05, 0.07),
  levelUp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.22, 0.14, i * 0.11)),
  coin: () => {
    tone(988, 988, 0.09, 0.12)
    tone(1319, 1319, 0.24, 0.12, 0.08)
  },
}

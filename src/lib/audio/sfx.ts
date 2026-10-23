/** Âm thanh tự tổng hợp bằng WebAudio, không cần tệp âm thanh. Chỉ gọi từ trình duyệt. */
let ctx: AudioContext | null = null

function tone(from: number, to: number, seconds: number, volume: number) {
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return
  ctx ??= new AudioCtor()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  const t = ctx.currentTime
  osc.frequency.setValueAtTime(from, t)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + seconds * 0.65)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + seconds)
  osc.start()
  osc.stop(t + seconds + 0.02)
}

export const sfx = {
  correct: () => tone(520, 780, 0.28, 0.15),
  wrong: () => tone(220, 220, 0.28, 0.15),
}

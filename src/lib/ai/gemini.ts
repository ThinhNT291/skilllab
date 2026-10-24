import "server-only"

/**
 * Gọi Gemini bằng REST từ phía server. Khóa lấy từ GEMINI_API_KEY (không bao giờ gửi xuống trình duyệt).
 * Mã mô hình đặt qua biến môi trường để đổi không cần sửa mã; giá trị mặc định cần được đối chiếu với trang
 * "Models" của Google (ai.google.dev/gemini-api/docs/models) mỗi khi có bản mới.
 */
const BASE = "https://generativelanguage.googleapis.com/v1beta/models"

export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash-lite"
export const TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-lite-tts"
export const TTS_VOICE = process.env.GEMINI_TTS_VOICE || "Kore"

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "upstream" | "bad_response",
  ) {
    super(message)
  }
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new GeminiError("Chưa cấu hình GEMINI_API_KEY", "not_configured")
  return key
}

async function post(model: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new GeminiError(`Gemini trả về lỗi ${res.status}`, "upstream")
  return res.json()
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } }
type Candidates = { candidates?: { content?: { parts?: { text?: string; inlineData?: { data?: string; mimeType?: string } }[] } }[] }

/** Gọi mô hình chữ và đọc kết quả JSON. */
export async function generateJson(parts: Part[]): Promise<unknown> {
  const data = (await post(TEXT_MODEL, {
    contents: [{ role: "user", parts }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  })) as Candidates
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
  try {
    return JSON.parse(text)
  } catch {
    throw new GeminiError("Phản hồi không phải JSON hợp lệ", "bad_response")
  }
}

/** Gói PCM 16-bit mono thành WAV để trình duyệt phát được. */
export function pcmToWav(pcm: Buffer, sampleRate = 24000): Buffer {
  const header = Buffer.alloc(44)
  header.write("RIFF", 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write("WAVEfmt ", 8)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write("data", 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

/** Đọc to một đoạn văn tiếng Anh; trả về WAV. Bản mới trả WAV sẵn, bản cũ trả PCM thô nên xử lý cả hai. */
export async function generateSpeech(text: string): Promise<Buffer> {
  const data = (await post(TTS_MODEL, {
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } } },
    },
  })) as Candidates
  const b64 = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data
  if (!b64) throw new GeminiError("Không nhận được âm thanh", "bad_response")
  const bytes = Buffer.from(b64, "base64")
  return bytes.subarray(0, 4).toString("ascii") === "RIFF" ? bytes : pcmToWav(bytes)
}

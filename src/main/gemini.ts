// Minimal Gemini REST client using global fetch (Electron 33+)

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-2.5-flash'

interface GeminiOptions {
  model?: string
  responseMimeType?: string
  maxTokens?: number
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

export async function geminiGenerate(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  const model = options.model ?? DEFAULT_MODEL
  const url = `${GEMINI_API_URL}/${model}:generateContent`

  // Multi-turn system prompt pattern (user/model/user) matching GeminiClient.swift
  const contents: GeminiContent[] = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood.' }] },
    { role: 'user', parts: [{ text: userPrompt }] }
  ]

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxTokens ?? 1024
    }
  }

  if (options.responseMimeType) {
    ;(body.generationConfig as Record<string, unknown>).responseMimeType = options.responseMimeType
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${text}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('No text in Gemini response')
  }

  return text as string
}

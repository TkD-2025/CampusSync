import { rateLimiter, RateLimitError } from './rateLimiter'

export async function generateQuizFromNotes(notes) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set in .env')

  // Check rate limits before making the request
  const checkLimit = rateLimiter.canMakeRequest(5000) // Estimate ~5000 tokens per request
  if (!checkLimit.allowed) {
    console.warn('Local rate limit blocked:', checkLimit.message)
    console.warn('Current stats:', rateLimiter.getUsageStats())
    throw new RateLimitError(checkLimit.message, checkLimit.retryAfter)
  }

  console.log('Rate limit check passed. Current stats:', rateLimiter.getUsageStats())

  const prompt = `You are a quiz generator. Given the following study notes, 
generate exactly 8 flashcard-style question and answer pairs that test 
key concepts. Return ONLY a valid JSON array with no markdown, no backticks, 
no explanation. Format: [{"question": "...", "answer": "..."}, ...]

Study Notes:
${notes}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  if (!response.ok) {
    if (response.status === 429) {
      console.error('Gemini API returned 429. Current local stats:', rateLimiter.getUsageStats())
      throw new RateLimitError('Gemini API rate limit hit. Please wait before trying again.', 60)
    }
    throw new Error('Gemini API request failed')
  }

  const data = await response.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) throw new Error('Empty response from Gemini')

  // Record successful request
  rateLimiter.recordRequest(5000)

  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    throw new Error('Could not parse Gemini response as JSON')
  }
}

/**
 * Get current rate limit usage statistics
 */
export function getRateLimitStats() {
  return rateLimiter.getUsageStats()
}

/**
 * Clear rate limit stats (for development purposes)
 */
export function clearRateLimitStats() {
  rateLimiter.clearStats()
}

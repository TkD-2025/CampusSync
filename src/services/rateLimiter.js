/**
 * Rate Limiter for Gemini API
 * Tracks requests and tokens per minute and per day
 */

const STORAGE_PREFIX = 'gemini_rate_limit_'

export class RateLimitError extends Error {
  constructor(message, retryAfter = null) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

export class RateLimiter {
  constructor() {
    this.maxRequestsPerMinute = parseInt(import.meta.env.VITE_GEMINI_MAX_REQUESTS_PER_MINUTE) || 5
    this.maxRequestsPerDay = parseInt(import.meta.env.VITE_GEMINI_MAX_REQUESTS_PER_DAY) || 100
    this.maxTokensPerMinute = parseInt(import.meta.env.VITE_GEMINI_MAX_TOKENS_PER_MINUTE) || 100000
  }

  /**
   * Get current minute timestamp
   */
  getCurrentMinute() {
    const now = new Date()
    return Math.floor(now.getTime() / 60000)
  }

  /**
   * Get current day timestamp (YYYY-MM-DD)
   */
  getCurrentDay() {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }

  /**
   * Get stats from localStorage
   */
  getStats() {
    const currentMinute = this.getCurrentMinute()
    const currentDay = this.getCurrentDay()

    const minuteKey = `${STORAGE_PREFIX}minute_${currentMinute}`
    const dayKey = `${STORAGE_PREFIX}day_${currentDay}`

    let minuteStats = JSON.parse(localStorage.getItem(minuteKey)) || {
      requests: 0,
      tokens: 0,
      timestamp: currentMinute,
    }

    let dayStats = JSON.parse(localStorage.getItem(dayKey)) || {
      requests: 0,
      timestamp: currentDay,
    }

    // Clean up old stats
    if (minuteStats.timestamp !== currentMinute) {
      minuteStats = { requests: 0, tokens: 0, timestamp: currentMinute }
    }

    if (dayStats.timestamp !== currentDay) {
      dayStats = { requests: 0, timestamp: currentDay }
    }

    return {
      minuteStats,
      dayStats,
      minuteKey,
      dayKey,
      currentMinute,
      currentDay,
    }
  }

  /**
   * Check if a request is allowed
   * @param {number} estimatedTokens - Estimated tokens for this request
   * @returns {{ allowed: boolean, message: string, retryAfter?: number }}
   */
  canMakeRequest(estimatedTokens = 0) {
    const { minuteStats, dayStats, currentDay } = this.getStats()

    // Check per-minute requests
    if (minuteStats.requests >= this.maxRequestsPerMinute) {
      const retryAfter = 60 - (Math.floor(Date.now() / 1000) % 60)
      return {
        allowed: false,
        message: `Rate limit exceeded: ${this.maxRequestsPerMinute} requests per minute. Retry in ${retryAfter}s.`,
        retryAfter,
      }
    }

    // Check per-day requests
    if (dayStats.requests >= this.maxRequestsPerDay) {
      const retryAfter = 86400 - ((Date.now() - new Date(`${currentDay}T00:00:00`).getTime()) / 1000)
      return {
        allowed: false,
        message: `Rate limit exceeded: ${this.maxRequestsPerDay} requests per day. Resets tomorrow.`,
        retryAfter,
      }
    }

    // Check per-minute tokens
    if (minuteStats.tokens + estimatedTokens > this.maxTokensPerMinute) {
      const retryAfter = 60 - (Math.floor(Date.now() / 1000) % 60)
      return {
        allowed: false,
        message: `Token limit exceeded: ${this.maxTokensPerMinute} tokens per minute. Retry in ${retryAfter}s.`,
        retryAfter,
      }
    }

    return { allowed: true, message: 'Request allowed' }
  }

  /**
   * Record a request as consumed
   * @param {number} tokenCount - Actual tokens used
   */
  recordRequest(tokenCount = 0) {
    const { minuteStats, dayStats, minuteKey, dayKey } = this.getStats()

    minuteStats.requests += 1
    minuteStats.tokens += tokenCount
    localStorage.setItem(minuteKey, JSON.stringify(minuteStats))

    dayStats.requests += 1
    localStorage.setItem(dayKey, JSON.stringify(dayStats))
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    const { minuteStats, dayStats } = this.getStats()

    return {
      minute: {
        requests: `${minuteStats.requests}/${this.maxRequestsPerMinute}`,
        tokens: `${minuteStats.tokens}/${this.maxTokensPerMinute}`,
      },
      day: {
        requests: `${dayStats.requests}/${this.maxRequestsPerDay}`,
      },
    }
  }

  /**
   * Clear all rate limit stats
   */
  clearStats() {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
    console.log('Rate limit stats cleared')
  }

  /**
   * Get timestamp for when current minute resets
   */
  getMinuteResetTime() {
    const now = new Date()
    const secondsInMinute = now.getSeconds()
    const millisecondsUntilReset = (60 - secondsInMinute) * 1000
    return new Date(now.getTime() + millisecondsUntilReset)
  }

  /**
   * Get timestamp for when current day resets
   */
  getDayResetTime() {
    const now = new Date()
    const nextDay = new Date(now)
    nextDay.setDate(nextDay.getDate() + 1)
    nextDay.setHours(0, 0, 0, 0)
    return nextDay
  }
}

export const rateLimiter = new RateLimiter()

export interface ValidationIssue {
  type: string
  loc: (string | number)[]
  msg: string
  input?: unknown
  ctx?: Record<string, unknown>
}

interface ErrorEnvelope {
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
  request_id?: string
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  rate_limited: "You're going a bit fast. Please wait a moment and try again.",
  conflict: "That already exists.",
  email_unverified: "Please verify your email address to use this feature.",
  forbidden: "You don't have access to do that.",
  not_found: "We couldn't find what you were looking for.",
}

function parseRetryAfter(res: Response): number | null {
  const header = res.headers.get("retry-after") ?? res.headers.get("x-ratelimit-reset")
  if (!header) {
    return null
  }
  const seconds = Number(header)
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown
  readonly requestId: string | null
  readonly retryAfter: number | null

  constructor(
    status: number,
    code: string,
    message: string,
    details: unknown = null,
    requestId: string | null = null,
    retryAfter: number | null = null,
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
    this.retryAfter = retryAfter
  }

  static fromBody(status: number, body: unknown, retryAfter: number | null = null): ApiError {
    const envelope = (body ?? {}) as ErrorEnvelope
    const error = envelope.error ?? {}
    return new ApiError(
      status,
      error.code ?? "error",
      error.message ?? "Something went wrong. Please try again.",
      error.details ?? null,
      envelope.request_id ?? null,
      retryAfter,
    )
  }

  static fromResponse(res: Response, body: unknown): ApiError {
    return ApiError.fromBody(res.status, body, parseRetryAfter(res))
  }

  get isValidation(): boolean {
    return this.status === 422 && Array.isArray(this.details)
  }

  get isAuthExpired(): boolean {
    return this.status === 401 || this.status === 403
  }

  get fieldErrors(): Record<string, string> {
    if (!this.isValidation) {
      return {}
    }
    const issues = this.details as ValidationIssue[]
    const result: Record<string, string> = {}
    for (const issue of issues) {
      const field = issue.loc.filter((part) => part !== "body").join(".")
      if (field && !result[field]) {
        result[field] = issue.msg
      }
    }
    return result
  }
}

export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof ApiError) {
    if (error.isValidation) {
      const first = Object.values(error.fieldErrors)[0]
      if (first) {
        return first
      }
    }
    if (error.code === "rate_limited" && error.retryAfter) {
      return `Too many requests. Try again in ${error.retryAfter} second${
        error.retryAfter === 1 ? "" : "s"
      }.`
    }
    return FRIENDLY_MESSAGES[error.code] ?? error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

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

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown
  readonly requestId: string | null

  constructor(
    status: number,
    code: string,
    message: string,
    details: unknown = null,
    requestId: string | null = null,
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }

  static fromBody(status: number, body: unknown): ApiError {
    const envelope = (body ?? {}) as ErrorEnvelope
    const error = envelope.error ?? {}
    return new ApiError(
      status,
      error.code ?? "error",
      error.message ?? "Something went wrong. Please try again.",
      error.details ?? null,
      envelope.request_id ?? null,
    )
  }

  get isValidation(): boolean {
    return this.status === 422 && Array.isArray(this.details)
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
      return first ?? error.message
    }
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

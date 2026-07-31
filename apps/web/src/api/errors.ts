export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  request_id?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly requestId: string | undefined;

  constructor(status: number, body: ApiErrorBody | undefined) {
    super(body?.error?.message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error?.code ?? "error";
    this.details = body?.error?.details;
    this.requestId = body?.request_id;
  }

  get fieldErrors(): Record<string, string[]> {
    return isFieldErrorMap(this.details) ? this.details : {};
  }

  firstFieldError(): string | null {
    for (const messages of Object.values(this.fieldErrors)) {
      if (messages[0] !== undefined) return messages[0];
    }
    return null;
  }
}

function isFieldErrorMap(value: unknown): value is Record<string, string[]> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every(
    (entry) => Array.isArray(entry) && entry.every((item) => typeof item === "string"),
  );
}

export function toApiError(status: number, body: unknown): ApiError {
  const isObject = typeof body === "object" && body !== null;
  return new ApiError(status, isObject ? body : undefined);
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

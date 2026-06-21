import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { ApiError } from "./errors"

export function applyApiError<T extends FieldValues>(
  error: unknown,
  form: UseFormReturn<T>,
): boolean {
  if (!(error instanceof ApiError) || !error.isValidation) {
    return false
  }
  const values = form.getValues()
  let applied = false
  for (const [path, message] of Object.entries(error.fieldErrors)) {
    const root = path.split(".")[0]
    if (root in values) {
      form.setError(path as Path<T>, { type: "server", message })
      applied = true
    }
  }
  return applied
}

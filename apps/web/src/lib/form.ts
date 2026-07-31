export function formString(form: FormData, key: string): string {
  const entry = form.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

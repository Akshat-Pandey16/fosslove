export function cx(...parts: (string | false | null | undefined)[]): string {
  const kept: string[] = [];
  for (const part of parts) {
    if (typeof part === "string" && part !== "") kept.push(part);
  }
  return kept.join(" ");
}

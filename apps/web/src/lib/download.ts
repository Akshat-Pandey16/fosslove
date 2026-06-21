function sanitizeFilename(filename: string, fallback: string): string {
  let out = ""
  for (const ch of filename) {
    const code = ch.codePointAt(0) ?? 0
    if (code < 0x20 || code === 0x7f) {
      continue
    }
    out += ch === "/" || ch === "\\" ? "_" : ch
  }
  out = out.trim()
  return out || fallback
}

export function downloadBlob(blob: Blob, filename: string, fallback = "download"): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = sanitizeFilename(filename, fallback)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

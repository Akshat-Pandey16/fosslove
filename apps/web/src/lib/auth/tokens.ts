import type { TokenPair } from "@/lib/api/types"

const ACCESS_KEY = "fosslove.access"
const REFRESH_KEY = "fosslove.refresh"
const EVENT = "fosslove:auth"

const isBrowser = typeof window !== "undefined"

export const tokenStore = {
  getAccess(): string | null {
    return isBrowser ? window.localStorage.getItem(ACCESS_KEY) : null
  },
  getRefresh(): string | null {
    return isBrowser ? window.localStorage.getItem(REFRESH_KEY) : null
  },
  set(pair: TokenPair): void {
    if (!isBrowser) {
      return
    }
    window.localStorage.setItem(ACCESS_KEY, pair.access_token)
    window.localStorage.setItem(REFRESH_KEY, pair.refresh_token)
    window.dispatchEvent(new Event(EVENT))
  },
  clear(): void {
    if (!isBrowser) {
      return
    }
    window.localStorage.removeItem(ACCESS_KEY)
    window.localStorage.removeItem(REFRESH_KEY)
    window.dispatchEvent(new Event(EVENT))
  },
  subscribe(listener: () => void): () => void {
    if (!isBrowser) {
      return () => {}
    }
    const handler = () => listener()
    window.addEventListener(EVENT, handler)
    window.addEventListener("storage", handler)
    return () => {
      window.removeEventListener(EVENT, handler)
      window.removeEventListener("storage", handler)
    }
  },
}

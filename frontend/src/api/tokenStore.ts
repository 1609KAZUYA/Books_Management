let memoryToken: string | null = null

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem('accessToken') ?? memoryToken
    } catch {
      return memoryToken
    }
  },
  set(token: string) {
    memoryToken = token
    try {
      localStorage.setItem('accessToken', token)
    } catch {
      // Some browser/privacy settings block localStorage. Keep the token in memory for this tab.
    }
  },
  clear() {
    memoryToken = null
    try {
      localStorage.removeItem('accessToken')
    } catch {
      // Ignore storage access errors.
    }
  },
}

let memoryToken: string | null = null

export const tokenStore = {
  get() {
    try {
      return sessionStorage.getItem('accessToken') ?? memoryToken
    } catch {
      return memoryToken
    }
  },
  set(token: string) {
    memoryToken = token
    try {
      // JWTを長期間残さないよう、ブラウザ全体で残るlocalStorageではなくタブ単位のsessionStorageに保存します。
      sessionStorage.setItem('accessToken', token)
      localStorage.removeItem('accessToken')
    } catch {
      // Some browser/privacy settings block Web Storage. Keep the token in memory for this tab.
    }
  },
  clear() {
    memoryToken = null
    try {
      sessionStorage.removeItem('accessToken')
      localStorage.removeItem('accessToken')
    } catch {
      // Ignore storage access errors.
    }
  },
}

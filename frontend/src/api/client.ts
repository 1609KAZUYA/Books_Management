import axios from 'axios'
import { tokenStore } from './tokenStore'

// axiosはHTTP通信を簡単に書くためのライブラリです。
// ここでは「APIの共通設定」を1か所にまとめています。
const apiClient = axios.create({
  // /api/v1/books と書けば、実際には http://127.0.0.1:5173/api/v1/books へ送られます。
  // 開発中はViteのproxy設定でバックエンド http://localhost:8080/api/v1 に転送されます。
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  // interceptorは「リクエスト前に毎回実行する処理」です。
  // JWTが保存されていれば Authorization ヘッダーへ自動で付けます。
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // APIが401を返した場合は、ログイン切れとしてトークンを消し、ログイン画面へ移動します。
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      tokenStore.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient

import apiClient from './client'
import type { LoginRequest, LoginResponse, MeResponse, RegisterRequest } from '../types/api'

// 認証関連APIを呼ぶ関数をまとめたファイルです。
// 画面コンポーネントから直接axiosを書かず、ここを呼ぶことでAPI呼び出しを整理しています。

export const login = (data: LoginRequest) =>
  // POST /api/v1/auth/login にメールアドレスとパスワードを送ります。
  apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data)

export const register = (data: RegisterRequest) =>
  // POST /api/v1/auth/register に登録情報を送ります。
  apiClient.post<LoginResponse>('/auth/register', data).then((r) => r.data)

export const logout = () =>
  // サーバー側は状態を持たないため、実質的にはフロント側でトークンを消すのがログアウトです。
  apiClient.post('/auth/logout')

export const getMe = () =>
  // 保存済みJWTを使って「今ログイン中のユーザー」を取得します。
  apiClient.get<MeResponse>('/me').then((r) => r.data)

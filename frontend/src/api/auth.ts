import apiClient from './client'
import type { LoginRequest, LoginResponse, MeResponse, RegisterRequest } from '../types/api'

export const login = (data: LoginRequest) =>
  apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data)

export const register = (data: RegisterRequest) =>
  apiClient.post<LoginResponse>('/auth/register', data).then((r) => r.data)

export const logout = () =>
  apiClient.post('/auth/logout')

export const getMe = () =>
  apiClient.get<MeResponse>('/me').then((r) => r.data)

import apiClient from './client'
import type { Category, CategoryListResponse, CreateCategoryRequest, UpdateCategoryRequest } from '../types/api'

export const getCategories = () =>
  apiClient.get<CategoryListResponse>('/categories').then((r) => r.data.items)

export const createCategory = (data: CreateCategoryRequest) =>
  apiClient.post<Category>('/categories', data).then((r) => r.data)

export const updateCategory = (id: number, data: UpdateCategoryRequest) =>
  apiClient.patch<Category>(`/categories/${id}`, data).then((r) => r.data)

export const deleteCategory = (id: number) =>
  apiClient.delete(`/categories/${id}`)

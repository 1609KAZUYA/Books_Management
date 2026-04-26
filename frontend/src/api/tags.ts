import apiClient from './client'
import type { CreateTagRequest, Tag, TagListResponse, UpdateTagRequest } from '../types/api'

export const getTags = () =>
  apiClient.get<TagListResponse>('/tags').then((r) => r.data.items)

export const createTag = (data: CreateTagRequest) =>
  apiClient.post<Tag>('/tags', data).then((r) => r.data)

export const updateTag = (id: number, data: UpdateTagRequest) =>
  apiClient.patch<Tag>(`/tags/${id}`, data).then((r) => r.data)

export const deleteTag = (id: number) =>
  apiClient.delete(`/tags/${id}`)

import { api } from './client'
import type { CategorySpec, SpecGroup, SpecItem } from './types'

export interface ListCategorySpecsParams {
  current?: number
  pageSize?: number
  category_id?: string
  spec_type?: string
}

export interface ListCategorySpecsRes {
  specs: CategorySpec[]
  total: number
}

export async function listCategorySpecs(params?: ListCategorySpecsParams): Promise<ListCategorySpecsRes> {
  const { data } = await api.get<ListCategorySpecsRes>('/central/v1/spec/category-spec', { params })
  return data
}

export async function createCategorySpec(body: {
  category_id: string
  spec_item_id?: string
  spec_type: string
  spec_value: string
  price_delta?: number
  sort?: number
}): Promise<void> {
  await api.post('/central/v1/spec/category-spec', body)
}

export async function updateCategorySpec(
  id: string,
  body: {
    category_id: string
    spec_item_id?: string
    spec_type: string
    spec_value: string
    price_delta?: number
    sort?: number
  }
): Promise<void> {
  await api.put(`/central/v1/spec/category-spec/${id}`, body)
}

export async function deleteCategorySpec(id: string): Promise<void> {
  await api.delete(`/central/v1/spec/category-spec/${id}`)
}

export interface ListSpecGroupsParams {
  current?: number
  pageSize?: number
  name?: string
}

export interface ListSpecGroupsRes {
  groups: SpecGroup[]
  total: number
}

export async function listSpecGroups(params?: ListSpecGroupsParams): Promise<ListSpecGroupsRes> {
  const { data } = await api.get<ListSpecGroupsRes>('/central/v1/spec/groups', { params })
  return data
}

export async function createSpecGroup(body: { name: string; sort?: number }): Promise<void> {
  await api.post('/central/v1/spec/group', body)
}

export async function updateSpecGroup(id: string, body: { name: string; sort?: number }): Promise<void> {
  await api.put(`/central/v1/spec/group/${id}`, body)
}

export async function deleteSpecGroup(id: string): Promise<void> {
  await api.delete(`/central/v1/spec/group/${id}`)
}

export interface ListSpecItemsParams {
  current?: number
  pageSize?: number
  spec_group_id?: string
  name?: string
}

export interface ListSpecItemsRes {
  items: SpecItem[]
  total: number
}

export async function listSpecItems(params?: ListSpecItemsParams): Promise<ListSpecItemsRes> {
  const { data } = await api.get<ListSpecItemsRes>('/central/v1/spec/items', { params })
  return data
}

export async function createSpecItem(body: {
  spec_group_id: string
  name: string
  default_price?: number
}): Promise<void> {
  await api.post('/central/v1/spec/item', body)
}

export async function updateSpecItem(
  id: string,
  body: {
    spec_group_id: string
    name: string
    default_price?: number
  }
): Promise<void> {
  await api.put(`/central/v1/spec/item/${id}`, body)
}

export async function deleteSpecItem(id: string): Promise<void> {
  await api.delete(`/central/v1/spec/item/${id}`)
}

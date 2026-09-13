import { api, type ApiSuccess } from '@/lib/api'

export type NigeriaState = {
  id: number
  name: string
  code: string
}

export type NigeriaCity = {
  id: number
  name: string
  state_id: number
}

export async function fetchNigeriaStates(): Promise<NigeriaState[]> {
  const { data } = await api.get<ApiSuccess<NigeriaState[]>>('/geo/nigeria/states')
  return data.data
}

export async function fetchNigeriaCities(stateId: number): Promise<NigeriaCity[]> {
  const { data } = await api.get<ApiSuccess<NigeriaCity[]>>(
    `/geo/nigeria/states/${stateId}/cities`,
  )
  return data.data
}

import axios from 'axios'

export type PyMethod = 'api_add'

export interface PyResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  [key: string]: unknown
}

let baseUrlPromise: Promise<string> | undefined

const getBaseUrl = (): Promise<string> => {
  if (!baseUrlPromise) {
    baseUrlPromise = window.api.getApiBaseUrl().catch((error) => {
      baseUrlPromise = undefined
      throw error
    })
  }
  return baseUrlPromise
}

async function request<T = unknown>(
  method: PyMethod,
  params: Record<string, unknown>
): Promise<PyResponse<T>> {
  const baseUrl = await getBaseUrl()
  const response = await axios.post<PyResponse<T>>(`${baseUrl}/api/${method}`, params)
  const result = response.data
  if (!result.success) {
    throw new Error(result.message || `${method} failed`)
  }
  return result
}

export const api = {
  api_add: (params: Record<'a' | 'b', number>): Promise<PyResponse<number>> =>
    request('api_add', params)
}

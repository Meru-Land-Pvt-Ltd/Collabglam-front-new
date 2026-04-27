import axios, {
  AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  type AxiosHeaders,
  type AxiosRequestHeaders,
} from 'axios'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.collabglam.com'
export const API_BASE_URL2 = process.env.NEXT_PUBLIC_API_URL2 || 'https://api.sharemitra.com'
export const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export const TOKEN_KEY = 'token'

const isFormData = (data: any): boolean =>
  typeof FormData !== 'undefined' && data instanceof FormData

const stripContentType = (headers: any) => {
  if (!headers) return headers
  try {
    if (typeof headers.delete === 'function') {
      headers.delete('Content-Type')
      headers.delete('content-type')
      return headers
    }
  } catch {}

  const h = { ...(headers as any) }
  delete h['Content-Type']
  delete h['content-type']
  return h
}

const attachBearer = (
  config: InternalAxiosRequestConfig,
  token: string
): InternalAxiosRequestConfig => {
  const hdrs = config.headers as AxiosHeaders | AxiosRequestHeaders | undefined
  if (hdrs && typeof (hdrs as any).set === 'function') {
    ;(hdrs as AxiosHeaders).set('Authorization', `Bearer ${token}`)
  } else {
    config.headers = {
      ...(hdrs as any),
      Authorization: `Bearer ${token}`,
    } as AxiosRequestHeaders
  }
  return config
}

const hasAuthHeader = (headers: any) => {
  if (!headers) return false

  try {
    if (typeof headers.get === 'function') {
      return !!headers.get('Authorization') || !!headers.get('authorization')
    }
  } catch {}

  return !!headers.Authorization || !!headers.authorization
}

const shouldForceLogout = (status?: number) => status === 401 || status === 403

export const forceLogout = () => {
  if (typeof window === 'undefined') return

  try {
    localStorage.clear()
  } catch {}

  try {
    sessionStorage.clear()
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent('auth:logout'))
  } catch {}

  const loginPath = '/admin/login'
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`

  if (window.location.pathname !== loginPath) {
    window.location.replace(`${loginPath}?next=${encodeURIComponent(currentPath)}`)
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
  timeout: 40000,
})

const api2 = axios.create({
  baseURL: API_BASE_URL2,
  withCredentials: true,
  headers: { Accept: 'application/json' },
  timeout: 40000,
})

const adminApi = axios.create({
  baseURL: ADMIN_API_BASE_URL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
  timeout: 40000,
})

const attachAuthPrimary = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  if (isFormData((config as any).data)) {
    config.headers = stripContentType(config.headers) as any
  }

  if (hasAuthHeader(config.headers)) return config

  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) return attachBearer(config, token)
    } catch {}
  }

  return config
}

const attachAuthSecondary = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  if (isFormData((config as any).data)) {
    config.headers = stripContentType(config.headers) as any
  }

  if (hasAuthHeader(config.headers)) return config

  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) return attachBearer(config, token)
    } catch {}
  }

  return config
}

api.interceptors.request.use(attachAuthPrimary)
api2.interceptors.request.use(attachAuthSecondary)
adminApi.interceptors.request.use(attachAuthPrimary)

const onResponseErrorPrimary = (err: any) => {
  const status = err?.response?.status
  if (shouldForceLogout(status)) {
    forceLogout()
  }
  return Promise.reject(err)
}

const onResponseErrorSecondary = (err: any) => Promise.reject(err)

const onResponseErrorAdmin = (err: any) => {
  const status = err?.response?.status
  if (shouldForceLogout(status)) {
    forceLogout()
  }
  return Promise.reject(err)
}

api.interceptors.response.use((r) => r, onResponseErrorPrimary)
api2.interceptors.response.use((r) => r, onResponseErrorSecondary)
adminApi.interceptors.response.use((r) => r, onResponseErrorAdmin)

if (typeof window !== 'undefined') {
  try {
    const pageIsHTTPS = window.location.protocol === 'https:'
    if (pageIsHTTPS && /^http:\/\//i.test(API_BASE_URL)) {
      console.warn(
        '[api] Page is HTTPS but NEXT_PUBLIC_API_URL is HTTP. This causes mixed-content blocking (Network Error). ' +
          'Use an HTTPS API endpoint or a same-origin relative path.'
      )
    }
  } catch {}
}

export const get = async <T = any>(url: string, params?: any): Promise<T> => {
  const res = await api.get<T>(url, { params })
  return res.data
}

export const post = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config }

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any
  }

  const res = await api.post<T>(url, data, finalConfig)
  return res.data
}


export const patch = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config };

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any;
  }

  const res = await api.patch<T>(url, data, finalConfig);
  return res.data;
}

export const postFormData = async <T = any>(
  url: string,
  formData: FormData,
  opts?: { signal?: AbortSignal }
): Promise<T> => {
  const res = await api.post<T>(url, formData, {
    signal: opts?.signal,
  })
  return res.data
}

export const get2 = async <T = any>(url: string, params?: any): Promise<T> => {
  const res = await api2.get<T>(url, { params })
  return res.data
}

export const post2 = async <T = any>(
  url: string,
  data?: any,
  opts?: { signal?: AbortSignal }
): Promise<T> => {
  const baseConfig: AxiosRequestConfig = { signal: opts?.signal }

  if (isFormData(data)) {
    baseConfig.headers = stripContentType(baseConfig.headers) as any
  }

  const res = await api2.post<T>(url, data, baseConfig)
  return res.data
}

export const postFormData2 = async <T = any>(
  url: string,
  formData: FormData,
  opts?: { signal?: AbortSignal }
): Promise<T> => {
  const res = await api2.post<T>(url, formData, {
    signal: opts?.signal,
  })
  return res.data
}

export const adminGet = async <T = any>(url: string, params?: any): Promise<T> => {
  const res = await adminApi.get<T>(url, { params })
  return res.data
}

export const adminPost = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config }

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any
  }

  const res = await adminApi.post<T>(url, data, finalConfig)
  return res.data
}

export const adminPut = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config }

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any
  }

  const res = await adminApi.put<T>(url, data, finalConfig)
  return res.data
}

export const adminPatch = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config }

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any
  }

  const res = await adminApi.patch<T>(url, data, finalConfig)
  return res.data
}

export const adminDelete = async <T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const finalConfig: AxiosRequestConfig = { ...config, data }

  if (isFormData(data)) {
    finalConfig.headers = stripContentType(finalConfig.headers) as any
  }

  const res = await adminApi.delete<T>(url, finalConfig)
  return res.data
}

export const adminPostFormData = async <T = any>(
  url: string,
  formData: FormData,
  opts?: { signal?: AbortSignal }
): Promise<T> => {
  const res = await adminApi.post<T>(url, formData, {
    signal: opts?.signal,
  })
  return res.data
}

// alias for clearer upload usage in pages
export const adminUpload = adminPostFormData

export const downloadBlob = async (
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<Blob> => {
  const opts: AxiosRequestConfig = { responseType: 'blob', ...config }

  if (isFormData(data)) {
    opts.headers = stripContentType(opts.headers) as any
  }

  const response = await api.post<Blob>(url, data, opts)
  return response.data
}

export const downloadBlob2 = async (
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<Blob> => {
  const opts: AxiosRequestConfig = { responseType: 'blob', ...config }

  if (isFormData(data)) {
    opts.headers = stripContentType(opts.headers) as any
  }

  const response = await api2.post<Blob>(url, data, opts)
  return response.data
}

export const adminDownloadBlob = async (
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<Blob> => {
  const opts: AxiosRequestConfig = { responseType: 'blob', ...config }

  if (isFormData(data)) {
    opts.headers = stripContentType(opts.headers) as any
  }

  const response = await adminApi.post<Blob>(url, data, opts)
  return response.data
}

export const setToken = (token: string) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {}
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const clearToken = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

export default api
export { api2, adminApi }
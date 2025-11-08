import axios, { AxiosInstance, AxiosError } from 'axios'
import { AuthTokens } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

class ApiClient {
  private client: AxiosInstance
  private refreshPromise: Promise<AuthTokens> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken()
        const tenantId = this.getTenantId()

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        if (tenantId) {
          config.headers['X-Tenant-Id'] = tenantId
        }

        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const tokens = await this.refreshAccessToken()
            this.setTokens(tokens)

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`
            }

            return this.client(originalRequest)
          } catch (refreshError) {
            this.clearTokens()
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private async refreshAccessToken(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      })

      return response.data
    })()

    try {
      const tokens = await this.refreshPromise
      return tokens
    } finally {
      this.refreshPromise = null
    }
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refreshToken')
  }

  private getTenantId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('tenantId')
  }

  public setTokens(tokens: AuthTokens) {
    if (typeof window === 'undefined') return
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
  }

  public setTenantId(tenantId: string) {
    if (typeof window === 'undefined') return
    localStorage.setItem('tenantId', tenantId)
  }

  public clearTokens() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('tenantId')
  }

  // Generic methods
  async get<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config = {}): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config = {}): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config = {}): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
}

export const apiClient = new ApiClient()
export default apiClient

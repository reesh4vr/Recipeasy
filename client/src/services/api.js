// client/src/services/api.js
// Centralized API client for ReciPeasy
// Falls back to /api (Vite proxy) but can be overridden via VITE_API_BASE_URL

import axios from 'axios'

const LOCAL_STORAGE_KEY = 'recipeasy:apiBaseUrl'
const DEFAULT_RENDER_API_BASE = 'https://recipeasy-api.onrender.com/api'
const QUERY_PARAM_KEYS = ['apiBase', 'api', 'backend', 'apiUrl']
const CLEAR_PARAM_KEYS = ['clearApiBase', 'clearApi']
const DEFAULT_TIMEOUT_MS = 15000

const isBrowser = () => typeof window !== 'undefined'

const normalizeBaseUrl = (url) => {
  if (!url) return '/api'
  const trimmed = url.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const safeStorage = {
  get: () => {
    if (!isBrowser()) return null
    try {
      return window.localStorage.getItem(LOCAL_STORAGE_KEY)
    } catch {
      return null
    }
  },
  set: (value) => {
    if (!isBrowser() || !value) return
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, value)
    } catch {
      /* ignore quota errors */
    }
  },
  remove: () => {
    if (!isBrowser()) return
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  },
}

const stripQueryParams = (keys = []) => {
  if (!isBrowser() || !window.history?.replaceState) return
  const url = new URL(window.location.href)
  let mutated = false

  keys.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      mutated = true
    }
  })

  if (!mutated) return

  const searchString = url.searchParams.toString()
  const nextUrl = `${url.pathname}${searchString ? `?${searchString}` : ''}${url.hash}`
  window.history.replaceState({}, '', nextUrl)
}

const readQueryOverride = () => {
  if (!isBrowser()) return null
  const url = new URL(window.location.href)
  for (const key of QUERY_PARAM_KEYS) {
    const value = url.searchParams.get(key)
    if (value) {
      return value
    }
  }
  return null
}

const shouldClearStoredOverride = () => {
  if (!isBrowser()) return false
  const url = new URL(window.location.href)
  return CLEAR_PARAM_KEYS.some((key) => url.searchParams.has(key))
}

const resolveApiBaseUrl = () => {
  if (isBrowser() && shouldClearStoredOverride()) {
    safeStorage.remove()
    stripQueryParams(CLEAR_PARAM_KEYS)
  }

  if (isBrowser()) {
    const queryOverride = readQueryOverride()
    if (queryOverride) {
      const normalized = normalizeBaseUrl(queryOverride)
      safeStorage.set(normalized)
      stripQueryParams(QUERY_PARAM_KEYS)
      console.info(`[api] Using API base override from query: ${normalized}`)
      return normalized
    }
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    const normalized = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
    console.info(`[api] Using API base from VITE_API_BASE_URL: ${normalized}`)
    return normalized
  }

  if (isBrowser() && window.__RECIPEASY_API_BASE_URL__) {
    const normalized = normalizeBaseUrl(window.__RECIPEASY_API_BASE_URL__)
    console.info('[api] Using API base from window.__RECIPEASY_API_BASE_URL__')
    return normalized
  }

  if (isBrowser()) {
    const stored = safeStorage.get()
    if (stored) {
      const normalized = normalizeBaseUrl(stored)
      console.info(`[api] Using API base from stored override: ${normalized}`)
      return normalized
    }
  }

  if (import.meta.env.PROD) {
    console.info(`[api] Falling back to Render default API base: ${DEFAULT_RENDER_API_BASE}`)
    return DEFAULT_RENDER_API_BASE
  }

  console.info('[api] Falling back to local /api proxy')
  return '/api'
}

const API_BASE_URL = resolveApiBaseUrl()
const API_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS

const resolveReadableBaseUrl = () => {
  if (API_BASE_URL !== '/api') {
    return API_BASE_URL
  }

  if (typeof window === 'undefined' || !window.location?.origin) {
    return '/api'
  }

  return `${window.location.origin}/api`
}

// Base axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT_MS,
  timeoutErrorMessage: `API request timed out after ${API_TIMEOUT_MS}ms`,
})

// Attach JWT token (if present) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Surface clearer messaging when the API cannot be reached at all
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isTimeout = error.code === 'ECONNABORTED'
    const isNetworkError =
      error.message === 'Network Error' || (!error.response && !error.status)

    if (isTimeout || isNetworkError || !error.response) {
      const fallbackMessage =
        `Unable to reach the ReciPeasy API at ${resolveReadableBaseUrl()}. ` +
        'Please make sure the backend is running or configure VITE_API_BASE_URL.'

      error.message = fallbackMessage

      if (!error.response) {
        error.response = { data: { message: fallbackMessage } }
      } else if (!error.response.data) {
        error.response.data = { message: fallbackMessage }
      } else if (!error.response.data.message) {
        error.response.data.message = fallbackMessage
      }
    }

    return Promise.reject(error)
  }
)

const ensureJsonResponse = (response, label) => {
  const data = response?.data

  if (typeof data === 'string') {
    throw new Error(
      `Unexpected response from ${label}. ` +
      'Received text/HTML instead of JSON. ' +
      `Double-check that your API base URL (${API_BASE_URL}) points to the backend service.`,
    )
  }

  return data
}

/**
 * Auth API
 * Matches backend routes under /api/auth
 *
 * Expected backend endpoints:
 *  POST /api/auth/login       -> { token, user }
 *  POST /api/auth/signup      -> { token, user }
 *  GET  /api/auth/me          -> { user }
 *  PUT  /api/auth/preferences -> { user }
 */
export const authAPI = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    return ensureJsonResponse(res, 'auth/login')
  },

  signup: async (email, password) => {
    const res = await api.post('/auth/signup', { email, password })
    return ensureJsonResponse(res, 'auth/signup')
  },

  getCurrentUser: async () => {
    const res = await api.get('/auth/me')
    return ensureJsonResponse(res, 'auth/me')
  },

  updatePreferences: async (preferences) => {
    const res = await api.put('/auth/preferences', preferences)
    return ensureJsonResponse(res, 'auth/preferences')
  },
}

/**
 * Recipes API
 * Matches backend routes under /api/recipes
 *
 * Expected backend endpoint:
 *  POST /api/recipes/search -> { recipes: [...] }
 */
export const recipesAPI = {
  search: async ({ ingredients, minProtein, maxTime }) => {
    const res = await api.post('/recipes/search', {
      ingredients,
      minProtein,
      maxTime,
    })
    return ensureJsonResponse(res, 'recipes/search')
  },

  getDetail: async (recipeId) => {
    const res = await api.get(`/recipes/${recipeId}`)
    return ensureJsonResponse(res, 'recipes/detail')
  },
}

/**
 * Favorites API
 * Matches backend routes under /api/favorites
 *
 * Expected backend endpoint:
 *  GET /api/favorites -> { favorites: [...] }
 */
export const favoritesAPI = {
  getAll: async () => {
    const res = await api.get('/favorites')
    return ensureJsonResponse(res, 'favorites/list')
  },

  add: async (recipe = {}) => {
    const recipeId = recipe.recipe_id ?? recipe.id

    if (!recipeId) {
      throw new Error('Missing recipe id when adding favorite')
    }

    const payload = {
      recipe_id: recipeId,
      title: recipe.title,
      image: recipe.image,
      ready_in_minutes: recipe.ready_in_minutes ?? recipe.readyInMinutes ?? 0,
      protein_grams: recipe.proteinGrams ?? recipe.protein_grams ?? recipe.nutrition?.protein ?? 0,
      calories: recipe.calories ?? recipe.nutrition?.calories ?? 0,
    }

    const res = await api.post('/favorites', payload)
    return ensureJsonResponse(res, 'favorites/add')
  },

  remove: async (recipeId) => {
    const normalizedId =
      recipeId?.recipe_id ??
      recipeId?.id ??
      recipeId

    if (!normalizedId) {
      throw new Error('Missing recipe id when removing favorite')
    }

    const res = await api.delete(`/favorites/${normalizedId}`)
    return ensureJsonResponse(res, 'favorites/remove')
  },

  check: async (recipeId) => {
    const normalizedId =
      recipeId?.recipe_id ??
      recipeId?.id ??
      recipeId

    if (!normalizedId) {
      throw new Error('Missing recipe id when checking favorite status')
    }

    const res = await api.get(`/favorites/check/${normalizedId}`)
    return ensureJsonResponse(res, 'favorites/check')
  },
}

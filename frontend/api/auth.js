import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
})

// Injecte le token Bearer sur chaque requête
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si 401 → essaie de rafraîchir le token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh =
        localStorage.getItem("refresh_token") ||
        sessionStorage.getItem("refresh_token")
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            null,
            { params: { token: refresh } }
          )
          // Stocke le nouveau token
          const storage = localStorage.getItem("refresh_token")
            ? localStorage
            : sessionStorage
          storage.setItem("access_token", data.access_token)
          // Relance la requête initiale
          error.config.headers.Authorization = `Bearer ${data.access_token}`
          return api(error.config)
        } catch {
          clearTokens()
          window.location.href = "/signin"
        }
      }
    }
    return Promise.reject(error)
  }
)

export function saveTokens(accessToken, refreshToken, rememberMe) {
  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem("access_token", accessToken)
  if (refreshToken) storage.setItem("refresh_token", refreshToken)
}

export function clearTokens() {
  ["access_token", "refresh_token"].forEach((k) => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  })
}

export const signUp = (data) =>
  api.post("/auth/signup", data).then((r) => r.data)

export const signIn = (data) =>
  api.post("/auth/signin", data).then((r) => r.data)

export const getMe = () =>
  api.get("/auth/me").then((r) => r.data)

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email }).then((r) => r.data)

export const resetPassword = (token, new_password) =>
  api.post("/auth/reset-password", { token, new_password }).then((r) => r.data)

export default api
import { createContext, useContext, useState, useEffect } from "react"
import { signUp, signIn, getMe, saveTokens, clearTokens } from "../api/auth"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Au démarrage : récupère l'utilisateur si un token existe
  useEffect(() => {
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token")

  if (!token) {
    setLoading(false)
    return
  }

  getMe()
    .then((user) => setUser(user))
    .catch(() => clearTokens())
    .finally(() => setLoading(false))
}, [])

  async function register(email, password, fullName) {
    const data = await signUp({ email, password, full_name: fullName })
    saveTokens(data.access_token, data.refresh_token, false)
    setUser(data.user)
    return data
  }

  async function login(email, password, rememberMe = false) {
    const data = await signIn({ email, password, remember_me: rememberMe })
    saveTokens(data.access_token, data.refresh_token, rememberMe)
    setUser(data.user)
    return data
  }

  function logout() {
    clearTokens()
    setUser(null)
  }

  function loginWithTokens(accessToken, refreshToken) {
    saveTokens(accessToken, refreshToken, false)
    getMe().then(setUser)
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, loginWithTokens }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
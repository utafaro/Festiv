import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useAuth } from "../context/useAuth"

export default function OAuthCallback() {
  const [params] = useSearchParams()
  const { loginWithTokens } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const accessToken  = params.get("access_token")
    const refreshToken = params.get("refresh_token")

    if (accessToken) {
      loginWithTokens(accessToken, refreshToken)
      navigate("/", { replace: true })
    } else {
      navigate("/auth?error=oauth_failed", { replace: true })
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Connexion en cours...</p>
      </div>
    </div>
  )
}
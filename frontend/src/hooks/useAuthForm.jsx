import { useState } from "react"

export function useAuthForm() {
  const [mode, setMode] = useState("login")

  const toggleMode = (m) => setMode(m)

  const submit = () => {
    alert(mode === "login" ? "Login" : "Signup")
  }

  return { mode, toggleMode, submit }
}
import { createContext, useContext, useState, useEffect } from "react";
import { signUp, signIn, getMe, logoutApi } from "../api/auth";
import { saveTokens, clearTokens } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((u) => setUser(u))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  async function register(email, password, fullName) {
    const data = await signUp({ email, password, full_name: fullName });
    await saveTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data;
  }

  async function login(email, password) {
    const data = await signIn({ email, password, remember_me: true });
    await saveTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data;
  }

  async function logout() {
    try {
      await logoutApi();
    } catch {
      // le token est peut-être déjà expiré, on nettoie quand même localement
    } finally {
      await clearTokens();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

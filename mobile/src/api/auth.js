import api, { saveTokens, clearTokens } from "./client";

export const signUp = (data) => api.post("/auth/signup", data).then((r) => r.data);

export const signIn = (data) => api.post("/auth/signin", data).then((r) => r.data);

export const getMe = () => api.get("/auth/me").then((r) => r.data);

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email }).then((r) => r.data);

export const resetPassword = (token, new_password) =>
  api.post("/auth/reset-password", { token, new_password }).then((r) => r.data);

export const logoutApi = () => api.post("/auth/logout").then((r) => r.data);

export { saveTokens, clearTokens };

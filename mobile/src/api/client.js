import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./config";

export const api = axios.create({ baseURL: API_BASE_URL });

export async function saveTokens(accessToken, refreshToken) {
  await AsyncStorage.setItem("access_token", accessToken);
  if (refreshToken) await AsyncStorage.setItem("refresh_token", refreshToken);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
}

export async function getAccessToken() {
  return AsyncStorage.getItem("access_token");
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config?._retry) {
      const refresh = await AsyncStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            null,
            { params: { token: refresh } },
          );
          await AsyncStorage.setItem("access_token", data.access_token);
          error.config._retry = true;
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          await clearTokens();
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;

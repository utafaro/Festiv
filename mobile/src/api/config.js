import Constants from "expo-constants";
import { Platform } from "react-native";

// En dev, on dérive l'IP du serveur API depuis l'hôte utilisé par Metro pour servir
// l'app (Constants.expoConfig.hostUri, ex: "192.168.1.50:8081") plutôt que de figer
// "localhost", qui ne pointe vers rien depuis un appareil physique (même logique que
// le fix appliqué côté PWA web).
function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const hostUri =
    Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:8000`;
  }

  // Fallback : simulateur iOS/Android sans info d'hôte Metro dispo.
  return Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
}

function resolveWsBaseUrl(apiBaseUrl) {
  if (process.env.EXPO_PUBLIC_WS_URL) return process.env.EXPO_PUBLIC_WS_URL;
  return apiBaseUrl.replace(/^http/, "ws");
}

export const API_BASE_URL = resolveApiBaseUrl();
export const WS_BASE_URL = resolveWsBaseUrl(API_BASE_URL);

const envUrl = import.meta.env.VITE_API_URL;

// En dev sans VITE_API_URL défini, on dérive l'URL de l'API depuis l'hôte utilisé
// pour charger le frontend (localhost, IP LAN via `vite --host`, etc.) plutôt que
// de figer "localhost" en dur, qui ne pointe vers rien depuis un autre appareil.
export const API_BASE_URL =
  envUrl || `${window.location.protocol}//${window.location.hostname}:8000`;

export const WS_BASE_URL = envUrl
  ? envUrl.replace(/^http/, "ws")
  : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8000`;

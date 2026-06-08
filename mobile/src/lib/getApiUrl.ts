import Constants from "expo-constants";

const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";

/** Extract PC IP from Expo Go / Metro (e.g. "192.168.1.5:8081" → "192.168.1.5") */
function getDevMachineHost(): string | null {
  const expoGo = Constants.expoGoConfig as { debuggerHost?: string } | undefined;
  const hostUri = Constants.expoConfig?.hostUri;

  const raw = expoGo?.debuggerHost ?? hostUri ?? null;
  if (!raw) return null;

  return raw.split(":")[0] || null;
}

export function getApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  // Production API (Render, etc.) — always use explicit HTTPS URL
  if (envUrl?.startsWith("https://")) {
    return envUrl;
  }

  // In Expo Go dev, always use the same machine IP Metro is served from
  if (__DEV__) {
    const devHost = getDevMachineHost();
    if (devHost && devHost !== "localhost" && devHost !== "127.0.0.1") {
      return `http://${devHost}:${API_PORT}/api`;
    }
  }

  // Manual override (set your laptop LAN IP when not using auto-detect)
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }

  return `http://localhost:${API_PORT}/api`;
}
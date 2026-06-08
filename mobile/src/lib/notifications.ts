import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api, auth } from "./api";

/** Remote push tokens are not available in Expo Go (SDK 53+). Use a development build. */
export function isPushSupported(): boolean {
  if (!Device.isDevice) return false;
  // Expo Go reports executionEnvironment === 'storeClient'
  if (Constants.executionEnvironment === "storeClient") return false;
  return true;
}

let handlerConfigured = false;

async function ensureNotificationHandler() {
  if (handlerConfigured || !isPushSupported()) return;
  const Notifications = await import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerConfigured = true;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!isPushSupported()) return null;

  await ensureNotificationHandler();
  const Notifications = await import("expo-notifications");

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const token = tokenData.data;

  await api.registerDeviceToken(token, Platform.OS);
  await auth.savePushToken(token);
  return token;
}

export async function unregisterPushNotifications(): Promise<void> {
  const token = await auth.getPushToken();
  if (!token) return;
  try {
    await api.removeDeviceToken(token);
  } catch {
    // ignore cleanup errors
  }
  await auth.removePushToken();
}
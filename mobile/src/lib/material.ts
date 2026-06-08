import * as SecureStore from "expo-secure-store";
import { getApiUrl } from "./getApiUrl";
import { LibraryItem } from "./api";

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("token");
  } catch {
    return null;
  }
}

export function isPdfItem(item: LibraryItem): boolean {
  return item.type === "pdf" || item.type === "paper" || /\.pdf(\?|$)/i.test(item.url);
}

export async function getMaterialStreamUrl(itemId: string): Promise<string> {
  const token = await getAuthToken();
  const base = `${getApiUrl()}/library/${itemId}/stream`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}
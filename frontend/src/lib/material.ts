import { LibraryItem } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export function getMaterialStreamUrl(itemId: string, withToken = false): string {
  const base = `${API_URL}/library/${itemId}/stream`;
  if (!withToken) return base;
  const token = getToken();
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export async function fetchMaterialBlob(itemId: string): Promise<Blob> {
  const token = getToken();
  const response = await fetch(getMaterialStreamUrl(itemId), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(`Failed to load material (${response.status})`);
  }
  return response.blob();
}

export function shouldUseStream(item: LibraryItem): boolean {
  return (
    item.type === "pdf" ||
    item.type === "paper" ||
    /\.pdf(\?|$)/i.test(item.url)
  );
}

export function getViewerUrl(item: LibraryItem): string {
  if (shouldUseStream(item)) {
    return getMaterialStreamUrl(item._id);
  }
  return item.url;
}
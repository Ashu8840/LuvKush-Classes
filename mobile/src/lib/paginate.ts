export const PAGE_SIZE = 5;

export function paginateSlice<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const safePage = Math.min(Math.max(1, page), pages);
  return {
    items: items.slice((safePage - 1) * size, safePage * size),
    pages,
    page: safePage,
  };
}

export function parseLibraryResponse(
  data: import("./api").LibraryItem[] | import("./api").LibraryListResponse
) {
  if (Array.isArray(data)) {
    return { items: data, pagination: { page: 1, limit: data.length, total: data.length, pages: 1 } };
  }
  return data;
}
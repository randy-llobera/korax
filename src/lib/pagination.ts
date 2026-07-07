export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 6;

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  offset: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const parsePageParam = (
  value: string | string[] | undefined,
): number => {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number.parseInt(normalizedValue ?? '', 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
};

export const getPaginationState = ({
  currentPage,
  perPage,
  totalItems,
}: {
  currentPage: number;
  perPage: number;
  totalItems: number;
}): PaginationState => {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  return {
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    perPage,
    offset: (safeCurrentPage - 1) * perPage,
    hasPreviousPage: safeCurrentPage > 1,
    hasNextPage: safeCurrentPage < totalPages,
  };
};

export const getVisiblePageNumbers = (
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): number[] => {
  if (totalPages <= 0) {
    return [];
  }

  const firstPage = 1;
  const lastPage = totalPages;
  const startPage = Math.max(firstPage, currentPage - siblingCount);
  const endPage = Math.min(lastPage, currentPage + siblingCount);
  const visiblePages = new Set<number>([firstPage, lastPage]);

  for (let page = startPage; page <= endPage; page += 1) {
    visiblePages.add(page);
  }

  return Array.from(visiblePages).sort((left, right) => left - right);
};

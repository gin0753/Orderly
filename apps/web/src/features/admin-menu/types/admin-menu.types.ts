export const ADMIN_MENU_DEFAULT_PAGE = 1;
export const ADMIN_MENU_DEFAULT_PAGE_SIZE = 20;

export interface AdminMenuPaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminMenuPaginatedResponse<TItem, TSummary> {
  data: TItem[];
  meta: AdminMenuPaginationMeta;
  summary: TSummary;
}

export interface AdminMenuArchiveResponse {
  id: string;
  archived: true;
}

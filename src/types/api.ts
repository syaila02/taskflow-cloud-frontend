/**
 * Format standar response API backend sesuai AGENTS.md §8.6
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorIssue {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ApiErrorIssue[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

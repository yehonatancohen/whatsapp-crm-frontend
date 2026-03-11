import { AxiosError } from 'axios';

interface ValidationDetail {
  field: string;
  message: string;
}

interface ApiErrorData {
  error?: string;
  code?: string;
  details?: ValidationDetail[];
}

/**
 * Extract user-friendly error information from an API error response.
 * Returns the top-level message and optionally the validation details array.
 */
export function extractApiError(err: unknown): {
  message: string;
  details: ValidationDetail[];
} {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as ApiErrorData;
    return {
      message: data.error || err.message || 'An unexpected error occurred',
      details: data.details || [],
    };
  }

  if (err instanceof Error) {
    return { message: err.message, details: [] };
  }

  return { message: 'An unexpected error occurred', details: [] };
}

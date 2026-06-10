export type CmsState<T> = {
  data: T;
  loading: boolean;
  usingCms: boolean;
  error: string | null;
};

export function cmsSuccess<T>(data: T): CmsState<T> {
  return { data, loading: false, usingCms: true, error: null };
}

export function cmsFallback<T>(fallback: T, error?: unknown): CmsState<T> {
  return {
    data: fallback,
    loading: false,
    usingCms: false,
    error: error instanceof Error ? error.message : error ? String(error) : null,
  };
}

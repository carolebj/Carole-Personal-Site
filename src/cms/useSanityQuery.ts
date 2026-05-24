import { useEffect, useMemo, useState } from "react";
import { getSanityClient, isSanityConfigured } from "./client";

type QueryState<T> = {
  data: T;
  loading: boolean;
  usingCms: boolean;
};

export function useSanityQuery<T>(
  query: string,
  fallback: T,
  params?: Record<string, string | number | boolean>
): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: fallback,
    loading: false,
    usingCms: false,
  });
  const stableParams = useMemo(() => params ?? {}, [params]);

  useEffect(() => {
    const client = getSanityClient();

    if (!client || !isSanityConfigured) {
      setState({ data: fallback, loading: false, usingCms: false });
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, loading: true }));

    client
      .fetch<T>(query, stableParams)
      .then((result) => {
        if (!cancelled) {
          setState({
            data: result ?? fallback,
            loading: false,
            usingCms: Boolean(result),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ data: fallback, loading: false, usingCms: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fallback, query, stableParams]);

  return state;
}

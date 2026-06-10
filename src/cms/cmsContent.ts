import { useEffect, useRef, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

// Public-site reader for the dashboard-managed content (Supabase).
//
// The dashboard stores every document in a single `cms_documents` table as a
// JSONB `data` payload whose field names mirror `src/cms/types.ts`. This module
// fetches those rows (public read via RLS) and exposes drop-in hooks so the
// public pages can treat Supabase as the source of truth, with the existing
// i18n content acting only as a fallback.

const TABLE = "cms_documents";

type Row = { doc_id: string; data: Record<string, unknown> };

const cache = new Map<string, unknown[]>();
const inflight = new Map<string, Promise<unknown[]>>();

async function fetchType(type: string): Promise<unknown[]> {
  if (cache.has(type)) {
    return cache.get(type) as unknown[];
  }
  const existing = inflight.get(type);
  if (existing) {
    return existing;
  }

  const sb = getSupabase();
  if (!sb) {
    return [];
  }

  const promise = (async () => {
    const { data, error } = await sb
      .from(TABLE)
      .select("doc_id, data")
      .eq("type", type)
      .order("updated_at", { ascending: true });
    const rows = error
      ? []
      : ((data ?? []) as Row[]).map((row) => ({
          ...(row.data ?? {}),
          id: row.doc_id,
        }));
    cache.set(type, rows);
    inflight.delete(type);
    return rows;
  })();

  inflight.set(type, promise);
  return promise;
}

/** Resolve a dashboard-managed image to its public URL (Supabase Storage or seeded asset). */
export function cmsImageUrl(image?: { url?: string } | null): string | undefined {
  return image?.url || undefined;
}

/** Invalidate the in-memory cache (used after dashboard writes if needed). */
export function clearCmsCache(type?: string) {
  if (type) {
    cache.delete(type);
  } else {
    cache.clear();
  }
}

type CollectionState<T> = { data: T[]; loading: boolean; usingCms: boolean };

export function useCmsCollection<T>(type: string, fallback: T[]): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({
    data: fallback,
    loading: isSupabaseConfigured,
    usingCms: false,
  });
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ data: fallbackRef.current, loading: false, usingCms: false });
      return;
    }

    let cancelled = false;
    fetchType(type)
      .then((rows) => {
        if (cancelled) return;
        // Supabase is configured and the fetch succeeded: treat CMS as source of
        // truth even when the collection is empty (e.g. after deleting all items).
        setState({ data: rows as T[], loading: false, usingCms: true });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ data: fallbackRef.current, loading: false, usingCms: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [type]);

  return state;
}

type SingletonState<T> = { data: T; loading: boolean; usingCms: boolean };

export function useCmsSingleton<T>(type: string, fallback: T): SingletonState<T> {
  const [state, setState] = useState<SingletonState<T>>({
    data: fallback,
    loading: isSupabaseConfigured,
    usingCms: false,
  });
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ data: fallbackRef.current, loading: false, usingCms: false });
      return;
    }

    let cancelled = false;
    fetchType(type)
      .then((rows) => {
        if (cancelled) return;
        const first = rows[0] as T | undefined;
        if (first) {
          setState({ data: first, loading: false, usingCms: true });
        } else {
          setState({ data: fallbackRef.current, loading: false, usingCms: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ data: fallbackRef.current, loading: false, usingCms: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [type]);

  return state;
}

import { useEffect, useRef, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import { cmsFallback, cmsSuccess, type CmsState } from "./cmsState";

// Public-site reader for the dashboard-managed content (Supabase).
//
// Public pages read only the last published snapshot. Drafts and revisions live
// in authenticated tables and are never exposed through this reader.

const TABLE = "cms_public_documents";

type Row = {
  doc_id: string;
  data: Record<string, unknown>;
  position: number;
  slug?: string | null;
  published_at?: string;
};

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
      .select("doc_id, data, position, slug, published_at")
      .eq("type", type)
      .order("position", { ascending: true });
    if (error) {
      inflight.delete(type);
      throw new Error(error.message);
    }
    const rows = ((data ?? []) as Row[]).map((row) => ({
      ...(row.data ?? {}),
      id: row.doc_id,
      position: row.position,
      slug: row.slug ?? row.data?.slug,
      publishedAtMeta: row.published_at,
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

type CollectionState<T> = CmsState<T[]>;

export function useCmsCollection<T>(type: string, fallback: T[]): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({
    data: fallback,
    loading: isSupabaseConfigured,
    usingCms: false,
    error: null,
  });
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState(cmsFallback(fallbackRef.current));
      return;
    }

    let cancelled = false;
    fetchType(type)
      .then((rows) => {
        if (cancelled) return;
        // Supabase is configured and the fetch succeeded: treat CMS as source of
        // truth even when the collection is empty (e.g. after deleting all items).
        setState(cmsSuccess(rows as T[]));
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState(cmsFallback(fallbackRef.current, error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [type]);

  return state;
}

type SingletonState<T> = CmsState<T>;

export function useCmsSingleton<T>(type: string, fallback: T): SingletonState<T> {
  const [state, setState] = useState<SingletonState<T>>({
    data: fallback,
    loading: isSupabaseConfigured,
    usingCms: false,
    error: null,
  });
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState(cmsFallback(fallbackRef.current));
      return;
    }

    let cancelled = false;
    fetchType(type)
      .then((rows) => {
        if (cancelled) return;
        const first = rows[0] as T | undefined;
        if (first) {
          setState(cmsSuccess(first));
        } else {
          setState(cmsFallback(fallbackRef.current));
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState(cmsFallback(fallbackRef.current, error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [type]);

  return state;
}

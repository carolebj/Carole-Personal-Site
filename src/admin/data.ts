// Unified data layer for the admin dashboard.
//
// One seam, two backends:
//   - Supabase (when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set): real
//     auth, a single `cms_documents` JSONB table, and Storage for images.
//   - Local demo (otherwise): localStorage store + fake auth, so the dashboard
//     stays usable without any backend.
//
// The schema-driven content model maps cleanly onto one JSONB table: each row is
// (type, doc_id, data), so adding a field never requires a migration.

import { getSupabase } from "../lib/supabase";
import { clearCmsCache } from "../cms/cmsContent";
import { contentTypes } from "./schema";
import {
  loadContent as loadDemoContent,
  saveContent as saveDemoContent,
  loadSession as loadDemoSession,
  signIn as demoSignIn,
  signOut as demoSignOut,
  resetContent as resetDemoContent,
  type AnyDoc,
  type ContentStore,
} from "./store";

export { isSupabaseConfigured as isRemote } from "../lib/supabase";

const TABLE = "cms_documents";
const BUCKET = "media";

export type AuthUser = { email: string };

const singletonNames = new Set(
  contentTypes.filter((t) => t.kind === "singleton").map((t) => t.name),
);

// --- auth --------------------------------------------------------------------

export async function getCurrentUser(): Promise<AuthUser | null> {
  const sb = getSupabase();
  if (!sb) {
    const session = loadDemoSession();
    return session ? { email: session.email } : null;
  }
  const { data } = await sb.auth.getSession();
  const email = data.session?.user?.email;
  return email ? { email } : null;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ user?: AuthUser; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    demoSignIn(email);
    return { user: { email } };
  }
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }
  return { user: { email: data.user?.email ?? email } };
}

export async function signOutUser(): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    demoSignOut();
    return;
  }
  await sb.auth.signOut();
}

// --- content -----------------------------------------------------------------

function emptyStore(): ContentStore {
  const store: ContentStore = {};
  for (const type of contentTypes) {
    if (type.kind === "collection") {
      store[type.name] = [];
    }
  }
  return store;
}

export async function fetchContent(): Promise<ContentStore> {
  const sb = getSupabase();
  if (!sb) {
    return loadDemoContent();
  }

  const { data, error } = await sb
    .from(TABLE)
    .select("type, doc_id, data, updated_at")
    .order("updated_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }

  const store = emptyStore();
  for (const row of data ?? []) {
    const doc = { ...(row.data as Record<string, unknown>), id: row.doc_id } as AnyDoc;
    if (singletonNames.has(row.type)) {
      store[row.type] = doc;
    } else {
      const list = (store[row.type] as AnyDoc[]) ?? [];
      list.push(doc);
      store[row.type] = list;
    }
  }
  return store;
}

export async function persistDoc(type: string, doc: AnyDoc): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    const store = loadDemoContent();
    const def = contentTypes.find((t) => t.name === type);
    if (def?.kind === "singleton") {
      store[type] = doc;
    } else {
      const list = Array.isArray(store[type]) ? (store[type] as AnyDoc[]) : [];
      const exists = list.some((d) => d.id === doc.id);
      store[type] = exists ? list.map((d) => (d.id === doc.id ? doc : d)) : [...list, doc];
    }
    saveDemoContent(store);
    clearCmsCache(type);
    return;
  }

  const { id, ...rest } = doc;
  const { error } = await sb.from(TABLE).upsert(
    {
      type,
      doc_id: id,
      data: { ...rest, id },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "type,doc_id" },
  );
  if (error) {
    throw new Error(error.message);
  }
  clearCmsCache(type);
}

export async function removeDoc(type: string, docId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    const store = loadDemoContent();
    if (Array.isArray(store[type])) {
      store[type] = (store[type] as AnyDoc[]).filter((d) => d.id !== docId);
      saveDemoContent(store);
    }
    clearCmsCache(type);
    return;
  }
  const { error } = await sb.from(TABLE).delete().eq("type", type).eq("doc_id", docId);
  if (error) {
    throw new Error(error.message);
  }
  clearCmsCache(type);
}

export async function resetDemo(): Promise<ContentStore> {
  return resetDemoContent();
}

// --- images ------------------------------------------------------------------

export async function uploadImage(file: File): Promise<{ url: string } | null> {
  const sb = getSupabase();
  if (!sb) {
    return { url: URL.createObjectURL(file) };
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `uploads/${Date.now()}-${safeName}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) {
    return null;
  }
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

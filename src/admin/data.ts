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
  loadRevisions as loadDemoRevisions,
  recordRevision as recordDemoRevision,
  type AnyDoc,
  type ContentStore,
  type StoredRevision,
} from "./store";
import { resequenceDocuments } from "./order";
import {
  markPublished,
  markTrashed,
  markUnpublished,
  restoreFromTrash,
  saveAsDraft,
} from "./editorial";

export { isSupabaseConfigured as isRemote } from "../lib/supabase";

const WORKING_TABLE = "cms_documents";
const REVISIONS_TABLE = "cms_revisions";
const BUCKET = "media";

export type AuthUser = { id?: string; email: string };

export type Revision = {
  revisionId: number;
  type: string;
  docId: string;
  data: Record<string, unknown>;
  status: string;
  position: number;
  slug?: string;
  createdAt: string;
  createdBy?: string;
};

type WorkingRow = {
  type: string;
  doc_id: string;
  data: Record<string, unknown>;
  status: AnyDoc["status"];
  position: number;
  slug?: string | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  deleted_at?: string | null;
  updated_by?: string | null;
};

const singletonNames = new Set(
  contentTypes.filter((type) => type.kind === "singleton").map((type) => type.name),
);

function migrationMessage(message: string) {
  if (
    message.includes("cms_public_documents") ||
    message.includes("cms_save_document") ||
    message.includes("status") ||
    message.includes("position")
  ) {
    return "La migration éditoriale Supabase n'est pas encore appliquée. Exporte les données puis exécute supabase/migrations/20260610194517_editorial_workflow.sql.";
  }
  return message;
}

function rowToDoc(row: WorkingRow): AnyDoc {
  return {
    ...(row.data ?? {}),
    id: row.doc_id,
    status: row.status ?? "draft",
    position: row.position ?? 0,
    slug: row.slug ?? (row.data?.slug as string | undefined),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAtMeta: row.published_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    updatedBy: row.updated_by ?? undefined,
  };
}

function docData(doc: AnyDoc) {
  const {
    id: _id,
    status: _status,
    position: _position,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    publishedAtMeta: _publishedAtMeta,
    deletedAt: _deletedAt,
    updatedBy: _updatedBy,
    ...data
  } = doc;
  return data;
}

function emptyStore(): ContentStore {
  const store: ContentStore = {};
  for (const type of contentTypes) {
    if (type.kind === "collection") store[type.name] = [];
  }
  return store;
}

function sortDocs(docs: AnyDoc[]) {
  return docs.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const sb = getSupabase();
  if (!sb) {
    const session = loadDemoSession();
    return session ? { email: session.email } : null;
  }
  const { data } = await sb.auth.getSession();
  const user = data.session?.user;
  return user?.email ? { id: user.id, email: user.email } : null;
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
  if (error) return { error: error.message };
  return { user: { id: data.user?.id, email: data.user?.email ?? email } };
}

export async function signOutUser(): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    demoSignOut();
    return;
  }
  await sb.auth.signOut();
}

export async function fetchContent(): Promise<ContentStore> {
  const sb = getSupabase();
  if (!sb) {
    const store = loadDemoContent();
    const active: ContentStore = {};
    for (const [type, value] of Object.entries(store)) {
      if (Array.isArray(value)) active[type] = value.filter((doc) => doc.status !== "trashed");
      else if (value.status !== "trashed") active[type] = value;
    }
    return active;
  }

  const { data, error } = await sb
    .from(WORKING_TABLE)
    .select("type, doc_id, data, status, position, slug, created_at, updated_at, published_at, deleted_at, updated_by")
    .is("deleted_at", null)
    .order("position", { ascending: true });
  if (error) throw new Error(migrationMessage(error.message));

  const store = emptyStore();
  for (const row of (data ?? []) as WorkingRow[]) {
    const doc = rowToDoc(row);
    if (singletonNames.has(row.type)) store[row.type] = doc;
    else store[row.type] = [...((store[row.type] as AnyDoc[]) ?? []), doc];
  }
  for (const type of Object.keys(store)) {
    if (Array.isArray(store[type])) store[type] = sortDocs(store[type] as AnyDoc[]);
  }
  return store;
}

export async function fetchTrash(): Promise<Array<{ type: string; doc: AnyDoc }>> {
  const sb = getSupabase();
  if (!sb) {
    return Object.entries(loadDemoContent()).flatMap(([type, value]) => {
      const docs = Array.isArray(value) ? value : [value];
      return docs.filter((doc) => doc.status === "trashed").map((doc) => ({ type, doc }));
    });
  }
  const { data, error } = await sb
    .from(WORKING_TABLE)
    .select("type, doc_id, data, status, position, slug, created_at, updated_at, published_at, deleted_at, updated_by")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw new Error(migrationMessage(error.message));
  return ((data ?? []) as WorkingRow[]).map((row) => ({ type: row.type, doc: rowToDoc(row) }));
}

function updateDemo(type: string, doc: AnyDoc) {
  const store = loadDemoContent();
  const definition = contentTypes.find((item) => item.name === type);
  if (definition?.kind === "singleton") store[type] = doc;
  else {
    const list = Array.isArray(store[type]) ? (store[type] as AnyDoc[]) : [];
    store[type] = sortDocs(
      list.some((item) => item.id === doc.id)
        ? list.map((item) => (item.id === doc.id ? doc : item))
        : [...list, doc],
    );
  }
  saveDemoContent(store);
  recordDemoRevision(type, doc, loadDemoSession()?.email);
}

export async function persistDoc(type: string, doc: AnyDoc): Promise<AnyDoc> {
  const sb = getSupabase();
  const next = saveAsDraft(doc);
  if (!sb) {
    updateDemo(type, next);
    clearCmsCache(type);
    return next;
  }
  const { data, error } = await sb.rpc("cms_save_document", {
    p_type: type,
    p_doc_id: doc.id,
    p_data: docData(doc),
    p_slug: typeof doc.slug === "string" ? doc.slug : null,
    p_position: doc.position ?? 0,
  });
  if (error) throw new Error(migrationMessage(error.message));
  clearCmsCache(type);
  return rowToDoc(data as WorkingRow);
}

export async function publishDoc(type: string, docId: string): Promise<AnyDoc> {
  const sb = getSupabase();
  if (!sb) {
    const store = loadDemoContent();
    const value = store[type];
    const doc = (Array.isArray(value) ? value.find((item) => item.id === docId) : value) as AnyDoc | undefined;
    if (!doc) throw new Error("Document introuvable.");
    const published = markPublished(doc);
    updateDemo(type, published);
    clearCmsCache(type);
    return published;
  }
  const { data, error } = await sb.rpc("cms_publish_document", { p_type: type, p_doc_id: docId });
  if (error) throw new Error(migrationMessage(error.message));
  clearCmsCache(type);
  return rowToDoc(data as WorkingRow);
}

export async function unpublishDoc(type: string, docId: string): Promise<AnyDoc> {
  const sb = getSupabase();
  if (!sb) {
    const store = loadDemoContent();
    const value = store[type];
    const doc = (Array.isArray(value) ? value.find((item) => item.id === docId) : value) as AnyDoc | undefined;
    if (!doc) throw new Error("Document introuvable.");
    const draft = markUnpublished(doc);
    updateDemo(type, draft);
    clearCmsCache(type);
    return draft;
  }
  const { data, error } = await sb.rpc("cms_unpublish_document", { p_type: type, p_doc_id: docId });
  if (error) throw new Error(migrationMessage(error.message));
  clearCmsCache(type);
  return rowToDoc(data as WorkingRow);
}

export async function trashDoc(type: string, docId: string): Promise<AnyDoc> {
  const sb = getSupabase();
  if (!sb) {
    const store = loadDemoContent();
    const value = store[type];
    const doc = (Array.isArray(value) ? value.find((item) => item.id === docId) : value) as AnyDoc | undefined;
    if (!doc) throw new Error("Document introuvable.");
    const trashed = markTrashed(doc);
    updateDemo(type, trashed);
    clearCmsCache(type);
    return trashed;
  }
  const { data, error } = await sb.rpc("cms_trash_document", { p_type: type, p_doc_id: docId });
  if (error) throw new Error(migrationMessage(error.message));
  clearCmsCache(type);
  return rowToDoc(data as WorkingRow);
}

export async function restoreDoc(type: string, docId: string): Promise<AnyDoc> {
  const sb = getSupabase();
  if (!sb) {
    const store = loadDemoContent();
    const value = store[type];
    const doc = (Array.isArray(value) ? value.find((item) => item.id === docId) : value) as AnyDoc | undefined;
    if (!doc) throw new Error("Document introuvable.");
    const restored = restoreFromTrash(doc);
    updateDemo(type, restored);
    return restored;
  }
  const { data, error } = await sb.rpc("cms_restore_document", { p_type: type, p_doc_id: docId });
  if (error) throw new Error(migrationMessage(error.message));
  return rowToDoc(data as WorkingRow);
}

export async function permanentlyDeleteDoc(type: string, docId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    const store = loadDemoContent();
    const value = store[type];
    if (Array.isArray(value)) store[type] = value.filter((doc) => doc.id !== docId);
    else delete store[type];
    saveDemoContent(store);
    return;
  }
  const { error: revisionError } = await sb
    .from(REVISIONS_TABLE)
    .delete()
    .eq("type", type)
    .eq("doc_id", docId);
  if (revisionError) throw new Error(revisionError.message);
  const { error } = await sb.from(WORKING_TABLE).delete().eq("type", type).eq("doc_id", docId);
  if (error) throw new Error(error.message);
}

export async function reorderDocs(type: string, docs: AnyDoc[]): Promise<AnyDoc[]> {
  const ordered = resequenceDocuments(docs);
  const sb = getSupabase();
  if (!sb) {
    const store = loadDemoContent();
    store[type] = ordered;
    saveDemoContent(store);
    return ordered;
  }
  const { error } = await sb.rpc("cms_reorder_documents", {
    p_type: type,
    p_items: ordered.map((doc) => ({ id: doc.id, position: doc.position })),
  });
  if (error) throw new Error(migrationMessage(error.message));
  clearCmsCache(type);
  return ordered;
}

export async function listRevisions(type: string, docId: string): Promise<Revision[]> {
  const sb = getSupabase();
  if (!sb) {
    return loadDemoRevisions()
      .filter((revision) => revision.type === type && revision.docId === docId)
      .map((revision: StoredRevision) => ({
        revisionId: revision.revisionId,
        type,
        docId,
        data: docData(revision.doc),
        status: revision.doc.status,
        position: revision.doc.position,
        slug: revision.doc.slug,
        createdAt: revision.createdAt,
        createdBy: revision.createdBy,
      }));
  }
  const { data, error } = await sb
    .from(REVISIONS_TABLE)
    .select("revision_id, type, doc_id, data, status, position, slug, created_at, created_by")
    .eq("type", type)
    .eq("doc_id", docId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(migrationMessage(error.message));
  return (data ?? []).map((row) => ({
    revisionId: row.revision_id,
    type: row.type,
    docId: row.doc_id,
    data: row.data,
    status: row.status,
    position: row.position,
    slug: row.slug ?? undefined,
    createdAt: row.created_at,
    createdBy: row.created_by ?? undefined,
  }));
}

export async function restoreRevision(revision: Revision): Promise<AnyDoc> {
  const sb = getSupabase();
  if (!sb) {
    const restored: AnyDoc = {
      ...revision.data,
      id: revision.docId,
      status: "draft",
      position: revision.position,
      slug: revision.slug,
      updatedAt: new Date().toISOString(),
    };
    updateDemo(revision.type, restored);
    return restored;
  }
  const { data, error } = await sb.rpc("cms_restore_revision", {
    p_revision_id: revision.revisionId,
  });
  if (error) throw new Error(migrationMessage(error.message));
  clearCmsCache(revision.type);
  return rowToDoc(data as WorkingRow);
}

export async function resetDemo(): Promise<ContentStore> {
  return resetDemoContent();
}

export async function uploadImage(file: File): Promise<{ url: string } | null> {
  const sb = getSupabase();
  if (!sb) return { url: URL.createObjectURL(file) };
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `uploads/${Date.now()}-${safeName}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

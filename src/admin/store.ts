// Demo persistence layer for the admin dashboard mockup.
//
// This is intentionally NOT a real backend. It stores content and the demo
// session in localStorage so the dashboard behaves like a real CMS ("I save,
// it stays") while we validate the UX. When the approach is approved, this
// module is the single seam to replace with Supabase calls.

import { contentTypes } from "./schema";
import { seedContent } from "./mockData";

export type EditorialStatus = "draft" | "published" | "trashed";

export type DocumentMeta = {
  id: string;
  status: EditorialStatus;
  position: number;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAtMeta?: string;
  deletedAt?: string;
  updatedBy?: string;
};

export type AnyDoc = Record<string, unknown> & DocumentMeta;
export type ContentStore = Record<string, AnyDoc | AnyDoc[]>;

const CONTENT_KEY = "admin-demo-content-v5";
const SESSION_KEY = "admin-demo-session-v1";
const REVISIONS_KEY = "admin-demo-revisions-v1";

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / privacy-mode errors in the demo
  }
}

export function loadContent(): ContentStore {
  const stored = readJson<ContentStore>(CONTENT_KEY);
  if (stored) {
    return normalizeStore(stored);
  }
  const seeded = normalizeStore(structuredClone(seedContent) as unknown as ContentStore);
  writeJson(CONTENT_KEY, seeded);
  return seeded;
}

export function saveContent(store: ContentStore) {
  writeJson(CONTENT_KEY, store);
}

export function resetContent(): ContentStore {
  const seeded = normalizeStore(structuredClone(seedContent) as unknown as ContentStore);
  writeJson(CONTENT_KEY, seeded);
  writeJson(REVISIONS_KEY, []);
  return seeded;
}

function normalizeDoc(doc: AnyDoc, position: number): AnyDoc {
  const updatedAt =
    typeof doc.updatedAt === "string" ? doc.updatedAt : new Date().toISOString();
  const status =
    doc.status === "draft" || doc.status === "trashed" ? doc.status : "published";
  return {
    ...doc,
    status,
    position: typeof doc.position === "number" ? doc.position : position,
    createdAt: typeof doc.createdAt === "string" ? doc.createdAt : updatedAt,
    updatedAt,
    publishedAtMeta:
      typeof doc.publishedAtMeta === "string"
        ? doc.publishedAtMeta
        : status === "published"
          ? updatedAt
          : undefined,
  };
}

function normalizeStore(store: ContentStore): ContentStore {
  const next: ContentStore = {};
  for (const type of contentTypes) {
    const value = store[type.name];
    if (type.kind === "collection") {
      next[type.name] = (Array.isArray(value) ? value : [])
        .map((doc, index) => normalizeDoc(doc, index))
        .sort((a, b) => a.position - b.position);
    } else if (value && !Array.isArray(value)) {
      next[type.name] = normalizeDoc(value, 0);
    }
  }
  return next;
}

export type StoredRevision = {
  revisionId: number;
  type: string;
  docId: string;
  doc: AnyDoc;
  createdAt: string;
  createdBy?: string;
};

export function loadRevisions(): StoredRevision[] {
  return readJson<StoredRevision[]>(REVISIONS_KEY) ?? [];
}

export function recordRevision(type: string, doc: AnyDoc, createdBy?: string) {
  const revisions = loadRevisions();
  revisions.unshift({
    revisionId: Date.now(),
    type,
    docId: doc.id,
    doc: structuredClone(doc),
    createdAt: new Date().toISOString(),
    createdBy,
  });
  const retained = revisions.filter((revision, index, all) => {
    const sameDocumentBefore = all
      .slice(0, index)
      .filter((item) => item.type === revision.type && item.docId === revision.docId).length;
    return sameDocumentBefore < 10;
  });
  writeJson(REVISIONS_KEY, retained);
}

export function createId(typeName: string) {
  return `${typeName}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyDoc(typeName: string, position = 0): AnyDoc {
  const type = contentTypes.find((t) => t.name === typeName);
  const now = new Date().toISOString();
  const doc: AnyDoc = {
    id: createId(typeName),
    status: "draft",
    position,
    createdAt: now,
    updatedAt: now,
  };
  type?.fields.forEach((field) => {
    if (field.type === "boolean") doc[field.name] = false;
    else if (field.type === "localizedList") doc[field.name] = [];
    else if (field.type === "tags") doc[field.name] = [];
    else if (field.type === "group") doc[field.name] = {};
    else if (field.type === "image") doc[field.name] = null;
    else doc[field.name] = "";
  });
  return doc;
}

// --- demo auth ---------------------------------------------------------------

export type Session = { email: string; signedInAt: number };

export function loadSession(): Session | null {
  return readJson<Session>(SESSION_KEY);
}

export function signIn(email: string): Session {
  const session: Session = { email, signedInAt: Date.now() };
  writeJson(SESSION_KEY, session);
  return session;
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

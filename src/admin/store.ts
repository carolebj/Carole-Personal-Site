// Demo persistence layer for the admin dashboard mockup.
//
// This is intentionally NOT a real backend. It stores content and the demo
// session in localStorage so the dashboard behaves like a real CMS ("I save,
// it stays") while we validate the UX. When the approach is approved, this
// module is the single seam to replace with Supabase calls.

import { contentTypes } from "./schema";
import { seedContent } from "./mockData";

export type AnyDoc = Record<string, unknown> & { id: string };
export type ContentStore = Record<string, AnyDoc | AnyDoc[]>;

const CONTENT_KEY = "admin-demo-content-v5";
const SESSION_KEY = "admin-demo-session-v1";

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
    return stored;
  }
  const seeded = structuredClone(seedContent);
  writeJson(CONTENT_KEY, seeded);
  return seeded;
}

export function saveContent(store: ContentStore) {
  writeJson(CONTENT_KEY, store);
}

export function resetContent(): ContentStore {
  const seeded = structuredClone(seedContent);
  writeJson(CONTENT_KEY, seeded);
  return seeded;
}

export function createId(typeName: string) {
  return `${typeName}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyDoc(typeName: string): AnyDoc {
  const type = contentTypes.find((t) => t.name === typeName);
  const doc: AnyDoc = { id: createId(typeName) };
  type?.fields.forEach((field) => {
    if (field.type === "boolean") doc[field.name] = false;
    else if (field.type === "localizedList") doc[field.name] = [];
    else if (field.type === "tags") doc[field.name] = [];
    else if (field.type === "group") doc[field.name] = {};
    else if (field.type === "image") doc[field.name] = null;
    else doc[field.name] = "";
  });
  // Blog posts start as drafts so nothing goes live before the editor publishes.
  if (typeName === "blogPost") doc.status = "draft";
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

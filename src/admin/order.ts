import type { AnyDoc } from "./store";

export function resequenceDocuments(docs: AnyDoc[]): AnyDoc[] {
  return docs.map((doc, position) => ({ ...doc, position }));
}

export function moveDocument(docs: AnyDoc[], docId: string, direction: -1 | 1): AnyDoc[] {
  const index = docs.findIndex((doc) => doc.id === docId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= docs.length) return docs;
  const next = [...docs];
  [next[index], next[target]] = [next[target], next[index]];
  return resequenceDocuments(next);
}

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightStartOnRectangleIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { cn } from "../app/components/ui/utils";
import { contentTypes, type ContentType } from "./schema";
import { TypeIcon } from "./iconMap";
import { emptyDoc, type AnyDoc, type ContentStore } from "./store";
import {
  isRemote,
  getCurrentUser,
  signInWithPassword,
  signOutUser,
  fetchContent,
  persistDoc,
  removeDoc,
  resetDemo,
  type AuthUser,
} from "./data";
import LoginScreen from "./LoginScreen";
import Overview from "./Overview";
import { CollectionList, DocumentEditor, docTitle } from "./views";
import { LoadingShell, ToastStack, useToasts } from "./feedback";

type View =
  | { kind: "home" }
  | { kind: "list"; typeName: string }
  | { kind: "edit"; typeName: string; doc: AnyDoc };

function asArray(value: AnyDoc | AnyDoc[] | undefined): AnyDoc[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

const DEFAULT_ACCORDION = "Ressources & communautés";

function sectionAccordions(types: ContentType[]) {
  const map = new Map<string, ContentType[]>();
  for (const type of types) {
    if (!type.section) continue;
    const list = map.get(type.section) ?? [];
    list.push(type);
    map.set(type.section, list);
  }
  return Array.from(map.entries()).map(([label, sectionTypes]) => ({
    label,
    types: sectionTypes,
    defaultType: sectionTypes[0],
  }));
}

function NavItem({
  type,
  active,
  onSelect,
  nested,
}: {
  type: ContentType;
  active: boolean;
  onSelect: (type: ContentType) => void;
  nested?: boolean;
}) {
  return (
    <li>
      <button
        onClick={() => onSelect(type)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md py-2 text-left text-sm leading-snug transition-colors",
          nested ? "pl-8 pr-2.5" : "px-2.5",
          active
            ? "bg-surface-accent-muted font-medium text-text-accent"
            : "text-text-secondary hover:bg-surface-page-muted hover:text-text-primary",
        )}
      >
        <TypeIcon icon={type.icon} className="size-4 shrink-0" />
        <span className="min-w-0">{type.label}</span>
      </button>
    </li>
  );
}

function Sidebar({
  activeType,
  homeActive,
  email,
  onHome,
  onSelect,
  onSignOut,
  onReset,
}: {
  activeType: string | null;
  homeActive: boolean;
  email: string;
  onHome: () => void;
  onSelect: (type: ContentType) => void;
  onSignOut: () => void;
  onReset: (() => void) | null;
}) {
  const groups: { id: "content" | "settings"; label: string }[] = [
    { id: "content", label: "Contenu" },
    { id: "settings", label: "Réglages" },
  ];

  const [expandedSection, setExpandedSection] = useState<string | null>(DEFAULT_ACCORDION);

  useEffect(() => {
    if (!activeType) return;
    const active = contentTypes.find((t) => t.name === activeType);
    if (active?.section) setExpandedSection(active.section);
  }, [activeType]);

  const toggleSection = (label: string, defaultType: ContentType) => {
    if (expandedSection === label) {
      onSelect(defaultType);
      return;
    }
    setExpandedSection(label);
    onSelect(defaultType);
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border-subtle bg-surface-panel">
      <button onClick={onHome} className="px-5 py-5 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-accent">Admin</p>
        <p className="font-serif text-lg text-text-primary">Carole Tonoukouen</p>
      </button>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <button
          onClick={onHome}
          className={cn(
            "mb-4 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
            homeActive
              ? "bg-surface-accent-muted font-medium text-text-accent"
              : "text-text-secondary hover:bg-surface-page-muted hover:text-text-primary",
          )}
        >
          <Squares2X2Icon className="size-4 shrink-0" />
          Vue d'ensemble
        </button>

        {groups.map((group) => {
          const groupTypes = contentTypes.filter((type) => type.group === group.id);
          const flatTypes = groupTypes.filter((type) => !type.section);
          const accordions = sectionAccordions(groupTypes);

          return (
            <div key={group.id} className="mb-4">
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted/70">
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {flatTypes.map((type) => (
                  <NavItem
                    key={type.name}
                    type={type}
                    active={activeType === type.name}
                    onSelect={onSelect}
                  />
                ))}
                {accordions.map(({ label, types, defaultType }) => {
                  const open = expandedSection === label;
                  const sectionActive = types.some((t) => t.name === activeType);
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => toggleSection(label, defaultType)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                          sectionActive && !open
                            ? "font-medium text-text-accent"
                            : "text-text-secondary hover:bg-surface-page-muted hover:text-text-primary",
                        )}
                      >
                        <ChevronDownIcon
                          className={cn(
                            "size-4 shrink-0 transition-transform duration-200",
                            open ? "rotate-0" : "-rotate-90",
                          )}
                        />
                        <span className="min-w-0 leading-snug">{label}</span>
                      </button>
                      {open ? (
                        <ul className="mt-0.5 flex flex-col gap-0.5">
                          {types.map((type) => (
                            <NavItem
                              key={type.name}
                              type={type}
                              active={activeType === type.name}
                              onSelect={onSelect}
                              nested
                            />
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-3">
        <p className="truncate px-2 pb-2 text-xs text-text-muted" title={email}>
          {email}
        </p>
        {onReset ? (
          <button
            onClick={onReset}
            className="mb-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-text-muted hover:bg-surface-page-muted hover:text-text-primary"
          >
            <ArrowPathIcon className="size-4" /> Réinitialiser la démo
          </button>
        ) : null}
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-text-muted hover:bg-surface-page-muted hover:text-text-primary"
        >
          <ArrowRightStartOnRectangleIcon className="size-4" /> Se déconnecter
        </button>
      </div>
    </aside>
  );
}

function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-page text-sm text-text-muted">
      {children}
    </div>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [content, setContent] = useState<ContentStore | null>(null);
  const [view, setView] = useState<View>({ kind: "home" });
  const { toasts, push: pushToast, dismiss: dismissToast } = useToasts();

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((u) => {
        if (!cancelled) {
          setUser(u);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) setAuthChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setContent(null);
      return;
    }
    let cancelled = false;
    fetchContent()
      .then((store) => {
        if (!cancelled) setContent(store);
      })
      .catch(() => {
        if (!cancelled) setContent({});
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const activeType = useMemo(() => {
    if (view.kind === "list") return view.typeName;
    if (view.kind === "edit") return view.typeName;
    return null;
  }, [view]);

  if (!authChecked) {
    return <FullScreenMessage>Chargement…</FullScreenMessage>;
  }

  if (!user) {
    return (
      <LoginScreen
        remote={isRemote}
        onSubmit={async (email, password) => {
          const res = await signInWithPassword(email, password);
          if (res.user) {
            setUser(res.user);
            return undefined;
          }
          return res.error ?? "Connexion impossible.";
        }}
      />
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-dvh bg-surface-page text-text-primary">
        <aside className="flex w-64 shrink-0 flex-col border-r border-border-subtle bg-surface-panel px-3 py-5">
          <div className="h-12 animate-pulse rounded-md bg-border-subtle/70" />
        </aside>
        <main className="flex-1">
          <LoadingShell />
        </main>
      </div>
    );
  }

  const openType = (type: ContentType) => {
    if (type.kind === "singleton") {
      const doc = (content[type.name] as AnyDoc) ?? emptyDoc(type.name);
      setView({ kind: "edit", typeName: type.name, doc });
    } else {
      setView({ kind: "list", typeName: type.name });
    }
  };

  const saveDoc = async (typeName: string, doc: AnyDoc) => {
    const type = contentTypes.find((t) => t.name === typeName);
    if (!type) return;

    const previousContent = content;
    const previousView = view;

    setContent((prev) => {
      const base = prev ?? {};
      if (type.kind === "singleton") {
        return { ...base, [typeName]: doc };
      }
      const list = asArray(base[typeName]);
      const exists = list.some((item) => item.id === doc.id);
      const nextList = exists
        ? list.map((item) => (item.id === doc.id ? doc : item))
        : [...list, doc];
      return { ...base, [typeName]: nextList };
    });

    try {
      await persistDoc(typeName, doc);
      if (previousView.kind === "edit" && previousView.typeName === typeName && previousView.doc.id === doc.id) {
        setView({ kind: "edit", typeName, doc });
      }
      pushToast("success", "Modifications enregistrées.");
    } catch (error) {
      setContent(previousContent);
      setView(previousView);
      const message = error instanceof Error ? error.message : "Enregistrement impossible.";
      pushToast("error", message);
      throw error;
    }
  };

  const deleteDoc = async (typeName: string, doc: AnyDoc) => {
    const type = contentTypes.find((t) => t.name === typeName);
    const label = type ? docTitle(type, doc) : "cet élément";
    if (!window.confirm(`Supprimer « ${label} » ? Cette action est définitive.`)) {
      return;
    }

    const previousContent = content;
    setContent((prev) => {
      const base = prev ?? {};
      return { ...base, [typeName]: asArray(base[typeName]).filter((item) => item.id !== doc.id) };
    });

    try {
      await removeDoc(typeName, doc.id);
      pushToast("success", "Élément supprimé.");
    } catch (error) {
      setContent(previousContent);
      const message = error instanceof Error ? error.message : "Suppression impossible.";
      pushToast("error", message);
    }
  };

  const handleReset = async () => {
    const store = await resetDemo();
    setContent(store);
    setView({ kind: "home" });
  };

  const currentType = activeType
    ? contentTypes.find((t) => t.name === activeType) ?? null
    : null;

  return (
    <div className="flex min-h-dvh bg-surface-page text-text-primary">
      <Sidebar
        activeType={activeType}
        homeActive={view.kind === "home"}
        email={user.email}
        onHome={() => setView({ kind: "home" })}
        onSelect={openType}
        onSignOut={async () => {
          await signOutUser();
          setUser(null);
          setView({ kind: "home" });
        }}
        onReset={isRemote ? null : handleReset}
      />

      <main className="flex-1 overflow-y-auto">
        {!isRemote ? (
          <div className="border-b border-border-accent-muted bg-surface-accent-muted/40 px-6 py-2 text-center text-xs text-text-accent">
            Démo — le contenu est stocké dans ton navigateur, rien n'est publié sur le site réel.
          </div>
        ) : null}

        {view.kind === "home" && (
          <Overview email={user.email} content={content} onOpen={openType} />
        )}

        {view.kind === "list" && currentType && (
          <CollectionList
            type={currentType}
            docs={asArray(content[currentType.name])}
            onEdit={(doc) => setView({ kind: "edit", typeName: currentType.name, doc })}
            onCreate={() =>
              setView({ kind: "edit", typeName: currentType.name, doc: emptyDoc(currentType.name) })
            }
            onDelete={(doc) => deleteDoc(currentType.name, doc)}
          />
        )}

        {view.kind === "edit" && currentType && (
          <DocumentEditor
            key={`${currentType.name}-${view.doc.id}`}
            type={currentType}
            doc={view.doc}
            onBack={() =>
              setView(
                currentType.kind === "collection"
                  ? { kind: "list", typeName: currentType.name }
                  : { kind: "home" },
              )
            }
            onSave={(doc) => saveDoc(currentType.name, doc)}
            notify={pushToast}
          />
        )}
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

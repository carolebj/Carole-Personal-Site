import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  ChevronDownIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { cn } from "../app/components/ui/utils";
import { contentTypes, type ContentType } from "./schema";
import { TypeIcon } from "./iconMap";
import { emptyDoc, type AnyDoc, type ContentStore } from "./store";
import {
  fetchContent,
  fetchDesignBriefSubmissions,
  fetchTrash,
  getCurrentUser,
  isRemote,
  listRevisions,
  permanentlyDeleteDoc,
  persistDoc,
  publishDoc,
  reorderDocs,
  resetDemo,
  restoreDoc,
  restoreRevision,
  signInWithPassword,
  signOutUser,
  trashDoc,
  unpublishDoc,
  updateDesignBriefStatus,
  type AuthUser,
  type DesignBriefSubmission,
  type Revision,
} from "./data";
import LoginScreen from "./LoginScreen";
import { CollectionList, DocumentEditor, TrashView, docTitle } from "./views";
import { LoadingShell, ToastStack, useToasts } from "./feedback";
import DesignBriefSubmissions from "./DesignBriefSubmissions";

const Overview = lazy(() => import("./Overview"));

type View =
  | { kind: "home" }
  | { kind: "briefs" }
  | { kind: "trash" }
  | { kind: "list"; typeName: string }
  | { kind: "edit"; typeName: string; doc: AnyDoc };

function asArray(value: AnyDoc | AnyDoc[] | undefined): AnyDoc[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

const SERVICES_SECTION = "Services";
const DEFAULT_ACCORDION = null;

function sectionAccordions(types: ContentType[]) {
  const map = new Map<string, ContentType[]>();
  for (const type of types) {
    if (!type.section) continue;
    map.set(type.section, [...(map.get(type.section) ?? []), type]);
  }
  return Array.from(map.entries()).map(([label, sectionTypes]) => ({
    label,
    types: sectionTypes,
    defaultType: sectionTypes[0],
  }));
}

function Sidebar({
  activeType,
  viewKind,
  email,
  collapsed,
  onToggle,
  onHome,
  onBriefs,
  onTrash,
  onSelect,
  onSignOut,
  onReset,
}: {
  activeType: string | null;
  viewKind: View["kind"];
  email: string;
  collapsed: boolean;
  onToggle: () => void;
  onHome: () => void;
  onBriefs: () => void;
  onTrash: () => void;
  onSelect: (type: ContentType) => void;
  onSignOut: () => void;
  onReset: (() => void) | null;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(DEFAULT_ACCORDION);
  const groups: { id: "content" | "settings"; label: string }[] = [
    { id: "content", label: "Contenu" },
    { id: "settings", label: "Réglages" },
  ];

  useEffect(() => {
    if (viewKind === "briefs") {
      setExpandedSection(SERVICES_SECTION);
      return;
    }
    const active = contentTypes.find((type) => type.name === activeType);
    if (active?.section) setExpandedSection(active.section);
  }, [activeType, viewKind]);

  return (
    <aside className={cn("sticky top-0 flex h-dvh shrink-0 flex-col border-r border-border-subtle bg-surface-panel transition-[width] duration-200", collapsed ? "w-[4.5rem]" : "w-64")}>
      <div className="flex items-center justify-between gap-2 px-3 py-4">
        {!collapsed ? (
          <button onClick={onHome} className="min-w-0 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-accent">Admin</p>
            <p className="truncate font-serif text-lg text-text-primary">Carole Tonoukouen</p>
          </button>
        ) : null}
        <button onClick={onToggle} className="flex size-11 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-page-muted" aria-label={collapsed ? "Déployer la barre latérale" : "Réduire la barre latérale"}>
          <Bars3Icon className="size-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <button onClick={onHome} title="Vue d'ensemble" className={cn("mb-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm", viewKind === "home" ? "bg-surface-accent-muted font-medium text-text-accent" : "text-text-secondary hover:bg-surface-page-muted")}>
          <Squares2X2Icon className="size-5 shrink-0" /> {!collapsed ? "Vue d'ensemble" : null}
        </button>
        <button onClick={onTrash} title="Corbeille" className={cn("mb-3 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm", viewKind === "trash" ? "bg-surface-accent-muted font-medium text-text-accent" : "text-text-secondary hover:bg-surface-page-muted")}>
          <TrashIcon className="size-5 shrink-0" /> {!collapsed ? "Corbeille" : null}
        </button>

        {groups.map((group) => {
          const groupTypes = contentTypes.filter((type) => type.group === group.id);
          const flatTypes = groupTypes.filter((type) => !type.section);
          const accordions = sectionAccordions(groupTypes);
          return (
            <div key={group.id} className="mb-3">
              {!collapsed ? <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted/70">{group.label}</p> : null}
              <ul className="space-y-0.5">
                {flatTypes.map((type) => (
                  <li key={type.name}>
                    <button onClick={() => onSelect(type)} title={type.label} className={cn("flex min-h-9 w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-sm", activeType === type.name ? "bg-surface-accent-muted font-medium text-text-accent" : "text-text-secondary hover:bg-surface-page-muted")}>
                      <TypeIcon icon={type.icon} className="size-4 shrink-0" /> {!collapsed ? <span>{type.label}</span> : null}
                    </button>
                  </li>
                ))}
                {!collapsed ? accordions.map(({ label, types, defaultType }) => {
                  const open = expandedSection === label;
                  const sectionActive = types.some((type) => activeType === type.name) || (label === SERVICES_SECTION && viewKind === "briefs");
                  return (
                    <li key={label}>
                      <button onClick={() => {
                        setExpandedSection(open ? null : label);
                        if (!open) onSelect(defaultType);
                      }} aria-expanded={open} className={cn("flex min-h-9 w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm hover:bg-surface-page-muted", sectionActive ? "font-medium text-text-accent" : "text-text-secondary")}>
                        <ChevronDownIcon className={cn("size-4 transition-transform", !open && "-rotate-90")} />
                        {label}
                      </button>
                      {open ? <ul className="space-y-0.5">
                        {types.map((type) => (
                          <li key={type.name}>
                            <button onClick={() => onSelect(type)} className={cn("flex min-h-9 w-full items-center gap-2.5 rounded-md py-1.5 pl-9 pr-2 text-left text-sm", activeType === type.name ? "bg-surface-accent-muted font-medium text-text-accent" : "text-text-secondary hover:bg-surface-page-muted")}>
                              <TypeIcon icon={type.icon} className="size-4" /> {type.label}
                            </button>
                          </li>
                        ))}
                        {label === SERVICES_SECTION ? (
                          <li>
                            <button onClick={onBriefs} className={cn("flex min-h-9 w-full items-center gap-2.5 rounded-md py-1.5 pl-9 pr-2 text-left text-sm", viewKind === "briefs" ? "bg-surface-accent-muted font-medium text-text-accent" : "text-text-secondary hover:bg-surface-page-muted")}>
                              <DocumentTextIcon className="size-4" /> Briefs clients
                            </button>
                          </li>
                        ) : null}
                      </ul> : null}
                    </li>
                  );
                }) : null}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-2">
        {!collapsed ? <p className="truncate px-2 py-2 text-xs text-text-muted" title={email}>{email}</p> : null}
        {onReset ? <button onClick={onReset} title="Réinitialiser la démo" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-text-muted hover:bg-surface-page-muted"><ArrowPathIcon className="size-4" /> {!collapsed ? "Réinitialiser la démo" : null}</button> : null}
        <button onClick={onSignOut} title="Se déconnecter" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-text-muted hover:bg-surface-page-muted"><ArrowRightStartOnRectangleIcon className="size-4" /> {!collapsed ? "Se déconnecter" : null}</button>
      </div>
    </aside>
  );
}

function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh items-center justify-center bg-surface-page text-sm text-text-muted">{children}</div>;
}

export default function AdminApp() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [content, setContent] = useState<ContentStore | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: "home" });
  const [dirty, setDirty] = useState(false);
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 900 : false,
  );
  const [trash, setTrash] = useState<Array<{ type: string; doc: AnyDoc }>>([]);
  const [briefSubmissions, setBriefSubmissions] = useState<DesignBriefSubmission[]>([]);
  const { toasts, push: notify, dismiss } = useToasts();

  const loadContent = useCallback(async () => {
    setContent(null);
    setContentError(null);
    try {
      const [nextContent, nextTrash] = await Promise.all([fetchContent(), fetchTrash()]);
      setContent(nextContent);
      setTrash(nextTrash);
    } catch (error) {
      setContentError(error instanceof Error ? error.message : "Chargement du contenu impossible.");
    }
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then((next) => {
        setUser(next);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (user) void loadContent();
    else setContent(null);
  }, [loadContent, user]);

  const activeType = view.kind === "list" || view.kind === "edit" ? view.typeName : null;
  const currentType = activeType ? contentTypes.find((type) => type.name === activeType) ?? null : null;

  const guard = useCallback((action: () => void) => {
    if (dirty && !window.confirm("Des modifications ne sont pas enregistrées. Quitter sans sauvegarder ?")) return;
    setDirty(false);
    action();
  }, [dirty]);

  const openType = useCallback((type: ContentType) => {
    if (!content) return;
    guard(() => {
      if (type.kind === "singleton") {
        setView({ kind: "edit", typeName: type.name, doc: (content[type.name] as AnyDoc) ?? emptyDoc(type.name) });
      } else setView({ kind: "list", typeName: type.name });
    });
  }, [content, guard]);

  const updateContentDoc = useCallback((type: ContentType, doc: AnyDoc) => {
    setContent((previous) => {
      const base = previous ?? {};
      if (type.kind === "singleton") return { ...base, [type.name]: doc };
      const list = asArray(base[type.name]);
      return {
        ...base,
        [type.name]: list.some((item) => item.id === doc.id)
          ? list.map((item) => item.id === doc.id ? doc : item)
          : [...list, doc].sort((a, b) => a.position - b.position),
      };
    });
    setView((previous) => previous.kind === "edit" && previous.doc.id === doc.id ? { ...previous, doc } : previous);
  }, []);

  const save = async (type: ContentType, doc: AnyDoc) => {
    try {
      const saved = await persistDoc(type.name, doc);
      updateContentDoc(type, saved);
      notify("success", "Brouillon enregistré.");
      return saved;
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Enregistrement impossible.");
      throw error;
    }
  };

  const publish = async (type: ContentType, doc: AnyDoc) => {
    try {
      if (type.name === "service" && doc.featured) {
        const otherFeatured = asArray(content?.service).filter((item) => item.id !== doc.id && item.featured);
        for (const item of otherFeatured) {
          const saved = await persistDoc("service", { ...item, featured: false });
          const updated = item.publishedAtMeta ? await publishDoc("service", saved.id) : saved;
          updateContentDoc(type, updated);
        }
      }
      const published = await publishDoc(type.name, doc.id);
      updateContentDoc(type, published);
      notify("success", "Contenu publié.");
      return published;
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Publication impossible.");
      throw error;
    }
  };

  const featureService = async (type: ContentType, selected: AnyDoc) => {
    const serviceDocs = asArray(content?.service);
    for (const item of serviceDocs) {
      const shouldFeature = item.id === selected.id;
      if (Boolean(item.featured) === shouldFeature) continue;
      const saved = await persistDoc("service", { ...item, featured: shouldFeature });
      const updated = item.publishedAtMeta ? await publishDoc("service", saved.id) : saved;
      updateContentDoc(type, updated);
    }
  };

  const unpublish = async (type: ContentType, doc: AnyDoc) => {
    try {
      const next = await unpublishDoc(type.name, doc.id);
      updateContentDoc(type, next);
      notify("success", "Contenu retiré du site public.");
      return next;
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Dépublication impossible.");
      throw error;
    }
  };

  const moveToTrash = (type: ContentType, doc: AnyDoc) => {
    if (!window.confirm(`Envoyer « ${docTitle(type, doc)} » à la corbeille ?`)) return;
    void trashDoc(type.name, doc.id).then(() => {
      setContent((previous) => ({ ...(previous ?? {}), [type.name]: asArray(previous?.[type.name]).filter((item) => item.id !== doc.id) }));
      setView(type.kind === "collection" ? { kind: "list", typeName: type.name } : { kind: "home" });
      setDirty(false);
      notify("success", "Élément déplacé dans la corbeille.");
    }).catch((error) => notify("error", error instanceof Error ? error.message : "Suppression impossible."));
  };

  const openTrash = () => guard(() => {
    setView({ kind: "trash" });
    void fetchTrash().then(setTrash).catch((error) => notify("error", error instanceof Error ? error.message : "Corbeille indisponible."));
  });

  const loadBriefSubmissions = useCallback(() => {
    void fetchDesignBriefSubmissions()
      .then(setBriefSubmissions)
      .catch((error) => notify("error", error instanceof Error ? error.message : "Briefs indisponibles."));
  }, [notify]);

  const openBriefs = () => guard(() => {
    setView({ kind: "briefs" });
    loadBriefSubmissions();
  });

  if (!authChecked) return <FullScreenMessage>Chargement…</FullScreenMessage>;
  if (!user) {
    return <LoginScreen remote={isRemote} onSubmit={async (email, password) => {
      const result = await signInWithPassword(email, password);
      if (result.user) {
        setUser(result.user);
        return undefined;
      }
      return result.error ?? "Connexion impossible.";
    }} />;
  }

  if (contentError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-page p-6">
        <div className="max-w-lg rounded-xl border border-destructive/30 bg-surface-panel p-6 text-center">
          <h1 className="font-serif text-2xl text-text-primary">Le contenu n'a pas pu être chargé</h1>
          <p className="mt-3 text-sm text-destructive">{contentError}</p>
          <button onClick={() => void loadContent()} className="mt-5 rounded-md bg-action-strong px-4 py-2 text-sm font-medium text-text-on-strong">Réessayer</button>
        </div>
      </div>
    );
  }

  if (!content) return <div className="flex min-h-dvh bg-surface-page"><div className="w-64 border-r border-border-subtle bg-surface-panel" /><main className="flex-1"><LoadingShell /></main></div>;

  return (
    <div className="flex min-h-dvh bg-surface-page text-text-primary">
      <a href="#cms-main" className="sr-only z-[100] rounded-md bg-action-strong px-4 py-2 text-text-on-strong focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Aller au contenu principal
      </a>
      <Sidebar
        activeType={activeType}
        viewKind={view.kind}
        email={user.email}
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        onHome={() => guard(() => setView({ kind: "home" }))}
        onBriefs={openBriefs}
        onTrash={openTrash}
        onSelect={openType}
        onSignOut={() => guard(() => void signOutUser().then(() => {
          setUser(null);
          setView({ kind: "home" });
        }))}
        onReset={isRemote ? null : () => guard(() => void resetDemo().then((store) => {
          setContent(store);
          setView({ kind: "home" });
        }))}
      />

      <main id="cms-main" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto">
        {!isRemote ? <div className="border-b border-border-accent-muted bg-surface-accent-muted/40 px-6 py-2 text-center text-xs text-text-accent">Démo locale — rien n'est publié sur le site réel.</div> : null}

        {view.kind === "home" ? (
          <Suspense fallback={<LoadingShell />}>
            <Overview email={user.email} content={content} trashCount={trash.length} onOpen={openType} />
          </Suspense>
        ) : null}

        {view.kind === "briefs" ? (
          <DesignBriefSubmissions
            submissions={briefSubmissions}
            onRefresh={loadBriefSubmissions}
            onUpdateStatus={(id, status) => {
              void updateDesignBriefStatus(id, status)
                .then((updated) => {
                  setBriefSubmissions((items) => items.map((item) => (item.id === id ? updated : item)));
                  notify("success", "Statut du brief mis à jour.");
                })
                .catch((error) => notify("error", error instanceof Error ? error.message : "Mise à jour impossible."));
            }}
          />
        ) : null}

        {view.kind === "trash" ? (
          <TrashView
            items={trash.flatMap(({ type, doc }) => {
              const definition = contentTypes.find((item) => item.name === type);
              return definition ? [{ type: definition, doc }] : [];
            })}
            onRestore={(type, doc) => void restoreDoc(type.name, doc.id).then((restored) => {
              updateContentDoc(type, restored);
              setTrash((items) => items.filter((item) => !(item.type === type.name && item.doc.id === doc.id)));
              notify("success", "Élément restauré en brouillon.");
            }).catch((error) => notify("error", error instanceof Error ? error.message : "Restauration impossible."))}
            onDelete={(type, doc) => {
              if (!window.confirm("Supprimer définitivement cet élément et son historique ?")) return;
              void permanentlyDeleteDoc(type.name, doc.id).then(() => {
                setTrash((items) => items.filter((item) => !(item.type === type.name && item.doc.id === doc.id)));
                notify("success", "Élément supprimé définitivement.");
              }).catch((error) => notify("error", error instanceof Error ? error.message : "Suppression impossible."));
            }}
          />
        ) : null}

        {view.kind === "list" && currentType ? (
          <CollectionList
            type={currentType}
            docs={asArray(content[currentType.name])}
            onEdit={(doc) => guard(() => setView({ kind: "edit", typeName: currentType.name, doc }))}
            onCreate={() => guard(() => setView({ kind: "edit", typeName: currentType.name, doc: emptyDoc(currentType.name, asArray(content[currentType.name]).length) }))}
            onTrash={(doc) => moveToTrash(currentType, doc)}
            onReorder={async (docs) => {
              const ordered = await reorderDocs(currentType.name, docs);
              setContent((previous) => ({ ...(previous ?? {}), [currentType.name]: ordered }));
            }}
            onFeature={currentType.name === "service" ? (doc) => featureService(currentType, doc) : undefined}
            notify={notify}
          />
        ) : null}

        {view.kind === "edit" && currentType ? (
          <DocumentEditor
            key={`${currentType.name}-${view.doc.id}`}
            type={currentType}
            doc={view.doc}
            onBack={() => guard(() => setView(currentType.kind === "collection" ? { kind: "list", typeName: currentType.name } : { kind: "home" }))}
            onSave={(doc) => save(currentType, doc)}
            onPublish={(doc) => publish(currentType, doc)}
            onUnpublish={(doc) => unpublish(currentType, doc)}
            onTrash={(doc) => moveToTrash(currentType, doc)}
            onDirtyChange={setDirty}
            loadRevisions={() => listRevisions(currentType.name, view.doc.id)}
            onRestoreRevision={async (revision: Revision) => {
              const restored = await restoreRevision(revision);
              updateContentDoc(currentType, restored);
              return restored;
            }}
            notify={notify}
          />
        ) : null}
      </main>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

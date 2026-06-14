import { useEffect, useState } from "react";
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "../app/components/ui/utils";

export type ToastKind = "success" | "error";

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

let toastId = 0;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (kind: ToastKind, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, kind, message }]);
    return id;
  };

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, push, dismiss };
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live={toast.kind === "error" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-[var(--shadow-panel)]",
        toast.kind === "success"
          ? "border-border-accent bg-surface-panel text-text-primary"
          : "border-destructive/30 bg-surface-panel text-destructive",
      )}
    >
      {toast.kind === "success" ? (
        <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-text-accent" />
      ) : (
        <ExclamationCircleIcon className="mt-0.5 size-4 shrink-0" />
      )}
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="flex size-10 shrink-0 items-center justify-center rounded text-text-muted hover:text-text-primary"
        aria-label="Fermer la notification"
      >
        <XMarkIcon className="size-4" />
      </button>
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={() => onDismiss(toast.id)} />
        </div>
      ))}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-border-subtle/70", className)} aria-hidden />;
}

export function LoadingShell() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10" aria-busy="true" aria-label="Chargement du contenu">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10" aria-busy="true" aria-label="Chargement de la liste">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      <div className="mt-6 overflow-hidden rounded-xl border border-border-subtle bg-surface-panel p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3.5">
            <div className="flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
            <Skeleton className="size-7 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { ArrowRightIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export default function LoginScreen({
  onSubmit,
  remote,
}: {
  onSubmit: (email: string, password: string) => Promise<string | undefined>;
  remote: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Renseigne ton email et ton mot de passe.");
      return;
    }
    setLoading(true);
    setError("");
    const message = await onSubmit(email.trim(), password);
    setLoading(false);
    if (message) {
      setError(message);
    }
  };

  const inputClass =
    "w-full rounded-md border border-border-subtle bg-surface-panel-muted px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted/60 focus:border-action-accent focus:ring-2 focus:ring-[color:var(--focus-ring)]";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-accent">Espace d'administration</p>
          <h1 className="mt-2 font-serif text-3xl text-text-primary">Carole Tonoukouen</h1>
          <p className="mt-2 text-sm text-text-muted">Connecte-toi pour gérer le contenu du site.</p>
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-panel p-6 shadow-[var(--shadow-panel)]"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cms-login-email" className="text-xs font-medium uppercase tracking-wide text-text-muted">Email</label>
            <input
              id="cms-login-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              className={inputClass}
              placeholder="carole@exemple.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cms-login-password" className="text-xs font-medium uppercase tracking-wide text-text-muted">Mot de passe</label>
            <input
              id="cms-login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={inputClass}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />
          </div>

          {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-action-strong px-4 py-2.5 text-sm font-medium text-text-on-strong transition-colors hover:bg-action-strong-hover disabled:opacity-60"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="size-4 animate-spin" /> Connexion…
              </>
            ) : (
              <>
                Se connecter <ArrowRightIcon className="size-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-text-muted/80">
          {remote
            ? "Connecte-toi avec l'email et le mot de passe de ton compte Supabase."
            : "Démo — toute combinaison email + mot de passe ouvre le tableau de bord."}
        </p>
      </div>
    </div>
  );
}

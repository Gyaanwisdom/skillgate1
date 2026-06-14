import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    mode: z.enum(["login", "signup"]).optional(),
    redirect: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Sign in — SkillGate" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(initialMode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: (redirect as any) ?? "/" });
    });
  }, []);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: (redirect as any) ?? "/" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError((result.error as any).message ?? "Sign-in failed");
    else if (!result.redirected) navigate({ to: (redirect as any) ?? "/" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-black text-[#0F172A]">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "signup" ? "Join SkillGate to book verified artisans." : "Sign in to continue."}
          </p>

          <button
            onClick={handleGoogle}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 border-t border-slate-200" /> or <div className="flex-1 border-t border-slate-200" />
          </div>

          <form onSubmit={handleEmail} className="grid gap-3">
            {mode === "signup" && (
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="rounded-lg border border-slate-200 px-3 py-2" />
              </label>
            )}
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              disabled={loading}
              className="rounded-lg bg-[#0F172A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1e293b] disabled:opacity-50"
            >
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600">
            {mode === "signup" ? "Already have an account? " : "New to SkillGate? "}
            <button onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="font-semibold text-[#0F172A] underline">
              {mode === "signup" ? "Sign in" : "Sign up"}
            </button>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center">
            <Link to="/register-artisan" className="text-sm font-semibold text-[#475569] hover:underline">
              Are you an artisan? Apply to join →
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
  { to: "/bookings", label: "Bookings", auth: true },
  { to: "/profile", label: "Profile", auth: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F172A]">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 shrink-0 bg-[#0F172A] text-white rounded-md flex items-center justify-center font-black text-sm">SG</div>
            <span className="truncate text-lg font-black tracking-tight">SkillGate</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => {
              if (l.auth && !session) return null;
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={
                    "px-3 py-2 text-sm font-semibold rounded-lg transition-colors " +
                    (active ? "bg-[#0F172A] text-white" : "text-slate-700 hover:bg-slate-100")
                  }
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="text-sm font-semibold text-slate-600 hover:text-[#0F172A]"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-semibold text-slate-700 hover:text-[#0F172A] px-3 py-2">
                  Log in
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-bold text-white hover:bg-[#1e293b]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden grid h-10 w-10 place-items-center rounded-lg border border-slate-200"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1">
            {navLinks.map((l) => {
              if (l.auth && !session) return null;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="mt-2 border-t border-slate-200 pt-3 flex flex-col gap-2">
              {session ? (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-left text-slate-600 hover:bg-slate-100"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link to="/auth" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100">
                    Log in
                  </Link>
                  <Link
                    to="/auth"
                    search={{ mode: "signup" }}
                    className="rounded-lg bg-[#0F172A] px-3 py-2 text-sm font-bold text-white text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-12 border-t border-slate-200 bg-[#0F172A] text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center font-black text-xs text-[#0F172A]">SG</div>
              <span className="font-black text-white">SkillGate</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Skilled hands. Verified trust. Redemption City's premier artisan network.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Explore</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/browse" className="hover:text-white">Browse Artisans</Link></li>
              <li><Link to="/register-artisan" className="hover:text-white">Become an Artisan</Link></li>
              <li><Link to="/auth" className="hover:text-white">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Company</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link to="/guidelines" className="hover:text-white">Community Guidelines</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Stay in touch</h4>
            <p className="mt-3 text-sm text-slate-400">support@skillgate.ng</p>
            <p className="text-sm text-slate-400">Redemption City, Nigeria</p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 text-xs text-slate-400 text-center">
            © 2026 SkillGate Redemption City. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
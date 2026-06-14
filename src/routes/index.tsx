import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ArtisanCard } from "@/components/ArtisanCard";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listArtisans, listCategories } from "@/lib/data.functions";
import { Shield, Zap, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillGate — Skilled Hands, Verified Trust" },
      { name: "description", content: "Connect with Redemption City's most reliable artisans. Verified, AI-matched, ready to work." },
    ],
  }),
  component: HomePage,
});

// Real images for the first 4 featured artisans. Replace as real signups arrive.
const FEATURED_IMAGES = [
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop",
];

// Category cover images instead of icons
const CATEGORY_IMAGES: Record<string, string> = {
  electrician: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop",
  plumber: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&h=400&fit=crop",
  carpenter: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=400&fit=crop",
  tailor: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=400&fit=crop",
  mechanic: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
  cleaner: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop",
  painter: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&h=400&fit=crop",
  hairstylist: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop",
};

function HomePage() {
  const fetchArtisans = useServerFn(listArtisans);
  const fetchCats = useServerFn(listCategories);
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => fetchCats() });
  const featured = useQuery({ queryKey: ["featured"], queryFn: () => fetchArtisans({ data: {} }) });

  const featuredList = (featured.data ?? []).slice(0, 4).map((a: any, i: number) => ({
    ...a,
    avatar_url: FEATURED_IMAGES[i] ?? a.avatar_url,
  }));

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0F172A] text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#1e3a8a,transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-semibold text-white">
              <Sparkles className="h-3 w-3" /> AI-powered matching · Verified artisans
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
              Skilled hands. <span className="text-white/70">Verified trust.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl">
              SkillGate connects Redemption City with background-checked, community-vetted artisans — electricians, plumbers, tailors, mechanics, and more.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/browse"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-[#0F172A] hover:bg-slate-100"
              >
                Find an artisan <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register-artisan"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-bold hover:bg-white/10"
              >
                Become an artisan
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> 40+ verified pros</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Background-checked</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> AI-matched</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A]">What do you need done?</h2>
        <p className="mt-1 text-slate-500">Tap any category to see verified artisans.</p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {(cats.data ?? []).map((c) => (
            <Link
              key={c.slug}
              to="/browse"
              search={{ category: c.slug }}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-[#0F172A] hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={CATEGORY_IMAGES[c.slug] ?? "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=400&fit=crop"}
                  alt={c.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <div className="font-bold text-[#0F172A]">{c.name}</div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A]">How SkillGate works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { i: <Sparkles className="h-5 w-5" />, t: "Describe your job", d: "Tell our AI what you need — it picks the best 3 artisans for your budget & timing." },
              { i: <Shield className="h-5 w-5" />, t: "Pick a verified pro", d: "Every artisan is background-checked, ID-verified, and community-rated." },
              { i: <Zap className="h-5 w-5" />, t: "Book in seconds", d: "Choose your time, share the job, and the artisan gets notified instantly." },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-200 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0F172A] text-white">{s.i}</div>
                <div className="mt-3 text-xs font-bold text-slate-500">STEP {i + 1}</div>
                <div className="text-lg font-black text-[#0F172A]">{s.t}</div>
                <p className="mt-1 text-sm text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/browse" className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-6 py-3 font-bold text-white hover:bg-[#1e293b]">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A]">Featured artisans</h2>
            <p className="text-slate-500 mt-1">Top-rated pros in Redemption City this week.</p>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-[#0F172A] hover:underline shrink-0">View all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredList.map((a: any) => <ArtisanCard key={a.id} a={a} />)}
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-[#0F172A] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 grid sm:grid-cols-3 gap-6 text-center">
          {[
            { n: "40+", l: "Verified artisans" },
            { n: "1,200+", l: "Jobs completed" },
            { n: "4.8★", l: "Avg rating" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl sm:text-4xl font-black text-white">{s.n}</div>
              <div className="text-sm text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
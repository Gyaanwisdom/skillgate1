import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ArtisanCard } from "@/components/ArtisanCard";
import { listArtisans, listCategories, aiMatch } from "@/lib/data.functions";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

type BrowseSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Browse Artisans — SkillGate" }] }),
  component: BrowsePage,
});

function BrowsePage() {
  const { category, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const fetchArtisans = useServerFn(listArtisans);
  const fetchCats = useServerFn(listCategories);

  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCats(),
  });
  const artisans = useQuery({
    queryKey: ["artisans", category ?? "", q ?? ""],
    queryFn: () => fetchArtisans({ data: { category, search: q } }),
  });

  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<{ matches: { id: string; reason: string }[]; pool: any[] } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const runMatch = useServerFn(aiMatch);

  async function handleMatch() {
    if (aiQuery.length < 5) return;
    setAiLoading(true);
    try {
      const r = await runMatch({ data: { query: aiQuery, category } });
      setAiResult(r);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  }

  const activeCat = cats.data?.find((c) => c.slug === category);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {activeCat ? activeCat.name : "All Artisans"}
          </h1>
          <p className="text-slate-500 mt-1">
            {activeCat?.description ?? "Browse verified, background-checked artisans in Redemption City."}
          </p>
        </div>

        {/* AI Match */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[#0F172A]" />
            <h2 className="font-bold text-[#0F172A]">AI Match — describe your job</h2>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            We'll pick the top 3 artisans by price, rating, availability, and skill fit.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="e.g. Fix leaking kitchen sink under ₦8,000 today"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F172A]"
            />
            <button
              onClick={handleMatch}
              disabled={aiLoading || aiQuery.length < 5}
              className="rounded-xl bg-[#0F172A] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Match
            </button>
          </div>
          {aiResult && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {aiResult.matches.map((m) => {
                const a = aiResult.pool.find((p) => p.id === m.id);
                if (!a) return null;
                return (
                  <Link
                    key={m.id}
                    to="/browse/$id"
                    params={{ id: m.id }}
                    className="rounded-xl border border-slate-200 bg-white p-3 hover:border-[#0F172A] hover:shadow-sm"
                  >
                    <div className="font-bold text-[#0F172A] text-sm">{a.full_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.reason}</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            defaultValue={q ?? ""}
            onChange={(e) =>
              navigate({ search: (s: BrowseSearch) => ({ ...s, q: e.target.value || undefined }) })
            }
            placeholder="Search by name, skill, or service…"
            className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0F172A]"
          />
        </div>

        {/* Category chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => navigate({ search: (s: BrowseSearch) => ({ ...s, category: undefined }) })}
            className={
              "rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors " +
              (!category
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white text-slate-700 border-slate-200 hover:border-[#0F172A]")
            }
          >
            All
          </button>
          {(cats.data ?? []).map((c) => (
            <button
              key={c.slug}
              onClick={() =>
                navigate({ search: (s: BrowseSearch) => ({ ...s, category: c.slug }) })
              }
              className={
                "rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors " +
                (category === c.slug
                  ? "bg-[#0F172A] text-white border-[#0F172A]"
                  : "bg-white text-slate-700 border-slate-200 hover:border-[#0F172A]")
              }
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {artisans.isLoading ? (
          <div className="text-center py-10 text-slate-500">Loading…</div>
        ) : (artisans.data ?? []).length === 0 ? (
          <div className="text-center py-10 text-slate-500">No artisans match your filters.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(artisans.data ?? []).map((a: any) => (
              <ArtisanCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
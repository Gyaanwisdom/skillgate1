import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getArtisan } from "@/lib/data.functions";
import { formatNaira } from "@/lib/format";
import { Star, MapPin, Briefcase, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createBooking } from "@/lib/data.functions";

export const Route = createFileRoute("/browse/$id")({
  head: () => ({ meta: [{ title: "Artisan — SkillGate" }] }),
  component: ArtisanPage,
});

function ArtisanPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchArtisan = useServerFn(getArtisan);
  const { data: a, isLoading } = useQuery({
    queryKey: ["artisan", id],
    queryFn: () => fetchArtisan({ data: { id } }),
  });

  const [booking, setBooking] = useState(false);
  const [when, setWhen] = useState("");
  const [desc, setDesc] = useState("");
  const [addr, setAddr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const book = useServerFn(createBooking);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      navigate({ to: "/auth", search: { redirect: `/browse/${id}` } });
      return;
    }
    setSubmitting(true);
    try {
      await book({
        data: {
          artisan_id: id,
          scheduled_at: new Date(when).toISOString(),
          description: desc,
          address: addr || undefined,
        },
      });
      navigate({ to: "/bookings" });
    } catch (err: any) {
      setError(err.message || "Failed to book");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading)
    return (
      <AppShell>
        <div className="grid place-items-center py-32"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </AppShell>
    );
  if (!a)
    return (
      <AppShell>
        <div className="text-center py-32 text-slate-500">Artisan not found.</div>
      </AppShell>
    );

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#0F172A] mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to browse
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="grid grid-cols-[auto_1fr] sm:flex sm:items-start gap-4">
            <img
              src={a.avatar_url ?? `https://i.pravatar.cc/200?u=${a.id}`}
              alt={a.full_name}
              className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl object-cover bg-slate-100"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] truncate">{a.full_name}</h1>
                {a.verified && (
                  <span className="text-[10px] font-bold uppercase bg-[#0F172A]/20 text-[#475569] px-2 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 capitalize">{a.category_slug}</p>
              <div className="mt-2 flex items-center gap-3 text-sm flex-wrap">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Star className="h-4 w-4 fill-[#0F172A] text-[#0F172A]" />
                  {Number(a.rating).toFixed(1)}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">{a.completed_jobs} jobs</span>
                <span className="text-slate-400">·</span>
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <Briefcase className="h-3.5 w-3.5" /> {a.years_experience}y exp
                </span>
              </div>
            </div>
          </div>

          {a.bio && <p className="mt-5 text-slate-700">{a.bio}</p>}

          {a.skills && a.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {a.skills.map((s: string) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Hourly rate</div>
              <div className="font-black text-[#0F172A]">{formatNaira(a.hourly_rate)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Location</div>
              <div className="font-semibold inline-flex items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5" /> {a.location}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-500">Status</div>
              <div className={"font-semibold " + (a.available ? "text-green-600" : "text-slate-500")}>
                {a.available ? "Available now" : "Busy"}
              </div>
            </div>
          </div>

          {/* Price list / service rate card */}
          <div className="mt-6">
            <h3 className="font-bold text-[#0F172A] mb-2">Price list</h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-200">
                  {[
                    { label: "Quick visit (1 hr)", hours: 1 },
                    { label: "Standard job (3 hrs)", hours: 3 },
                    { label: "Half day (5 hrs)", hours: 5 },
                    { label: "Full day (8 hrs)", hours: 8 },
                  ].map((row) => (
                    <tr key={row.label} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-700">{row.label}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-[#0F172A]">
                        {formatNaira(a.hourly_rate * row.hours)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50">
                    <td className="px-4 py-2.5 text-xs text-slate-500">Call-out / inspection</td>
                    <td className="px-4 py-2.5 text-right text-xs text-slate-500">Free for jobs above ₦5,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Final price confirmed by {a.full_name.split(" ")[0]} after seeing the job. Materials charged separately.
            </p>
          </div>

          {!booking ? (
            <button
              onClick={() => setBooking(true)}
              disabled={!a.available}
              className="mt-6 w-full sm:w-auto rounded-xl bg-[#0F172A] px-6 py-3 font-bold text-white hover:bg-[#1e293b] disabled:opacity-50"
            >
              Book this artisan
            </button>
          ) : (
            <form onSubmit={handleBook} className="mt-6 grid gap-3 rounded-xl border border-slate-200 p-4">
              <h3 className="font-bold">Book {a.full_name}</h3>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">When</span>
                <input
                  type="datetime-local"
                  required
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">Describe the job</span>
                <textarea
                  required
                  minLength={5}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                  rows={3}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">Address (optional)</span>
                <input
                  value={addr}
                  onChange={(e) => setAddr(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {submitting ? "Booking…" : "Confirm booking"}
                </button>
                <button
                  type="button"
                  onClick={() => setBooking(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listCategories, submitRegistration } from "@/lib/data.functions";

export const Route = createFileRoute("/register-artisan")({
  head: () => ({ meta: [{ title: "Become an Artisan — SkillGate" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const fetchCats = useServerFn(listCategories);
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => fetchCats() });
  const submit = useServerFn(submitRegistration);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    category_slug: "",
    years_experience: 1,
    hourly_rate: 5000,
    bio: "",
    skills: "",
    location: "Redemption City",
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await submit({
        data: {
          ...form,
          years_experience: Number(form.years_experience),
          hourly_rate: Number(form.hourly_rate),
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 15),
        },
      });
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  if (done)
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-4 text-2xl font-black text-[#0F172A]">Application submitted</h1>
          <p className="mt-2 text-slate-600">
            Our admins will review and get back to you. You'll appear on SkillGate once approved.
          </p>
          <Link to="/" className="mt-6 inline-block rounded-lg bg-[#0F172A] px-5 py-2.5 font-bold text-white">
            Back home
          </Link>
        </div>
      </AppShell>
    );

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A]">Become a SkillGate artisan</h1>
        <p className="mt-1 text-slate-600">Tell us about your trade. Admins approve within 24 hours.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name"><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inp} /></Field>
            <Field label="Email"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} /></Field>
            <Field label="Trade / Category">
              <select required value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })} className={inp}>
                <option value="">Select…</option>
                {(cats.data ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Years experience"><input type="number" min={0} max={60} value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value as any })} className={inp} /></Field>
            <Field label="Hourly rate (₦)"><input type="number" min={500} value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value as any })} className={inp} /></Field>
            <Field label="Location"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inp} /></Field>
            <Field label="Skills (comma separated)"><input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Wiring, Solar, Repairs" className={inp} /></Field>
          </div>
          <Field label="Short bio"><textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={inp} maxLength={1000} /></Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="rounded-lg bg-[#0F172A] px-5 py-2.5 font-bold text-white hover:bg-[#1e293b] disabled:opacity-50">
            {loading ? "Submitting…" : "Submit application"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

const inp = "rounded-lg border border-slate-200 px-3 py-2 text-sm w-full focus:outline-none focus:border-[#0F172A]";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm"><span className="text-slate-600 font-medium">{label}</span>{children}</label>;
}
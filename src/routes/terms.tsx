import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms — SkillGate" }] }),
  component: () => (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-black text-[#0F172A]">Terms of Service</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">By using SkillGate you agree to treat artisans with respect, pay agreed rates, and follow community guidelines. SkillGate is a marketplace and not liable for direct services rendered.</p>
        <p className="mt-6 text-sm text-slate-400">Last updated: 2026</p>
      </div>
    </AppShell>
  ),
});

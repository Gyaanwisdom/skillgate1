import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — SkillGate" }] }),
  component: () => (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-black text-[#0F172A]">Contact Support</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">Email <a href="mailto:support@skillgate.ng" className="underline">support@skillgate.ng</a> or call +234 800 SKILLGATE. We respond within 24 hours, Monday to Saturday.</p>
      </div>
    </AppShell>
  ),
});

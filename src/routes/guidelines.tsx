import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/guidelines")({
  head: () => ({ meta: [{ title: "Guidelines — SkillGate" }] }),
  component: () => (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-black text-[#0F172A]">Community Guidelines</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">Be respectful. Pay fairly. Leave honest reviews. Report unsafe behavior to support@skillgate.ng. Together we keep Redemption City trusted.</p>
      </div>
    </AppShell>
  ),
});

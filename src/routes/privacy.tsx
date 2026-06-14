import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

const pages = {
  "/privacy": { title: "Privacy Policy", body: "We respect your privacy. SkillGate only collects data needed to connect you with verified artisans. We never sell your data. Contact support@skillgate.ng for data requests." },
  "/terms": { title: "Terms of Service", body: "By using SkillGate you agree to treat artisans with respect, pay agreed rates, and follow community guidelines. SkillGate is a marketplace and not liable for direct services rendered." },
  "/guidelines": { title: "Community Guidelines", body: "Be respectful. Pay fairly. Leave honest reviews. Report unsafe behavior to support@skillgate.ng. Together we keep Redemption City trusted." },
  "/contact": { title: "Contact Support", body: "Email support@skillgate.ng or call +234 800 SKILLGATE. We respond within 24 hours, Monday to Saturday." },
} as const;

function makePage(path: keyof typeof pages) {
  const p = pages[path];
  return function Page() {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl font-black text-[#0F172A]">{p.title}</h1>
          <p className="mt-4 text-slate-700 leading-relaxed">{p.body}</p>
          <p className="mt-6 text-sm text-slate-400">Last updated: 2026</p>
        </div>
      </AppShell>
    );
  };
}

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy — SkillGate" }] }),
  component: makePage("/privacy"),
});

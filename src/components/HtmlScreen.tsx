import { AppShell } from "./AppShell";

export function HtmlScreen({ html }: { html: string }) {
  return (
    <AppShell>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </AppShell>
  );
}

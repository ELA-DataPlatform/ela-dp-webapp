import { Card } from "./card";

interface VerdictData {
  tldr: string;
  strengths: string[];
  watch: string[];
  recommendations: string[];
}

function BulletList({ items, dotClass }: { items: string[]; dotClass: string }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-[1.55] text-(--color-fg)">
          <span className={`mt-2 h-1 w-1 shrink-0 rounded-full ${dotClass}`} aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({
  label,
  meta,
  children,
}: {
  label: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-(--color-border) px-4 py-4 first:border-t-0 sm:px-5">
      <div className="flex items-baseline justify-between">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          {label}
        </span>
        {meta && (
          <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">{meta}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export function VerdictPanel({ verdict }: { verdict: VerdictData }) {
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2.5 sm:px-5">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          Verdict
        </span>
        <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
          Claude Sonnet 4.6
        </span>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <p className="text-sm font-medium leading-[1.55] text-(--color-fg)">{verdict.tldr}</p>
      </div>

      <Section label="Points forts" meta={`${verdict.strengths.length}`}>
        <BulletList items={verdict.strengths} dotClass="bg-(--color-success)" />
      </Section>
      <Section label="À surveiller" meta={`${verdict.watch.length}`}>
        <BulletList items={verdict.watch} dotClass="bg-(--color-warning)" />
      </Section>
      <Section label="Recommandations" meta={`${verdict.recommendations.length}`}>
        <BulletList items={verdict.recommendations} dotClass="bg-(--color-fg-muted)" />
      </Section>
    </Card>
  );
}

import { quickStart } from '@/lib/cookbook-experience';
import type { BrandState } from '@/lib/cookbook-brand-server';
export function QuickStart({ brand, selected, busy, onSelect }: { brand?: BrandState | null; selected?: string | null; busy?: boolean; onSelect: (slug: string) => void }) {
  const next = quickStart.find(s => !brand?.quickStart?.find(p => p.slug === s.slug)?.confirmed);
  return <section className="cw-quick-start" aria-label="Cookbook quick start"><div className="cw-quick-heading"><span>YOUR BRAND QUICK START</span><small>{brand?.quickStart?.filter(s => s.confirmed).length || 0} of 3 approved</small></div><ol>{quickStart.map((step, index) => {
    const state = brand?.quickStart?.find(p => p.slug === step.slug);
    return <li key={step.slug}><button disabled={busy} aria-current={selected === step.slug ? 'step' : undefined} onClick={() => onSelect(step.slug)}><span className="cw-step-number">{state?.confirmed ? '✓' : index + 1}</span><span><strong>{step.name}</strong><span>{step.description}</span><small>{state?.reviewSuggested ? 'Review suggested' : state?.confirmed ? 'Approved · Revisit' : next?.slug === step.slug ? 'Start here' : 'Up next'}</small></span></button></li>;
  })}</ol></section>;
}

'use client';

import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { ORGANIZATION_NAME } from '@/lib/ui/branding';

const steps = [
  'Discord でログインします。',
  '支援プランを選択し、ボタンを押します。',
  'レシートが送付されます。',
] as const;

export function DonateFlowStepsPanel() {
  return (
    <Card surface="glass" padding="lg" className="p-0">
      <div className="space-y-5 p-6 sm:p-8">
        <SectionHeading
          as="h3"
          size="sm"
          heading="これからの流れ"
          description="対価や特典は提供していません。寄付手順のみを明確にしています。"
        />
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className="rounded-2xl glass-sm border-gradient-subtle px-4 py-4 text-sm text-muted-foreground shadow-minimal shadow-inner-light"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                Step {index + 1}
              </span>
              <p className="mt-2 text-foreground">{step}</p>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">
          いただいた寄付は {ORGANIZATION_NAME}{' '}
          のコミュニティ運営にのみ利用し、対価の提供は行いません。
        </p>
      </div>
    </Card>
  );
}

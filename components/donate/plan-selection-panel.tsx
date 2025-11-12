'use client';

import { AlertCircle, ArrowRight, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { DonationImpact } from '@/components/donation-impact';
import { cn } from '@/lib/ui/cn';
import type { CheckoutPreset } from '@/lib/ui/types';

export interface DonatePlanSelectionPanelProps {
  readonly presets: readonly CheckoutPreset[];
  readonly selectedPreset: CheckoutPreset | null;
  readonly onSelect: (preset: CheckoutPreset) => void;
  readonly onCheckout: () => Promise<void>;
  readonly checkout: {
    isProcessing: boolean;
    error: string | null;
    ctaLabel: string;
    ctaStatusMessage: string;
    isDisabled: boolean;
  };
  readonly planHeadingId: string;
  readonly planDescriptionId: string;
  readonly ctaStatusId: string;
}

export function DonatePlanSelectionPanel({
  presets,
  selectedPreset,
  onSelect,
  onCheckout,
  checkout,
  planHeadingId,
  planDescriptionId,
  ctaStatusId,
}: DonatePlanSelectionPanelProps) {
  return (
    <Card surface="glass" padding="lg" className="glass-lg p-0">
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <SectionHeading
          headingId={planHeadingId}
          descriptionId={planDescriptionId}
          heading="支援プラン"
          description="設定済みの寄付プランを 1:1 で表示します。1つ選択すると寄付ボタンが有効になります。"
        />

        <div
          role="radiogroup"
          aria-labelledby={planHeadingId}
          aria-describedby={planDescriptionId}
          className="grid gap-4 md:grid-cols-3"
        >
          {presets.map((preset) => {
            const isSelected = selectedPreset?.id === preset.id;
            const intervalLabel =
              preset.mode === 'payment' ? '単発' : preset.interval === 'yearly' ? '年額' : '月額';
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                data-selected={isSelected ? 'true' : 'false'}
                onClick={() => onSelect(preset)}
                className={cn(
                  'plan-card group flex h-full flex-col justify-between gap-4 rounded-2xl border px-5 py-4 text-left text-sm transition-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2',
                  isSelected
                    ? 'glass-md border-white/60 shadow-glass-elevated glow-accent-medium'
                    : 'glass-sm border-gradient-subtle shadow-minimal',
                )}
              >
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">{preset.label}</p>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-foreground/10 px-3 py-1 text-foreground">
                    {intervalLabel}
                  </span>
                  <span className="rounded-full bg-white/30 px-3 py-1 text-foreground">
                    ¥{preset.amount.toLocaleString('ja-JP')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <Button
            type="button"
            size="lg"
            className="donate-cta-animated w-full justify-center gap-2 text-base"
            onClick={() => void onCheckout()}
            disabled={checkout.isDisabled}
          >
            <span className="flex items-center gap-2">
              {checkout.isProcessing ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ArrowRight className="h-4 w-4" aria-hidden />
              )}
              {checkout.ctaLabel}
            </span>
          </Button>

          {checkout.error ? (
            <div
              className="flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 transition-glass glow-status-error"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
              <span>{checkout.error}</span>
            </div>
          ) : null}

          <p id={ctaStatusId} className="text-xs text-muted-foreground" aria-live="polite">
            {checkout.ctaStatusMessage}
          </p>
        </div>

        {selectedPreset ? (
          <div className="fade-in-up">
            <DonationImpact mode={getImpactKey(selectedPreset)} amount={selectedPreset.amount} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function getImpactKey(preset: CheckoutPreset): 'payment' | 'monthly' | 'yearly' {
  if (preset.mode === 'payment') {
    return 'payment';
  }
  return preset.interval === 'yearly' ? 'yearly' : 'monthly';
}

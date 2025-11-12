'use client';

import { AlertCircle, LoaderCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { ConsentToggle } from '@/components/consent-toggle';

export interface DonateConsentPanelProps {
  readonly consentValue: boolean;
  readonly isSignedIn: boolean;
  readonly isUpdating: boolean;
  readonly consentError: string | null;
  readonly labelId: string;
  readonly descriptionId: string;
  readonly onToggle: (nextValue: boolean) => Promise<void>;
}

export function DonateConsentPanel({
  consentValue,
  isSignedIn,
  isUpdating,
  consentError,
  labelId,
  descriptionId,
  onToggle,
}: DonateConsentPanelProps) {
  return (
    <Card surface="glass" padding="lg" className="p-0">
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <SectionHeading
          heading="掲示への同意"
          description="同意すると支援者ページに Discord の表示名を掲載します（寄付額は非公開）。"
        />

        <div className="flex flex-col gap-3 rounded-2xl glass-sm border-gradient-subtle px-4 py-4 shadow-minimal shadow-inner-light transition-glass">
          <div className="flex items-start gap-4">
            <ConsentToggle
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              checked={consentValue}
              onCheckedChange={(nextValue) => void onToggle(nextValue)}
              disabled={!isSignedIn || isUpdating}
              className="shrink-0"
            />
            <div className="space-y-1">
              <span id={labelId} className="text-sm font-semibold text-foreground">
                ニックネームの掲示に同意する
              </span>
              <p id={descriptionId} className="text-xs leading-relaxed text-muted-foreground">
                Discord でログインすると同意の状態を変更できます。寄付後でも撤回が可能です。
              </p>
              {isUpdating ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-glass">
                  <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden />
                  更新中…
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {consentError ? (
          <div
            className="flex items-start gap-2 rounded-md border border-red-200/70 bg-red-50 px-3 py-2 text-sm text-red-700 transition-glass glow-status-error"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
            <span>{consentError}</span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

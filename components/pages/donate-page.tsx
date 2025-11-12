'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConsentToggle } from '@/components/consent-toggle';
import { DonationImpact } from '@/components/donation-impact';
import { DiscordIcon } from '@/components/ui/discord-icon';
import { cn } from '@/lib/ui/cn';
import { ORGANIZATION_NAME } from '@/lib/ui/branding';
import { useHeroContext } from '@/lib/ui/contexts/hero-context';
import { CHECKOUT_PRESETS } from '@/lib/ui/checkout-presets';
import { useCheckout } from '@/lib/ui/hooks/use-checkout';
import { useConsentMutation } from '@/lib/ui/hooks/use-consent';
import { useSession } from '@/lib/ui/hooks/use-session';
import type { CheckoutPreset } from '@/lib/ui/types';

function getImpactKey(preset: CheckoutPreset): 'payment' | 'monthly' | 'yearly' {
  if (preset.mode === 'payment') {
    return 'payment';
  }
  return preset.interval === 'yearly' ? 'yearly' : 'monthly';
}

export function DonatePage() {
  const { setShouldDeemphasizeButton } = useHeroContext();
  const { status, login, logout, refresh, isRefreshing } = useSession();
  const [consent, setConsent] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<CheckoutPreset | null>(null);

  useEffect(() => {
    setShouldDeemphasizeButton(true);
    return () => {
      setShouldDeemphasizeButton(false);
    };
  }, [setShouldDeemphasizeButton]);

  const {
    updateConsent,
    isUpdating: isConsentUpdating,
    error: consentError,
  } = useConsentMutation({
    onUpdated: (nextValue: boolean | ((prevState: boolean) => boolean)) => {
      setConsent(nextValue);
      void refresh();
    },
  });
  const { startCheckout, state: checkoutState, resetError } = useCheckout();

  useEffect(() => {
    if (status.state === 'signed-in') {
      setConsent(status.session.consentPublic);
    } else {
      setConsent(false);
    }
  }, [status]);

  const isSignedIn = status.state === 'signed-in';
  const displayName = status.state === 'signed-in' ? status.session.displayName : '';

  const presets = CHECKOUT_PRESETS;
  const consentLabelId = useId();
  const consentDescriptionId = useId();
  const planHeadingId = useId();
  const planDescriptionId = useId();
  const ctaStatusId = useId();

  const handleConsentChange = useCallback(
    async (nextValue: boolean) => {
      if (!isSignedIn || nextValue === consent) {
        return;
      }
      await updateConsent(nextValue);
    },
    [isSignedIn, consent, updateConsent],
  );

  const handlePlanSelect = useCallback(
    (preset: CheckoutPreset) => {
      setSelectedPreset(preset);
      resetError();
    },
    [resetError],
  );

  const handleCheckout = useCallback(async () => {
    if (!isSignedIn || !selectedPreset) {
      return;
    }
    resetError();
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'donate_start');
    }
    await startCheckout(selectedPreset);
  }, [isSignedIn, resetError, selectedPreset, startCheckout]);

  const ctaLabel = selectedPreset
    ? `¥${selectedPreset.amount.toLocaleString('ja-JP')} の寄付を進める`
    : 'プランを選択して寄付を進める';
  const isCtaDisabled = !isSignedIn || !selectedPreset || checkoutState.isProcessing;

  const ctaStatusMessage = !isSignedIn
    ? 'Discord でログインすると寄付ボタンが有効になります。'
    : !selectedPreset
      ? 'まずは支援プランを 1 つ選択してください。'
      : checkoutState.isProcessing
        ? 'Stripe Checkout を準備しています…'
        : '寄付ボタンを押すと Stripe Checkout に移動します。';

  return (
    <div className="page-enter">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="space-y-6">
          <Card className="glass-lg p-0">
            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">Discord ログイン</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Stripe Checkout で寄付を進める前に、Discord ログイン状態を確認してください。
                </p>
              </div>

              {status.state === 'error' ? (
                <div
                  className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 transition-glass glow-status-error"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
                  <span>{status.message}</span>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {isSignedIn ? (
                  <>
                    <div className="flex flex-1 items-center gap-3 rounded-xl glass-sm border-gradient-subtle px-4 py-3 text-left text-sm text-muted-foreground shadow-minimal shadow-inner-light transition-glass glow-status-success">
                      <CheckCircle2 className="h-5 w-5 text-foreground" aria-hidden />
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">ログイン済み</span>
                        <span className="text-xs">{displayName}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={logout}
                      className="w-full sm:w-auto"
                      disabled={isRefreshing}
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" aria-hidden />
                        ログアウト
                      </span>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="discord"
                    size="md"
                    onClick={login}
                    disabled={isRefreshing}
                    className="group w-full gap-2"
                  >
                    <span className="flex items-center gap-2">
                      Discord でログイン
                      <DiscordIcon className="h-5 w-5 text-white" aria-hidden />
                    </span>
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                ログイン状態は 60
                分間保持されます。セッションの有効期限が切れた場合は再度ログインしてください。
              </p>
            </div>
          </Card>

          <Card className="p-0">
            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">掲示への同意</h2>
                <p className="text-sm text-muted-foreground">
                  同意した場合、支援者ページに Discord
                  の表示名を掲載します（寄付額は表示されません）。
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl glass-sm border-gradient-subtle px-4 py-4 shadow-minimal shadow-inner-light transition-glass">
                <div className="flex items-start gap-4">
                  <ConsentToggle
                    aria-labelledby={consentLabelId}
                    aria-describedby={consentDescriptionId}
                    checked={consent}
                    onCheckedChange={(value: boolean) => void handleConsentChange(value)}
                    disabled={!isSignedIn || isConsentUpdating}
                    className="shrink-0"
                  />
                  <div className="space-y-1">
                    <span id={consentLabelId} className="text-sm font-semibold text-foreground">
                      支援者ページに表示名を掲載することに同意します
                    </span>
                    <p
                      id={consentDescriptionId}
                      className="text-xs leading-relaxed text-muted-foreground"
                    >
                      Discord でログインすると同意の状態を変更できます。寄付後でも撤回が可能です。
                    </p>
                    {isConsentUpdating ? (
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

          <Card className="glass-lg p-0">
            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="space-y-2">
                <h2 id={planHeadingId} className="text-2xl font-semibold text-foreground">
                  支援プラン
                </h2>
                <p id={planDescriptionId} className="text-sm text-muted-foreground">
                  設定済みの寄付プランを 1:1 で表示します。1
                  つ選択すると寄付ボタンが有効になります。
                </p>
              </div>

              <div
                role="radiogroup"
                aria-labelledby={planHeadingId}
                aria-describedby={planDescriptionId}
                className="grid gap-4 md:grid-cols-3"
              >
                {presets.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id;
                  const intervalLabel =
                    preset.mode === 'payment'
                      ? '単発'
                      : preset.interval === 'yearly'
                        ? '年額'
                        : '月額';

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      data-selected={isSelected ? 'true' : 'false'}
                      onClick={() => handlePlanSelect(preset)}
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
                  onClick={() => void handleCheckout()}
                  disabled={isCtaDisabled}
                >
                  <span className="flex items-center gap-2">
                    {checkoutState.isProcessing ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    )}
                    {ctaLabel}
                  </span>
                </Button>

                {checkoutState.error ? (
                  <div
                    className="flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 transition-glass glow-status-error"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
                    <span>{checkoutState.error}</span>
                  </div>
                ) : null}

                <p id={ctaStatusId} className="text-xs text-muted-foreground" aria-live="polite">
                  {ctaStatusMessage}
                </p>
              </div>

              {selectedPreset ? (
                <div className="fade-in-up">
                  <DonationImpact
                    mode={getImpactKey(selectedPreset)}
                    amount={selectedPreset.amount}
                  />
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-0">
            <div className="space-y-5 p-6 sm:p-8">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">これからの流れ</h3>
                <p className="text-sm text-muted-foreground">
                  対価や特典は提供していません。寄付手順のみを明確にしています。
                </p>
              </div>
              <ol className="grid gap-3 sm:grid-cols-3">
                {[
                  'Discord でログインし、掲示への同意を確認します。',
                  '支援プランを 1 つ選択し、寄付ボタンから Stripe Checkout へ進みます。',
                  '決済完了後は /thanks へ遷移し、Stripe のレシートのみが送付されます。',
                ].map((step, index) => (
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
        </div>
      </div>
    </div>
  );
}

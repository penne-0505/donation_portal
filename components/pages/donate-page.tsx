'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DonationImpact } from '@/components/donation-impact';
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
  const { status, login, logout, refresh, isRefreshing } = useSession();
  const [consent, setConsent] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<CheckoutPreset | null>(null);

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

  const handleConsentChange = useCallback(
    async (nextValue: boolean) => {
      if (!isSignedIn || nextValue === consent) {
        return;
      }
      await updateConsent(nextValue);
    },
    [isSignedIn, consent, updateConsent],
  );

  const handleCheckout = useCallback(
    async (preset: CheckoutPreset) => {
      if (!isSignedIn) {
        return;
      }
      setSelectedPreset(preset);
      resetError();
      await startCheckout(preset);
    },
    [isSignedIn, resetError, startCheckout],
  );

  return (
    <div className="space-y-12 page-enter">
      <section className="space-y-6 text-pretty">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground fade-in-up stagger-1">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden />
          Minecraft Community
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground fade-in-up stagger-2 md:text-5xl">
          寄附のご案内
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground fade-in-up stagger-3">
          Minecraft サーバーの運営費を支える任意の寄附を受け付けています。Discord
          でログインし、掲示への同意を設定してください。
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="border-2 glass p-0 hover-lift">
            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">Discord ログイン</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Stripe Checkout で寄附を進める前に、Discord ログインと掲示同意の状態を確認します。
                </p>
              </div>

              {status.state === 'error' ? (
                <div className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
                  <span>{status.message}</span>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {isSignedIn ? (
                  <>
                    <div className="flex flex-1 items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-left text-sm text-muted-foreground animate-bounce-in">
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
                    size="lg"
                    onClick={login}
                    disabled={isRefreshing}
                    className="group w-full gap-2 sm:w-auto hover-glow"
                  >
                    <span className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" aria-hidden />
                      Discord でログイン
                    </span>
                    <ArrowRight
                      className="h-4 w-4 opacity-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                      aria-hidden
                    />
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                ログイン状態は 60
                分間保持されます。セッションの有効期限が切れた場合は再度ログインしてください。
              </p>
            </div>
          </Card>

          <Card className="border-2 glass p-0 hover-lift">
            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">掲示への同意</h2>
                <p className="text-sm text-muted-foreground">
                  同意した場合、Donors ページに Discord
                  の表示名を掲載します（寄附額は表示されません）。
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                <Checkbox
                  aria-label="Donors ページに表示名を掲載することに同意します"
                  checked={consent}
                  onCheckedChange={(value: boolean) => void handleConsentChange(Boolean(value))}
                  disabled={!isSignedIn || isConsentUpdating}
                  className="mt-0.5"
                />
                <div className="text-sm text-muted-foreground">
                  Donors ページに表示名を掲載することに同意します
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Discord でログインすると同意の状態を変更できます。寄附後でも撤回が可能です。
              </p>

              {consentError ? (
                <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
                  <span>{consentError}</span>
                </div>
              ) : null}
            </div>
          </Card>

          {selectedPreset ? (
            <div className="animate-bounce-in">
              <DonationImpact mode={getImpactKey(selectedPreset)} amount={selectedPreset.amount} />
            </div>
          ) : null}

          <Card className="border border-dashed glass p-0">
            <div className="space-y-5 p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-foreground">これからの流れ</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground">1.</span>
                  <span>Discord でログインし、掲示への同意を確認します。</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>寄附メニューからプランを選び、Stripe Checkout を開始します。</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>決済が完了するとサンクスページへ自動的に遷移します。</span>
                </li>
              </ol>
              <p className="text-xs text-muted-foreground">
                いただいた寄附はコミュニティ運営にのみ利用し、対価の提供は行いません。
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="space-y-6 lg:sticky lg:top-24">
            <Card className="border-2 glass-strong p-0 hover-lift">
              <div className="flex flex-col gap-6 p-6 sm:p-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-foreground">寄附メニュー</h2>
                  <p className="text-sm text-muted-foreground">
                    Stripe Checkout で寄附を行います。カード決済のみ対応し、すべて税込の金額です。
                  </p>
                </div>

                {checkoutState.error ? (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
                    <span>{checkoutState.error}</span>
                  </div>
                ) : null}

                <div className="space-y-4">
                  {presets.map((preset: CheckoutPreset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => void handleCheckout(preset)}
                      disabled={!isSignedIn || checkoutState.isProcessing}
                      className={`group w-full rounded-2xl border border-border/60 bg-background/90 px-6 py-5 text-left text-sm transition hover:border-foreground/40 hover:bg-foreground/5 hover-glow disabled:cursor-not-allowed disabled:opacity-50 ${
                        selectedPreset?.id === preset.id
                          ? 'border-foreground/50 bg-foreground/10'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-foreground">{preset.label}</p>
                          <p className="text-xs text-muted-foreground">{preset.description}</p>
                        </div>
                        <ArrowRight
                          className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1"
                          aria-hidden
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        {preset.mode === 'payment' ? (
                          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-foreground">
                            単発
                          </span>
                        ) : (
                          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-foreground">
                            {preset.interval === 'yearly' ? '年額' : '月額'}
                          </span>
                        )}
                        <span>Stripe Checkout で安全に決済します</span>
                      </div>
                    </button>
                  ))}
                </div>

                {!isSignedIn ? (
                  <p className="text-xs text-muted-foreground">
                    Discord でログインすると寄附ボタンが有効になります。
                  </p>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  寄附ボタンを押すと Stripe Checkout
                  に移動します。完了後は自動的にサンクスページへ戻ります。
                </p>

                {checkoutState.isProcessing ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                    <span>Stripe Checkout を準備しています…</span>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LogIn,
  LogOut,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DonorPill } from '@/components/donor-pill';
import { useConsentMutation } from '@/lib/ui/hooks/use-consent';
import { useDonors } from '@/lib/ui/hooks/use-donors';
import { useSession } from '@/lib/ui/hooks/use-session';

export function DonorsPage() {
  const { donors, total, isLoading, error, refresh: refreshDonors } = useDonors();
  const { status, login, logout, refresh: refreshSession } = useSession();
  const {
    updateConsent,
    isUpdating: isConsentUpdating,
    error: consentError,
  } = useConsentMutation({ onUpdated: () => void refreshSession() });

  const isSignedIn = status.state === 'signed-in';
  const consentPublic = status.state === 'signed-in' ? status.session.consentPublic : false;

  const handleRevoke = async () => {
    if (!isSignedIn) {
      return;
    }
    const confirmed = window.confirm('支援者掲載を撤回しますか？');
    if (!confirmed) {
      return;
    }
    const success = await updateConsent(false);
    if (success) {
      await refreshDonors();
    }
  };

  const handleRefresh = async () => {
    await refreshDonors();
  };

  return (
    <div className="space-y-12 page-enter">
      <section className="space-y-6 text-pretty">
        <h1 className="text-4xl font-bold tracking-tight text-foreground fade-in-up stagger-2 md:text-5xl">
          支援者の皆さま
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground fade-in-up stagger-3">
          Discord
          で掲示に同意いただいた寄付者の表示名を掲載しています。寄付額や回数は公開しておらず、純粋な支援の証として記録しています。
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="p-0">
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-foreground">掲示中の支援者</h2>
                <p className="text-sm text-muted-foreground">
                  現在 <span className="font-semibold text-foreground">{total}</span>{' '}
                  名の支援者を掲示しています。
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden />
                更新
              </Button>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 transition-glass glow-status-error">
                <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="min-h-[180px] rounded-2xl glass-sm border-gradient-subtle px-4 py-6 shadow-minimal shadow-inner-light transition-glass">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
                  <span>支援者情報を取得しています…</span>
                </div>
              ) : donors.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {donors.map((name: string) => (
                    <DonorPill key={name} name={name} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-muted-foreground">
                  <Users className="h-8 w-8" aria-hidden />
                  <p className="text-sm">まだ支援者の掲載がありません。</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              支援者情報は 60
              秒間キャッシュされます。同意の更新が反映されるまで時間がかかる場合があります。
            </p>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-1">
          <div className="space-y-6 lg:sticky lg:top-24">
            <Card className="glass-lg p-0">
              <div className="flex flex-col gap-6 p-6 sm:p-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-foreground">掲示の同意を管理</h2>
                  <p className="text-sm text-muted-foreground">
                    Discord でログイン済みの場合、支援者掲載の同意をいつでも変更できます。
                  </p>
                </div>

                {status.state === 'error' ? (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 transition-glass glow-status-error">
                    <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
                    <span>{status.message}</span>
                  </div>
                ) : null}

                {isSignedIn ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-xl glass-sm border-gradient-subtle px-4 py-3 text-left text-sm text-muted-foreground shadow-minimal shadow-inner-light transition-glass glow-status-success">
                      <CheckCircle2 className="h-5 w-5 text-foreground" aria-hidden />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">
                          現在の掲示状態
                        </span>
                        <span>{consentPublic ? '同意しています' : '同意していません'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={handleRevoke}
                        disabled={!consentPublic || isConsentUpdating}
                        className="w-full sm:w-auto"
                      >
                        <span className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" aria-hidden />
                          掲示を撤回する
                        </span>
                      </Button>
                      <Button variant="ghost" onClick={logout} className="w-full sm:w-auto">
                        <span className="flex items-center gap-2">
                          <LogOut className="h-4 w-4" aria-hidden />
                          ログアウト
                        </span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      支援者掲載の同意を管理するには Discord でログインしてください。
                    </p>
                    <Button onClick={login} size="md" className="group w-full gap-2">
                      <span className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" aria-hidden />
                        Discord でログイン
                      </span>
                    </Button>
                  </div>
                )}

                {consentError ? (
                  <div className="flex items-start gap-2 rounded-md border border-red-200/70 bg-red-50 px-3 py-2 text-sm text-red-700 transition-glass glow-status-error">
                    <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
                    <span>{consentError}</span>
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

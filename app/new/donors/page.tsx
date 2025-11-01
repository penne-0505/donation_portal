'use client';

import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DonorPill } from '@/components/donor-pill';
import { useConsentMutation } from '@/lib/ui/hooks/use-consent';
import { useDonors } from '@/lib/ui/hooks/use-donors';
import { useSession } from '@/lib/ui/hooks/use-session';

export default function DonorsPage() {
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
    const confirmed = window.confirm('Donors 掲示を撤回しますか？');
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
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">掲示中の Donors</h1>
            <p className="text-sm text-muted-foreground">
              現在 <span className="font-semibold text-foreground">{total}</span> 名の Donor
              を掲載しています。
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <span className="flex items-center gap-2">
              <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden />
              更新
            </span>
          </Button>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="min-h-[160px] rounded-2xl border border-border/60 bg-surface px-4 py-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Donors 情報を取得しています…</p>
          ) : donors.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {donors.map((name) => (
                <DonorPill key={name} name={name} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-muted-foreground">
              <Users className="h-8 w-8" aria-hidden />
              <p className="text-sm">まだ Donor がいません。</p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Donors 情報は 60
          秒間キャッシュされます。同意の更新が反映されるまで時間がかかる場合があります。
        </p>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">掲示の同意を管理</h2>
          <p className="text-sm text-muted-foreground">
            Discord でログイン済みの場合、Donors 掲載の同意をいつでも撤回できます。
          </p>
        </div>

        {isSignedIn ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-surface px-4 py-3 text-sm text-muted-foreground">
              現在の掲示状態: {consentPublic ? '同意しています' : '同意していません'}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={handleRevoke}
                disabled={!consentPublic || isConsentUpdating}
                className="sm:w-auto"
              >
                掲示を撤回する
              </Button>
              <Button variant="ghost" onClick={logout} className="sm:w-auto">
                ログアウト
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Donors 掲載の同意を管理するには Discord でログインしてください。
            </p>
            <Button onClick={login} size="md" className="w-full sm:w-auto">
              Discord でログイン
            </Button>
          </div>
        )}

        {consentError ? <p className="text-sm text-red-600">{consentError}</p> : null}
      </Card>
    </div>
  );
}

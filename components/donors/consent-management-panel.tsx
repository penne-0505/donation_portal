'use client';

import { AlertCircle, ArrowRight, CheckCircle2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { DiscordIcon } from '@/components/ui/discord-icon';
import type { SessionStatus } from '@/lib/ui/types';

export interface ConsentManagementPanelProps {
  readonly status: SessionStatus;
  readonly isSignedIn: boolean;
  readonly consentPublic: boolean;
  readonly isConsentUpdating: boolean;
  readonly consentError: string | null;
  readonly isRefreshing: boolean;
  readonly onRevoke: () => Promise<void>;
  readonly onLogin: () => void;
  readonly onLogout: () => void;
}

export function ConsentManagementPanel({
  status,
  isSignedIn,
  consentPublic,
  isConsentUpdating,
  consentError,
  isRefreshing,
  onRevoke,
  onLogin,
  onLogout,
}: ConsentManagementPanelProps) {
  return (
    <Card surface="glass" padding="lg" className="p-0">
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <SectionHeading
          heading="掲示の同意を管理"
          description="Discord でログイン済みの場合、支援者掲載の同意をいつでも変更できます。"
        />

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
                <span className="text-xs font-semibold text-foreground">現在の掲示状態</span>
                <span>{consentPublic ? '同意しています' : '同意していません'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => void onRevoke()}
                disabled={!consentPublic || isConsentUpdating}
                className="w-full sm:w-auto"
              >
                <span className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" aria-hidden />
                  掲示を撤回する
                </span>
              </Button>
              <Button
                variant="ghost"
                onClick={onLogout}
                disabled={isRefreshing}
                className="w-full sm:w-auto"
              >
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
            <Button onClick={onLogin} size="md" variant="discord" className="group w-full gap-2">
              <span className="flex items-center gap-2">
                <DiscordIcon className="h-5 w-5 text-white" aria-hidden />
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
  );
}

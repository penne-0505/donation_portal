'use client';

import { AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { DiscordIcon } from '@/components/ui/discord-icon';
import type { SessionStatus } from '@/lib/ui/types';

export interface DonateSessionPanelProps {
  readonly status: SessionStatus;
  readonly isSignedIn: boolean;
  readonly displayName: string;
  readonly onLogin: () => void;
  readonly onLogout: () => void;
  readonly isRefreshing: boolean;
}

export function DonateSessionPanel({
  status,
  isSignedIn,
  displayName,
  onLogin,
  onLogout,
  isRefreshing,
}: DonateSessionPanelProps) {
  return (
    <Card surface="glass" padding="lg" className="p-0">
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <SectionHeading
          heading="Discord ログイン"
          description="Discordで本人確認をしてから寄付フローに進みます。現在のログイン状態を確認してください。"
        />

        {status.state === 'error' ? (
          <div
            className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 transition-glass glow-status-error"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
            <span>{status.message}</span>
          </div>
        ) : null}

        {isSignedIn ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              onClick={onLogout}
              className="w-full sm:w-auto"
              disabled={isRefreshing}
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" aria-hidden />
                ログアウト
              </span>
            </Button>
          </div>
        ) : (
          <Button
            variant="discord"
            size="md"
            onClick={onLogin}
            disabled={isRefreshing}
            className="group w-full gap-2 sm:w-auto sm:shrink-0"
          >
            <span className="flex items-center gap-2">
              <DiscordIcon className="h-5 w-5 text-white" aria-hidden />
              Discord でログイン
            </span>
          </Button>
        )}
      </div>
    </Card>
  );
}

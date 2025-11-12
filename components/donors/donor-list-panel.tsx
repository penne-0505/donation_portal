'use client';

import { AlertCircle, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { DonorPill } from '@/components/donor-pill';

export interface DonorListPanelProps {
  readonly donors: readonly string[];
  readonly total: number;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onRefresh: () => Promise<void>;
}

export function DonorListPanel({
  donors,
  total,
  isLoading,
  error,
  onRefresh,
}: DonorListPanelProps) {
  return (
    <Card surface="glass" padding="lg" className="p-0">
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeading
            heading="掲示中の支援者"
            description={
              <>
                現在 <span className="font-semibold text-foreground">{total}</span>{' '}
                名の支援者を掲載しています。
              </>
            }
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => void onRefresh()}
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
              {donors.map((name) => (
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
  );
}

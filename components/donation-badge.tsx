'use client';

import { useState, useId } from 'react';
import { Lock, CheckCircle2, FileText } from 'lucide-react';

interface DonationBadgeProps {
  readonly type: 'stripe' | 'oauth' | 'list';
  readonly className?: string;
}

const badgeConfig = {
  stripe: {
    icon: Lock,
    label: 'Stripeで安全に決済',
    tooltip: 'カード情報は当サービスに保存されません',
  },
  oauth: {
    icon: CheckCircle2,
    label: 'OAuthで同意管理',
    tooltip: '同意はいつでも取り消せます',
  },
  list: {
    icon: FileText,
    label: '支援者リストを公開',
    tooltip: '同意した支援者のみ表示します',
  },
};

export function DonationBadge({ type, className = '' }: DonationBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;
  const tooltipId = useId();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={className}>
      <button
        type="button"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-white/70 border border-white/20 text-foreground hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground/30 transition-glass"
        aria-describedby={tooltipId}
        onClick={() => setShowTooltip(!showTooltip)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setShowTooltip(false);
          }
        }}
      >
        <Icon className="h-4 w-4" aria-hidden />
        <span className="font-medium">{config.label}</span>
      </button>

      {showTooltip && (
        <div
          id={tooltipId}
          role="tooltip"
          className="mt-2 p-2 rounded-lg bg-foreground/10 border border-foreground/20 text-sm text-foreground"
        >
          {config.tooltip}
        </div>
      )}
    </div>
  );
}

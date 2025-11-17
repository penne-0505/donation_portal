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
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm glass-sm border-gradient-subtle text-foreground transition-glass hover-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2"
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
          className="mt-2 rounded-lg glass-sm border-gradient-subtle p-2 text-sm text-foreground"
        >
          {config.tooltip}
        </div>
      )}
    </div>
  );
}

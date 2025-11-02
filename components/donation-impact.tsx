import { Bolt, HeartHandshake, Server } from 'lucide-react';
import { Card } from '@/components/ui/card';

const impactCopy = {
  payment: {
    icon: HeartHandshake,
    title: 'コミュニティへの参加',
    description: 'サーバー運営費の一部をまかなえます。',
  },
  monthly: {
    icon: Server,
    title: '持続的な支援',
    description: '継続的な運営費を支える力になります。',
  },
  yearly: {
    icon: Bolt,
    title: '長期的な後押し',
    description: '一年分の運営費をまとめてカバーできます。',
  },
} as const;

interface DonationImpactProps {
  readonly mode: 'payment' | 'monthly' | 'yearly';
  readonly amount: number;
}

export function DonationImpact({ mode, amount }: DonationImpactProps) {
  const copy = impactCopy[mode];
  const Icon = copy.icon;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-foreground">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{copy.title}</p>
          <p className="text-xs text-muted-foreground">{copy.description}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        選択したプラン:{' '}
        <span className="font-semibold text-foreground">¥{amount.toLocaleString()}</span>
      </p>
    </Card>
  );
}

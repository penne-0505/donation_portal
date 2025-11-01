import type { CheckoutPreset } from '@/lib/ui/types';

export const CHECKOUT_PRESETS: readonly CheckoutPreset[] = [
  {
    id: 'one-time-300',
    mode: 'payment',
    label: '単発寄附 ¥300',
    description: '少額から参加できます',
    amount: 300,
    interval: null,
    variant: 'fixed300',
  },
  {
    id: 'monthly-300',
    mode: 'subscription',
    label: '毎月の寄附 ¥300',
    description: '継続支援で安定運営に貢献',
    amount: 300,
    interval: 'monthly',
    variant: 'fixed300',
  },
  {
    id: 'yearly-3000',
    mode: 'subscription',
    label: '毎年の寄附 ¥3,000',
    description: '一年単位でまとめて寄附(毎月換算で約¥250)',
    amount: 3000,
    interval: 'yearly',
    variant: 'fixed3000',
  },
] as const;

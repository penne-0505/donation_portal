'use client';

import { useEffect, useId } from 'react';
import { DonateConsentPanel } from '@/components/donate/consent-panel';
import { DonateFlowStepsPanel } from '@/components/donate/flow-steps-panel';
import { DonatePlanSelectionPanel } from '@/components/donate/plan-selection-panel';
import { DonateSessionPanel } from '@/components/donate/session-panel';
import { useHeroContext } from '@/lib/ui/contexts/hero-context';
import { useDonationFlow } from '@/lib/ui/hooks/use-donation-flow';

export function DonatePage() {
  const { setShouldDeemphasizeButton } = useHeroContext();
  const donationFlow = useDonationFlow();
  const consentLabelId = useId();
  const consentDescriptionId = useId();
  const planHeadingId = useId();
  const planDescriptionId = useId();
  const ctaStatusId = useId();

  useEffect(() => {
    setShouldDeemphasizeButton(true);
    return () => {
      setShouldDeemphasizeButton(false);
    };
  }, [setShouldDeemphasizeButton]);

  return (
    <div className="page-enter">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="space-y-6">
          <DonateSessionPanel
            status={donationFlow.session.status}
            isSignedIn={donationFlow.isSignedIn}
            displayName={donationFlow.displayName}
            onLogin={donationFlow.session.login}
            onLogout={donationFlow.session.logout}
            isRefreshing={donationFlow.session.isRefreshing}
          />
          <DonateConsentPanel
            consentValue={donationFlow.consent.value}
            isSignedIn={donationFlow.isSignedIn}
            isUpdating={donationFlow.consent.isUpdating}
            consentError={donationFlow.consentError}
            labelId={consentLabelId}
            descriptionId={consentDescriptionId}
            onToggle={(value) => donationFlow.consent.toggle(value)}
          />
          <DonatePlanSelectionPanel
            presets={donationFlow.presets}
            selectedPreset={donationFlow.selectedPreset}
            onSelect={donationFlow.selectPreset}
            onCheckout={() => donationFlow.checkout.submit()}
            checkout={donationFlow.checkout}
            planHeadingId={planHeadingId}
            planDescriptionId={planDescriptionId}
            ctaStatusId={ctaStatusId}
          />
          <DonateFlowStepsPanel />
        </div>
      </div>
    </div>
  );
}

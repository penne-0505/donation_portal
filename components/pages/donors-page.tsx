'use client';

import { DonorListPanel } from '@/components/donors/donor-list-panel';
import { ConsentManagementPanel } from '@/components/donors/consent-management-panel';
import { useDonorDirectory } from '@/lib/ui/hooks/use-donor-directory';

export function DonorsPage() {
  const directory = useDonorDirectory();

  return (
    <div className="space-y-12 page-enter">
      <section className="space-y-6 text-pretty">
        <h1 className="text-4xl font-bold tracking-tight text-foreground fade-in-up stagger-2 md:text-5xl">
          支援者の皆さま
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground fade-in-up stagger-3">
          Discordで掲示に同意いただいた寄付者の表示名を掲載しています。寄付額や回数は公開しておらず、純粋な支援の証として記録しています。
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DonorListPanel
          donors={directory.donors}
          total={directory.total}
          isLoading={directory.isLoading}
          error={directory.donorError}
          onRefresh={directory.refreshDonors}
        />

        <div className="space-y-6 lg:col-span-1">
          <div className="space-y-6 lg:sticky lg:top-24">
            <ConsentManagementPanel
              status={directory.session.status}
              isSignedIn={directory.isSignedIn}
              consentPublic={directory.consentPublic}
              isConsentUpdating={directory.isConsentUpdating}
              consentError={directory.consentError}
              isRefreshing={directory.session.isRefreshing}
              onRevoke={directory.revokeConsent}
              onLogin={directory.login}
              onLogout={directory.logout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

declare module '../../public/donate/app.js' {
  export function initializeDonatePage(doc?: Document): Promise<void>;
  export const __test__: {
    readonly fetchSessionState: () => Promise<
      | { readonly status: 'signed-out' }
      | { readonly status: 'error' }
      | {
        readonly status: 'signed-in';
        readonly session: { readonly displayName: string; readonly consentPublic: boolean };
      }
    >;
    readonly getCheckoutTarget: (element: HTMLElement) => {
      readonly mode: string;
      readonly variant: string;
      readonly interval: string | null;
    } | null;
  };
}

declare module '../../public/donate/app.js' {
  export function initializeDonatePage(doc?: Document): void;
  export const __test__: {
    readonly base64UrlDecode: (segment: string) => string;
    readonly parseSessionCookieValue: (value: string) => {
      readonly type: string;
      readonly session: { readonly displayName: string; readonly consentPublic: boolean };
    };
    readonly resolveSession: (doc: Document) => unknown;
  };
}

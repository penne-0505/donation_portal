import { createElement, forwardRef } from 'react';
import type { AnchorHTMLAttributes, DetailedHTMLProps } from 'react';

type AnchorProps = DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;

type NextLinkProps = AnchorProps & {
  href: string | URL;
};

const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(function NextLink(
  { href, children, ...rest }: NextLinkProps,
  ref,
) {
  const normalizedHref = typeof href === 'string' ? href : String(href);
  return createElement('a', { ...rest, href: normalizedHref, ref }, children);
});

export default Link;
export { Link };

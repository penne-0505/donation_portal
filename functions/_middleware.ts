export const config = {
  compatibility_date: '2025-10-30',
  compatibility_flags: ['nodejs_compat'],
};

export const onRequest: PagesFunction = (context) => context.next();

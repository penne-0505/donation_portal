export const config = {
  compatibility_date: '2024-10-29',
  compatibility_flags: ['nodejs_compat'],
};

export const onRequest: PagesFunction = (context) => context.next();

export const onRequest: PagesFunction = async ({ request }) => {
  const target = new URL(request.url);
  target.pathname = '/donate/';

  return Response.redirect(target.toString(), 308);
};

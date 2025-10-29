import type { HealthCheckResult } from '../../src/lib/healthCheck';
import { healthCheck } from '../../src/lib/healthCheck';

export const onRequest: PagesFunction = async () => {
  const payload: HealthCheckResult = healthCheck();

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};

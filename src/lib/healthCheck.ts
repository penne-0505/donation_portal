export type HealthCheckResult = {
  service: 'donation-portal';
  status: 'ok';
  version: string;
  timestamp: Date;
};

export const healthCheck = (): HealthCheckResult => ({
  service: 'donation-portal',
  status: 'ok',
  version: process.env.npm_package_version ?? '0.1.0',
  timestamp: new Date(),
});

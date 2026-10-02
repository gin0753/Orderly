type SeedEnvironment = Record<string, string | undefined>;

export function assertDestructiveSeedAllowed(env: SeedEnvironment): void {
  const guidance =
    'Use ALLOW_DESTRUCTIVE_SEED=true only with a disposable local orderly_db or orderly_test database in development/test. Use seed:demo for an empty protected database.';
  if (
    env.NODE_ENV === 'production' ||
    env.RAILWAY_ENVIRONMENT_ID ||
    env.VERCEL
  ) {
    throw new Error(
      `Destructive seed denied: deployed/production environments are protected. ${guidance}`,
    );
  }
  if (env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error(
      `Destructive seed denied: explicit opt-in is missing. ${guidance}`,
    );
  }
  let url: URL;
  try {
    url = new URL(env.DATABASE_URL ?? '');
  } catch {
    throw new Error(
      `Destructive seed denied: invalid database configuration. ${guidance}`,
    );
  }
  if (
    ![undefined, 'development', 'test'].includes(env.NODE_ENV) ||
    !['postgresql:', 'postgres:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !['/orderly_db', '/orderly_test'].includes(url.pathname) ||
    [...url.searchParams.keys()].some((key) => key !== 'schema') ||
    (url.searchParams.has('schema') &&
      url.searchParams.get('schema') !== 'public') ||
    url.hash
  ) {
    throw new Error(
      `Destructive seed denied: target is outside the safe local database allowlist. ${guidance}`,
    );
  }
}

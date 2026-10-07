import type { createRequire } from 'node:module';
import type * as OpenIdClient from 'openid-client';

// Node 22.12+ can load openid-client's ESM package through native require.
// createRequire also bypasses Jest's per-suite module loader and its teardown.
const nativeModule = process.getBuiltinModule('module') as {
  createRequire: typeof createRequire;
};
const nodeRequire = nativeModule.createRequire(__filename);
let loaded: typeof OpenIdClient | undefined;
export function loadOpenIdClient(): Promise<typeof OpenIdClient> {
  loaded ??= nodeRequire('openid-client') as typeof OpenIdClient;
  return Promise.resolve(loaded);
}

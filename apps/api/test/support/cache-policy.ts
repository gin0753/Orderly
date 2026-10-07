/// <reference types="jest" />
import type { Response } from 'supertest';

export function expectPrivateCache(response: Response) {
  const directives = String(response.headers['cache-control'] ?? '')
    .toLowerCase()
    .split(',')
    .map((value) => value.trim());
  expect(directives).toEqual(expect.arrayContaining(['private', 'no-store']));
}

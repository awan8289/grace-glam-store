#!/usr/bin/env node
/**
 * Generates the admin credentials for `.env.local`.
 *
 *   npm run admin:password -- "your-password-here"
 *
 * Prints an ADMIN_PASSWORD_HASH (scrypt, random salt) and, when one is not
 * already present, an ADMIN_SESSION_SECRET. The plaintext password is never
 * written to disk.
 */
import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run admin:password -- "your-password"');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Choose a password of at least 6 characters.');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;

const envPath = path.join(process.cwd(), '.env.local');
const existing = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';

const hasSecret = /^ADMIN_SESSION_SECRET=.+/m.test(existing);
const secret = hasSecret ? null : randomBytes(48).toString('base64url');

let next = existing;
next = /^ADMIN_PASSWORD_HASH=/m.test(next)
  ? next.replace(/^ADMIN_PASSWORD_HASH=.*$/m, `ADMIN_PASSWORD_HASH=${hash}`)
  : `${next}${next && !next.endsWith('\n') ? '\n' : ''}ADMIN_PASSWORD_HASH=${hash}\n`;

if (secret) {
  next += `ADMIN_SESSION_SECRET=${secret}\n`;
}

writeFileSync(envPath, next, { mode: 0o600 });

console.log(`Wrote credentials to .env.local (mode 600).`);
console.log(`  ADMIN_PASSWORD_HASH  updated`);
console.log(`  ADMIN_SESSION_SECRET ${secret ? 'generated' : 'kept existing'}`);
console.log(`\nRestart the dev server for the change to take effect.`);

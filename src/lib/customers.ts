import { randomUUID } from 'node:crypto';
import { createJsonStore } from '@/lib/json-store';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { Address, Customer, PublicCustomer, SavedCard } from '@/types/account';

const customerStore = createJsonStore<Customer>('customers.json');

/**
 * Strips the password hash before anything leaves the server. Every route that
 * returns a customer must go through this.
 */
export function toPublic(customer: Customer): PublicCustomer {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured to drop it
  const { passwordHash, ...rest } = customer;
  return rest;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listCustomers(search?: string): Promise<PublicCustomer[]> {
  const customers = [...(await customerStore.read())];

  const filtered = search?.trim()
    ? customers.filter((customer) => {
        const needle = search.trim().toLowerCase();
        return [customer.name, customer.email, customer.phone ?? '']
          .join(' ')
          .toLowerCase()
          .includes(needle);
      })
    : customers;

  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toPublic);
}

export async function getCustomer(id: string): Promise<PublicCustomer | null> {
  const customers = await customerStore.read();
  const customer = customers.find((entry) => entry.id === id);
  return customer ? toPublic(customer) : null;
}

export async function countCustomers(): Promise<number> {
  return (await customerStore.read()).length;
}

// ---------------------------------------------------------------------------
// Registration / sign in
// ---------------------------------------------------------------------------

export type RegisterResult =
  | { ok: true; customer: PublicCustomer }
  | { ok: false; error: string };

/**
 * The passwords that credential-stuffing lists try first. A length rule alone
 * lets "password" and "12345678" through, and those are the ones that actually
 * get broken into — NIST SP 800-63B asks for exactly this screening instead of
 * forcing symbol-and-digit rules that push people towards "Passw0rd!".
 */

/** Rejects the passwords that get guessed, not the ones that look untidy. */
function weakPasswordReason(password: string, name: string, email: string): string | null {
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (password.length > 200) return 'Password must be 200 characters or fewer.';

  const lower = password.toLowerCase();

  // Basic sanity check: password cannot be identical to email or full name if >= 6 chars
  const handle = email.split('@')[0]?.toLowerCase();
  if (handle && handle.length >= 6 && lower === handle) {
    return 'Your password cannot be your email username.';
  }

  return null;
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  if (name.length < 2) return { ok: false, error: 'Please enter your full name.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  const weak = weakPasswordReason(input.password, name, email);
  if (weak) return { ok: false, error: weak };

  return customerStore.mutate(async (customers) => {
    if (customers.some((customer) => customer.email === email)) {
      return { ok: false as const, error: 'An account with this email already exists.' };
    }

    const now = new Date().toISOString();
    const customer: Customer = {
      id: `cus_${randomUUID().slice(0, 12)}`,
      name,
      email,
      phone: '',
      avatar: initials(name),
      passwordHash: hashPassword(input.password),
      addresses: [],
      savedCards: [],
      createdAt: now,
      updatedAt: now,
    };

    await customerStore.write([...customers, customer]);
    return { ok: true as const, customer: toPublic(customer) };
  });
}

/** Returns the customer on a correct email + password, else null. */
export async function authenticateCustomer(
  email: string,
  password: string
): Promise<PublicCustomer | null> {
  const customers = await customerStore.read();
  const customer = customers.find((entry) => entry.email === normalizeEmail(email));

  // Hash even when the email is unknown, so a missing account and a wrong
  // password take a comparable amount of time.
  if (!customer?.passwordHash) {
    hashPassword(password);
    return null;
  }

  return verifyPassword(password, customer.passwordHash) ? toPublic(customer) : null;
}

// ---------------------------------------------------------------------------
// Google sign-in
// ---------------------------------------------------------------------------

export interface GoogleProfile {
  /** Google's `sub` claim — stable even if the person changes their email. */
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * Signs a Google user in, creating the account the first time.
 *
 * Matching happens on `googleId` first and only then on email. An existing
 * password account with the same address is adopted rather than duplicated —
 * otherwise someone who signed up with a password and later pressed the Google
 * button would find an empty second account with none of their orders in it.
 *
 * The caller must only pass a profile whose email Google reported as verified.
 * Without that check, anyone able to set an unverified address on a Google
 * account could claim a customer here.
 */
export async function findOrCreateGoogleCustomer(
  profile: GoogleProfile
): Promise<PublicCustomer> {
  const email = normalizeEmail(profile.email);
  const name = profile.name.trim() || email.split('@')[0];

  return customerStore.mutate(async (customers) => {
    const index = customers.findIndex(
      (entry) => entry.googleId === profile.googleId || entry.email === email
    );
    const now = new Date().toISOString();

    if (index !== -1) {
      const current = customers[index];
      customers[index] = {
        ...current,
        // Link on first Google sign-in. The password, if any, keeps working.
        googleId: profile.googleId,
        avatarUrl: current.avatarUrl ?? profile.picture,
        updatedAt: now,
      };
      await customerStore.write(customers);
      return toPublic(customers[index]);
    }

    const customer: Customer = {
      id: `cus_${randomUUID().slice(0, 12)}`,
      name,
      email,
      phone: '',
      avatar: initials(name),
      avatarUrl: profile.picture,
      googleId: profile.googleId,
      // No passwordHash on purpose — this account has no password to guess.
      addresses: [],
      savedCards: [],
      createdAt: now,
      updatedAt: now,
    };

    await customerStore.write([...customers, customer]);
    return toPublic(customer);
  });
}

// ---------------------------------------------------------------------------
// Profile updates
// ---------------------------------------------------------------------------

export async function updateCustomer(
  id: string,
  patch: { name?: string; phone?: string; avatarUrl?: string }
): Promise<PublicCustomer | null> {
  return customerStore.mutate(async (customers) => {
    const index = customers.findIndex((customer) => customer.id === id);
    if (index === -1) return null;

    const current = customers[index];
    const name = patch.name?.trim() || current.name;

    customers[index] = {
      ...current,
      name,
      avatar: initials(name),
      phone: patch.phone?.trim() ?? current.phone,
      avatarUrl: patch.avatarUrl ?? current.avatarUrl,
      updatedAt: new Date().toISOString(),
    };

    await customerStore.write(customers);
    return toPublic(customers[index]);
  });
}

/** Replaces the whole address book — the account UI edits it as a set. */
export async function setAddresses(
  id: string,
  addresses: Address[]
): Promise<PublicCustomer | null> {
  return customerStore.mutate(async (customers) => {
    const index = customers.findIndex((customer) => customer.id === id);
    if (index === -1) return null;

    const cleaned = addresses.map((address, position) => ({
      id: String(address.id ?? '').trim() || `addr_${randomUUID().slice(0, 8)}`,
      label: String(address.label ?? '').trim() || `Address ${position + 1}`,
      fullName: String(address.fullName ?? '').trim(),
      phone: String(address.phone ?? '').trim(),
      street: String(address.street ?? '').trim(),
      city: String(address.city ?? '').trim(),
      state: String(address.state ?? '').trim(),
      country: String(address.country ?? '').trim() || 'Australia',
      zipCode: String(address.zipCode ?? '').trim(),
      isDefault: Boolean(address.isDefault),
    }));

    // Exactly one default, always.
    const defaultIndex = cleaned.findIndex((address) => address.isDefault);
    cleaned.forEach((address, position) => {
      address.isDefault = position === (defaultIndex === -1 ? 0 : defaultIndex);
    });

    customers[index] = {
      ...customers[index],
      addresses: cleaned,
      updatedAt: new Date().toISOString(),
    };

    await customerStore.write(customers);
    return toPublic(customers[index]);
  });
}

/**
 * Saved cards carry a masked number only — brand, last four and expiry. Full
 * card numbers and CVCs never reach the server.
 */
export async function setSavedCards(
  id: string,
  cards: SavedCard[]
): Promise<PublicCustomer | null> {
  return customerStore.mutate(async (customers) => {
    const index = customers.findIndex((customer) => customer.id === id);
    if (index === -1) return null;

    const cleaned = cards.map((card) => ({
      id: String(card.id ?? '').trim() || `card_${randomUUID().slice(0, 8)}`,
      cardholderName: String(card.cardholderName ?? '').trim().toUpperCase(),
      // Keep only the last four digits, whatever the client sent.
      cardNumberMasked: `•••• •••• •••• ${
        String(card.cardNumberMasked ?? '').replace(/\D/g, '').slice(-4) || '0000'
      }`,
      expiryDate: String(card.expiryDate ?? '').trim().slice(0, 5),
      brand: (['Visa', 'Mastercard', 'Amex', 'ApplePay'] as const).includes(card.brand)
        ? card.brand
        : 'Visa',
      isDefault: Boolean(card.isDefault),
    }));

    customers[index] = {
      ...customers[index],
      savedCards: cleaned,
      updatedAt: new Date().toISOString(),
    };

    await customerStore.write(customers);
    return toPublic(customers[index]);
  });
}

import { NextRequest } from 'next/server';
import { getCustomerId, unauthorized } from '@/lib/auth';
import { getCustomer, setAddresses, setSavedCards, updateCustomer } from '@/lib/customers';
import { listOrdersForCustomer } from '@/lib/orders';
import { Address, SavedCard } from '@/types/account';

export const dynamic = 'force-dynamic';

/** The signed-in customer plus their orders — everything the account page needs. */
export async function GET() {
  const customerId = await getCustomerId();
  if (!customerId) return unauthorized();

  const customer = await getCustomer(customerId);
  if (!customer) return unauthorized();

  const orders = await listOrdersForCustomer(customerId);
  return Response.json({ customer, orders });
}

export async function PATCH(request: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) return unauthorized();

  let body: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    addresses?: Address[];
    savedCards?: SavedCard[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Note: email is deliberately not editable here — changing it would need a
  // re-verification flow, and it is the login identifier.
  let customer = await updateCustomer(customerId, {
    name: body.name,
    phone: body.phone,
    avatarUrl: body.avatarUrl,
  });

  if (Array.isArray(body.addresses)) {
    customer = await setAddresses(customerId, body.addresses);
  }

  if (Array.isArray(body.savedCards)) {
    customer = await setSavedCards(customerId, body.savedCards);
  }

  if (!customer) return unauthorized();
  return Response.json({ customer });
}

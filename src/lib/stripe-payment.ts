import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

/**
 * What the admin needs to know about how an order was paid — never the card
 * number itself. Stripe holds the card; we only ever see brand + last four.
 */
export interface PaymentSummary {
  paymentIntentId: string;
  /** e.g. "Visa", "Mastercard" */
  brand: string | null;
  last4: string | null;
  expiry: string | null;
  /** apple_pay / google_pay / link when paid with a wallet */
  wallet: string | null;
  country: string | null;
  /** AUD actually captured. */
  paid: number;
  /** AUD already refunded (from Stripe, so it includes refunds made in the Stripe dashboard). */
  refunded: number;
  dashboardUrl: string;
  livemode: boolean;
}

const BRAND_NAMES: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  diners: 'Diners Club',
  eftpos_au: 'eftpos',
};

export async function getPaymentSummary(paymentIntentId: string): Promise<PaymentSummary | null> {
  try {
    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    });
    const charge = intent.latest_charge as Stripe.Charge | null;
    const card = charge?.payment_method_details?.card;
    return {
      paymentIntentId: intent.id,
      brand: card?.brand ? BRAND_NAMES[card.brand] ?? card.brand : null,
      last4: card?.last4 ?? null,
      expiry: card?.exp_month && card?.exp_year ? `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}` : null,
      wallet: card?.wallet?.type ?? (charge?.payment_method_details?.type === 'link' ? 'link' : null),
      country: card?.country ?? null,
      paid: (intent.amount_received ?? 0) / 100,
      refunded: (charge?.amount_refunded ?? 0) / 100,
      dashboardUrl: `https://dashboard.stripe.com/${intent.livemode ? '' : 'test/'}payments/${intent.id}`,
      livemode: intent.livemode,
    };
  } catch (error) {
    console.error('[stripe] Could not load payment', paymentIntentId, error);
    return null;
  }
}

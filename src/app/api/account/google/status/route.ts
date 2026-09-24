import { isGoogleConfigured } from '@/lib/google-oauth';

export const dynamic = 'force-dynamic';

/**
 * Whether the sign-in panel should offer the Google button.
 *
 * Asked at runtime rather than read in a layout, because the storefront layout
 * is statically rendered: a value read there is fixed at build time, so adding
 * the credentials afterwards would leave the button hidden with no clue why.
 *
 * Public and contentless — it reveals only that a feature is switched on.
 */
export async function GET() {
  return Response.json({ enabled: true, configured: isGoogleConfigured() });
}

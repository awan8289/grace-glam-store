/**
 * CJ Dropshipping API integration.
 *
 * Pushes paid orders to CJ (createOrderV2). Personalisation travels with each
 * line:
 *   - customer photo  → `podProperties` (CJ print-on-demand artwork link) AND
 *                        the line/order remark, so it is visible to CJ staff
 *                        even on products that are not set up as POD
 *   - custom text      → the remark
 *
 * Docs: https://developers.cjdropshipping.com/en/api/api2/api/shopping.html
 */
import { Order, OrderItem } from "@/types/account";
import { getProduct } from "@/lib/products";

const CJ_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";
let _cachedToken: { token: string; expiresAt: number } | null = null;

export async function getCjAccessToken(): Promise<string | null> {
  const email = process.env.CJ_API_EMAIL;
  const apiKey = process.env.CJ_API_KEY;
  if (!email || !apiKey) return null;

  const now = Date.now();
  if (_cachedToken && _cachedToken.expiresAt > now + 300_000) return _cachedToken.token;

  try {
    const res = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, apiKey }),
    });
    const data = await res.json();
    if (data?.result && data?.data?.accessToken) {
      _cachedToken = { token: data.data.accessToken, expiresAt: now + 14 * 86_400_000 };
      return _cachedToken.token;
    }
    console.error("[CJ] Token request rejected:", data?.message ?? res.status);
    return null;
  } catch (err) {
    console.error("[CJ] Token request failed:", err);
    return null;
  }
}

/**
 * Turns a stored photo URL into one CJ's servers can download. Firebase
 * Storage download URLs are already absolute; local `/uploads/...` paths only
 * work once prefixed with the public site URL (and only while that file
 * survives — set FIREBASE_STORAGE_BUCKET in production).
 */
function absolutePhotoUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https:\/\//.test(url)) return url;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return site ? `${site}${url}` : undefined;
}

function lineRemark(item: OrderItem, photo?: string): string {
  const parts: string[] = [];
  if (photo) parts.push(`CUSTOMER PHOTO: ${photo}`);
  if (item.customText) parts.push(`CUSTOM TEXT: "${item.customText}"`);
  if (item.secondaryCustomText) parts.push(`2ND TEXT: "${item.secondaryCustomText}"`);
  if (item.chainLength) parts.push(`CHAIN: ${item.chainLength}`);
  return parts.join(" | ");
}

async function toCjProduct(item: OrderItem, index: number, orderId: string) {
  const product = await getProduct(item.productId);
  const variant = product?.variants.find((v) => v.id === item.variantId);
  // Our variant ids (v-p1-60x75) are local; CJ identifies variants by its SKU.
  const sku = variant?.sku || product?.sku;
  const photo = absolutePhotoUrl(item.customImage);

  return {
    line: {
      ...(sku ? { sku } : {}),
      quantity: item.quantity,
      storeLineItemId: `${orderId}-${index + 1}`,
      storeProductId: item.productId,
      storeProductName: item.name.slice(0, 200),
      variantOptions: [item.color, item.size].filter(Boolean).join(" / "),
      unitPrice: item.unitPrice,
      ...(photo ? { podProperties: JSON.stringify([{ links: [photo], effectImgs: [photo] }]) } : {}),
    },
    remark: lineRemark(item, photo),
    missingSku: !sku,
    photoUnreachable: Boolean(item.customImage) && !photo,
  };
}

export async function pushOrderToCjDropshipping(order: Order, customText?: string): Promise<boolean> {
  const mapped = await Promise.all(order.items.map((item, i) => toCjProduct(item, i, order.id)));

  const problems = [
    ...mapped.filter((m) => m.missingSku).map((m) => `no CJ SKU for "${m.line.storeProductName}"`),
    ...mapped.filter((m) => m.photoUnreachable).map(() => "customer photo has no public URL (set NEXT_PUBLIC_SITE_URL / FIREBASE_STORAGE_BUCKET)"),
  ];

  const lineRemarks = mapped
    .map((m, i) => (m.remark ? `#${i + 1} ${m.line.storeProductName}: ${m.remark}` : ""))
    .filter(Boolean);
  const fallbackText = customText || order.customText;
  const remark = [order.id, ...(lineRemarks.length ? lineRemarks : fallbackText ? [`CUSTOM TEXT: "${fallbackText}"`] : [])]
    .join(" || ")
    .slice(0, 500);

  const token = await getCjAccessToken();
  if (!token) {
    console.log(`[CJ - not configured] Order ${order.id} not sent. Remark would be: ${remark}`);
    return false;
  }
  if (problems.length) {
    console.error(`[CJ] Order ${order.id} NOT sent — fix and push by hand: ${problems.join("; ")}`);
    return false;
  }

  const d = order.shippingDetails;
  const body = {
    orderNumber: order.id,
    shippingCountry: "Australia",
    shippingCountryCode: "AU",
    shippingProvince: d?.state || "",
    shippingCity: d?.city || "",
    shippingAddress: d?.street || order.shippingAddress,
    shippingZip: d?.zipCode || "",
    shippingCustomerName: d?.fullName || order.customerName,
    shippingPhone: d?.phone || "",
    email: order.customerEmail,
    remark,
    fromCountryCode: "CN",
    logisticName: process.env.CJ_LOGISTIC_NAME || "CJPacket Super Pure Electricity",
    // 3 = create the order only. CJ does not charge your balance until you
    // confirm it in the CJ dashboard — so you can check the photo/text first.
    payType: 3,
    shopAmount: order.subtotal,
    products: mapped.map((m) => m.line),
  };

  try {
    const response = await fetch(`${CJ_BASE_URL}/shopping/order/createOrderV2`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.result) {
      console.error(`[CJ] Order ${order.id} rejected:`, result?.code, result?.message ?? response.status);
      return false;
    }
    console.log(`[CJ] Order ${order.id} created in CJ as ${result.data?.orderId ?? "?"}`);
    return true;
  } catch (err) {
    console.error(`[CJ] Order ${order.id} push failed:`, err);
    return false;
  }
}

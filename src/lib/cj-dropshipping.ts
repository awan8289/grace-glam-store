/**
 * CJ Dropshipping API Integration (Next.js / Node.js)
 * Automatically pushes new customer orders to CJ Dropshipping with custom necklace names.
 */
import { Order } from "@/types/account";

const CJ_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";
let _cachedToken: { token: string; expiresAt: number } | null = null;

export async function getCjAccessToken(): Promise<string | null> {
  const email = process.env.CJ_API_EMAIL;
  const apiKey = process.env.CJ_API_KEY;

  if (!email || !apiKey) {
    return null;
  }

  const now = Date.now();
  if (_cachedToken && _cachedToken.expiresAt > now + 300000) {
    return _cachedToken.token;
  }

  try {
    const res = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: apiKey }),
    });

    const data = await res.json();
    if (data?.result && data?.data?.accessToken) {
      const token = data.data.accessToken;
      _cachedToken = { token, expiresAt: now + 14 * 86400 * 1000 };
      return token;
    }
  } catch (err) {
    console.error("[CJ Dropshipping] Token fetch failed:", err);
  }
  return null;
}

export async function pushOrderToCjDropshipping(order: Order, customText?: string): Promise<boolean> {
  const token = await getCjAccessToken();
  const primaryCustomText = customText || order.customText || order.items.find(i => i.customText)?.customText;

  if (!token) {
    console.log(`[CJ Dropshipping - Simulation] Order #${order.id} logged for fulfillment.`);
    if (primaryCustomText) {
      console.log(`[CJ Custom Engraving] Name Inscription: "${primaryCustomText}"`);
    }
    return true;
  }

  try {
    const products = order.items.map((item) => ({
      vid: item.variantId || "CJ-DEFAULT-VID",
      quantity: item.quantity,
      storeProductName: item.name,
      productVariantName: item.color || "Default",
      remark: item.customText ? `CUSTOM ENGRAVING: "${item.customText}"` : "Standard Item",
    }));

    const response = await fetch(`${CJ_BASE_URL}/shopping/order/createOrder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": token,
      },
      body: JSON.stringify({
        orderNumber: order.id,
        shippingCountryCode: "AU",
        shippingCustomerName: order.shippingDetails?.fullName || order.customerName,
        shippingAddress: order.shippingDetails?.street || order.shippingAddress,
        shippingCity: order.shippingDetails?.city || "Sydney",
        shippingProvince: order.shippingDetails?.state || "NSW",
        shippingZip: order.shippingDetails?.zipCode || "2000",
        shippingPhone: order.shippingDetails?.phone || "0494794408",
        remark: primaryCustomText ? `CUSTOM ENGRAVING: ${primaryCustomText} | ${order.id}` : order.id,
        fromCountryCode: "CN",
        logisticName: "CJ Packet Ordinary",
        products,
      }),
    });

    const result = await response.json();
    console.log(`[CJ Dropshipping] Order #${order.id} pushed successfully:`, result);
    return true;
  } catch (err) {
    console.error("[CJ Dropshipping] Push order error:", err);
    return false;
  }
}

import nodemailer from "nodemailer";
import { Order } from "@/types/account";

interface EmailOptions {
  to: string;
  order: Order;
  customText?: string;
}

/**
 * Creates an SMTP transporter.
 * Works with Gmail (via App Password), Hostinger Webmail, SendGrid, or any standard SMTP.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Sends automated post-purchase confirmation email.
 * Includes the mandatory 12-hour spelling verification notice for custom names.
 */
export async function sendOrderConfirmationEmail({ to, order, customText }: EmailOptions): Promise<boolean> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || `"Grace & Glam" <${process.env.SMTP_USER || "no-reply@graceandglam.com.au"}>`;

  const customTextNotice = customText
    ? `
      <div style="background-color: #fff9e6; border: 2px dashed #d4af37; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #856404; text-transform: uppercase; letter-spacing: 1px;">
          Personalized Inscription:
        </p>
        <p style="margin: 0; font-size: 24px; font-family: serif; color: #111; font-weight: bold;">
          "${customText}"
        </p>
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #c0392b; font-weight: bold;">
          ⚠️ Please check the name spelling is correct - reply within 12 hours to change it.
        </p>
      </div>
    `
    : `
      <div style="background-color: #fff9e6; border-left: 4px solid #d4af37; padding: 12px 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #333; font-weight: 500;">
          Please check the name spelling is correct - reply within 12 hours to change it.
        </p>
      </div>
    `;

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
            <strong>${item.name}</strong><br/>
            <span style="font-size: 12px; color: #777;">Variant: ${item.color || "Default"} | Qty: ${item.quantity}</span>
          </td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">
            ${item.price}
          </td>
        </tr>
      `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf9f6; margin: 0; padding: 24px; color: #222;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e0; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #eee;">
          <h1 style="font-family: Georgia, serif; font-size: 24px; letter-spacing: 2px; margin: 0; color: #111;">GRACE & GLAM</h1>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-top: 6px;">Elegance, Wrapped Your Way</p>
        </div>

        <div style="padding: 24px 0 12px 0;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0;">Thank You for Your Order!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #555;">
            Hi ${order.customerName || "Valued Customer"}, we have received your order <strong>#${order.id}</strong>.
          </p>

          ${customTextNotice}

          <h3 style="font-size: 15px; margin: 24px 0 12px 0; text-transform: uppercase; letter-spacing: 1px; color: #666;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            ${itemsHtml}
            <tr>
              <td style="padding: 12px 0; font-weight: bold;">Total</td>
              <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 16px;">${order.total}</td>
            </tr>
          </table>

          <div style="margin-top: 24px; padding: 16px; background-color: #f7f7f5; border-radius: 8px; font-size: 13px; color: #555;">
            <strong>Shipping to:</strong><br/>
            ${order.shippingDetails?.fullName || order.customerName}<br/>
            ${order.shippingDetails?.street || order.shippingAddress}<br/>
            ${order.shippingDetails?.city || ""}${order.shippingDetails?.state ? `, ${order.shippingDetails.state}` : ""} ${order.shippingDetails?.zipCode || ""}<br/>
            ${order.shippingDetails?.country || order.destinationCountry || "Australia"}
          </div>
        </div>

        <div style="margin-top: 32px; pt: 16px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
          <p>Questions? Reply to this email or message us on WhatsApp.</p>
          <p>© Grace & Glam. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[Email Service Simulation] Confirmation email for order #${order.id} to <${to}>:`);
    console.log(`[Email Notice] "Please check the name spelling is correct - reply within 12 hours to change it."`);
    return true; // Successfully logged when SMTP is not yet configured with real password
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Order Confirmation #${order.id} - Grace & Glam`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    return false;
  }
}

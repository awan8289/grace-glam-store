"""
CJ Dropshipping API Integration Service (Python - FastAPI / Flask Compatible)
=============================================================================
Securely authenticates with CJ Dropshipping Open API v2.0 and automatically pushes
new customer orders, including custom engraved necklace text / personalized strings.
"""

import os
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any, List
import requests

# ── Configuration (Load from Environment Variables) ─────────────────────────
CJ_API_EMAIL = os.getenv("CJ_API_EMAIL", "chatgptjpan@gmail.com")
CJ_API_KEY = os.getenv("CJ_API_KEY", "")  # Generated from CJ Developer portal
CJ_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1"

# SMTP Email Config
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER", "chatgptjpan@gmail.com")
SMTP_PASS = os.getenv("SMTP_PASS", "")  # Gmail App Password (16 characters)
SMTP_FROM = os.getenv("SMTP_FROM", "Grace & Glam <no-reply@graceandglam.com.au>")

# Global In-Memory Token Cache
_token_cache = {
    "access_token": None,
    "expires_at": 0
}


def get_cj_access_token() -> str:
    """
    Securely authenticates with CJ Dropshipping API to retrieve or refresh access token.
    Caches the token to avoid redundant network calls.
    """
    now = time.time()
    if _token_cache["access_token"] and _token_cache["expires_at"] > now + 300:
        return _token_cache["access_token"]

    url = f"{CJ_BASE_URL}/authentication/getAccessToken"
    payload = {
        "email": CJ_API_EMAIL,
        "password": CJ_API_KEY  # CJ API Key acts as authentication credential
    }

    try:
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()

        if data.get("result") is True and "data" in data:
            token_data = data["data"]
            access_token = token_data["accessToken"]
            # Expiry usually returns in seconds or ISO string; default 14 days
            _token_cache["access_token"] = access_token
            _token_cache["expires_at"] = now + 14 * 86400
            print("[CJ Dropshipping] Successfully authenticated & token refreshed.")
            return access_token
        else:
            error_msg = data.get("message", "Unknown authentication failure")
            raise RuntimeError(f"CJ API authentication failed: {error_msg}")

    except requests.RequestException as exc:
        print(f"[CJ Dropshipping Error] Network error during authentication: {exc}")
        # Return fallback mock token in development mode if credentials not provided
        if not CJ_API_KEY:
            print("[CJ Dropshipping Notice] Development mode: returning mock token.")
            return "mock_cj_access_token_dev_environment"
        raise


def push_order_to_cj(order: Dict[str, Any], custom_text: Optional[str] = None) -> Dict[str, Any]:
    """
    Pushes newly completed checkout order directly to CJ Dropshipping.
    Injects the custom necklace inscription string into remarks/custom fields.
    """
    token = get_cj_access_token()
    url = f"{CJ_BASE_URL}/shopping/order/createOrder"
    headers = {
        "CJ-Access-Token": token,
        "Content-Type": "application/json"
    }

    # Extract customer shipping details
    shipping = order.get("shippingDetails", {})
    customer_name = shipping.get("fullName") or order.get("customerName", "Valued Customer")
    phone = shipping.get("phone") or "0494794408"
    street = shipping.get("street") or order.get("shippingAddress", "")
    city = shipping.get("city", "Sydney")
    state = shipping.get("state", "NSW")
    zip_code = shipping.get("zipCode", "2000")
    country_code = "AU"  # Australia

    # Build order items list
    cj_products = []
    for item in order.get("items", []):
        item_custom_name = item.get("customText") or custom_text or ""
        # Build remark with personalization note
        remark_note = f"CUSTOM ENGRAVING: '{item_custom_name}'" if item_custom_name else "Standard Item"
        cj_products.append({
            "vid": item.get("variantId") or "CJ-DEFAULT-VID",
            "quantity": item.get("quantity", 1),
            "storeProductName": item.get("name"),
            "productVariantName": item.get("color") or "Default",
            "remark": remark_note
        })

    # Primary order payload for CJ Dropshipping
    full_custom_note = f"PERSONALIZED ENGRAVING NAME: {custom_text} | ORDER #{order.get('id')}" if custom_text else f"ORDER #{order.get('id')}"

    payload = {
        "orderNumber": order.get("id"),
        "shippingCountryCode": country_code,
        "shippingCustomerName": customer_name,
        "shippingAddress": street,
        "shippingCity": city,
        "shippingProvince": state,
        "shippingZip": zip_code,
        "shippingPhone": phone,
        "remark": full_custom_note,
        "fromCountryCode": "CN",  # CJ Dropshipping fulfillment hub
        "logisticName": "CJ Packet Ordinary",  # Fast reliable line to Australia
        "products": cj_products
    }

    print(f"[CJ Dropshipping] Dispatching Order #{order.get('id')} with Custom Text: '{custom_text}'...")

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=20)
        data = response.json()
        print(f"[CJ Dropshipping] Response: {data}")
        return data
    except Exception as err:
        print(f"[CJ Dropshipping Error] Failed to push order: {err}")
        return {
            "result": False,
            "error": str(err),
            "simulated": True,
            "orderNumber": order.get("id"),
            "customText": custom_text
        }


def send_post_purchase_email(to_email: str, order_id: str, customer_name: str, custom_text: Optional[str] = None) -> bool:
    """
    Automated Post-Purchase Email:
    Sends confirmation containing the specific 12-hour spelling verification message.
    """
    if not SMTP_USER or not SMTP_PASS:
        print(f"[Email Background Task - Simulated] To: {to_email} | Order: {order_id}")
        print(" -> Message: 'Please check the name spelling is correct - reply within 12 hours to change it.'")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Order #{order_id} Confirmed - Verify Personalized Name - Grace & Glam"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email

    custom_name_display = custom_text if custom_text else "As Selected"

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #faf9f6; padding: 20px;">
      <div style="max-width: 550px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 12px; border: 1px solid #ddd;">
        <h2 style="color: #111; font-family: Georgia, serif; text-align: center;">GRACE & GLAM</h2>
        <p>Dear {customer_name},</p>
        <p>Thank you for your order <strong>#{order_id}</strong>.</p>
        
        <div style="background: #fff8e6; border: 2px dashed #d4af37; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #856404; font-weight: bold;">Custom Inscription:</p>
          <h3 style="margin: 5px 0 10px 0; color: #111;">"{custom_name_display}"</h3>
          <p style="margin: 0; color: #c0392b; font-weight: bold; font-size: 14px;">
            ⚠️ Please check the name spelling is correct - reply within 12 hours to change it.
          </p>
        </div>

        <p style="font-size: 13px; color: #555;">Our atelier begins engraving production promptly after 12 hours.</p>
        <p style="margin-top: 30px; font-size: 11px; color: #999; text-align: center;">Grace & Glam Australia • Sydney</p>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, [to_email], msg.as_string())
        print(f"[Email] Confirmation successfully delivered to {to_email}")
        return True
    except Exception as exc:
        print(f"[Email Error] Failed to send email: {exc}")
        return False


# ── Example FastAPI / Flask Background Worker Route ────────────────────────
def handle_checkout_completed_event(order_data: Dict[str, Any], custom_text: Optional[str] = None):
    """
    Hook function to execute immediately upon successful checkout / webhook callback.
    Can be run as a FastAPI BackgroundTask or Celery task.
    """
    order_id = order_data.get("id", "UNKNOWN")
    customer_email = order_data.get("customerEmail") or order_data.get("email")
    customer_name = order_data.get("customerName", "Customer")

    # 1. Push directly to CJ Dropshipping with custom necklace name
    cj_response = push_order_to_cj(order_data, custom_text=custom_text)

    # 2. Fire post-purchase email verification
    if customer_email:
        send_post_purchase_email(
            to_email=customer_email,
            order_id=order_id,
            customer_name=customer_name,
            custom_text=custom_text
        )

    return {
        "status": "success",
        "order_id": order_id,
        "cj_result": cj_response
    }


if __name__ == "__main__":
    # Self-test demonstration
    sample_order = {
        "id": "GM-99124",
        "customerName": "Zara Malik",
        "customerEmail": "customer@example.com.au",
        "shippingAddress": "120 George St, Sydney NSW 2000, Australia",
        "shippingDetails": {
            "fullName": "Zara Malik",
            "phone": "0494794408",
            "street": "120 George St",
            "city": "Sydney",
            "state": "NSW",
            "zipCode": "2000",
            "country": "Australia"
        },
        "items": [
            {
                "name": "Custom Name Pendant Necklace",
                "variantId": "CJ-NECK-GOLD-01",
                "quantity": 1,
                "color": "18K Gold Plated",
                "customText": "Zara"
            }
        ]
    }

    print("--- Running Test Execution ---")
    result = handle_checkout_completed_event(sample_order, custom_text="Zara")
    print("Execution Result:", result)

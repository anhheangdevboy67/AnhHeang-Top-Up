// ABA PayWay integration.
// Spec: PayWay "Purchase API" — POST /api/payment-gateway/v1/payments/purchase
// Docs: https://developer.payway.com.kh/  (register a sandbox account to get
// ABA_MERCHANT_ID / ABA_API_KEY — these are NOT something I can generate for you)

const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');

const {
  ABA_MERCHANT_ID,
  ABA_API_KEY,
  ABA_BASE_URL,
  PUBLIC_BASE_URL,
} = process.env;

function reqTimeNow() {
  // YYYYMMDDHHmmss in UTC, as required by PayWay
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

/**
 * Builds the HMAC-SHA512 hash PayWay requires.
 * Field concatenation order is FIXED by PayWay's spec and does not match the
 * table order of the request params — see 01-purchase.md "Hash Generation".
 * Every field in this order must be included (empty string if unused).
 */
function buildHash(fields) {
  const {
    req_time = '',
    merchant_id = '',
    tran_id = '',
    amount = '',
    items = '',
    shipping = '',
    firstname = '',
    lastname = '',
    email = '',
    phone = '',
    type = '',
    payment_option = '',
    return_url = '',
    cancel_url = '',
    continue_success_url = '',
    return_deeplink = '',
    currency = '',
    custom_fields = '',
    return_params = '',
    payout = '',
    lifetime = '',
    additional_params = '',
    google_pay_token = '',
    skip_success_page = '',
  } = fields;

  const toHash =
    req_time + merchant_id + tran_id + amount + items + shipping +
    firstname + lastname + email + phone + type + payment_option +
    return_url + cancel_url + continue_success_url + return_deeplink +
    currency + custom_fields + return_params + payout + lifetime +
    additional_params + google_pay_token + skip_success_page;

  return crypto.createHmac('sha512', ABA_API_KEY).update(toHash).digest('base64');
}

/**
 * Creates a KHQR purchase transaction and returns the QR payload the
 * customer scans (qr_string / checkout_qr_url / abapay_deeplink).
 *
 * @param {object} p
 * @param {string} p.tranId       unique order/transaction id (max 20 chars)
 * @param {number} p.amount       amount in `currency`, e.g. 7.00
 * @param {string} p.currency     'USD' or 'KHR'
 * @param {string} p.itemName     human-readable description for PayWay's dashboard
 */
async function createKhqrPurchase({ tranId, amount, currency = 'USD', itemName }) {
  if (!ABA_MERCHANT_ID || !ABA_API_KEY) {
    throw new Error(
      'ABA_MERCHANT_ID / ABA_API_KEY are not set. Register a sandbox account at ' +
      'https://developer.payway.com.kh/ and put the credentials in your .env file.'
    );
  }

  const req_time = reqTimeNow();
  const amountStr = amount.toFixed(2);
  const items = Buffer.from(
    JSON.stringify([{ name: itemName, quantity: 1, price: amount }])
  ).toString('base64');

  const fields = {
    req_time,
    merchant_id: ABA_MERCHANT_ID,
    tran_id: tranId,
    amount: amountStr,
    items,
    shipping: '0',
    payment_option: 'abapay_khqr_deeplink',
    currency,
    return_url: Buffer.from(`${PUBLIC_BASE_URL}/api/webhooks/payway`).toString('base64'),
    cancel_url: `${PUBLIC_BASE_URL}/api/orders/${tranId}/cancelled`,
    lifetime: '15', // minutes — QR expires if unpaid
  };

  const hash = buildHash(fields);

  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => form.append(k, v));
  form.append('hash', hash);

  const url = `${ABA_BASE_URL}/api/payment-gateway/v1/payments/purchase`;
  const { data } = await axios.post(url, form, {
    headers: form.getHeaders(),
    timeout: 15000,
  });

  return data; // { status: {code, message, tran_id}, qr_string, abapay_deeplink, checkout_qr_url }
}

module.exports = { createKhqrPurchase, buildHash, reqTimeNow };

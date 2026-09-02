/**
 * PayU India 0% MDR UPI Technical Utilities
 * Handles PayU SHA-512 hash calculation, reverse signature validation, and UPI Intent URLs.
 */

// Simple SHA-512 browser-compatible & Node-compatible utility using SubtleCrypto
export async function computeSha512(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface PayUHashParams {
  key: string;
  txnid: string;
  amount: string | number;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string; // theater_id
  udf2?: string; // screen_number
  udf3?: string; // seat_location
  udf4?: string; // delivery_mode
  udf5?: string; // token_number
  salt: string;
}

/**
 * PayU Forward Hash Formula:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
export async function generatePayUHash(params: PayUHashParams): Promise<string> {
  const formattedAmount = Number(params.amount).toFixed(2);
  const hashString = [
    params.key,
    params.txnid,
    formattedAmount,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 || '',
    params.udf2 || '',
    params.udf3 || '',
    params.udf4 || '',
    params.udf5 || '',
    '', // udf6
    '', // udf7
    '', // udf8
    '', // udf9
    '', // udf10
    params.salt,
  ].join('|');

  return await computeSha512(hashString);
}

/**
 * PayU Reverse Hash Verification Formula:
 * sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * (or with additionalCharges if applied)
 */
export async function verifyPayUReverseHash(
  payload: {
    key: string;
    txnid: string;
    amount: string | number;
    productinfo: string;
    firstname: string;
    email: string;
    status: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
    additionalCharges?: string;
    hash: string;
  },
  salt: string
): Promise<boolean> {
  const formattedAmount = Number(payload.amount).toFixed(2);
  
  let reverseString: string;
  if (payload.additionalCharges) {
    reverseString = [
      payload.additionalCharges,
      salt,
      payload.status,
      '',
      '',
      '',
      '',
      '',
      payload.udf5 || '',
      payload.udf4 || '',
      payload.udf3 || '',
      payload.udf2 || '',
      payload.udf1 || '',
      payload.email,
      payload.firstname,
      payload.productinfo,
      formattedAmount,
      payload.txnid,
      payload.key,
    ].join('|');
  } else {
    reverseString = [
      salt,
      payload.status,
      '',
      '',
      '',
      '',
      '',
      payload.udf5 || '',
      payload.udf4 || '',
      payload.udf3 || '',
      payload.udf2 || '',
      payload.udf1 || '',
      payload.email,
      payload.firstname,
      payload.productinfo,
      formattedAmount,
      payload.txnid,
      payload.key,
    ].join('|');
  }

  const computedHash = await computeSha512(reverseString);
  return computedHash.toLowerCase() === (payload.hash || '').toLowerCase();
}

/**
 * Standard NPCI UPI Intent Link Generator
 * Generates direct UPI deep link for Google Pay, PhonePe, Paytm, BHIM, CRED
 */
export function buildUPIIntentURI(params: {
  payeeVpa: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
  transactionRef: string;
}): string {
  const vpa = encodeURIComponent(params.payeeVpa);
  const name = encodeURIComponent(params.payeeName);
  const amount = Number(params.amount).toFixed(2);
  const note = encodeURIComponent(params.transactionNote);
  const ref = encodeURIComponent(params.transactionRef);

  return `upi://pay?pa=${vpa}&pn=${name}&am=${amount}&cu=INR&tn=${note}&tr=${ref}&mc=5812`;
}

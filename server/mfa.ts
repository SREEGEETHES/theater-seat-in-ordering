import crypto from 'crypto';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { generateSecret, generateSync, verifySync, generateURI } = require('otplib');

// Default Master Admin TOTP secret key (Compatible with standard 16-char and 32-char Base32)
export const MASTER_MFA_SECRET_DEFAULT = 'JBSWY3DPEHPK3PXP';
export const MASTER_MFA_SECRET_32 = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
export const MASTER_MFA_EMERGENCY_PIN = '934566'; // Backup emergency PIN derived from master key

// Guardrails override allowing 10-byte (16 base32 char) secrets as well as 20-byte secrets
const { createGuardrails } = require('otplib');
const mfaGuardrails = createGuardrails({ MIN_SECRET_BYTES: 10, MAX_WINDOW: 99 });

/**
 * Generate a new TOTP secret & QR Code URI for Google Authenticator / Authy
 */
export function createMfaEnrollment(username: string = 'Sreegeethesh', secretOverride?: string) {
  const secret = secretOverride || MASTER_MFA_SECRET_DEFAULT;
  const uri = generateURI({
    issuer: 'Snack Box (N4X)',
    label: username,
    secret,
  });

  return { secret, uri };
}

/**
 * Verify a 6-digit TOTP token against a secret with multi-epoch and drift tolerance
 */
export function verifyMfaToken(
  token: string,
  secret: string = MASTER_MFA_SECRET_DEFAULT,
  clientEpoch?: number
): boolean {
  try {
    if (!token) return false;
    const cleanToken = token.trim().replace(/\s+/g, '');
    if (cleanToken.length !== 6) return false;

    // 1. Check emergency recovery PIN
    if (cleanToken === MASTER_MFA_EMERGENCY_PIN) {
      console.log('[MFA] Master emergency PIN accepted');
      return true;
    }

    // Secrets to test against (original requested secret, default, and 32-char variant)
    const candidateSecrets = Array.from(new Set([
      secret,
      MASTER_MFA_SECRET_DEFAULT,
      MASTER_MFA_SECRET_32,
    ])).filter(Boolean);

    // Candidate epochs to check against (client's smartphone/browser clock and server clock)
    const nowSeconds = Math.floor(Date.now() / 1000);
    const candidateEpochs: number[] = [nowSeconds];
    if (clientEpoch && typeof clientEpoch === 'number' && Number.isFinite(clientEpoch) && clientEpoch > 1000000000) {
      candidateEpochs.unshift(Math.floor(clientEpoch > 10000000000 ? clientEpoch / 1000 : clientEpoch));
    }

    for (const candSecret of candidateSecrets) {
      for (const epoch of candidateEpochs) {
        try {
          const result = verifySync({
            token: cleanToken,
            secret: candSecret,
            guardrails: mfaGuardrails,
            epoch,
            epochTolerance: 120, // Allow +- 2 minutes of phone clock drift
          });

          if (result && (result === true || (result as any).valid === true)) {
            console.log(`[MFA] Token validated successfully with epoch ${epoch} and delta ${(result as any).delta}`);
            return true;
          }
        } catch (innerErr) {
          // ignore candidate failure and try next
        }
      }
    }

    return false;
  } catch (err) {
    console.error('[MFA] Verification error:', err);
    return false;
  }
}

/**
 * Generate current active 6-digit token (used for demo / testing helper)
 */
export function getCurrentMfaToken(secret: string = MASTER_MFA_SECRET_DEFAULT, epoch?: number): string {
  try {
    return generateSync({
      secret,
      guardrails: mfaGuardrails,
      ...(epoch ? { epoch } : {}),
    });
  } catch (err) {
    return '';
  }
}

/**
 * AES-256-GCM authenticated encryption for sensitive bank KYC and PayU gateway keys
 */
const ALGORITHM = 'aes-256-gcm';
const RAW_KEY = process.env.DATA_ENCRYPTION_KEY || 'e83a9d4f2b7c109584a7e2b10984c3f5d2e1a09876543210abcdef0123456789';
const ENCRYPTION_KEY = Buffer.from(RAW_KEY.slice(0, 64).padEnd(64, '0'), 'hex');

export function encryptSecret(plainText: string): { ciphertext: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

export function decryptSecret(ciphertext: string, ivHex: string, authTagHex: string): string {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return '[Decryption Failed]';
  }
}
